'use client'

import { X, MapPin, Package, Calendar, DollarSign, User, Truck, CheckCircle2, Clock } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { useEffect, useState } from 'react'
import { LoadMap } from '@/components/maps/load-map'
import { getLoadLocation } from '@/app/actions/locations'
import { Coordinates } from '@/lib/types/database.types'

interface LoadDetailsModalProps {
  load: {
    id: number
    load_number: string | null
    status: string
    pickup_location: string | null
    delivery_location: string | null
    commodity: string | null
    equipment_type: string | null
    pickup_time: string | null
    delivery_time: string | null
    customer_rate: number | null
    carrier_rate: number | null
    margin_percent: number | null
    rate_confirmed: boolean | null
    rate_confirmed_at: string | null
    customer?: { name: string }
    carrier?: { name: string }
  }
  onClose: () => void
  onEdit?: () => void
}

export function LoadDetailsModal({ load, onClose, onEdit }: LoadDetailsModalProps) {
  const margin = load.customer_rate && load.carrier_rate 
    ? load.customer_rate - load.carrier_rate 
    : 0

  const [pickupCoords, setPickupCoords] = useState<Coordinates | undefined>()
  const [deliveryCoords, setDeliveryCoords] = useState<Coordinates | undefined>()

  // Fetch geocoded coordinates
  useEffect(() => {
    getLoadLocation(load.id).then((result) => {
      if (result.success && result.data) {
        if (result.data.pickup_lat && result.data.pickup_lng) {
          setPickupCoords({
            lat: result.data.pickup_lat,
            lng: result.data.pickup_lng,
          })
        }
        if (result.data.delivery_lat && result.data.delivery_lng) {
          setDeliveryCoords({
            lat: result.data.delivery_lat,
            lng: result.data.delivery_lng,
          })
        }
      }
    })
  }, [load.id])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-4xl rounded-lg border border-gray-700 bg-navy-light shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-700 p-6">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-white">
              {load.load_number || `Load #${load.id}`}
            </h2>
            <Badge variant={load.status} />
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-gray-400 hover:bg-navy-lighter hover:text-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[calc(100vh-12rem)] overflow-y-auto">
          {/* Route Map */}
          {load.pickup_location && load.delivery_location && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Route Map</h3>
              <LoadMap
                pickupLocation={load.pickup_location}
                deliveryLocation={load.delivery_location}
                pickupCoords={pickupCoords}
                deliveryCoords={deliveryCoords}
                className="h-[350px] w-full"
              />
            </div>
          )}

          {/* Route Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Route Information</h3>
            <div className="grid gap-4 md:grid-cols-2">
              {/* Pickup */}
              <div className="rounded-lg border border-gray-700 bg-navy-lighter p-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-green-500/10 p-2">
                    <MapPin className="h-5 w-5 text-green-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-400">Pickup Location</p>
                    <p className="text-base font-semibold text-white mt-1">
                      {load.pickup_location || 'Not specified'}
                    </p>
                    <div className="flex items-center gap-2 mt-2 text-sm text-gray-400">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(load.pickup_time)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Delivery */}
              <div className="rounded-lg border border-gray-700 bg-navy-lighter p-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-red-500/10 p-2">
                    <MapPin className="h-5 w-5 text-red-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-400">Delivery Location</p>
                    <p className="text-base font-semibold text-white mt-1">
                      {load.delivery_location || 'Not specified'}
                    </p>
                    <div className="flex items-center gap-2 mt-2 text-sm text-gray-400">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(load.delivery_time)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Load Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Load Details</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-gray-700 bg-navy-lighter p-4">
                <div className="flex items-center gap-3">
                  <Package className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-sm text-gray-400">Commodity</p>
                    <p className="text-base font-medium text-white">{load.commodity || 'Not specified'}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-gray-700 bg-navy-lighter p-4">
                <div className="flex items-center gap-3">
                  <Truck className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-sm text-gray-400">Equipment Type</p>
                    <p className="text-base font-medium text-white">{load.equipment_type || 'Not specified'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Parties */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Parties</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-gray-700 bg-navy-lighter p-4">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-purple-500" />
                  <div>
                    <p className="text-sm text-gray-400">Customer</p>
                    <p className="text-base font-medium text-white">{load.customer?.name || 'Not assigned'}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-gray-700 bg-navy-lighter p-4">
                <div className="flex items-center gap-3">
                  <Truck className="h-5 w-5 text-orange-500" />
                  <div>
                    <p className="text-sm text-gray-400">Carrier</p>
                    <p className="text-base font-medium text-white">{load.carrier?.name || 'TBD'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Financial Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Financial Information</h3>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg border border-gray-700 bg-navy-lighter p-4">
                <p className="text-sm text-gray-400 mb-2">Customer Rate</p>
                <p className="text-2xl font-bold text-primary">
                  {formatCurrency(load.customer_rate)}
                </p>
              </div>

              <div className="rounded-lg border border-gray-700 bg-navy-lighter p-4">
                <p className="text-sm text-gray-400 mb-2">Carrier Cost</p>
                <p className="text-2xl font-bold text-white">
                  {formatCurrency(load.carrier_rate)}
                </p>
              </div>

              <div className="rounded-lg border border-gray-700 bg-navy-lighter p-4">
                <p className="text-sm text-gray-400 mb-2">Margin</p>
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-green-500">
                    {formatCurrency(margin)}
                  </p>
                  <p className="text-sm text-gray-400">
                    {load.margin_percent ? `${load.margin_percent.toFixed(1)}%` : '0%'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Rate Confirmation Status */}
          {load.carrier?.name && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Rate Confirmation</h3>
              <div className="rounded-lg border border-gray-700 bg-navy-lighter p-4">
                {load.rate_confirmed ? (
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-6 w-6 text-green-500" />
                    <div>
                      <p className="text-base font-medium text-green-500">Rate Confirmed</p>
                      <p className="text-sm text-gray-400">
                        Confirmed on {formatDate(load.rate_confirmed_at)}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <Clock className="h-6 w-6 text-amber-500" />
                    <div>
                      <p className="text-base font-medium text-amber-500">Pending Confirmation</p>
                      <p className="text-sm text-gray-400">
                        Waiting for carrier to confirm the rate
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t border-gray-700 p-6">
          <button
            onClick={onClose}
            className="rounded-md border border-gray-600 px-6 py-2 text-sm font-medium text-white hover:bg-navy-lighter transition-colors"
          >
            Close
          </button>
          {onEdit && (
            <button 
              onClick={onEdit}
              className="rounded-md bg-primary px-6 py-2 text-sm font-medium text-white hover:bg-primary-hover transition-colors"
            >
              Edit Load
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

