'use client'

import { useEffect, useState } from 'react'
import { BaseMap } from './base-map'
import { DriverLocationMarker } from './driver-location-marker'
import { LoadMap } from './load-map'
import { ETADisplay } from './eta-display'
import { Coordinates } from '@/lib/types/database.types'
import { getLoadTracking } from '@/app/actions/tracking'
import { Loader2 } from 'lucide-react'

interface LiveTrackingMapProps {
  loadId: number
  pickupLocation: string
  deliveryLocation: string
  pickupCoords?: Coordinates
  deliveryCoords?: Coordinates
  className?: string
  pollingInterval?: number // milliseconds
}

export function LiveTrackingMap({
  loadId,
  pickupLocation,
  deliveryLocation,
  pickupCoords,
  deliveryCoords,
  className = 'h-[500px] w-full',
  pollingInterval = 30000, // 30 seconds default
}: LiveTrackingMapProps) {
  const [driverLocation, setDriverLocation] = useState<Coordinates | undefined>()
  const [eta, setEta] = useState<string | null>(null)
  const [destination, setDestination] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  useEffect(() => {
    let isMounted = true

    const fetchTracking = async () => {
      try {
        const result = await getLoadTracking(loadId)
        
        if (!isMounted) return

        if (result.success && result.data) {
          const { tracking, driver_location } = result.data

          if (driver_location) {
            setDriverLocation({
              lat: driver_location.latitude,
              lng: driver_location.longitude,
            })
          }

          if (tracking) {
            // Determine which ETA to show based on status
            if (tracking.status === 'en_route_pickup' && tracking.eta_pickup) {
              setEta(tracking.eta_pickup)
              setDestination(pickupLocation)
            } else if (
              ['en_route_delivery', 'at_pickup'].includes(tracking.status || '') &&
              tracking.eta_delivery
            ) {
              setEta(tracking.eta_delivery)
              setDestination(deliveryLocation)
            }
          }

          setLastUpdate(new Date())
        }
        
        setLoading(false)
      } catch (error) {
        console.error('Error fetching tracking:', error)
        setLoading(false)
      }
    }

    // Initial fetch
    fetchTracking()

    // Poll for updates
    const interval = setInterval(fetchTracking, pollingInterval)

    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [loadId, pickupLocation, deliveryLocation, pollingInterval])

  if (loading) {
    return (
      <div className={`bg-navy-lighter border border-gray-700 rounded-lg flex items-center justify-center ${className}`}>
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
          <p className="text-sm text-gray-400">Loading tracking data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <LoadMap
        pickupLocation={pickupLocation}
        deliveryLocation={deliveryLocation}
        pickupCoords={pickupCoords}
        deliveryCoords={deliveryCoords}
        driverLocation={driverLocation}
        className={className}
      />

      {eta && destination && (
        <ETADisplay eta={eta} destination={destination} />
      )}

      {lastUpdate && (
        <p className="text-xs text-gray-500 text-center">
          Last updated: {lastUpdate.toLocaleTimeString()}
        </p>
      )}

      {!driverLocation && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
          <p className="text-sm text-yellow-400">
            Driver location not available. Location sharing may be disabled.
          </p>
        </div>
      )}
    </div>
  )
}



