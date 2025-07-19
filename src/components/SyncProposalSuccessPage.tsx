import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, ArrowRight, Music, Calendar, DollarSign, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface SyncProposalData {
  id: string;
  track: {
    title: string;
    producer: {
      first_name: string;
      last_name: string;
    };
  };
  sync_fee: number;
  final_amount?: number;
  negotiated_amount?: number;
  payment_terms: string;
  final_payment_terms?: string;
  negotiated_payment_terms?: string;
  payment_date: string;
  project_type: string;
  duration: string;
  is_exclusive: boolean;
}

export function SyncProposalSuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [proposalData, setProposalData] = useState<SyncProposalData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [licenseUrl, setLicenseUrl] = useState<string | null>(null);
  const [downloadingLicense, setDownloadingLicense] = useState(false);

  const sessionId = searchParams.get('session_id');
  const proposalId = searchParams.get('proposal_id');

  useEffect(() => {
    const fetchProposalData = async () => {
      try {
        if (!sessionId && !proposalId) {
          navigate('/dashboard');
          return;
        }

        // If we have a session ID, we need to find the proposal from the session
        let targetProposalId = proposalId;
        
        if (sessionId && !proposalId) {
          // Try to find the proposal from the session metadata
          const { data: sessionData, error: sessionError } = await supabase
            .from('stripe_checkout_sessions')
            .select('metadata')
            .eq('session_id', sessionId)
            .single();
            
          if (sessionData?.metadata?.proposal_id) {
            targetProposalId = sessionData.metadata.proposal_id;
          }
        }

        if (!targetProposalId) {
          setError('Unable to find proposal information');
          setLoading(false);
          return;
        }

        // Fetch the sync proposal data
        const { data: proposal, error: proposalError } = await supabase
          .from('sync_proposals')
          .select(`
            id,
            sync_fee,
            final_amount,
            negotiated_amount,
            payment_terms,
            final_payment_terms,
            negotiated_payment_terms,
            payment_date,
            project_type,
            duration,
            is_exclusive,
            license_url,
            track:tracks!inner (
              title,
              producer:profiles!track_producer_id (
                first_name,
                last_name
              )
            )
          `)
          .eq('id', targetProposalId)
          .single();

        if (proposalError || !proposal) {
          console.error('Error fetching proposal:', proposalError);
          setError('Unable to load proposal details');
          setLoading(false);
          return;
        }

        // Debug the data structure
        console.log('Raw proposal data:', proposal);
        console.log('Track data:', proposal.track);
        console.log('Producer data:', proposal.track?.[0]?.producer);
        console.log('Sync fee:', proposal.sync_fee);
        console.log('Final amount:', proposal.final_amount);
        console.log('Negotiated amount:', proposal.negotiated_amount);
        console.log('Payment terms:', proposal.payment_terms);
        console.log('Final payment terms:', proposal.final_payment_terms);
        console.log('Negotiated payment terms:', proposal.negotiated_payment_terms);

        // Fix track data structure (Supabase returns arrays for joins)
        let trackObj: any = proposal.track;
        if (Array.isArray(trackObj)) trackObj = trackObj[0] || {};
        let producerObj: any = trackObj.producer;
        if (Array.isArray(producerObj)) producerObj = producerObj[0] || {};
        // Defensive: if still missing, fallback to empty object
        if (!trackObj) trackObj = {};
        if (!producerObj) producerObj = {};
        const normalizedTrack = {
          title: trackObj.title ?? 'Unknown Track',
          producer: {
            first_name: producerObj.first_name ?? 'Unknown',
            last_name: producerObj.last_name ?? 'Producer'
          }
        };
        
        // Determine the correct payment terms with better fallback logic
        let paymentTerms = proposal.final_payment_terms || proposal.negotiated_payment_terms || proposal.payment_terms;
        if (!paymentTerms || paymentTerms === 'n/a' || paymentTerms === 'N/A') {
          paymentTerms = 'immediate'; // Default fallback
        }
        
        // Determine the correct sync fee with better fallback logic
        let syncFee = proposal.final_amount || proposal.negotiated_amount || proposal.sync_fee;
        if (!syncFee || syncFee === 0 || isNaN(syncFee)) {
          syncFee = proposal.sync_fee || 0; // Use original sync fee as fallback
        }
        
        const proposalData: SyncProposalData = {
          ...proposal,
          track: normalizedTrack,
          sync_fee: syncFee,
          payment_terms: paymentTerms,
          is_exclusive: proposal.is_exclusive
        };

        console.log('Processed proposal data:', proposalData);
        console.log('Final sync fee:', proposalData.sync_fee);
        console.log('Final payment terms:', proposalData.payment_terms);

        setProposalData(proposalData);

        // Check if license PDF has been generated
        if (proposal.license_url) {
          setLicenseUrl(proposal.license_url);
        } else {
          // Try to generate license if it doesn't exist
          try {
            const { data: { session } } = await supabase.auth.getSession();
            const accessToken = session?.access_token;
            const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/handle-license-agreement`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                proposal_id: targetProposalId
              })
            });

            if (response.ok) {
              const result = await response.json();
              if (result.licenseUrl) {
                setLicenseUrl(result.licenseUrl);
              }
            }
          } catch (licenseError) {
            console.error('Error generating license:', licenseError);
          }
        }
      } catch (error) {
        console.error('Error fetching proposal data:', error);
        setError('An error occurred while loading your proposal');
      } finally {
        setLoading(false);
      }
    };

    fetchProposalData();
  }, [sessionId, proposalId, navigate]);

  const formatPaymentTerms = (terms: string) => {
    if (!terms || terms === 'n/a' || terms === 'N/A') {
      return 'Immediate';
    }
    
    switch (terms.toLowerCase()) {
      case 'immediate': return 'Immediate';
      case 'net30': return 'Net 30 days';
      case 'net60': return 'Net 60 days';
      case 'net90': return 'Net 90 days';
      default: return terms;
    }
  };

  const formatLicenseLength = (duration: string) => {
    switch (duration) {
      case '1_year': return '1 Year';
      case '2_years': return '2 Years';
      case '3_years': return '3 Years';
      case '5_years': return '5 Years';
      case 'perpetual': return 'Perpetual';
      default: return duration.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  const formatProjectType = (type: string) => {
    switch (type) {
      case 'tv_show': return 'TV Show';
      case 'movie': return 'Movie';
      case 'commercial': return 'Commercial';
      case 'podcast': return 'Podcast';
      case 'youtube': return 'YouTube Video';
      case 'social_media': return 'Social Media';
      default: return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  const handleDownloadLicense = async () => {
    if (!licenseUrl) return;
    
    setDownloadingLicense(true);
    try {
      const response = await fetch(licenseUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${proposalData?.track.title} - Sync License Agreement.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading license:', error);
    } finally {
      setDownloadingLicense(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-red-500/20 p-8 text-center">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
                <FileText className="w-8 h-8 text-red-400" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-white mb-4">Error Loading Proposal</h1>
            <p className="text-xl text-gray-300 mb-8">{error}</p>
            <Link
              to="/dashboard"
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center mx-auto w-fit"
            >
              Go to Dashboard
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!proposalData) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-yellow-500/20 p-8 text-center">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center">
                <FileText className="w-8 h-8 text-yellow-400" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-white mb-4">Proposal Not Found</h1>
            <p className="text-xl text-gray-300 mb-8">Unable to find the sync proposal details.</p>
            <Link
              to="/dashboard"
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center mx-auto w-fit"
            >
              Go to Dashboard
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-green-500/20 p-8 text-center">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-white mb-4">
            Thank You!
          </h1>
          
          <p className="text-xl text-gray-300 mb-8">
            Your payment has been successfully completed and your sync license is now active.
          </p>

          {/* Payment Summary Section */}
          <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-lg p-6 mb-8 border border-green-500/20">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-white">Payment Summary</h2>
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300 text-lg">Amount Paid:</span>
                  <span className="text-green-400 font-bold text-2xl">
                    ${(proposalData.final_amount || proposalData.negotiated_amount || proposalData.sync_fee || 0).toFixed(2)}
                  </span>
                </div>
              </div>
              
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300 text-lg">Payment Terms:</span>
                  <span className="text-blue-400 font-bold text-xl">
                    {formatPaymentTerms(proposalData.payment_terms)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/5 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">License Details</h2>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <Music className="w-5 h-5 text-purple-400 mr-2" />
                  <span className="text-white">Track:</span>
                </div>
                <span className="text-white font-medium">
                  {proposalData.track.title}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <FileText className="w-5 h-5 text-purple-400 mr-2" />
                  <span className="text-white">Producer:</span>
                </div>
                <span className="text-white font-medium">
                  {proposalData.track.producer.first_name} {proposalData.track.producer.last_name}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <Calendar className="w-5 h-5 text-purple-400 mr-2" />
                  <span className="text-white">License Length:</span>
                </div>
                <span className="text-white font-medium">
                  {formatLicenseLength(proposalData.duration)}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <FileText className="w-5 h-5 text-purple-400 mr-2" />
                  <span className="text-white">Project Type:</span>
                </div>
                <span className="text-white font-medium text-left">
                  {formatProjectType(proposalData.project_type)}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <DollarSign className="w-5 h-5 text-purple-400 mr-2" />
                  <span className="text-white">Amount Paid:</span>
                </div>
                <span className="text-green-400 font-semibold">
                  ${(proposalData.final_amount || proposalData.negotiated_amount || proposalData.sync_fee || 0).toFixed(2)}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <Calendar className="w-5 h-5 text-purple-400 mr-2" />
                  <span className="text-white">Payment Terms:</span>
                </div>
                <span className="text-white font-medium">
                  {formatPaymentTerms(proposalData.payment_terms)}
                </span>
              </div>
              
              {proposalData.is_exclusive && (
                <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <p className="text-blue-400 text-sm">
                    <strong>Exclusive License:</strong> This track is now exclusively licensed to your project.
                  </p>
                </div>
              )}
              
              <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                <p className="text-green-400 text-sm">
                  Your sync license has been activated and you can now use this track in your project.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center space-y-4">
            {licenseUrl && (
              <button
                onClick={handleDownloadLicense}
                disabled={downloadingLicense}
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold rounded-lg transition-all shadow-lg shadow-green-500/25 flex items-center disabled:opacity-50"
              >
                <FileText className="w-5 h-5 mr-2" />
                {downloadingLicense ? 'Downloading...' : 'Download License PDF'}
              </button>
            )}
            
            <Link
              to="/dashboard"
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg transition-all shadow-lg shadow-blue-500/25 flex items-center"
            >
              Go to Dashboard
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>

            <Link
              to="/catalog"
              className="text-blue-400 hover:text-blue-300 transition-colors"
            >
              Browse More Music
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 