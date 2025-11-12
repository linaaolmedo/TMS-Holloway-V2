'use client'

import { Button } from '@/components/ui/button'
import { RotateCcw } from 'lucide-react'

interface ResetViewButtonProps {
  onClick: () => void
  className?: string
  size?: 'default' | 'sm' | 'lg'
}

export function ResetViewButton({ onClick, className = '', size = 'sm' }: ResetViewButtonProps) {
  return (
    <Button
      onClick={onClick}
      size={size}
      variant="outline"
      className={`bg-white hover:bg-gray-100 text-gray-900 border-gray-300 ${className}`}
      title="Reset map view"
    >
      <RotateCcw className="h-4 w-4 mr-2" />
      Reset View
    </Button>
  )
}

