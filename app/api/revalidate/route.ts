import { NextResponse, type NextRequest } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const { path, tag } = await req.json();
  if (path) revalidatePath(path, 'page');
  if (tag) revalidateTag(tag, 'max');
  return NextResponse.json({ ok: true });
}
