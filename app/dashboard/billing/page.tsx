import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import { FileText, AlertCircle, CheckCircle } from 'lucide-react'
import { BillingTabs } from '@/components/billing/billing-tabs'

export const dynamic = 'force-dynamic'

export default async function BillingPage() {
  const supabase = await createClient()

  const { data: invoices } = await supabase
    .from('invoices')
    .select(`
      *,
      load:loads(load_number),
      customer:companies(name)
    `)
    .order('issued_at', { ascending: false })

  // Calculate metrics
  const readyForInvoice = 0
  const outstanding = invoices?.filter(inv => inv.status === 'issued').reduce((sum, inv) => sum + inv.amount, 0) || 0
  const paid = invoices?.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.amount, 0) || 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Billing</h1>
      </div>

      {/* Metric Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Ready to Invoice</p>
                <p className="text-4xl font-bold text-white">{formatCurrency(readyForInvoice)}</p>
                <p className="text-xs text-gray-500 mt-1">0 items</p>
              </div>
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/10">
                <FileText className="h-8 w-8 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Outstanding Invoices</p>
                <p className="text-4xl font-bold text-white">{formatCurrency(outstanding)}</p>
                <p className="text-xs text-gray-500 mt-1">{invoices?.filter(inv => inv.status === 'issued').length || 0} items</p>
              </div>
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-yellow-500/10">
                <AlertCircle className="h-8 w-8 text-yellow-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Paid (Last 30 Days)</p>
                <p className="text-4xl font-bold text-white">{formatCurrency(paid)}</p>
                <p className="text-xs text-gray-500 mt-1">{invoices?.filter(inv => inv.status === 'paid').length || 0} items</p>
              </div>
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <BillingTabs invoices={invoices || []} />
    </div>
  )
}

