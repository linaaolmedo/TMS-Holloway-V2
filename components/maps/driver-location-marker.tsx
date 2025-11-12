'use client'

import { Marker } from '@vis.gl/react-google-maps'
import { Coordinates } from '@/lib/types/database.types'

interface DriverLocationMarkerProps {
  position: Coordinates
  heading?: number
  driverName?: string
  isActive?: boolean
}

export function DriverLocationMarker({
  position,
  heading = 0,
  driverName,
  isActive = true,
}: DriverLocationMarkerProps) {
  return (
    <Marker
      position={position}
      title={driverName || 'Driver Location'}
      icon={{
        path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
        fillColor: isActive ? '#3b82f6' : '#6b7280',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2,
        scale: 7,
        rotation: heading,
      }}
    />
  )
}



