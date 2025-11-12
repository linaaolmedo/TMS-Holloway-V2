'use client'

import { useEffect, useState, useCallback } from 'react'
import { updateDriverLocation } from '@/app/actions/locations'
import { MapPin, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface LocationTrackerProps {
  enabled?: boolean
  updateInterval?: number // milliseconds
  onLocationUpdate?: (position: GeolocationPosition) => void
}

export function LocationTracker({
  enabled = false,
  updateInterval = 30000, // 30 seconds default
  onLocationUpdate,
}: LocationTrackerProps) {
  const [isTracking, setIsTracking] = useState(enabled)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [watchId, setWatchId] = useState<number | null>(null)

  const updateLocation = useCallback(
    async (position: GeolocationPosition) => {
      try {
        const result = await updateDriverLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          heading: position.coords.heading || undefined,
          speed: position.coords.speed || undefined,
          accuracy: position.coords.accuracy,
        })

        if (result.success) {
          setLastUpdate(new Date())
          setError(null)
          onLocationUpdate?.(position)
        } else {
          setError(result.error || 'Failed to update location')
        }
      } catch (err) {
        console.error('Error updating location:', err)
        setError('Failed to update location')
      }
    },
    [onLocationUpdate]
  )

  const handleError = useCallback((err: GeolocationPositionError) => {
    switch (err.code) {
      case err.PERMISSION_DENIED:
        setError('Location permission denied')
        break
      case err.POSITION_UNAVAILABLE:
        setError('Location unavailable')
        break
      case err.TIMEOUT:
        setError('Location request timeout')
        break
      default:
        setError('Unknown location error')
    }
    setIsTracking(false)
  }, [])

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported')
      return
    }

    setIsTracking(true)
    setError(null)

    // Get initial position
    navigator.geolocation.getCurrentPosition(
      updateLocation,
      handleError,
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    )

    // Watch position for continuous updates
    const id = navigator.geolocation.watchPosition(
      updateLocation,
      handleError,
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: updateInterval,
      }
    )

    setWatchId(id)
  }, [updateLocation, handleError, updateInterval])

  const stopTracking = useCallback(() => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId)
      setWatchId(null)
    }
    setIsTracking(false)
  }, [watchId])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId)
      }
    }
  }, [watchId])

  return (
    <div className="bg-navy-lighter border border-gray-700 rounded-lg p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className={`h-5 w-5 ${isTracking ? 'text-green-500' : 'text-gray-500'}`} />
            <h3 className="text-sm font-semibold text-white">Location Sharing</h3>
          </div>
          
          {isTracking && lastUpdate && (
            <p className="text-xs text-gray-400">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </p>
          )}
          
          {error && (
            <div className="flex items-center gap-2 mt-2 text-red-400 text-xs">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <Button
          size="sm"
          variant={isTracking ? 'danger' : 'default'}
          onClick={isTracking ? stopTracking : startTracking}
        >
          {isTracking ? 'Stop Sharing' : 'Start Sharing'}
        </Button>
      </div>

      {isTracking && (
        <div className="mt-3 pt-3 border-t border-gray-700">
          <p className="text-xs text-gray-500">
            Your location is being shared every {updateInterval / 1000} seconds while on active loads
          </p>
        </div>
      )}
    </div>
  )
}



