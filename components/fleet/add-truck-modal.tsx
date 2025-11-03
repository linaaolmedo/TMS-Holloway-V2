'use client'

import { useState, useTransition } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { addTruck } from '@/app/actions/fleet'

interface AddTruckModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddTruckModal({ open, onOpenChange }: AddTruckModalProps) {
  const [isPending, startTransition] = useTransition()
  const [formData, setFormData] = useState({
    unit_number: '',
    vin: '',
    make: '',
    model: '',
    year: new Date().getFullYear().toString(),
    status: 'available',
    price_per_mile: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    startTransition(async () => {
      const result = await addTruck(formData)
      if (result.success) {
        onOpenChange(false)
        // Reset form
        setFormData({
          unit_number: '',
          vin: '',
          make: '',
          model: '',
          year: new Date().getFullYear().toString(),
          status: 'available',
          price_per_mile: '',
        })
      } else {
        alert(result.error || 'Failed to add truck')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)}>
        <DialogHeader onClose={() => onOpenChange(false)}>
          <DialogTitle>Add New Truck</DialogTitle>
          <DialogDescription>
            Enter the details for the new truck to add it to your fleet.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Unit Number and VIN */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-white">
                Unit Number
              </label>
              <Input
                required
                placeholder="e.g., H-105"
                value={formData.unit_number}
                onChange={(e) => setFormData({ ...formData, unit_number: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-white">VIN</label>
              <Input
                placeholder="17-digit VIN"
                maxLength={17}
                value={formData.vin}
                onChange={(e) => setFormData({ ...formData, vin: e.target.value })}
              />
            </div>
          </div>

          {/* Make, Model, Year */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-white">Make</label>
              <Input
                placeholder="e.g., Peterbilt"
                value={formData.make}
                onChange={(e) => setFormData({ ...formData, make: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-white">Model</label>
              <Input
                placeholder="e.g., 579"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-white">Year</label>
              <Input
                type="number"
                min="1900"
                max={new Date().getFullYear() + 1}
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="mb-2 block text-sm font-medium text-white">Status</label>
            <select
              required
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full rounded-md border border-gray-600 bg-navy-lighter px-3 py-2 text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="available">Available</option>
              <option value="in_use">In Use</option>
              <option value="maintenance">Maintenance</option>
              <option value="out_of_service">Out of Service</option>
            </select>
          </div>

          {/* Price Per Mile on Gas */}
          <div>
            <label className="mb-2 block text-sm font-medium text-white">
              Price Per Mile on Gas ($)
            </label>
            <Input
              type="number"
              step="0.01"
              min="0"
              placeholder="e.g., 0.45"
              value={formData.price_per_mile}
              onChange={(e) => setFormData({ ...formData, price_per_mile: e.target.value })}
            />
            <p className="mt-1 text-xs text-gray-400">
              Cost per mile for fuel consumption
            </p>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isPending}
            className="w-full bg-red-600 hover:bg-red-700"
          >
            {isPending ? 'Adding Truck...' : 'Add Truck'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

