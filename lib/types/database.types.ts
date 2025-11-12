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

export type RouteStopType = 'pickup' | 'delivery' | 'waypoint'

export type RouteStopStatus = 'pending' | 'en_route' | 'arrived' | 'completed' | 'skipped'

export type RouteTrackingStatus = 'en_route_pickup' | 'at_pickup' | 'en_route_delivery' | 'at_delivery' | 'completed'

export type GeocodingAccuracy = 'ROOFTOP' | 'RANGE_INTERPOLATED' | 'GEOMETRIC_CENTER' | 'APPROXIMATE'

export interface DriverLocation {
  id: number
  driver_id: string
  latitude: number
  longitude: number
  heading: number | null
  speed: number | null
  accuracy: number | null
  timestamp: string
  created_at: string
}

export interface LoadLocation {
  id: number
  load_id: number
  pickup_lat: number | null
  pickup_lng: number | null
  delivery_lat: number | null
  delivery_lng: number | null
  geocoded_at: string
  geocoding_accuracy: GeocodingAccuracy | null
  created_at: string
  updated_at: string
}

export interface RouteTracking {
  id: number
  load_id: number
  driver_id: string
  current_lat: number | null
  current_lng: number | null
  eta_pickup: string | null
  eta_delivery: string | null
  distance_remaining: number | null
  route_progress: number | null
  status: RouteTrackingStatus | null
  updated_at: string
  created_at: string
}

export interface RouteStop {
  id: number
  driver_id: string
  load_id: number | null
  stop_sequence: number
  location: string
  latitude: number | null
  longitude: number | null
  stop_type: RouteStopType
  scheduled_time: string | null
  completed_at: string | null
  status: RouteStopStatus
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Coordinates {
  lat: number
  lng: number
}

