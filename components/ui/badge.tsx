import * as React from "react"
import { cn, getStatusColor, getStatusLabel } from "@/lib/utils"

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: string
}

export function Badge({ className, variant, children, ...props }: BadgeProps) {
  const statusColor = variant ? getStatusColor(variant) : 'bg-gray-500'
  const label = variant ? getStatusLabel(variant) : children

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium text-white",
        statusColor,
        className
      )}
      {...props}
    >
      {label}
    </div>
  )
}

