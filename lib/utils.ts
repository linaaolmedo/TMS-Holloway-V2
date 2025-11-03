import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return '$0.00'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

export function formatDate(date: string | null | undefined): string {
  if (!date) return 'N/A'
  return format(new Date(date), 'MM/dd/yyyy')
}

export function formatDateTime(date: string | null | undefined): string {
  if (!date) return 'N/A'
  return format(new Date(date), 'MM/dd/yyyy hh:mm a')
}

export function getMarginColor(margin: number | null | undefined): string {
  if (margin === null || margin === undefined) return 'text-gray-400'
  if (margin < 5) return 'text-red-500'
  if (margin < 15) return 'text-yellow-500'
  return 'text-green-500'
}

export function getStatusColor(status: string): string {
  const normalizedStatus = status.toLowerCase()
  const statusColors: Record<string, string> = {
    // Load statuses
    pending_pickup: 'bg-yellow-500',
    in_transit: 'bg-blue-500',
    delivered: 'bg-green-500',
    delayed: 'bg-orange-500',
    cancelled: 'bg-red-500',
    closed: 'bg-gray-600',
    // Bid statuses
    pending: 'bg-yellow-500',
    accepted: 'bg-green-500',
    rejected: 'bg-red-500',
    // Invoice statuses
    issued: 'bg-yellow-500',
    paid: 'bg-green-500',
    overdue: 'bg-red-500',
  }
  return statusColors[normalizedStatus] || 'bg-gray-500'
}

export function getStatusLabel(status: string): string {
  const normalizedStatus = status.toLowerCase()
  const statusLabels: Record<string, string> = {
    pending_pickup: 'Pending Pickup',
    in_transit: 'In Transit',
    delivered: 'Delivered',
    delayed: 'Delayed',
    cancelled: 'Cancelled',
    closed: 'Closed',
  }
  return statusLabels[normalizedStatus] || status.charAt(0).toUpperCase() + status.slice(1)
}

