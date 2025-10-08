import { NextResponse, type NextRequest } from 'next/server'
import { createMiddlewareClient } from '@/lib/supabase/middleware'

// Routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/search',
  '/source',
  '/chat',
  '/analytics',
  '/synthesis',
  '/collections',
  '/add',
  '/profile',
  '/settings',
  '/graph',
  '/workspaces',
  '/research-questions',
  '/timeline',
  '/methodology',
  '/literature-review',
  '/import',
  '/publishing',
  '/onboarding',
  '/discover'
]

// Routes that should redirect to dashboard if authenticated
const authRoutes = ['/login', '/signup']

// Public routes that don't require authentication
const publicRoutes = ['/auth/forgot-password', '/auth/reset-password', '/auth/callback']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Create Supabase client
  const { supabase, response } = createMiddlewareClient(request)

  // Get session
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Check if route is protected
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  )

  // Check if route is auth route
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route))

  // Check if route is public
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route))

  // Allow public routes regardless of auth status
  if (isPublicRoute) {
    return response
  }

  // Redirect to login if accessing protected route without session
  if (isProtectedRoute && !session) {
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Redirect to dashboard if accessing auth route with session
  if (isAuthRoute && session) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public directory)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
