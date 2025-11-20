'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useToast } from '@/components/ui/toast'
import { formatCurrency, formatDate } from '@/lib/utils'
import { CheckCircle2, Clock, MoreVertical, FileText, CheckSquare, Upload, Truck } from 'lucide-react'
import { ConfirmRateButton } from '@/components/carrier/confirm-rate-button'
import { RateConfirmationModal } from '@/components/loads/rate-confirmation-modal'
import { updateLoadStatus } from '@/app/actions/loads'
import { useRouter } from 'next/navigation'

interface Load {
  id: number
  load_number: string | null
  status: string
  pickup_location: string | null
  delivery_location: string | null
  pickup_time: string | null
  delivery_time: string | null
  carrier_rate: number | null
  rate_confirmed: boolean | null
  commodity: string | null
  equipment_type: string | null
}

export function CarrierAssignmentsClient({ loads }: { loads: Load[] }) {
  const [openMenuId, setOpenMenuId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedLoadForRateConf, setSelectedLoadForRateConf] = useState<Load | null>(null)
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    title: string
    message: string
    onConfirm: () => Promise<void>
  }>({
    open: false,
    title: '',
    message: '',
    onConfirm: async () => {}
  })
  const { showToast } = useToast()
  const router = useRouter()

  const handleViewRateConf = (load: Load) => {
    setSelectedLoadForRateConf(load)
    setOpenMenuId(null)
  }

  const handleMarkAsInTransit = (loadId: number) => {
    setConfirmDialog({
      open: true,
      title: 'Mark Load as In Transit',
      message: 'Are you sure you want to mark this load as in transit?',
      onConfirm: async () => {
        setLoading(true)
        const result = await updateLoadStatus(loadId, 'in_transit')
        setLoading(false)
        
        if (result.success) {
          showToast({
            type: 'success',
            title: 'Status Updated',
            message: 'Load marked as in transit'
          })
        } else {
          showToast({
            type: 'error',
            title: 'Update Failed',
            message: result.error || 'Failed to update status'
          })
        }
        setOpenMenuId(null)
      }
    })
  }

  const handleMarkAsDelivered = (loadId: number) => {
    setConfirmDialog({
      open: true,
      title: 'Mark Load as Delivered',
      message: 'Are you sure you want to mark this load as delivered?',
      onConfirm: async () => {
        setLoading(true)
        const result = await updateLoadStatus(loadId, 'delivered')
        setLoading(false)
        
        if (result.success) {
          showToast({
            type: 'success',
            title: 'Status Updated',
            message: 'Load marked as delivered'
          })
        } else {
          showToast({
            type: 'error',
            title: 'Update Failed',
            message: result.error || 'Failed to update status'
          })
        }
        setOpenMenuId(null)
      }
    })
  }

  const handleUploadPOD = (loadId: number) => {
    router.push(`/carrier/upload-pod?load=${loadId}`)
    setOpenMenuId(null)
  }

  return (
    <>
      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        confirmLabel="Confirm"
      />

      {selectedLoadForRateConf && (
        <RateConfirmationModal
          load={selectedLoadForRateConf}
          onClose={() => setSelectedLoadForRateConf(null)}
          showSendButton={false}
        />
      )}
      
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">My Shipments</h1>
        <p className="text-sm text-gray-400">All loads currently assigned to you.</p>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto rounded-lg border border-gray-700">
        <table className="w-full">
          <thead className="border-b border-gray-700 bg-navy-lighter">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Load ID</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Origin</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Destination</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Pickup Date</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Delivery Date</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Status</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Your Rate</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-400"></th>
            </tr>
          </thead>
          <tbody>
            {loads.length > 0 ? (
              loads.map((load) => (
                <tr 
                  key={load.id} 
                  className={`border-b border-gray-700 hover:bg-navy-lighter transition-colors ${
                    !load.rate_confirmed ? 'bg-amber-500/5' : ''
                  }`}
                >
                  <td className="px-4 py-3 text-sm text-white font-medium">
                    {load.load_number || `BF-${load.id}`}
                  </td>
                  <td className="px-4 py-3 text-sm text-white">{load.pickup_location}</td>
                  <td className="px-4 py-3 text-sm text-white">{load.delivery_location}</td>
                  <td className="px-4 py-3 text-sm text-white">{formatDate(load.pickup_time)}</td>
                  <td className="px-4 py-3 text-sm text-white">{formatDate(load.delivery_time)}</td>
                  <td className="px-4 py-3">
                    <Badge variant={load.status} />
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-primary">
                    {formatCurrency(load.carrier_rate)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {!load.rate_confirmed ? (
                      <div className="inline-block w-32">
                        <ConfirmRateButton loadId={load.id} carrierRate={load.carrier_rate} />
                      </div>
                    ) : (
                      <div className="relative inline-block">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setOpenMenuId(openMenuId === load.id ? null : load.id)}
                          disabled={loading}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                        
                        {openMenuId === load.id && (
                          <>
                            {/* Backdrop */}
                            <div 
                              className="fixed inset-0 z-10" 
                              onClick={() => setOpenMenuId(null)}
                            />
                            
                            {/* Menu */}
                            <div className="absolute right-0 top-8 z-20 w-48 rounded-lg border border-gray-700 bg-navy-light shadow-xl">
                              <div className="py-1">
                                <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-700">
                                  Actions
                                </div>
                                
                                <button
                                  onClick={() => handleViewRateConf(load)}
                                  className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-white hover:bg-navy-lighter transition-colors"
                                >
                                  <FileText className="h-4 w-4" />
                                  View Rate Conf
                                </button>
                                
                                {load.status === 'pending_pickup' && (
                                  <button
                                    onClick={() => handleMarkAsInTransit(load.id)}
                                    className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-white hover:bg-navy-lighter transition-colors"
                                    disabled={loading}
                                  >
                                    <Truck className="h-4 w-4" />
                                    Mark as In Transit
                                  </button>
                                )}
                                
                                {(load.status === 'in_transit' || load.status === 'pending_pickup') && (
                                  <button
                                    onClick={() => handleMarkAsDelivered(load.id)}
                                    className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-white hover:bg-navy-lighter transition-colors"
                                    disabled={loading}
                                  >
                                    <CheckSquare className="h-4 w-4" />
                                    Mark as Delivered
                                  </button>
                                )}
                                
                                <button
                                  onClick={() => handleUploadPOD(load.id)}
                                  className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-white hover:bg-navy-lighter transition-colors"
                                >
                                  <Upload className="h-4 w-4" />
                                  Upload POD
                                </button>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-gray-400">
                  No assignments yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {loads.length > 0 ? (
          loads.map((load) => (
            <div
              key={load.id}
              className={`rounded-lg border border-gray-700 bg-navy-lighter p-4 space-y-3 ${
                !load.rate_confirmed ? 'ring-2 ring-amber-500/20' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs text-gray-400 mb-1">Load ID</div>
                  <div className="text-sm font-semibold text-white">
                    {load.load_number || `BF-${load.id}`}
                  </div>
                </div>
                <Badge variant={load.status} />
              </div>

              {!load.rate_confirmed && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-md p-2 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-500" />
                  <span className="text-xs text-amber-500">Rate confirmation pending</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs text-gray-400 mb-1">Origin</div>
                  <div className="text-sm text-white">{load.pickup_location}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400 mb-1">Destination</div>
                  <div className="text-sm text-white">{load.delivery_location}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs text-gray-400 mb-1">Pickup Date</div>
                  <div className="text-sm text-white">{formatDate(load.pickup_time)}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400 mb-1">Delivery Date</div>
                  <div className="text-sm text-white">{formatDate(load.delivery_time)}</div>
                </div>
              </div>

              <div>
                <div className="text-xs text-gray-400 mb-1">Your Rate</div>
                <div className="text-lg font-bold text-primary">{formatCurrency(load.carrier_rate)}</div>
              </div>

              <div className="pt-2 border-t border-gray-700">
                {!load.rate_confirmed ? (
                  <ConfirmRateButton loadId={load.id} carrierRate={load.carrier_rate} />
                ) : (
                  <div className="space-y-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewRateConf(load)}
                      className="w-full justify-start"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      View Rate Confirmation
                    </Button>
                    
                    {load.status === 'pending_pickup' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleMarkAsInTransit(load.id)}
                        className="w-full justify-start"
                        disabled={loading}
                      >
                        <Truck className="h-4 w-4 mr-2" />
                        Mark as In Transit
                      </Button>
                    )}
                    
                    {(load.status === 'in_transit' || load.status === 'pending_pickup') && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleMarkAsDelivered(load.id)}
                        className="w-full justify-start"
                        disabled={loading}
                      >
                        <CheckSquare className="h-4 w-4 mr-2" />
                        Mark as Delivered
                      </Button>
                    )}
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleUploadPOD(load.id)}
                      className="w-full justify-start"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload POD
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-lg border border-gray-700 px-4 py-12 text-center text-gray-400">
            No assignments yet
          </div>
        )}
      </div>

      {!loads.length && (
        <div className="text-center py-8 text-gray-400">
          <p className="text-sm">0 of 2 row(s) selected.</p>
        </div>
      )}
    </div>
    </>
  )
}

