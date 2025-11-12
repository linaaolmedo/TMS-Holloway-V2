'use client'

import { useState, useTransition } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Upload, FileText, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/toast'

interface UploadPODModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  load: {
    id: number
    load_number: string | null
    pickup_location: string | null
    delivery_location: string | null
  }
}

export function UploadPODModal({ open, onOpenChange, load }: UploadPODModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isPending, startTransition] = useTransition()
  const [success, setSuccess] = useState(false)
  const { showToast } = useToast()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setSuccess(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return

    startTransition(async () => {
      try {
        const supabase = createClient()

        // Get current user
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          showToast({
            type: 'error',
            title: 'Not Authenticated',
            message: 'You must be logged in to upload documents.',
            duration: 5000
          })
          return
        }

        // Create unique filename
        const timestamp = Date.now()
        const fileExt = file.name.split('.').pop()
        const fileName = `pod_${load.id}_${timestamp}.${fileExt}`
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
          showToast({
            type: 'error',
            title: 'Upload Failed',
            message: `Failed to upload file: ${uploadError.message}`,
            duration: 5000
          })
          return
        }

        // Create document record
        const { error: docError } = await supabase
          .from('documents')
          .insert({
            load_id: load.id,
            doc_type: 'POD',
            storage_path: filePath,
            uploaded_by: user.id,
          })

        if (docError) {
          console.error('Document record error:', docError)
          showToast({
            type: 'error',
            title: 'Database Error',
            message: `Failed to create document record: ${docError.message}`,
            duration: 5000
          })
          return
        }

        // Success
        setSuccess(true)
        showToast({
          type: 'success',
          title: 'POD Uploaded!',
          message: 'Proof of delivery has been uploaded successfully.',
          duration: 5000
        })

        // Reset and close after a short delay
        setTimeout(() => {
          setFile(null)
          setSuccess(false)
          onOpenChange(false)
          window.location.reload()
        }, 2000)

      } catch (error) {
        console.error('Error uploading POD:', error)
        showToast({
          type: 'error',
          title: 'Upload Failed',
          message: 'An unexpected error occurred.',
          duration: 5000
        })
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            Upload Proof of Delivery
          </DialogTitle>
          <DialogDescription>
            Upload POD for {load.load_number || `Load #${load.id}`}
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="flex flex-col items-center justify-center py-8">
            <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Upload Successful!</h3>
            <p className="text-sm text-gray-400">POD has been saved to the load.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Load Info */}
            <div className="rounded-lg border border-gray-700 bg-navy-lighter p-4">
              <h4 className="text-sm font-medium text-white mb-2">Load Details</h4>
              <div className="space-y-1 text-sm">
                <p className="text-gray-300">
                  <span className="text-gray-400">From:</span> {load.pickup_location || 'N/A'}
                </p>
                <p className="text-gray-300">
                  <span className="text-gray-400">To:</span> {load.delivery_location || 'N/A'}
                </p>
              </div>
            </div>

            {/* File Upload */}
            <div>
              <label className="mb-2 block text-sm font-medium text-white">
                Select POD Document <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-3">
                <label className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-3 rounded-md border border-gray-600 bg-navy-lighter px-4 py-3 hover:border-primary transition-colors">
                    <FileText className="h-5 w-5 text-gray-400" />
                    <span className="text-sm text-gray-300">
                      {file ? file.name : 'Choose file...'}
                    </span>
                  </div>
                  <input
                    type="file"
                    onChange={handleFileChange}
                    accept="image/*,.pdf"
                    className="hidden"
                    required
                  />
                </label>
              </div>
              <p className="mt-2 text-xs text-gray-400">
                Accepted formats: Images (JPG, PNG) or PDF
              </p>
            </div>

            {/* Info */}
            <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-3">
              <p className="text-sm text-blue-400">
                ℹ️ Upload clear photos of signed delivery documents. Ensure signatures and dates are visible.
              </p>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-3">
              <Button
                type="button"
                onClick={() => onOpenChange(false)}
                className="flex-1 bg-gray-600 hover:bg-gray-700"
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isPending || !file}
                className="flex-1 bg-primary hover:bg-primary-hover"
              >
                {isPending ? 'Uploading...' : 'Upload POD'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

