'use client'

import { useState, useTransition, useMemo, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, Plus, X, ArrowUp, ArrowDown, Sparkles, Clock, Route } from 'lucide-react'
import { addLoad } from '@/app/actions/loads'
import { LoadMap } from '@/components/maps/load-map'
import { Coordinates } from '@/lib/types/database.types'
import { geocodeAddress } from '@/lib/geocoding'
import { getDirections } from '@/lib/maps/directions'
import { optimizeRouteStops, Stop } from '@/lib/maps/route-optimizer'
import { useToast } from '@/components/ui/toast'

interface Location {
  id: string
  address: string
  city: string
  state: string
  zip_code: string
  latitude?: string
  longitude?: string
}

interface AddLoadModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customers: Array<{ id: string; name: string }>
  carriers: Array<{ id: string; name: string }>
  drivers: Array<{ id: string; name: string }>
}

const EQUIPMENT_TYPES = [
  'Hopper Bottom',
  'Dry Van',
  'Reefer',
  'Flatbed',
  'Belt-fed Trailer',
  'End Dump',
  'Side Dump',
  'Live Bottom Trailer',
  '4400 Regular Cab',
  'Coronado',
]

const WEIGHT_UNITS = [
  'lbs',
  'tons',
  'pallets',
  'kg',
  'bushels',
  'cubic yards',
]

