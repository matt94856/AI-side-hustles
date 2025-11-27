import { NextRequest, NextResponse } from 'next/server';

const AUTH_ONLY_PATHS = ['/dashboard', '/account', '/certificates'];
const COURSE_PREFIX = '/course/';

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const { pathname, search } = url;

  const hasSessionCookie = Boolean(
    req.cookies.get('sb-access-token') || req.cookies.get('supabase-auth-token')
  );

  const isAuthPath =
    AUTH_ONLY_PATHS.includes(pathname) || pathname.startsWith(COURSE_PREFIX);

  // Logged-out: block auth-only and course pages
  if (isAuthPath && !hasSessionCookie) {
    url.pathname = '/login';
    url.searchParams.set('redirectTo', pathname + search);
    return NextResponse.redirect(url);
  }

  // Logged-in: never stay on the marketing homepage
  if (pathname === '/' && hasSessionCookie) {
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/dashboard', '/account', '/certificates', '/course/:path*'],
};


