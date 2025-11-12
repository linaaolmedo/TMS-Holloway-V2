'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { formatCurrency, formatDate, getMarginColor } from '@/lib/utils'
import { Search, GripVertical } from 'lucide-react'
import { LoadActionsMenu } from './load-actions-menu'
import { LoadDetailsModal } from './load-details-modal'
import { ChangeStatusModal } from './change-status-modal'
import { EditLoadModal } from './edit-load-modal'
import { GenerateInvoiceModal } from './generate-invoice-modal'
import { ReviewBidsModal } from './review-bids-modal'
import { RateConfirmationModal } from './rate-confirmation-modal'

interface Bid {
  id: number
  bid_amount: number
  submitted_at: string
  status: string
  carrier: {
    id: string
    name: string
  }
}

interface Load {
  id: number
  load_number: string | null
  status: string
  customer_id: string | null
  carrier_id: string | null
  pickup_location: string | null
  delivery_location: string | null
  commodity: string | null
  weight: number | null
  weight_unit: string | null
  equipment_type: string | null
  pricing_type: string | null
  pickup_time: string | null
  delivery_time: string | null
  customer_rate: number | null
  carrier_rate: number | null
  margin_percent: number | null
  rate_confirmed: boolean | null
  rate_confirmed_at: string | null
  comments: string | null
  customer?: { name: string }
  carrier?: { name: string }
  bids?: Bid[]
}

interface Column {
  id: string
  label: string
  render: (load: Load) => React.ReactNode
  width?: string
}

const COLUMN_ORDER_KEY = 'loads-table-column-order'

// Default column order
const DEFAULT_COLUMN_ORDER = [
  'load_id',
  'origin',
  'destination',
  'customer',
  'carrier',
  'equipment',
  'pickup',
  'delivery',
  'status',
  'revenue',
  'carrier_cost',
  'margin',
]

