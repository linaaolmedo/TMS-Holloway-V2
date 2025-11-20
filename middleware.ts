import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

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

  // Refreshing the auth token
  // This will handle the refresh token automatically
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Check for impersonation session
  const impersonationSessionId = request.cookies.get('impersonation_session_id')?.value
  let impersonationContext: any = null

  if (impersonationSessionId && user) {
    // Validate impersonation session
    const { data: session } = await supabase
      .from('impersonation_logs')
      .select(`
        id,
        admin_user_id,
        target_user_id,
        target:users!impersonation_logs_target_user_id_fkey(id, role, name, email)
      `)
      .eq('id', impersonationSessionId)
      .eq('admin_user_id', user.id)
      .is('ended_at', null)
      .single()

    if (session) {
      const targetUser = Array.isArray(session.target) ? session.target[0] : session.target
      impersonationContext = {
        adminUserId: session.admin_user_id,
        targetUserId: session.target_user_id,
        targetRole: targetUser?.role,
      }
    }
  }

  // Protected routes that require authentication
  const protectedPaths = ['/dashboard', '/driver', '/carrier', '/customer', '/admin']
  const isProtectedPath = protectedPaths.some(path => request.nextUrl.pathname.startsWith(path))

  // If trying to access protected route without auth, redirect to login
  if (isProtectedPath && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login/dispatcher'
    return NextResponse.redirect(url)
  }

  // If impersonating, allow access based on target user's role
  if (impersonationContext) {
    const targetRole = impersonationContext.targetRole

    // Allow admin to stay on admin routes even when impersonating
    if (request.nextUrl.pathname.startsWith('/admin')) {
      return supabaseResponse
    }

    // Allow access to routes matching the impersonated user's role
    if (targetRole === 'driver' && !request.nextUrl.pathname.startsWith('/driver')) {
      // Allow, they can navigate
    } else if (targetRole === 'carrier' && !request.nextUrl.pathname.startsWith('/carrier')) {
      // Allow, they can navigate
    } else if (targetRole === 'customer' && !request.nextUrl.pathname.startsWith('/customer')) {
      // Allow, they can navigate
    } else if (
      ['dispatch', 'csr', 'billing', 'executive', 'admin'].includes(targetRole) &&
      !request.nextUrl.pathname.startsWith('/dashboard')
    ) {
      // Allow, they can navigate
    }

    return supabaseResponse
  }

  // Admin routes require admin or executive role (when not impersonating)
  if (request.nextUrl.pathname.startsWith('/admin') && user) {
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!userData || !['admin', 'executive'].includes(userData.role)) {
      // Redirect to appropriate portal based on role
      const url = request.nextUrl.clone()
      if (userData?.role === 'customer') {
        url.pathname = '/customer'
      } else if (userData?.role === 'carrier') {
        url.pathname = '/carrier'
      } else if (userData?.role === 'driver') {
        url.pathname = '/driver'
      } else {
        url.pathname = '/dashboard'
      }
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

