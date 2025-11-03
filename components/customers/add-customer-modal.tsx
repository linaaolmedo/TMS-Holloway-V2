'use client'

import { useState, useTransition } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { addCustomer } from '@/app/actions/customers'
import { Mail, FileText } from 'lucide-react'

interface AddCustomerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const PAYMENT_TERMS = ['Net 15', 'Net 30', 'Net 45', 'Net 60', 'Due on Receipt', 'COD']

export function AddCustomerModal({ open, onOpenChange }: AddCustomerModalProps) {
  const [isPending, startTransition] = useTransition()
  const [formData, setFormData] = useState({
    name: '',
    contact_person: '',
    phone: '',
    email: '',
    billing_address: '',
    preferred_invoice_method: 'email',
    payment_terms: 'Net 30',
    credit_limit: '',
    shipping_locations: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    startTransition(async () => {
      const result = await addCustomer(formData)
      if (result.success) {
        onOpenChange(false)
        // Reset form
        setFormData({
          name: '',
          contact_person: '',
          phone: '',
          email: '',
          billing_address: '',
          preferred_invoice_method: 'email',
          payment_terms: 'Net 30',
          credit_limit: '',
          shipping_locations: '',
        })
      } else {
        alert(result.error || 'Failed to create customer')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)}>
        <DialogHeader onClose={() => onOpenChange(false)}>
          <DialogTitle>Add New Customer</DialogTitle>
          <DialogDescription>
            Fill in the details below to create a new customer record.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="max-h-[70vh] space-y-4 overflow-y-auto pr-2">
          {/* Customer Name */}
          <div>
            <label className="mb-2 block text-sm font-medium text-white">
              Customer Name
            </label>
            <Input
              required
              placeholder="e.g., Farm Fresh Co."
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          {/* Contact Person and Phone */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-white">Contact Person</label>
              <Input
                placeholder="e.g., Alice Johnson"
                value={formData.contact_person}
                onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-white">Phone Number</label>
              <Input
                type="tel"
                placeholder="e.g., 555-111-2222"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="mb-2 block text-sm font-medium text-white">Email</label>
            <Input
              type="email"
              placeholder="e.g., alice@farmfresh.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          {/* Billing Information Section */}
          <div className="pt-2">
            <h3 className="mb-3 text-sm font-semibold text-white">Billing Information</h3>
            
            {/* Billing Address */}
            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-white">Billing Address</label>
              <textarea
                placeholder="123 Billing St, Townsville, CA 90210"
                value={formData.billing_address}
                onChange={(e) => setFormData({ ...formData, billing_address: e.target.value })}
                rows={3}
                className="w-full rounded-md border border-gray-600 bg-navy-lighter px-3 py-2 text-white placeholder:text-gray-500 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Preferred Invoice Method */}
            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-white">
                Preferred Invoice Method
              </label>
              <div className="flex gap-4">
                <label className="flex cursor-pointer items-center gap-2 text-white">
                  <input
                    type="radio"
                    name="invoice_method"
                    value="email"
                    checked={formData.preferred_invoice_method === 'email'}
                    onChange={(e) => setFormData({ ...formData, preferred_invoice_method: e.target.value })}
                    className="h-4 w-4 border-gray-500 bg-navy text-primary focus:ring-2 focus:ring-primary"
                  />
                  <Mail className="h-4 w-4" />
                  <span className="text-sm">Email</span>
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-white">
                  <input
                    type="radio"
                    name="invoice_method"
                    value="mail"
                    checked={formData.preferred_invoice_method === 'mail'}
                    onChange={(e) => setFormData({ ...formData, preferred_invoice_method: e.target.value })}
                    className="h-4 w-4 border-gray-500 bg-navy text-primary focus:ring-2 focus:ring-primary"
                  />
                  <FileText className="h-4 w-4" />
                  <span className="text-sm">Mail</span>
                </label>
              </div>
            </div>

            {/* Payment Terms and Credit Limit */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-white">Payment Terms</label>
                <select
                  required
                  value={formData.payment_terms}
                  onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
                  className="w-full rounded-md border border-gray-600 bg-navy-lighter px-3 py-2 text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {PAYMENT_TERMS.map((term) => (
                    <option key={term} value={term}>
                      {term}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-white">Credit Limit ($)</label>
                <Input
                  type="number"
                  min="0"
                  placeholder="10000"
                  value={formData.credit_limit}
                  onChange={(e) => setFormData({ ...formData, credit_limit: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Location Information Section */}
          <div className="pt-2">
            <h3 className="mb-3 text-sm font-semibold text-white">Location Information</h3>
            
            {/* Shipping Locations */}
            <div>
              <label className="mb-2 block text-sm font-medium text-white">Shipping Locations</label>
              <textarea
                placeholder="One per line. Format: Location Name, Address..."
                value={formData.shipping_locations}
                onChange={(e) => setFormData({ ...formData, shipping_locations: e.target.value })}
                rows={4}
                className="w-full rounded-md border border-gray-600 bg-navy-lighter px-3 py-2 text-white placeholder:text-gray-500 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <p className="mt-1 text-xs text-gray-400">
                Enter each location on a new line
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isPending}
            className="w-full bg-red-600 hover:bg-red-700"
          >
            {isPending ? 'Adding Customer...' : 'Add Customer'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

