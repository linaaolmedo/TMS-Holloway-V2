import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Check if PDF already exists in storage
    const { data: existingDoc } = await supabase
      .from('documents')
      .select('storage_path')
      .eq('load_id', id)
      .eq('doc_type', 'RateConfirmation')
      .order('uploaded_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    // If exists and not regenerating, return from storage
    if (existingDoc && !request.nextUrl.searchParams.get('regenerate')) {
      const { data: fileData, error: downloadError } = await supabase
        .storage
        .from('documents')
        .download(existingDoc.storage_path)

      if (!downloadError && fileData) {
        const buffer = await fileData.arrayBuffer()
        return new NextResponse(buffer, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="rate-confirmation-${id}.pdf"`,
          },
        })
      }
    }

    // Generate new PDF
    // Get load data
    const { data: load, error } = await supabase
      .from('loads')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !load) {
      return NextResponse.json({ error: 'Load not found' }, { status: 404 })
    }

    if (!load.carrier_id) {
      return NextResponse.json({ error: 'No carrier assigned' }, { status: 400 })
    }

    if (!load.carrier_rate) {
      return NextResponse.json({ error: 'No carrier rate set' }, { status: 400 })
    }

    // Get carrier data separately
    const { data: carrier, error: carrierError } = await supabase
      .from('companies')
      .select('name')
      .eq('id', load.carrier_id)
      .single()

    if (carrierError || !carrier) {
      return NextResponse.json({ error: 'Carrier not found' }, { status: 404 })
    }

    // Import PDF generator
    const { generateRateConfirmationPDF } = await import('./pdf-generator.js')
    
    // Create clean plain objects (no Supabase proxies)
    const loadData = {
      id: Number(load.id),
      load_number: load.load_number ? String(load.load_number) : null,
      commodity: load.commodity ? String(load.commodity) : null,
      equipment_type: load.equipment_type ? String(load.equipment_type) : null,
      pickup_location: load.pickup_location ? String(load.pickup_location) : null,
      delivery_location: load.delivery_location ? String(load.delivery_location) : null,
      pickup_time: load.pickup_time ? String(load.pickup_time) : null,
      delivery_time: load.delivery_time ? String(load.delivery_time) : null,
      carrier_rate: load.carrier_rate ? Number(load.carrier_rate) : null,
      rate_confirmed_at: load.rate_confirmed_at ? String(load.rate_confirmed_at) : null,
    }
    
    const carrierData = {
      name: String(carrier.name),
    }
    
    // Generate PDF buffer
    const pdfBuffer = await generateRateConfirmationPDF(loadData, carrierData)

    // Upload to Supabase Storage
    const fileName = `rate-confirmations/load-${id}-${Date.now()}.pdf`
    const { error: uploadError } = await supabase
      .storage
      .from('documents')
      .upload(fileName, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: false
      })

    if (uploadError) {
      console.error('Error uploading PDF to storage:', uploadError)
      // Continue anyway - return the PDF even if storage fails
    } else {
      // Create document record
      await supabase
        .from('documents')
        .insert({
          load_id: parseInt(id),
          doc_type: 'RateConfirmation',
          storage_path: fileName,
          uploaded_by: user.id
        })
    }

    // Return PDF
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="rate-confirmation-${id}.pdf"`,
      },
    })
  } catch (error) {
    console.error('Error generating rate confirmation PDF:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ 
      error: 'Failed to generate PDF',
      details: errorMessage
    }, { status: 500 })
  }
}

