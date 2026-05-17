import { NextResponse, type NextRequest } from 'next/server';
import { COOKIE_NAME, verifySessionCookie } from '@/lib/auth/invite-session';

// Public site is invite-only. We gate /en/* (and /ar/* before redirect) on a
// signed session cookie set by tapping a valid /i/<token> link.
//
// Locale rules (still applied):
//   "/"               → "/en"
//   "/ar/anything"    → "/en/anything"

// Paths that stay public even without an invite session.
const PUBLIC_PATHS = new Set<string>([
  '/waitlist',
]);

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.has(pathname)) return true;
  if (pathname.startsWith('/i/')) return true;            // tap-link routes
  if (pathname.startsWith('/admin')) return true;         // admin has its own auth
  if (pathname.startsWith('/api/')) return true;
  if (pathname.startsWith('/_next/')) return true;
  if (pathname === '/robots.txt' || pathname === '/sitemap.xml' || pathname === '/favicon.ico') return true;
  return false;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Locale normalisation.
  if (pathname === '' || pathname === '/') {
    const url = req.nextUrl.clone();
    url.pathname = '/en';
    return NextResponse.redirect(url);
  }
  if (pathname === '/ar' || pathname.startsWith('/ar/')) {
    const url = req.nextUrl.clone();
    url.pathname = pathname.replace(/^\/ar/, '/en') || '/en';
    return NextResponse.redirect(url);
  }

  // Invite gate.
  if (!isPublicPath(pathname)) {
    const session = await verifySessionCookie(req.cookies.get(COOKIE_NAME)?.value);
    if (!session) {
      const url = req.nextUrl.clone();
      url.pathname = '/waitlist';
      url.searchParams.set('from', pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // run on everything except Next internals and static files
    '/((?!_next/|.*\\..*).*)',
  ],
};
