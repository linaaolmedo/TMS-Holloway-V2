'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle, AlertCircle } from 'lucide-react'

interface Load {
  id: number
  load_number: string | null
  pickup_location: string | null
  delivery_location: string | null
}

export function DriverUploadPODForm({ loads }: { loads: Load[] }) {
  const [selectedLoad, setSelectedLoad] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [isPending, startTransition] = useTransition()
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || !selectedLoad) return

    setError(null)
    setSuccess(false)

    startTransition(async () => {
      try {
        const supabase = createClient()

        // Get current user
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          setError('Not authenticated')
          return
        }

        // Create unique filename
        const timestamp = Date.now()
        const fileExt = file.name.split('.').pop()
        const fileName = `pod_${selectedLoad}_${timestamp}.${fileExt}`
        const filePath = `pods/${fileName}`

        // Upload file to Supabase storage
        const { error: uploadError } = await supabase.storage
          .from('pods')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          })

        if (uploadError) {
          console.error('Upload error:', uploadError)
          setError(`Failed to upload file: ${uploadError.message}`)
          return
        }

        // Create document record
        const { error: docError } = await supabase
          .from('documents')
          .insert({
            load_id: parseInt(selectedLoad),
            doc_type: 'POD',
            storage_path: filePath,
            uploaded_by: user.id,
          })

        if (docError) {
          console.error('Document record error:', docError)
          setError(`Failed to create document record: ${docError.message}`)
          return
        }

        // Update load status to delivered if it's in transit
        const { data: loadData } = await supabase
          .from('loads')
          .select('status')
          .eq('id', parseInt(selectedLoad))
          .single()

        if (loadData?.status === 'in_transit') {
          await supabase
            .from('loads')
            .update({ status: 'delivered' })
            .eq('id', parseInt(selectedLoad))
        }

        setSuccess(true)
        setFile(null)
        setSelectedLoad('')
        
        // Reset success message after 3 seconds
        setTimeout(() => {
          setSuccess(false)
        }, 3000)
      } catch (err) {
        console.error('Error uploading POD:', err)
        setError('An unexpected error occurred while uploading')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {success && (
        <div className="rounded-md bg-green-500/10 border border-green-500 p-3 flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-green-500">POD uploaded successfully!</p>
            <p className="text-xs text-green-400 mt-0.5">The document has been saved and the dispatcher has been notified.</p>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-md bg-red-500/10 border border-red-500 p-3 flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-500">Upload failed</p>
            <p className="text-xs text-red-400 mt-0.5">{error}</p>
          </div>
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
          disabled={isPending}
          className="w-full rounded-md border border-gray-600 bg-navy-lighter px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value="">Select a load...</option>
          {loads.map((load) => (
            <option key={load.id} value={load.id}>
              {load.load_number || `Load #${load.id}`} - {load.pickup_location} → {load.delivery_location}
            </option>
          ))}
        </select>
        {loads.length === 0 && (
          <p className="text-xs text-amber-400 mt-1">No active loads available for POD upload</p>
        )}
      </div>

      <div>
        <label htmlFor="file-upload" className="block text-sm font-medium text-gray-300 mb-2">
          Take Photo or Upload Document
        </label>
        <Input
          id="file-upload"
          type="file"
          accept="image/*,application/pdf"
          capture="environment"
          onChange={(e) => {
            const selectedFile = e.target.files?.[0] || null
            setFile(selectedFile)
            setError(null)
          }}
          required
          disabled={isPending}
          className="cursor-pointer"
        />
        <div className="flex items-start gap-2 mt-2">
          <div className="flex-1">
            <p className="text-xs text-gray-400">
              • Take a photo using your camera
            </p>
            <p className="text-xs text-gray-400">
              • Upload from gallery
            </p>
            <p className="text-xs text-gray-400">
              • Accepted formats: JPG, PNG, PDF
            </p>
          </div>
          {file && (
            <div className="text-xs text-green-400 flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              File selected
            </div>
          )}
        </div>
      </div>

      <Button 
        type="submit" 
        disabled={isPending || !file || !selectedLoad || loads.length === 0} 
        className="w-full"
      >
        {isPending ? 'Uploading...' : 'Upload POD'}
      </Button>
    </form>
  )
}

