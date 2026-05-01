import { type NextRequest, NextResponse } from 'next/server';
import { locales, defaultLocale } from './lib/i18n/config';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith('/api')) return NextResponse.next();

  if (pathname.startsWith('/admin')) {
    const isPublic =
      pathname.startsWith('/admin/login') || pathname.startsWith('/admin/auth');
    if (isPublic) return NextResponse.next();

    const hasSession = req.cookies
      .getAll()
      .some((c) => c.name.startsWith('sb-') && c.value);
    if (!hasSession) {
      const url = req.nextUrl.clone();
      url.pathname = '/admin/login';
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  const hasLocale = locales.some(
    (l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`),
  );
  if (hasLocale) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = `/${defaultLocale}${pathname === '/' ? '' : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/((?!_next|_vercel|.*\\..*).*)'],
};
