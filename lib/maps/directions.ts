import { Coordinates } from '../types/database.types'

export interface DirectionsResult {
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
  polyline: string
  start_address: string
  end_address: string
  steps: Array<{
    distance: { value: number; text: string }
    duration: { value: number; text: string }
    html_instructions: string
    polyline: string
  }>
}

export interface DirectionsOptions {
  avoid?: ('tolls' | 'highways' | 'ferries')[]
  departureTime?: Date
  trafficModel?: 'best_guess' | 'optimistic' | 'pessimistic'
  alternatives?: boolean
}

/**
 * Get driving directions between two points using Google Maps JavaScript API
 * This works in the browser without CORS issues
 */
export async function getDirections(
  origin: Coordinates | string,
  destination: Coordinates | string,
  options: DirectionsOptions = {}
): Promise<DirectionsResult | null> {
  // Check if Google Maps is loaded
  if (typeof google === 'undefined' || !google.maps) {
    console.warn('Google Maps not loaded yet')
    return null
  }

  try {
    const directionsService = new google.maps.DirectionsService()

    const originLatLng = typeof origin === 'string' 
      ? origin 
      : new google.maps.LatLng(origin.lat, origin.lng)
    
    const destLatLng = typeof destination === 'string' 
      ? destination 
      : new google.maps.LatLng(destination.lat, destination.lng)

    const request: google.maps.DirectionsRequest = {
      origin: originLatLng,
      destination: destLatLng,
      travelMode: google.maps.TravelMode.DRIVING,
    }

    if (options.avoid && options.avoid.length > 0) {
      request.avoidTolls = options.avoid.includes('tolls')
      request.avoidHighways = options.avoid.includes('highways')
      request.avoidFerries = options.avoid.includes('ferries')
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

    if (options.alternatives) {
      request.provideRouteAlternatives = true
    }

    const result = await new Promise<google.maps.DirectionsResult | null>((resolve, reject) => {
      directionsService.route(request, (result, status) => {
        if (status === google.maps.DirectionsStatus.OK && result) {
          resolve(result)
        } else {
          console.warn('Directions request failed:', status)
          resolve(null)
        }
      })
    })

    if (!result || !result.routes || result.routes.length === 0) {
      return null
    }

    const route = result.routes[0]
    const leg = route.legs[0]

    return {
      distance: {
        value: leg.distance?.value || 0,
        text: leg.distance?.text || '0 mi',
      },
      duration: {
        value: leg.duration?.value || 0,
        text: leg.duration?.text || '0 mins',
      },
      duration_in_traffic: leg.duration_in_traffic ? {
        value: leg.duration_in_traffic.value,
        text: leg.duration_in_traffic.text,
      } : undefined,
      polyline: route.overview_polyline || '',
      start_address: leg.start_address || '',
      end_address: leg.end_address || '',
      steps: leg.steps.map(step => ({
        distance: {
          value: step.distance?.value || 0,
          text: step.distance?.text || '0 mi',
        },
        duration: {
          value: step.duration?.value || 0,
          text: step.duration?.text || '0 mins',
        },
        html_instructions: step.instructions || '',
        polyline: step.encoded_lat_lngs?.toString() || '',
      })),
    }
  } catch (error) {
    console.error('Directions error:', error)
    return null
  }
}

/**
 * Get directions with waypoints (multi-stop route)
 */
export async function getDirectionsWithWaypoints(
  origin: Coordinates | string,
  destination: Coordinates | string,
  waypoints: (Coordinates | string)[],
  optimize: boolean = true
): Promise<DirectionsResult | null> {
  if (typeof google === 'undefined' || !google.maps) {
    console.warn('Google Maps not loaded yet')
    return null
  }

  try {
    const directionsService = new google.maps.DirectionsService()

    const originLatLng = typeof origin === 'string' 
      ? origin 
      : new google.maps.LatLng(origin.lat, origin.lng)
    
    const destLatLng = typeof destination === 'string' 
      ? destination 
      : new google.maps.LatLng(destination.lat, destination.lng)

    const waypointsArray: google.maps.DirectionsWaypoint[] = waypoints.map(wp => ({
      location: typeof wp === 'string' 
        ? wp 
        : new google.maps.LatLng(wp.lat, wp.lng),
      stopover: true,
    }))

    const request: google.maps.DirectionsRequest = {
      origin: originLatLng,
      destination: destLatLng,
      waypoints: waypointsArray,
      optimizeWaypoints: optimize,
      travelMode: google.maps.TravelMode.DRIVING,
    }

    const result = await new Promise<google.maps.DirectionsResult | null>((resolve) => {
      directionsService.route(request, (result, status) => {
        if (status === google.maps.DirectionsStatus.OK && result) {
          resolve(result)
        } else {
          console.warn('Directions request failed:', status)
          resolve(null)
        }
      })
    })

    if (!result || !result.routes || result.routes.length === 0) {
      return null
    }

    const route = result.routes[0]
    const leg = route.legs[0]

    return {
      distance: {
        value: leg.distance?.value || 0,
        text: leg.distance?.text || '0 mi',
      },
      duration: {
        value: leg.duration?.value || 0,
        text: leg.duration?.text || '0 mins',
      },
      duration_in_traffic: leg.duration_in_traffic ? {
        value: leg.duration_in_traffic.value,
        text: leg.duration_in_traffic.text,
      } : undefined,
      polyline: route.overview_polyline || '',
      start_address: leg.start_address || '',
      end_address: leg.end_address || '',
      steps: leg.steps.map(step => ({
        distance: {
          value: step.distance?.value || 0,
          text: step.distance?.text || '0 mi',
        },
        duration: {
          value: step.duration?.value || 0,
          text: step.duration?.text || '0 mins',
        },
        html_instructions: step.instructions || '',
        polyline: step.encoded_lat_lngs?.toString() || '',
      })),
    }
  } catch (error) {
    console.error('Directions error:', error)
    return null
  }
}

/**
 * Calculate ETA based on current location and destination with traffic
 */
export async function calculateETA(
  currentLocation: Coordinates,
  destination: Coordinates
): Promise<Date | null> {
  const directions = await getDirections(
    currentLocation,
    destination,
    { 
      departureTime: new Date(),
      trafficModel: 'best_guess'
    }
  )

  if (!directions) return null

  const durationSeconds = directions.duration_in_traffic?.value || directions.duration.value
  const eta = new Date(Date.now() + durationSeconds * 1000)
  
  return eta
}


