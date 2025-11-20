import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { startImpersonation } from '@/app/actions/admin'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { targetUserId, reason } = body

    if (!targetUserId) {
      return NextResponse.json(
        { success: false, error: 'Target user ID is required' },
        { status: 400 }
      )
    }

    // Start the impersonation session
    const result = await startImpersonation(targetUserId, reason)

    if (!result.success) {
      return NextResponse.json(result, { status: 400 })
    }

    if (!('data' in result)) {
      return NextResponse.json(
        { success: false, error: 'No data returned from impersonation' },
        { status: 500 }
      )
    }

    // Set the impersonation cookie
    const cookieStore = await cookies()
    cookieStore.set('impersonation_session_id', result.data.sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in start impersonation API:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to start impersonation' },
      { status: 500 }
    )
  }
}

