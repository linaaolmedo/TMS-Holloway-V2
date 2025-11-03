'use client'

import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Download, Loader2 } from 'lucide-react'
import { useState } from 'react'

interface CustomerInvoicesClientProps {
  invoices: any[]
}

export function CustomerInvoicesClient({ invoices }: CustomerInvoicesClientProps) {
  const [downloadingId, setDownloadingId] = useState<number | null>(null)

  const handleDownload = async (invoiceId: number) => {
    try {
      setDownloadingId(invoiceId)
      const response = await fetch(`/api/invoices/${invoiceId}/pdf`)
      
      if (!response.ok) {
        throw new Error('Failed to download invoice')
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `invoice-${invoiceId}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error downloading invoice:', error)
      alert('Failed to download invoice. Please try again.')
    } finally {
      setDownloadingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Invoices</h1>
        <p className="text-sm text-gray-400">View and download your invoices.</p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-700">
        <table className="w-full">
          <thead className="border-b border-gray-700 bg-navy-lighter">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Invoice No</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Load ID</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Issue Date</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Amount</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Status</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody>
            {invoices && invoices.length > 0 ? (
              invoices.map((invoice) => (
                <tr key={invoice.id} className="border-b border-gray-700 hover:bg-navy-lighter transition-colors">
                  <td className="px-4 py-3 text-sm text-white">
                    INV-{new Date(invoice.issued_at).getFullYear()}{String(invoice.id).padStart(3, '0')}-001
                  </td>
                  <td className="px-4 py-3 text-sm text-white">{invoice.load?.load_number || '-'}</td>
                  <td className="px-4 py-3 text-sm text-white">{formatDate(invoice.issued_at)}</td>
                  <td className="px-4 py-3 text-sm text-white">{formatCurrency(invoice.amount)}</td>
                  <td className="px-4 py-3">
                    <Badge variant={invoice.status} />
                  </td>
                  <td className="px-4 py-3">
                    <button 
                      onClick={() => handleDownload(invoice.id)}
                      disabled={downloadingId === invoice.id}
                      className="text-primary hover:text-primary-hover flex items-center gap-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {downloadingId === invoice.id ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Downloading...
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4" />
                          Download
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                  No invoices found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {invoices && invoices.length > 0 && (
        <div className="flex items-center justify-between text-sm text-gray-400">
          <div>Showing {invoices.length} invoice(s)</div>
        </div>
      )}
    </div>
  )
}

