'use client'

import { useState, useTransition } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { updateLoadStatus } from '@/app/actions/loads'
import { RefreshCw } from 'lucide-react'

interface ChangeStatusModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  load: {
    id: number
    load_number: string | null
    status: string
  }
}

const STATUS_OPTIONS = [
  { value: 'pending_pickup', label: 'Pending Pickup', color: 'text-yellow-500' },
  { value: 'in_transit', label: 'In Transit', color: 'text-blue-500' },
  { value: 'delivered', label: 'Delivered', color: 'text-green-500' },
  { value: 'delayed', label: 'Delayed', color: 'text-orange-500' },
  { value: 'cancelled', label: 'Cancelled', color: 'text-red-500' },
  { value: 'closed', label: 'Closed', color: 'text-gray-500' },
]

export function ChangeStatusModal({ open, onOpenChange, load }: ChangeStatusModalProps) {
  const [isPending, startTransition] = useTransition()
  const [selectedStatus, setSelectedStatus] = useState(load.status)
  const [notes, setNotes] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (selectedStatus === load.status) {
      alert('Please select a different status')
      return
    }

    startTransition(async () => {
      const result = await updateLoadStatus(load.id, selectedStatus, notes)
      if (result.success) {
        onOpenChange(false)
        setNotes('')
      } else {
        alert(result.error || 'Failed to update status')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)}>
        <DialogHeader onClose={() => onOpenChange(false)}>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-primary" />
            Change Load Status
          </DialogTitle>
          <DialogDescription>
            Update the status for {load.load_number || `Load #${load.id}`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Current Status */}
          <div className="rounded-lg border border-gray-700 bg-navy-lighter p-4">
            <p className="text-sm text-gray-400 mb-1">Current Status</p>
            <p className="text-base font-medium text-white capitalize">
              {STATUS_OPTIONS.find(s => s.value === load.status)?.label || load.status.replace('_', ' ')}
            </p>
          </div>

          {/* New Status Selection */}
          <div>
            <label className="mb-2 block text-sm font-medium text-white">
              New Status
            </label>
            <select
              required
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full rounded-md border border-gray-600 bg-navy-lighter px-3 py-2 text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {STATUS_OPTIONS.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="mb-2 block text-sm font-medium text-white">
              Notes <span className="text-gray-400 text-xs font-normal">(Optional)</span>
            </label>
            <textarea
              placeholder="Add any notes about this status change..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full rounded-md border border-gray-600 bg-navy-lighter px-3 py-2 text-white placeholder-gray-500 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            />
          </div>

          {/* Warning if trying to close */}
          {selectedStatus === 'closed' && (
            <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 p-3">
              <p className="text-sm text-amber-500">
                ⚠️ Closing a load will move it to the audit log. Make sure an invoice has been generated first.
              </p>
            </div>
          )}

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
              disabled={isPending || selectedStatus === load.status}
              className="flex-1 bg-primary hover:bg-primary-hover"
            >
              {isPending ? 'Updating...' : 'Update Status'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

