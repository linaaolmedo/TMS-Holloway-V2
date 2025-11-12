'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { LoadsTable } from './loads-table'
import { LoadsMapView } from './loads-map-view'
import { AddLoadModal } from './add-load-modal'
import { Button } from '@/components/ui/button'
import { PlusCircle, Table as TableIcon, Map as MapIcon } from 'lucide-react'
import { ToastProvider } from '@/components/ui/toast'

interface LoadsPageClientProps {
  loads: any[]
  customers: Array<{ id: string; name: string }>
  carriers: Array<{ id: string; name: string }>
  drivers: Array<{ id: string; name: string }>
}

type ViewMode = 'table' | 'map'

export function LoadsPageClient({ loads, customers, carriers, drivers }: LoadsPageClientProps) {
  const searchParams = useSearchParams()
  const [isAddLoadOpen, setIsAddLoadOpen] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('table')
  const [initialFilter, setInitialFilter] = useState<string>('all')

  // Read initial filter from URL params
  useEffect(() => {
    const filter = searchParams.get('filter')
    if (filter) {
      setInitialFilter(filter)
    }
  }, [searchParams])

  return (
    <ToastProvider>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Loads</h1>
            <p className="text-sm text-gray-400">Search, manage, and track all your bulk loads.</p>
          </div>
          <div className="flex items-center gap-3">
            {/* View Toggle */}
            <div className="flex items-center gap-1 bg-navy-lighter rounded-lg p-1 border border-gray-700">
              <Button
                variant={viewMode === 'table' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('table')}
                className="gap-2"
              >
                <TableIcon className="h-4 w-4" />
                Table
              </Button>
              <Button
                variant={viewMode === 'map' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('map')}
                className="gap-2"
              >
                <MapIcon className="h-4 w-4" />
                Map
              </Button>
            </div>

            <Button className="gap-2" onClick={() => setIsAddLoadOpen(true)}>
              <PlusCircle className="h-5 w-5" />
              Add Load
            </Button>
          </div>
        </div>

        {viewMode === 'table' ? (
          <LoadsTable 
            loads={loads} 
            customers={customers}
            carriers={carriers}
            initialFilter={initialFilter}
          />
        ) : (
          <LoadsMapView loads={loads} />
        )}

        <AddLoadModal
          open={isAddLoadOpen}
          onOpenChange={setIsAddLoadOpen}
          customers={customers}
          carriers={carriers}
          drivers={drivers}
        />
      </div>
    </ToastProvider>
  )
}

