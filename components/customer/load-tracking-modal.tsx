'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency, formatDate } from '@/lib/utils'
import { 
  MapPin, 
  Package, 
  Truck, 
  Calendar, 
  DollarSign, 
  FileText, 
  Download,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2
} from 'lucide-react'
import { useState } from 'react'

interface LoadTrackingModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  load: any
  statusHistory?: any[]
  documents?: any[]
  invoice?: any
}

export function LoadTrackingModal({ 
  open, 
  onOpenChange, 
  load,
  statusHistory = [],
  documents = [],
  invoice
}: LoadTrackingModalProps) {
  const [downloadingInvoice, setDownloadingInvoice] = useState(false)
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case 'in_transit':
        return <Truck className="h-5 w-5 text-blue-500" />
      case 'delayed':
        return <AlertCircle className="h-5 w-5 text-orange-500" />
      case 'cancelled':
        return <AlertCircle className="h-5 w-5 text-red-500" />
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending_pickup':
        return 'Pending Pickup'
      case 'in_transit':
        return 'In Transit'
      case 'delivered':
        return 'Delivered'
      case 'delayed':
        return 'Delayed'
      case 'cancelled':
        return 'Cancelled'
      case 'closed':
        return 'Closed'
      default:
        return status
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>Shipment Tracking</DialogTitle>
              <p className="text-sm text-gray-400 mt-1">{load.load_number}</p>
            </div>
            <Badge variant={load.status} />
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Route Information */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Route Information
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-400">Pickup Location</p>
                    <p className="text-white font-medium">{load.pickup_location}</p>
                    <p className="text-sm text-gray-400 mt-1">
                      {formatDate(load.pickup_time)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Delivery Location</p>
                    <p className="text-white font-medium">{load.delivery_location}</p>
                    <p className="text-sm text-gray-400 mt-1">
                      {formatDate(load.delivery_time)}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Load Details */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                Load Details
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-400">Commodity</p>
                  <p className="text-white">{load.commodity || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Weight</p>
                  <p className="text-white">
                    {load.weight && load.weight_unit 
                      ? `${load.weight} ${load.weight_unit}` 
                      : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Equipment Type</p>
                  <p className="text-white">{load.equipment_type || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Pricing Type</p>
                  <p className="text-white capitalize">{load.pricing_type || 'N/A'}</p>
                </div>
              </div>
              {load.comments && (
                <div className="mt-4">
                  <p className="text-sm text-gray-400">Special Instructions</p>
                  <p className="text-white whitespace-pre-wrap">{load.comments}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Invoice Information */}
          {load.customer_rate && (
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  Billing Information
                </h3>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Total Amount</p>
                    <p className="text-2xl font-bold text-white">
                      {formatCurrency(invoice?.amount || load.customer_rate)}
                    </p>
                  </div>
                  {invoice && (
                    <div className="text-right">
                      <p className="text-sm text-gray-400">Invoice Status</p>
                      <Badge variant={invoice.status} className="mt-1" />
                      <button
                        onClick={async () => {
                          try {
                            setDownloadingInvoice(true)
                            const response = await fetch(`/api/invoices/${invoice.id}/pdf`)
                            if (!response.ok) throw new Error('Failed to download')
                            const blob = await response.blob()
                            const url = window.URL.createObjectURL(blob)
                            const a = document.createElement('a')
                            a.href = url
                            a.download = `invoice-${invoice.id}.pdf`
                            document.body.appendChild(a)
                            a.click()
                            window.URL.revokeObjectURL(url)
                            document.body.removeChild(a)
                          } catch (error) {
                            console.error('Error downloading invoice:', error)
                            alert('Failed to download invoice')
                          } finally {
                            setDownloadingInvoice(false)
                          }
                        }}
                        disabled={downloadingInvoice}
                        className="text-primary hover:text-primary-hover flex items-center gap-1 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {downloadingInvoice ? (
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
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Status Timeline */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Status Timeline
              </h3>
              <div className="space-y-4">
                {statusHistory.length > 0 ? (
                  statusHistory.map((history, index) => (
                    <div key={history.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-navy-lighter">
                          {getStatusIcon(history.status)}
                        </div>
                        {index < statusHistory.length - 1 && (
                          <div className="h-full w-0.5 bg-gray-700 my-1" style={{ minHeight: '20px' }} />
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <p className="text-white font-medium">{getStatusLabel(history.status)}</p>
                        <p className="text-sm text-gray-400">
                          {formatDate(history.changed_at)}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400 text-center py-4">No status history available</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Documents */}
          {documents.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Documents
                </h3>
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between rounded-md border border-gray-700 bg-navy-lighter p-3"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-sm text-white font-medium">{doc.doc_type}</p>
                          <p className="text-xs text-gray-400">{formatDate(doc.uploaded_at)}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => window.open(`/api/documents/${doc.id}/download`, '_blank')}
                        className="text-primary hover:text-primary-hover flex items-center gap-1"
                      >
                        <Download className="h-4 w-4" />
                        Download
                      </button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

