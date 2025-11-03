import { createClient } from '@/lib/supabase/server'
import { CustomerInvoicesClient } from '@/components/customer/customer-invoices-client'

export const dynamic = 'force-dynamic'

export default async function CustomerInvoicesPage() {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: userData } = await supabase
    .from('users')
    .select('company_id')
    .eq('id', user!.id)
    .single()

  const { data: invoices } = await supabase
    .from('invoices')
    .select(`
      *,
      load:loads(load_number)
    `)
    .eq('customer_id', userData?.company_id)
    .order('issued_at', { ascending: false })

  return <CustomerInvoicesClient invoices={invoices || []} />
}

