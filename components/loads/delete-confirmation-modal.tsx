'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

interface DeleteConfirmationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  loadNumber: string | null
  loadId: number
}

export function DeleteConfirmationModal({
  open,
  onOpenChange,
  onConfirm,
  loadNumber,
  loadId
}: DeleteConfirmationModalProps) {
  const handleConfirm = () => {
    onConfirm()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-500">
            <AlertTriangle className="h-5 w-5" />
            Archive Load
          </DialogTitle>
          <DialogDescription>
            This action will archive the load but can be undone by database administrators.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
            <p className="text-sm text-white">
              Are you sure you want to archive{' '}
              <span className="font-semibold">{loadNumber || `Load #${loadId}`}</span>?
            </p>
            <p className="text-xs text-gray-400 mt-2">
              The load will be soft-deleted and stored in the database for record keeping.
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              onClick={() => onOpenChange(false)}
              className="flex-1 bg-gray-600 hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleConfirm}
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              Archive Load
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

