import { NextResponse, type NextRequest } from 'next/server';

// Hard force English for the public site.
// - "/"               → "/en"
// - "/ar/anything"    → "/en/anything"
// - everything else (including /en/* and /admin/*) passes through.

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  if (pathname === '/' || pathname === '') {
    const url = req.nextUrl.clone();
    url.pathname = '/en';
    return NextResponse.redirect(url);
  }

  if (pathname === '/ar' || pathname.startsWith('/ar/')) {
    const url = req.nextUrl.clone();
    url.pathname = pathname.replace(/^\/ar/, '/en') || '/en';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // run on everything except Next internals, API routes, and static files
    '/((?!_next/|api/|.*\\..*).*)',
  ],
};
