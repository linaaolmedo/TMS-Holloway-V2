'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addTruck(data: {
  unit_number: string
  vin: string
  make: string
  model: string
  year: string
  status: string
  price_per_mile: string
}) {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Insert the truck
    const { data: truck, error } = await supabase
      .from('trucks')
      .insert({
        unit_number: data.unit_number,
        vin: data.vin || null,
        make: data.make || null,
        model: data.model || null,
        year: data.year ? parseInt(data.year) : null,
        status: data.status,
        price_per_mile: data.price_per_mile ? parseFloat(data.price_per_mile) : null,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating truck:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/dashboard/fleet')
    return { success: true, data: truck }
  } catch (error) {
    console.error('Error in addTruck:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

