'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { LucideIcon } from 'lucide-react'

interface MetricCardProps {
  title: string
  value: number
  description: string
  icon: LucideIcon
  iconColor: string
  iconBgColor: string
  href?: string
}

export function MetricCard({
  title,
  value,
  description,
  icon: Icon,
  iconColor,
  iconBgColor,
  href,
}: MetricCardProps) {
  const content = (
    <CardContent className="pt-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-400">{title}</p>
          <p className="text-4xl font-bold text-white">{value}</p>
          <p className="text-xs text-gray-500 mt-1">{description}</p>
        </div>
        <div className={`flex h-16 w-16 items-center justify-center rounded-full ${iconBgColor}`}>
          <Icon className={`h-8 w-8 ${iconColor}`} />
        </div>
      </div>
    </CardContent>
  )

  if (href) {
    return (
      <Link href={href} className="block transition-transform hover:scale-105">
        <Card className="cursor-pointer hover:border-primary">
          {content}
        </Card>
      </Link>
    )
  }

  return <Card>{content}</Card>
}

