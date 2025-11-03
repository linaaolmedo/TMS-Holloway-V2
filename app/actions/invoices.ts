'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function generateInvoice(loadId: number) {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Get load details
    const { data: load, error: loadError } = await supabase
      .from('loads')
      .select(`
        *,
        customer:companies!loads_customer_id_fkey(id, name)
      `)
      .eq('id', loadId)
      .single()

    if (loadError || !load) {
      return { success: false, error: 'Load not found' }
    }

    // Validate load can be invoiced
    if (load.status !== 'delivered' && load.status !== 'closed') {
      return { success: false, error: 'Load must be delivered before generating invoice' }
    }

    if (!load.customer_rate) {
      return { success: false, error: 'Customer rate must be set to generate invoice' }
    }

    // Check if invoice already exists
    const { data: existingInvoice } = await supabase
      .from('invoices')
      .select('id')
      .eq('load_id', loadId)
      .single()

    if (existingInvoice) {
      return { success: false, error: 'Invoice already exists for this load' }
    }

    // Create invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        load_id: loadId,
        customer_id: load.customer_id,
        amount: load.customer_rate,
        status: 'issued',
      })
      .select()
      .single()

    if (invoiceError) {
      console.error('Error creating invoice:', invoiceError)
      return { success: false, error: invoiceError.message }
    }

    revalidatePath('/dashboard/loads')
    revalidatePath('/dashboard/billing')
    revalidatePath('/customer/invoices')
    revalidatePath('/customer/shipments')
    
    return { success: true, data: invoice }
  } catch (error) {
    console.error('Error in generateInvoice:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

