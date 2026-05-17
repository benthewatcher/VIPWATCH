import { NextResponse } from 'next/server';
import { createClient as createSb } from '@supabase/supabase-js';
import { hashOtp } from '@/lib/auth/otp';
import { normalisePhone } from '@/lib/sms/twilio';
import { createSessionCookie, hashIp } from '@/lib/auth/invite-session';

export const dynamic = 'force-dynamic';
const MAX_ATTEMPTS = 5;

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createSb(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function POST(req: Request) {
  try {
    return await handle(req);
  } catch (e) {
    console.error('[otp:verify] unhandled error:', e);
    return NextResponse.json({ error: 'Something went wrong. Try again.' }, { status: 500 });
  }
}

async function handle(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { phone?: string; code?: string };
  const phone = body.phone ? normalisePhone(body.phone) : '';
  // Strip ALL non-digit characters from the code — iOS / Android often
  // auto-fill with whitespace or a leading "VIP WATCH:" label.
  const code = (body.code ?? '').replace(/\D/g, '').slice(0, 6);
  if (!phone || !/^\d{6}$/.test(code)) {
    console.warn('[otp:verify] invalid input', { phoneLen: phone.length, codeLen: code.length });
    return NextResponse.json({ error: 'Enter the 6-digit code from your SMS.' }, { status: 400 });
  }

  const supabase = serviceClient() as any;

  const { data: otp, error: otpErr } = await supabase
    .from('phone_otps')
    .select('id, code_hash, invite_id, expires_at, attempts, consumed_at')
    .eq('phone', phone)
    .is('consumed_at', null)
    .gte('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (otpErr) {
    console.error('[otp:verify] otp lookup error:', otpErr.message);
    return NextResponse.json({ error: 'Could not verify code.' }, { status: 500 });
  }
  if (!otp) {
    return NextResponse.json({ error: 'Code expired or not found. Request a new one.' }, { status: 400 });
  }
  if (otp.attempts >= MAX_ATTEMPTS) {
    return NextResponse.json({ error: 'Too many attempts. Request a new code.' }, { status: 429 });
  }

  const expected = await hashOtp(phone, code);
  const matches = constantEq(otp.code_hash, expected);

  if (!matches) {
    await supabase.from('phone_otps').update({ attempts: otp.attempts + 1 }).eq('id', otp.id);
    return NextResponse.json({ error: 'Incorrect code.' }, { status: 400 });
  }

  await supabase.from('phone_otps').update({ consumed_at: new Date().toISOString() }).eq('id', otp.id);

  if (!otp.invite_id) {
    return NextResponse.json(
      { error: 'This number is no longer associated with an active invite.' },
      { status: 400 },
    );
  }
  const { data: invite, error: invErr } = await supabase
    .from('invites')
    .select('id, is_revoked, expires_at, max_uses, used_count')
    .eq('id', otp.invite_id)
    .maybeSingle();
  if (invErr) {
    console.error('[otp:verify] invite lookup error:', invErr.message);
    return NextResponse.json({ error: 'Could not verify invite.' }, { status: 500 });
  }
  if (!invite || invite.is_revoked || new Date(invite.expires_at).getTime() < Date.now()) {
    return NextResponse.json({ error: 'This invite has been revoked or expired.' }, { status: 403 });
  }
  if (typeof invite.max_uses === 'number' && invite.used_count >= invite.max_uses) {
    return NextResponse.json({ error: 'This invite has reached its use limit.' }, { status: 403 });
  }

  // Log the re-use.
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '';
  const ua = req.headers.get('user-agent') ?? '';
  const { error: logErr } = await supabase.from('invite_uses').insert({
    invite_id: invite.id,
    ip_hash: ip ? await hashIp(ip) : null,
    user_agent: ua.slice(0, 500),
  });
  if (logErr) console.warn('[otp:verify] invite_uses insert failed (non-fatal):', logErr.message);

  // Bump used_count. Try RPC first; fall back to direct update on error.
  const rpc = await supabase.rpc('increment_invite_used', { _invite_id: invite.id });
  if (rpc.error) {
    const { error: updErr } = await supabase
      .from('invites')
      .update({ used_count: invite.used_count + 1 })
      .eq('id', invite.id);
    if (updErr) console.warn('[otp:verify] used_count update failed:', updErr.message);
  }

  const cookie = await createSessionCookie(invite.id);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(cookie);
  return res;
}

function constantEq(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}
