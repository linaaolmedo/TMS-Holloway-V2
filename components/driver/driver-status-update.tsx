'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useToast } from '@/components/ui/toast'
import { updateLoadStatus } from '@/app/actions/loads'
import { CheckCircle, MapPin, Truck as TruckIcon, Package } from 'lucide-react'

interface DriverStatusUpdateProps {
  load: {
    id: number
    load_number: string | null
    status: string
  }
}

const DRIVER_STATUS_ACTIONS = [
  { 
    currentStatus: 'pending_pickup', 
    action: 'in_transit', 
    label: 'Mark as Picked Up',
    icon: CheckCircle,
    color: 'bg-blue-500 hover:bg-blue-600',
    description: 'Load has been picked up and is en route'
  },
  { 
    currentStatus: 'in_transit', 
    action: 'delivered', 
    label: 'Mark as Delivered',
    icon: Package,
    color: 'bg-green-500 hover:bg-green-600',
    description: 'Load has been delivered'
  },
]

export function DriverStatusUpdate({ load }: DriverStatusUpdateProps) {
  const [isPending, startTransition] = useTransition()
  const [notes, setNotes] = useState('')
  const [showNotes, setShowNotes] = useState(false)
  const { showToast } = useToast()

  // Find the appropriate action for current status
  const statusAction = DRIVER_STATUS_ACTIONS.find(a => a.currentStatus === load.status)

  if (!statusAction) {
    // No action available for current status
    return null
  }

  const handleStatusUpdate = async () => {
    if (showNotes && !notes.trim()) {
      showToast({
        type: 'warning',
        title: 'Notes Required',
        message: 'Please add notes or cancel to continue without notes'
      })
      return
    }

    startTransition(async () => {
      const result = await updateLoadStatus(
        load.id, 
        statusAction.action,
        notes || undefined
      )
      
      if (result.success) {
        setNotes('')
        setShowNotes(false)
        showToast({
          type: 'success',
          title: 'Status Updated',
          message: `Load ${statusAction.action === 'in_transit' ? 'marked as in transit' : 'marked as delivered'}`
        })
      } else {
        showToast({
          type: 'error',
          title: 'Update Failed',
          message: result.error || 'Failed to update status'
        })
      }
    })
  }

  const Icon = statusAction.icon

  return (
    <Card className="border-primary/50 bg-gradient-to-br from-primary/10 to-transparent">
      <CardContent className="pt-4 md:pt-6 space-y-3 md:space-y-4">
        <div className="flex items-start gap-3 md:gap-4">
          <div className={`p-2 md:p-3 rounded-lg ${statusAction.color} bg-opacity-20 flex-shrink-0`}>
            <Icon className="h-5 w-5 md:h-6 md:w-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base md:text-lg font-semibold text-white mb-1">
              Update Status
            </h3>
            <p className="text-xs md:text-sm text-gray-400">
              {statusAction.description}
            </p>
          </div>
        </div>

        {showNotes && (
          <div className="space-y-2">
            <label className="block text-xs md:text-sm font-medium text-gray-300">
              Add Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional information about this status change..."
              rows={3}
              className="w-full rounded-md border border-gray-600 bg-navy-lighter px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            />
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2">
          {!showNotes ? (
            <>
              <Button
                onClick={handleStatusUpdate}
                disabled={isPending}
                className={`flex-1 ${statusAction.color} text-sm md:text-base`}
              >
                {isPending ? 'Updating...' : statusAction.label}
              </Button>
              <Button
                onClick={() => setShowNotes(true)}
                variant="outline"
                disabled={isPending}
                className="border-gray-600 hover:bg-navy-lighter text-sm md:text-base whitespace-nowrap"
              >
                Add Notes
              </Button>
            </>
          ) : (
            <>
              <Button
                onClick={() => {
                  setShowNotes(false)
                  setNotes('')
                }}
                variant="outline"
                disabled={isPending}
                className="flex-1 border-gray-600 hover:bg-navy-lighter text-sm md:text-base"
              >
                Cancel
              </Button>
              <Button
                onClick={handleStatusUpdate}
                disabled={isPending}
                className={`flex-1 ${statusAction.color} text-sm md:text-base`}
              >
                {isPending ? 'Updating...' : 'Confirm Update'}
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

