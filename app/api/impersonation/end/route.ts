import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { endImpersonation } from '@/app/actions/admin'

export async function POST() {
  try {
    // End the impersonation session
    const result = await endImpersonation()

    if (!result.success) {
      return NextResponse.json(result, { status: 400 })
    }

    // Clear the impersonation cookie
    const cookieStore = await cookies()
    cookieStore.delete('impersonation_session_id')

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in end impersonation API:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to end impersonation' },
      { status: 500 }
    )
  }
}

