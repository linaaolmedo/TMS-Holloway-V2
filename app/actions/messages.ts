'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function sendMessage(data: {
  recipient_id: string
  load_id?: number
  message: string
}) {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Insert the message
    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        sender_id: user.id,
        recipient_id: data.recipient_id,
        load_id: data.load_id || null,
        message: data.message,
      })
      .select()
      .single()

    if (error) {
      console.error('Error sending message:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/driver/messages')
    revalidatePath('/dashboard')
    return { success: true, data: message }
  } catch (error) {
    console.error('Error in sendMessage:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

export async function getMessages(otherUserId?: string) {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    let query = supabase
      .from('messages')
      .select(`
        *,
        sender:users!messages_sender_id_fkey(id, email, role),
        recipient:users!messages_recipient_id_fkey(id, email, role),
        load:loads(id, load_number)
      `)
      .order('created_at', { ascending: true })

    // If otherUserId is provided, get conversation with that user
    if (otherUserId) {
      query = query.or(`and(sender_id.eq.${user.id},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${user.id})`)
    } else {
      // Otherwise get all messages where user is sender or recipient
      query = query.or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
    }

    const { data: messages, error } = await query

    if (error) {
      console.error('Error fetching messages:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data: messages }
  } catch (error) {
    console.error('Error in getMessages:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

export async function markMessagesAsRead(senderId: string) {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Mark all messages from senderId to current user as read
    const { error } = await supabase
      .from('messages')
      .update({ read: true })
      .eq('sender_id', senderId)
      .eq('recipient_id', user.id)
      .eq('read', false)

    if (error) {
      console.error('Error marking messages as read:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/driver/messages')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    console.error('Error in markMessagesAsRead:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

export async function getUnreadMessageCount() {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated', count: 0 }
    }

    const { count, error } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', user.id)
      .eq('read', false)

    if (error) {
      console.error('Error getting unread count:', error)
      return { success: false, error: error.message, count: 0 }
    }

    return { success: true, count: count || 0 }
  } catch (error) {
    console.error('Error in getUnreadMessageCount:', error)
    return { success: false, error: 'An unexpected error occurred', count: 0 }
  }
}

