import { createClient } from '@/lib/supabase/server'
import { LoadsTable } from '@/components/loads/loads-table'
import { LoadsPageClient } from '@/components/loads/loads-page-client'

export const dynamic = 'force-dynamic'

export default async function LoadsPage() {
  const supabase = await createClient()

  const { data: loads } = await supabase
    .from('loads')
    .select(`
      *,
      customer:companies!loads_customer_id_fkey(name),
      carrier:companies!loads_carrier_id_fkey(name)
    `)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  // Fetch bids for all loads
  const { data: allBids } = await supabase
    .from('bids')
    .select(`
      id,
      load_id,
      bid_amount,
      submitted_at,
      status,
      carrier:companies!bids_carrier_id_fkey(id, name)
    `)
    .order('bid_amount', { ascending: true })

  // Create a map of load_id to bids
  const bidsMap = new Map<number, any[]>()
  allBids?.forEach(bid => {
    if (!bidsMap.has(bid.load_id)) {
      bidsMap.set(bid.load_id, [])
    }
    bidsMap.get(bid.load_id)?.push(bid)
  })

  // Attach bids to loads (preserve carrier and customer objects)
  const loadsWithBids = loads?.map(load => ({
    ...load,
    carrier: load.carrier || null,
    customer: load.customer || null,
    bids: bidsMap.get(load.id) || []
  }))

  // Fetch customers and carriers for the modal
  const { data: customers } = await supabase
    .from('companies')
    .select('id, name')
    .eq('type', 'shipper')
    .order('name')

  const { data: carriers } = await supabase
    .from('companies')
    .select('id, name')
    .eq('type', 'carrier')
    .order('name')

  // Fetch drivers (internal fleet)
  const { data: drivers } = await supabase
    .from('users')
    .select('id, name')
    .eq('role', 'driver')
    .order('name')

  return (
    <LoadsPageClient
      loads={loadsWithBids || []}
      customers={customers || []}
      carriers={carriers || []}
      drivers={drivers || []}
    />
  )
}

