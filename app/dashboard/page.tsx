import { createClient } from '@/lib/supabase/server'
import { RefreshButton } from '@/components/dashboard/refresh-button'
import { DashboardWrapper } from '@/components/dashboard/dashboard-wrapper'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createClient()

  // Fetch total loads (exclude closed)
  const { count: totalLoadsCount } = await supabase
    .from('loads')
    .select('*', { count: 'exact', head: true })
    .is('deleted_at', null)
    .neq('status', 'closed')

  // Fetch pending pickup loads
  const { data: pendingPickup, count: pendingCount } = await supabase
    .from('loads')
    .select('*', { count: 'exact' })
    .eq('status', 'pending_pickup')
    .is('deleted_at', null)

  // Fetch in transit loads
  const { data: inTransit, count: transitCount } = await supabase
    .from('loads')
    .select('*', { count: 'exact' })
    .eq('status', 'in_transit')
    .is('deleted_at', null)

  // Fetch delivered loads
  const { count: deliveredCount } = await supabase
    .from('loads')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'delivered')
    .is('deleted_at', null)

  // Fetch ready to invoice (delivered loads without invoices)
  const { data: deliveredLoads } = await supabase
    .from('loads')
    .select('id')
    .eq('status', 'delivered')
    .is('deleted_at', null)

  const { data: invoices } = await supabase
    .from('invoices')
    .select('load_id')

  const invoicedLoadIds = new Set(invoices?.map(inv => inv.load_id) || [])
  const readyToInvoiceCount = deliveredLoads?.filter(load => !invoicedLoadIds.has(load.id)).length || 0

  // Fetch recent active loads (last 5)
  const { data: recentLoads } = await supabase
    .from('loads')
    .select(`
      *,
      customer:companies!loads_customer_id_fkey(name),
      carrier:companies!loads_carrier_id_fkey(name)
    `)
    .in('status', ['pending_pickup', 'in_transit'])
    .order('created_at', { ascending: false })
    .limit(5)

  // Fetch active loads with coordinates for map
  const { data: activeLoadsWithCoords } = await supabase
    .from('loads')
    .select(`
      id,
      load_number,
      status,
      pickup_location,
      delivery_location,
      pickup_coords,
      delivery_coords
    `)
    .in('status', ['pending_pickup', 'in_transit'])
    .is('deleted_at', null)
    .limit(50)

  // Fetch status breakdown
  const { data: statusBreakdown } = await supabase
    .from('loads')
    .select('status')
    .is('deleted_at', null)
    .neq('status', 'closed')

  // Count by status
  const statusCounts = statusBreakdown?.reduce((acc: any, load: any) => {
    acc[load.status] = (acc[load.status] || 0) + 1
    return acc
  }, {}) || {}

  // Fetch analytics data (last 30 days)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data: analyticsData } = await supabase
    .from('loads')
    .select('delivery_time, weight, weight_unit, customer_rate')
    .eq('status', 'delivered')
    .gte('delivery_time', thirtyDaysAgo.toISOString())
    .is('deleted_at', null)

  // Calculate tons delivered per day
  const tonsDeliveredByDay: { [key: string]: number } = {}
  const ratesByDay: { [key: string]: { total: number; count: number } } = {}

  analyticsData?.forEach((load: any) => {
    // Skip if missing required data
    if (!load.delivery_time || !load.weight || load.weight <= 0) {
      return
    }

    const date = new Date(load.delivery_time).toISOString().split('T')[0]
    let tons = load.weight
    
    // Convert to tons if needed
    if (load.weight_unit === 'lbs') {
      tons = tons / 2000
    }
    
    tonsDeliveredByDay[date] = (tonsDeliveredByDay[date] || 0) + tons
    
    if (load.customer_rate && load.customer_rate > 0 && tons > 0) {
      const ratePerTon = load.customer_rate / tons
      if (!ratesByDay[date]) {
        ratesByDay[date] = { total: 0, count: 0 }
      }
      ratesByDay[date].total += ratePerTon
      ratesByDay[date].count += 1
    }
  })

  // Format for charts
  const chartData = Object.keys(tonsDeliveredByDay).sort().map(date => ({
    date,
    tons: Math.round(tonsDeliveredByDay[date]),
    avgRate: ratesByDay[date] ? Math.round(ratesByDay[date].total / ratesByDay[date].count) : 0
  }))

  return (
    <DashboardWrapper
      totalLoadsCount={totalLoadsCount || 0}
      pendingCount={pendingCount || 0}
      transitCount={transitCount || 0}
      deliveredCount={deliveredCount || 0}
      readyToInvoiceCount={readyToInvoiceCount}
      recentLoads={recentLoads || []}
      activeLoadsWithCoords={activeLoadsWithCoords || []}
      statusCounts={statusCounts}
      chartData={chartData}
    />
  )
}

