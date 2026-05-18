import { NextResponse, type NextRequest } from 'next/server';
import { createClient as createSb } from '@supabase/supabase-js';
import { createSessionCookie, hashIp } from '@/lib/auth/invite-session';
import { createVisitor } from '@/lib/auth/visitor';

// Admit a wishlist recipient through the SHARER's invite. This is a Route
// Handler (not a Server Component) because we need to set the session cookie,
// which only works from Route Handlers / Server Actions / Middleware.

export const dynamic = 'force-dynamic';

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createSb(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ token: string }> }) {
  try {
    return await handle(req, ctx);
  } catch (e) {
    console.error('[wishlist:admit] unhandled error:', e);
    return NextResponse.redirect(new URL('/waitlist?reason=invalid', req.url));
  }
}

async function handle(req: NextRequest, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  const supabase = serviceClient() as any;

  const { data: shared } = await supabase
    .from('shared_wishlists')
    .select('id, invite_id, sharer_name')
    .eq('token', token)
    .maybeSingle();
  if (!shared) return NextResponse.redirect(new URL('/waitlist?reason=invalid', req.url));

  if (!shared.invite_id) return NextResponse.redirect(new URL('/waitlist?reason=invalid', req.url));

  const { data: invite } = await supabase
    .from('invites')
    .select('id, is_revoked, expires_at, max_uses, used_count, label')
    .eq('id', shared.invite_id)
    .maybeSingle();
  if (!invite) return NextResponse.redirect(new URL('/waitlist?reason=invalid', req.url));
  if (invite.is_revoked) return NextResponse.redirect(new URL('/waitlist?reason=revoked', req.url));
  if (new Date(invite.expires_at).getTime() < Date.now()) {
    return NextResponse.redirect(new URL('/waitlist?reason=expired', req.url));
  }
  if (typeof invite.max_uses === 'number' && invite.used_count >= invite.max_uses) {
    return NextResponse.redirect(new URL('/waitlist?reason=used', req.url));
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '';
  const ua = req.headers.get('user-agent') ?? '';

  const visitor = await createVisitor({
    inviteId: invite.id,
    referredByName: shared.sharer_name ?? invite.label,
    sharedWishlistId: shared.id,
    ip,
    userAgent: ua,
  });

  // Log the tap, linked to both the visitor it produced and the share row.
  await supabase.from('invite_uses').insert({
    invite_id: invite.id,
    visitor_id: visitor?.id ?? null,
    shared_wishlist_id: shared.id,
    ip_hash: ip ? await hashIp(ip) : null,
    user_agent: ua.slice(0, 500),
  });

  // First-touch event for the journey timeline.
  if (visitor?.id) {
    await supabase.from('visitor_events').insert({
      visitor_id: visitor.id,
      event_type: 'share_tap',
      path: `/wishlist/${token}`,
      metadata: { invite_id: invite.id, shared_wishlist_id: shared.id, sharer_name: shared.sharer_name },
    });
  }
  const rpc = await supabase.rpc('increment_invite_used', { _invite_id: invite.id });
  if (rpc.error) {
    await supabase.from('invites').update({ used_count: invite.used_count + 1 }).eq('id', invite.id);
  }

  // Bump the share's view counter (best effort).
  await supabase.rpc('increment_shared_wishlist_view', { _token: token }).catch(() => {});

  const cookie = await createSessionCookie(invite.id, visitor?.id ?? null);
  const nextPath = `/wishlist/${token}`;
  const res = NextResponse.redirect(
    new URL(`/welcome?next=${encodeURIComponent(nextPath)}`, req.url),
  );
  res.cookies.set(cookie);
  return res;
}
