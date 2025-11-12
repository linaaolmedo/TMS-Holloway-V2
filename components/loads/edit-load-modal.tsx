'use client'

import { useState, useTransition, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { updateLoad } from '@/app/actions/loads'

interface EditLoadModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  load: {
    id: number
    load_number: string | null
    customer_id: string | null
    carrier_id: string | null
    pickup_location: string | null
    delivery_location: string | null
    commodity: string | null
    weight: number | null
    weight_unit: string | null
    pallets: number | null
    equipment_type: string | null
    pricing_type: string | null
    pickup_time: string | null
    delivery_time: string | null
    customer_rate: number | null
    carrier_rate: number | null
    comments: string | null
  }
  customers: Array<{ id: string; name: string }>
  carriers: Array<{ id: string; name: string }>
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

const WEIGHT_UNITS = ['lbs', 'tons']

export function EditLoadModal({ open, onOpenChange, load, customers, carriers }: EditLoadModalProps) {
  const [isPending, startTransition] = useTransition()
  const [formData, setFormData] = useState({
    customer_id: load.customer_id || '',
    pickup_location: load.pickup_location || '',
    delivery_location: load.delivery_location || '',
    commodity: load.commodity || '',
    weight: load.weight?.toString() || '',
    weight_unit: load.weight_unit || 'lbs',
    pallets: load.pallets?.toString() || '',
    equipment_type: load.equipment_type || 'Hopper Bottom',
    pricing_type: load.pricing_type || 'flat',
    carrier_id: load.carrier_id || '',
    pickup_time: load.pickup_time ? load.pickup_time.split('T')[0] : '',
    delivery_time: load.delivery_time ? load.delivery_time.split('T')[0] : '',
    customer_rate: load.customer_rate?.toString() || '',
    carrier_rate: load.carrier_rate?.toString() || '',
    comments: load.comments || '',
  })

  // Reset form when load changes
  useEffect(() => {
    setFormData({
      customer_id: load.customer_id || '',
      pickup_location: load.pickup_location || '',
      delivery_location: load.delivery_location || '',
      commodity: load.commodity || '',
      weight: load.weight?.toString() || '',
      weight_unit: load.weight_unit || 'lbs',
      pallets: load.pallets?.toString() || '',
      equipment_type: load.equipment_type || 'Hopper Bottom',
      pricing_type: load.pricing_type || 'flat',
      carrier_id: load.carrier_id || '',
      pickup_time: load.pickup_time ? load.pickup_time.split('T')[0] : '',
      delivery_time: load.delivery_time ? load.delivery_time.split('T')[0] : '',
      customer_rate: load.customer_rate?.toString() || '',
      carrier_rate: load.carrier_rate?.toString() || '',
      comments: load.comments || '',
    })
  }, [load])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    startTransition(async () => {
      const result = await updateLoad(load.id, formData)
      if (result.success) {
        onOpenChange(false)
      } else {
        alert(result.error || 'Failed to update load')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)} className="max-h-[90vh] overflow-y-auto">
        <DialogHeader onClose={() => onOpenChange(false)}>
          <DialogTitle>Edit Load</DialogTitle>
          <DialogDescription>
            Update details for {load.load_number || `Load #${load.id}`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Customer Name */}
          <div>
            <label className="mb-2 block text-sm font-medium text-white">
              Customer Name
            </label>
            <select
              required
              value={formData.customer_id}
              onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
              className="w-full rounded-md border border-gray-600 bg-navy-lighter px-3 py-2 text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">Select a customer</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
          </div>

          {/* Origin and Destination */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-white">Origin</label>
              <Input
                required
                placeholder="Enter a location"
                value={formData.pickup_location}
                onChange={(e) => setFormData({ ...formData, pickup_location: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-white">Destination</label>
              <Input
                required
                placeholder="Enter a location"
                value={formData.delivery_location}
                onChange={(e) => setFormData({ ...formData, delivery_location: e.target.value })}
              />
            </div>
          </div>

          {/* Commodity */}
          <div>
            <label className="mb-2 block text-sm font-medium text-white">Commodity</label>
            <Input
              required
              placeholder="e.g., Almonds"
              value={formData.commodity}
              onChange={(e) => setFormData({ ...formData, commodity: e.target.value })}
            />
          </div>

          {/* Weight and Pallets */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-white">Weight</label>
              <div className="flex gap-2">
                <Input
                  required
                  type="number"
                  step="0.01"
                  placeholder="0"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  className="flex-1"
                />
                <div className="flex rounded-md border border-gray-600 bg-navy-lighter overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, weight_unit: 'lbs' })}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                      formData.weight_unit === 'lbs'
                        ? 'bg-primary text-white'
                        : 'text-gray-300 hover:bg-navy-light'
                    }`}
                  >
                    lbs
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, weight_unit: 'tons' })}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                      formData.weight_unit === 'tons'
                        ? 'bg-primary text-white'
                        : 'text-gray-300 hover:bg-navy-light'
                    }`}
                  >
                    tons
                  </button>
                </div>
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-white">
                Pallets <span className="text-xs text-gray-400">(Optional)</span>
              </label>
              <Input
                type="number"
                step="1"
                placeholder="# of pallets"
                value={formData.pallets}
                onChange={(e) => setFormData({ ...formData, pallets: e.target.value })}
              />
            </div>
          </div>

          {/* Pricing Type */}
          <div>
            <label className="mb-2 block text-sm font-medium text-white">Pricing Type</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="pricing_type"
                  value="flat"
                  checked={formData.pricing_type === 'flat'}
                  onChange={(e) => setFormData({ ...formData, pricing_type: e.target.value })}
                  className="h-4 w-4 border-gray-600 bg-navy-lighter text-primary focus:ring-primary focus:ring-offset-navy-light"
                />
                <span className="text-sm text-white">Flat Rate</span>
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
                <span className="text-sm text-white">Per Ton</span>
              </label>
            </div>
          </div>

          {/* Equipment Type */}
          <div>
            <label className="mb-2 block text-sm font-medium text-white">Equipment Type</label>
            <select
              required
              value={formData.equipment_type}
              onChange={(e) => setFormData({ ...formData, equipment_type: e.target.value })}
              className="w-full rounded-md border border-gray-600 bg-navy-lighter px-3 py-2 text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {EQUIPMENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Carrier */}
          <div>
            <label className="mb-2 block text-sm font-medium text-white">Carrier</label>
            <select
              value={formData.carrier_id}
              onChange={(e) => setFormData({ ...formData, carrier_id: e.target.value })}
              className="w-full rounded-md border border-gray-600 bg-navy-lighter px-3 py-2 text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">TBD - Not assigned</option>
              {carriers.map((carrier) => (
                <option key={carrier.id} value={carrier.id}>
                  {carrier.name}
                </option>
              ))}
            </select>
            {formData.carrier_id !== load.carrier_id && load.carrier_id && (
              <p className="mt-1 text-xs text-amber-500">
                ⚠️ Changing carrier will reset rate confirmation status
              </p>
            )}
          </div>

          {/* Pickup and Delivery Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-white">Pickup Date</label>
              <Input
                required
                type="date"
                value={formData.pickup_time}
                onChange={(e) => setFormData({ ...formData, pickup_time: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-white">Delivery Date</label>
              <Input
                required
                type="date"
                value={formData.delivery_time}
                onChange={(e) => setFormData({ ...formData, delivery_time: e.target.value })}
              />
            </div>
          </div>

          {/* Value and Client Billing */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-white">Carrier Cost ($)</label>
              <Input
                type="number"
                placeholder="0"
                value={formData.carrier_rate}
                onChange={(e) => setFormData({ ...formData, carrier_rate: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-white">Customer Rate ($)</label>
              <Input
                required
                type="number"
                placeholder="0"
                value={formData.customer_rate}
                onChange={(e) => setFormData({ ...formData, customer_rate: e.target.value })}
              />
            </div>
          </div>

          {/* Comments */}
          <div>
            <label className="mb-2 block text-sm font-medium text-white">
              Comments <span className="text-gray-400 text-xs font-normal">(Optional)</span>
            </label>
            <textarea
              placeholder="Add any notes or special instructions..."
              value={formData.comments}
              onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
              rows={3}
              className="w-full rounded-md border border-gray-600 bg-navy-lighter px-3 py-2 text-white placeholder-gray-500 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            />
          </div>

          {/* Submit Button */}
          <div className="flex gap-3">
            <Button
              type="button"
              onClick={() => onOpenChange(false)}
              className="flex-1 bg-gray-600 hover:bg-gray-700"
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="flex-1 bg-primary hover:bg-primary-hover"
            >
              {isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

