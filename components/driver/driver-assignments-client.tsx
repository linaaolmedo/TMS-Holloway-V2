'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import { MapPin, Calendar, Package } from 'lucide-react'
import { DriverStatusUpdate } from './driver-status-update'
import { LocationTracker } from './location-tracker'
import { LoadMap } from '@/components/maps/load-map'
import { getLoadLocation } from '@/app/actions/locations'
import { Coordinates } from '@/lib/types/database.types'

interface DriverAssignmentsClientProps {
  activeLoads: any[]
  completedLoads: any[]
}

export function DriverAssignmentsClient({ activeLoads, completedLoads }: DriverAssignmentsClientProps) {
  const [expandedLoadId, setExpandedLoadId] = useState<number | null>(null)
  const [loadCoordinates, setLoadCoordinates] = useState<Map<number, {
    pickup?: Coordinates
    delivery?: Coordinates
  }>>(new Map())

  // Load coordinates for the expanded load
  useEffect(() => {
    if (expandedLoadId && !loadCoordinates.has(expandedLoadId)) {
      getLoadLocation(expandedLoadId).then((result) => {
        if (result.success && result.data) {
          const coords: { pickup?: Coordinates; delivery?: Coordinates } = {}
          
          if (result.data.pickup_lat && result.data.pickup_lng) {
            coords.pickup = {
              lat: result.data.pickup_lat,
              lng: result.data.pickup_lng,
            }
          }
          
          if (result.data.delivery_lat && result.data.delivery_lng) {
            coords.delivery = {
              lat: result.data.delivery_lat,
              lng: result.data.delivery_lng,
            }
          }

          setLoadCoordinates(new Map(loadCoordinates.set(expandedLoadId, coords)))
        }
      })
    }
  }, [expandedLoadId, loadCoordinates])

  return (
    <>
      {/* Location Sharing */}
      {activeLoads.length > 0 && (
        <LocationTracker enabled={false} />
      )}

      {/* Active Assignments */}
      {activeLoads.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-base md:text-lg font-semibold text-white flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-xs font-bold">
              {activeLoads.length}
            </span>
            Active Assignments
          </h2>
          
          {activeLoads.map((load) => {
            const isExpanded = expandedLoadId === load.id
            const coords = loadCoordinates.get(load.id)

            return (
              <div key={load.id} className="space-y-3">
                <Card>
                  <CardContent className="pt-4 md:pt-6">
                    <div className="flex items-start justify-between mb-4 gap-2">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-base md:text-lg font-semibold text-white truncate">
                          {load.load_number || `Load #${load.id}`}
                        </h3>
                        <Badge variant={load.status} className="mt-1" />
                      </div>
                      <button
                        onClick={() => setExpandedLoadId(isExpanded ? null : load.id)}
                        className="text-xs text-primary hover:text-primary-hover whitespace-nowrap"
                      >
                        {isExpanded ? 'Hide Map' : 'Show Map'}
                      </button>
                    </div>

                    {/* Map View */}
                    {isExpanded && (
                      <div className="mb-4">
                        <LoadMap
                          pickupLocation={load.pickup_location}
                          deliveryLocation={load.delivery_location}
                          pickupCoords={coords?.pickup}
                          deliveryCoords={coords?.delivery}
                          className="h-[300px] w-full"
                        />
                      </div>
                    )}

                    <div className="space-y-3">
                      {/* Pickup */}
                      <div className="flex items-start gap-2 p-2 md:p-3 rounded-md bg-green-500/10 border border-green-500/20">
                        <MapPin className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-green-500">Pickup</p>
                          <p className="text-xs md:text-sm text-white mt-0.5 break-words">{load.pickup_location}</p>
                          <div className="flex items-center gap-1 mt-1">
                            <Calendar className="h-3 w-3 text-gray-400 flex-shrink-0" />
                            <span className="text-xs text-gray-400">{formatDate(load.pickup_time)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Delivery */}
                      <div className="flex items-start gap-2 p-2 md:p-3 rounded-md bg-red-500/10 border border-red-500/20">
                        <MapPin className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-red-500">Delivery</p>
                          <p className="text-xs md:text-sm text-white mt-0.5 break-words">{load.delivery_location}</p>
                          <div className="flex items-center gap-1 mt-1">
                            <Calendar className="h-3 w-3 text-gray-400 flex-shrink-0" />
                            <span className="text-xs text-gray-400">{formatDate(load.delivery_time)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Details Grid */}
                      <div className="grid grid-cols-2 gap-2 md:gap-3 p-2 md:p-3 rounded-md bg-navy-lighter border border-gray-700">
                        {load.commodity && (
                          <div>
                            <p className="text-xs text-gray-400">Commodity</p>
                            <p className="text-xs md:text-sm text-white truncate">{load.commodity}</p>
                          </div>
                        )}
                        {load.equipment_type && (
                          <div>
                            <p className="text-xs text-gray-400">Equipment</p>
                            <p className="text-xs md:text-sm text-white truncate">{load.equipment_type}</p>
                          </div>
                        )}
                        {load.weight && (
                          <div>
                            <p className="text-xs text-gray-400">Weight</p>
                            <p className="text-xs md:text-sm text-white">{load.weight} {load.weight_unit}</p>
                          </div>
                        )}
                      </div>

                      {/* Special Instructions */}
                      {load.comments && (
                        <div className="p-2 md:p-3 rounded-md bg-blue-500/10 border border-blue-500/20">
                          <p className="text-xs font-medium text-blue-400 mb-1">Special Instructions</p>
                          <p className="text-xs md:text-sm text-white whitespace-pre-wrap break-words">{load.comments}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Status Update for Active Loads */}
                <DriverStatusUpdate load={load} />
              </div>
            )
          })}
        </div>
      )}

      {/* Completed Assignments */}
      {completedLoads.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-base md:text-lg font-semibold text-white flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500 text-xs font-bold">
              {completedLoads.length}
            </span>
            Completed Assignments
          </h2>
          
          <div className="space-y-3">
            {completedLoads.map((load) => (
              <Card key={load.id} className="opacity-75 hover:opacity-100 transition-opacity">
                <CardContent className="pt-4 md:pt-6">
                  <div className="flex items-start justify-between mb-3 gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm md:text-base font-semibold text-white truncate">
                        {load.load_number || `Load #${load.id}`}
                      </h3>
                      <Badge variant={load.status} className="mt-1" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-start gap-2 text-xs md:text-sm">
                      <MapPin className="h-3 w-3 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <span className="text-gray-400">Route: </span>
                        <span className="text-white break-words">
                          {load.pickup_location} → {load.delivery_location}
                        </span>
                      </div>
                    </div>
                    {load.commodity && (
                      <div className="flex items-center gap-2 text-xs md:text-sm">
                        <Package className="h-3 w-3 text-gray-400 flex-shrink-0" />
                        <span className="text-gray-400">Commodity: </span>
                        <span className="text-white truncate">{load.commodity}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </>
  )
}



