'use client'

import { useState, useTransition } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { requestShipment } from '@/app/actions/customers'
import { Loader2, Plus, X } from 'lucide-react'

interface Location {
  id: string
  address: string
  city: string
  state: string
  zip_code: string
}

interface RequestShipmentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RequestShipmentModal({ open, onOpenChange }: RequestShipmentModalProps) {
  const [isPending, startTransition] = useTransition()
  const [pickupLocations, setPickupLocations] = useState<Location[]>([
    { id: '1', address: '', city: '', state: '', zip_code: '' }
  ])
  const [deliveryLocations, setDeliveryLocations] = useState<Location[]>([
    { id: '1', address: '', city: '', state: '', zip_code: '' }
  ])
  const [formData, setFormData] = useState({
    commodity: '',
    weight: '',
    weight_unit: 'lbs',
    equipment_type: '',
    pickup_time: '',
    delivery_time: '',
    special_instructions: '',
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

    startTransition(async () => {
      const result = await requestShipment({
        ...formData,
        pickup_locations: pickupLocations,
        delivery_locations: deliveryLocations,
      })
      if (result.success) {
        onOpenChange(false)
        // Reset form
        setPickupLocations([{ id: '1', address: '', city: '', state: '', zip_code: '' }])
        setDeliveryLocations([{ id: '1', address: '', city: '', state: '', zip_code: '' }])
        setFormData({
          commodity: '',
          weight: '',
          weight_unit: 'lbs',
          equipment_type: '',
          pickup_time: '',
          delivery_time: '',
          special_instructions: '',
        })
      } else {
        alert(result.error || 'Failed to request shipment')
      }
    })
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Request New Shipment</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
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
                onChange={(e) => handleChange('pickup_time', e.target.value)}
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
                onChange={(e) => handleChange('delivery_time', e.target.value)}
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
              placeholder="e.g., Steel Coils, Lumber, Electronics"
              value={formData.commodity}
              onChange={(e) => handleChange('commodity', e.target.value)}
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
                onChange={(e) => handleChange('weight', e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300">Unit</label>
              <select
                className="flex h-10 w-full rounded-md border border-gray-600 bg-navy-lighter px-3 py-2 text-sm text-white"
                value={formData.weight_unit}
                onChange={(e) => handleChange('weight_unit', e.target.value)}
              >
                <option value="lbs">lbs</option>
                <option value="kg">kg</option>
                <option value="tons">tons</option>
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
              className="flex h-10 w-full rounded-md border border-gray-600 bg-navy-lighter px-3 py-2 text-sm text-white"
              value={formData.equipment_type}
              onChange={(e) => handleChange('equipment_type', e.target.value)}
            >
              <option value="">Select Equipment Type</option>
              <option value="Dry Van">Dry Van</option>
              <option value="Reefer">Reefer</option>
              <option value="Flatbed">Flatbed</option>
              <option value="Step Deck">Step Deck</option>
              <option value="Box Truck">Box Truck</option>
              <option value="Tanker">Tanker</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Special Instructions */}
          <div>
            <label className="text-sm font-medium text-gray-300">
              Special Instructions (Optional)
            </label>
            <textarea
              className="flex min-h-[80px] w-full rounded-md border border-gray-600 bg-navy-lighter px-3 py-2 text-sm text-white placeholder:text-gray-500"
              placeholder="Any special requirements, handling instructions, or notes..."
              value={formData.special_instructions}
              onChange={(e) => handleChange('special_instructions', e.target.value)}
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
                  Submitting...
                </>
              ) : (
                'Submit Request'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
