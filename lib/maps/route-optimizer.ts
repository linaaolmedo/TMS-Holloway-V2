import { Coordinates } from '../types/database.types'
import { getDistanceMatrix, DistanceMatrixElement } from './distance-matrix'

export interface Stop {
  id: number
  location: string
  coordinates: Coordinates
  type: 'pickup' | 'delivery'
  load_id?: number
  time_window?: {
    earliest: Date
    latest: Date
  }
}

export interface OptimizedRoute {
  stops: Stop[]
  total_distance: number // meters
  total_duration: number // seconds
  sequence: number[]
  savings_percent: number
}

/**
 * Optimize the sequence of stops for a route using nearest neighbor heuristic
 * For exact solutions with < 10 stops, uses brute force. For more, uses heuristic.
 */
export async function optimizeRouteStops(
  startLocation: Coordinates,
  stops: Stop[],
  endLocation?: Coordinates
): Promise<OptimizedRoute | null> {
  if (stops.length === 0) {
    return {
      stops: [],
      total_distance: 0,
      total_duration: 0,
      sequence: [],
      savings_percent: 0,
    }
  }

  // For small number of stops, calculate all permutations
  if (stops.length <= 8) {
    return await optimizeExact(startLocation, stops, endLocation)
  }

  // For larger routes, use nearest neighbor heuristic
  return await optimizeNearestNeighbor(startLocation, stops, endLocation)
}

/**
 * Exact optimization using brute force (only for small stop counts)
 */
async function optimizeExact(
  startLocation: Coordinates,
  stops: Stop[],
  endLocation?: Coordinates
): Promise<OptimizedRoute | null> {
  // Generate all permutations
  const permutations = generatePermutations(stops)
  
  let bestRoute: OptimizedRoute | null = null
  let bestDistance = Infinity

  for (const perm of permutations) {
    // Check if this permutation respects pickup/delivery constraints
    if (!respectsConstraints(perm)) continue

    const route = await calculateRouteMetrics(startLocation, perm, endLocation)
    if (route && route.total_distance < bestDistance) {
      bestDistance = route.total_distance
      bestRoute = route
    }
  }

  return bestRoute
}

/**
 * Nearest neighbor heuristic optimization
 */
async function optimizeNearestNeighbor(
  startLocation: Coordinates,
  stops: Stop[],
  endLocation?: Coordinates
): Promise<OptimizedRoute | null> {
  const unvisited = [...stops]
  const optimized: Stop[] = []
  let currentLocation = startLocation

  // Build distance matrix for all stops
  const allLocations = [startLocation, ...stops.map(s => s.coordinates)]
  if (endLocation) allLocations.push(endLocation)

  while (unvisited.length > 0) {
    // Find closest valid next stop
    let closestIndex = -1
    let closestDistance = Infinity

    for (let i = 0; i < unvisited.length; i++) {
      const stop = unvisited[i]
      
      // Check if this stop can be visited now (constraints)
      if (!canVisitStop(stop, optimized)) continue

      const distance = haversineDistance(currentLocation, stop.coordinates)
      
      if (distance < closestDistance) {
        closestDistance = distance
        closestIndex = i
      }
    }

    if (closestIndex === -1) {
      // No valid stops remaining - constraint violation
      console.warn('Cannot optimize route - constraint violation')
      break
    }

    const nextStop = unvisited.splice(closestIndex, 1)[0]
    optimized.push(nextStop)
    currentLocation = nextStop.coordinates
  }

  return await calculateRouteMetrics(startLocation, optimized, endLocation)
}

/**
 * Calculate actual route metrics using Google Distance Matrix
 */
async function calculateRouteMetrics(
  startLocation: Coordinates,
  stops: Stop[],
  endLocation?: Coordinates
): Promise<OptimizedRoute | null> {
  if (stops.length === 0) {
    return {
      stops: [],
      total_distance: 0,
      total_duration: 0,
      sequence: [],
      savings_percent: 0,
    }
  }

  // Build origins and destinations for distance matrix
  const locations = [
    startLocation,
    ...stops.map(s => s.coordinates),
  ]
  if (endLocation) locations.push(endLocation)

  const origins = locations.slice(0, -1)
  const destinations = locations.slice(1)

  const matrix = await getDistanceMatrix(origins, destinations)
  
  if (!matrix) return null

  let totalDistance = 0
  let totalDuration = 0

  // Sum up sequential legs
  for (let i = 0; i < matrix.rows.length && i < matrix.rows.length; i++) {
    const element = matrix.rows[i].elements[0]
    if (element.status === 'OK') {
      totalDistance += element.distance.value
      totalDuration += element.duration.value
    }
  }

  return {
    stops,
    total_distance: totalDistance,
    total_duration: totalDuration,
    sequence: stops.map(s => s.id),
    savings_percent: 0, // TODO: Calculate vs original order
  }
}

/**
 * Check if pickup/delivery constraints are respected
 */
function respectsConstraints(stops: Stop[]): boolean {
  const deliveries = new Set<number>()
  
  for (const stop of stops) {
    if (stop.type === 'delivery') {
      if (!stop.load_id) continue
      deliveries.add(stop.load_id)
    } else if (stop.type === 'pickup') {
      if (!stop.load_id) continue
      // If we've already delivered this load, invalid sequence
      if (deliveries.has(stop.load_id)) {
        return false
      }
    }
  }
  
  return true
}

/**
 * Check if a stop can be visited given current route
 */
function canVisitStop(stop: Stop, visited: Stop[]): boolean {
  // If it's a delivery, ensure pickup happened first
  if (stop.type === 'delivery' && stop.load_id) {
    const pickupDone = visited.some(
      v => v.type === 'pickup' && v.load_id === stop.load_id
    )
    if (!pickupDone) return false
  }
  
  // TODO: Check time windows
  
  return true
}

/**
 * Haversine distance calculation (approximate)
 */
function haversineDistance(coord1: Coordinates, coord2: Coordinates): number {
  const R = 6371e3 // Earth radius in meters
  const φ1 = (coord1.lat * Math.PI) / 180
  const φ2 = (coord2.lat * Math.PI) / 180
  const Δφ = ((coord2.lat - coord1.lat) * Math.PI) / 180
  const Δλ = ((coord2.lng - coord1.lng) * Math.PI) / 180

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c
}

/**
 * Generate all permutations of an array
 */
function generatePermutations<T>(array: T[]): T[][] {
  if (array.length <= 1) return [array]
  
  const result: T[][] = []
  
  for (let i = 0; i < array.length; i++) {
    const current = array[i]
    const remaining = array.slice(0, i).concat(array.slice(i + 1))
    const remainingPerms = generatePermutations(remaining)
    
    for (const perm of remainingPerms) {
      result.push([current, ...perm])
    }
  }
  
  return result
}



