import { Coordinates } from './types/database.types'

export interface GeocodeResult {
  coordinates: Coordinates
  formatted_address: string
  accuracy: 'ROOFTOP' | 'RANGE_INTERPOLATED' | 'GEOMETRIC_CENTER' | 'APPROXIMATE'
}

/**
 * Geocode an address to coordinates using Google Geocoding API
 */
export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  
  if (!apiKey || !address) {
    console.warn('Missing API key or address for geocoding')
    return null
  }

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`
    )
    
    if (!response.ok) {
      console.error('Geocoding API error:', response.statusText)
      return null
    }

    const data = await response.json()

    if (data.status !== 'OK' || !data.results || data.results.length === 0) {
      console.warn('Geocoding failed:', data.status, data.error_message)
      return null
    }

    const result = data.results[0]
    
    return {
      coordinates: {
        lat: result.geometry.location.lat,
        lng: result.geometry.location.lng,
      },
      formatted_address: result.formatted_address,
      accuracy: result.geometry.location_type as GeocodeResult['accuracy']
    }
  } catch (error) {
    console.error('Geocoding error:', error)
    return null
  }
}

/**
 * Reverse geocode coordinates to an address
 */
export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  
  if (!apiKey) {
    console.warn('Missing API key for reverse geocoding')
    return null
  }

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`
    )
    
    if (!response.ok) {
      console.error('Reverse geocoding API error:', response.statusText)
      return null
    }

    const data = await response.json()

    if (data.status !== 'OK' || !data.results || data.results.length === 0) {
      console.warn('Reverse geocoding failed:', data.status)
      return null
    }

    return data.results[0].formatted_address
  } catch (error) {
    console.error('Reverse geocoding error:', error)
    return null
  }
}

/**
 * Batch geocode multiple addresses
 */
export async function batchGeocode(addresses: string[]): Promise<(GeocodeResult | null)[]> {
  // Note: This uses sequential requests. For production, consider using a backend batch endpoint
  // to avoid CORS issues and rate limits
  const results: (GeocodeResult | null)[] = []
  
  for (const address of addresses) {
    const result = await geocodeAddress(address)
    results.push(result)
    // Add small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  
  return results
}



