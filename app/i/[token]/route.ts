import { NextResponse, type NextRequest } from 'next/server';
import { createAnonClient } from '@/lib/supabase/anon';
import { createSessionCookie, hashIp } from '@/lib/auth/invite-session';
import { createVisitor } from '@/lib/auth/visitor';

// Tap-the-link sign-in. Invite tokens live in the `invites` table and
// are validated server-side. Anyone tapping a valid token gets a 60-day
// signed cookie and is dropped on the home page.

export const dynamic = 'force-dynamic';

type Invite = {
  id: string;
  is_revoked: boolean;
  expires_at: string;
  max_uses: number | null;
  used_count: number;
  label: string;
};

export async function GET(req: NextRequest, ctx: { params: Promise<{ token: string }> }) {
  try {
    return await handle(req, ctx);
  } catch (e) {
    // Log the actual error to Vercel function logs so we can diagnose.
    console.error('[invite] unhandled error in /i/[token]:', e);
    return NextResponse.redirect(new URL('/waitlist?reason=invalid', req.url));
  }
}

async function handle(req: NextRequest, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;

  if (!token || token.length < 6) {
    return NextResponse.redirect(new URL('/waitlist?reason=missing', req.url));
  }

  // For invite lookup we need to bypass RLS — use the service-role client when available.
  const supabase = (await getServiceClient()) as any;

  const { data: invite, error } = await supabase
    .from('invites')
    .select('id, is_revoked, expires_at, max_uses, used_count, label')
    .eq('token', token)
    .maybeSingle();

  if (error) {
    console.error('[invite] lookup error:', error.message);
    return NextResponse.redirect(new URL('/waitlist?reason=invalid', req.url));
  }
  if (!invite) {
    return NextResponse.redirect(new URL('/waitlist?reason=invalid', req.url));
  }
  const inv = invite as Invite;

  if (inv.is_revoked) {
    return NextResponse.redirect(new URL('/waitlist?reason=revoked', req.url));
  }
  if (new Date(inv.expires_at).getTime() < Date.now()) {
    return NextResponse.redirect(new URL('/waitlist?reason=expired', req.url));
  }
  if (typeof inv.max_uses === 'number' && inv.used_count >= inv.max_uses) {
    return NextResponse.redirect(new URL('/waitlist?reason=used', req.url));
  }

  // Log the use (best-effort, don't fail the sign-in if logging fails).
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '';
  const ua = req.headers.get('user-agent') ?? '';
  const { error: logErr } = await supabase.from('invite_uses').insert({
    invite_id: inv.id,
    ip_hash: ip ? await hashIp(ip) : null,
    user_agent: ua.slice(0, 500),
  });
  if (logErr) console.warn('[invite] invite_uses insert failed (non-fatal):', logErr.message);

  // Bump used_count. Try RPC first; if it doesn't exist, fall back to plain update.
  const rpc = await supabase.rpc('increment_invite_used', { _invite_id: inv.id });
  if (rpc.error) {
    const { error: updErr } = await supabase
      .from('invites')
      .update({ used_count: inv.used_count + 1 })
      .eq('id', inv.id);
    if (updErr) console.warn('[invite] used_count update failed (non-fatal):', updErr.message);
  }

  // Mint a visitor row so we can capture name later and attribute properly.
  const visitor = await createVisitor({
    inviteId: inv.id,
    referredByName: inv.label,
    ip,
    userAgent: ua,
  });

  // Set the cookie and bounce them to /welcome to capture name.
  const cookie = await createSessionCookie(inv.id, visitor?.id ?? null);
  const dest = visitor?.id ? '/welcome' : '/en';
  const res = NextResponse.redirect(new URL(dest, req.url));
  res.cookies.set(cookie);
  return res;
}

async function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.warn('[invite] SUPABASE_SERVICE_ROLE_KEY not set; falling back to anon (RLS will block).');
    return createAnonClient();
  }
  const { createClient: createSb } = await import('@supabase/supabase-js');
  return createSb(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
}
