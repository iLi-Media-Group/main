import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';

interface SyncProposalLicensePDFProps {
  license: {
    trackTitle: string;
    producerName: string;
    producerEmail: string;
    clientName: string;
    clientEmail: string;
    clientCompany?: string;
    projectDescription: string;
    duration: string;
    isExclusive: boolean;
    syncFee: number;
    paymentDate: string;
    expirationDate: string;
    paymentTerms: string;
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
  header: {
    textAlign: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#1f2937',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingBottom: 5,
  },
  text: {
    marginBottom: 8,
    lineHeight: 1.5,
    color: '#374151',
  },
  partyInfo: {
    marginBottom: 15,
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 4,
  },
  infoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoLabel: {
    fontWeight: 'bold',
    color: '#4b5563',
    width: '30%',
  },
  infoValue: {
    color: '#374151',
    width: '70%',
  },
  highlight: {
    backgroundColor: '#fef3c7',
    padding: 8,
    borderRadius: 4,
    marginVertical: 8,
  },
  termsList: {
    marginLeft: 20,
    marginBottom: 8,
  },
  termsItem: {
    marginBottom: 5,
    color: '#374151',
  },
  signature: {
    marginTop: 40,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 20,
  },
  footer: {
    marginTop: 30,
    textAlign: 'center',
    fontSize: 10,
    color: '#6b7280',
  },
});

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export function SyncProposalLicensePDF({ license, logoUrl }: SyncProposalLicensePDFProps) {
  const calculateDuration = (duration: string): string => {
    switch (duration.toLowerCase()) {
      case 'perpetual':
        return 'Perpetual (No Expiration)';
      case '1 year':
        return '1 Year';
      case '2 years':
        return '2 Years';
      case '3 years':
        return '3 Years';
      case '5 years':
        return '5 Years';
      default:
        return duration;
    }
  };

  const getRightsText = (isExclusive: boolean): string => {
    return isExclusive 
      ? 'Exclusive rights granted for the specified duration'
      : 'Non-exclusive rights granted for the specified duration';
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {logoUrl && (
          <View style={{ alignItems: 'center', marginBottom: 20 }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1f2937' }}>
              MyBeatFi.io
            </Text>
          </View>
        )}

        <View style={styles.header}>
          <Text style={styles.title}>Music Synchronization License Agreement</Text>
          <Text style={styles.subtitle}>Sync Proposal License</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>LICENSE SUMMARY</Text>
          <View style={styles.infoGrid}>
            <Text style={styles.infoLabel}>Track Title:</Text>
            <Text style={styles.infoValue}>{license.trackTitle}</Text>
          </View>
          <View style={styles.infoGrid}>
            <Text style={styles.infoLabel}>Producer:</Text>
            <Text style={styles.infoValue}>{license.producerName}</Text>
          </View>
          <View style={styles.infoGrid}>
            <Text style={styles.infoLabel}>License Type:</Text>
            <Text style={styles.infoValue}>
              {license.isExclusive ? 'Exclusive' : 'Non-Exclusive'} Sync License
            </Text>
          </View>
          <View style={styles.infoGrid}>
            <Text style={styles.infoLabel}>Duration:</Text>
            <Text style={styles.infoValue}>{calculateDuration(license.duration)}</Text>
          </View>
          <View style={styles.infoGrid}>
            <Text style={styles.infoLabel}>License Fee:</Text>
            <Text style={styles.infoValue}>{formatCurrency(license.syncFee)}</Text>
          </View>
          <View style={styles.infoGrid}>
            <Text style={styles.infoLabel}>Payment Date:</Text>
            <Text style={styles.infoValue}>{formatDate(license.paymentDate)}</Text>
          </View>
          {license.expirationDate !== 'Perpetual' && (
            <View style={styles.infoGrid}>
              <Text style={styles.infoLabel}>Expiration Date:</Text>
              <Text style={styles.infoValue}>{formatDate(license.expirationDate)}</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PROJECT DETAILS</Text>
          <View style={styles.infoGrid}>
            <Text style={styles.infoLabel}>Project Description:</Text>
            <Text style={styles.infoValue}>{license.projectDescription}</Text>
          </View>
          <View style={styles.infoGrid}>
            <Text style={styles.infoLabel}>Usage Rights:</Text>
            <Text style={styles.infoValue}>{getRightsText(license.isExclusive)}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PARTIES</Text>
          <View style={styles.partyInfo}>
            <Text style={styles.text}>
              <Text style={{ fontWeight: 'bold' }}>Licensor (Producer):</Text> {license.producerName}
            </Text>
            <Text style={styles.text}>Email: {license.producerEmail}</Text>
          </View>
          <View style={styles.partyInfo}>
            <Text style={styles.text}>
              <Text style={{ fontWeight: 'bold' }}>Licensee (Client):</Text> {license.clientName}
            </Text>
            {license.clientCompany && (
              <Text style={styles.text}>Company: {license.clientCompany}</Text>
            )}
            <Text style={styles.text}>Email: {license.clientEmail}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>GRANT OF LICENSE</Text>
          <Text style={styles.text}>
            Licensor hereby grants Licensee a {license.isExclusive ? 'exclusive' : 'non-exclusive'}, 
            non-transferable license to synchronize and use the musical composition and sound recording 
            titled "{license.trackTitle}" ("Music") for the project described above.
          </Text>
          <Text style={styles.text}>
            This license is worldwide and valid for {calculateDuration(license.duration).toLowerCase()}, 
            subject to the terms and conditions stated herein.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PERMITTED USES</Text>
          <View style={styles.termsList}>
            <Text style={styles.termsItem}>• Synchronization with visual content for the specified project</Text>
            <Text style={styles.termsItem}>• Public performance in connection with the licensed project</Text>
            <Text style={styles.termsItem}>• Reproduction and distribution as part of the licensed project</Text>
            <Text style={styles.termsItem}>• Digital streaming and broadcasting of the licensed project</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>RESTRICTIONS</Text>
          <View style={styles.termsList}>
            <Text style={styles.termsItem}>• Resell, sublicense, or distribute the Music as a standalone product</Text>
            <Text style={styles.termsItem}>• Use the Music in projects not specified in this agreement</Text>
            <Text style={styles.termsItem}>• Use the Music in a manner that is defamatory, obscene, or illegal</Text>
            <Text style={styles.termsItem}>• Register the Music with any content identification system</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>COMPENSATION</Text>
          <Text style={styles.text}>
            Licensee has paid {formatCurrency(license.syncFee)} for this license, 
            which covers the specified usage rights for the duration of this agreement.
          </Text>
          <Text style={styles.text}>
            Payment Terms: {license.paymentTerms}
          </Text>
        </View>

        <View style={styles.highlight}>
          <Text style={styles.text}>
            <Text style={{ fontWeight: 'bold' }}>Important:</Text> This license is valid only for the 
            project described above. Any use outside the scope of this agreement requires a separate license.
          </Text>
        </View>

        <View style={styles.signature}>
          <Text style={styles.text}>
            Agreement accepted electronically by {license.clientName} on {formatDate(license.paymentDate)}
          </Text>
          <Text style={styles.text}>Licensee Email: {license.clientEmail}</Text>
          <Text style={styles.text}>
            Agreement executed by {license.producerName} on {formatDate(license.paymentDate)}
          </Text>
          <Text style={styles.text}>Licensor Email: {license.producerEmail}</Text>
        </View>

        <View style={styles.footer}>
          <Text>This agreement was generated automatically by MyBeatFi.io</Text>
          <Text>Generated on: {formatDate(new Date().toISOString())}</Text>
          <Text>For questions or support, contact: support@mybeatfi.io</Text>
        </View>
      </Page>
    </Document>
  );
} 