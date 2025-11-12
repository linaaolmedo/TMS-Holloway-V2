import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Get document details
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', id)
      .single()

    if (docError || !document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Determine which storage bucket to use based on storage_path
    let bucketName = 'documents' // Default bucket
    if (document.storage_path.startsWith('pods/')) {
      bucketName = 'pods'
    } else if (document.storage_path.startsWith('rate-confirmations/')) {
      bucketName = 'documents'
    } else if (document.storage_path.startsWith('invoices/')) {
      bucketName = 'generated-documents'
    }

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabase
      .storage
      .from(bucketName)
      .download(document.storage_path)

    if (downloadError || !fileData) {
      console.error('Error downloading document:', downloadError)
      return NextResponse.json({ error: 'Failed to download document' }, { status: 500 })
    }

    // Convert blob to buffer
    const buffer = await fileData.arrayBuffer()

    // Determine file name and content type
    const fileName = document.storage_path.split('/').pop() || 'document'
    const contentType = fileData.type || 'application/octet-stream'

    // Return file
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    })
  } catch (error) {
    console.error('Error in document download:', error)
    return NextResponse.json({ error: 'Failed to download document' }, { status: 500 })
  }
}

