'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { BaseMap } from '@/components/maps/base-map'
import { AdvancedMarker, Pin, useMap } from '@vis.gl/react-google-maps'
import { ResetViewButton } from '@/components/maps/reset-view-button'
import { Navigation } from 'lucide-react'

interface Load {
  id: number
  load_number: string
  status: string
  pickup_location: string
  delivery_location: string
  pickup_coords?: { lat: number; lng: number }
  delivery_coords?: { lat: number; lng: number }
}

interface ActiveLoadsMapProps {
  loads: Load[]
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'pending_pickup':
      return '#f97316' // orange
    case 'in_transit':
      return '#10b981' // green
    default:
      return '#3b82f6' // blue
  }
}

function MapMarkers({ 
  loads, 
  onResetView 
}: { 
  loads: Load[]
  onResetView?: (resetFn: () => void) => void 
}) {
  const map = useMap()

  // Function to fit bounds to show all markers
  const fitBoundsToMarkers = useCallback(() => {
    if (!map) return

    const bounds = new google.maps.LatLngBounds()
    let hasPoints = false

    loads.forEach(load => {
      if (load.pickup_coords) {
        bounds.extend(load.pickup_coords)
        hasPoints = true
      }
      if (load.delivery_coords) {
        bounds.extend(load.delivery_coords)
        hasPoints = true
      }
    })

    if (hasPoints) {
      map.fitBounds(bounds, 80)
    }
  }, [map, loads])

  // Fit bounds on initial load
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
      {loads.map((load) => (
        <div key={load.id}>
          {load.pickup_coords && (
            <AdvancedMarker
              position={load.pickup_coords}
              title={`Pickup: ${load.load_number}`}
            >
              <Pin
                background={getStatusColor(load.status)}
                borderColor="#fff"
                glyphColor="#fff"
              />
            </AdvancedMarker>
          )}
          {load.delivery_coords && (
            <AdvancedMarker
              position={load.delivery_coords}
              title={`Delivery: ${load.load_number}`}
            >
              <Pin
                background="#6b7280"
                borderColor="#fff"
                glyphColor="#fff"
              />
            </AdvancedMarker>
          )}
        </div>
      ))}
    </>
  )
}

export function ActiveLoadsMap({ loads }: ActiveLoadsMapProps) {
  const defaultCenter = { lat: 39.8283, lng: -98.5795 } // Center of US
  const [resetViewFn, setResetViewFn] = useState<(() => void) | null>(null)
  
  // Filter loads that have coordinates
  const loadsWithCoords = loads.filter(load => load.pickup_coords || load.delivery_coords)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Navigation className="h-5 w-5 text-blue-500" />
            Real-Time Tracking
          </div>
          <span className="text-sm font-normal text-gray-400">
            {loadsWithCoords.length} active load{loadsWithCoords.length !== 1 ? 's' : ''}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative h-[400px] rounded-lg overflow-hidden border border-gray-700">
          <BaseMap
            center={defaultCenter}
            zoom={4}
          >
            <MapMarkers 
              loads={loadsWithCoords} 
              onResetView={(fn) => setResetViewFn(() => fn)}
            />
          </BaseMap>
          {resetViewFn && loadsWithCoords.length > 0 && (
            <div className="absolute top-3 right-3 z-10">
              <ResetViewButton onClick={resetViewFn} />
            </div>
          )}
        </div>
        <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-orange-500" />
            <span>Pending Pickup</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span>In Transit</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-gray-500" />
            <span>Delivery Point</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

