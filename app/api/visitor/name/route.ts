import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { COOKIE_NAME, verifySessionCookie } from '@/lib/auth/invite-session';
import { updateVisitorName } from '@/lib/auth/visitor';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const session = await verifySessionCookie(cookieStore.get(COOKIE_NAME)?.value);
  if (!session?.vid) {
    return NextResponse.json({ error: 'No active session.' }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as { name?: string; email?: string | null };
  const name = (body.name ?? '').trim();
  const email = (body.email ?? '').trim();
  if (!name) {
    return NextResponse.json({ error: 'Name is required.' }, { status: 400 });
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'A valid email is required.' }, { status: 400 });
  }

  await updateVisitorName(session.vid, { name, email });
  return NextResponse.json({ ok: true });
}
