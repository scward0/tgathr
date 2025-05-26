import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PASSWORD = 'alltogather'

export function middleware(request: NextRequest) {
  // Check if the user has already authenticated
  const isAuthenticated = request.cookies.get('auth')
  
  // If not authenticated and not on the auth page
  if (!isAuthenticated && !request.nextUrl.pathname.startsWith('/auth')) {
    // Redirect to auth page
    return NextResponse.redirect(new URL('/auth', request.url))
  }
  
  return NextResponse.next()
}

// Configure which routes to protect
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - /auth (authentication page)
     * - /api/auth (authentication API)
     * - /_next (Next.js internals)
     * - /favicon.ico, /sitemap.xml (static files)
     */
    '/((?!auth|api/auth|_next|favicon.ico|sitemap.xml).*)',
  ],
} 