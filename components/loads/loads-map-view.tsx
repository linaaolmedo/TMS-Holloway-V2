'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { Marker, InfoWindow, useMap } from '@vis.gl/react-google-maps'
import { BaseMap } from '@/components/maps/base-map'
import { MapLegend } from '@/components/maps/map-legend'
import { Polyline } from '@/components/maps/polyline'
import { ResetViewButton } from '@/components/maps/reset-view-button'
import { Coordinates } from '@/lib/types/database.types'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { X, Package, MapPin, Calendar } from 'lucide-react'

interface Load {
  id: number
  load_number: string
  pickup_location: string
  delivery_location: string
  status: string
  customer?: { name: string } | null
  carrier?: { name: string } | null
  pickup_date?: string
  delivery_date?: string
  customer_rate?: number
}

interface LoadWithCoords extends Load {
  pickup_coords?: Coordinates
  delivery_coords?: Coordinates
}

interface LoadsMapViewProps {
  loads: Load[]
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'pending':
      return '#eab308' // yellow
    case 'posted':
      return '#3b82f6' // blue
    case 'in_transit':
      return '#10b981' // green
    case 'delivered':
      return '#6b7280' // gray
    case 'pending_pickup':
      return '#f97316' // orange
    default:
      return '#8b5cf6' // purple
  }
}

function getStatusLabel(status: string): string {
  return status.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ')
}

function MapMarkers({
  loads,
  onMarkerClick,
  onResetView,
}: {
  loads: LoadWithCoords[]
  onMarkerClick: (load: LoadWithCoords) => void
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

  // Fit bounds on initial load or when loads change
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
      {/* Route lines between pickup and delivery */}
      {loads.map(load => {
        if (!load.pickup_coords || !load.delivery_coords) return null

        return (
          <Polyline
            key={`route-${load.id}`}
            path={[load.pickup_coords, load.delivery_coords]}
            strokeColor={getStatusColor(load.status)}
            strokeOpacity={0.6}
            strokeWeight={3}
          />
        )
      })}

      {/* Pickup markers */}
      {loads.map(load => {
        if (!load.pickup_coords) return null

        return (
          <Marker
            key={`pickup-${load.id}`}
            position={load.pickup_coords}
            title={`${load.load_number || `Load #${load.id}`} - Pickup`}
            onClick={() => onMarkerClick(load)}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              fillColor: getStatusColor(load.status),
              fillOpacity: 0.8,
              strokeColor: '#ffffff',
              strokeWeight: 2,
              scale: 10,
            }}
          />
        )
      })}

      {/* Delivery markers */}
      {loads.map(load => {
        if (!load.delivery_coords) return null

        return (
          <Marker
            key={`delivery-${load.id}`}
            position={load.delivery_coords}
            title={`${load.load_number || `Load #${load.id}`} - Delivery`}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              fillColor: getStatusColor(load.status),
              fillOpacity: 0.5,
              strokeColor: '#ffffff',
              strokeWeight: 2,
              scale: 8,
            }}
          />
        )
      })}
    </>
  )
}

