import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const user = req.auth?.user as { role?: string } | undefined;

  // Admin routes require admin role
  if (pathname.startsWith('/admin')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login?redirect=' + encodeURIComponent(pathname), req.url));
    }
    if (user.role !== 'admin') {
      return NextResponse.redirect(new URL('/', req.url));
    }
  }

  // Cart requires auth
  if (pathname.startsWith('/panier') && !user) {
    return NextResponse.redirect(new URL('/login?redirect=/panier', req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/admin/:path*', '/panier/:path*'],
};