export function LoadsTable({ 
  loads, 
  customers,
  carriers,
  initialFilter = 'all'
}: { 
  loads: Load[]
  customers: Array<{ id: string; name: string }>
  carriers: Array<{ id: string; name: string }>
  initialFilter?: string
}) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState(initialFilter)
  const [selectedLoad, setSelectedLoad] = useState<Load | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showChangeStatusModal, setShowChangeStatusModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)
  const [showBidsModal, setShowBidsModal] = useState(false)
  const [showRateConfModal, setShowRateConfModal] = useState(false)
  const [draggedColumn, setDraggedColumn] = useState<string | null>(null)
  const [columnOrder, setColumnOrder] = useState<string[]>([])

  // Define all available columns
  const allColumns: Record<string, Column> = {
    load_id: {
      id: 'load_id',
      label: 'Load ID',
      render: (load) => (
        <button
          onClick={() => handleViewDetails(load)}
          className="text-primary hover:underline font-medium"
        >
          {load.load_number || `#${load.id}`}
        </button>
      ),
    },
    origin: {
      id: 'origin',
      label: 'Origin',
      render: (load) => <span className="text-sm text-white">{load.pickup_location || '-'}</span>,
    },
    destination: {
      id: 'destination',
      label: 'Destination',
      render: (load) => <span className="text-sm text-white">{load.delivery_location || '-'}</span>,
    },
    customer: {
      id: 'customer',
      label: 'Customer',
      render: (load) => <span className="text-sm text-white">{load.customer?.name || '-'}</span>,
    },
    carrier: {
      id: 'carrier',
      label: 'Carrier',
      render: (load) => {
        const pendingBids = load.bids?.filter(b => b.status === 'pending') || []
        if (!load.carrier_id && pendingBids.length > 0) {
          return (
            <button
              onClick={() => {
                setSelectedLoad(load)
                setShowBidsModal(true)
              }}
              className="flex items-center gap-2 text-sm text-white hover:text-primary transition-colors"
            >
              <span className="rounded-full bg-blue-500 px-2 py-0.5 text-xs font-semibold text-white">
                {pendingBids.length} {pendingBids.length === 1 ? 'Bid' : 'Bids'}
              </span>
              <span className="underline">Review</span>
            </button>
          )
        }
        return <span className="text-sm text-white">{load.carrier?.name || 'TBD'}</span>
      },
    },
    equipment: {
      id: 'equipment',
      label: 'Equipment',
      render: (load) => <span className="text-sm text-white">{load.equipment_type || '-'}</span>,
    },
    pickup: {
      id: 'pickup',
      label: 'Pickup',
      render: (load) => <span className="text-sm text-white">{formatDate(load.pickup_time)}</span>,
    },
    delivery: {
      id: 'delivery',
      label: 'Delivery',
      render: (load) => <span className="text-sm text-white">{formatDate(load.delivery_time)}</span>,
    },
    status: {
      id: 'status',
      label: 'Status',
      render: (load) => <Badge variant={load.status} />,
    },
    revenue: {
      id: 'revenue',
      label: 'Revenue',
      render: (load) => <span className="text-sm text-white">{formatCurrency(load.customer_rate)}</span>,
    },
    carrier_cost: {
      id: 'carrier_cost',
      label: 'Carrier Cost',
      render: (load) => <span className="text-sm text-white">{formatCurrency(load.carrier_rate)}</span>,
    },
    margin: {
      id: 'margin',
      label: 'Margin',
      render: (load) => {
        const marginDollar = (load.customer_rate || 0) - (load.carrier_rate || 0)
        return (
          <div className="flex flex-col">
            <span className={`text-sm font-semibold ${getMarginColor(load.margin_percent)}`}>
              {formatCurrency(marginDollar)}
            </span>
            <span className={`text-xs ${getMarginColor(load.margin_percent)}`}>
              {load.margin_percent ? `${load.margin_percent.toFixed(1)}%` : '0.0%'}
            </span>
          </div>
        )
      },
    },
  }

  // Update status filter when initialFilter changes
  useEffect(() => {
    setStatusFilter(initialFilter)
  }, [initialFilter])

  // Load column order from localStorage on mount
  useEffect(() => {
    const savedOrder = localStorage.getItem(COLUMN_ORDER_KEY)
    if (savedOrder) {
      try {
        const parsed = JSON.parse(savedOrder)
        // Validate that all default columns are present
        const isValid = DEFAULT_COLUMN_ORDER.every((col) => parsed.includes(col))
        if (isValid && parsed.length === DEFAULT_COLUMN_ORDER.length) {
          setColumnOrder(parsed)
        } else {
          setColumnOrder(DEFAULT_COLUMN_ORDER)
        }
      } catch {
        setColumnOrder(DEFAULT_COLUMN_ORDER)
      }
    } else {
      setColumnOrder(DEFAULT_COLUMN_ORDER)
    }
  }, [])

  // Save column order to localStorage whenever it changes
  useEffect(() => {
    if (columnOrder.length > 0) {
      localStorage.setItem(COLUMN_ORDER_KEY, JSON.stringify(columnOrder))
    }
  }, [columnOrder])

  const handleDragStart = (e: React.DragEvent, columnId: string) => {
    setDraggedColumn(columnId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, targetColumnId: string) => {
    e.preventDefault()
    
    if (!draggedColumn || draggedColumn === targetColumnId) {
      setDraggedColumn(null)
      return
    }

    const newOrder = [...columnOrder]
    const draggedIndex = newOrder.indexOf(draggedColumn)
    const targetIndex = newOrder.indexOf(targetColumnId)

    // Remove dragged column and insert at target position
    newOrder.splice(draggedIndex, 1)
    newOrder.splice(targetIndex, 0, draggedColumn)

    setColumnOrder(newOrder)
    setDraggedColumn(null)
  }

  const handleDragEnd = () => {
    setDraggedColumn(null)
  }

  const filteredLoads = loads.filter((load) => {
    const matchesSearch =
      load.load_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      load.pickup_location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      load.delivery_location?.toLowerCase().includes(searchTerm.toLowerCase())

    // "All Active" excludes closed loads (closed loads are for audit logs only)
    const matchesStatus = 
      statusFilter === 'all' 
        ? load.status !== 'closed' 
        : load.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const handleViewDetails = (load: Load) => {
    setSelectedLoad(load)
    setShowDetailsModal(true)
  }

  const handleChangeStatus = (load: Load) => {
    setSelectedLoad(load)
    setShowChangeStatusModal(true)
  }

  const handleViewComms = (loadId: number) => {
    // TODO: Implement communications log
    console.log('View comms for load:', loadId)
  }

  const handleAssignCarrier = (load: Load) => {
    setSelectedLoad(load)
    setShowEditModal(true) // Reuse edit modal for carrier assignment
  }

  const handleUnassignCarrier = async (loadId: number) => {
    if (confirm('Unassign carrier? This will reset the carrier assignment and rate confirmation.')) {
      const { unassignCarrier } = await import('@/app/actions/loads')
      const result = await unassignCarrier(loadId)
      if (!result.success) {
        alert(result.error || 'Failed to unassign carrier')
      }
    }
  }

  const handleDirectDispatch = (loadId: number) => {
    // TODO: Implement direct dispatch to fleet modal
    alert('Direct Dispatch to Fleet - Coming soon!')
  }

  const handleSendRateConfirmation = (load: Load) => {
    setSelectedLoad(load)
    setShowRateConfModal(true)
  }

  const handleUploadPOD = (loadId: number) => {
    // TODO: Implement upload POD modal
    alert('Upload POD modal - Under construction')
  }

  const handleViewPOD = (loadId: number) => {
    // TODO: Implement view POD modal
    alert('View POD modal - Under construction')
  }

  const handleDelete = async (loadId: number) => {
    if (confirm('Are you sure you want to archive this load? This action can be undone by database administrators.')) {
      const { deleteLoad } = await import('@/app/actions/loads')
      const result = await deleteLoad(loadId)
      if (result.success) {
        // Reload will happen automatically via revalidatePath
      } else {
        alert(result.error || 'Failed to delete load')
      }
    }
  }

  return (
    <>
      <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="ID, Origin, Dest..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-md border border-gray-600 bg-navy-lighter px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="all">All Active</option>
          <option value="pending_pickup">Pending Pickup</option>
          <option value="in_transit">In Transit</option>
          <option value="delivered">Delivered</option>
          <option value="delayed">Delayed</option>
          <option value="cancelled">Cancelled</option>
          <option value="closed">Closed (Audit)</option>
        </select>

        <button className="rounded-md bg-primary px-6 py-2 text-sm font-medium text-white hover:bg-primary-hover">
          Search
        </button>
        <button className="rounded-md border border-gray-600 bg-transparent px-6 py-2 text-sm font-medium text-white hover:bg-navy-lighter">
          Clear
        </button>
      </div>

      {/* Tip for drag and drop */}
      <div className="text-xs text-gray-400 italic">
        💡 Tip: Drag column headers to reorder them. Your preferences will be saved automatically.
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-700">
        <table className="w-full">
          <thead className="border-b border-gray-700 bg-navy-lighter">
            <tr>
              {columnOrder.map((columnId) => {
                const column = allColumns[columnId]
                return (
                  <th
                    key={columnId}
                    draggable
                    onDragStart={(e) => handleDragStart(e, columnId)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, columnId)}
                    onDragEnd={handleDragEnd}
                    className={`px-4 py-3 text-left text-sm font-medium text-gray-400 cursor-move select-none transition-colors ${
                      draggedColumn === columnId ? 'opacity-50' : ''
                    } hover:bg-navy-dark`}
                    title="Drag to reorder"
                  >
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-4 w-4 text-gray-500" />
                      {column.label}
                    </div>
                  </th>
                )
              })}
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredLoads.length > 0 ? (
              filteredLoads.map((load) => (
                <tr
                  key={load.id}
                  className="border-b border-gray-700 hover:bg-navy-lighter transition-colors"
                >
                  {columnOrder.map((columnId) => {
                    const column = allColumns[columnId]
                    return (
                      <td key={columnId} className="px-4 py-3">
                        {column.render(load)}
                      </td>
                    )
                  })}
                  <td className="px-4 py-3">
                    <LoadActionsMenu
                      loadId={load.id}
                      onViewDetails={() => handleViewDetails(load)}
                      onChangeStatus={() => handleChangeStatus(load)}
                      onViewComms={() => handleViewComms(load.id)}
                      onAssignCarrier={() => handleAssignCarrier(load)}
                      onUnassignCarrier={() => handleUnassignCarrier(load.id)}
                      onDirectDispatch={() => handleDirectDispatch(load.id)}
                      onSendRateConfirmation={() => handleSendRateConfirmation(load)}
                      onUploadPOD={() => handleUploadPOD(load.id)}
                      onViewPOD={() => handleViewPOD(load.id)}
                      onDelete={() => handleDelete(load.id)}
                    />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columnOrder.length + 1} className="px-4 py-12 text-center text-gray-400">
                  No loads found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm text-gray-400">
        <div>0 of {loads.length} row(s) selected.</div>
        <div className="flex gap-2">
          <button className="rounded-md border border-gray-600 px-4 py-2 hover:bg-navy-lighter">
            Previous
          </button>
          <button className="rounded-md border border-gray-600 px-4 py-2 hover:bg-navy-lighter">
            Next
          </button>
        </div>
      </div>
      </div>

      {/* Load Details Modal */}
      {showDetailsModal && selectedLoad && (
        <LoadDetailsModal
          load={selectedLoad}
          onClose={() => {
            setShowDetailsModal(false)
            setSelectedLoad(null)
          }}
          onEdit={() => {
            setShowDetailsModal(false)
            setShowEditModal(true)
          }}
        />
      )}

      {/* Change Status Modal */}
      {showChangeStatusModal && selectedLoad && (
        <ChangeStatusModal
          open={showChangeStatusModal}
          onOpenChange={(open) => {
            setShowChangeStatusModal(open)
            if (!open) setSelectedLoad(null)
          }}
          load={selectedLoad}
        />
      )}

      {/* Edit Load Modal */}
      {showEditModal && selectedLoad && (
        <EditLoadModal
          open={showEditModal}
          onOpenChange={(open) => {
            setShowEditModal(open)
            if (!open) setSelectedLoad(null)
          }}
          load={selectedLoad}
          customers={customers}
          carriers={carriers}
        />
      )}

      {/* Generate Invoice Modal */}
      {showInvoiceModal && selectedLoad && (
        <GenerateInvoiceModal
          open={showInvoiceModal}
          onOpenChange={(open) => {
            setShowInvoiceModal(open)
            if (!open) setSelectedLoad(null)
          }}
          load={selectedLoad}
        />
      )}

      {/* Review Bids Modal */}
      {showBidsModal && selectedLoad && selectedLoad.bids && (
        <ReviewBidsModal
          loadId={selectedLoad.id}
          loadNumber={selectedLoad.load_number}
          bids={selectedLoad.bids}
          onClose={() => {
            setShowBidsModal(false)
            setSelectedLoad(null)
          }}
        />
      )}

      {/* Rate Confirmation Modal */}
      {showRateConfModal && selectedLoad && (
        <RateConfirmationModal
          load={selectedLoad}
          onClose={() => {
            setShowRateConfModal(false)
            setSelectedLoad(null)
          }}
        />
      )}
    </>
  )
}

