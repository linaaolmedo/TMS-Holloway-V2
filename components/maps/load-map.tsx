'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import { Marker, useMap } from '@vis.gl/react-google-maps'
import { BaseMap } from './base-map'
import { Polyline } from './polyline'
import { DirectionsPolyline } from './directions-polyline'
import { ResetViewButton } from './reset-view-button'
import { Coordinates } from '@/lib/types/database.types'
import { MapPin, Package } from 'lucide-react'

interface LoadMapProps {
  pickupLocation: string
  deliveryLocation: string
  pickupCoords?: Coordinates
  deliveryCoords?: Coordinates
  driverLocation?: Coordinates
  showRoute?: boolean
  className?: string
}

function MapMarkers({
  pickupCoords,
  deliveryCoords,
  driverLocation,
  pickupLocation,
  deliveryLocation,
  onResetView,
}: {
  pickupCoords?: Coordinates
  deliveryCoords?: Coordinates
  driverLocation?: Coordinates
  pickupLocation: string
  deliveryLocation: string
  onResetView?: (resetFn: () => void) => void
}) {
  const map = useMap()

  // Function to fit bounds to show all markers
  const fitBoundsToMarkers = useCallback(() => {
    if (!map || !pickupCoords || !deliveryCoords) return

    const bounds = new google.maps.LatLngBounds()
    bounds.extend(pickupCoords)
    bounds.extend(deliveryCoords)
    if (driverLocation) {
      bounds.extend(driverLocation)
    }
    
    map.fitBounds(bounds, 50)
  }, [map, pickupCoords, deliveryCoords, driverLocation])

  // Fit bounds when coordinates change
  useEffect(() => {
    fitBoundsToMarkers()
  }, [fitBoundsToMarkers])

  // Expose reset function to parent
  useEffect(() => {
    if (onResetView) {
      onResetView(fitBoundsToMarkers)
    }
  }, [fitBoundsToMarkers, onResetView])

  return (
    <>
      {/* Route line from pickup to delivery - follows actual roads */}
      {pickupCoords && deliveryCoords && (
        <DirectionsPolyline
          origin={pickupCoords}
          destination={deliveryCoords}
          strokeColor="#8b5cf6"
          strokeOpacity={0.6}
          strokeWeight={3}
        />
      )}
      
      {/* Route line from driver to next destination - follows actual roads */}
      {driverLocation && pickupCoords && (
        <DirectionsPolyline
          origin={driverLocation}
          destination={pickupCoords}
          strokeColor="#3b82f6"
          strokeOpacity={0.4}
          strokeWeight={2}
        />
      )}

      {pickupCoords && (
        <Marker
          position={pickupCoords}
          title={`Pickup: ${pickupLocation}`}
          icon={{
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: '#10b981',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2,
            scale: 10,
          }}
        />
      )}
      {deliveryCoords && (
        <Marker
          position={deliveryCoords}
          title={`Delivery: ${deliveryLocation}`}
          icon={{
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: '#ef4444',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2,
            scale: 10,
          }}
        />
      )}
      {driverLocation && (
        <Marker
          position={driverLocation}
          title="Driver Location"
          icon={{
            path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
            fillColor: '#3b82f6',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2,
            scale: 6,
          }}
        />
      )}
    </>
  )
}

export function LoadMap({
  pickupLocation,
  deliveryLocation,
  pickupCoords,
  deliveryCoords,
  driverLocation,
  showRoute = false,
  className = 'h-[400px] w-full',
}: LoadMapProps) {
  const [resetViewFn, setResetViewFn] = useState<(() => void) | null>(null)

  // Calculate center point
  const center = useMemo(() => {
    if (pickupCoords && deliveryCoords) {
      return {
        lat: (pickupCoords.lat + deliveryCoords.lat) / 2,
        lng: (pickupCoords.lng + deliveryCoords.lng) / 2,
      }
    }
    if (pickupCoords) return pickupCoords
    if (deliveryCoords) return deliveryCoords
    return { lat: 39.8283, lng: -98.5795 }
  }, [pickupCoords, deliveryCoords])

  return (
    <div className="space-y-3">
      <div className="relative">
        <BaseMap center={center} zoom={6} className={className}>
          <MapMarkers
            pickupCoords={pickupCoords}
            deliveryCoords={deliveryCoords}
            driverLocation={driverLocation}
            pickupLocation={pickupLocation}
            deliveryLocation={deliveryLocation}
            onResetView={(fn) => setResetViewFn(() => fn)}
          />
        </BaseMap>
        {resetViewFn && pickupCoords && deliveryCoords && (
          <div className="absolute top-3 right-3 z-10">
            <ResetViewButton onClick={resetViewFn} />
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-sm flex-wrap">
        {pickupCoords && (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-gray-400">Pickup</span>
          </div>
        )}
        {deliveryCoords && (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-gray-400">Delivery</span>
          </div>
        )}
        {driverLocation && (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-gray-400">Driver</span>
          </div>
        )}
        {pickupCoords && deliveryCoords && (
          <div className="flex items-center gap-2">
            <div className="w-6 h-0.5 bg-purple-500"></div>
            <span className="text-gray-400">Route</span>
          </div>
        )}
        {driverLocation && pickupCoords && (
          <div className="flex items-center gap-2">
            <div className="w-6 h-0.5 bg-blue-500 opacity-40"></div>
            <span className="text-gray-400">Driver Route (Estimated)</span>
          </div>
        )}
      </div>
    </div>
  )
}



