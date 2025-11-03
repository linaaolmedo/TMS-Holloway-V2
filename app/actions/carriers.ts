'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addCarrier(data: {
  name: string
  mc_number: string
  number_of_trucks: string
  contact_person: string
  phone: string
  email: string
  equipment_types: string[]
  do_not_use: boolean
}) {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Insert the carrier
    const { data: carrier, error } = await supabase
      .from('companies')
      .insert({
        name: data.name,
        type: 'carrier',
        mc_number: data.mc_number || null,
        contact_person: data.contact_person || null,
        phone: data.phone || null,
        email: data.email || null,
        equipment_types: data.equipment_types.length > 0 ? data.equipment_types : null,
        number_of_trucks: data.number_of_trucks ? parseInt(data.number_of_trucks) : null,
        do_not_use: data.do_not_use,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating carrier:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/dashboard/carriers')
    return { success: true, data: carrier }
  } catch (error) {
    console.error('Error in addCarrier:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

export async function acceptBid(loadId: number, bidId: number, carrierId: string, bidAmount: number) {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Update the bid status to accepted
    const { error: bidError } = await supabase
      .from('bids')
      .update({ status: 'accepted' })
      .eq('id', bidId)

    if (bidError) {
      console.error('Error updating bid:', bidError)
      return { success: false, error: bidError.message }
    }

    // Assign carrier to load and set carrier_rate
    const { error: loadError } = await supabase
      .from('loads')
      .update({
        carrier_id: carrierId,
        carrier_rate: bidAmount,
        rate_confirmed: false, // Carrier needs to confirm
      })
      .eq('id', loadId)

    if (loadError) {
      console.error('Error assigning carrier to load:', loadError)
      return { success: false, error: loadError.message }
    }

    // Reject all other pending bids for this load
    await supabase
      .from('bids')
      .update({ status: 'rejected' })
      .eq('load_id', loadId)
      .neq('id', bidId)
      .eq('status', 'pending')

    revalidatePath('/dashboard/loads')
    revalidatePath('/carrier/load-board')
    return { success: true }
  } catch (error) {
    console.error('Error in acceptBid:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

export async function rejectBid(bidId: number) {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Update the bid status to rejected
    const { error } = await supabase
      .from('bids')
      .update({ status: 'rejected' })
      .eq('id', bidId)

    if (error) {
      console.error('Error rejecting bid:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/dashboard/loads')
    return { success: true }
  } catch (error) {
    console.error('Error in rejectBid:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