export function LoadsMapView({ loads }: LoadsMapViewProps) {
  const [loadsWithCoords, setLoadsWithCoords] = useState<LoadWithCoords[]>([])
  const [selectedLoad, setSelectedLoad] = useState<LoadWithCoords | null>(null)
  const [loading, setLoading] = useState(true)
  const [resetViewFn, setResetViewFn] = useState<(() => void) | null>(null)

  // Fetch coordinates for loads
  useEffect(() => {
    const fetchCoordinates = async () => {
      setLoading(true)
      
      // Import the action here to avoid dependency issues
      const { getLoadLocation } = await import('@/app/actions/locations')
      
      const loadsWithData = await Promise.all(
        loads.slice(0, 100).map(async (load) => {
          const result = await getLoadLocation(load.id)
          
          if (result.success && result.data) {
            return {
              ...load,
              pickup_coords: result.data.pickup_lat && result.data.pickup_lng
                ? { lat: result.data.pickup_lat, lng: result.data.pickup_lng }
                : undefined,
              delivery_coords: result.data.delivery_lat && result.data.delivery_lng
                ? { lat: result.data.delivery_lat, lng: result.data.delivery_lng }
                : undefined,
            }
          }
          
          return load
        })
      )
      
      setLoadsWithCoords(loadsWithData)
      setLoading(false)
    }

    fetchCoordinates()
  }, [loads])

  const center = useMemo(() => {
    const coordsArray = loadsWithCoords
      .map(l => l.pickup_coords)
      .filter((c): c is Coordinates => c !== undefined)

    if (coordsArray.length === 0) {
      return { lat: 39.8283, lng: -98.5795 } // Center of USA
    }

    const avgLat = coordsArray.reduce((sum, coord) => sum + coord.lat, 0) / coordsArray.length
    const avgLng = coordsArray.reduce((sum, coord) => sum + coord.lng, 0) / coordsArray.length

    return { lat: avgLat, lng: avgLng }
  }, [loadsWithCoords])

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    loadsWithCoords.forEach(load => {
      if (load.pickup_coords) {
        counts[load.status] = (counts[load.status] || 0) + 1
      }
    })
    return counts
  }, [loadsWithCoords])

  const legendItems = useMemo(() => {
    const statusItems = Object.keys(statusCounts).map(status => ({
      color: getStatusColor(status),
      label: `${getStatusLabel(status)} (${statusCounts[status]})`,
      icon: 'circle' as const,
    }))
    
    // Add generic legend items for pickup/delivery
    return [
      ...statusItems,
      { color: '#ffffff', label: 'Pickup Location (larger marker)', icon: 'circle' as const },
      { color: '#ffffff', label: 'Delivery Location (smaller marker)', icon: 'circle' as const },
      { color: '#808080', label: 'Route Line (color matches status)', icon: 'line' as const },
    ]
  }, [statusCounts])

  const loadsWithLocation = loadsWithCoords.filter(l => l.pickup_coords)

  if (loading) {
    return (
      <div className="h-[600px] w-full flex items-center justify-center bg-navy-lighter rounded-lg border border-gray-700">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading map data...</p>
        </div>
      </div>
    )
  }

  if (loadsWithLocation.length === 0) {
    return (
      <div className="h-[600px] w-full flex items-center justify-center bg-navy-lighter rounded-lg border border-gray-700">
        <div className="text-center p-8">
          <Package className="h-16 w-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 mb-2">No loads with location data</p>
          <p className="text-sm text-gray-500">
            Loads need to be geocoded before they can be displayed on the map
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-400">
          Showing {loadsWithLocation.length} of {loads.length} loads on map
        </div>
        {resetViewFn && (
          <ResetViewButton onClick={resetViewFn} />
        )}
      </div>

      <div className="relative">
        <BaseMap center={center} zoom={6} className="h-[600px] w-full">
          <MapMarkers 
            loads={loadsWithCoords} 
            onMarkerClick={setSelectedLoad}
            onResetView={(fn) => setResetViewFn(() => fn)}
          />
          
          {selectedLoad && selectedLoad.pickup_coords && (
            <InfoWindow
              position={selectedLoad.pickup_coords}
              onCloseClick={() => setSelectedLoad(null)}
            >
              <div className="p-2 min-w-[280px]">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {selectedLoad.load_number || `Load #${selectedLoad.id}`}
                    </h3>
                    <Badge variant="outline" className="mt-1">
                      {getStatusLabel(selectedLoad.status)}
                    </Badge>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm text-gray-700">
                  {selectedLoad.customer && (
                    <div className="flex items-start gap-2">
                      <Package className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>{selectedLoad.customer.name}</span>
                    </div>
                  )}
                  
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-green-600" />
                    <div>
                      <div className="font-medium">Pickup</div>
                      <div className="text-xs">{selectedLoad.pickup_location}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-red-600" />
                    <div>
                      <div className="font-medium">Delivery</div>
                      <div className="text-xs">{selectedLoad.delivery_location}</div>
                    </div>
                  </div>
                  
                  {selectedLoad.pickup_date && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(selectedLoad.pickup_date).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>
            </InfoWindow>
          )}
        </BaseMap>

        {legendItems.length > 0 && (
          <div className="mt-3">
            <MapLegend items={legendItems} />
          </div>
        )}
      </div>
    </div>
  )
}



