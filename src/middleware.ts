/**
 * cocoro — Auth Middleware
 * 未認証ユーザーを/authにリダイレクト
 * /auth と / と public assets はスキップ
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public paths: skip auth check
  const publicPaths = ['/', '/auth', '/api/'];
  if (publicPaths.some(p => pathname === p || pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Static assets: skip
  if (pathname.startsWith('/_next') || pathname.includes('.')) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response = NextResponse.next({ request });
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // If not authenticated and trying to access protected routes, redirect
  if (!user && (pathname.startsWith('/lobby') || pathname.startsWith('/space') || pathname.startsWith('/settings'))) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth';
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
