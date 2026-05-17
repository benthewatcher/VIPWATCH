import { NextResponse } from 'next/server';
import { createClient as createSb } from '@supabase/supabase-js';
import { generateOtpCode, hashOtp } from '@/lib/auth/otp';
import { normalisePhone, sendSms } from '@/lib/sms/twilio';

export const dynamic = 'force-dynamic';
const OTP_TTL_SECONDS = 10 * 60; // 10 minutes
const RATE_LIMIT_SECONDS = 30;   // one OTP per phone per 30s

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createSb(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { phone?: string };
  const phone = body.phone ? normalisePhone(body.phone) : '';
  if (!phone || phone.length < 8) {
    return NextResponse.json({ error: 'Please enter a valid phone number.' }, { status: 400 });
  }

  const supabase = serviceClient() as any;

  // 1. Phone must belong to an active invite (not revoked, not expired).
  const { data: invite } = await supabase
    .from('invites')
    .select('id, is_revoked, expires_at, max_uses, used_count, phone')
    .eq('phone', phone)
    .eq('is_revoked', false)
    .gte('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!invite) {
    // Don't reveal whether the phone is in our list — same response either way.
    return NextResponse.json({ ok: true, hint: 'If your number is recognised you will receive a code shortly.' });
  }

  // 2. Throttle: skip if we sent a code in the last RATE_LIMIT_SECONDS seconds.
  const cutoff = new Date(Date.now() - RATE_LIMIT_SECONDS * 1000).toISOString();
  const { data: recent } = await supabase
    .from('phone_otps')
    .select('id')
    .eq('phone', phone)
    .gte('created_at', cutoff)
    .limit(1);
  if (recent && recent.length > 0) {
    return NextResponse.json({ ok: true, hint: 'A code was already sent — check your messages.' });
  }

  // 3. Generate + persist code (hashed).
  const code = generateOtpCode();
  const code_hash = await hashOtp(phone, code);
  const expires_at = new Date(Date.now() + OTP_TTL_SECONDS * 1000).toISOString();

  const { error: insErr } = await supabase
    .from('phone_otps')
    .insert({ phone, code_hash, invite_id: invite.id, expires_at });
  if (insErr) {
    return NextResponse.json({ error: 'Could not generate a code. Please try again.' }, { status: 500 });
  }

  // 4. Send via Twilio.
  const result = await sendSms(phone, `Your VIP WATCH access code: ${code}\nValid for 10 minutes.`);
  if (!result.ok) {
    // Best-effort: log on the server, return ok-ish to the client so we don't leak provider state.
    console.error('[otp:request] SMS failed:', result.error);
    return NextResponse.json({ ok: true, hint: 'If your number is recognised you will receive a code shortly.' });
  }

  return NextResponse.json({ ok: true });
}
