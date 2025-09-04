import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';

export function WelcomePDFTest() {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generatePDF = async (accountType: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // Call the Supabase function to generate the PDF
      const response = await fetch('/api/test-welcome-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: 'Test User',
          accountType: accountType
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
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
