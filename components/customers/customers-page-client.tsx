'use client'

import { useState } from 'react'
import { AddCustomerModal } from './add-customer-modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PlusCircle, Search } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface CustomersPageClientProps {
  customers: any[]
}

export function CustomersPageClient({ customers }: CustomersPageClientProps) {
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Customers</h1>
          <p className="text-sm text-gray-400">Manage and track all your customers.</p>
        </div>
        <Button className="gap-2" onClick={() => setIsAddCustomerOpen(true)}>
          <PlusCircle className="h-5 w-5" />
          Add Customer
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input placeholder="Filter by name..." className="pl-10" />
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-700">
        <table className="w-full">
          <thead className="border-b border-gray-700 bg-navy-lighter">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Customer ID</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Customer Name</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Contact</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Phone</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Terms</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Credit Limit</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-400"></th>
            </tr>
          </thead>
          <tbody>
            {customers && customers.length > 0 ? (
              customers.map((customer: any) => (
                <tr key={customer.id} className="border-b border-gray-700 hover:bg-navy-lighter transition-colors">
                  <td className="px-4 py-3 text-sm text-white">{customer.id.slice(0, 8)}</td>
                  <td className="px-4 py-3 text-sm text-white">{customer.name}</td>
                  <td className="px-4 py-3 text-sm text-white">{customer.contact_person || '-'}</td>
                  <td className="px-4 py-3 text-sm text-white">{customer.phone || '-'}</td>
                  <td className="px-4 py-3 text-sm text-white">{customer.payment_terms || '-'}</td>
                  <td className="px-4 py-3 text-sm text-white">{formatCurrency(customer.credit_limit)}</td>
                  <td className="px-4 py-3 text-right">
                    <button className="text-gray-400 hover:text-white">⋮</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                  No customers found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm text-gray-400">
        <div>0 of {customers?.length || 0} row(s) selected.</div>
        <div className="flex gap-2">
          <button className="rounded-md border border-gray-600 px-4 py-2 hover:bg-navy-lighter">
            Previous
          </button>
          <button className="rounded-md border border-gray-600 px-4 py-2 hover:bg-navy-lighter">
            Next
          </button>
        </div>
      </div>

      <AddCustomerModal open={isAddCustomerOpen} onOpenChange={setIsAddCustomerOpen} />
    </div>
  )
}

