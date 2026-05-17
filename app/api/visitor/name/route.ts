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

  const body = (await req.json().catch(() => ({}))) as {
    name?: string;
    email?: string | null;
    phone?: string | null;
  };
  const name = (body.name ?? '').trim();
  const email = (body.email ?? '').trim();
  const phone = (body.phone ?? '').trim();
  if (!name) {
    return NextResponse.json({ error: 'Name is required.' }, { status: 400 });
  }
  if (!email && !phone) {
    return NextResponse.json(
      { error: 'Provide an email or a phone number.' },
      { status: 400 },
    );
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'That email looks invalid.' }, { status: 400 });
  }
  if (phone && phone.replace(/[^\d]/g, '').length < 6) {
    return NextResponse.json({ error: 'That phone looks too short.' }, { status: 400 });
  }

  await updateVisitorName(session.vid, {
    name,
    email: email || null,
    phone: phone || null,
  });
  return NextResponse.json({ ok: true });
}
