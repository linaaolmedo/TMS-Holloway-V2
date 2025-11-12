'use server'

import { createClient } from '@/lib/supabase/server'
import { calculateETA } from '@/lib/maps/directions'
import { Coordinates } from '@/lib/types/database.types'

/**
 * Update route tracking for an active load
 */
export async function updateRouteTracking(data: {
  loadId: number
  currentLat: number
  currentLng: number
  status: 'en_route_pickup' | 'at_pickup' | 'en_route_delivery' | 'at_delivery' | 'completed'
}) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Get load details with locations
    const { data: loadLocation } = await supabase
      .from('load_locations')
      .select('*')
      .eq('load_id', data.loadId)
      .single()

    if (!loadLocation) {
      return { success: false, error: 'Load location not found' }
    }

    const currentLocation: Coordinates = {
      lat: data.currentLat,
      lng: data.currentLng,
    }

    // Calculate ETAs based on current status
    let etaPickup = null
    let etaDelivery = null

    if (data.status === 'en_route_pickup' && loadLocation.pickup_lat && loadLocation.pickup_lng) {
      const pickupLocation: Coordinates = {
        lat: loadLocation.pickup_lat,
        lng: loadLocation.pickup_lng,
      }
      const eta = await calculateETA(currentLocation, pickupLocation)
      etaPickup = eta?.toISOString() || null
    }

    if (
      (data.status === 'en_route_delivery' || data.status === 'at_pickup') &&
      loadLocation.delivery_lat &&
      loadLocation.delivery_lng
    ) {
      const deliveryLocation: Coordinates = {
        lat: loadLocation.delivery_lat,
        lng: loadLocation.delivery_lng,
      }
      const eta = await calculateETA(currentLocation, deliveryLocation)
      etaDelivery = eta?.toISOString() || null
    }

    // Check if tracking record exists
    const { data: existing } = await supabase
      .from('route_tracking')
      .select('id')
      .eq('load_id', data.loadId)
      .single()

    const trackingData = {
      load_id: data.loadId,
      driver_id: user.id,
      current_lat: data.currentLat,
      current_lng: data.currentLng,
      eta_pickup: etaPickup,
      eta_delivery: etaDelivery,
      status: data.status,
      updated_at: new Date().toISOString(),
    }

    let error
    if (existing) {
      const result = await supabase
        .from('route_tracking')
        .update(trackingData)
        .eq('load_id', data.loadId)
      error = result.error
    } else {
      const result = await supabase
        .from('route_tracking')
        .insert(trackingData)
      error = result.error
    }

    if (error) {
      console.error('Error updating route tracking:', error)
      return { success: false, error: error.message }
    }

    return {
      success: true,
      data: {
        eta_pickup: etaPickup,
        eta_delivery: etaDelivery,
      },
    }
  } catch (error) {
    console.error('Error in updateRouteTracking:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Get route tracking for a load
 */
export async function getLoadTracking(loadId: number) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const { data, error } = await supabase
      .from('route_tracking')
      .select('*')
      .eq('load_id', loadId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching route tracking:', error)
      return { success: false, error: error.message }
    }

    // Also get driver location
    let driverLocation = null
    if (data?.driver_id) {
      const { data: location } = await supabase
        .from('driver_locations')
        .select('*')
        .eq('driver_id', data.driver_id)
        .order('timestamp', { ascending: false })
        .limit(1)
        .single()

      driverLocation = location
    }

    return {
      success: true,
      data: {
        tracking: data,
        driver_location: driverLocation,
      },
    }
  } catch (error) {
    console.error('Error in getLoadTracking:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Create or update route stops for a driver
 */
export async function updateRouteStops(stops: Array<{
  id?: number
  loadId: number
  stopSequence: number
  location: string
  latitude: number
  longitude: number
  stopType: 'pickup' | 'delivery' | 'waypoint'
  scheduledTime?: string
  notes?: string
}>) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Delete existing stops for this driver
    await supabase
      .from('route_stops')
      .delete()
      .eq('driver_id', user.id)

    // Insert new stops
    const stopsData = stops.map(stop => ({
      driver_id: user.id,
      load_id: stop.loadId,
      stop_sequence: stop.stopSequence,
      location: stop.location,
      latitude: stop.latitude,
      longitude: stop.longitude,
      stop_type: stop.stopType,
      scheduled_time: stop.scheduledTime || null,
      notes: stop.notes || null,
      status: 'pending' as const,
    }))

    const { error } = await supabase
      .from('route_stops')
      .insert(stopsData)

    if (error) {
      console.error('Error updating route stops:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error in updateRouteStops:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Get route stops for a driver
 */
export async function getDriverRouteStops(driverId?: string) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const targetDriverId = driverId || user.id

    const { data, error } = await supabase
      .from('route_stops')
      .select('*')
      .eq('driver_id', targetDriverId)
      .order('stop_sequence', { ascending: true })

    if (error) {
      console.error('Error fetching route stops:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Error in getDriverRouteStops:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Mark a route stop as completed
 */
export async function completeRouteStop(stopId: number) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const { error } = await supabase
      .from('route_stops')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', stopId)
      .eq('driver_id', user.id)

    if (error) {
      console.error('Error completing route stop:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error in completeRouteStop:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}



