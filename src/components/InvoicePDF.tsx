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
    syncRequestDescription?: string;
  };
  logoUrl?: string;
}

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 12,
    fontFamily: 'Helvetica',
    backgroundColor: '#fff',
  },
  section: {
    marginBottom: 16,
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#4F46E5',
  },
  label: {
    fontWeight: 'bold',
    color: '#4F46E5',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginVertical: 12,
  },
  total: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#16A34A',
    marginTop: 8,
  },
});

export const InvoicePDF: React.FC<InvoicePDFProps> = ({ invoice, logoUrl }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {logoUrl && (
        <View style={{ alignItems: 'center', marginBottom: 16 }}>
          <Image src={logoUrl} style={{ width: 120, height: 40, objectFit: 'contain' }} />
        </View>
      )}
      <View style={styles.section}>
        <Text style={styles.header}>MyBeatFi.io Sync License Invoice</Text>
        <Text>Invoice #: {invoice.invoiceNumber}</Text>
        <Text>Date: {new Date(invoice.paymentDate).toLocaleDateString()}</Text>
      </View>
      <View style={styles.section}>
        <Text style={styles.label}>Billed To:</Text>
        <Text>{invoice.clientName}</Text>
        {invoice.clientCompany && <Text>{invoice.clientCompany}</Text>}
      </View>
      <View style={styles.section}>
        <Text style={styles.label}>Producer:</Text>
        <Text>{invoice.producerName}</Text>
      </View>
      <View style={styles.section}>
        <Text style={styles.label}>Track Name:</Text>
        <Text>{invoice.trackTitle}</Text>
      </View>
      {invoice.syncRequestDescription && (
        <View style={styles.section}>
          <Text style={styles.label}>Sync Request Description:</Text>
          <Text>{invoice.syncRequestDescription}</Text>
        </View>
      )}
      <View style={styles.divider} />
      <View style={styles.section}>
        <View style={styles.row}>
          <Text style={styles.label}>Sync Fee</Text>
          <Text>${invoice.syncFee.toFixed(2)}</Text>
        </View>
        {invoice.dueDate && (
          <View style={styles.row}>
            <Text style={styles.label}>Due Date</Text>
            <Text>{new Date(invoice.dueDate).toLocaleDateString()}</Text>
          </View>
        )}
        {invoice.paymentTerms && (
          <View style={styles.row}>
            <Text style={styles.label}>Payment Terms</Text>
            <Text>{invoice.paymentTerms}</Text>
          </View>
        )}
      </View>
      <View style={styles.divider} />
      <View style={styles.section}>
        <Text style={styles.total}>Total: ${invoice.syncFee.toFixed(2)}</Text>
      </View>
      <View style={styles.section}>
        <Text>Thank you for your business!</Text>
      </View>
    </Page>
  </Document>
); 