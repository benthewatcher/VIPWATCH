import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from './lib/supabase/middleware';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith('/admin/login') || pathname.startsWith('/admin/auth')) {
    const { res } = await updateSession(req);
    return res;
  }

  const { res, user, supabase } = await updateSession(req);
  if (!user) {
    const url = req.nextUrl.clone();
    url.pathname = '/admin/login';
    return NextResponse.redirect(url);
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile) {
    const url = req.nextUrl.clone();
    url.pathname = '/admin/login';
    url.searchParams.set('error', 'not_authorised');
    return NextResponse.redirect(url);
  }

  return res;
}

export const config = {
  matcher: ['/admin/:path*'],
};
