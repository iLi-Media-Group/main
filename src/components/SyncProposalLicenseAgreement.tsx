import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Download } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
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
}

export function SyncProposalLicenseAgreement() {
  const { proposalId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [proposal, setProposal] = useState<SyncProposalLicenseDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatingPDF, setGeneratingPDF] = useState(false);

  useEffect(() => {
    const fetchProposalDetails = async () => {
      if (!user || !proposalId) return;

      try {
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
            track:tracks!inner (
              id,
              title,
              producer:profiles!tracks_track_producer_id_fkey (
                id,
                first_name,
                last_name,
                email
              )
            ),
            client:profiles!sync_proposals_client_id_fkey (
              id,
              first_name,
              last_name,
              email,
              company_name
            )
          `)
          .eq('id', proposalId)
          .single();

        if (error) throw error;

        if (data) {
          const amount = data.final_amount || data.negotiated_amount || data.sync_fee || 0;
          const paymentTerms = data.final_payment_terms || data.negotiated_payment_terms || data.payment_terms || 'immediate';
          const paymentDate = data.payment_date || data.client_accepted_at || data.created_at;
          
          setProposal({
            trackTitle: data.track?.title || 'Unknown Track',
            producerName: `${data.track?.producer?.first_name || ''} ${data.track?.producer?.last_name || ''}`.trim(),
            producerEmail: data.track?.producer?.email || '',
            clientName: `${data.client?.first_name || ''} ${data.client?.last_name || ''}`.trim(),
            clientEmail: data.client?.email || '',
            clientCompany: data.client?.company_name,
            projectDescription: data.project_type || 'Sync project',
            duration: data.duration || '1 year',
            isExclusive: data.is_exclusive || false,
            syncFee: amount,
            paymentDate: paymentDate,
            expirationDate: calculateExpirationDate(paymentDate, data.duration || '1 year'),
            paymentTerms: paymentTerms
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
    
    switch (duration.toLowerCase()) {
      case 'perpetual':
      case 'forever':
        date.setFullYear(date.getFullYear() + 100); // Set to 100 years for "perpetual"
        break;
      case '2 years':
        date.setFullYear(date.getFullYear() + 2);
        break;
      case '3 years':
        date.setFullYear(date.getFullYear() + 3);
        break;
      case '5 years':
        date.setFullYear(date.getFullYear() + 5);
        break;
      default:
        // Default to 1 year
        date.setFullYear(date.getFullYear() + 1);
    }
    
    return date.toISOString();
  };

  const generatePDF = async () => {
    if (!proposal) return;

    try {
      setGeneratingPDF(true);

      // Generate PDF document
      const pdfDoc = await pdf(
        <SyncProposalLicensePDF
          license={proposal}
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
            disabled={generatingPDF}
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
            <p><strong>1. Grant of License:</strong> Licensor grants Licensee a {proposal.isExclusive ? 'exclusive' : 'non-exclusive'} license to synchronize the musical composition "{proposal.trackTitle}" in audiovisual works.</p>
            
            <p><strong>2. Scope of Use:</strong> This license covers synchronization in {proposal.projectDescription} for the duration specified above.</p>
            
            <p><strong>3. Territory:</strong> Worldwide</p>
            
            <p><strong>4. Term:</strong> {proposal.duration} from the date of payment</p>
            
            <p><strong>5. Payment:</strong> Licensee has paid the full license fee of ${proposal.syncFee.toFixed(2)} under {proposal.paymentTerms.toUpperCase()} terms.</p>
            
            <p><strong>6. Restrictions:</strong> Licensee may not:</p>
            <ul className="list-disc list-inside ml-4">
              <li>Use the composition in a manner that exceeds the scope of this license</li>
              <li>Transfer or sublicense this agreement without written consent</li>
              <li>Use the composition after the expiration date</li>
            </ul>
            
            <p><strong>7. Representations:</strong> Licensor represents that it has the right to grant this license.</p>
            
            <p><strong>8. Indemnification:</strong> Licensee agrees to indemnify Licensor against any claims arising from Licensee's use of the composition.</p>
          </div>

          <div className="mt-8 p-4 border-t border-gray-600">
            <p><strong>Licensor:</strong> {proposal.producerName}</p>
            <p><strong>Licensee:</strong> {proposal.clientName}</p>
            <p><strong>Date:</strong> {new Date(proposal.paymentDate).toLocaleDateString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
} 