'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PlusCircle, Search, AlertTriangle } from 'lucide-react'
import { AddTruckModal } from './add-truck-modal'

const mockTrucks = [
  {
    id: 1,
    unitNumber: '1',
    make: 'Freightliner',
    model: 'Service (2007)',
    vin: '1FVACXDCS7HY42485',
    status: 'In Use',
    driver: 'Mike Johnson',
    nextMaintenance: '07/15/2024',
    overdue: true,
  },
  {
    id: 2,
    unitNumber: '2',
    make: 'International',
    model: '4400 Regular Cab (2010)',
    vin: '1HSMTAZN4AH249523',
    status: 'In Use',
    driver: 'Maria Garcia',
    nextMaintenance: '08/20/2024',
    overdue: false,
  },
  {
    id: 24,
    unitNumber: '24',
    make: 'Freightliner',
    model: 'Coronado (2017)',
    vin: '3AKJGNDVXHDHV5936',
    status: 'Available',
    driver: 'None',
    nextMaintenance: '09/10/2024',
    overdue: false,
  },
]

export function FleetTabs() {
  const [activeTab, setActiveTab] = useState('trucks')
  const [isAddTruckOpen, setIsAddTruckOpen] = useState(false)

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-700">
        <button
          onClick={() => setActiveTab('trucks')}
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === 'trucks'
              ? 'border-b-2 border-primary text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Trucks
        </button>
        <button
          onClick={() => setActiveTab('trailers')}
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === 'trailers'
              ? 'border-b-2 border-primary text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Trailers
        </button>
        <button
          onClick={() => setActiveTab('drivers')}
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === 'drivers'
              ? 'border-b-2 border-primary text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Drivers
        </button>
        <button
          onClick={() => setActiveTab('dispatch')}
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === 'dispatch'
              ? 'border-b-2 border-primary text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Active Dispatch
        </button>
      </div>

      {/* Trucks Tab */}
      {activeTab === 'trucks' && (
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input placeholder="Filter by unit number..." className="pl-10" />
            </div>
            <Button className="gap-2" onClick={() => setIsAddTruckOpen(true)}>
              <PlusCircle className="h-5 w-5" />
              Add Truck
            </Button>
          </div>

          <div className="overflow-x-auto rounded-lg border border-gray-700">
            <table className="w-full">
              <thead className="border-b border-gray-700 bg-navy-lighter">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Unit #</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Make/Model</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">VIN</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Assigned Driver</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Next Maintenance</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-400"></th>
                </tr>
              </thead>
              <tbody>
                {mockTrucks.map((truck) => (
                  <tr key={truck.id} className="border-b border-gray-700 hover:bg-navy-lighter transition-colors">
                    <td className="px-4 py-3 text-sm text-white">{truck.unitNumber}</td>
                    <td className="px-4 py-3 text-sm">
                      <div className="text-white">{truck.make}</div>
                      <div className="text-xs text-gray-400">{truck.model}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-white">{truck.vin}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                          truck.status === 'In Use'
                            ? 'bg-blue-500 text-white'
                            : truck.status === 'Available'
                            ? 'bg-green-500 text-white'
                            : 'bg-red-500 text-white'
                        }`}
                      >
                        {truck.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-white">{truck.driver}</td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-white">{truck.nextMaintenance}</span>
                        {truck.overdue && (
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button className="text-gray-400 hover:text-white">⋮</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Other tabs placeholder */}
      {activeTab !== 'trucks' && (
        <div className="flex h-64 items-center justify-center rounded-lg border border-gray-700 bg-navy-light">
          <p className="text-gray-400">Content for {activeTab} coming soon</p>
        </div>
      )}

      <AddTruckModal open={isAddTruckOpen} onOpenChange={setIsAddTruckOpen} />
    </div>
  )
}

