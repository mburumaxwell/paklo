import { type NextRequest, NextResponse, type ProxyConfig } from 'next/server';

import { auth } from '@/lib/auth';

export async function proxy(request: NextRequest) {
  const headers = new Headers(request.headers);
  const session = await auth.api.getSession({ headers });
  const { nextUrl: url } = request;
  const { pathname } = url;

  if (!session) {
    const loginUrl = new URL('/login', url);
    loginUrl.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config: ProxyConfig = {
  matcher: [
    { source: '/dashboard/:path*' }, // Match all /dashboard routes
  ],
};
