import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';

interface SyncProposalLicenseDetails {
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
}

interface SyncProposalLicensePDFProps {
  license: SyncProposalLicenseDetails;
  logoUrl?: string;
  showCredits?: boolean;
}

// Register fonts
Font.register({
  family: 'Helvetica',
  src: 'https://fonts.gstatic.com/s/helveticaneue/v70/1Ptsg8zYS_SKggPNyC0IT4ttDfA.ttf'
});

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 40,
    fontFamily: 'Helvetica',
    position: 'relative'
  },
  watermark: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.05,
    zIndex: 1
  },
  watermarkImage: {
    width: '100%',
    height: '100%',
    objectFit: 'contain'
  },
  content: {
    position: 'relative',
    zIndex: 2
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30
  },
  logo: {
    width: 120,
    height: 60,
    objectFit: 'contain'
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#1f2937'
  },
  section: {
    marginBottom: 20
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#1f2937'
  },
  text: {
    fontSize: 12,
    marginBottom: 8,
    lineHeight: 1.4,
    color: '#374151'
  },
  bold: {
    fontWeight: 'bold'
  },
  parties: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f9fafb',
    borderRadius: 5
  },
  summary: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f3f4f6',
    borderRadius: 5
  },
  terms: {
    marginBottom: 20
  },
  signature: {
    marginTop: 30,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#d1d5db'
  },
  signatureLine: {
    marginBottom: 5
  }
});

export const SyncProposalLicensePDF: React.FC<SyncProposalLicensePDFProps> = ({ license, logoUrl, showCredits = false }) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Watermark */}
        {logoUrl && (
          <View style={styles.watermark}>
            <Image src={logoUrl} style={styles.watermarkImage} />
          </View>
        )}
        
        {/* Content */}
        <View style={styles.content}>
          {/* Logo at top */}
          {logoUrl && (
            <View style={styles.logoContainer}>
              <Image src={logoUrl} style={styles.logo} />
            </View>
          )}

          <View style={styles.header}>
            <Text>Sync Proposal License Agreement</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.text}>
              This Sync Proposal License Agreement ("Agreement") is entered into on{' '}
              {new Date(license.paymentDate).toLocaleDateString()} by and between:
            </Text>
          </View>

          <View style={styles.parties}>
            <Text style={[styles.text, styles.bold]}>
              Licensor: {license.producerName} ({license.producerEmail})
            </Text>
            <Text style={[styles.text, styles.bold]}>
              Licensee: {license.clientName} ({license.clientEmail})
              {license.clientCompany && ` - ${license.clientCompany}`}
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>License Summary</Text>
            <View style={styles.summary}>
              <Text style={styles.text}>
                <Text style={styles.bold}>Track:</Text> {license.trackTitle}
              </Text>
              <Text style={styles.text}>
                <Text style={styles.bold}>Project:</Text> {license.projectDescription}
              </Text>
              <Text style={styles.text}>
                <Text style={styles.bold}>Duration:</Text> {license.duration}
              </Text>
              <Text style={styles.text}>
                <Text style={styles.bold}>Exclusive:</Text> {license.isExclusive ? 'Yes' : 'No'}
              </Text>
              <Text style={styles.text}>
                <Text style={styles.bold}>License Fee:</Text> ${license.syncFee.toFixed(2)}
              </Text>
              <Text style={styles.text}>
                <Text style={styles.bold}>Payment Terms:</Text> {license.paymentTerms.toUpperCase()}
              </Text>
              <Text style={styles.text}>
                <Text style={styles.bold}>Payment Date:</Text> {new Date(license.paymentDate).toLocaleDateString()}
              </Text>
              <Text style={styles.text}>
                <Text style={styles.bold}>Expiration Date:</Text> {new Date(license.expirationDate).toLocaleDateString()}
              </Text>
            </View>
          </View>

          <View style={styles.terms}>
            <Text style={styles.sectionTitle}>License Terms</Text>
            
            <Text style={styles.text}>
              <Text style={styles.bold}>1. Grant of License:</Text> Licensor grants Licensee a {license.isExclusive ? 'exclusive' : 'non-exclusive'} license to synchronize the musical composition "{license.trackTitle}" specifically for the project described as: "{license.projectDescription}".
            </Text>
            
            <Text style={styles.text}>
              <Text style={styles.bold}>2. Scope of Use:</Text> This license is limited to the specific project: "{license.projectDescription}". The composition may only be used in connection with this project and may not be used for any other purpose without additional licensing.
            </Text>
            
            <Text style={styles.text}>
              <Text style={styles.bold}>3. Territory:</Text> Worldwide
            </Text>
            
            <Text style={styles.text}>
              <Text style={styles.bold}>4. Term:</Text> {license.duration} from the date of payment
            </Text>
            
            <Text style={styles.text}>
              <Text style={styles.bold}>5. Payment:</Text> Licensee has paid the full license fee of ${license.syncFee.toFixed(2)} under {license.paymentTerms.toUpperCase()} terms.
            </Text>
            
            <Text style={styles.text}>
              <Text style={styles.bold}>6. Restrictions:</Text> Licensee may not:
            </Text>
            <Text style={styles.text}>• Use the composition for any project other than the specific project described above</Text>
            <Text style={styles.text}>• Use the composition in a manner that exceeds the scope of this license</Text>
            <Text style={styles.text}>• Transfer or sublicense this agreement without written consent</Text>
            <Text style={styles.text}>• Use the composition after the expiration date</Text>
            
            <Text style={styles.text}>
              <Text style={styles.bold}>7. Representations:</Text> Licensor represents that it has the right to grant this license.
            </Text>
            
            <Text style={styles.text}>
              <Text style={styles.bold}>8. Indemnification:</Text> Licensee agrees to indemnify Licensor against any claims arising from Licensee's use of the composition.
            </Text>
          </View>

          {showCredits && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>9. CREDITS</Text>
              <Text style={styles.text}>
                Licensee has opted to provide credit in the following format:
                "Music by {license.producerName}"
              </Text>
            </View>
          )}

          <View style={styles.signature}>
            <Text style={styles.signatureLine}>
              <Text style={styles.bold}>Licensor:</Text> {license.producerName}
            </Text>
            <Text style={styles.signatureLine}>
              <Text style={styles.bold}>Licensee:</Text> {license.clientName}
            </Text>
            <Text style={styles.signatureLine}>
              <Text style={styles.bold}>Date:</Text> {new Date(license.paymentDate).toLocaleDateString()}
            </Text>
            <Text style={styles.text}>
              Agreement accepted electronically by {license.producerName} on{' '}
              {new Date(license.paymentDate).toLocaleDateString()}
            </Text>
            <Text style={styles.text}>Email: {license.producerEmail}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}; 