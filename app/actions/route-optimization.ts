'use server'

import { createClient } from '@/lib/supabase/server'
import { calculateProximityScores } from '@/lib/maps/distance-matrix'
import { Coordinates } from '@/lib/types/database.types'

interface OptimizationResult {
  driver_id: string
  driver_name: string
  load_id: number
  load_number: string
  distance_miles: number
  duration_minutes: number
  score: number
  equipment_match: boolean
}

/**
 * Get optimized load-driver assignments based on proximity and equipment match
 */
export async function getOptimizedAssignments() {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Get available drivers with their latest locations
    const { data: drivers, error: driversError } = await supabase
      .from('users')
      .select('id, name')
      .eq('role', 'driver')

    if (driversError) {
      console.error('Error fetching drivers:', driversError)
      return { success: false, error: 'Failed to fetch drivers' }
    }

    // Get driver locations
    const driverIds = drivers?.map(d => d.id) || []
    const { data: locations } = await supabase
      .from('driver_locations')
      .select('driver_id, latitude, longitude')
      .in('driver_id', driverIds)
      .order('timestamp', { ascending: false })

    // Get latest location per driver
    const driverLocationMap = new Map<string, Coordinates>()
    locations?.forEach(loc => {
      if (!driverLocationMap.has(loc.driver_id)) {
        driverLocationMap.set(loc.driver_id, {
          lat: loc.latitude,
          lng: loc.longitude,
        })
      }
    })

    // Get unassigned loads with geocoded locations
    const { data: loads, error: loadsError } = await supabase
      .from('loads')
      .select(`
        id,
        load_number,
        equipment_type,
        pickup_location,
        delivery_location
      `)
      .is('driver_id', null)
      .in('status', ['pending', 'posted'])
      .limit(50)

    if (loadsError) {
      console.error('Error fetching loads:', loadsError)
      return { success: false, error: 'Failed to fetch loads' }
    }

    // Get load locations
    const loadIds = loads?.map(l => l.id) || []
    const { data: loadLocations } = await supabase
      .from('load_locations')
      .select('load_id, pickup_lat, pickup_lng')
      .in('load_id', loadIds)

    const loadLocationMap = new Map<number, Coordinates>()
    loadLocations?.forEach(loc => {
      if (loc.pickup_lat && loc.pickup_lng) {
        loadLocationMap.set(loc.load_id, {
          lat: loc.pickup_lat,
          lng: loc.pickup_lng,
        })
      }
    })

    // Filter to only drivers and loads with locations
    const driversWithLocations = (drivers || [])
      .filter(d => driverLocationMap.has(d.id))
      .map(d => ({
        driver_id: d.id,
        name: d.name || 'Unknown',
        coordinates: driverLocationMap.get(d.id)!,
      }))

    const loadsWithLocations = (loads || [])
      .filter(l => loadLocationMap.has(l.id))
      .map(l => ({
        load_id: l.id,
        load_number: l.load_number || `Load #${l.id}`,
        equipment_type: l.equipment_type,
        coordinates: loadLocationMap.get(l.id)!,
      }))

    if (driversWithLocations.length === 0 || loadsWithLocations.length === 0) {
      console.log(`⚠️ Insufficient data: ${driversWithLocations.length} drivers, ${loadsWithLocations.length} loads with locations`)
      return {
        success: true,
        data: [],
        message: `Cannot optimize: ${driversWithLocations.length === 0 ? 'No drivers with GPS locations' : 'No loads with geocoded addresses'}`,
      }
    }

    console.log(`Calculating proximity for ${driversWithLocations.length} drivers and ${loadsWithLocations.length} loads...`)

    // Calculate proximity scores
    const proximityScores = await calculateProximityScores(
      driversWithLocations,
      loadsWithLocations
    )

    if (proximityScores.size === 0) {
      console.warn('⚠️ No proximity scores calculated')
      return {
        success: true,
        data: [],
        message: 'Unable to calculate distances. Check Google Maps API key and quota.',
      }
    }

    // Build optimization results
    const optimizations: OptimizationResult[] = []

    proximityScores.forEach((loadScores, driverId) => {
      const driver = driversWithLocations.find(d => d.driver_id === driverId)
      if (!driver) return

      loadScores.forEach((score, loadId) => {
        const load = loadsWithLocations.find(l => l.load_id === loadId)
        if (!load) return

        // Convert score to distance/duration (approximate)
        const distanceMiles = score * 0.7 // Rough conversion
        const durationMinutes = score * 2 // Rough conversion

        optimizations.push({
          driver_id: driverId,
          driver_name: driver.name,
          load_id: loadId,
          load_number: load.load_number,
          distance_miles: Math.round(distanceMiles * 10) / 10,
          duration_minutes: Math.round(durationMinutes),
          score: Math.round(score * 10) / 10,
          equipment_match: true, // TODO: Check equipment type match
        })
      })
    })

    // Sort by score (lower is better)
    optimizations.sort((a, b) => a.score - b.score)

    return {
      success: true,
      data: optimizations.slice(0, 20), // Return top 20 recommendations
    }
  } catch (error) {
    console.error('Error in getOptimizedAssignments:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Get proximity analysis for a specific load
 */
export async function getLoadProximityAnalysis(loadId: number) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Get load location
    const { data: loadLocation } = await supabase
      .from('load_locations')
      .select('pickup_lat, pickup_lng')
      .eq('load_id', loadId)
      .single()

    if (!loadLocation || !loadLocation.pickup_lat || !loadLocation.pickup_lng) {
      return { success: false, error: 'Load location not found' }
    }

    const loadCoords: Coordinates = {
      lat: loadLocation.pickup_lat,
      lng: loadLocation.pickup_lng,
    }

    // Get available drivers with locations
    const { data: drivers } = await supabase
      .from('users')
      .select('id, name')
      .eq('role', 'driver')

    const driverIds = drivers?.map(d => d.id) || []
    const { data: locations } = await supabase
      .from('driver_locations')
      .select('driver_id, latitude, longitude')
      .in('driver_id', driverIds)
      .order('timestamp', { ascending: false })

    const driverLocationMap = new Map<string, Coordinates>()
    locations?.forEach(loc => {
      if (!driverLocationMap.has(loc.driver_id)) {
        driverLocationMap.set(loc.driver_id, {
          lat: loc.latitude,
          lng: loc.longitude,
        })
      }
    })

    const driversWithLocations = (drivers || [])
      .filter(d => driverLocationMap.has(d.id))
      .map(d => ({
        driver_id: d.id,
        name: d.name || 'Unknown',
        coordinates: driverLocationMap.get(d.id)!,
      }))

    // Calculate proximity scores
    const proximityScores = await calculateProximityScores(
      driversWithLocations,
      [{ load_id: loadId, coordinates: loadCoords }]
    )

    const results = Array.from(proximityScores.entries()).map(([driverId, loadScores]) => {
      const driver = driversWithLocations.find(d => d.driver_id === driverId)
      const score = loadScores.get(loadId) || 0

      return {
        driver_id: driverId,
        driver_name: driver?.name || 'Unknown',
        distance_miles: Math.round(score * 0.7 * 10) / 10,
        duration_minutes: Math.round(score * 2),
        score: Math.round(score * 10) / 10,
      }
    })

    results.sort((a, b) => a.score - b.score)

    return {
      success: true,
      data: results.slice(0, 10), // Top 10 closest drivers
    }
  } catch (error) {
    console.error('Error in getLoadProximityAnalysis:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

