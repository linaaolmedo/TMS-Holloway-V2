import { createClient } from '@/lib/supabase/server'
import { Input } from '@/components/ui/input'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Search, MapPin, Package, Calendar, DollarSign, CheckCircle2 } from 'lucide-react'
import { SubmitBidButton } from '@/components/carrier/submit-bid-button'
import { ConfirmRateButton } from '@/components/carrier/confirm-rate-button'

export const dynamic = 'force-dynamic'

export default async function LoadBoardPage() {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: userData } = await supabase
    .from('users')
    .select('company_id')
    .eq('id', user!.id)
    .single()

  // Fetch loads assigned to this carrier that need rate confirmation
  const { data: assignedLoads } = await supabase
    .from('loads')
    .select('*')
    .eq('carrier_id', userData?.company_id)
    .eq('rate_confirmed', false)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  // Fetch available loads (not assigned yet or posted for bidding)
  const { data: availableLoads } = await supabase
    .from('loads')
    .select('*')
    .is('carrier_id', null)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  // Fetch carrier's bids for these loads
  const { data: carrierBids } = await supabase
    .from('bids')
    .select('load_id, bid_amount, status')
    .eq('carrier_id', userData?.company_id)

  // Create a map of load_id to bid for quick lookup
  const bidsMap = new Map(
    carrierBids?.map(bid => [bid.load_id, bid]) || []
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Load Board</h1>
        <p className="text-sm text-gray-400">Browse loads and confirm rates</p>
      </div>

      {/* Pending Rate Confirmation Section */}
      {assignedLoads && assignedLoads.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-1 w-1 rounded-full bg-amber-500 animate-pulse"></div>
            <h2 className="text-xl font-semibold text-white">Pending Rate Confirmation</h2>
            <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-500">
              {assignedLoads.length} load{assignedLoads.length !== 1 ? 's' : ''}
            </span>
          </div>
          <p className="text-sm text-gray-400">These loads have been assigned to you. Please review and confirm the rates.</p>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {assignedLoads.map((load) => (
              <div
                key={load.id}
                className="rounded-lg border-2 border-amber-500/30 bg-navy-light p-4 shadow-lg"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{load.load_number || `Load #${load.id}`}</h3>
                    <p className="text-xs text-gray-400">Assigned {formatDate(load.created_at)}</p>
                  </div>
                  <div className="rounded-full bg-amber-500/10 p-1.5">
                    <DollarSign className="h-4 w-4 text-amber-500" />
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white">Pickup</p>
                      <p className="text-xs text-gray-400 truncate">{load.pickup_location || 'Not specified'}</p>
                      <p className="text-xs text-gray-500">{formatDate(load.pickup_time)}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white">Delivery</p>
                      <p className="text-xs text-gray-400 truncate">{load.delivery_location || 'Not specified'}</p>
                      <p className="text-xs text-gray-500">{formatDate(load.delivery_time)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-blue-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-400 truncate">
                        {load.commodity || 'Commodity not specified'} • {load.equipment_type || 'Equipment TBD'}
                      </p>
                    </div>
                  </div>

                  {/* Carrier Rate - Prominent Display */}
                  <div className="mt-3 rounded-lg bg-primary/10 border border-primary/20 p-3">
                    <p className="text-xs text-gray-400 mb-1">Your Rate</p>
                    <p className="text-2xl font-bold text-primary">
                      {formatCurrency(load.carrier_rate)}
                    </p>
                  </div>
                </div>

                <ConfirmRateButton loadId={load.id} carrierRate={load.carrier_rate} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input placeholder="Search loads..." className="pl-10" />
        </div>

        <select className="rounded-md border border-gray-600 bg-navy-lighter px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary">
          <option value="">All Equipment</option>
          <option value="dry_van">Dry Van</option>
          <option value="hopper">Hopper</option>
          <option value="end_dump">End Dump</option>
        </select>

        <select className="rounded-md border border-gray-600 bg-navy-lighter px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary">
          <option value="">All Commodities</option>
          <option value="corn">Corn</option>
          <option value="soybeans">Soybeans</option>
          <option value="wheat">Wheat</option>
        </select>

        <select className="rounded-md border border-gray-600 bg-navy-lighter px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary">
          <option value="">All States</option>
          <option value="IA">Iowa</option>
          <option value="IL">Illinois</option>
          <option value="NE">Nebraska</option>
        </select>
      </div>

      {/* Available Loads for Bidding */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-3">Available Loads</h2>
        {availableLoads && availableLoads.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {availableLoads.map((load) => (
              <div
                key={load.id}
                className="rounded-lg border border-gray-700 bg-navy-light p-4 hover:border-primary transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{load.load_number || `Load #${load.id}`}</h3>
                    <p className="text-xs text-gray-400">Posted {formatDate(load.created_at)}</p>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white">Pickup</p>
                      <p className="text-xs text-gray-400 truncate">{load.pickup_location || 'Not specified'}</p>
                      <p className="text-xs text-gray-500">{formatDate(load.pickup_time)}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white">Delivery</p>
                      <p className="text-xs text-gray-400 truncate">{load.delivery_location || 'Not specified'}</p>
                      <p className="text-xs text-gray-500">{formatDate(load.delivery_time)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-blue-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-400 truncate">
                        {load.commodity || 'Commodity not specified'} • {load.equipment_type || 'Equipment TBD'}
                      </p>
                    </div>
                  </div>
                </div>

                <SubmitBidButton 
                  loadId={load.id}
                  loadDetails={{
                    id: load.id,
                    load_number: load.load_number,
                    pickup_location: load.pickup_location,
                    delivery_location: load.delivery_location,
                    commodity: load.commodity,
                  }}
                  existingBid={bidsMap.get(load.id)}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex h-64 items-center justify-center rounded-lg border border-gray-700 bg-navy-light">
            <div className="text-center">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No Available Loads</h3>
              <p className="text-sm text-gray-400">Check back later for new load postings</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

