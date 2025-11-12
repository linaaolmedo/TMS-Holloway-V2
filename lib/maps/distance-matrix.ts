import { Coordinates } from '../types/database.types'

export interface DistanceMatrixElement {
  distance: {
    value: number // meters
    text: string
  }
  duration: {
    value: number // seconds
    text: string
  }
  duration_in_traffic?: {
    value: number // seconds
    text: string
  }
  status: string
}

export interface DistanceMatrixResult {
  origin_addresses: string[]
  destination_addresses: string[]
  rows: Array<{
    elements: DistanceMatrixElement[]
  }>
}

/**
 * Calculate distance and time between multiple origins and destinations
 * Uses Google Maps JavaScript API to avoid CORS issues
 */
export async function getDistanceMatrix(
  origins: (Coordinates | string)[],
  destinations: (Coordinates | string)[],
  options: {
    departureTime?: Date
    trafficModel?: 'best_guess' | 'optimistic' | 'pessimistic'
  } = {}
): Promise<DistanceMatrixResult | null> {
  // Check if Google Maps is loaded
  if (typeof google === 'undefined' || !google.maps) {
    console.warn('Google Maps not loaded yet')
    return null
  }

  if (origins.length === 0 || destinations.length === 0) {
    console.warn('No origins or destinations provided')
    return null
  }

  try {
    const service = new google.maps.DistanceMatrixService()

    // Convert origins to LatLng objects or strings
    const originsArray = origins.map(o => 
      typeof o === 'string' ? o : new google.maps.LatLng(o.lat, o.lng)
    )
    
    const destinationsArray = destinations.map(d => 
      typeof d === 'string' ? d : new google.maps.LatLng(d.lat, d.lng)
    )

    const request: google.maps.DistanceMatrixRequest = {
      origins: originsArray,
      destinations: destinationsArray,
      travelMode: google.maps.TravelMode.DRIVING,
    }

    if (options.departureTime) {
      request.drivingOptions = {
        departureTime: options.departureTime,
        trafficModel: options.trafficModel === 'optimistic' 
          ? google.maps.TrafficModel.OPTIMISTIC
          : options.trafficModel === 'pessimistic'
          ? google.maps.TrafficModel.PESSIMISTIC
          : google.maps.TrafficModel.BEST_GUESS,
      }
    }

    const response = await new Promise<google.maps.DistanceMatrixResponse | null>((resolve) => {
      service.getDistanceMatrix(request, (response, status) => {
        if (status === google.maps.DistanceMatrixStatus.OK && response) {
          resolve(response)
        } else {
          console.warn('Distance Matrix request failed:', status)
          resolve(null)
        }
      })
    })

    if (!response) {
      return null
    }

    // Convert response to our format
    const result: DistanceMatrixResult = {
      origin_addresses: response.originAddresses,
      destination_addresses: response.destinationAddresses,
      rows: response.rows.map(row => ({
        elements: row.elements.map(element => ({
          distance: {
            value: element.distance?.value || 0,
            text: element.distance?.text || '0 mi',
          },
          duration: {
            value: element.duration?.value || 0,
            text: element.duration?.text || '0 mins',
          },
          duration_in_traffic: element.duration_in_traffic ? {
            value: element.duration_in_traffic.value,
            text: element.duration_in_traffic.text,
          } : undefined,
          status: element.status,
        })),
      })),
    }

    return result
  } catch (error) {
    console.error('Distance Matrix error:', error)
    return null
  }
}

/**
 * Find the closest destination from an origin
 */
export async function findClosestDestination(
  origin: Coordinates,
  destinations: Array<{ id: string | number; coordinates: Coordinates }>
): Promise<{ id: string | number; distance: number; duration: number } | null> {
  const matrix = await getDistanceMatrix(
    [origin],
    destinations.map(d => d.coordinates)
  )

  if (!matrix || !matrix.rows[0]) return null

  let closest: { id: string | number; distance: number; duration: number } | null = null
  let minDistance = Infinity

  matrix.rows[0].elements.forEach((element, index) => {
    if (element.status === 'OK' && element.distance.value < minDistance) {
      minDistance = element.distance.value
      closest = {
        id: destinations[index].id,
        distance: element.distance.value,
        duration: element.duration.value,
      }
    }
  })

  return closest
}

/**
 * Calculate proximity scores for load-driver pairs
 * Returns a map of driver_id -> load_id -> score (lower is better)
 */
export async function calculateProximityScores(
  driverLocations: Array<{ driver_id: string; coordinates: Coordinates }>,
  loadPickups: Array<{ load_id: number; coordinates: Coordinates }>
): Promise<Map<string, Map<number, number>>> {
  const scores = new Map<string, Map<number, number>>()

  // Calculate distance matrix for each driver to all pickup locations
  for (const driver of driverLocations) {
    const matrix = await getDistanceMatrix(
      [driver.coordinates],
      loadPickups.map(l => l.coordinates)
    )

    if (!matrix || !matrix.rows[0]) continue

    const driverScores = new Map<number, number>()
    
    matrix.rows[0].elements.forEach((element, index) => {
      if (element.status === 'OK') {
        // Score is distance in miles + (duration in minutes / 60)
        // This weights both distance and time
        const distanceMiles = element.distance.value / 1609.34
        const durationHours = element.duration.value / 3600
        const score = distanceMiles + (durationHours * 30) // 30 mph equivalent weight
        
        driverScores.set(loadPickups[index].load_id, score)
      }
    })

    scores.set(driver.driver_id, driverScores)
    
    // Add delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  return scores
}


