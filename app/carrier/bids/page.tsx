import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function CarrierBidsPage() {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: userData } = await supabase
    .from('users')
    .select('company_id')
    .eq('id', user!.id)
    .single()

  const { data: bids } = await supabase
    .from('bids')
    .select(`
      *,
      load:loads(load_number, pickup_location, delivery_location, pickup_time)
    `)
    .eq('carrier_id', userData?.company_id)
    .order('submitted_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">My Bids</h1>
        <p className="text-sm text-gray-400">Track your bid submissions and their status</p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-700">
        <table className="w-full">
          <thead className="border-b border-gray-700 bg-navy-lighter">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Load ID</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Route</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Pickup Date</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Bid Amount</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Submitted</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Status</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody>
            {bids && bids.length > 0 ? (
              bids.map((bid) => (
                <tr key={bid.id} className="border-b border-gray-700 hover:bg-navy-lighter transition-colors">
                  <td className="px-4 py-3 text-sm text-white">{bid.load?.load_number || `#${bid.load_id}`}</td>
                  <td className="px-4 py-3 text-sm text-white">
                    {bid.load?.pickup_location} → {bid.load?.delivery_location}
                  </td>
                  <td className="px-4 py-3 text-sm text-white">{formatDate(bid.load?.pickup_time)}</td>
                  <td className="px-4 py-3 text-sm text-white">{formatCurrency(bid.bid_amount)}</td>
                  <td className="px-4 py-3 text-sm text-white">{formatDate(bid.submitted_at)}</td>
                  <td className="px-4 py-3">
                    <Badge variant={bid.status} />
                  </td>
                  <td className="px-4 py-3">
                    {bid.status === 'pending' && (
                      <button className="text-red-500 hover:text-red-400 text-sm">
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                  No bids submitted yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

