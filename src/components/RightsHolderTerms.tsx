import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUnifiedAuth } from '../contexts/UnifiedAuthContext';
import { supabase } from '../lib/supabase';
import { dataCache, CACHE_KEYS } from '../lib/cache';
import { FileText, Check, ArrowLeft } from 'lucide-react';

const RightsHolderTerms: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile, fetchProfile } = useUnifiedAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [rightsAuthorityAccepted, setRightsAuthorityAccepted] = useState(false);

  const handleAcceptTerms = async () => {
    if (!user || !profile) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          terms_accepted: true,
          terms_accepted_at: new Date().toISOString(),
          rights_authority_declaration_accepted: true,
          rights_authority_declaration_accepted_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) {
        console.error('Error accepting terms:', error);
        alert('Error accepting terms. Please try again.');
        return;
      }

      // Clear the profile cache to force a fresh fetch
      if (user) {
        const cacheKey = CACHE_KEYS.PROFILE(user.id);
        dataCache.delete(cacheKey);
        console.log('🗑️ Cleared profile cache for user:', user.id);
        
        // Refresh the profile data
        await fetchProfile(user.id, user.email || '');
        console.log('🔄 Refreshed profile data after terms acceptance');
      }

      // Redirect to dashboard
      navigate('/rights-holder/dashboard');
    } catch (error) {
      console.error('Error accepting terms:', error);
      alert('Error accepting terms. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-blue-900/90">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-lg border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center text-gray-300 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back
              </button>
            </div>
            <div className="flex items-center">
              <FileText className="w-8 h-8 text-blue-400" />
              <h1 className="ml-2 text-xl font-bold text-white">Terms & Conditions</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8">
          <div className="prose prose-invert max-w-none">
            <h2 className="text-2xl font-bold text-white mb-6">Rights Holder Terms and Conditions</h2>
            
            <div className="space-y-6 text-gray-300">
              <section>
                <h3 className="text-lg font-semibold text-white mb-3">1. Rights Holder Responsibilities</h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>You represent that you have the legal authority to license music rights on behalf of the rights holders you represent.</li>
                  <li>You are responsible for ensuring all necessary permissions and clearances are obtained before submitting tracks for sync licensing.</li>
                  <li>You must maintain accurate and up-to-date information about the rights you control.</li>
                  <li>You are responsible for ensuring compliance with all applicable copyright laws and regulations.</li>
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-white mb-3">2. Sync Licensing Terms</h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>By submitting tracks for sync licensing, you grant MyBeatFi the right to present your music to potential licensees.</li>
                  <li>You agree to negotiate licensing terms in good faith when presented with sync opportunities.</li>
                  <li>You understand that MyBeatFi will take a commission on successful sync licensing deals.</li>
                  <li>You agree to provide accurate metadata and documentation for all submitted tracks.</li>
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-white mb-3">3. Payment and Royalties</h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>You will receive payment for successful sync licensing deals according to the agreed terms.</li>
                  <li>Payments will be processed within 30 days of receipt of payment from licensees.</li>
                  <li>You are responsible for providing accurate payment information and tax documentation.</li>
                  <li>MyBeatFi reserves the right to withhold payments if there are disputes or compliance issues.</li>
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-white mb-3">4. Rights Authority Declaration</h3>
                <div className="bg-blue-900/50 border border-blue-500/30 rounded-lg p-4">
                  <p className="text-blue-200 font-medium mb-2">By accepting these terms, you declare that:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4 text-blue-100">
                    <li>You have the legal authority to represent the rights holders for the music you submit.</li>
                    <li>You have obtained all necessary permissions and clearances for the music you submit.</li>
                    <li>You will not submit music for which you do not have proper rights or permissions.</li>
                    <li>You will promptly notify MyBeatFi of any changes in rights ownership or permissions.</li>
                  </ul>
                </div>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-white mb-3">5. Termination</h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Either party may terminate this agreement with 30 days written notice.</li>
                  <li>Upon termination, MyBeatFi will cease presenting your music for new sync opportunities.</li>
                  <li>Existing licensing agreements will remain in effect according to their terms.</li>
                  <li>You will receive payment for any outstanding royalties within 60 days of termination.</li>
                </ul>
              </section>
            </div>

            {/* Acceptance Checkboxes */}
            <div className="mt-8 space-y-4">
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  id="terms-accepted"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-1 w-5 h-5 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                />
                <label htmlFor="terms-accepted" className="text-gray-300">
                  I have read and agree to the Terms and Conditions outlined above
                </label>
              </div>

              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  id="rights-authority"
                  checked={rightsAuthorityAccepted}
                  onChange={(e) => setRightsAuthorityAccepted(e.target.checked)}
                  className="mt-1 w-5 h-5 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                />
                <label htmlFor="rights-authority" className="text-gray-300">
                  I declare that I have the legal authority to represent the rights holders and have obtained all necessary permissions
                </label>
              </div>
            </div>

            {/* Accept Button */}
            <div className="mt-8">
              <button
                onClick={handleAcceptTerms}
                disabled={!termsAccepted || !rightsAuthorityAccepted || isLoading}
                className={`w-full flex items-center justify-center px-6 py-3 rounded-lg font-medium transition-colors ${
                  termsAccepted && rightsAuthorityAccepted && !isLoading
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }`}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5 mr-2" />
                    Accept Terms and Continue
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RightsHolderTerms;
