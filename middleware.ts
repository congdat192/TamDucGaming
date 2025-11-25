import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Force no-cache for leaderboard pages AND API
  if (pathname.startsWith('/leaderboard') || pathname.startsWith('/api/leaderboard')) {
    const response = NextResponse.next()

    // Set aggressive no-cache headers
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0')
    response.headers.set('CDN-Cache-Control', 'no-store')
    response.headers.set('Vercel-CDN-Cache-Control', 'no-store')
    response.headers.set('Surrogate-Control', 'no-store')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')

    return response
  }

  // Protect Admin Routes
  if (pathname.startsWith('/admin')) {
    // Allow access to login page
    if (pathname === '/admin') {
      return NextResponse.next()
    }

    // Check for admin token
    const adminToken = request.cookies.get('admin-token')?.value

    if (!adminToken) {
      return NextResponse.redirect(new URL('/admin', request.url))
    }

    // Note: We can't verify JWT signature here without edge-compatible library or external service easily
    // But we can check existence. The API routes will do full verification.
    // For better security, we should verify it, but jsonwebtoken might not work in Edge Runtime.
    // If we need strict verification, we can use jose library.
    // For now, existence check + API verification is a good start.
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/leaderboard/:path*',
    '/api/leaderboard/:path*',
    '/admin/:path*'
  ],
}
