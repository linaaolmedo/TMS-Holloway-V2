'use client'

import { useState } from 'react'
import { AddCarrierModal } from './add-carrier-modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PlusCircle, Search } from 'lucide-react'

interface CarriersPageClientProps {
  carriers: any[]
}

export function CarriersPageClient({ carriers }: CarriersPageClientProps) {
  const [isAddCarrierOpen, setIsAddCarrierOpen] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Carriers</h1>
          <p className="text-sm text-gray-400">Manage and track all your carriers.</p>
        </div>
        <Button className="gap-2 w-full sm:w-auto" onClick={() => setIsAddCarrierOpen(true)}>
          <PlusCircle className="h-5 w-5" />
          Add Carrier
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input placeholder="Filter by name..." className="pl-10" />
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto rounded-lg border border-gray-700">
        <table className="w-full">
          <thead className="border-b border-gray-700 bg-navy-lighter">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Carrier ID</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Carrier Name</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">MC #</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Contact Person</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Phone</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Email</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-400"></th>
            </tr>
          </thead>
          <tbody>
            {carriers && carriers.length > 0 ? (
              carriers.map((carrier: any) => (
                <tr key={carrier.id} className="border-b border-gray-700 hover:bg-navy-lighter transition-colors">
                  <td className="px-4 py-3 text-sm text-white">{carrier.id.slice(0, 8)}</td>
                  <td className="px-4 py-3 text-sm text-white">{carrier.name}</td>
                  <td className="px-4 py-3 text-sm text-white">{carrier.mc_number || '-'}</td>
                  <td className="px-4 py-3 text-sm text-white">{carrier.contact_person || '-'}</td>
                  <td className="px-4 py-3 text-sm text-white">{carrier.phone || '-'}</td>
                  <td className="px-4 py-3 text-sm text-white">{carrier.email || '-'}</td>
                  <td className="px-4 py-3 text-right">
                    <button className="text-gray-400 hover:text-white">⋮</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                  No carriers found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {carriers && carriers.length > 0 ? (
          carriers.map((carrier: any) => (
            <div
              key={carrier.id}
              className="rounded-lg border border-gray-700 bg-navy-lighter p-4 space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs text-gray-400 mb-1">Carrier ID</div>
                  <div className="text-xs text-white font-mono">{carrier.id.slice(0, 8)}</div>
                </div>
                <button className="text-gray-400 hover:text-white p-2">⋮</button>
              </div>

              <div>
                <div className="text-sm font-semibold text-white">{carrier.name}</div>
                {carrier.mc_number && (
                  <div className="text-xs text-gray-400 mt-1">MC # {carrier.mc_number}</div>
                )}
              </div>

              <div className="space-y-2">
                <div>
                  <div className="text-xs text-gray-400 mb-1">Contact Person</div>
                  <div className="text-sm text-white">{carrier.contact_person || '-'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400 mb-1">Phone</div>
                  <div className="text-sm text-white">{carrier.phone || '-'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400 mb-1">Email</div>
                  <div className="text-sm text-white break-all">{carrier.email || '-'}</div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-lg border border-gray-700 px-4 py-12 text-center text-gray-400">
            No carriers found
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-sm text-gray-400">
        <div>0 of {carriers?.length || 0} row(s) selected.</div>
        <div className="flex gap-2">
          <button className="rounded-md border border-gray-600 px-4 py-2 hover:bg-navy-lighter">
            Previous
          </button>
          <button className="rounded-md border border-gray-600 px-4 py-2 hover:bg-navy-lighter">
            Next
          </button>
        </div>
      </div>

      <AddCarrierModal open={isAddCarrierOpen} onOpenChange={setIsAddCarrierOpen} />
    </div>
  )
}

