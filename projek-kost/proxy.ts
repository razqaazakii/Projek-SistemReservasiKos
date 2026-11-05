import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const cookieSesi = request.cookies.get('sesi');

  if (!cookieSesi || !cookieSesi.value || cookieSesi.value.trim() === '') {
    const loginUrl = new URL('/masuk', request.url);
    loginUrl.searchParams.set('redirect', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/katalog/tambah', '/katalog/:path*'],
};
