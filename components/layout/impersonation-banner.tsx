'use client'

import { AlertTriangle, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface ImpersonationBannerProps {
  targetUserName: string
  targetUserRole: string
}

export function ImpersonationBanner({
  targetUserName,
  targetUserRole,
}: ImpersonationBannerProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleExitImpersonation = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/impersonation/end', {
        method: 'POST',
      })

      const result = await response.json()

      if (result.success) {
        // Redirect to admin users page
        window.location.href = '/admin/users'
      } else {
        alert('Failed to exit impersonation: ' + result.error)
        setLoading(false)
      }
    } catch (error) {
      console.error('Error exiting impersonation:', error)
      alert('Failed to exit impersonation')
      setLoading(false)
    }
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white shadow-lg">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 flex-shrink-0" />
          <div className="text-sm font-medium">
            <span className="font-bold">IMPERSONATION MODE:</span> You are viewing as{' '}
            <span className="font-bold">{targetUserName}</span> (
            <span className="capitalize">{targetUserRole}</span>)
          </div>
        </div>
        <button
          onClick={handleExitImpersonation}
          disabled={loading}
          className="flex items-center gap-2 bg-white text-red-600 px-4 py-1.5 rounded-lg hover:bg-gray-100 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <X className="h-4 w-4" />
          {loading ? 'Exiting...' : 'Exit Impersonation'}
        </button>
      </div>
    </div>
  )
}

