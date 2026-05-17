import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient as createSb } from '@supabase/supabase-js';
import { COOKIE_NAME, verifySessionCookie, generateInviteToken } from '@/lib/auth/invite-session';

// Create OR update a shared wishlist. The client passes a `token` if it
// already has one (saved in localStorage). With no token we mint a new one.

export const dynamic = 'force-dynamic';

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createSb(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

type Input = {
  token?: string | null;
  commission_ids?: string[];
  title?: string | null;
  message?: string | null;
  sharer_name?: string | null;
  sharer_email?: string | null;
};

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Input;
  const ids = (body.commission_ids ?? []).filter((id): id is string => typeof id === 'string' && id.length > 0);

  if (ids.length === 0) {
    return NextResponse.json({ error: 'Add at least one watch before sharing.' }, { status: 400 });
  }

  // Pull invite_id from the visitor's session cookie so we can attribute.
  let inviteId: string | null = null;
  try {
    const c = await cookies();
    const session = await verifySessionCookie(c.get(COOKIE_NAME)?.value);
    if (session?.iid) inviteId = session.iid;
  } catch {
    /* never block sharing on cookie weirdness */
  }

  const supabase = serviceClient() as any;
  const payload = {
    title: body.title?.trim() || null,
    message: body.message?.trim() || null,
    sharer_name: body.sharer_name?.trim() || null,
    sharer_email: body.sharer_email?.trim() || null,
    commission_ids: ids,
    invite_id: inviteId,
    updated_at: new Date().toISOString(),
  };

  // Update path — client supplied a token they already own.
  if (body.token) {
    const { data, error } = await supabase
      .from('shared_wishlists')
      .update(payload)
      .eq('token', body.token)
      .select('token')
      .maybeSingle();
    if (!error && data) {
      return NextResponse.json({ ok: true, token: data.token });
    }
    // If the token wasn't found, fall through and create a new one.
  }

  // Create path — generate a fresh token. Retry up to 6× on the (extremely
  // unlikely) collision.
  for (let i = 0; i < 6; i++) {
    const token = generateInviteToken(); // reuses the same alphabet/format
    const { data, error } = await supabase
      .from('shared_wishlists')
      .insert({ ...payload, token })
      .select('token')
      .single();
    if (!error && data) {
      return NextResponse.json({ ok: true, token: data.token });
    }
    if (error && !/duplicate key/i.test(error.message)) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }
  return NextResponse.json({ error: 'Could not generate a unique link. Try again.' }, { status: 500 });
}
