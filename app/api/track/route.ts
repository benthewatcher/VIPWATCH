import { NextResponse, type NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { createClient as createSb } from '@supabase/supabase-js';
import { COOKIE_NAME, verifySessionCookie } from '@/lib/auth/invite-session';

// Tiny tracking endpoint. Reads the visitor's signed cookie to find their
// visitor_id, then writes a row to visitor_events. Never blocks the page.
//
// POST body: { event_type: string, path?: string, metadata?: object }

export const dynamic = 'force-dynamic';

const ALLOWED_EVENTS = new Set([
  'pageview',
  'wishlist_add',
  'wishlist_remove',
  'share_tap',
  'share_open',
  'enquiry_submit',
  'cta_click',
  'commission_view',
  'collection_view',
]);

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createSb(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      event_type?: string;
      path?: string;
      metadata?: Record<string, unknown>;
    };
    const eventType = (body.event_type ?? '').trim();
    if (!ALLOWED_EVENTS.has(eventType)) {
      return NextResponse.json({ ok: false, error: 'unknown event_type' }, { status: 400 });
    }

    const c = await cookies();
    const session = await verifySessionCookie(c.get(COOKIE_NAME)?.value);
    if (!session?.vid) {
      // Anonymous (no invite session) — skip silently so callers don't have to branch.
      return NextResponse.json({ ok: true, skipped: 'no-visitor' });
    }

    const supabase = serviceClient() as any;
    const { error } = await supabase.from('visitor_events').insert({
      visitor_id: session.vid,
      event_type: eventType,
      path: body.path?.slice(0, 500) ?? null,
      metadata: body.metadata ?? {},
    });
    if (error) {
      console.warn('[track] insert failed:', error.message);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    // Touch last_seen_at so the visitor's freshness is up to date.
    await supabase
      .from('visitors')
      .update({ last_seen_at: new Date().toISOString() })
      .eq('id', session.vid);

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[track] unhandled:', e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
