'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { confirmRate } from '@/app/actions/loads'
import { useRouter } from 'next/navigation'
import { CheckCircle2, X, DollarSign } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export function ConfirmRateButton({ 
  loadId, 
  carrierRate 
}: { 
  loadId: number
  carrierRate: number | null
}) {
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleConfirm = async () => {
    setError('')
    setLoading(true)

    try {
      const result = await confirmRate(loadId)

      if (!result.success) {
        setError(result.error || 'Failed to confirm rate')
        setLoading(false)
        return
      }

      // Success - close modal and refresh
      setShowModal(false)
      router.refresh()
    } catch (err) {
      setError('An unexpected error occurred')
      setLoading(false)
    }
  }

  return (
    <>
      <Button 
        onClick={() => setShowModal(true)} 
        className="w-full bg-amber-500 hover:bg-amber-600 text-white"
      >
        <CheckCircle2 className="h-4 w-4 mr-2" />
        Confirm Rate
      </Button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-navy-light border border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Confirm Rate</h2>
              <button 
                onClick={() => setShowModal(false)} 
                className="text-gray-400 hover:text-white"
                disabled={loading}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              {error && (
                <div className="rounded-md bg-red-500/10 border border-red-500 p-3 text-sm text-red-500">
                  {error}
                </div>
              )}

              <div className="rounded-lg bg-navy-lighter border border-gray-700 p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="rounded-full bg-primary/10 p-2">
                    <DollarSign className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Load #{loadId}</p>
                    <p className="text-xs text-gray-500">Your carrier rate</p>
                  </div>
                </div>
                <p className="text-3xl font-bold text-primary">
                  {formatCurrency(carrierRate)}
                </p>
              </div>

              <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-4">
                <p className="text-sm text-amber-200 mb-2">
                  <strong>Important:</strong> By confirming this rate, you agree to:
                </p>
                <ul className="text-xs text-amber-200/80 space-y-1 list-disc list-inside">
                  <li>Complete the load at the specified rate</li>
                  <li>Meet all pickup and delivery requirements</li>
                  <li>Provide timely status updates</li>
                  <li>Submit proof of delivery upon completion</li>
                </ul>
              </div>

              <div className="flex gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowModal(false)} 
                  className="flex-1"
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleConfirm} 
                  className="flex-1 bg-amber-500 hover:bg-amber-600"
                  disabled={loading}
                >
                  {loading ? (
                    'Confirming...'
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Confirm & Accept
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

