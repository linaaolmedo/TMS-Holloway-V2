'use server'

import { createClient } from '@/lib/supabase/server'
import { geocodeAddress } from '@/lib/geocoding'
import { revalidatePath } from 'next/cache'
import { Coordinates } from '@/lib/types/database.types'

/**
 * Update driver's current location
 */
export async function updateDriverLocation(data: {
  latitude: number
  longitude: number
  heading?: number
  speed?: number
  accuracy?: number
}) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Verify user is a driver
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!userData || userData.role !== 'driver') {
      return { success: false, error: 'Only drivers can update location' }
    }

    const { error } = await supabase
      .from('driver_locations')
      .insert({
        driver_id: user.id,
        latitude: data.latitude,
        longitude: data.longitude,
        heading: data.heading || null,
        speed: data.speed || null,
        accuracy: data.accuracy || null,
        timestamp: new Date().toISOString(),
      })

    if (error) {
      console.error('Error updating driver location:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/driver')
    return { success: true }
  } catch (error) {
    console.error('Error in updateDriverLocation:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Get driver's latest location
 */
export async function getDriverLocation(driverId: string) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const { data, error } = await supabase
      .from('driver_locations')
      .select('*')
      .eq('driver_id', driverId)
      .order('timestamp', { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching driver location:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Error in getDriverLocation:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Get locations for multiple drivers
 */
export async function getMultipleDriverLocations(driverIds: string[]) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Get latest location for each driver
    const { data, error } = await supabase
      .from('driver_locations')
      .select('*')
      .in('driver_id', driverIds)
      .order('timestamp', { ascending: false })

    if (error) {
      console.error('Error fetching driver locations:', error)
      return { success: false, error: error.message }
    }

    // Filter to get only the latest location per driver
    const latestLocations = new Map()
    data?.forEach(location => {
      if (!latestLocations.has(location.driver_id)) {
        latestLocations.set(location.driver_id, location)
      }
    })

    return { success: true, data: Array.from(latestLocations.values()) }
  } catch (error) {
    console.error('Error in getMultipleDriverLocations:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Geocode a load's pickup and delivery addresses
 */
export async function geocodeLoad(loadId: number) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Get load details
    const { data: load, error: loadError } = await supabase
      .from('loads')
      .select('pickup_location, delivery_location')
      .eq('id', loadId)
      .single()

    if (loadError || !load) {
      return { success: false, error: 'Load not found' }
    }

    // Geocode both addresses
    const [pickupResult, deliveryResult] = await Promise.all([
      load.pickup_location ? geocodeAddress(load.pickup_location) : null,
      load.delivery_location ? geocodeAddress(load.delivery_location) : null,
    ])

    // Check if location already exists
    const { data: existing } = await supabase
      .from('load_locations')
      .select('id')
      .eq('load_id', loadId)
      .single()

    const locationData = {
      load_id: loadId,
      pickup_lat: pickupResult?.coordinates.lat || null,
      pickup_lng: pickupResult?.coordinates.lng || null,
      delivery_lat: deliveryResult?.coordinates.lat || null,
      delivery_lng: deliveryResult?.coordinates.lng || null,
      geocoding_accuracy: pickupResult?.accuracy || deliveryResult?.accuracy || null,
    }

    let error
    if (existing) {
      // Update existing
      const result = await supabase
        .from('load_locations')
        .update({ ...locationData, updated_at: new Date().toISOString() })
        .eq('load_id', loadId)
      error = result.error
    } else {
      // Insert new
      const result = await supabase
        .from('load_locations')
        .insert(locationData)
      error = result.error
    }

    if (error) {
      console.error('Error saving load location:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/dashboard/loads')
    return {
      success: true,
      data: {
        pickup: pickupResult,
        delivery: deliveryResult,
      },
    }
  } catch (error) {
    console.error('Error in geocodeLoad:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Get geocoded location for a load
 */
export async function getLoadLocation(loadId: number) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const { data, error } = await supabase
      .from('load_locations')
      .select('*')
      .eq('load_id', loadId)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching load location:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Error in getLoadLocation:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Batch geocode multiple loads
 */
export async function geocodeMultipleLoads(loadIds: number[]) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const results = []
    
    for (const loadId of loadIds) {
      const result = await geocodeLoad(loadId)
      results.push({ loadId, ...result })
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200))
    }

    return { success: true, data: results }
  } catch (error) {
    console.error('Error in geocodeMultipleLoads:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}



