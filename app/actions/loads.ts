'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addLoad(data: {
  customer_id: string
  pickup_location: string
  delivery_location: string
  commodity: string
  weight: string
  weight_unit: string
  equipment_type: string
  pricing_type: string
  carrier_id: string
  driver_id: string
  pickup_time: string
  delivery_time: string
  customer_rate: string
  carrier_rate: string
  comments: string
}) {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Get user info to check if customer is creating the load
    const { data: userData } = await supabase
      .from('users')
      .select('role, company_id')
      .eq('id', user.id)
      .single()

    // Insert the load
    const { data: load, error } = await supabase
      .from('loads')
      .insert({
        status: 'pending_pickup',
        dispatcher_id: userData?.role === 'dispatch' ? user.id : null,
        customer_id: data.customer_id || null,
        carrier_id: data.carrier_id || null,
        driver_id: data.driver_id || null,
        commodity: data.commodity,
        equipment_type: data.equipment_type,
        pricing_type: data.pricing_type,
        weight: data.weight ? parseFloat(data.weight) : null,
        weight_unit: data.weight_unit,
        pickup_location: data.pickup_location,
        delivery_location: data.delivery_location,
        pickup_time: data.pickup_time ? new Date(data.pickup_time).toISOString() : null,
        delivery_time: data.delivery_time ? new Date(data.delivery_time).toISOString() : null,
        customer_rate: data.customer_rate ? parseFloat(data.customer_rate) : null,
        carrier_rate: data.carrier_rate ? parseFloat(data.carrier_rate) : null,
        comments: data.comments || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating load:', error)
      return { success: false, error: error.message }
    }

    // If customer is creating the shipment request, notify dispatchers
    if (userData?.role === 'customer') {
      const { data: customerInfo } = await supabase
        .from('companies')
        .select('name')
        .eq('id', userData.company_id)
        .single()

      const { notifyDispatchers } = await import('./notifications')
      await notifyDispatchers({
        type: 'shipment_request',
        title: 'New Shipment Request',
        message: `${customerInfo?.name || 'A customer'} requested a shipment from ${data.pickup_location} to ${data.delivery_location}`,
        link: `/dashboard/loads`,
        relatedEntityType: 'load',
        relatedEntityId: load.id,
        metadata: {
          customer_id: userData.company_id,
          load_id: load.id,
          pickup_location: data.pickup_location,
          delivery_location: data.delivery_location,
        }
      })
    }

    revalidatePath('/dashboard/loads')
    return { success: true, data: load }
  } catch (error) {
    console.error('Error in addLoad:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

export async function updateLoad(loadId: number, data: {
  customer_id: string
  pickup_location: string
  delivery_location: string
  commodity: string
  weight: string
  weight_unit: string
  equipment_type: string
  pricing_type: string
  carrier_id: string
  pickup_time: string
  delivery_time: string
  customer_rate: string
  carrier_rate: string
  comments: string
}) {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Get current load to check if carrier changed
    const { data: currentLoad } = await supabase
      .from('loads')
      .select('carrier_id, rate_confirmed')
      .eq('id', loadId)
      .single()

    const updateData: any = {
      customer_id: data.customer_id || null,
      carrier_id: data.carrier_id || null,
      commodity: data.commodity,
      equipment_type: data.equipment_type,
      pricing_type: data.pricing_type,
      weight: data.weight ? parseFloat(data.weight) : null,
      weight_unit: data.weight_unit,
      pickup_location: data.pickup_location,
      delivery_location: data.delivery_location,
      pickup_time: data.pickup_time ? new Date(data.pickup_time).toISOString() : null,
      delivery_time: data.delivery_time ? new Date(data.delivery_time).toISOString() : null,
      customer_rate: data.customer_rate ? parseFloat(data.customer_rate) : null,
      carrier_rate: data.carrier_rate ? parseFloat(data.carrier_rate) : null,
      comments: data.comments || null,
    }

    // If carrier changed and rate was confirmed, reset confirmation
    if (currentLoad?.carrier_id !== data.carrier_id && currentLoad?.rate_confirmed) {
      updateData.rate_confirmed = false
      updateData.rate_confirmed_at = null
      updateData.rate_confirmed_by = null
    }

    // Update the load
    const { error } = await supabase
      .from('loads')
      .update(updateData)
      .eq('id', loadId)

    if (error) {
      console.error('Error updating load:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/dashboard/loads')
    revalidatePath('/carrier/load-board')
    revalidatePath('/carrier/assignments')
    return { success: true }
  } catch (error) {
    console.error('Error in updateLoad:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

export async function updateLoadStatus(loadId: number, newStatus: string, notes?: string) {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Get user info
    const { data: userData } = await supabase
      .from('users')
      .select('role, name')
      .eq('id', user.id)
      .single()

    // Get load info
    const { data: loadInfo } = await supabase
      .from('loads')
      .select('load_number, pickup_location, delivery_location')
      .eq('id', loadId)
      .single()

    // Update the load status (and optionally add notes to comments if provided)
    const updateData: any = { status: newStatus }
    if (notes) {
      // Append notes to existing comments
      const { data: loadData } = await supabase
        .from('loads')
        .select('comments')
        .eq('id', loadId)
        .single()
      
      const existingComments = loadData?.comments || ''
      const timestamp = new Date().toLocaleString()
      updateData.comments = existingComments 
        ? `${existingComments}\n\n[${timestamp}] Status changed to ${newStatus}: ${notes}`
        : `[${timestamp}] Status changed to ${newStatus}: ${notes}`
    }

    const { error: updateError } = await supabase
      .from('loads')
      .update(updateData)
      .eq('id', loadId)

    if (updateError) {
      console.error('Error updating load status:', updateError)
      return { success: false, error: updateError.message }
    }

    // Record in status history
    const { error: historyError } = await supabase
      .from('status_history')
      .insert({
        load_id: loadId,
        status: newStatus,
        updated_by: user.id,
      })

    if (historyError) {
      console.error('Error recording status history:', historyError)
      // Don't fail the whole operation if history recording fails
    }

    // If driver is updating status, notify dispatchers
    if (userData?.role === 'driver' || userData?.role === 'carrier') {
      const { notifyDispatchers } = await import('./notifications')
      await notifyDispatchers({
        type: 'driver_activity',
        title: 'Load Status Updated',
        message: `${userData?.name || 'Driver'} updated Load ${loadInfo?.load_number || `#${loadId}`} to ${newStatus.replace('_', ' ')}${notes ? `: ${notes}` : ''}`,
        link: `/dashboard/loads`,
        relatedEntityType: 'load',
        relatedEntityId: loadId,
        metadata: {
          load_id: loadId,
          old_status: loadInfo,
          new_status: newStatus,
          updated_by: user.id,
        }
      })
    }

    // Auto-generate invoice when status changes to delivered
    if (newStatus === 'delivered') {
      // Get load details to check if invoice can be generated
      const { data: load } = await supabase
        .from('loads')
        .select('customer_rate, customer_id')
        .eq('id', loadId)
        .single()

      // Check if invoice already exists
      const { data: existingInvoice } = await supabase
        .from('invoices')
        .select('id')
        .eq('load_id', loadId)
        .maybeSingle()

      // Only generate invoice if conditions are met
      if (load && load.customer_rate && load.customer_id && !existingInvoice) {
        try {
          // Create invoice automatically
          const { error: invoiceError } = await supabase
            .from('invoices')
            .insert({
              load_id: loadId,
              customer_id: load.customer_id,
              amount: load.customer_rate,
              status: 'issued',
            })

          if (invoiceError) {
            console.error('Error auto-generating invoice:', invoiceError)
            // Don't fail the status update if invoice generation fails
            // The invoice can be generated manually later if needed
          } else {
            console.log(`Invoice automatically generated for load ${loadId}`)
          }
        } catch (invoiceGenError) {
          console.error('Error in invoice auto-generation:', invoiceGenError)
          // Don't fail the status update
        }
      }
    }

    revalidatePath('/dashboard/loads')
    revalidatePath('/carrier/assignments')
    revalidatePath('/driver/assignments')
    revalidatePath('/customer/shipments')
    revalidatePath('/dashboard/billing')
    revalidatePath('/customer/invoices')
    
    return { success: true }
  } catch (error) {
    console.error('Error in updateLoadStatus:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

export async function unassignCarrier(loadId: number) {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Unassign carrier and reset rate confirmation
    const { error } = await supabase
      .from('loads')
      .update({
        carrier_id: null,
        carrier_rate: null,
        rate_confirmed: false,
        rate_confirmed_at: null,
        rate_confirmed_by: null,
        status: 'pending_pickup',
      })
      .eq('id', loadId)

    if (error) {
      console.error('Error unassigning carrier:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/dashboard/loads')
    revalidatePath('/carrier/load-board')
    revalidatePath('/carrier/assignments')
    return { success: true }
  } catch (error) {
    console.error('Error in unassignCarrier:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

export async function deleteLoad(loadId: number) {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Soft delete by setting deleted_at timestamp
    const { error } = await supabase
      .from('loads')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', loadId)

    if (error) {
      console.error('Error deleting load:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/dashboard/loads')
    return { success: true }
  } catch (error) {
    console.error('Error in deleteLoad:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

export async function closeLoad(loadId: number) {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Get load to validate it can be closed
    const { data: load } = await supabase
      .from('loads')
      .select('status, id')
      .eq('id', loadId)
      .single()

    if (!load) {
      return { success: false, error: 'Load not found' }
    }

    if (load.status !== 'delivered') {
      return { success: false, error: 'Load must be delivered before closing' }
    }

    // Check if invoice exists
    const { data: invoice } = await supabase
      .from('invoices')
      .select('id')
      .eq('load_id', loadId)
      .single()

    if (!invoice) {
      return { success: false, error: 'Cannot close load without an invoice. Please generate an invoice first.' }
    }

    // Close the load
    const { error } = await supabase
      .from('loads')
      .update({ status: 'closed' })
      .eq('id', loadId)

    if (error) {
      console.error('Error closing load:', error)
      return { success: false, error: error.message }
    }

    // Record in status history
    await supabase
      .from('status_history')
      .insert({
        load_id: loadId,
        status: 'closed',
        updated_by: user.id,
      })

    revalidatePath('/dashboard/loads')
    return { success: true }
  } catch (error) {
    console.error('Error in closeLoad:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

export async function confirmRate(loadId: number) {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Verify user is a carrier
    const { data: userData } = await supabase
      .from('users')
      .select('role, company_id')
      .eq('id', user.id)
      .single()

    if (!userData || userData.role !== 'carrier') {
      return { success: false, error: 'Only carriers can confirm rates' }
    }

    // Verify the load is assigned to this carrier's company
    const { data: load } = await supabase
      .from('loads')
      .select('carrier_id, rate_confirmed')
      .eq('id', loadId)
      .single()

    if (!load) {
      return { success: false, error: 'Load not found' }
    }

    if (load.carrier_id !== userData.company_id) {
      return { success: false, error: 'This load is not assigned to your company' }
    }

    if (load.rate_confirmed) {
      return { success: false, error: 'Rate has already been confirmed' }
    }

    // Confirm the rate
    const { error } = await supabase
      .from('loads')
      .update({
        rate_confirmed: true,
        rate_confirmed_at: new Date().toISOString(),
        rate_confirmed_by: user.id,
        status: 'pending_pickup' // Move to next status
      })
      .eq('id', loadId)

    if (error) {
      console.error('Error confirming rate:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/carrier/load-board')
    revalidatePath('/carrier/assignments')
    revalidatePath('/dashboard/loads')
    
    return { success: true }
  } catch (error) {
    console.error('Error in confirmRate:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

export async function sendRateConfirmation(loadId: number) {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Get load with carrier information
    const { data: load, error: loadError } = await supabase
      .from('loads')
      .select(`
        id,
        load_number,
        carrier_id,
        carrier_rate,
        pickup_location,
        delivery_location,
        pickup_time,
        delivery_time,
        carrier:companies!loads_carrier_id_fkey(id, name)
      `)
      .eq('id', loadId)
      .single()

    if (loadError || !load) {
      return { success: false, error: 'Load not found' }
    }

    if (!load.carrier_id || !load.carrier) {
      return { success: false, error: 'No carrier assigned to this load' }
    }

    if (!load.carrier_rate) {
      return { success: false, error: 'No carrier rate set for this load' }
    }

    // Get all users from the carrier company
    const { data: carrierUsers, error: usersError } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('company_id', load.carrier_id)
      .eq('role', 'carrier')

    if (usersError || !carrierUsers || carrierUsers.length === 0) {
      return { success: false, error: 'No carrier users found to notify' }
    }

    // Create notifications for all carrier users
    const { createNotification } = await import('./notifications')
    
    const pickupDate = load.pickup_time ? new Date(load.pickup_time).toLocaleDateString() : 'TBD'
    const deliveryDate = load.delivery_time ? new Date(load.delivery_time).toLocaleDateString() : 'TBD'
    
    const notificationPromises = carrierUsers.map(carrierUser =>
      createNotification({
        recipientId: carrierUser.id,
        type: 'general',
        title: '📄 Rate Confirmation Sent',
        message: `Load ${load.load_number || `#${load.id}`}: ${load.pickup_location} → ${load.delivery_location}. Rate: $${load.carrier_rate?.toFixed(2)}. Pickup: ${pickupDate}. Click to view and confirm rate.`,
        link: `/carrier/assignments`,
        relatedEntityType: 'load',
        relatedEntityId: load.id,
        metadata: {
          load_id: load.id,
          carrier_rate: load.carrier_rate,
          rate_confirmation_url: `/api/loads/${load.id}/rate-confirmation`,
          pickup_location: load.pickup_location,
          delivery_location: load.delivery_location,
        }
      })
    )

    await Promise.all(notificationPromises)

    revalidatePath('/dashboard/loads')
    revalidatePath('/carrier/assignments')
    
    return { 
      success: true, 
      message: `Rate confirmation sent to ${carrierUsers.length} carrier user(s)` 
    }
  } catch (error) {
    console.error('Error in sendRateConfirmation:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

