import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';

interface LicensePDFProps {
  license: {
    trackTitle: string;
    producerName: string;
    licenseeInfo: {
      name: string;
      email: string;
      company?: string;
    };
    licenseType: string;
    purchaseDate: string;
    price: number;
    // Sample clearance fields
    containsLoops?: boolean;
    containsSamples?: boolean;
    containsSpliceLoops?: boolean;
    samplesCleared?: boolean;
    sampleClearanceNotes?: string;
  };
  showCredits: boolean;
  acceptedDate: string;
  logoUrl?: string;
}

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 12,
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
  title: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: 'center',
    fontFamily: 'Helvetica-Bold'
  },
  trackTitle: {
    fontSize: 18,
    marginBottom: 10,
    textAlign: 'center',
    fontFamily: 'Helvetica-Bold'
  },
  section: {
    marginBottom: 20
  },
  sectionTitle: {
    fontSize: 14,
    marginBottom: 10,
    fontFamily: 'Helvetica-Bold'
  },
  text: {
    marginBottom: 8,
    lineHeight: 1.5
  },
  partyInfo: {
    marginBottom: 10,
    padding: 10,
    backgroundColor: '#f5f5f5'
  },
  list: {
    marginLeft: 20,
    marginBottom: 8
  },
  listItem: {
    marginBottom: 5
  },
  signature: {
    marginTop: 40,
    borderTop: 1,
    paddingTop: 20
  }
});

const getLicenseDurationInfo = (licenseType: string, purchaseDate: string) => {
  const purchase = new Date(purchaseDate);
  let durationText = '';
  let expirationDate: string;

  switch (licenseType) {
    case 'Single Track':
    case 'Gold Access':
      purchase.setFullYear(purchase.getFullYear() + 1);
      expirationDate = purchase.toLocaleDateString();
      durationText = '1 year';
      break;
    case 'Platinum Access':
      purchase.setFullYear(purchase.getFullYear() + 3);
      expirationDate = purchase.toLocaleDateString();
      durationText = '3 years';
      break;
    case 'Ultimate Access':
      expirationDate = 'Perpetual (No Expiration)';
      durationText = 'Unlimited';
      break;
    default:
      purchase.setFullYear(purchase.getFullYear() + 1);
      expirationDate = purchase.toLocaleDateString();
      durationText = '1 year';
  }

  return { expirationDate, durationText };
};

export function LicensePDF({ license, showCredits, acceptedDate, logoUrl }: LicensePDFProps) {
  const { expirationDate, durationText } = getLicenseDurationInfo(license.licenseType, license.purchaseDate);

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

          <Text style={styles.title}>Music Synchronization License Agreement</Text>

          <Text style={styles.trackTitle}>"{license.trackTitle}"</Text>

          <View style={styles.section}>
            <Text style={styles.text}>
              This Music Synchronization License Agreement ("Agreement") is entered into on{' '}
              {new Date(license.purchaseDate).toLocaleDateString()} by and between:
            </Text>

            <View style={styles.partyInfo}>
              <Text style={styles.text}>Licensor: MyBeatFi Sync</Text>
              <Text style={styles.text}>
                Licensee: {license.licenseeInfo.name}
                {license.licenseeInfo.company && ` (${license.licenseeInfo.company})`}
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>License Summary</Text>
            <Text style={styles.text}>Track: {license.trackTitle}</Text>
            <Text style={styles.text}>License Type: {license.licenseType}</Text>
            <Text style={styles.text}>Duration: {durationText}</Text>
            <Text style={styles.text}>Purchase Date: {new Date(license.purchaseDate).toLocaleDateString()}</Text>
            <Text style={styles.text}>Expiration Date: {expirationDate}</Text>
            <Text style={styles.text}>
              License Fee:{' '}
              {license.licenseType === 'Single Track'
                ? '$9.99 USD'
                : `Included with ${license.licenseType}`}
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>1. GRANT OF LICENSE</Text>
            <Text style={styles.text}>
              Licensor hereby grants Licensee a non-exclusive, non-transferable license to synchronize
              and use the musical composition and sound recording titled "{license.trackTitle}" ("Music")
              for commercial purposes worldwide, subject to the terms and conditions stated herein.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>2. PERMITTED USES</Text>
            <View style={styles.list}>
              <Text style={styles.listItem}>• Online content (social media, websites, podcasts)</Text>
              <Text style={styles.listItem}>• Advertisements and promotional videos</Text>
              <Text style={styles.listItem}>• Film, TV, and video productions</Text>
              <Text style={styles.listItem}>• Video games and apps</Text>
              <Text style={styles.listItem}>• Live events and public performances</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>3. RESTRICTIONS</Text>
            <View style={styles.list}>
              <Text style={styles.listItem}>• Resell, sublicense, or distribute the Music as a standalone product</Text>
              <Text style={styles.listItem}>• Use the Music in a manner that is defamatory, obscene, or illegal</Text>
              <Text style={styles.listItem}>• Register the Music with any content identification system</Text>
            </View>
          </View>

          {/* Sample Clearance Disclaimer */}
          {(license.containsLoops || license.containsSamples || license.containsSpliceLoops) && (
            <View style={[styles.section, { backgroundColor: '#fef3c7', padding: 10, borderRadius: 5 }]}>
              <Text style={[styles.sectionTitle, { color: '#92400e' }]}>⚠️ SAMPLE AND LOOP CLEARANCE NOTICE</Text>
              <Text style={[styles.text, { color: '#92400e', fontWeight: 'bold' }]}>
                IMPORTANT: This track contains {[
                  license.containsLoops && 'loops',
                  license.containsSamples && 'samples',
                  license.containsSpliceLoops && 'Splice loops'
                ].filter(Boolean).join(', ')} that may require additional rights clearance.
              </Text>
              <Text style={[styles.text, { color: '#92400e', fontWeight: 'bold' }]}>
                Usage of a track with uncleared samples or loops can result in copyright claims, strikes and even litigation. Please be sure to clear any uncleared samples and/or loops before use of this track. This license does not constitute clearance.
              </Text>
              {license.sampleClearanceNotes && (
                <View style={{ marginTop: 10, padding: 8, backgroundColor: '#fde68a', borderRadius: 3 }}>
                  <Text style={[styles.text, { color: '#92400e', fontWeight: 'bold', fontSize: 10 }]}>Sample Clearance Notes:</Text>
                  <Text style={[styles.text, { color: '#92400e', fontSize: 10 }]}>{license.sampleClearanceNotes}</Text>
                </View>
              )}
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>4. COMPENSATION</Text>
            <Text style={styles.text}>
              Licensee has paid the amount {' '}
              {license.licenseType === 'Single Track'
                ? '$9.99 USD to use this track'
                : `Included with ${license.licenseType} plan`}
            </Text>
          </View>

          {showCredits && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>5. CREDITS</Text>
              <Text style={styles.text}>
                Licensee has opted to provide credit in the following format:
                "Music by {license.producerName}"
              </Text>
            </View>
          )}

          <View style={styles.signature}>
            <Text style={styles.text}>
              Agreement accepted electronically by {license.licenseeInfo.name} on{' '}
              {new Date(acceptedDate).toLocaleDateString()}
            </Text>
            <Text style={styles.text}>Email: {license.licenseeInfo.email}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
