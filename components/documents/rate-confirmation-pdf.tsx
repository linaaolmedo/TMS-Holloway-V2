import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 30,
    borderBottomWidth: 2,
    borderBottomColor: '#000',
    paddingBottom: 15,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 10,
    color: '#666',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingBottom: 5,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  label: {
    width: '35%',
    fontWeight: 'bold',
    color: '#555',
  },
  value: {
    width: '65%',
  },
  rateBox: {
    backgroundColor: '#f8f8f8',
    padding: 15,
    marginVertical: 20,
    borderWidth: 2,
    borderColor: '#333',
  },
  rateLabel: {
    fontSize: 12,
    marginBottom: 5,
    color: '#555',
  },
  rateValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  termsSection: {
    marginTop: 30,
    padding: 15,
    backgroundColor: '#f5f5f5',
  },
  termsTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  termsList: {
    fontSize: 9,
    lineHeight: 1.5,
    color: '#444',
  },
  signatureSection: {
    marginTop: 40,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    width: '50%',
    marginTop: 40,
    marginBottom: 5,
  },
  signatureLabel: {
    fontSize: 9,
    color: '#666',
  },
  signatureLabelWithMargin: {
    fontSize: 9,
    color: '#666',
    marginTop: 15,
  },
  acknowledgmentText: {
    marginBottom: 10,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: '#999',
  },
})

interface RateConfirmationPDFProps {
  load: {
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
  carrier: {
    name: string
  }
}

export function RateConfirmationPDF({ load, carrier }: RateConfirmationPDFProps) {
  const confirmationNumber = `RC-${new Date().getFullYear()}${String(load.id).padStart(4, '0')}`
  
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>RATE CONFIRMATION</Text>
          <Text style={styles.subtitle}>BulkFlow TMS</Text>
        </View>

        {/* Confirmation Info */}
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
            <Text style={styles.label}>Date:</Text>
            <Text style={styles.value}>
              {load.rate_confirmed_at ? new Date(load.rate_confirmed_at).toLocaleDateString() : new Date().toLocaleDateString()}
            </Text>
          </View>
        </View>

        {/* Carrier Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Carrier Information:</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Company Name:</Text>
            <Text style={styles.value}>{carrier.name}</Text>
          </View>
        </View>

        {/* Load Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Shipment Details:</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Commodity:</Text>
            <Text style={styles.value}>{load.commodity || 'N/A'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Equipment Type:</Text>
            <Text style={styles.value}>{load.equipment_type || 'N/A'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Pickup Location:</Text>
            <Text style={styles.value}>{load.pickup_location || 'N/A'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Pickup Date:</Text>
            <Text style={styles.value}>
              {load.pickup_time ? new Date(load.pickup_time).toLocaleDateString() : 'N/A'}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Delivery Location:</Text>
            <Text style={styles.value}>{load.delivery_location || 'N/A'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Delivery Date:</Text>
            <Text style={styles.value}>
              {load.delivery_time ? new Date(load.delivery_time).toLocaleDateString() : 'N/A'}
            </Text>
          </View>
        </View>

        {/* Rate */}
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
            • Any additional charges must be pre-approved in writing.{'\n'}
            • Carrier is responsible for providing proof of delivery upon completion.
          </Text>
        </View>

        {/* Signature */}
        <View style={styles.signatureSection}>
          <Text style={styles.acknowledgmentText}>Carrier Acknowledgment:</Text>
          <View style={styles.signatureLine} />
          <Text style={styles.signatureLabel}>Authorized Signature</Text>
          <Text style={styles.signatureLabelWithMargin}>
            Date: {load.rate_confirmed_at ? new Date(load.rate_confirmed_at).toLocaleDateString() : '_____________'}
          </Text>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          This document serves as confirmation of the agreed upon transportation rate.{'\n'}
          Please retain for your records.
        </Text>
      </Page>
    </Document>
  )
}

