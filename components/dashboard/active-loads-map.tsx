'use client'

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { BaseMap } from '@/components/maps/base-map'
import { AdvancedMarker, Pin } from '@vis.gl/react-google-maps'
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

export function ActiveLoadsMap({ loads }: ActiveLoadsMapProps) {
  const defaultCenter = { lat: 39.8283, lng: -98.5795 } // Center of US
  
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
        <div className="h-[400px] rounded-lg overflow-hidden border border-gray-700">
          <BaseMap
            center={defaultCenter}
            zoom={4}
          >
            {loadsWithCoords.map((load) => (
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
          </BaseMap>
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

