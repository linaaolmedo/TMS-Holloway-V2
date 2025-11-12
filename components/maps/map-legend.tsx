'use client'

import { Card, CardContent } from '@/components/ui/card'

interface LegendItem {
  color: string
  label: string
  icon?: 'circle' | 'square' | 'arrow' | 'line'
}

interface MapLegendProps {
  items: LegendItem[]
  className?: string
}

export function MapLegend({ items, className = '' }: MapLegendProps) {
  const renderIcon = (item: LegendItem) => {
    const baseClasses = 'flex-shrink-0'
    
    switch (item.icon || 'circle') {
      case 'circle':
        return (
          <div
            className={`w-3 h-3 rounded-full ${baseClasses}`}
            style={{ backgroundColor: item.color }}
          />
        )
      case 'square':
        return (
          <div
            className={`w-3 h-3 ${baseClasses}`}
            style={{ backgroundColor: item.color }}
          />
        )
      case 'arrow':
        return (
          <div className={`w-4 h-4 ${baseClasses}`}>
            <svg viewBox="0 0 24 24" fill={item.color}>
              <path d="M12 2L2 12l10 10 10-10L12 2z" />
            </svg>
          </div>
        )
      case 'line':
        return (
          <div className={`w-6 h-0.5 ${baseClasses}`} style={{ backgroundColor: item.color }} />
        )
    }
  }

  return (
    <Card className={className}>
      <CardContent className="pt-4">
        <div className="space-y-2">
          {items.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              {renderIcon(item)}
              <span className="text-sm text-gray-400">{item.label}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}



