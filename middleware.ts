import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Protected routes
  const protectedRoutes = ['/dashboard', '/customer', '/carrier', '/driver']
  const isProtectedRoute = protectedRoutes.some(route => request.nextUrl.pathname.startsWith(route))

  // Check for Supabase auth token in cookies
  const authToken = request.cookies.get('sb-access-token') || 
                    request.cookies.get('supabase-auth-token')

  // If accessing protected route without authentication token, redirect to home
  if (isProtectedRoute && !authToken) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

