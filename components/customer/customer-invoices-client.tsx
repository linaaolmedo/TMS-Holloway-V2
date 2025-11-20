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
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Invoices</h1>
        <p className="text-sm text-gray-400">View and download your invoices.</p>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto rounded-lg border border-gray-700">
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

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {invoices && invoices.length > 0 ? (
          invoices.map((invoice) => (
            <div
              key={invoice.id}
              className="rounded-lg border border-gray-700 bg-navy-lighter p-4 space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs text-gray-400 mb-1">Invoice No</div>
                  <div className="text-sm font-semibold text-white">
                    INV-{new Date(invoice.issued_at).getFullYear()}{String(invoice.id).padStart(3, '0')}-001
                  </div>
                </div>
                <Badge variant={invoice.status} />
              </div>

              <div>
                <div className="text-xs text-gray-400 mb-1">Load ID</div>
                <div className="text-sm text-white">{invoice.load?.load_number || '-'}</div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs text-gray-400 mb-1">Issue Date</div>
                  <div className="text-sm text-white">{formatDate(invoice.issued_at)}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400 mb-1">Amount</div>
                  <div className="text-sm font-bold text-green-400">{formatCurrency(invoice.amount)}</div>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-700">
                <button 
                  onClick={() => handleDownload(invoice.id)}
                  disabled={downloadingId === invoice.id}
                  className="w-full text-primary hover:text-primary-hover flex items-center justify-center gap-2 py-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {downloadingId === invoice.id ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Downloading...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      Download Invoice
                    </>
                  )}
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-lg border border-gray-700 px-4 py-12 text-center text-gray-400">
            No invoices found
          </div>
        )}
      </div>

      {invoices && invoices.length > 0 && (
        <div className="flex items-center justify-between text-sm text-gray-400">
          <div>Showing {invoices.length} invoice(s)</div>
        </div>
      )}
    </div>
  )
}

