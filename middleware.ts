import { type NextRequest, NextResponse } from 'next/server';
import { locales, defaultLocale } from './lib/i18n/config';
import { updateSession } from './lib/supabase/middleware';

function localeRedirect(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hasLocale = locales.some(
    (l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`),
  );
  if (hasLocale) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = `/${defaultLocale}${pathname === '/' ? '' : pathname}`;
  return NextResponse.redirect(url);
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith('/admin')) {
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

  if (pathname.startsWith('/api')) return NextResponse.next();

  return localeRedirect(req);
}

export const config = {
  matcher: ['/((?!_next|_vercel|.*\\..*).*)'],
};
