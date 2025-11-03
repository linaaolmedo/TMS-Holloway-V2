'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createNotification(data: {
  recipientId: string
  type: 'bid' | 'shipment_request' | 'driver_activity' | 'status_update' | 'general'
  title: string
  message: string
  link?: string
  relatedEntityType?: 'bid' | 'load' | 'carrier' | 'customer' | 'driver'
  relatedEntityId?: number
  metadata?: Record<string, any>
}) {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('notifications')
      .insert({
        recipient_id: data.recipientId,
        type: data.type,
        title: data.title,
        message: data.message,
        link: data.link || null,
        related_entity_type: data.relatedEntityType || null,
        related_entity_id: data.relatedEntityId || null,
        metadata: data.metadata || null,
      })

    if (error) {
      console.error('Error creating notification:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error in createNotification:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

export async function getNotifications(limit = 10) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Not authenticated', data: [] }
    }

    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('recipient_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching notifications:', error)
      return { success: false, error: error.message, data: [] }
    }

    return { success: true, data: notifications || [] }
  } catch (error) {
    console.error('Error in getNotifications:', error)
    return { success: false, error: 'An unexpected error occurred', data: [] }
  }
}

export async function getUnreadCount() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, count: 0 }
    }

    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', user.id)
      .eq('read', false)

    if (error) {
      console.error('Error fetching unread count:', error)
      return { success: false, count: 0 }
    }

    return { success: true, count: count || 0 }
  } catch (error) {
    console.error('Error in getUnreadCount:', error)
    return { success: false, count: 0 }
  }
}

export async function markAsRead(notificationId: number) {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)

    if (error) {
      console.error('Error marking notification as read:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    console.error('Error in markAsRead:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

export async function markAllAsRead() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('recipient_id', user.id)
      .eq('read', false)

    if (error) {
      console.error('Error marking all as read:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    console.error('Error in markAllAsRead:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

// Helper function to notify all dispatchers
export async function notifyDispatchers(data: {
  type: 'bid' | 'shipment_request' | 'driver_activity' | 'status_update'
  title: string
  message: string
  link?: string
  relatedEntityType?: 'bid' | 'load' | 'carrier' | 'customer' | 'driver'
  relatedEntityId?: number
  metadata?: Record<string, any>
}) {
  try {
    const supabase = await createClient()

    // Get all dispatchers
    const { data: dispatchers } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'dispatch')

    if (!dispatchers || dispatchers.length === 0) {
      return { success: true, message: 'No dispatchers to notify' }
    }

    // Create notification for each dispatcher
    const notifications = dispatchers.map(dispatcher => ({
      recipient_id: dispatcher.id,
      type: data.type,
      title: data.title,
      message: data.message,
      link: data.link || null,
      related_entity_type: data.relatedEntityType || null,
      related_entity_id: data.relatedEntityId || null,
      metadata: data.metadata || null,
    }))

    const { error } = await supabase
      .from('notifications')
      .insert(notifications)

    if (error) {
      console.error('Error notifying dispatchers:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error in notifyDispatchers:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

