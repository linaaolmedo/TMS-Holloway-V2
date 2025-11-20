'use client'

import { formatDate } from '@/lib/utils'
import { Download, FileText, Loader2 } from 'lucide-react'
import { useState } from 'react'

interface CustomerDocumentsClientProps {
  documents: any[]
}

export function CustomerDocumentsClient({ documents }: CustomerDocumentsClientProps) {
  const [downloadingId, setDownloadingId] = useState<number | null>(null)

  const handleDownload = async (documentId: number, docType: string) => {
    try {
      setDownloadingId(documentId)
      const response = await fetch(`/api/documents/${documentId}/download`)
      
      if (!response.ok) {
        throw new Error('Failed to download document')
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${docType}-${documentId}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error downloading document:', error)
      alert('Failed to download document. Please try again.')
    } finally {
      setDownloadingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Documents</h1>
        <p className="text-sm text-gray-400">Access and download your shipment documents.</p>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto rounded-lg border border-gray-700">
        <table className="w-full">
          <thead className="border-b border-gray-700 bg-navy-lighter">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Load ID</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Document Type</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Uploaded Date</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody>
            {documents && documents.length > 0 ? (
              documents.map((doc) => (
                <tr key={doc.id} className="border-b border-gray-700 hover:bg-navy-lighter transition-colors">
                  <td className="px-4 py-3 text-sm text-white">{doc.load?.load_number || '-'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-white">{doc.doc_type}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-white">{formatDate(doc.uploaded_at)}</td>
                  <td className="px-4 py-3">
                    <button 
                      onClick={() => handleDownload(doc.id, doc.doc_type)}
                      disabled={downloadingId === doc.id}
                      className="text-primary hover:text-primary-hover flex items-center gap-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {downloadingId === doc.id ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Downloading...
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4" />
                          Download
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-4 py-12 text-center text-gray-400">
                  No documents found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {documents && documents.length > 0 ? (
          documents.map((doc) => (
            <div
              key={doc.id}
              className="rounded-lg border border-gray-700 bg-navy-lighter p-4 space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-gray-400" />
                  <div>
                    <div className="text-sm font-semibold text-white">{doc.doc_type}</div>
                    <div className="text-xs text-gray-400 mt-1">Load: {doc.load?.load_number || '-'}</div>
                  </div>
                </div>
              </div>

              <div>
                <div className="text-xs text-gray-400 mb-1">Uploaded Date</div>
                <div className="text-sm text-white">{formatDate(doc.uploaded_at)}</div>
              </div>

              <div className="pt-2 border-t border-gray-700">
                <button 
                  onClick={() => handleDownload(doc.id, doc.doc_type)}
                  disabled={downloadingId === doc.id}
                  className="w-full text-primary hover:text-primary-hover flex items-center justify-center gap-2 py-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {downloadingId === doc.id ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Downloading...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      Download Document
                    </>
                  )}
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-lg border border-gray-700 px-4 py-12 text-center text-gray-400">
            No documents found
          </div>
        )}
      </div>

      {documents && documents.length > 0 && (
        <div className="flex items-center justify-between text-sm text-gray-400">
          <div>Showing {documents.length} document(s)</div>
        </div>
      )}
    </div>
  )
}

