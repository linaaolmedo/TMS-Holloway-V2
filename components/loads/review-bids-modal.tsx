'use client'

import { useState } from 'react'
import { X, DollarSign, Clock, CheckCircle2, XCircle, Truck } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

interface Bid {
  id: number
  bid_amount: number
  submitted_at: string
  status: string
  carrier: {
    id: string
    name: string
  }
}

interface ReviewBidsModalProps {
  loadId: number
  loadNumber: string | null
  bids: Bid[]
  onClose: () => void
}

export function ReviewBidsModal({ loadId, loadNumber, bids, onClose }: ReviewBidsModalProps) {
  const [loading, setLoading] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [confirmAction, setConfirmAction] = useState<{ type: 'accept' | 'reject'; bid: Bid } | null>(null)
  const router = useRouter()

  const handleAcceptBid = async (bid: Bid) => {
    setLoading(bid.id)
    setError('')

    try {
      const { acceptBid } = await import('@/app/actions/carriers')
      const result = await acceptBid(loadId, bid.id, bid.carrier.id, bid.bid_amount)

      if (!result.success) {
        setError(result.error || 'Failed to accept bid')
        setLoading(null)
        setConfirmAction(null)
        return
      }

      // Success - refresh page to show updated carrier
      setConfirmAction(null)
      window.location.reload()
    } catch (err) {
      setError('An unexpected error occurred')
      setLoading(null)
      setConfirmAction(null)
    }
  }

  const handleRejectBid = async (bid: Bid) => {
    setLoading(bid.id)
    setError('')

    try {
      const { rejectBid } = await import('@/app/actions/carriers')
      const result = await rejectBid(bid.id)

      if (!result.success) {
        setError(result.error || 'Failed to reject bid')
        setLoading(null)
        setConfirmAction(null)
        return
      }

      router.refresh()
      setConfirmAction(null)
      
      // If no more pending bids, close modal
      const remainingBids = bids.filter(b => b.id !== bid.id && b.status === 'pending')
      if (remainingBids.length === 0) {
        onClose()
      }
    } catch (err) {
      setError('An unexpected error occurred')
      setLoading(null)
      setConfirmAction(null)
    }
  }

  const pendingBids = bids.filter(bid => bid.status === 'pending')
  const lowestBid = pendingBids.length > 0 
    ? Math.min(...pendingBids.map(b => b.bid_amount))
    : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-3xl rounded-lg border border-gray-700 bg-navy-light shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-700 p-6">
          <div>
            <h2 className="text-2xl font-bold text-white">
              Review Bids - {loadNumber || `Load #${loadId}`}
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              {pendingBids.length} pending bid{pendingBids.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-gray-400 hover:bg-navy-lighter hover:text-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[calc(100vh-12rem)] overflow-y-auto">
          {error && (
            <div className="rounded-md bg-red-500/10 border border-red-500 p-3 text-sm text-red-500">
              {error}
            </div>
          )}

          {pendingBids.length === 0 ? (
            <div className="py-12 text-center">
              <Clock className="mx-auto h-12 w-12 text-gray-600 mb-4" />
              <p className="text-sm text-gray-400">No pending bids for this load</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingBids
                .sort((a, b) => a.bid_amount - b.bid_amount) // Sort by lowest first
                .map((bid) => (
                  <div
                    key={bid.id}
                    className={`rounded-lg border ${
                      bid.bid_amount === lowestBid
                        ? 'border-green-500/50 bg-green-500/5'
                        : 'border-gray-700 bg-navy-lighter'
                    } p-4`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        {/* Carrier Info */}
                        <div className="flex items-center gap-3">
                          <div className="rounded-full bg-orange-500/10 p-2">
                            <Truck className="h-5 w-5 text-orange-500" />
                          </div>
                          <div>
                            <p className="text-lg font-semibold text-white">{bid.carrier.name}</p>
                            <p className="text-xs text-gray-400">
                              Submitted {formatDate(bid.submitted_at)}
                            </p>
                          </div>
                          {bid.bid_amount === lowestBid && (
                            <span className="rounded-full bg-green-500/10 px-3 py-1 text-xs font-medium text-green-500">
                              Lowest Bid
                            </span>
                          )}
                        </div>

                        {/* Bid Amount */}
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-5 w-5 text-primary" />
                          <span className="text-2xl font-bold text-primary">
                            {formatCurrency(bid.bid_amount)}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2">
                        <Button
                          onClick={() => setConfirmAction({ type: 'accept', bid })}
                          disabled={loading !== null}
                          className="bg-green-600 hover:bg-green-700 text-white gap-2"
                          size="sm"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          Accept
                        </Button>
                        <Button
                          onClick={() => setConfirmAction({ type: 'reject', bid })}
                          disabled={loading !== null}
                          variant="outline"
                          className="border-red-500 text-red-500 hover:bg-red-500/10 gap-2"
                          size="sm"
                        >
                          <XCircle className="h-4 w-4" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}

          {/* Previously Accepted/Rejected Bids */}
          {bids.some(b => b.status !== 'pending') && (
            <div className="mt-6 border-t border-gray-700 pt-4">
              <h3 className="text-sm font-medium text-gray-400 mb-3">Previous Bids</h3>
              <div className="space-y-2">
                {bids
                  .filter(bid => bid.status !== 'pending')
                  .map(bid => (
                    <div
                      key={bid.id}
                      className="rounded-lg border border-gray-700 bg-navy-lighter p-3 opacity-60"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Truck className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-400">{bid.carrier.name}</span>
                          <span className="text-sm font-medium text-white">
                            {formatCurrency(bid.bid_amount)}
                          </span>
                        </div>
                        <span
                          className={`text-xs font-medium ${
                            bid.status === 'accepted' ? 'text-green-500' : 'text-red-500'
                          }`}
                        >
                          {bid.status.charAt(0).toUpperCase() + bid.status.slice(1)}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-gray-700 p-6">
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmAction && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-md rounded-lg border border-gray-700 bg-navy-light shadow-2xl">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-white mb-4">
                {confirmAction.type === 'accept' ? 'Accept Bid?' : 'Reject Bid?'}
              </h3>
              
              {confirmAction.type === 'accept' ? (
                <div className="space-y-4">
                  <p className="text-sm text-gray-300">
                    Accept bid of <span className="font-semibold text-primary">{formatCurrency(confirmAction.bid.bid_amount)}</span> from <span className="font-semibold text-white">{confirmAction.bid.carrier.name}</span>?
                  </p>
                  <div className="rounded-lg bg-green-500/10 border border-green-500/30 p-3">
                    <p className="text-xs text-green-300">
                      This will assign the carrier to the load and reject all other pending bids.
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-300">
                  Are you sure you want to reject the bid from <span className="font-semibold text-white">{confirmAction.bid.carrier.name}</span>?
                </p>
              )}

              <div className="flex gap-3 mt-6">
                <Button
                  onClick={() => setConfirmAction(null)}
                  variant="outline"
                  className="flex-1"
                  disabled={loading !== null}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (confirmAction.type === 'accept') {
                      handleAcceptBid(confirmAction.bid)
                    } else {
                      handleRejectBid(confirmAction.bid)
                    }
                  }}
                  className={confirmAction.type === 'accept' 
                    ? 'flex-1 bg-green-600 hover:bg-green-700' 
                    : 'flex-1 bg-red-600 hover:bg-red-700'
                  }
                  disabled={loading !== null}
                >
                  {loading === confirmAction.bid.id ? (
                    confirmAction.type === 'accept' ? 'Accepting...' : 'Rejecting...'
                  ) : (
                    confirmAction.type === 'accept' ? 'Accept Bid' : 'Reject Bid'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

