import { createClient } from '@/lib/supabase/server'
import { CustomersPageClient } from '@/components/customers/customers-page-client'

export const dynamic = 'force-dynamic'

export default async function CustomersPage() {
  const supabase = await createClient()

  const { data: customers } = await supabase
    .from('companies')
    .select('*')
    .eq('type', 'shipper')
    .order('name')

  return <CustomersPageClient customers={customers || []} />
}

