import React, { useState } from 'react';
import { Info, Check, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { createCheckoutSession } from '../lib/stripe';
import { PRODUCTS } from '../stripe-config';
import { useEffect } from 'react';
import { supabase } from '../lib/supabase';

// Custom hook to fetch sync proposal details by trackId
function useSyncProposalDetails(trackId?: string) {
  const [proposal, setProposal] = React.useState<any>(null);
  useEffect(() => {
    if (!trackId) return;
    (async () => {
      const { data, error } = await supabase
        .from('sync_proposals')
        .select('permitted_use, project')
        .eq('track_id', trackId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      if (!error && data) setProposal(data);
    })();
  }, [trackId]);
  return proposal;
}

interface LicenseTermsSummaryProps {
  licenseType: 'Single Track' | 'Gold Access' | 'Platinum Access' | 'Ultimate Access';
  onAccept: () => void;
  trackId?: string;
}

export function LicenseTermsSummary({ licenseType, onAccept, trackId }: LicenseTermsSummaryProps) {
  const { membershipPlan } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAccept = async () => {
    // If user has a subscription plan, proceed with normal flow
    if (membershipPlan && membershipPlan !== 'Single Track') {
      onAccept();
      return;
    }

    // For Single Track users, initiate Stripe checkout
    if (trackId) {
      try {
        setLoading(true);
        setError(null);
        
        // Find the Single Track product
        const singleTrackProduct = PRODUCTS.find(p => p.name === 'Single Track');
        
        if (!singleTrackProduct) {
          throw new Error('Single Track product not found');
        }
        const checkoutUrl = await createCheckoutSession(
          singleTrackProduct.priceId, 
          singleTrackProduct.mode,
          trackId
        );
        
        // Redirect to checkout
        window.location.href = checkoutUrl;
      } catch (err) {
        console.error('Error creating checkout session:', err);
        setError(err instanceof Error ? err.message : 'Failed to create checkout session');
      } finally {
        setLoading(false);
      }
    } else {
      // If no trackId is provided, just proceed with the normal flow
      onAccept();
    }
  };

  // Determine if this is a sync proposal or a library license
  const isSyncProposal = !!trackId && licenseType === 'Single Track';
  const syncProposal = isSyncProposal ? useSyncProposalDetails(trackId) : null;

  // Dynamic fields
  const permittedUse = isSyncProposal && syncProposal && syncProposal.permitted_use ? (
    <span>{syncProposal.permitted_use}</span>
  ) : (
    <ul className="list-disc ml-6 mt-1">
      <li>Online content (e.g., YouTube videos, social media posts, podcasts, websites, web series)</li>
      <li>Advertisements and promotional materials</li>
      <li>Film, television, and streaming productions</li>
      <li>Video games and mobile or desktop apps</li>
      <li>Live events and public performances</li>
    </ul>
  );
  const project = isSyncProposal && syncProposal && syncProposal.project ? syncProposal.project : 'N/A';
  const licenseDuration = licenseType === 'Ultimate Access' ? 'Perpetual (No Expiration)' : licenseType === 'Platinum Access' ? '3 years' : '1 year';

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-blue-500/20 p-4 sm:p-6">
      <div className="flex items-start space-x-3 mb-4 sm:mb-6">
        <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-1" />
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-white mb-2">License Terms Summary</h3>
          <p className="text-gray-300 text-sm sm:text-base">Please review these terms before proceeding with your {licenseType} license purchase.</p>
        </div>
      </div>
      {error && (
        <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-red-400 text-center text-sm sm:text-base">{error}</p>
        </div>
      )}
      <div className="space-y-4 sm:space-y-6 mb-4 sm:mb-6 text-sm sm:text-base">
        <div>
          <h4 className="text-white font-semibold mb-1 text-sm sm:text-base">1. GRANT OF LICENSE</h4>
          <p className="text-gray-300">Licensor grants Licensee a non-exclusive, non-transferable license to synchronize and use the musical composition and sound recording for commercial purposes, worldwide, subject to the terms and conditions stated herein.</p>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-1 text-sm sm:text-base">2. TERM OF LICENSE</h4>
          <p className="text-gray-300">The license starts on the purchase date and expires after {licenseDuration}.</p>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-1 text-sm sm:text-base">3. PERMITTED USES</h4>
          <div className="text-gray-300">{permittedUse}</div>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-1 text-sm sm:text-base">4. SCOPE OF USE</h4>
          <p className="text-gray-300">This license covers one media project or production{isSyncProposal && syncProposal ? `: ${project}` : '.'} A new license is required for additional or unrelated productions.<br/>Content may be distributed worldwide, in digital or physical formats.<br/>Monetization of content featuring the Music is allowed through online platforms (e.g., YouTube ads, paid social media promotions, etc.).</p>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-1 text-sm sm:text-base">5. MODIFICATIONS</h4>
          <p className="text-gray-300">Licensee may edit, rearrange, or loop the Music to fit their project, provided the Music is not materially altered or combined with new musical elements that could suggest derivative ownership or create a new work.</p>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-1 text-sm sm:text-base">6. RESTRICTIONS</h4>
          <ul className="list-disc ml-4 sm:ml-6 text-gray-300">
            <li>Resell, sublicense, or distribute the Music as a standalone product (e.g., music pack or audio download)</li>
            <li>Register the Music with any content identification system (e.g., YouTube Content ID)</li>
            <li>Claim authorship, copyright, or publishing rights over the Music</li>
            <li>Use the Music in defamatory, obscene, or unlawful contexts</li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-1 text-sm sm:text-base">7. COMPENSATION</h4>
          <p className="text-gray-300">This license is granted in exchange for: A valid membership subscription (for subscribers), or a one-time track purchase (for single track licenses) depending on the purchase. No further royalty or recurring payment is required from the client during the license term. The producer will collect performance and master royalties through their publishing company and Performing Rights Organization.</p>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-1 text-sm sm:text-base">8. CREDIT</h4>
          <p className="text-gray-300">Licensee is required to credit the Music creator in their production.</p>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-1 text-sm sm:text-base">9. TERMINATION</h4>
          <p className="text-gray-300">Licensor may revoke this license in case of material breach of the terms. Upon termination, Licensee must cease use of the Music in any new content and remove it from any editable or re-uploadable source where feasible.</p>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-1 text-sm sm:text-base">10. GOVERNING LAW</h4>
          <p className="text-gray-300">This Agreement shall be governed by and construed in accordance with the laws of the United States of America, without regard to conflict of law principles.</p>
        </div>
      </div>
      <div className="bg-blue-900/20 border border-blue-500/20 rounded-lg p-3 sm:p-4">
        <p className="text-xs sm:text-sm text-gray-300">By proceeding with your purchase, you acknowledge and accept these terms. A complete license agreement will be provided after checkout.</p>
      </div>
      <button
        onClick={handleAccept}
        className="mt-4 sm:mt-6 w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center space-x-2"
        disabled={loading}
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            <span>Processing...</span>
          </>
        ) : (
          <span>Accept Terms & Continue</span>
        )}
      </button>
    </div>
  );
}
