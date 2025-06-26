import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';

interface InvoicePDFProps {
  invoice: {
    invoiceNumber: string;
    clientName: string;
    clientEmail: string;
    clientCompany?: string;
    producerName: string;
    producerEmail: string;
    producerCompany?: string;
    trackTitle: string;
    syncFee: number;
    paymentDate: string;
    dueDate?: string;
    paymentTerms?: string;
  };
}

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 12,
    fontFamily: 'Helvetica',
    color: '#333',
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: 'center',
    fontFamily: 'Helvetica-Bold',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    borderBottom: 1,
    paddingBottom: 4,
  },
  infoGrid: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  infoBlock: {
    width: '48%',
  },
  infoLabel: {
    fontWeight: 'bold',
    color: '#666',
  },
  amount: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'right',
    marginTop: 20,
  },
  footer: {
    marginTop: 40,
    textAlign: 'center',
    color: '#666',
    fontSize: 12,
  },
  label: {
    fontWeight: 'bold',
    color: '#666',
  },
});

const LOGO_URL = '/logo192.png'; // Update this path if your logo is elsewhere

export function InvoicePDF({ invoice }: InvoicePDFProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={{ alignItems: 'center', marginBottom: 16 }}>
          <Image src={LOGO_URL} style={{ width: 120, height: 40, objectFit: 'contain' }} />
        </View>
        <Text style={styles.title}>INVOICE</Text>
        <View style={styles.section}>
          <Text>Invoice #: {invoice.invoiceNumber}</Text>
          <Text>Payment Date: {new Date(invoice.paymentDate).toLocaleDateString()}</Text>
          {invoice.dueDate && <Text>Due Date: {new Date(invoice.dueDate).toLocaleDateString()}</Text>}
          {invoice.paymentTerms && <Text>Payment Terms: {invoice.paymentTerms}</Text>}
        </View>
        <View style={styles.infoGrid}>
          <View style={styles.infoBlock}>
            <Text style={styles.label}>Billed To:</Text>
            <Text>{invoice.clientName}</Text>
            {invoice.clientCompany && <Text>{invoice.clientCompany}</Text>}
            <Text>{invoice.clientEmail}</Text>
          </View>
          <View style={styles.infoBlock}>
            <Text style={styles.infoLabel}>From:</Text>
            <Text>{invoice.producerName}</Text>
            {invoice.producerCompany && <Text>{invoice.producerCompany}</Text>}
            <Text>{invoice.producerEmail}</Text>
          </View>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Track Name</Text>
          <Text>{invoice.trackTitle}</Text>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sync Fee</Text>
          <Text style={styles.amount}>${invoice.syncFee.toFixed(2)}</Text>
        </View>
        <View style={styles.footer}>
          <Text>This invoice was generated automatically by MyBeatFi</Text>
          <Text>Generated on: {new Date().toLocaleDateString()}</Text>
        </View>
      </Page>
    </Document>
  );
} 