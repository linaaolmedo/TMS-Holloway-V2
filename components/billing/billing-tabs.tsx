'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Search, Download } from 'lucide-react'

interface Invoice {
  id: number
  load_id: number | null
  customer_id: string | null
  amount: number
  issued_at: string
  paid_at: string | null
  status: string
  load?: { load_number: string }
  customer?: { name: string }
}

export function BillingTabs({ invoices }: { invoices: Invoice[] }) {
  const [activeTab, setActiveTab] = useState('outstanding')
  const [searchTerm, setSearchTerm] = useState('')

  const handleDownload = (invoiceId: number) => {
    window.open(`/api/invoices/${invoiceId}/pdf`, '_blank')
  }

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = 
      invoice.load?.load_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    
    if (activeTab === 'ready') return invoice.status === 'draft' && matchesSearch
    if (activeTab === 'outstanding') return invoice.status === 'issued' && matchesSearch
    if (activeTab === 'paid') return invoice.status === 'paid' && matchesSearch
    
    return matchesSearch
  })

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-700">
        <button
          onClick={() => setActiveTab('ready')}
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === 'ready'
              ? 'border-b-2 border-primary text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Ready for Invoice (0)
        </button>
        <button
          onClick={() => setActiveTab('outstanding')}
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === 'outstanding'
              ? 'border-b-2 border-primary text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Outstanding ({invoices.filter(inv => inv.status === 'issued').length})
        </button>
        <button
          onClick={() => setActiveTab('paid')}
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === 'paid'
              ? 'border-b-2 border-primary text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Paid ({invoices.filter(inv => inv.status === 'paid').length})
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search by invoice number, customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <button className="rounded-md border border-gray-600 px-6 py-2 text-sm font-medium text-white hover:bg-navy-lighter">
          Filters
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-700">
        <table className="w-full">
          <thead className="border-b border-gray-700 bg-navy-lighter">
            <tr>
              <th className="px-2 py-3 text-left">
                <input type="checkbox" className="rounded border-gray-600" />
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">INVOICE NO</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">LOAD ID</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">CUSTOMER</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">ISSUE DATE</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">DUE DATE</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">AGING</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">AMOUNT</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">STATUS</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filteredInvoices.length > 0 ? (
              filteredInvoices.map((invoice) => {
                // Calculate due date (30 days from issue date)
                const issueDate = new Date(invoice.issued_at)
                const dueDate = new Date(issueDate)
                dueDate.setDate(dueDate.getDate() + 30)
                
                return (
                  <tr key={invoice.id} className="border-b border-gray-700 hover:bg-navy-lighter transition-colors">
                    <td className="px-2 py-3">
                      <input type="checkbox" className="rounded border-gray-600" />
                    </td>
                    <td className="px-4 py-3 text-sm text-white">
                      INV-{new Date(invoice.issued_at).getFullYear()}{String(invoice.id).padStart(3, '0')}-001
                    </td>
                    <td className="px-4 py-3 text-sm text-white">{invoice.load?.load_number || '-'}</td>
                    <td className="px-4 py-3 text-sm text-white">{invoice.customer?.name || 'Test Customer Inc.'}</td>
                    <td className="px-4 py-3 text-sm text-white">{formatDate(invoice.issued_at)}</td>
                    <td className="px-4 py-3 text-sm text-white">{formatDate(dueDate.toISOString())}</td>
                    <td className="px-4 py-3 text-sm text-white">-</td>
                    <td className="px-4 py-3 text-sm text-white">{formatCurrency(invoice.amount)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={invoice.status} />
                    </td>
                    <td className="px-4 py-3">
                      <button 
                        onClick={() => handleDownload(invoice.id)}
                        className="text-primary hover:text-primary-hover flex items-center gap-1 transition-colors"
                        title="Download PDF"
                      >
                        <Download className="h-4 w-4" />
                        Download
                      </button>
                    </td>
                  </tr>
                )
              })
            ) : (
              <tr>
                <td colSpan={10} className="px-4 py-12 text-center text-gray-400">
                  No invoices found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm text-gray-400">
        <div>1 invoice</div>
        <div className="flex gap-2">
          <button className="rounded-md border border-gray-600 px-4 py-2 hover:bg-navy-lighter">
            Previous
          </button>
          <button className="rounded-md border border-gray-600 px-4 py-2 hover:bg-navy-lighter">
            Next
          </button>
        </div>
      </div>
    </div>
  )
}

