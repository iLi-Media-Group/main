import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';

export function WelcomePDFTest() {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPDF = async (accountType: string) => {
    setLoading(true);
    setError(null);

    try {
      // Use the uploaded PDF from storage
      const pdfUrl = "https://yciqkebqlajqbpwlujma.supabase.co/storage/v1/object/public/welcome-guides/mybeatfiwelcomeguideprod.pdf";
      setPdfUrl(pdfUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load PDF');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Welcome Guide PDF Test
          </h1>
          <p className="text-gray-600 mb-6">
            Test the new uploaded PDF welcome guide for different account types.
          </p>
          
          <div className="flex gap-4 mb-6">
            <Button 
              onClick={() => loadPDF('producer')}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? 'Loading...' : 'Load Producer Guide'}
            </Button>
            
            <Button 
              onClick={() => loadPDF('artist_band')}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? 'Loading...' : 'Load Artist Guide'}
            </Button>
            
            <Button 
              onClick={() => loadPDF('rights_holder')}
              disabled={loading}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {loading ? 'Loading...' : 'Load Rights Holder Guide'}
            </Button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {pdfUrl && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                PDF Loaded Successfully
              </h2>
              <p className="text-gray-600 mb-4">
                The PDF is now loaded from the storage bucket. You can view it below or download it.
              </p>
              
              <div className="flex gap-4 mb-4">
                <a 
                  href={pdfUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Open PDF in New Tab
                </a>
                
                <a 
                  href={pdfUrl} 
                  download="MyBeatFi-Welcome-Guide.pdf"
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Download PDF
                </a>
              </div>
              
              <div className="border rounded-lg overflow-hidden">
                <iframe
                  src={pdfUrl}
                  width="100%"
                  height="600"
                  title="Welcome Guide PDF"
                  className="border-0"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
