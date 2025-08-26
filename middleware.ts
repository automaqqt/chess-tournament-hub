import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose'; // <-- Use jwtVerify instead of verify

const JWT_SECRET = process.env.JWT_SECRET!;
const key = new TextEncoder().encode(JWT_SECRET);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect /admin and /api/export routes
  //if (pathname.startsWith('/admin') || pathname.startsWith('/api/export')) {
    const token = request.cookies.get('auth_token')?.value;
    console.log(token)
    if (!token) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }

    try {
      // Use jwtVerify which is compatible with the Edge Runtime
      await jwtVerify(token, key); 
      return NextResponse.next();
    } catch (err) {
      console.error('JWT verification failed:', err);
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
  //}

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/export/:path*','/' //remove late
],
};