'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { FileText, Download, Eye, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/toast'

interface ViewDocumentsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  load: {
    id: number
    load_number: string | null
  }
}

interface Document {
  id: number
  doc_type: string
  storage_path: string
  uploaded_at: string
  uploaded_by: string | null
}

export function ViewDocumentsModal({ open, onOpenChange, load }: ViewDocumentsModalProps) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(false)
  const { showToast } = useToast()

  useEffect(() => {
    if (open) {
      loadDocuments()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, load.id])

  const loadDocuments = async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('load_id', load.id)
        .order('uploaded_at', { ascending: false })

      if (error) {
        console.error('Error loading documents:', error)
        showToast({
          type: 'error',
          title: 'Load Error',
          message: 'Failed to load documents.',
          duration: 5000
        })
        return
      }

      setDocuments(data || [])
    } catch (error) {
      console.error('Error:', error)
      showToast({
        type: 'error',
        title: 'Error',
        message: 'An unexpected error occurred.',
        duration: 5000
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async (doc: Document) => {
    try {
      // Open the download route in a new tab
      window.open(`/api/documents/${doc.id}/download`, '_blank')
    } catch (error) {
      console.error('Error downloading:', error)
      showToast({
        type: 'error',
        title: 'Download Failed',
        message: 'Could not download document.',
        duration: 5000
      })
    }
  }

  const handleViewRateConfirmation = async () => {
    try {
      // Check if load has documents to see if it has a carrier
      const supabase = createClient()
      const { data: loadData } = await supabase
        .from('loads')
        .select('carrier_id')
        .eq('id', load.id)
        .single()

      if (!loadData?.carrier_id) {
        showToast({
          type: 'error',
          title: 'No Carrier Assigned',
          message: 'Cannot generate rate confirmation without an assigned carrier.',
          duration: 5000
        })
        return
      }

      // Open rate confirmation in new tab
      window.open(`/api/loads/${load.id}/rate-confirmation`, '_blank')
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Could not generate rate confirmation.',
        duration: 5000
      })
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const getDocTypeLabel = (docType: string) => {
    switch (docType) {
      case 'POD':
        return 'Proof of Delivery'
      case 'RateConfirmation':
        return 'Rate Confirmation'
      case 'BOL':
        return 'Bill of Lading'
      case 'Invoice':
        return 'Invoice'
      default:
        return docType
    }
  }

  const getDocTypeColor = (docType: string) => {
    switch (docType) {
      case 'POD':
        return 'text-green-500'
      case 'RateConfirmation':
        return 'text-blue-500'
      case 'BOL':
        return 'text-purple-500'
      case 'Invoice':
        return 'text-yellow-500'
      default:
        return 'text-gray-400'
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Load Documents
          </DialogTitle>
          <DialogDescription>
            View and download documents for {load.load_number || `Load #${load.id}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Generate Rate Confirmation Option */}
          <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-blue-400 mb-1">Rate Confirmation</h4>
                <p className="text-xs text-gray-400">View or generate rate confirmation document</p>
              </div>
              <Button
                onClick={handleViewRateConfirmation}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <Eye className="h-4 w-4" />
                View/Generate
              </Button>
            </div>
          </div>

          {/* Documents List */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            </div>
          ) : documents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-400">
              <FileText className="h-12 w-12 mb-2 opacity-50" />
              <p>No documents uploaded yet</p>
              <p className="text-sm">PODs and other documents will appear here once uploaded</p>
            </div>
          ) : (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-white">Uploaded Documents</h4>
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between rounded-lg border border-gray-700 bg-navy-lighter p-3 hover:bg-navy-dark transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <FileText className={`h-5 w-5 ${getDocTypeColor(doc.doc_type)}`} />
                    <div>
                      <p className="text-sm font-medium text-white">
                        {getDocTypeLabel(doc.doc_type)}
                      </p>
                      <p className="text-xs text-gray-400">
                        Uploaded {formatDate(doc.uploaded_at)}
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleDownload(doc)}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4 border-t border-gray-700">
          <Button onClick={() => onOpenChange(false)} variant="outline">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

