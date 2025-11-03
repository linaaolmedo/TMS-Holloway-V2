'use client'

import { useState, useTransition } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, Plus, X } from 'lucide-react'
import { addLoad } from '@/app/actions/loads'

interface Location {
  id: string
  address: string
  city: string
  state: string
  zip_code: string
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
    { id: '1', address: '', city: '', state: '', zip_code: '' }
  ])
  const [deliveryLocations, setDeliveryLocations] = useState<Location[]>([
    { id: '1', address: '', city: '', state: '', zip_code: '' }
  ])
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

  const addPickupLocation = () => {
    setPickupLocations([...pickupLocations, {
      id: Date.now().toString(),
      address: '',
      city: '',
      state: '',
      zip_code: ''
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
      zip_code: ''
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
      alert('Please fill in all address fields for each location')
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
        setPickupLocations([{ id: '1', address: '', city: '', state: '', zip_code: '' }])
        setDeliveryLocations([{ id: '1', address: '', city: '', state: '', zip_code: '' }])
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
        alert(result.error || 'Failed to create load')
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
            <div className="space-y-4">
              {pickupLocations.map((location, index) => (
                <div key={location.id} className="border border-gray-700 rounded-lg p-4 relative">
                  {pickupLocations.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removePickupLocation(location.id)}
                      className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
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
                  {deliveryLocations.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeDeliveryLocation(location.id)}
                      className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
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
                  </div>
                </div>
              ))}
            </div>
          </div>

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

