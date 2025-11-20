'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getImpersonationContext } from '@/lib/impersonation'
import { logImpersonationAction } from './admin'

// Helper to log actions during impersonation
async function logIfImpersonating(action: string, metadata?: any) {
  const context = await getImpersonationContext()
  if (context.isImpersonating) {
    await logImpersonationAction(action, metadata)
  }
}

export async function addCustomer(data: {
  name: string
  contact_person: string
  phone: string
  email: string
  billing_address: string
  preferred_invoice_method: string
  payment_terms: string
  credit_limit: string
  shipping_locations: string
}) {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Parse shipping locations (split by newline)
    const shippingLocationsArray = data.shipping_locations
      .split('\n')
      .map((loc) => loc.trim())
      .filter((loc) => loc.length > 0)

    // Insert the customer
    const { data: customer, error } = await supabase
      .from('companies')
      .insert({
        name: data.name,
        type: 'shipper',
        contact_person: data.contact_person || null,
        phone: data.phone || null,
        email: data.email || null,
        billing_address: data.billing_address || null,
        preferred_invoice_method: data.preferred_invoice_method,
        payment_terms: data.payment_terms,
        credit_limit: data.credit_limit ? parseFloat(data.credit_limit) : null,
        shipping_locations: shippingLocationsArray.length > 0 ? shippingLocationsArray : null,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating customer:', error)
      return { success: false, error: error.message }
    }

    // Log if impersonating
    await logIfImpersonating('create_customer', {
      customer_id: customer.id,
      customer_name: customer.name,
    })

    revalidatePath('/dashboard/customers')
    return { success: true, data: customer }
  } catch (error) {
    console.error('Error in addCustomer:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

interface Location {
  id: string
  address: string
  city: string
  state: string
  zip_code: string
}

export async function requestShipment(data: {
  pickup_locations: Location[]
  delivery_locations: Location[]
  commodity: string
  weight: string
  weight_unit: string
  equipment_type: string
  pickup_time: string
  delivery_time: string
  special_instructions: string
}) {
  try {
    const supabase = await createClient()

    // Get current user and their company_id
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const { data: userData } = await supabase
      .from('users')
      .select('company_id, id')
      .eq('id', user.id)
      .single()

    if (!userData?.company_id) {
      return { success: false, error: 'User company not found' }
    }

    // Generate load number
    const loadNumber = `LOAD-${Date.now()}`

    // Format locations into readable strings
    const formatLocation = (loc: Location) => 
      `${loc.address}, ${loc.city}, ${loc.state} ${loc.zip_code}`
    
    const pickupLocationStr = data.pickup_locations
      .map((loc, idx) => `Stop ${idx + 1}: ${formatLocation(loc)}`)
      .join('\n')
    
    const deliveryLocationStr = data.delivery_locations
      .map((loc, idx) => `Stop ${idx + 1}: ${formatLocation(loc)}`)
      .join('\n')

    // Parse weight as number for validation
    const weightNum = parseFloat(data.weight)
    if (isNaN(weightNum) || weightNum <= 0) {
      return { success: false, error: 'Invalid weight value' }
    }

    // Combine special instructions with a customer request note
    let comments = '[Customer Request]'
    if (data.pickup_locations.length > 1) {
      comments += `\nMultiple Pickup Stops: ${data.pickup_locations.length}`
    }
    if (data.delivery_locations.length > 1) {
      comments += `\nMultiple Delivery Stops: ${data.delivery_locations.length}`
    }
    if (data.special_instructions) {
      comments += `\n\nSpecial Instructions:\n${data.special_instructions}`
    }

    // Create the load
    const { data: load, error } = await supabase
      .from('loads')
      .insert({
        load_number: loadNumber,
        status: 'pending_pickup',
        customer_id: userData.company_id,
        pickup_location: pickupLocationStr,
        delivery_location: deliveryLocationStr,
        commodity: data.commodity,
        weight: weightNum, // Store as numeric value
        weight_unit: data.weight_unit, // Store unit separately
        equipment_type: data.equipment_type,
        pickup_time: data.pickup_time,
        delivery_time: data.delivery_time,
        comments: comments,
        pricing_type: 'flat', // Default, dispatcher will update
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating shipment request:', error)
      return { success: false, error: error.message }
    }

    // Create status history entry
    await supabase
      .from('status_history')
      .insert({
        load_id: load.id,
        status: 'pending_pickup',
        updated_by: user.id,
      })

    revalidatePath('/customer/shipments')
    revalidatePath('/dashboard/loads')
    
    return { success: true, data: load }
  } catch (error) {
    console.error('Error in requestShipment:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

