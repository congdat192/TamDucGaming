import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Force no-cache for leaderboard pages
  if (pathname.startsWith('/leaderboard')) {
    const response = NextResponse.next()

    // Set aggressive no-cache headers
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0')
    response.headers.set('CDN-Cache-Control', 'no-store')
    response.headers.set('Vercel-CDN-Cache-Control', 'no-store')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')

    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/leaderboard/:path*',
}
