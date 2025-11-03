'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Search, Plus } from 'lucide-react'
import { RequestShipmentModal } from './request-shipment-modal'
import { LoadTrackingModal } from './load-tracking-modal'

interface CustomerShipmentsClientProps {
  loads: any[]
}

export function CustomerShipmentsClient({ loads }: CustomerShipmentsClientProps) {
  const [requestModalOpen, setRequestModalOpen] = useState(false)
  const [trackingModalOpen, setTrackingModalOpen] = useState(false)
  const [selectedLoad, setSelectedLoad] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const filteredLoads = loads.filter((load) => {
    const query = searchQuery.toLowerCase()
    return (
      load.load_number?.toLowerCase().includes(query) ||
      load.pickup_location?.toLowerCase().includes(query) ||
      load.delivery_location?.toLowerCase().includes(query) ||
      load.commodity?.toLowerCase().includes(query)
    )
  })

  const handleLoadClick = (load: any) => {
    setSelectedLoad(load)
    setTrackingModalOpen(true)
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">My Shipments</h1>
            <p className="text-sm text-gray-400">Track shipments, view invoices, and download paperwork.</p>
          </div>
          <Button onClick={() => setRequestModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Request Shipment
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input 
            placeholder="Search by load number, location, or commodity..." 
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto rounded-lg border border-gray-700">
          <table className="w-full">
            <thead className="border-b border-gray-700 bg-navy-lighter">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Load ID</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Origin</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Destination</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Delivery Date</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Shipment Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Invoice Amount</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Billing Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredLoads && filteredLoads.length > 0 ? (
                filteredLoads.map((load) => (
                  <tr 
                    key={load.id} 
                    className="border-b border-gray-700 hover:bg-navy-lighter transition-colors cursor-pointer"
                    onClick={() => handleLoadClick(load)}
                  >
                    <td className="px-4 py-3 text-sm text-white font-medium">
                      {load.load_number || `#${load.id}`}
                    </td>
                    <td className="px-4 py-3 text-sm text-white">{load.pickup_location || '-'}</td>
                    <td className="px-4 py-3 text-sm text-white">{load.delivery_location || '-'}</td>
                    <td className="px-4 py-3 text-sm text-white">{formatDate(load.delivery_time)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={load.status} />
                    </td>
                    <td className="px-4 py-3 text-sm text-white">
                      {formatCurrency((load.invoice as any)?.[0]?.amount || load.customer_rate || 0)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={(load.invoice as any)?.[0]?.status || 'pending'} />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                    {searchQuery ? 'No shipments match your search' : 'No shipments found'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between text-sm text-gray-400">
          <div>Showing {filteredLoads?.length || 0} shipment(s)</div>
        </div>
      </div>

      <RequestShipmentModal 
        open={requestModalOpen} 
        onOpenChange={setRequestModalOpen}
      />

      {selectedLoad && (
        <LoadTrackingModal
          open={trackingModalOpen}
          onOpenChange={setTrackingModalOpen}
          load={selectedLoad}
          statusHistory={selectedLoad.status_history || []}
          documents={selectedLoad.documents || []}
          invoice={(selectedLoad.invoice as any)?.[0]}
        />
      )}
    </>
  )
}

