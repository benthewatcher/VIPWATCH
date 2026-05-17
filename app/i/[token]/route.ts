import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAnonClient } from '@/lib/supabase/anon';
import { createSessionCookie, hashIp } from '@/lib/auth/invite-session';

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
  const { token } = await ctx.params;

  if (!token || token.length < 6) {
    return NextResponse.redirect(new URL('/waitlist?reason=missing', req.url));
  }

  // Anon client can read the invites table only with admin RLS, so we use a
  // server-side helper that runs with the cookie session. For invite lookup
  // we need to bypass RLS — use the service role client.
  const supabase = (await getServiceClient()) as any;

  const { data: invite, error } = await supabase
    .from('invites')
    .select('id, is_revoked, expires_at, max_uses, used_count, label')
    .eq('token', token)
    .maybeSingle();

  if (error || !invite) {
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

  // Log the use (non-blocking conceptually, but await so it's persisted).
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '';
  const ua = req.headers.get('user-agent') ?? '';
  await supabase.from('invite_uses').insert({
    invite_id: inv.id,
    ip_hash: ip ? await hashIp(ip) : null,
    user_agent: ua.slice(0, 500),
  });

  // Bump used_count atomically via SQL increment.
  await supabase.rpc('increment_invite_used', { _invite_id: inv.id }).catch(async () => {
    // Fallback if RPC isn't installed: do a non-atomic update.
    await supabase
      .from('invites')
      .update({ used_count: inv.used_count + 1 })
      .eq('id', inv.id);
  });

  // Set the cookie and bounce them to the home page.
  const cookie = await createSessionCookie(inv.id);
  const res = NextResponse.redirect(new URL('/en', req.url));
  res.cookies.set(cookie);
  return res;
}

async function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    // Local dev without service key — fall back to anon (will fail RLS).
    return createAnonClient();
  }
  const { createClient: createSb } = await import('@supabase/supabase-js');
  return createSb(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
}

// Touch createClient so the import doesn't get tree-shaken; reserved for future
// use if we want to read session-aware data here.
void createClient;
