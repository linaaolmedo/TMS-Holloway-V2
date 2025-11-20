import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

export interface ImpersonationContext {
  isImpersonating: boolean
  adminUserId?: string
  targetUserId?: string
  targetUserName?: string
  targetUserRole?: string
  sessionId?: string
}

/**
 * Gets the current impersonation context from cookies and database
 * Used by server actions and components to determine if in impersonation mode
 */
export async function getImpersonationContext(): Promise<ImpersonationContext> {
  try {
    const cookieStore = await cookies()
    const sessionId = cookieStore.get('impersonation_session_id')?.value

    if (!sessionId) {
      return { isImpersonating: false }
    }

    const supabase = await createClient()
    
    // Fetch active impersonation session
    const { data: session, error } = await supabase
      .from('impersonation_logs')
      .select(`
        id,
        admin_user_id,
        target_user_id,
        target:users!impersonation_logs_target_user_id_fkey(name, role, email)
      `)
      .eq('id', sessionId)
      .is('ended_at', null)
      .single()

    if (error || !session) {
      // Session not found or ended, clear cookie
      cookieStore.delete('impersonation_session_id')
      return { isImpersonating: false }
    }

    const targetUser = Array.isArray(session.target) ? session.target[0] : session.target
    
    return {
      isImpersonating: true,
      adminUserId: session.admin_user_id,
      targetUserId: session.target_user_id,
      targetUserName: targetUser?.name || targetUser?.email || 'Unknown User',
      targetUserRole: targetUser?.role || 'unknown',
      sessionId: session.id,
    }
  } catch (error) {
    console.error('Error getting impersonation context:', error)
    return { isImpersonating: false }
  }
}

/**
 * Simple boolean check if currently impersonating
 */
export async function isImpersonating(): Promise<boolean> {
  const context = await getImpersonationContext()
  return context.isImpersonating
}

