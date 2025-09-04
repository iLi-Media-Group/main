import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import jsPDF from 'jspdf';

export function WelcomePDFTest() {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generatePDF = async (accountType: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // Create PDF locally using jsPDF
      const doc = new jsPDF();
      
      // Set margins
      const leftMargin = 20;
      const rightMargin = 20;
      const pageWidth = doc.internal.pageSize.getWidth();
      const availableWidth = pageWidth - leftMargin - rightMargin;
      
      let y = 20;
      
      // Helper function to add text with wrapping
      const addText = (text: string, options: { size?: number; bold?: boolean } = {}) => {
        const { size = 12, bold = false } = options;
        
        if (y > doc.internal.pageSize.getHeight() - 20) {
          doc.addPage();
          y = 20;
        }
        
        // Check if text needs wrapping
        const textWidth = doc.getTextWidth(text);
        if (textWidth <= availableWidth) {
          doc.setFontSize(size);
          doc.setFont('helvetica', bold ? 'bold' : 'normal');
          doc.text(text, leftMargin, y);
          y += size + 2;
        } else {
          // Wrap text
          const lines = doc.splitTextToSize(text, availableWidth);
          doc.setFontSize(size);
          doc.setFont('helvetica', bold ? 'bold' : 'normal');
          doc.text(lines, leftMargin, y);
          y += (size + 2) * lines.length;
        }
      };
      
      // Add content based on account type
      if (accountType === 'client') {
        addText('Welcome to MyBeatFi!', { size: 18, bold: true });
        addText('Thank you for joining the MyBeatFi community. We built MyBeatFi to make music licensing simple, legal, and inspiring for filmmakers, advertisers, podcasters, and creators.');
        
        addText('Quick Start Checklist', { size: 14, bold: true });
        addText('1. Browse the catalog and explore music by genre or mood.');
        addText('2. Favorite tracks you love for easy access later.');
        addText('3. Build a playlist to organize tracks for a project.');
        addText('4. License a track instantly or submit a Sync Proposal.');
        addText('5. Use your dashboard to track activity and spending.');
        
        addText('Licensing Options', { size: 14, bold: true });
        addText('• Instant Licensing – License a track in just a few clicks. Perfect for quick projects like YouTube videos or podcasts.');
        addText('• Sync Proposals – Some tracks are "Sync Only." Submit your project, chat with the producer, negotiate, and license securely.');
        addText('• Custom Sync Requests – Need something unique? Post a request and get custom tracks from producers worldwide.');
      } else if (accountType === 'producer') {
        addText('Welcome to MyBeatFi Producer Network', { size: 18, bold: true });
        addText('You\'re now part of a global community of music creators. MyBeatFi helps you upload, protect, and license your music worldwide.');
        
        addText('Quick Start Checklist', { size: 14, bold: true });
        addText('1. Upload your first track (General Library or Sync-Only).');
        addText('2. Complete your profile with a photo and bio.');
        addText('3. Explore your dashboard.');
        addText('4. Create a playlist to showcase your work.');
        addText('5. Submit to a Custom Sync Request.');
      } else if (accountType === 'rights_holder') {
        addText('Welcome to MyBeatFi Rights Holder Network', { size: 18, bold: true });
        addText('As a label, publisher, or catalog manager, MyBeatFi helps you manage catalogs, oversee your artist roster, and track revenues with full transparency.');
        
        addText('Quick Start Checklist', { size: 14, bold: true });
        addText('1. Upload your catalog with metadata and ownership details.');
        addText('2. Add roster artists and assign tracks.');
        addText('3. Set licensing preferences (instant, sync-only, custom).');
        addText('4. Track artist revenues and catalog performance.');
        addText('5. Generate reports for accounting and audits.');
      }
      
      // Generate PDF blob
      const pdfBlob = doc.output('blob');
      const url = URL.createObjectURL(pdfBlob);
      setPdfUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate PDF');
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = () => {
    if (pdfUrl) {
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = 'welcome-guide.pdf';
      link.click();
    }
  };

  useEffect(() => {
    // Cleanup URL object when component unmounts
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-white mb-6">Welcome Guide PDF Test</h1>
      
      <div className="mb-6 space-y-4">
        <p className="text-gray-300">
          Test the Welcome guide PDF generation with different account types to see the text wrapping fix.
        </p>
        
        <div className="flex flex-wrap gap-4">
          <Button
            onClick={() => generatePDF('client')}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? 'Generating...' : 'Generate Client PDF'}
          </Button>
          
          <Button
            onClick={() => generatePDF('producer')}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700"
          >
            {loading ? 'Generating...' : 'Generate Producer PDF'}
          </Button>
          
          <Button
            onClick={() => generatePDF('rights_holder')}
            disabled={loading}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {loading ? 'Generating...' : 'Generate Rights Holder PDF'}
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {pdfUrl && (
        <div className="space-y-4">
          <div className="flex gap-4">
            <Button onClick={downloadPDF} className="bg-green-600 hover:bg-green-700">
              Download PDF
            </Button>
            <Button 
              onClick={() => setPdfUrl(null)} 
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              Clear
            </Button>
          </div>
          
          <div className="border border-gray-600 rounded-lg overflow-hidden">
            <iframe
              src={pdfUrl}
              width="100%"
              height="800"
              title="Welcome Guide PDF"
              className="bg-white"
            />
          </div>
        </div>
      )}
    </div>
  );
}
