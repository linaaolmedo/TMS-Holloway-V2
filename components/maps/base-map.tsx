'use client'

import { APIProvider, Map } from '@vis.gl/react-google-maps'
import { ReactNode } from 'react'

interface BaseMapProps {
  children?: ReactNode
  center?: { lat: number; lng: number }
  zoom?: number
  className?: string
  mapId?: string
  onCenterChanged?: (center: { lat: number; lng: number }) => void
  onZoomChanged?: (zoom: number) => void
}

export function BaseMap({
  children,
  center = { lat: 39.8283, lng: -98.5795 }, // Center of USA
  zoom = 5,
  className = 'h-[400px] w-full',
  mapId = 'tms-map',
  onCenterChanged,
  onZoomChanged,
}: BaseMapProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  if (!apiKey) {
    return (
      <div className={`bg-navy-lighter border border-gray-700 rounded-lg p-8 flex items-center justify-center ${className}`}>
        <div className="text-center">
          <p className="text-gray-400 mb-2">Google Maps API key not configured</p>
          <p className="text-sm text-gray-500">
            Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your .env.local file
          </p>
        </div>
      </div>
    )
  }

  return (
    <APIProvider apiKey={apiKey}>
      <div className={className}>
        <Map
          defaultCenter={center}
          defaultZoom={zoom}
          mapId={mapId}
          gestureHandling="greedy"
          disableDefaultUI={false}
          className="rounded-lg overflow-hidden w-full h-full"
          onCenterChanged={(e) => {
            if (onCenterChanged && e.detail.center) {
              onCenterChanged(e.detail.center)
            }
          }}
          onZoomChanged={(e) => {
            if (onZoomChanged && e.detail.zoom) {
              onZoomChanged(e.detail.zoom)
            }
          }}
        >
          {children}
        </Map>
      </div>
    </APIProvider>
  )
}



