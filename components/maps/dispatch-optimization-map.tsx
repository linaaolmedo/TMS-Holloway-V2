'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { Marker, useMap } from '@vis.gl/react-google-maps'
import { BaseMap } from './base-map'
import { DirectionsPolyline } from './directions-polyline'
import { ResetViewButton } from './reset-view-button'
import { Coordinates } from '@/lib/types/database.types'
import { MapLegend } from './map-legend'

interface Load {
  id: number
  load_number: string
  pickup_location: string
  delivery_location: string
  pickup_coords?: Coordinates
  delivery_coords?: Coordinates
  status: string
  equipment_type?: string
  customer_rate?: number
  carrier_rate?: number
}

interface Driver {
  id: string
  name: string
  location?: Coordinates
  available: boolean
}

interface DispatchOptimizationMapProps {
  loads: Load[]
  drivers: Driver[]
  selectedLoadId?: number
  selectedDriverId?: string
  onLoadClick?: (loadId: number) => void
  onDriverClick?: (driverId: string) => void
  className?: string
}

function MapMarkers({
  loads,
  drivers,
  selectedLoadId,
  selectedDriverId,
  onLoadClick,
  onDriverClick,
  onResetView,
}: {
  loads: Load[]
  drivers: Driver[]
  selectedLoadId?: number
  selectedDriverId?: string
  onLoadClick?: (loadId: number) => void
  onDriverClick?: (driverId: string) => void
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

    drivers.forEach(driver => {
      if (driver.location) {
        bounds.extend(driver.location)
        hasPoints = true
      }
    })

    if (hasPoints) {
      map.fitBounds(bounds, 80)
    }
  }, [map, loads, drivers])

  // Fit bounds to show all markers
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
      {/* Route lines between pickup and delivery - follows actual roads */}
      {loads.map(load => {
        if (!load.pickup_coords || !load.delivery_coords) return null
        
        const isPending = load.status === 'pending_pickup' || load.status === 'posted'
        
        return (
          <DirectionsPolyline
            key={`route-${load.id}`}
            origin={load.pickup_coords}
            destination={load.delivery_coords}
            strokeColor={isPending ? '#eab308' : '#3b82f6'}
            strokeOpacity={0.5}
            strokeWeight={2}
          />
        )
      })}

      {/* Load markers (pickup locations) */}
      {loads.map(load => {
        if (!load.pickup_coords) return null

        const isSelected = selectedLoadId === load.id
        const isPending = load.status === 'pending_pickup' || load.status === 'posted'
        
        return (
          <Marker
            key={`pickup-${load.id}`}
            position={load.pickup_coords}
            title={`${load.load_number || `Load #${load.id}`} - Pickup`}
            onClick={() => onLoadClick?.(load.id)}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              fillColor: isPending ? '#eab308' : '#3b82f6',
              fillOpacity: isSelected ? 1 : 0.7,
              strokeColor: isSelected ? '#ffffff' : '#1f2937',
              strokeWeight: isSelected ? 3 : 2,
              scale: isSelected ? 12 : 10,
            }}
          />
        )
      })}

      {/* Load markers (delivery locations) */}
      {loads.map(load => {
        if (!load.delivery_coords) return null

        const isPending = load.status === 'pending_pickup' || load.status === 'posted'
        
        return (
          <Marker
            key={`delivery-${load.id}`}
            position={load.delivery_coords}
            title={`${load.load_number || `Load #${load.id}`} - Delivery`}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              fillColor: isPending ? '#eab308' : '#3b82f6',
              fillOpacity: 0.4,
              strokeColor: '#1f2937',
              strokeWeight: 2,
              scale: 7,
            }}
          />
        )
      })}

      {/* Driver markers */}
      {drivers.map(driver => {
        if (!driver.location) return null

        const isSelected = selectedDriverId === driver.id
        
        return (
          <Marker
            key={`driver-${driver.id}`}
            position={driver.location}
            title={driver.name}
            onClick={() => onDriverClick?.(driver.id)}
            icon={{
              path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
              fillColor: driver.available ? '#10b981' : '#6b7280',
              fillOpacity: 1,
              strokeColor: isSelected ? '#ffffff' : '#1f2937',
              strokeWeight: isSelected ? 3 : 2,
              scale: isSelected ? 9 : 7,
            }}
          />
        )
      })}
    </>
  )
}

export function DispatchOptimizationMap({
  loads,
  drivers,
  selectedLoadId,
  selectedDriverId,
  onLoadClick,
  onDriverClick,
  className = 'h-[600px] w-full',
}: DispatchOptimizationMapProps) {
  const [resetViewFn, setResetViewFn] = useState<(() => void) | null>(null)

  // Calculate center based on all markers
  const center = useMemo(() => {
    const allCoords: Coordinates[] = []
    
    loads.forEach(load => {
      if (load.pickup_coords) allCoords.push(load.pickup_coords)
    })
    
    drivers.forEach(driver => {
      if (driver.location) allCoords.push(driver.location)
    })

    if (allCoords.length === 0) {
      return { lat: 39.8283, lng: -98.5795 } // Center of USA
    }

    const avgLat = allCoords.reduce((sum, coord) => sum + coord.lat, 0) / allCoords.length
    const avgLng = allCoords.reduce((sum, coord) => sum + coord.lng, 0) / allCoords.length

    return { lat: avgLat, lng: avgLng }
  }, [loads, drivers])

  // Count markers for display
  const markerCounts = useMemo(() => {
    const loadsWithCoords = loads.filter(l => l.pickup_coords).length
    const driversWithLocation = drivers.filter(d => d.location).length
    return { loads: loadsWithCoords, drivers: driversWithLocation }
  }, [loads, drivers])

  const legendItems = [
    { color: '#eab308', label: 'Pending Loads (Pickup)', icon: 'circle' as const },
    { color: '#3b82f6', label: 'Posted Loads (Pickup)', icon: 'circle' as const },
    { color: '#ffffff', label: 'Delivery Location (smaller, faded)', icon: 'circle' as const },
    { color: '#10b981', label: 'Available Drivers', icon: 'arrow' as const },
    { color: '#6b7280', label: 'Busy Drivers', icon: 'arrow' as const },
    { color: '#808080', label: 'Route Line (color matches load status)', icon: 'line' as const },
  ]

  return (
    <div className="space-y-3">
      {markerCounts.loads === 0 && markerCounts.drivers === 0 ? (
        <div className={`bg-navy-lighter border border-gray-700 rounded-lg flex items-center justify-center ${className}`}>
          <div className="text-center p-8">
            <p className="text-gray-400 mb-2">No location data available</p>
            <p className="text-sm text-gray-500">
              Run the seeder script to populate driver locations and geocode loads
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="relative">
            <BaseMap center={center} zoom={6} className={className}>
              <MapMarkers
                loads={loads}
                drivers={drivers}
                selectedLoadId={selectedLoadId}
                selectedDriverId={selectedDriverId}
                onLoadClick={onLoadClick}
                onDriverClick={onDriverClick}
                onResetView={(fn) => setResetViewFn(() => fn)}
              />
            </BaseMap>
            {resetViewFn && (
              <div className="absolute top-3 right-3 z-10">
                <ResetViewButton onClick={resetViewFn} />
              </div>
            )}
          </div>

          <MapLegend items={legendItems} />
        </>
      )}
    </div>
  )
}

