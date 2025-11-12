'use client'

import { Clock, MapPin } from 'lucide-react'
import { useEffect, useState } from 'react'
import { formatDistanceToNow } from 'date-fns'

interface ETADisplayProps {
  eta: string | Date
  destination: string
  className?: string
}

export function ETADisplay({ eta, destination, className = '' }: ETADisplayProps) {
  const [timeRemaining, setTimeRemaining] = useState('')

  useEffect(() => {
    const updateTimeRemaining = () => {
      const etaDate = typeof eta === 'string' ? new Date(eta) : eta
      const now = new Date()
      const diff = etaDate.getTime() - now.getTime()

      if (diff <= 0) {
        setTimeRemaining('Arrived')
        return
      }

      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

      if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m`)
      } else {
        setTimeRemaining(`${minutes}m`)
      }
    }

    updateTimeRemaining()
    const interval = setInterval(updateTimeRemaining, 30000) // Update every 30s

    return () => clearInterval(interval)
  }, [eta])

  return (
    <div className={`bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 ${className}`}>
      <div className="flex items-center gap-2 mb-2">
        <Clock className="h-4 w-4 text-blue-500" />
        <span className="text-sm font-medium text-blue-400">Estimated Arrival</span>
      </div>
      <div className="flex items-start gap-2">
        <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xl font-bold text-white">{timeRemaining}</p>
          <p className="text-xs text-gray-400 truncate">{destination}</p>
        </div>
      </div>
    </div>
  )
}



