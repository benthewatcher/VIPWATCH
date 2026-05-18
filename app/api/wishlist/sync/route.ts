import { NextResponse, type NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { createClient as createSb } from '@supabase/supabase-js';
import { COOKIE_NAME, verifySessionCookie } from '@/lib/auth/invite-session';

// Reconcile a visitor's wishlist_items rows with the canonical list of
// commission_ids the browser has in localStorage. Idempotent — safe to call
// on every change.

export const dynamic = 'force-dynamic';

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createSb(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as { commission_ids?: string[] };
    const ids = (body.commission_ids ?? []).filter(
      (id): id is string => typeof id === 'string' && id.length > 0,
    );

    const c = await cookies();
    const session = await verifySessionCookie(c.get(COOKIE_NAME)?.value);
    if (!session?.vid) {
      // Anonymous — skip silently. Wishlist remains browser-only for them.
      return NextResponse.json({ ok: true, skipped: 'no-visitor' });
    }

    const supabase = serviceClient() as any;

    // Mark missing ids as removed, then upsert the present ones.
    if (ids.length === 0) {
      await supabase
        .from('wishlist_items')
        .update({ removed_at: new Date().toISOString() })
        .eq('visitor_id', session.vid)
        .is('removed_at', null);
    } else {
      await supabase
        .from('wishlist_items')
        .update({ removed_at: new Date().toISOString() })
        .eq('visitor_id', session.vid)
        .is('removed_at', null)
        .not('commission_id', 'in', `(${ids.map((id) => `"${id}"`).join(',')})`);

      const rows = ids.map((commission_id) => ({
        visitor_id: session.vid!,
        commission_id,
        removed_at: null,
      }));
      await supabase
        .from('wishlist_items')
        .upsert(rows, { onConflict: 'visitor_id,commission_id' });
    }

    return NextResponse.json({ ok: true, count: ids.length });
  } catch (e) {
    console.error('[wishlist:sync] unhandled:', e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
