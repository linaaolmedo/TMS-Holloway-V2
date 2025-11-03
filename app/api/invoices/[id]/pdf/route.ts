import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import { readFileSync } from 'fs'
import { join } from 'path'

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

    // Get current user for audit logging
    const { data: { user } } = await supabase.auth.getUser()
    
    // Get invoice with related data
    const { data: invoice, error } = await supabase
      .from('invoices')
      .select(`
        *,
        load:loads(*),
        customer:companies(name)
      `)
      .eq('id', id)
      .single()

    if (error || !invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // Create PDF using pdf-lib
    const pdfDoc = await PDFDocument.create()
    const page = pdfDoc.addPage([595, 842]) // A4 size
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
    
    // Embed logo
    let logoImage;
    try {
      const logoPath = join(process.cwd(), 'public', 'tms-full-logo.png')
      const logoBytes = readFileSync(logoPath)
      logoImage = await pdfDoc.embedPng(logoBytes)
    } catch (err) {
      console.warn('Could not load logo, continuing without it:', err)
    }
    
    const { width, height } = page.getSize()
    const fontSize = 12
    const titleSize = 24
    const headerSize = 14
    
    // Format dates
    const issueDate = new Date(invoice.issued_at)
    const year = issueDate.getFullYear()
    const month = String(issueDate.getMonth() + 1).padStart(2, '0')
    const day = String(issueDate.getDate()).padStart(2, '0')
    const invoiceNumber = `INV-${year}${month}${day}-${String(invoice.id).padStart(3, '0')}`
    
    const dueDate = new Date(issueDate)
    dueDate.setDate(dueDate.getDate() + 30)
    
    const formatDate = (date: Date) => {
      const m = String(date.getMonth() + 1).padStart(2, '0')
      const d = String(date.getDate()).padStart(2, '0')
      const y = date.getFullYear()
      return `${m}/${d}/${y}`
    }
    
    const issueDateStr = formatDate(issueDate)
    const dueDateStr = formatDate(dueDate)
    
    // Calculate amounts
    const invoiceAmount = Number(invoice.amount)
    const taxRate = 0.07
    const subtotal = invoiceAmount / (1 + taxRate)
    const tax = invoiceAmount - subtotal
    
    // Get load number
    const loadNumber = invoice.load?.load_number || `BF-${year}-${String(invoice.load?.id || 0).padStart(5, '0')}`
    const customerName = invoice.customer?.name || 'Unknown Customer'
    const statusText = invoice.status === 'issued' ? 'SENT' : 
                       invoice.status === 'paid' ? 'PAID' : 
                       invoice.status === 'overdue' ? 'OVERDUE' : 
                       String(invoice.status).toUpperCase()
    
    // Draw logo or text header
    if (logoImage) {
      const logoScale = 0.3 // Adjust scale as needed
      const logoDims = logoImage.scale(logoScale)
      page.drawImage(logoImage, {
        x: 50,
        y: height - 50 - logoDims.height,
        width: logoDims.width,
        height: logoDims.height,
      })
    } else {
      page.drawText('BULKFLOW TMS', {
        x: 50,
        y: height - 50,
        size: 16,
        font: boldFont,
        color: rgb(0.98, 0.45, 0.09), // Orange color
      })
    }
    
    page.drawText('INVOICE', {
      x: width - 200,
      y: height - 50,
      size: titleSize,
      font: boldFont,
      color: rgb(0, 0, 0),
    })
    
    page.drawText(invoiceNumber, {
      x: width - 200,
      y: height - 75,
      size: fontSize,
      font: boldFont,
      color: rgb(0.86, 0.15, 0.15), // Red color
    })
    
    page.drawText(statusText, {
      x: width - 200,
      y: height - 95,
      size: 10,
      font: boldFont,
      color: rgb(0.57, 0.25, 0.05),
    })
    
    // Draw line separator
    page.drawLine({
      start: { x: 50, y: height - 110 },
      end: { x: width - 50, y: height - 110 },
      thickness: 1,
      color: rgb(0.8, 0.8, 0.8),
    })
    
    // Bill To section
    page.drawText('BILL TO:', {
      x: 50,
      y: height - 140,
      size: 10,
      font: boldFont,
      color: rgb(0.42, 0.45, 0.5),
    })
    
    page.drawText(customerName, {
      x: 50,
      y: height - 160,
      size: fontSize,
      font: font,
      color: rgb(0, 0, 0),
    })
    
    // Load Information
    page.drawText('LOAD INFORMATION:', {
      x: width - 250,
      y: height - 140,
      size: 10,
      font: boldFont,
      color: rgb(0.42, 0.45, 0.5),
    })
    
    page.drawText(`Load #: ${loadNumber}`, {
      x: width - 250,
      y: height - 160,
      size: fontSize,
      font: font,
      color: rgb(0, 0, 0),
    })
    
    // Issue Date
    page.drawText('ISSUE DATE:', {
      x: 50,
      y: height - 200,
      size: 10,
      font: boldFont,
      color: rgb(0.42, 0.45, 0.5),
    })
    
    page.drawText(issueDateStr, {
      x: 50,
      y: height - 220,
      size: fontSize,
      font: font,
      color: rgb(0, 0, 0),
    })
    
    // Due Date
    page.drawText('DUE DATE:', {
      x: width - 250,
      y: height - 200,
      size: 10,
      font: boldFont,
      color: rgb(0.42, 0.45, 0.5),
    })
    
    page.drawText(dueDateStr, {
      x: width - 250,
      y: height - 220,
      size: fontSize,
      font: font,
      color: rgb(0, 0, 0),
    })
    
    // Charges section separator
    page.drawLine({
      start: { x: 50, y: height - 250 },
      end: { x: width - 50, y: height - 250 },
      thickness: 1,
      color: rgb(0.9, 0.9, 0.9),
    })
    
    // Charges
    page.drawText('CHARGES', {
      x: 50,
      y: height - 280,
      size: headerSize,
      font: boldFont,
      color: rgb(0, 0, 0),
    })
    
    page.drawText('Subtotal:', {
      x: 50,
      y: height - 310,
      size: fontSize,
      font: font,
      color: rgb(0, 0, 0),
    })
    
    page.drawText(`$${subtotal.toFixed(2)}`, {
      x: width - 150,
      y: height - 310,
      size: fontSize,
      font: font,
      color: rgb(0, 0, 0),
    })
    
    page.drawText('Tax:', {
      x: 50,
      y: height - 335,
      size: fontSize,
      font: font,
      color: rgb(0, 0, 0),
    })
    
    page.drawText(`$${tax.toFixed(2)}`, {
      x: width - 150,
      y: height - 335,
      size: fontSize,
      font: font,
      color: rgb(0, 0, 0),
    })
    
    // Total separator
    page.drawLine({
      start: { x: 50, y: height - 355 },
      end: { x: width - 50, y: height - 355 },
      thickness: 2,
      color: rgb(0, 0, 0),
    })
    
    // Total
    page.drawText('TOTAL:', {
      x: 50,
      y: height - 385,
      size: headerSize,
      font: boldFont,
      color: rgb(0, 0, 0),
    })
    
    page.drawText(`$${invoiceAmount.toFixed(2)}`, {
      x: width - 150,
      y: height - 385,
      size: 16,
      font: boldFont,
      color: rgb(0.86, 0.15, 0.15),
    })
    
    // Notes section separator
    page.drawLine({
      start: { x: 50, y: height - 415 },
      end: { x: width - 50, y: height - 415 },
      thickness: 1,
      color: rgb(0.9, 0.9, 0.9),
    })
    
    // Notes
    page.drawText('NOTES:', {
      x: 50,
      y: height - 445,
      size: 10,
      font: boldFont,
      color: rgb(0, 0, 0),
    })
    
    page.drawText('Payment due within 30 days', {
      x: 50,
      y: height - 465,
      size: 9,
      font: font,
      color: rgb(0.42, 0.45, 0.5),
    })
    
    // Serialize the PDF
    const pdfBytes = await pdfDoc.save()
    
    console.log(`PDF generated successfully: ${pdfBytes.length} bytes`)

    // Store PDF in Supabase Storage
    const fileName = `invoices/invoice-${invoiceNumber}-${Date.now()}.pdf`
    try {
      const { data: uploadData, error: uploadError } = await supabase
        .storage
        .from('generated-documents')
        .upload(fileName, pdfBytes, {
          contentType: 'application/pdf',
          upsert: false
        })

      if (uploadError) {
        console.warn('Failed to upload PDF to storage:', uploadError)
      } else {
        console.log('PDF stored successfully:', fileName)
        
        // Update documents table
        await supabase.from('documents').insert({
          load_id: invoice.load_id,
          doc_type: 'Invoice',
          storage_path: fileName,
          uploaded_by: user?.id || null
        })
      }
    } catch (storageError) {
      console.warn('Storage operation failed:', storageError)
    }

    // Log audit trail
    try {
      await supabase.from('audit_logs').insert({
        entity_type: 'invoice',
        entity_id: parseInt(id),
        action: 'downloaded',
        user_id: user?.id || null,
        user_email: user?.email || null,
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
        user_agent: request.headers.get('user-agent') || null,
        metadata: {
          invoice_number: invoiceNumber,
          customer_id: invoice.customer_id,
          load_id: invoice.load_id,
          amount: invoiceAmount,
          storage_path: fileName
        }
      })
    } catch (auditError) {
      console.warn('Audit log failed:', auditError)
    }

    // Return PDF
    return new NextResponse(pdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${invoiceNumber}.pdf"`,
        'Content-Length': pdfBytes.length.toString(),
      },
    })
  } catch (error) {
    console.error('Error generating invoice PDF:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ 
      error: 'Failed to generate PDF',
      details: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}

