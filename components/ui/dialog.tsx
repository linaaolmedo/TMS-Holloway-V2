'use client'

import { X } from 'lucide-react'
import { ReactNode } from 'react'

interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: ReactNode
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />
      
      {/* Dialog content */}
      <div className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto">
        {children}
      </div>
    </div>
  )
}

interface DialogContentProps {
  children: ReactNode
  onClose?: () => void
  className?: string
}

export function DialogContent({ children, onClose, className }: DialogContentProps) {
  return (
    <div className={`relative rounded-lg border border-gray-700 bg-navy-light p-6 shadow-xl ${className || ''}`}>
      {children}
    </div>
  )
}

interface DialogHeaderProps {
  children: ReactNode
  onClose?: () => void
}

export function DialogHeader({ children, onClose }: DialogHeaderProps) {
  return (
    <div className="mb-4 flex items-start justify-between">
      <div className="flex-1">{children}</div>
      {onClose && (
        <button
          onClick={onClose}
          className="ml-4 rounded-lg p-1 text-gray-400 hover:bg-navy-lighter hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>
      )}
    </div>
  )
}

export function DialogTitle({ children, className }: { children: ReactNode; className?: string }) {
  return <h2 className={`text-xl font-bold text-white ${className || ''}`}>{children}</h2>
}

export function DialogDescription({ children }: { children: ReactNode }) {
  return <p className="mt-1 text-sm text-gray-400">{children}</p>
}

