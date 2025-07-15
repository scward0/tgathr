import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from '@/lib/auth'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Skip middleware for auth pages and API routes
  if (
    pathname.startsWith('/auth') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/debug') ||
    pathname.startsWith('/api/test') ||
    pathname.startsWith('/_next') ||
    pathname.includes('.') // static files
  ) {
    return NextResponse.next()
  }
  
  // Check authentication for protected routes
  let token = request.cookies.get('session-id')?.value
  
  // Also check Authorization header as fallback
  if (!token) {
    const authHeader = request.headers.get('Authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7)
    }
  }
  
  if (!token) {
    return NextResponse.redirect(new URL('/auth', request.url))
  }
  
  // Verify token
  const payload = verifyToken(token)
  if (!payload) {
    // Clear invalid cookie and redirect
    const response = NextResponse.redirect(new URL('/auth', request.url))
    response.cookies.set('session-id', '', { maxAge: 0 })
    return response
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - /auth (authentication page)
     * - /api (all API routes)
     * - /events (event pages - let React handle auth)
     * - /_next (Next.js internals)
     * - Static files (containing dots)
     * - / (home page - let React handle auth)
     */
    '/((?!auth|api|events|_next|.*\\.|$).*)',
  ],
} 