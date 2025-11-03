export type UserRole = 'executive' | 'admin' | 'billing' | 'csr' | 'dispatch' | 'customer' | 'carrier' | 'driver'

export type CompanyType = 'shipper' | 'carrier' | 'internal'

export type LoadStatus = 'pending_pickup' | 'in_transit' | 'delivered' | 'delayed' | 'cancelled' | 'closed'

export type PricingType = 'flat' | 'per_ton'

export type DocType = 'POD' | 'BOL' | 'Invoice' | 'RateConfirmation'

export type BidStatus = 'pending' | 'accepted' | 'rejected'

export type InvoiceStatus = 'issued' | 'paid' | 'overdue'

export interface Company {
  id: string
  name: string
  type: CompanyType
  created_at: string
  updated_at: string
}

export interface User {
  id: string
  email: string
  name: string | null
  phone: string | null
  role: UserRole
  company_id: string | null
  created_at: string
}

export interface Load {
  id: number
  load_number: string | null
  status: LoadStatus
  dispatcher_id: string | null
  customer_id: string | null
  carrier_id: string | null
  driver_id: string | null
  commodity: string | null
  equipment_type: string | null
  pricing_type: PricingType | null
  customer_rate: number | null
  carrier_rate: number | null
  margin_percent: number | null
  pickup_location: string | null
  delivery_location: string | null
  pickup_time: string | null
  delivery_time: string | null
  weight: number | null
  weight_unit: string | null
  rate_confirmed: boolean | null
  rate_confirmed_at: string | null
  rate_confirmed_by: string | null // UUID stored as string in TypeScript
  created_at: string
  updated_at: string
}

export interface Bid {
  id: number
  load_id: number | null
  carrier_id: string | null
  bid_amount: number
  submitted_at: string
  status: BidStatus
}

export interface StatusHistory {
  id: number
  load_id: number | null
  status: string
  changed_at: string
  updated_by: string | null
}

export interface Document {
  id: number
  load_id: number | null
  doc_type: DocType
  storage_path: string
  uploaded_by: string | null
  uploaded_at: string
}

export interface Invoice {
  id: number
  load_id: number | null
  customer_id: string | null
  amount: number
  issued_at: string
  paid_at: string | null
  status: InvoiceStatus
}

