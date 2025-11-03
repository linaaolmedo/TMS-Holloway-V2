import React from 'react'
import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 11, fontFamily: 'Helvetica' },
  header: { marginBottom: 30, borderBottomWidth: 2, borderBottomColor: '#000', paddingBottom: 15 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 5 },
  subtitle: { fontSize: 10, color: '#666' },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 10, color: '#333', borderBottomWidth: 1, borderBottomColor: '#ddd', paddingBottom: 5 },
  row: { flexDirection: 'row', marginBottom: 6 },
  label: { width: '35%', fontWeight: 'bold', color: '#555' },
  value: { width: '65%' },
  rateBox: { backgroundColor: '#f8f8f8', padding: 15, marginVertical: 20, borderWidth: 2, borderColor: '#333' },
  rateLabel: { fontSize: 12, marginBottom: 5, color: '#555' },
  rateValue: { fontSize: 24, fontWeight: 'bold' },
  termsSection: { marginTop: 30, padding: 15, backgroundColor: '#f5f5f5' },
  termsTitle: { fontSize: 12, fontWeight: 'bold', marginBottom: 8 },
  termsList: { fontSize: 9, lineHeight: 1.5, color: '#444' },
})

interface LoadData {
  id: number
  load_number: string | null
  commodity: string | null
  equipment_type: string | null
  pickup_location: string | null
  delivery_location: string | null
  pickup_time: string | null
  delivery_time: string | null
  carrier_rate: number | null
  rate_confirmed_at: string | null
}

interface CarrierData {
  name: string
}

function RateConfDoc({ load, carrier }: { load: LoadData; carrier: CarrierData }) {
  const confirmationNumber = `RC-${new Date().getFullYear()}${String(load.id).padStart(4, '0')}`
  
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>RATE CONFIRMATION</Text>
          <Text style={styles.subtitle}>BulkFlow TMS</Text>
        </View>
        
        {/* Confirmation Details */}
        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.label}>Confirmation #:</Text>
            <Text style={styles.value}>{confirmationNumber}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Load Number:</Text>
            <Text style={styles.value}>{load.load_number || `#${load.id}`}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Carrier:</Text>
            <Text style={styles.value}>{carrier.name}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Date:</Text>
            <Text style={styles.value}>{new Date().toLocaleDateString()}</Text>
          </View>
        </View>
        
        {/* Shipment Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Shipment Details</Text>
          <View style={styles.row}>
            <Text style={styles.label}>From:</Text>
            <Text style={styles.value}>{load.pickup_location || 'N/A'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>To:</Text>
            <Text style={styles.value}>{load.delivery_location || 'N/A'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Commodity:</Text>
            <Text style={styles.value}>{load.commodity || 'N/A'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Equipment:</Text>
            <Text style={styles.value}>{load.equipment_type || 'N/A'}</Text>
          </View>
        </View>
        
        {/* Rate Box */}
        <View style={styles.rateBox}>
          <Text style={styles.rateLabel}>Carrier Rate:</Text>
          <Text style={styles.rateValue}>${load.carrier_rate?.toFixed(2) || '0.00'}</Text>
        </View>
        
        {/* Terms */}
        <View style={styles.termsSection}>
          <Text style={styles.termsTitle}>Terms and Conditions:</Text>
          <Text style={styles.termsList}>
            • Carrier agrees to transport the shipment according to the details outlined above.{'\n'}
            • Payment terms: Net 30 days from delivery date.{'\n'}
            • Carrier must maintain appropriate insurance coverage.{'\n'}
            • Any additional charges must be pre-approved in writing.
          </Text>
        </View>
      </Page>
    </Document>
  )
}

export async function generateRateConfirmationPDF(load: LoadData, carrier: CarrierData): Promise<Buffer> {
  const doc = <RateConfDoc load={load} carrier={carrier} />
  return await pdf(doc).toBuffer()
}