export function AddLoadModal({ open, onOpenChange, customers, carriers, drivers }: AddLoadModalProps) {
  const [isPending, startTransition] = useTransition()
  const [fleetType, setFleetType] = useState<'internal' | 'external'>('external')
  const [pickupLocations, setPickupLocations] = useState<Location[]>([
    { id: '1', address: '', city: '', state: '', zip_code: '', latitude: '', longitude: '' }
  ])
  const [deliveryLocations, setDeliveryLocations] = useState<Location[]>([
    { id: '1', address: '', city: '', state: '', zip_code: '', latitude: '', longitude: '' }
  ])
  const [geocodedPickupCoords, setGeocodedPickupCoords] = useState<Coordinates | null>(null)
  const [geocodedDeliveryCoords, setGeocodedDeliveryCoords] = useState<Coordinates | null>(null)
  const [isGeocoding, setIsGeocoding] = useState(false)
  const [routeMetrics, setRouteMetrics] = useState<{distance: string; duration: string; eta: string} | null>(null)
  const [isOptimizing, setIsOptimizing] = useState(false)
  const { showToast } = useToast()
  const [formData, setFormData] = useState({
    customer_id: '',
    commodity: '',
    weight: '',
    weight_unit: 'lbs',
    equipment_type: 'Hopper Bottom',
    pricing_type: 'flat',
    carrier_id: '',
    driver_id: '',
    pickup_time: '',
    delivery_time: '',
    customer_rate: '',
    carrier_rate: '',
    comments: '',
  })

  // Calculate route metrics when coordinates change
  useEffect(() => {
    const calculateRoute = async () => {
      // Wait for Google Maps to be loaded
      if (typeof google === 'undefined' || !google.maps) {
        return
      }

      const pickup = geocodedPickupCoords || (pickupLocations[0]?.latitude && pickupLocations[0]?.longitude
        ? { lat: parseFloat(pickupLocations[0].latitude), lng: parseFloat(pickupLocations[0].longitude) }
        : null)
      
      const delivery = geocodedDeliveryCoords || (deliveryLocations[0]?.latitude && deliveryLocations[0]?.longitude
        ? { lat: parseFloat(deliveryLocations[0].latitude), lng: parseFloat(deliveryLocations[0].longitude) }
        : null)

      if (pickup && delivery) {
        const directions = await getDirections(pickup, delivery, {
          departureTime: formData.pickup_time ? new Date(formData.pickup_time) : undefined,
          trafficModel: 'best_guess'
        })

        if (directions) {
          const etaDate = new Date(Date.now() + directions.duration.value * 1000)
          setRouteMetrics({
            distance: directions.distance.text,
            duration: directions.duration.text,
            eta: etaDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          })
        }
      } else {
        setRouteMetrics(null)
      }
    }

    // Add a small delay to ensure Google Maps is loaded
    const timer = setTimeout(() => {
      calculateRoute()
    }, 500)

    return () => clearTimeout(timer)
  }, [geocodedPickupCoords, geocodedDeliveryCoords, pickupLocations, deliveryLocations, formData.pickup_time])

  // Geocode addresses when they change
  useEffect(() => {
    const geocodeLocations = async () => {
      const firstPickup = pickupLocations[0]
      const firstDelivery = deliveryLocations[0]

      // Only geocode if address is filled but coordinates are not
      if (firstPickup?.address && firstPickup?.city && firstPickup?.state && 
          !firstPickup?.latitude && !firstPickup?.longitude) {
        setIsGeocoding(true)
        const fullAddress = `${firstPickup.address}, ${firstPickup.city}, ${firstPickup.state} ${firstPickup.zip_code}`
        const result = await geocodeAddress(fullAddress)
        if (result) {
          setGeocodedPickupCoords(result.coordinates)
        }
        setIsGeocoding(false)
      } else if (firstPickup?.latitude && firstPickup?.longitude) {
        // Clear geocoded coords if manual coords are provided
        setGeocodedPickupCoords(null)
      }

      if (firstDelivery?.address && firstDelivery?.city && firstDelivery?.state && 
          !firstDelivery?.latitude && !firstDelivery?.longitude) {
        setIsGeocoding(true)
        const fullAddress = `${firstDelivery.address}, ${firstDelivery.city}, ${firstDelivery.state} ${firstDelivery.zip_code}`
        const result = await geocodeAddress(fullAddress)
        if (result) {
          setGeocodedDeliveryCoords(result.coordinates)
        }
        setIsGeocoding(false)
      } else if (firstDelivery?.latitude && firstDelivery?.longitude) {
        // Clear geocoded coords if manual coords are provided
        setGeocodedDeliveryCoords(null)
      }
    }

    // Debounce the geocoding
    const timer = setTimeout(() => {
      geocodeLocations()
    }, 1000)

    return () => clearTimeout(timer)
  }, [pickupLocations, deliveryLocations])

  const movePickupLocation = (index: number, direction: 'up' | 'down') => {
    const newLocations = [...pickupLocations]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex >= 0 && targetIndex < newLocations.length) {
      [newLocations[index], newLocations[targetIndex]] = [newLocations[targetIndex], newLocations[index]]
      setPickupLocations(newLocations)
    }
  }

  const moveDeliveryLocation = (index: number, direction: 'up' | 'down') => {
    const newLocations = [...deliveryLocations]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex >= 0 && targetIndex < newLocations.length) {
      [newLocations[index], newLocations[targetIndex]] = [newLocations[targetIndex], newLocations[index]]
      setDeliveryLocations(newLocations)
    }
  }

  const optimizeRoute = async () => {
    setIsOptimizing(true)
    
    try {
      // Wait for Google Maps to be loaded
      if (typeof google === 'undefined' || !google.maps) {
        showToast({
          type: 'warning',
          title: 'Map Loading',
          message: 'Please wait for the map to load before optimizing route'
        })
        setIsOptimizing(false)
        return
      }

      // Store location references with their type
      interface LocationWithCoords {
        location: Location
        coords: Coordinates
        type: 'pickup' | 'delivery'
        originalIndex: number
      }

      const locationsWithCoords: LocationWithCoords[] = []

      // Geocode pickup locations
      for (let i = 0; i < pickupLocations.length; i++) {
        const loc = pickupLocations[i]
        let coords: Coordinates | null = null

        if (loc.latitude && loc.longitude) {
          coords = { lat: parseFloat(loc.latitude), lng: parseFloat(loc.longitude) }
        } else if (loc.address && loc.city && loc.state) {
          const fullAddress = `${loc.address}, ${loc.city}, ${loc.state} ${loc.zip_code}`
          const result = await geocodeAddress(fullAddress)
          if (result) {
            coords = result.coordinates
          }
        }

        if (coords) {
          locationsWithCoords.push({ location: loc, coords, type: 'pickup', originalIndex: i })
        }
      }

      // Geocode delivery locations
      for (let i = 0; i < deliveryLocations.length; i++) {
        const loc = deliveryLocations[i]
        let coords: Coordinates | null = null

        if (loc.latitude && loc.longitude) {
          coords = { lat: parseFloat(loc.latitude), lng: parseFloat(loc.longitude) }
        } else if (loc.address && loc.city && loc.state) {
          const fullAddress = `${loc.address}, ${loc.city}, ${loc.state} ${loc.zip_code}`
          const result = await geocodeAddress(fullAddress)
          if (result) {
            coords = result.coordinates
          }
        }

        if (coords) {
          locationsWithCoords.push({ location: loc, coords, type: 'delivery', originalIndex: i })
        }
      }

      if (locationsWithCoords.length === 0) {
        showToast({
          type: 'warning',
          title: 'No Valid Locations',
          message: 'Please add valid addresses or coordinates to optimize route'
        })
        setIsOptimizing(false)
        return
      }

      if (locationsWithCoords.length < 2) {
        showToast({
          type: 'info',
          title: 'More Locations Needed',
          message: 'Please add at least 2 locations to optimize route'
        })
        setIsOptimizing(false)
        return
      }

      // Create stops for optimization
      // Don't link pickup/delivery pairs with load_id unless they're actually the same load
      // This allows the optimizer to freely reorder all stops for efficiency
      const allStops: Stop[] = locationsWithCoords.map((item, index) => ({
        id: index,
        location: `${item.location.address}, ${item.location.city}, ${item.location.state}`,
        coordinates: item.coords,
        type: item.type,
        // Don't set load_id - this allows free reordering of all stops
        load_id: undefined
      }))

      const firstStop = allStops[0]
      const remainingStops = allStops.slice(1)

      const optimized = await optimizeRouteStops(firstStop.coordinates, remainingStops)
      
      if (optimized) {
        // Rebuild the full optimized sequence including the first stop
        const fullOptimizedSequence = [firstStop, ...optimized.stops]
        
        // Separate optimized locations back into pickup and delivery arrays
        const newPickups: Location[] = []
        const newDeliveries: Location[] = []
        
        fullOptimizedSequence.forEach(stop => {
          const originalItem = locationsWithCoords.find(
            item => item.type === stop.type && item.originalIndex === stop.load_id
          )
          
          if (originalItem) {
            if (stop.type === 'pickup') {
              newPickups.push(originalItem.location)
            } else {
              newDeliveries.push(originalItem.location)
            }
          }
        })

        // Update locations with optimized order
        if (newPickups.length > 0) setPickupLocations(newPickups)
        if (newDeliveries.length > 0) setDeliveryLocations(newDeliveries)
        
        // Show success notification
        const totalMiles = (optimized.total_distance / 1609.34).toFixed(1)
        const totalMinutes = Math.round(optimized.total_duration / 60)
        const totalHours = Math.floor(totalMinutes / 60)
        const remainingMinutes = totalMinutes % 60
        
        const durationText = totalHours > 0 
          ? `${totalHours}h ${remainingMinutes}m` 
          : `${totalMinutes} mins`
        
        showToast({
          type: 'success',
          title: 'Route Optimized! ✨',
          message: `Total: ${totalMiles} miles, ${durationText}. Stops reordered for efficiency.`,
          duration: 7000
        })
      }
    } catch (error) {
      console.error('Route optimization error:', error)
      showToast({
        type: 'error',
        title: 'Optimization Failed',
        message: 'Failed to optimize route. Please try again.'
      })
    }
    
    setIsOptimizing(false)
  }

  const addPickupLocation = () => {
    setPickupLocations([...pickupLocations, {
      id: Date.now().toString(),
      address: '',
      city: '',
      state: '',
      zip_code: '',
      latitude: '',
      longitude: ''
    }])
  }

  const removePickupLocation = (id: string) => {
    if (pickupLocations.length > 1) {
      setPickupLocations(pickupLocations.filter(loc => loc.id !== id))
    }
  }

  const updatePickupLocation = (id: string, field: keyof Location, value: string) => {
    setPickupLocations(pickupLocations.map(loc =>
      loc.id === id ? { ...loc, [field]: value } : loc
    ))
  }

  const addDeliveryLocation = () => {
    setDeliveryLocations([...deliveryLocations, {
      id: Date.now().toString(),
      address: '',
      city: '',
      state: '',
      zip_code: '',
      latitude: '',
      longitude: ''
    }])
  }

  const removeDeliveryLocation = (id: string) => {
    if (deliveryLocations.length > 1) {
      setDeliveryLocations(deliveryLocations.filter(loc => loc.id !== id))
    }
  }

  const updateDeliveryLocation = (id: string, field: keyof Location, value: string) => {
    setDeliveryLocations(deliveryLocations.map(loc =>
      loc.id === id ? { ...loc, [field]: value } : loc
    ))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate all locations have required fields
    const allPickupsValid = pickupLocations.every(loc => 
      loc.address && loc.city && loc.state && loc.zip_code
    )
    const allDeliveriesValid = deliveryLocations.every(loc =>
      loc.address && loc.city && loc.state && loc.zip_code
    )

    if (!allPickupsValid || !allDeliveriesValid) {
      showToast({
        type: 'warning',
        title: 'Missing Information',
        message: 'Please fill in all address fields for each location'
      })
      return
    }

    // Format locations as strings for now (you may want to store them differently)
    const pickup_location = pickupLocations.map(loc => 
      `${loc.address}, ${loc.city}, ${loc.state} ${loc.zip_code}`
    ).join(' | ')
    
    const delivery_location = deliveryLocations.map(loc =>
      `${loc.address}, ${loc.city}, ${loc.state} ${loc.zip_code}`
    ).join(' | ')
    
    startTransition(async () => {
      const result = await addLoad({
        ...formData,
        pickup_location,
        delivery_location,
      })
      if (result.success) {
        onOpenChange(false)
        // Reset form
        setFleetType('external')
        setPickupLocations([{ id: '1', address: '', city: '', state: '', zip_code: '', latitude: '', longitude: '' }])
        setDeliveryLocations([{ id: '1', address: '', city: '', state: '', zip_code: '', latitude: '', longitude: '' }])
        setGeocodedPickupCoords(null)
        setGeocodedDeliveryCoords(null)
        setFormData({
          customer_id: '',
          commodity: '',
          weight: '',
          weight_unit: 'lbs',
          equipment_type: 'Hopper Bottom',
          pricing_type: 'flat',
          carrier_id: '',
          driver_id: '',
          pickup_time: '',
          delivery_time: '',
          customer_rate: '',
          carrier_rate: '',
          comments: '',
        })
      } else {
        showToast({
          type: 'error',
          title: 'Failed to Create Load',
          message: result.error || 'An error occurred while creating the load'
        })
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Load</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer Name */}
          <div>
            <label className="text-sm font-medium text-gray-300">
              Customer Name <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={formData.customer_id}
              onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
              className="flex h-10 w-full rounded-md border border-gray-600 bg-navy-lighter px-3 py-2 text-sm text-white"
            >
              <option value="">Select a customer</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
          </div>

          {/* Pickup Locations */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-300">
                Pickup Location(s) <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                {pickupLocations.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={optimizeRoute}
                    disabled={isOptimizing}
                  >
                    {isOptimizing ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4 mr-1" />
                    )}
                    Optimize Route
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addPickupLocation}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Stop
                </Button>
              </div>
            </div>
            <div className="space-y-4">
              {pickupLocations.map((location, index) => (
                <div key={location.id} className="border border-gray-700 rounded-lg p-4 relative">
                  <div className="absolute top-2 right-2 flex gap-1">
                    {pickupLocations.length > 1 && (
                      <>
                        {index > 0 && (
                          <button
                            type="button"
                            onClick={() => movePickupLocation(index, 'up')}
                            className="text-gray-400 hover:text-blue-500"
                            title="Move up"
                          >
                            <ArrowUp className="h-4 w-4" />
                          </button>
                        )}
                        {index < pickupLocations.length - 1 && (
                          <button
                            type="button"
                            onClick={() => movePickupLocation(index, 'down')}
                            className="text-gray-400 hover:text-blue-500"
                            title="Move down"
                          >
                            <ArrowDown className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => removePickupLocation(location.id)}
                          className="text-gray-400 hover:text-red-500"
                          title="Remove"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mb-2">Stop {index + 1}</p>
                  <div className="grid grid-cols-1 gap-3">
                    <Input
                      required
                      placeholder="Street Address"
                      value={location.address}
                      onChange={(e) => updatePickupLocation(location.id, 'address', e.target.value)}
                    />
                    <div className="grid grid-cols-6 gap-3">
                      <div className="col-span-3">
                        <Input
                          required
                          placeholder="City"
                          value={location.city}
                          onChange={(e) => updatePickupLocation(location.id, 'city', e.target.value)}
                        />
                      </div>
                      <div className="col-span-1">
                        <Input
                          required
                          placeholder="State"
                          maxLength={2}
                          value={location.state}
                          onChange={(e) => updatePickupLocation(location.id, 'state', e.target.value.toUpperCase())}
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          required
                          placeholder="Zip Code"
                          value={location.zip_code}
                          onChange={(e) => updatePickupLocation(location.id, 'zip_code', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        type="number"
                        step="any"
                        placeholder="Latitude (optional)"
                        value={location.latitude}
                        onChange={(e) => updatePickupLocation(location.id, 'latitude', e.target.value)}
                      />
                      <Input
                        type="number"
                        step="any"
                        placeholder="Longitude (optional)"
                        value={location.longitude}
                        onChange={(e) => updatePickupLocation(location.id, 'longitude', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery Locations */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-300">
                Delivery Location(s) <span className="text-red-500">*</span>
              </label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addDeliveryLocation}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Stop
              </Button>
            </div>
            <div className="space-y-4">
              {deliveryLocations.map((location, index) => (
                <div key={location.id} className="border border-gray-700 rounded-lg p-4 relative">
                  <div className="absolute top-2 right-2 flex gap-1">
                    {deliveryLocations.length > 1 && (
                      <>
                        {index > 0 && (
                          <button
                            type="button"
                            onClick={() => moveDeliveryLocation(index, 'up')}
                            className="text-gray-400 hover:text-blue-500"
                            title="Move up"
                          >
                            <ArrowUp className="h-4 w-4" />
                          </button>
                        )}
                        {index < deliveryLocations.length - 1 && (
                          <button
                            type="button"
                            onClick={() => moveDeliveryLocation(index, 'down')}
                            className="text-gray-400 hover:text-blue-500"
                            title="Move down"
                          >
                            <ArrowDown className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => removeDeliveryLocation(location.id)}
                          className="text-gray-400 hover:text-red-500"
                          title="Remove"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mb-2">Stop {index + 1}</p>
                  <div className="grid grid-cols-1 gap-3">
                    <Input
                      required
                      placeholder="Street Address"
                      value={location.address}
                      onChange={(e) => updateDeliveryLocation(location.id, 'address', e.target.value)}
                    />
                    <div className="grid grid-cols-6 gap-3">
                      <div className="col-span-3">
                        <Input
                          required
                          placeholder="City"
                          value={location.city}
                          onChange={(e) => updateDeliveryLocation(location.id, 'city', e.target.value)}
                        />
                      </div>
                      <div className="col-span-1">
                        <Input
                          required
                          placeholder="State"
                          maxLength={2}
                          value={location.state}
                          onChange={(e) => updateDeliveryLocation(location.id, 'state', e.target.value.toUpperCase())}
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          required
                          placeholder="Zip Code"
                          value={location.zip_code}
                          onChange={(e) => updateDeliveryLocation(location.id, 'zip_code', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        type="number"
                        step="any"
                        placeholder="Latitude (optional)"
                        value={location.latitude}
                        onChange={(e) => updateDeliveryLocation(location.id, 'latitude', e.target.value)}
                      />
                      <Input
                        type="number"
                        step="any"
                        placeholder="Longitude (optional)"
                        value={location.longitude}
                        onChange={(e) => updateDeliveryLocation(location.id, 'longitude', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Map Preview */}
          {(() => {
            // Check for manual coordinates
            const hasPickupManualCoords = pickupLocations[0]?.latitude && 
                                          pickupLocations[0]?.longitude &&
                                          !isNaN(parseFloat(pickupLocations[0].latitude)) &&
                                          !isNaN(parseFloat(pickupLocations[0].longitude))
            
            const hasDeliveryManualCoords = deliveryLocations[0]?.latitude && 
                                            deliveryLocations[0]?.longitude &&
                                            !isNaN(parseFloat(deliveryLocations[0].latitude)) &&
                                            !isNaN(parseFloat(deliveryLocations[0].longitude))
            
            // Determine which coordinates to use (manual takes precedence over geocoded)
            const pickupCoords = hasPickupManualCoords 
              ? { lat: parseFloat(pickupLocations[0].latitude!), lng: parseFloat(pickupLocations[0].longitude!) }
              : geocodedPickupCoords
            
            const deliveryCoords = hasDeliveryManualCoords
              ? { lat: parseFloat(deliveryLocations[0].latitude!), lng: parseFloat(deliveryLocations[0].longitude!) }
              : geocodedDeliveryCoords
            
            const hasAnyAddress = (pickupLocations.some(loc => loc.address && loc.city && loc.state) ||
                                   deliveryLocations.some(loc => loc.address && loc.city && loc.state))
            
            const showMap = pickupCoords || deliveryCoords || hasAnyAddress

            return showMap ? (
              <div>
                <label className="text-sm font-medium text-gray-300 mb-3 block">
                  Location Preview {isGeocoding && <span className="text-xs text-gray-400">(geocoding...)</span>}
                </label>
                <LoadMap
                  pickupLocation={pickupLocations[0]?.address || 'Pickup'}
                  deliveryLocation={deliveryLocations[0]?.address || 'Delivery'}
                  pickupCoords={pickupCoords || undefined}
                  deliveryCoords={deliveryCoords || undefined}
                  className="h-[300px] w-full"
                />
                {routeMetrics && (
                  <div className="mt-3 flex items-center gap-4 text-sm bg-navy-light rounded-lg p-3 border border-gray-700">
                    <div className="flex items-center gap-2">
                      <Route className="h-4 w-4 text-blue-400" />
                      <span className="text-gray-400">Distance:</span>
                      <span className="text-white font-medium">{routeMetrics.distance}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-green-400" />
                      <span className="text-gray-400">Duration:</span>
                      <span className="text-white font-medium">{routeMetrics.duration}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-purple-400" />
                      <span className="text-gray-400">ETA:</span>
                      <span className="text-white font-medium">{routeMetrics.eta}</span>
                    </div>
                  </div>
                )}
              </div>
            ) : null
          })()}

          {/* Pickup and Delivery Times */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-300">
                Pickup Date & Time <span className="text-red-500">*</span>
              </label>
              <Input
                required
                type="datetime-local"
                value={formData.pickup_time}
                onChange={(e) => setFormData({ ...formData, pickup_time: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300">
                Delivery Date & Time <span className="text-red-500">*</span>
              </label>
              <Input
                required
                type="datetime-local"
                value={formData.delivery_time}
                onChange={(e) => setFormData({ ...formData, delivery_time: e.target.value })}
              />
            </div>
          </div>

          {/* Commodity */}
          <div>
            <label className="text-sm font-medium text-gray-300">
              Commodity/Cargo <span className="text-red-500">*</span>
            </label>
            <Input
              required
              placeholder="e.g., Almonds, Steel Coils, Electronics"
              value={formData.commodity}
              onChange={(e) => setFormData({ ...formData, commodity: e.target.value })}
            />
          </div>

          {/* Weight */}
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="text-sm font-medium text-gray-300">
                Weight <span className="text-red-500">*</span>
              </label>
              <Input
                required
                type="number"
                step="0.01"
                placeholder="Enter weight"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300">Unit</label>
              <select
                className="flex h-10 w-full rounded-md border border-gray-600 bg-navy-lighter px-3 py-2 text-sm text-white"
                value={formData.weight_unit}
                onChange={(e) => setFormData({ ...formData, weight_unit: e.target.value })}
              >
                {WEIGHT_UNITS.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Equipment Type */}
          <div>
            <label className="text-sm font-medium text-gray-300">
              Equipment Type <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={formData.equipment_type}
              onChange={(e) => setFormData({ ...formData, equipment_type: e.target.value })}
              className="flex h-10 w-full rounded-md border border-gray-600 bg-navy-lighter px-3 py-2 text-sm text-white"
            >
              {EQUIPMENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Fleet Type Selection */}
          <div>
            <label className="text-sm font-medium text-gray-300">
              Fleet Type <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-6 mt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="fleet_type"
                  value="internal"
                  checked={fleetType === 'internal'}
                  onChange={(e) => {
                    setFleetType('internal')
                    setFormData({ ...formData, carrier_id: '', carrier_rate: '' })
                  }}
                  className="h-4 w-4 border-gray-600 bg-navy-lighter text-primary focus:ring-primary focus:ring-offset-navy-light"
                />
                <span className="text-sm text-gray-300">Internal Fleet</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="fleet_type"
                  value="external"
                  checked={fleetType === 'external'}
                  onChange={(e) => {
                    setFleetType('external')
                    setFormData({ ...formData, driver_id: '' })
                  }}
                  className="h-4 w-4 border-gray-600 bg-navy-lighter text-primary focus:ring-primary focus:ring-offset-navy-light"
                />
                <span className="text-sm text-gray-300">External Fleet</span>
              </label>
            </div>
          </div>

          {/* Conditional: Internal Fleet - Driver Assignment */}
          {fleetType === 'internal' && (
            <div>
              <label className="text-sm font-medium text-gray-300">
                Assign Driver <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.driver_id}
                onChange={(e) => setFormData({ ...formData, driver_id: e.target.value })}
                className="flex h-10 w-full rounded-md border border-gray-600 bg-navy-lighter px-3 py-2 text-sm text-white"
              >
                <option value="">Select a driver</option>
                {drivers.map((driver) => (
                  <option key={driver.id} value={driver.id}>
                    {driver.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Conditional: External Fleet - Carrier and Rates */}
          {fleetType === 'external' && (
            <>
              <div>
                <label className="text-sm font-medium text-gray-300">
                  Assign Carrier (Optional)
                </label>
                <select
                  value={formData.carrier_id}
                  onChange={(e) => setFormData({ ...formData, carrier_id: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-gray-600 bg-navy-lighter px-3 py-2 text-sm text-white"
                >
                  <option value="">Leave blank for TBD</option>
                  {carriers.map((carrier) => (
                    <option key={carrier.id} value={carrier.id}>
                      {carrier.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-300">
                    Carrier Rate (Optional)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="$0.00"
                    value={formData.carrier_rate}
                    onChange={(e) => setFormData({ ...formData, carrier_rate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-300">
                    Customer Rate <span className="text-red-500">*</span>
                  </label>
                  <Input
                    required
                    type="number"
                    step="0.01"
                    placeholder="$0.00"
                    value={formData.customer_rate}
                    onChange={(e) => setFormData({ ...formData, customer_rate: e.target.value })}
                  />
                </div>
              </div>
            </>
          )}

          {/* Conditional: Internal Fleet - Customer Rate Only */}
          {fleetType === 'internal' && (
            <div>
              <label className="text-sm font-medium text-gray-300">
                Customer Rate <span className="text-red-500">*</span>
              </label>
              <Input
                required
                type="number"
                step="0.01"
                placeholder="$0.00"
                value={formData.customer_rate}
                onChange={(e) => setFormData({ ...formData, customer_rate: e.target.value })}
              />
            </div>
          )}

          {/* Pricing Type */}
          <div>
            <label className="text-sm font-medium text-gray-300">
              Pricing Type <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-6 mt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="pricing_type"
                  value="flat"
                  checked={formData.pricing_type === 'flat'}
                  onChange={(e) => setFormData({ ...formData, pricing_type: e.target.value })}
                  className="h-4 w-4 border-gray-600 bg-navy-lighter text-primary focus:ring-primary focus:ring-offset-navy-light"
                />
                <span className="text-sm text-gray-300">Flat Rate</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="pricing_type"
                  value="per_ton"
                  checked={formData.pricing_type === 'per_ton'}
                  onChange={(e) => setFormData({ ...formData, pricing_type: e.target.value })}
                  className="h-4 w-4 border-gray-600 bg-navy-lighter text-primary focus:ring-primary focus:ring-offset-navy-light"
                />
                <span className="text-sm text-gray-300">Per Ton</span>
              </label>
            </div>
          </div>

          {/* Comments */}
          <div>
            <label className="text-sm font-medium text-gray-300">
              Special Instructions (Optional)
            </label>
            <textarea
              className="flex min-h-[80px] w-full rounded-md border border-gray-600 bg-navy-lighter px-3 py-2 text-sm text-white placeholder:text-gray-500"
              placeholder="Any special requirements, handling instructions, or notes..."
              value={formData.comments}
              onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Load...
                </>
              ) : (
                'Create Load'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

