'use client'

import { useState } from 'react'
import { Dialog } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { X, Send } from 'lucide-react'
import { useToast } from '@/components/ui/toast'

interface RateConfirmationModalProps {
  load: {
    id: number
    load_number: string | null
    pickup_location: string | null
    delivery_location: string | null
    pickup_time: string | null
    delivery_time: string | null
    commodity: string | null
    equipment_type: string | null
    carrier_rate: number | null
    carrier?: { name: string }
  }
  onClose: () => void
  showSendButton?: boolean
}

export function RateConfirmationModal({ load, onClose, showSendButton = true }: RateConfirmationModalProps) {
  const [sending, setSending] = useState(false)
  const { showToast } = useToast()
  
  const handleSend = async () => {
    setSending(true)
    
    const { sendRateConfirmation } = await import('@/app/actions/loads')
    const result = await sendRateConfirmation(load.id)
    
    setSending(false)
    
    if (result.success) {
      showToast({
        type: 'success',
        title: 'Rate Confirmation Sent!',
        message: result.message || 'The carrier has been notified.',
        duration: 5000
      })
      onClose()
    } else {
      showToast({
        type: 'error',
        title: 'Failed to Send',
        message: result.error || 'Could not send rate confirmation.',
        duration: 5000
      })
    }
  }
  
  const confirmationNumber = `RC-${new Date().getFullYear()}${String(load.id).padStart(4, '0')}`
  
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <div className="w-full max-w-2xl rounded-lg border border-gray-700 bg-navy-light p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-6 pb-4 border-b border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-white">RATE CONFIRMATION</h2>
            <p className="text-sm text-gray-400">BulkFlow TMS</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Confirmation Info */}
        <div className="space-y-4 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-400">Confirmation #</p>
              <p className="text-white font-medium">{confirmationNumber}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Load Number</p>
              <p className="text-white font-medium">{load.load_number || `#${load.id}`}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Carrier</p>
              <p className="text-white font-medium">{load.carrier?.name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Date</p>
              <p className="text-white font-medium">{new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* Shipment Details */}
        <div className="mb-6">
          <h3 className="text-lg font-bold text-white mb-3 pb-2 border-b border-gray-700">
            Shipment Details
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-400">From</p>
              <p className="text-white">{load.pickup_location || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">To</p>
              <p className="text-white">{load.delivery_location || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Pickup Date</p>
              <p className="text-white">
                {load.pickup_time ? new Date(load.pickup_time).toLocaleDateString() : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Delivery Date</p>
              <p className="text-white">
                {load.delivery_time ? new Date(load.delivery_time).toLocaleDateString() : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Commodity</p>
              <p className="text-white">{load.commodity || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Equipment</p>
              <p className="text-white">{load.equipment_type || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Rate */}
        <div className="mb-6 p-6 bg-primary/10 rounded-lg border-2 border-primary">
          <p className="text-sm text-gray-400 mb-2">Carrier Rate</p>
          <p className="text-4xl font-bold text-primary">
            ${load.carrier_rate?.toFixed(2) || '0.00'}
          </p>
        </div>

        {/* Terms */}
        <div className="mb-6 p-4 bg-navy-lighter rounded-lg">
          <h4 className="font-bold text-white mb-2">Terms and Conditions:</h4>
          <ul className="text-sm text-gray-300 space-y-1">
            <li>• Carrier agrees to transport the shipment according to the details outlined above.</li>
            <li>• Payment terms: Net 30 days from delivery date.</li>
            <li>• Carrier must maintain appropriate insurance coverage.</li>
            <li>• Any additional charges must be pre-approved in writing.</li>
            <li>• Carrier is responsible for providing proof of delivery upon completion.</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {showSendButton && (
            <Button 
              onClick={handleSend}
              disabled={sending}
              className="gap-2"
            >
              <Send className="h-4 w-4" />
              {sending ? 'Sending...' : 'Send to Carrier'}
            </Button>
          )}
        </div>
      </div>
    </Dialog>
  )
}

