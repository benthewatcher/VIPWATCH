import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
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
  '/signin',
  '/welcome',
]);

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.has(pathname)) return true;
  if (pathname.startsWith('/i/')) return true;            // tap-link routes
  if (pathname.startsWith('/wishlist/')) return true;     // /wishlist/<token> public shares
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

  // Refresh the Supabase auth session on admin routes so Server Components
  // see an unexpired token. Without this, the access token expires after an
  // hour and the admin layout falls back to "no chrome".
  if (pathname.startsWith('/admin')) {
    return await refreshSupabaseSession(req);
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

  // Expose the current pathname to Server Components (layouts can't read it
  // natively). Used by the locale layout to hide the global CTA on pages
  // that already have their own.
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-pathname', pathname);
  return NextResponse.next({ request: { headers: requestHeaders } });
}

async function refreshSupabaseSession(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return NextResponse.next();

  let res = NextResponse.next({ request: req });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return req.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value));
        res = NextResponse.next({ request: req });
        cookiesToSet.forEach(({ name, value, options }) =>
          res.cookies.set(name, value, options),
        );
      },
    },
  });

  // This call refreshes the access token if it's near expiry and writes the
  // new cookies to `res` via the setAll callback above.
  await supabase.auth.getUser();
  return res;
}

export const config = {
  matcher: [
    // run on everything except Next internals and static files
    '/((?!_next/|.*\\..*).*)',
  ],
};
