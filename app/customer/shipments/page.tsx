import { createClient } from '@/lib/supabase/server'
import { CustomerShipmentsClient } from '@/components/customer/customer-shipments-client'

export const dynamic = 'force-dynamic'

export default async function CustomerShipmentsPage() {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: userData } = await supabase
    .from('users')
    .select('company_id')
    .eq('id', user!.id)
    .single()

  // Fetch loads with related data
  const { data: loads } = await supabase
    .from('loads')
    .select(`
      *,
      invoice:invoices(id, amount, status, issued_at),
      status_history:status_history(id, status, changed_at, updated_by),
      documents:documents(id, doc_type, uploaded_at, storage_path)
    `)
    .eq('customer_id', userData?.company_id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  // Sort status history by date for each load
  const loadsWithSortedHistory = loads?.map(load => ({
    ...load,
    status_history: (load.status_history as any[] || []).sort((a: any, b: any) => 
      new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime()
    )
  }))

  return <CustomerShipmentsClient loads={loadsWithSortedHistory || []} />
}

