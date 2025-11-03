'use client'

import { useState } from 'react'
import { LoadsTable } from './loads-table'
import { AddLoadModal } from './add-load-modal'
import { Button } from '@/components/ui/button'
import { PlusCircle } from 'lucide-react'
import { ToastProvider } from '@/components/ui/toast'

interface LoadsPageClientProps {
  loads: any[]
  customers: Array<{ id: string; name: string }>
  carriers: Array<{ id: string; name: string }>
  drivers: Array<{ id: string; name: string }>
}

export function LoadsPageClient({ loads, customers, carriers, drivers }: LoadsPageClientProps) {
  const [isAddLoadOpen, setIsAddLoadOpen] = useState(false)

  return (
    <ToastProvider>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Loads</h1>
            <p className="text-sm text-gray-400">Search, manage, and track all your bulk loads.</p>
          </div>
          <Button className="gap-2" onClick={() => setIsAddLoadOpen(true)}>
            <PlusCircle className="h-5 w-5" />
            Add Load
          </Button>
        </div>

        <LoadsTable 
          loads={loads} 
          customers={customers}
          carriers={carriers}
        />

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

