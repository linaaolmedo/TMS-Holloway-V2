import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
            supabaseResponse = NextResponse.next({
              request,
            })
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Protected routes
    const protectedRoutes = ['/dashboard', '/customer', '/carrier', '/driver']
    const isProtectedRoute = protectedRoutes.some(route => request.nextUrl.pathname.startsWith(route))

    // If accessing protected route without authentication
    if (isProtectedRoute && !user) {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }

    // If authenticated, check role-based access
    if (user && isProtectedRoute) {
      try {
        const { data: userData, error } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single()

        if (error) {
          console.error('Error fetching user role:', error)
          // If we can't fetch the role, redirect to home for safety
          return NextResponse.redirect(new URL('/', request.url))
        }

        const userRole = userData?.role

        // Role-based route protection
        if (request.nextUrl.pathname.startsWith('/dashboard')) {
          const internalRoles = ['executive', 'admin', 'billing', 'csr', 'dispatch']
          if (!internalRoles.includes(userRole)) {
            return NextResponse.redirect(new URL('/', request.url))
          }
        }

        if (request.nextUrl.pathname.startsWith('/customer')) {
          if (userRole !== 'customer') {
            return NextResponse.redirect(new URL('/', request.url))
          }
        }

        if (request.nextUrl.pathname.startsWith('/carrier')) {
          if (userRole !== 'carrier') {
            return NextResponse.redirect(new URL('/', request.url))
          }
        }

        if (request.nextUrl.pathname.startsWith('/driver')) {
          if (userRole !== 'driver') {
            return NextResponse.redirect(new URL('/', request.url))
          }
        }
      } catch (dbError) {
        console.error('Database query error in middleware:', dbError)
        // If database query fails, allow the request to continue
        // but log the error for debugging
        return supabaseResponse
      }
    }

    return supabaseResponse
  } catch (error) {
    console.error('Middleware error:', error)
    // If middleware fails, allow the request through to prevent 404
    return NextResponse.next({
      request,
    })
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

