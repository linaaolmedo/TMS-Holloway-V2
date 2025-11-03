'use client'

import { useState, useTransition } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { addCarrier } from '@/app/actions/carriers'

interface AddCarrierModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const EQUIPMENT_TYPES = [
  'Dry Van',
  'Reefer',
  'Flatbed',
  'Belt-fed Trailer',
  'End Dump',
  'Side Dump',
  'Hopper Bottom',
  'Live Bottom Trailer',
  '4400 Regular Cab',
  'Coronado',
  'Cascadia',
  '122SD',
  'T680',
  'AN64T Day',
  'CXUG13',
  'Eagle Bridge',
  'Express 44\'',
  'Goose Neck',
  '44\'',
  'Trinity',
  'Rocket',
  'Utility',
  'M2 112',
]

export function AddCarrierModal({ open, onOpenChange }: AddCarrierModalProps) {
  const [isPending, startTransition] = useTransition()
  const [formData, setFormData] = useState({
    name: '',
    mc_number: '',
    number_of_trucks: '1',
    contact_person: '',
    phone: '',
    email: '',
    equipment_types: [] as string[],
    do_not_use: false,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    startTransition(async () => {
      const result = await addCarrier(formData)
      if (result.success) {
        onOpenChange(false)
        // Reset form
        setFormData({
          name: '',
          mc_number: '',
          number_of_trucks: '1',
          contact_person: '',
          phone: '',
          email: '',
          equipment_types: [],
          do_not_use: false,
        })
      } else {
        alert(result.error || 'Failed to create carrier')
      }
    })
  }

  const toggleEquipmentType = (type: string) => {
    setFormData({
      ...formData,
      equipment_types: formData.equipment_types.includes(type)
        ? formData.equipment_types.filter((t) => t !== type)
        : [...formData.equipment_types, type],
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)}>
        <DialogHeader onClose={() => onOpenChange(false)}>
          <DialogTitle>Add New Carrier</DialogTitle>
          <DialogDescription>
            Fill in the details below to create a new carrier record.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="max-h-[70vh] space-y-4 overflow-y-auto pr-2">
          {/* Carrier Name and MC Number */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-white">
                Carrier Name
              </label>
              <Input
                required
                placeholder="e.g., AgriTrans"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-white">MC Number</label>
              <Input
                placeholder="e.g., MC-123456"
                value={formData.mc_number}
                onChange={(e) => setFormData({ ...formData, mc_number: e.target.value })}
              />
            </div>
          </div>

          {/* Number of Trucks */}
          <div>
            <label className="mb-2 block text-sm font-medium text-white">Number of Trucks</label>
            <Input
              required
              type="number"
              min="1"
              value={formData.number_of_trucks}
              onChange={(e) => setFormData({ ...formData, number_of_trucks: e.target.value })}
            />
          </div>

          {/* Contact Person */}
          <div>
            <label className="mb-2 block text-sm font-medium text-white">Contact Person</label>
            <Input
              placeholder="e.g., John Smith"
              value={formData.contact_person}
              onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
            />
          </div>

          {/* Phone Number */}
          <div>
            <label className="mb-2 block text-sm font-medium text-white">Phone Number</label>
            <Input
              type="tel"
              placeholder="e.g., 555-123-4567"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          {/* Email */}
          <div>
            <label className="mb-2 block text-sm font-medium text-white">Email</label>
            <Input
              type="email"
              placeholder="e.g., john.s@agritrans.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          {/* Equipment Types */}
          <div>
            <label className="mb-2 block text-sm font-medium text-white">Equipment Types</label>
            <div className="grid grid-cols-3 gap-2 rounded-md border border-gray-600 bg-navy-lighter p-4">
              {EQUIPMENT_TYPES.map((type) => (
                <label
                  key={type}
                  className="flex cursor-pointer items-center gap-2 text-sm text-white"
                >
                  <input
                    type="checkbox"
                    checked={formData.equipment_types.includes(type)}
                    onChange={() => toggleEquipmentType(type)}
                    className="h-4 w-4 rounded border-gray-500 bg-navy text-primary focus:ring-2 focus:ring-primary"
                  />
                  <span>{type}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Do Not Use */}
          <div className="rounded-md border border-red-600 bg-red-900/20 p-4">
            <label className="flex cursor-pointer items-start gap-2">
              <input
                type="checkbox"
                checked={formData.do_not_use}
                onChange={(e) => setFormData({ ...formData, do_not_use: e.target.checked })}
                className="mt-0.5 h-4 w-4 rounded border-gray-500 bg-navy text-red-600 focus:ring-2 focus:ring-red-600"
              />
              <div>
                <div className="text-sm font-medium text-red-400">Do Not Use</div>
                <div className="text-xs text-red-300">
                  This carrier will be prevented from being assigned to new loads
                </div>
              </div>
            </label>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isPending}
            className="w-full bg-red-600 hover:bg-red-700"
          >
            {isPending ? 'Adding Carrier...' : 'Add Carrier'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

