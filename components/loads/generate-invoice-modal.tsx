'use client'

import { useState, useTransition } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { generateInvoice } from '@/app/actions/invoices'
import { FileText, CheckCircle2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface GenerateInvoiceModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  load: {
    id: number
    load_number: string | null
    status: string
    customer_rate: number | null
    customer?: { name: string }
  }
}

export function GenerateInvoiceModal({ open, onOpenChange, load }: GenerateInvoiceModalProps) {
  const [isPending, startTransition] = useTransition()
  const [invoiceId, setInvoiceId] = useState<number | null>(null)

  const handleGenerate = async () => {
    startTransition(async () => {
      const result = await generateInvoice(load.id)
      if (result.success) {
        setInvoiceId(result.data.id)
      } else {
        alert(result.error || 'Failed to generate invoice')
      }
    })
  }

  const handleDownload = () => {
    if (invoiceId) {
      window.open(`/api/invoices/${invoiceId}/pdf`, '_blank')
    }
  }

  const handleClose = () => {
    onOpenChange(false)
    setInvoiceId(null)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent onClose={handleClose}>
        <DialogHeader onClose={handleClose}>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            {invoiceId ? 'Invoice Generated' : 'Generate Invoice'}
          </DialogTitle>
          <DialogDescription>
            {invoiceId 
              ? 'Your invoice has been created successfully.'
              : `Create invoice for ${load.load_number || `Load #${load.id}`}`
            }
          </DialogDescription>
        </DialogHeader>

        {!invoiceId ? (
          <div className="space-y-4">
            {/* Load Summary */}
            <div className="rounded-lg border border-gray-700 bg-navy-lighter p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-400">Load Number:</span>
                <span className="text-sm font-medium text-white">
                  {load.load_number || `#${load.id}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-400">Customer:</span>
                <span className="text-sm font-medium text-white">
                  {load.customer?.name || 'Unknown'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-400">Status:</span>
                <span className="text-sm font-medium text-white capitalize">
                  {load.status.replace('_', ' ')}
                </span>
              </div>
              <div className="flex justify-between border-t border-gray-700 pt-3">
                <span className="text-base font-medium text-white">Amount:</span>
                <span className="text-xl font-bold text-primary">
                  {formatCurrency(load.customer_rate)}
                </span>
              </div>
            </div>

            {/* Warning if not delivered */}
            {load.status !== 'delivered' && load.status !== 'closed' && (
              <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 p-3">
                <p className="text-sm text-amber-500">
                  ⚠️ Note: Load status is &quot;{load.status}&quot;. Invoices are typically generated after delivery.
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                type="button"
                onClick={handleClose}
                className="flex-1 bg-gray-600 hover:bg-gray-700"
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={isPending}
                className="flex-1 bg-primary hover:bg-primary-hover"
              >
                {isPending ? 'Generating...' : 'Generate Invoice'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Success Message */}
            <div className="rounded-lg border border-green-500/50 bg-green-500/10 p-6 text-center">
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
              <p className="text-lg font-medium text-white mb-2">Invoice Created!</p>
              <p className="text-sm text-gray-400">
                Invoice has been generated and is ready to download.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                onClick={handleClose}
                className="flex-1 bg-gray-600 hover:bg-gray-700"
              >
                Close
              </Button>
              <Button
                onClick={handleDownload}
                className="flex-1 bg-primary hover:bg-primary-hover"
              >
                Download PDF
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

