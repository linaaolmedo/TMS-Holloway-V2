import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: {
    padding: 50,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    borderBottomWidth: 1,
    borderBottomColor: '#CCCCCC',
    paddingBottom: 15,
  },
  logoText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F97316',
  },
  invoiceTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  invoiceNumber: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: 'bold',
    textAlign: 'right',
    marginTop: 5,
  },
  statusBadge: {
    backgroundColor: '#FEF3C7',
    color: '#92400E',
    padding: 5,
    fontSize: 9,
    fontWeight: 'bold',
    textAlign: 'right',
    marginTop: 5,
  },
  twoColumnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  column: {
    width: '48%',
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#6B7280',
    marginBottom: 5,
  },
  sectionContent: {
    fontSize: 10,
    color: '#000000',
  },
  separator: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginVertical: 20,
  },
  chargesTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  chargeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  chargeLabel: {
    fontSize: 10,
  },
  chargeAmount: {
    fontSize: 10,
  },
  totalSeparator: {
    borderTopWidth: 2,
    borderTopColor: '#000000',
    marginVertical: 15,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#DC2626',
  },
  notesSection: {
    marginTop: 30,
  },
  notesTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  notesContent: {
    fontSize: 9,
    color: '#6B7280',
  },
})

interface InvoicePDFProps {
  invoice: {
    id: number
    amount: number
    issued_at: string
    status: string
  }
  load: {
    id: number
    load_number: string | null
    commodity: string | null
    equipment_type: string | null
    pickup_location: string | null
    delivery_location: string | null
    pickup_time: string | null
    delivery_time: string | null
  }
  customer: {
    name: string
  }
}

export function InvoicePDF({ invoice, load, customer }: InvoicePDFProps) {
  // Ensure all data is properly formatted as strings/numbers
  const invoiceId = Number(invoice.id)
  const invoiceAmount = Number(invoice.amount)
  const loadId = Number(load.id)
  
  // Format invoice number
  const issueDate = new Date(invoice.issued_at)
  const year = issueDate.getFullYear()
  const month = String(issueDate.getMonth() + 1).padStart(2, '0')
  const day = String(issueDate.getDate()).padStart(2, '0')
  const invoiceNumber = `INV-${year}${month}${day}-${String(invoiceId).padStart(3, '0')}`
  
  // Calculate due date (30 days from issue)
  const dueDate = new Date(invoice.issued_at)
  dueDate.setDate(dueDate.getDate() + 30)
  
  // Format dates for display
  const formatDate = (date: Date) => {
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    const y = date.getFullYear()
    return `${m}/${d}/${y}`
  }

  const issueDateStr = formatDate(issueDate)
  const dueDateStr = formatDate(dueDate)

  // Calculate subtotal and tax (7% tax rate)
  const taxRate = 0.07
  const subtotal = invoiceAmount / (1 + taxRate)
  const tax = invoiceAmount - subtotal

  // Get status display text
  const statusText = invoice.status === 'issued' ? 'SENT' : 
                     invoice.status === 'paid' ? 'PAID' : 
                     invoice.status === 'overdue' ? 'OVERDUE' : 
                     String(invoice.status).toUpperCase()

  // Format load number
  const loadNumber = load.load_number || `BF-${year}-${String(loadId).padStart(5, '0')}`
  
  // Format customer name
  const customerName = String(customer?.name || 'Unknown Customer')

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <View>
            <Text style={styles.logoText}>BULKFLOW TMS</Text>
          </View>
          <View>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <Text style={styles.invoiceNumber}>{invoiceNumber}</Text>
            <Text style={styles.statusBadge}>{statusText}</Text>
          </View>
        </View>

        {/* Bill To and Load Information */}
        <View style={styles.twoColumnRow}>
          <View style={styles.column}>
            <Text style={styles.sectionTitle}>BILL TO:</Text>
            <Text style={styles.sectionContent}>{customerName}</Text>
          </View>
          <View style={styles.column}>
            <Text style={styles.sectionTitle}>LOAD INFORMATION:</Text>
            <Text style={styles.sectionContent}>Load #: {loadNumber}</Text>
          </View>
        </View>

        {/* Issue Date and Due Date */}
        <View style={styles.twoColumnRow}>
          <View style={styles.column}>
            <Text style={styles.sectionTitle}>ISSUE DATE:</Text>
            <Text style={styles.sectionContent}>{issueDateStr}</Text>
          </View>
          <View style={styles.column}>
            <Text style={styles.sectionTitle}>DUE DATE:</Text>
            <Text style={styles.sectionContent}>{dueDateStr}</Text>
          </View>
        </View>

        <View style={styles.separator} />

        {/* Charges */}
        <View>
          <Text style={styles.chargesTitle}>CHARGES</Text>
          
          <View style={styles.chargeRow}>
            <Text style={styles.chargeLabel}>Subtotal:</Text>
            <Text style={styles.chargeAmount}>${subtotal.toFixed(2)}</Text>
          </View>

          <View style={styles.chargeRow}>
            <Text style={styles.chargeLabel}>Tax:</Text>
            <Text style={styles.chargeAmount}>${tax.toFixed(2)}</Text>
          </View>

          <View style={styles.totalSeparator} />

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>TOTAL:</Text>
            <Text style={styles.totalAmount}>${invoiceAmount.toFixed(2)}</Text>
          </View>
        </View>

        <View style={styles.separator} />

        {/* Notes */}
        <View style={styles.notesSection}>
          <Text style={styles.notesTitle}>NOTES:</Text>
          <Text style={styles.notesContent}>Payment due within 30 days</Text>
        </View>
      </Page>
    </Document>
  )
}
