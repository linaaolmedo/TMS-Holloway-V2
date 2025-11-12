import { Coordinates } from '../types/database.types'

export interface DriverLocationData {
  driver_id: string
  driver_name: string
  latitude: number
  longitude: number
  heading?: number
  speed?: number
  accuracy?: number
  timestamp: string
  isStale: boolean
  minutesAgo: number
}

/**
 * Check if a driver location is stale (older than 5 minutes)
 */
export function isLocationStale(timestamp: string): boolean {
  const locationTime = new Date(timestamp).getTime()
  const now = Date.now()
  const fiveMinutes = 5 * 60 * 1000
  return now - locationTime > fiveMinutes
}

/**
 * Calculate how many minutes ago a location was updated
 */
export function getMinutesAgo(timestamp: string): number {
  const locationTime = new Date(timestamp).getTime()
  const now = Date.now()
  return Math.floor((now - locationTime) / (60 * 1000))
}

/**
 * Format location staleness as human-readable text
 */
export function formatLocationAge(timestamp: string): string {
  const minutes = getMinutesAgo(timestamp)
  
  if (minutes < 1) return 'Just now'
  if (minutes === 1) return '1 minute ago'
  if (minutes < 60) return `${minutes} minutes ago`
  
  const hours = Math.floor(minutes / 60)
  if (hours === 1) return '1 hour ago'
  if (hours < 24) return `${hours} hours ago`
  
  const days = Math.floor(hours / 24)
  if (days === 1) return '1 day ago'
  return `${days} days ago`
}

/**
 * Calculate straight-line distance between two coordinates in miles
 * Uses Haversine formula
 */
export function calculateDistance(
  from: Coordinates,
  to: Coordinates
): number {
  const R = 3959 // Earth's radius in miles
  const dLat = toRad(to.lat - from.lat)
  const dLng = toRad(to.lng - from.lng)
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(from.lat)) *
    Math.cos(toRad(to.lat)) *
    Math.sin(dLng / 2) *
    Math.sin(dLng / 2)
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180)
}

/**
 * Find the closest driver to a given location
 */
export function findClosestDriver(
  location: Coordinates,
  drivers: Array<{ driver_id: string; location: Coordinates }>
): { driver_id: string; distance: number } | null {
  if (drivers.length === 0) return null
  
  let closest: { driver_id: string; distance: number } | null = null
  let minDistance = Infinity
  
  for (const driver of drivers) {
    const distance = calculateDistance(location, driver.location)
    if (distance < minDistance) {
      minDistance = distance
      closest = { driver_id: driver.driver_id, distance }
    }
  }
  
  return closest
}

/**
 * Get status color based on location staleness
 */
export function getLocationStatusColor(timestamp: string): string {
  const minutes = getMinutesAgo(timestamp)
  
  if (minutes < 5) return '#10b981' // green - fresh
  if (minutes < 15) return '#eab308' // yellow - getting old
  return '#6b7280' // gray - stale
}

/**
 * Filter drivers to only those with recent locations (< 1 hour)
 */
export function getActiveDrivers<T extends { timestamp: string }>(
  drivers: T[]
): T[] {
  const oneHourAgo = Date.now() - (60 * 60 * 1000)
  return drivers.filter(driver => {
    const locationTime = new Date(driver.timestamp).getTime()
    return locationTime > oneHourAgo
  })
}



