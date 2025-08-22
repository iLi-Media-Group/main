import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Download } from 'lucide-react';
import { useUnifiedAuth } from '../contexts/UnifiedAuthContext';
import { useSiteBranding } from '../contexts/SiteBrandingContext';
import { supabase } from '../lib/supabase';
import { pdf } from '@react-pdf/renderer';
import { SyncProposalLicensePDF } from './SyncProposalLicensePDF';

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
  // Sample clearance fields
  containsLoops?: boolean;
  containsSamples?: boolean;
  containsSpliceLoops?: boolean;
  samplesCleared?: boolean;
  sampleClearanceNotes?: string;
}

export function SyncProposalLicenseAgreement() {
  const { proposalId } = useParams();
  const { user } = useUnifiedAuth();
  const navigate = useNavigate();
  const [proposal, setProposal] = useState<SyncProposalLicenseDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [showCreditOption, setShowCreditOption] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const { logoUrl } = useSiteBranding();

  useEffect(() => {
    const fetchProposalDetails = async () => {
      if (!user || !proposalId) return;

      try {
        console.log('Fetching sync proposal with ID:', proposalId);
        
        const { data, error } = await supabase
          .from('sync_proposals')
          .select(`
            id,
            sync_fee,
            final_amount,
            negotiated_amount,
            payment_terms,
            final_payment_terms,
            negotiated_payment_terms,
            is_exclusive,
            project_type,
            duration,
            payment_date,
            client_accepted_at,
            created_at,
            track:tracks(
              id,
              title,
              contains_loops,
              contains_samples,
              contains_splice_loops,
              samples_cleared,
              sample_clearance_notes,
              producer:profiles!tracks_track_producer_id_fkey(
                id,
                first_name,
                last_name,
                email
              )
            ),
            client:profiles!sync_proposals_client_id_fkey(
              id,
              first_name,
              last_name,
              email,
              company_name
            )
          `)
          .eq('id', proposalId)
          .single();

        if (error) {
          console.error('Supabase error:', error);
          throw error;
        }
        
        console.log('Sync proposal data:', data);

        if (data) {
          const amount = data.final_amount || data.negotiated_amount || data.sync_fee || 0;
          const paymentTerms = data.final_payment_terms || data.negotiated_payment_terms || data.payment_terms || 'immediate';
          const paymentDate = data.payment_date || data.client_accepted_at || data.created_at;
          const duration = data.duration || '1 year';
          
          console.log('Payment date calculation:', {
            payment_date: data.payment_date,
            client_accepted_at: data.client_accepted_at,
            created_at: data.created_at,
            final_payment_date: paymentDate
          });
          
          console.log('Duration calculation:', {
            duration: data.duration,
            final_duration: duration
          });
          
          // Create a more detailed project description
          let detailedProjectDescription = data.project_type || 'Sync project';
          
          // If we have additional project details, include them
          if (data.project_type) {
            detailedProjectDescription = data.project_type;
          }
          
          setProposal({
            trackTitle: data.track?.title || 'Unknown Track',
            producerName: `${data.track?.producer?.first_name || ''} ${data.track?.producer?.last_name || ''}`.trim(),
            producerEmail: data.track?.producer?.email || '',
            clientName: `${data.client?.first_name || ''} ${data.client?.last_name || ''}`.trim(),
            clientEmail: data.client?.email || '',
            clientCompany: data.client?.company_name,
            projectDescription: detailedProjectDescription,
            duration: duration,
            isExclusive: data.is_exclusive || false,
            syncFee: amount,
            paymentDate: paymentDate,
            expirationDate: calculateExpirationDate(paymentDate, duration),
            paymentTerms: paymentTerms,
            // Sample clearance fields
            containsLoops: data.track?.contains_loops || false,
            containsSamples: data.track?.contains_samples || false,
            containsSpliceLoops: data.track?.contains_splice_loops || false,
            samplesCleared: data.track?.samples_cleared || false,
            sampleClearanceNotes: data.track?.sample_clearance_notes || null
          });
          
          console.log('Expiration date calculation:', {
            paymentDate: paymentDate,
            duration: duration,
            expirationDate: calculateExpirationDate(paymentDate, duration)
          });
        }
      } catch (err) {
        console.error('Error fetching sync proposal:', err);
        setError('Failed to load proposal details');
      } finally {
        setLoading(false);
      }
    };

    fetchProposalDetails();
  }, [user, proposalId]);

  const calculateExpirationDate = (paymentDate: string, duration: string): string => {
    const date = new Date(paymentDate);
    
    // Handle different duration formats
    const durationLower = duration.toLowerCase().trim();
    
    switch (durationLower) {
      case 'perpetual':
      case 'forever':
        date.setFullYear(date.getFullYear() + 100); // Set to 100 years for "perpetual"
        break;
      case '1 year':
      case '1yr':
      case 'one year':
        date.setFullYear(date.getFullYear() + 1);
        break;
      case '2 years':
      case '2yr':
      case 'two years':
        date.setFullYear(date.getFullYear() + 2);
        break;
      case '3 years':
      case '3yr':
      case 'three years':
        date.setFullYear(date.getFullYear() + 3);
        break;
      case '5 years':
      case '5yr':
      case 'five years':
        date.setFullYear(date.getFullYear() + 5);
        break;
      case '3.5 years':
      case '3.5yr':
        date.setFullYear(date.getFullYear() + 3);
        date.setMonth(date.getMonth() + 6); // Add 6 months for the 0.5
        break;
      case '2.5 years':
      case '2.5yr':
        date.setFullYear(date.getFullYear() + 2);
        date.setMonth(date.getMonth() + 6); // Add 6 months for the 0.5
        break;
      case '1.5 years':
      case '1.5yr':
        date.setFullYear(date.getFullYear() + 1);
        date.setMonth(date.getMonth() + 6); // Add 6 months for the 0.5
        break;
      case '6 months':
      case '6mo':
      case 'half year':
        date.setMonth(date.getMonth() + 6);
        break;
      case '1 month':
      case '1mo':
      case 'one month':
        date.setMonth(date.getMonth() + 1);
        break;
      default:
        // Try to parse numeric values like "2 years", "1 year", etc.
        const yearMatch = durationLower.match(/(\d+(?:\.\d+)?)\s*year/);
        const monthMatch = durationLower.match(/(\d+(?:\.\d+)?)\s*month/);
        
        if (yearMatch) {
          const years = parseFloat(yearMatch[1]);
          date.setFullYear(date.getFullYear() + Math.floor(years));
          // Add the decimal part as months
          const decimalPart = years - Math.floor(years);
          if (decimalPart > 0) {
            const months = Math.round(decimalPart * 12);
            date.setMonth(date.getMonth() + months);
          }
        } else if (monthMatch) {
          const months = parseFloat(monthMatch[1]);
          date.setMonth(date.getMonth() + Math.round(months));
        } else {
          // Default to 1 year if we can't parse the duration
          date.setFullYear(date.getFullYear() + 1);
        }
    }
    
    return date.toISOString();
  };

  const generatePDF = async () => {
    if (!proposal || !acceptedTerms) return;

    try {
      setGeneratingPDF(true);

      // Generate PDF document
      const pdfDoc = await pdf(
        <SyncProposalLicensePDF
          license={proposal}
          logoUrl={logoUrl}
          showCredits={showCreditOption}
        />
      ).toBlob();

      // Download PDF
      const url = window.URL.createObjectURL(pdfDoc);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${proposal.trackTitle} - Sync License Agreement.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      // Navigate to dashboard
      navigate('/dashboard');
    } catch (err) {
      console.error('Error generating sync proposal license agreement:', err);
      setError('Failed to generate license agreement');
    } finally {
      setGeneratingPDF(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !proposal) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          <p className="text-red-400 text-center">{error || 'Proposal not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-blue-500/20 p-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-white">Sync Proposal License Agreement</h1>
          <button
            onClick={generatePDF}
            disabled={!acceptedTerms || generatingPDF}
            className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            <Download className="w-5 h-5 mr-2" />
            {generatingPDF ? 'Generating...' : 'Download PDF'}
          </button>
        </div>

        <div className="prose prose-invert max-w-none">
          <p className="text-gray-300">
            This Sync Proposal License Agreement ("Agreement") is entered into on{' '}
            {new Date(proposal.paymentDate).toLocaleDateString()} by and between:
          </p>

          <div className="bg-white/5 rounded-lg p-4 my-6">
            <p className="mb-2">
              <strong>Licensor:</strong> {proposal.producerName} ({proposal.producerEmail})
            </p>
            <p>
              <strong>Licensee:</strong> {proposal.clientName} ({proposal.clientEmail})
              {proposal.clientCompany && ` - ${proposal.clientCompany}`}
            </p>
          </div>

          <h2 className="text-xl font-bold text-white mt-8">License Summary</h2>
          <div className="bg-white/5 rounded-lg p-4 my-4">
            <p><strong>Track:</strong> {proposal.trackTitle}</p>
            <p><strong>Project:</strong> {proposal.projectDescription}</p>
            <p><strong>Duration:</strong> {proposal.duration}</p>
            <p><strong>Exclusive:</strong> {proposal.isExclusive ? 'Yes' : 'No'}</p>
            <p><strong>License Fee:</strong> ${proposal.syncFee.toFixed(2)}</p>
            <p><strong>Payment Terms:</strong> {proposal.paymentTerms.toUpperCase()}</p>
            <p><strong>Payment Date:</strong> {new Date(proposal.paymentDate).toLocaleDateString()}</p>
            <p><strong>Expiration Date:</strong> {new Date(proposal.expirationDate).toLocaleDateString()}</p>
          </div>

          <h2 className="text-xl font-bold text-white mt-8">License Terms</h2>
          <div className="bg-white/5 rounded-lg p-4 my-4">
            <p><strong>1. Grant of License:</strong> Licensor grants Licensee a {proposal.isExclusive ? 'exclusive' : 'non-exclusive'} license to synchronize the musical composition "{proposal.trackTitle}" specifically for the project described as: "{proposal.projectDescription}".</p>
            
            <p><strong>2. Scope of Use:</strong> This license is limited to the specific project: "{proposal.projectDescription}". The composition may only be used in connection with this project and may not be used for any other purpose without additional licensing.</p>
            
            <p><strong>3. Territory:</strong> Worldwide</p>
            
            <p><strong>4. Term:</strong> {proposal.duration} from the date of payment</p>
            
            <p><strong>5. Payment:</strong> Licensee has paid the full license fee of ${proposal.syncFee.toFixed(2)} under {proposal.paymentTerms.toUpperCase()} terms.</p>
            
            <p><strong>6. Restrictions:</strong> Licensee may not:</p>
            <ul className="list-disc list-inside ml-4">
              <li>Use the composition for any project other than the specific project described above</li>
              <li>Use the composition in a manner that exceeds the scope of this license</li>
              <li>Transfer or sublicense this agreement without written consent</li>
              <li>Use the composition after the expiration date</li>
            </ul>
            
            <p><strong>7. Representations:</strong> Licensor represents that it has the right to grant this license.</p>
            
            <p><strong>8. Indemnification:</strong> Licensee agrees to indemnify Licensor against any claims arising from Licensee's use of the composition.</p>
          </div>

          {/* Sample Clearance Disclaimer */}
          {(proposal.containsLoops || proposal.containsSamples || proposal.containsSpliceLoops) && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-6 my-8">
              <h2 className="text-xl font-bold text-yellow-300 mb-4">⚠️ SAMPLE AND LOOP CLEARANCE NOTICE</h2>
              <p className="text-yellow-200 mb-4">
                <strong>IMPORTANT:</strong> This track contains {[
                  proposal.containsLoops && 'loops',
                  proposal.containsSamples && 'samples',
                  proposal.containsSpliceLoops && 'Splice loops'
                ].filter(Boolean).join(', ')} that may require additional rights clearance.
              </p>
              <p className="text-yellow-200 mb-4">
                <strong>Usage of a track with uncleared samples or loops can result in copyright claims, strikes and even litigation. Please be sure to clear any uncleared samples and/or loops before use of this track. This license does not constitute clearance.</strong>
              </p>
              {proposal.sampleClearanceNotes && (
                <div className="mt-4 p-3 bg-yellow-500/20 rounded-lg">
                  <h3 className="text-sm font-medium text-yellow-300 mb-2">Sample Clearance Notes:</h3>
                  <p className="text-sm text-yellow-200 whitespace-pre-wrap">{proposal.sampleClearanceNotes}</p>
                </div>
              )}
            </div>
          )}

          <div className="mt-8 p-4 border-t border-gray-600">
            <p><strong>Licensor:</strong> {proposal.producerName}</p>
            <p><strong>Licensee:</strong> {proposal.clientName}</p>
            <p><strong>Date:</strong> {new Date(proposal.paymentDate).toLocaleDateString()}</p>
          </div>

          <div className="bg-white/5 rounded-lg p-6 my-8">
            <h2 className="text-xl font-bold text-white mb-4">License Acceptance</h2>
            
            <label className="flex items-center space-x-3 mb-6">
              <input
                type="checkbox"
                checked={showCreditOption}
                onChange={(e) => setShowCreditOption(e.target.checked)}
                className="rounded border-gray-600 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-gray-300">
                I would like to provide credit to the producer in my productions
              </span>
            </label>

            {showCreditOption && (
              <div className="mb-6 p-4 bg-black/20 rounded-lg">
                <p className="text-gray-300">
                  Suggested credit format: "Music by {proposal.producerName}"
                </p>
              </div>
            )}

            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="rounded border-gray-600 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-gray-300">
                I have read and agree to the terms of this license agreement
              </span>
            </label>

            <div className="mt-6 flex justify-end space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={generatePDF}
                disabled={!acceptedTerms || generatingPDF}
                className="flex items-center px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-5 h-5 mr-2" />
                {generatingPDF ? 'Generating...' : 'Download Agreement'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 