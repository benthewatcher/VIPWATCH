import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient as createSb } from '@supabase/supabase-js';
import { COOKIE_NAME, verifySessionCookie } from '@/lib/auth/invite-session';

export const dynamic = 'force-dynamic';

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createSb(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const session = await verifySessionCookie(cookieStore.get(COOKIE_NAME)?.value);
  if (!session?.vid) {
    return NextResponse.json({ error: 'No session' }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as { id?: string };
  if (!body.id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const sb = serviceClient() as any;
  await sb
    .from('visitor_notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', body.id)
    .eq('visitor_id', session.vid); // only allow dismissing your own notifications

  return NextResponse.json({ ok: true });
}
