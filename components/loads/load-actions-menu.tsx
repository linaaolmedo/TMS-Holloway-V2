'use client'

import { useState } from 'react'
import { MoreVertical, Edit, RefreshCw, MessageSquare, Truck, FileText, Trash2, ChevronLeft, UserPlus, UserMinus, Upload, Eye } from 'lucide-react'

interface LoadActionsMenuProps {
  loadId: number
  onViewDetails: () => void
  onChangeStatus: () => void
  onViewComms: () => void
  onAssignCarrier: () => void
  onUnassignCarrier: () => void
  onDirectDispatch: () => void
  onSendRateConfirmation: () => void
  onUploadPOD: () => void
  onViewPOD: () => void
  onDelete: () => void
}

export function LoadActionsMenu({
  loadId,
  onViewDetails,
  onChangeStatus,
  onViewComms,
  onAssignCarrier,
  onUnassignCarrier,
  onDirectDispatch,
  onSendRateConfirmation,
  onUploadPOD,
  onViewPOD,
  onDelete
}: LoadActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeSubmenu, setActiveSubmenu] = useState<'carrier' | 'paperwork' | null>(null)

  const handleAction = (action: () => void) => {
    action()
    setIsOpen(false)
    setActiveSubmenu(null)
  }

  return (
    <div className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation()
          setIsOpen(!isOpen)
        }}
        className="rounded-md p-1 text-gray-400 hover:bg-navy-lighter hover:text-white transition-colors"
      >
        <MoreVertical className="h-5 w-5" />
      </button>

      {isOpen && (
        <>
          {/* Backdrop to close menu when clicking outside */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => {
              setIsOpen(false)
              setActiveSubmenu(null)
            }}
          />
          
          {/* Main Dropdown Menu */}
          <div className="absolute right-0 top-8 z-20 w-56 rounded-lg border border-gray-700 bg-navy-light shadow-xl">
            <div className="py-1">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleAction(onViewDetails)
                }}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-white hover:bg-navy-lighter transition-colors"
              >
                <Edit className="h-4 w-4 text-gray-400" />
                <span>View/Edit Details</span>
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleAction(onChangeStatus)
                }}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-white hover:bg-navy-lighter transition-colors"
              >
                <RefreshCw className="h-4 w-4 text-gray-400" />
                <span>Change Status</span>
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleAction(onViewComms)
                }}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-white hover:bg-navy-lighter transition-colors"
              >
                <MessageSquare className="h-4 w-4 text-gray-400" />
                <span>Log/View Comms</span>
              </button>

              {/* Carrier Actions with Submenu */}
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setActiveSubmenu(activeSubmenu === 'carrier' ? null : 'carrier')
                  }}
                  onMouseEnter={() => setActiveSubmenu('carrier')}
                  className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm text-white hover:bg-navy-lighter transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Truck className="h-4 w-4 text-gray-400" />
                    <span>Carrier Actions</span>
                  </div>
                  <ChevronLeft className="h-4 w-4 text-gray-400" />
                </button>

                {/* Carrier Actions Submenu */}
                {activeSubmenu === 'carrier' && (
                  <div 
                    className="absolute right-full top-0 mr-1 w-56 rounded-lg border border-gray-700 bg-navy-light shadow-xl z-30"
                    onMouseLeave={() => setActiveSubmenu(null)}
                  >
                    <div className="py-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleAction(onAssignCarrier)
                        }}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-white hover:bg-navy-lighter transition-colors"
                      >
                        <UserPlus className="h-4 w-4 text-gray-400" />
                        <span>Assign/Change Carrier</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleAction(onUnassignCarrier)
                        }}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-white hover:bg-navy-lighter transition-colors"
                      >
                        <UserMinus className="h-4 w-4 text-gray-400" />
                        <span>Unassign Carrier</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleAction(onDirectDispatch)
                        }}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-white hover:bg-navy-lighter transition-colors"
                      >
                        <Truck className="h-4 w-4 text-gray-400" />
                        <span>Direct Dispatch to Fleet</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Paperwork with Submenu */}
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setActiveSubmenu(activeSubmenu === 'paperwork' ? null : 'paperwork')
                  }}
                  onMouseEnter={() => setActiveSubmenu('paperwork')}
                  className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm text-white hover:bg-navy-lighter transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-gray-400" />
                    <span>Paperwork</span>
                  </div>
                  <ChevronLeft className="h-4 w-4 text-gray-400" />
                </button>

                {/* Paperwork Submenu */}
                {activeSubmenu === 'paperwork' && (
                  <div 
                    className="absolute right-full top-0 mr-1 w-56 rounded-lg border border-gray-700 bg-navy-light shadow-xl z-30"
                    onMouseLeave={() => setActiveSubmenu(null)}
                  >
                    <div className="py-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleAction(onSendRateConfirmation)
                        }}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-white hover:bg-navy-lighter transition-colors"
                      >
                        <FileText className="h-4 w-4 text-gray-400" />
                        <span>Rate Confirmation</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleAction(onUploadPOD)
                        }}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-white hover:bg-navy-lighter transition-colors"
                      >
                        <Upload className="h-4 w-4 text-gray-400" />
                        <span>Upload POD</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleAction(onViewPOD)
                        }}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-white hover:bg-navy-lighter transition-colors"
                      >
                        <Eye className="h-4 w-4 text-gray-400" />
                        <span>View POD</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="my-1 border-t border-gray-700" />

              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleAction(onDelete)
                }}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete load</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

