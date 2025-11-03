'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { X, DollarSign } from 'lucide-react'

interface LoadDetails {
  id: number
  load_number: string | null
  pickup_location: string | null
  delivery_location: string | null
  commodity: string | null
}

interface ExistingBid {
  load_id: number
  bid_amount: number
  status: string
}

export function SubmitBidButton({ 
  loadId, 
  loadDetails,
  existingBid
}: { 
  loadId: number
  loadDetails?: LoadDetails
  existingBid?: ExistingBid
}) {
  const [showModal, setShowModal] = useState(false)
  const [bidAmount, setBidAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('You must be logged in')
        setLoading(false)
        return
      }

      const { data: userData } = await supabase
        .from('users')
        .select('company_id, companies:company_id(name)')
        .eq('id', user.id)
        .single()

      const { error: bidError } = await supabase
        .from('bids')
        .insert({
          load_id: loadId,
          carrier_id: userData?.company_id,
          bid_amount: parseFloat(bidAmount),
          status: 'pending',
        })

      if (bidError) {
        setError(bidError.message)
        setLoading(false)
        return
      }

      // Notify dispatchers about the new bid
      const { notifyDispatchers } = await import('@/app/actions/notifications')
      await notifyDispatchers({
        type: 'bid',
        title: 'New Bid Received',
        message: `${(userData as any)?.companies?.name || 'A carrier'} placed a bid of $${parseFloat(bidAmount).toFixed(2)} on Load ${loadDetails?.load_number || `#${loadId}`}`,
        link: `/dashboard/loads`,
        relatedEntityType: 'bid',
        relatedEntityId: loadId,
        metadata: {
          carrier_id: userData?.company_id,
          load_id: loadId,
          bid_amount: parseFloat(bidAmount),
        }
      })

      setShowModal(false)
      setBidAmount('')
      router.refresh()
    } catch (err) {
      setError('An unexpected error occurred')
      setLoading(false)
    }
  }

  // If bid already exists, show bid placed state
  if (existingBid) {
    return (
      <Button 
        disabled 
        className="w-full bg-gray-600 text-gray-300 cursor-not-allowed hover:bg-gray-600"
      >
        Bid Placed for ${existingBid.bid_amount.toFixed(2)}
      </Button>
    )
  }

  return (
    <>
      <Button onClick={() => setShowModal(true)} className="w-full bg-primary hover:bg-primary/90">
        Place Bid
      </Button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-navy-light border border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">
                Place Bid on Load {loadDetails?.load_number || `BF-${loadId}`}
              </h2>
              <button 
                onClick={() => setShowModal(false)} 
                className="text-gray-400 hover:text-white"
                disabled={loading}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {loadDetails && (
              <div className="mb-6 space-y-2 rounded-lg bg-navy-lighter border border-gray-700 p-4">
                <p className="text-xs text-gray-400 mb-2">Enter your all-inclusive bid amount for this shipment.</p>
                <div className="space-y-1.5 text-sm">
                  <div>
                    <span className="font-semibold text-white">Origin: </span>
                    <span className="text-gray-300">{loadDetails.pickup_location || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-white">Destination: </span>
                    <span className="text-gray-300">{loadDetails.delivery_location || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-white">Commodity: </span>
                    <span className="text-gray-300">{loadDetails.commodity || 'N/A'}</span>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-md bg-red-500/10 border border-red-500 p-3 text-sm text-red-500">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="bid-amount" className="block text-sm font-medium text-white mb-2">
                  Your Bid Amount ($)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <DollarSign className="h-4 w-4 text-gray-400" />
                  </div>
                  <Input
                    id="bid-amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    placeholder="0"
                    className="pl-10 text-lg font-semibold border-primary/50 focus:border-primary"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-2.5"
                disabled={loading || !bidAmount}
              >
                <DollarSign className="h-4 w-4 mr-2" />
                {loading ? 'Submitting Bid...' : 'Submit Bid'}
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}


