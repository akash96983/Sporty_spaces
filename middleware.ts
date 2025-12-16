import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Auth routes that logged-in users shouldn't access
  const authRoutes = ['/login', '/signup'];

  // Protected routes that require authentication
  const protectedRoutes = ['/my-bookings', '/my-spaces', '/profile'];

  // Get token from cookie
  const token = request.cookies.get('token')?.value || request.cookies.get('token_client')?.value;

  // Check if current route is an auth route
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));

  // Check if current route is protected
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

  // If logged in and trying to access login/signup, redirect to home
  // Commented out to prevent redirect loop if client-side auth check fails
  /* if (isAuthRoute && token) {
    const homeUrl = new URL('/', request.url);
    return NextResponse.redirect(homeUrl);
  } */

  // If trying to access protected route without token, redirect to login
  // If trying to access protected route without token, redirect to login
  // Commented out to rely on client-side protection. Middleware cannot reliably see cross-domain cookies.
  /* if (isProtectedRoute && !token) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  } */

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
