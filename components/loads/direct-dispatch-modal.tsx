'use client'

import { useState, useTransition } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Truck, User } from 'lucide-react'
import { assignInternalDriver } from '@/app/actions/loads'
import { useToast } from '@/components/ui/toast'

interface DirectDispatchModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  load: {
    id: number
    load_number: string | null
    pickup_location: string | null
    delivery_location: string | null
  }
  drivers: Array<{ id: string; name: string }>
}

export function DirectDispatchModal({ open, onOpenChange, load, drivers }: DirectDispatchModalProps) {
  const [selectedDriver, setSelectedDriver] = useState('')
  const [isPending, startTransition] = useTransition()
  const { showToast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedDriver) {
      showToast({
        type: 'error',
        title: 'No Driver Selected',
        message: 'Please select a driver to dispatch.',
        duration: 3000
      })
      return
    }

    startTransition(async () => {
      const result = await assignInternalDriver(load.id, selectedDriver)
      
      if (result.success) {
        showToast({
          type: 'success',
          title: 'Driver Assigned!',
          message: 'Load has been dispatched to your internal fleet.',
          duration: 5000
        })
        onOpenChange(false)
        setSelectedDriver('')
      } else {
        showToast({
          type: 'error',
          title: 'Assignment Failed',
          message: result.error || 'Could not assign driver.',
          duration: 5000
        })
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-primary" />
            Direct Dispatch to Fleet
          </DialogTitle>
          <DialogDescription>
            Assign {load.load_number || `Load #${load.id}`} to an internal driver
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Load Info */}
          <div className="rounded-lg border border-gray-700 bg-navy-lighter p-4">
            <h4 className="text-sm font-medium text-white mb-2">Load Details</h4>
            <div className="space-y-1 text-sm">
              <p className="text-gray-300">
                <span className="text-gray-400">From:</span> {load.pickup_location || 'N/A'}
              </p>
              <p className="text-gray-300">
                <span className="text-gray-400">To:</span> {load.delivery_location || 'N/A'}
              </p>
            </div>
          </div>

          {/* Driver Selection */}
          <div>
            <label className="mb-2 block text-sm font-medium text-white">
              Select Driver <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={selectedDriver}
              onChange={(e) => setSelectedDriver(e.target.value)}
              className="w-full rounded-md border border-gray-600 bg-navy-lighter px-3 py-2 text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">Choose a driver...</option>
              {drivers.map((driver) => (
                <option key={driver.id} value={driver.id}>
                  {driver.name}
                </option>
              ))}
            </select>
          </div>

          {/* Info Note */}
          <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-3">
            <p className="text-sm text-blue-400">
              ℹ️ Dispatching to internal fleet will remove any external carrier assignment and mark this as an internal haul.
            </p>
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
              disabled={isPending || !selectedDriver}
              className="flex-1 bg-primary hover:bg-primary-hover"
            >
              {isPending ? 'Assigning...' : 'Dispatch to Driver'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

