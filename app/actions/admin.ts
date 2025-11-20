'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Helper function to verify admin access
async function verifyAdminAccess() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!userData || !['admin', 'executive'].includes(userData.role)) {
    return { success: false, error: 'Unauthorized: Admin access required' }
  }

  return { success: true, user, userData }
}

// Helper function to log audit entry
async function logAuditEntry(
  supabase: any,
  entityType: string,
  entityId: number | string,
  action: string,
  userId: string,
  userRole: string,
  metadata?: any,
  impersonatedBy?: string
) {
  await supabase.from('audit_logs').insert({
    entity_type: entityType,
    entity_id: entityId,
    action,
    user_id: userId,
    user_role: userRole,
    impersonated_by: impersonatedBy || null,
    metadata,
  })
}

// Get all users across roles
export async function getSystemUsers(filters?: {
  role?: string
  company_id?: string
  is_active?: boolean
  search?: string
}) {
  const auth = await verifyAdminAccess()
  if (!auth.success) return auth

  try {
    const supabase = await createClient()
    let query = supabase
      .from('users')
      .select(`
        *,
        company:companies(id, name, type)
      `)
      .order('created_at', { ascending: false })

    if (filters?.role) {
      query = query.eq('role', filters.role)
    }
    if (filters?.company_id) {
      query = query.eq('company_id', filters.company_id)
    }
    if (filters?.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active)
    }
    if (filters?.search) {
      query = query.or(`email.ilike.%${filters.search}%,name.ilike.%${filters.search}%`)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching users:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Error in getSystemUsers:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

// Update user role
export async function updateUserRole(userId: string, newRole: string) {
  const auth = await verifyAdminAccess()
  if (!auth.success) return auth

  try {
    const supabase = await createClient()

    // Get current user data
    const { data: currentUser } = await supabase
      .from('users')
      .select('role, email')
      .eq('id', userId)
      .single()

    const { error } = await supabase
      .from('users')
      .update({ role: newRole })
      .eq('id', userId)

    if (error) {
      console.error('Error updating user role:', error)
      return { success: false, error: error.message }
    }

    // Log the change
    await logAuditEntry(
      supabase,
      'user',
      userId,
      'role_changed',
      auth.user!.id,
      auth.userData!.role,
      {
        old_role: currentUser?.role,
        new_role: newRole,
        user_email: currentUser?.email,
      }
    )

    revalidatePath('/admin/users')
    return { success: true }
  } catch (error) {
    console.error('Error in updateUserRole:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

// Deactivate user
export async function toggleUserActive(userId: string, isActive: boolean) {
  const auth = await verifyAdminAccess()
  if (!auth.success) return auth

  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('users')
      .update({ is_active: isActive })
      .eq('id', userId)

    if (error) {
      console.error('Error toggling user active status:', error)
      return { success: false, error: error.message }
    }

    await logAuditEntry(
      supabase,
      'user',
      userId,
      'updated',
      auth.user!.id,
      auth.userData!.role,
      { is_active: isActive }
    )

    revalidatePath('/admin/users')
    return { success: true }
  } catch (error) {
    console.error('Error in toggleUserActive:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

// Get audit logs with filters
export async function getAuditLogs(filters?: {
  entity_type?: string
  action?: string
  user_id?: string
  start_date?: string
  end_date?: string
  limit?: number
  offset?: number
}) {
  const auth = await verifyAdminAccess()
  if (!auth.success) return auth

  try {
    const supabase = await createClient()
    let query = supabase
      .from('audit_logs')
      .select(`
        *,
        user:users!audit_logs_user_id_fkey(email, name, role),
        impersonator:users!audit_logs_impersonated_by_fkey(email, name)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })

    if (filters?.entity_type) {
      query = query.eq('entity_type', filters.entity_type)
    }
    if (filters?.action) {
      query = query.eq('action', filters.action)
    }
    if (filters?.user_id) {
      query = query.eq('user_id', filters.user_id)
    }
    if (filters?.start_date) {
      query = query.gte('created_at', filters.start_date)
    }
    if (filters?.end_date) {
      query = query.lte('created_at', filters.end_date)
    }

    const limit = filters?.limit || 50
    const offset = filters?.offset || 0
    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      console.error('Error fetching audit logs:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data, count }
  } catch (error) {
    console.error('Error in getAuditLogs:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

// Get system analytics
export async function getSystemAnalytics() {
  const auth = await verifyAdminAccess()
  if (!auth.success) return auth

  try {
    const supabase = await createClient()

    // Get user counts by role
    const { data: usersByRole } = await supabase
      .from('users')
      .select('role')
      .eq('is_active', true)

    const roleCounts = usersByRole?.reduce((acc: any, user: any) => {
      acc[user.role] = (acc[user.role] || 0) + 1
      return acc
    }, {})

    // Get company counts
    const { count: shipperCount } = await supabase
      .from('companies')
      .select('*', { count: 'exact', head: true })
      .eq('type', 'shipper')

    const { count: carrierCount } = await supabase
      .from('companies')
      .select('*', { count: 'exact', head: true })
      .eq('type', 'carrier')

    // Get load statistics (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: recentLoads } = await supabase
      .from('loads')
      .select('id, load_number, status, customer_rate, carrier_rate, created_at')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .is('deleted_at', null)

    // Group loads by status with their IDs
    const loadsByStatus = recentLoads?.reduce((acc: any, load: any) => {
      if (!acc[load.status]) {
        acc[load.status] = []
      }
      acc[load.status].push({ id: load.id, load_number: load.load_number })
      return acc
    }, {})

    const loadStats = {
      total: recentLoads?.length || 0,
      by_status: recentLoads?.reduce((acc: any, load: any) => {
        acc[load.status] = (acc[load.status] || 0) + 1
        return acc
      }, {}),
      loads_by_status: loadsByStatus || {},
      total_customer_revenue: recentLoads?.reduce((sum, load) => sum + (parseFloat(load.customer_rate) || 0), 0) || 0,
      total_carrier_cost: recentLoads?.reduce((sum, load) => sum + (parseFloat(load.carrier_rate) || 0), 0) || 0,
    }

    // Get recent admin activities
    const { data: recentActivities } = await supabase
      .from('audit_logs')
      .select(`
        *,
        user:users!audit_logs_user_id_fkey(email, name)
      `)
      .in('action', ['role_changed', 'impersonated', 'bulk_update', 'updated', 'deleted'])
      .order('created_at', { ascending: false })
      .limit(10)

    // Get daily revenue/cost data for charts (last 30 days)
    const dailyData = recentLoads?.reduce((acc: any, load: any) => {
      const date = new Date(load.created_at).toISOString().split('T')[0]
      if (!acc[date]) {
        acc[date] = { date, revenue: 0, cost: 0, loads: 0 }
      }
      acc[date].revenue += parseFloat(load.customer_rate) || 0
      acc[date].cost += parseFloat(load.carrier_rate) || 0
      acc[date].loads += 1
      return acc
    }, {})

    const timeSeriesData = Object.values(dailyData || {}).sort((a: any, b: any) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    )

    // Get user growth data (last 12 months)
    const oneYearAgo = new Date()
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
    
    const { data: allUsers } = await supabase
      .from('users')
      .select('created_at')
      .gte('created_at', oneYearAgo.toISOString())
      .order('created_at', { ascending: true })

    const monthlyUserGrowth = allUsers?.reduce((acc: any, user: any) => {
      const month = new Date(user.created_at).toISOString().substring(0, 7) // YYYY-MM
      acc[month] = (acc[month] || 0) + 1
      return acc
    }, {})

    const userGrowthData = Object.entries(monthlyUserGrowth || {}).map(([month, count]) => ({
      month,
      users: count,
    }))

    return {
      success: true,
      data: {
        users: {
          total: usersByRole?.length || 0,
          by_role: roleCounts,
        },
        companies: {
          shippers: shipperCount || 0,
          carriers: carrierCount || 0,
        },
        loads: loadStats,
        recent_activities: recentActivities || [],
        time_series: timeSeriesData,
        user_growth: userGrowthData,
      },
    }
  } catch (error) {
    console.error('Error in getSystemAnalytics:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

// Get all companies for admin management
export async function getAllCompanies(filters?: {
  type?: string
  search?: string
}) {
  const auth = await verifyAdminAccess()
  if (!auth.success) return auth

  try {
    const supabase = await createClient()
    let query = supabase
      .from('companies')
      .select('*')
      .order('created_at', { ascending: false })

    if (filters?.type) {
      query = query.eq('type', filters.type)
    }
    if (filters?.search) {
      query = query.ilike('name', `%${filters.search}%`)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching companies:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Error in getAllCompanies:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

// Get system settings
export async function getSystemSettings(category?: string) {
  const auth = await verifyAdminAccess()
  if (!auth.success) return auth

  try {
    const supabase = await createClient()
    let query = supabase
      .from('system_settings')
      .select('*')
      .order('category', { ascending: true })

    if (category) {
      query = query.eq('category', category)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching system settings:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Error in getSystemSettings:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

// Update system setting
export async function updateSystemSetting(
  settingKey: string,
  settingValue: any
) {
  const auth = await verifyAdminAccess()
  if (!auth.success) return auth

  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('system_settings')
      .update({
        setting_value: settingValue,
        updated_by: auth.user!.id,
        updated_at: new Date().toISOString(),
      })
      .eq('setting_key', settingKey)

    if (error) {
      console.error('Error updating system setting:', error)
      return { success: false, error: error.message }
    }

    await logAuditEntry(
      supabase,
      'setting',
      settingKey,
      'updated',
      auth.user!.id,
      auth.userData!.role,
      { setting_key: settingKey, new_value: settingValue }
    )

    revalidatePath('/admin/settings')
    return { success: true }
  } catch (error) {
    console.error('Error in updateSystemSetting:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

// Get impersonation logs
export async function getImpersonationLogs(limit = 50) {
  const auth = await verifyAdminAccess()
  if (!auth.success) return auth

  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('impersonation_logs')
      .select(`
        *,
        admin:users!impersonation_logs_admin_user_id_fkey(email, name),
        target:users!impersonation_logs_target_user_id_fkey(email, name, role)
      `)
      .order('started_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching impersonation logs:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Error in getImpersonationLogs:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

// Create new user (admin function)
export async function createUser(data: {
  email: string
  name: string
  role: string
  company_id?: string
  phone?: string
}) {
  const auth = await verifyAdminAccess()
  if (!auth.success) return auth

  try {
    const supabase = await createClient()

    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        email: data.email,
        name: data.name,
        role: data.role,
        company_id: data.company_id || null,
        phone: data.phone || null,
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating user:', error)
      return { success: false, error: error.message }
    }

    await logAuditEntry(
      supabase,
      'user',
      newUser.id,
      'created',
      auth.user!.id,
      auth.userData!.role,
      { user_email: data.email, user_role: data.role }
    )

    revalidatePath('/admin/users')
    return { success: true, data: newUser }
  } catch (error) {
    console.error('Error in createUser:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

// Update user details
export async function updateUser(
  userId: string,
  updates: {
    name?: string
    email?: string
    phone?: string
    company_id?: string
  }
) {
  const auth = await verifyAdminAccess()
  if (!auth.success) return auth

  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)

    if (error) {
      console.error('Error updating user:', error)
      return { success: false, error: error.message }
    }

    await logAuditEntry(
      supabase,
      'user',
      userId,
      'updated',
      auth.user!.id,
      auth.userData!.role,
      { changes: updates }
    )

    revalidatePath('/admin/users')
    return { success: true }
  } catch (error) {
    console.error('Error in updateUser:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

