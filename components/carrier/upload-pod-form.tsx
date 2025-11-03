'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useRouter } from 'next/navigation'

interface Load {
  id: number
  load_number: string | null
  pickup_location: string | null
  delivery_location: string | null
}

export function UploadPODForm({ loads }: { loads: Load[] }) {
  const [selectedLoad, setSelectedLoad] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || !selectedLoad) return

    setLoading(true)
    
    // Simulate upload
    setTimeout(() => {
      setLoading(false)
      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        setFile(null)
        setSelectedLoad('')
      }, 2000)
    }, 1500)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {success && (
        <div className="rounded-md bg-green-500/10 border border-green-500 p-3 text-sm text-green-500">
          POD uploaded successfully!
        </div>
      )}

      <div>
        <label htmlFor="load-select" className="block text-sm font-medium text-gray-300 mb-2">
          Select Load
        </label>
        <select
          id="load-select"
          value={selectedLoad}
          onChange={(e) => setSelectedLoad(e.target.value)}
          required
          disabled={loading}
          className="w-full rounded-md border border-gray-600 bg-navy-lighter px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">Select a load...</option>
          {loads.map((load) => (
            <option key={load.id} value={load.id}>
              {load.load_number || `Load #${load.id}`} - {load.pickup_location} → {load.delivery_location}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="file-upload" className="block text-sm font-medium text-gray-300 mb-2">
          Upload Document
        </label>
        <Input
          id="file-upload"
          type="file"
          accept="image/*,application/pdf"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          required
          disabled={loading}
        />
        <p className="text-xs text-gray-400 mt-1">Accepted formats: PDF, JPG, PNG</p>
      </div>

      <Button type="submit" disabled={loading || !file || !selectedLoad} className="w-full">
        {loading ? 'Uploading...' : 'Upload POD'}
      </Button>
    </form>
  )
}

