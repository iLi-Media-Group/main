import React, { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Play, Loader2 } from 'lucide-react';
import { VideoBackground } from './VideoBackground';
import { useUnifiedAuth } from '../contexts/UnifiedAuthContext';
import { createCheckoutSession } from '../lib/stripe';
import { PitchAuthModal } from './PitchAuthModal';

export default function PitchPage() {
  const navigate = useNavigate();
  const { user, accountType } = useUnifiedAuth();
  const [loading, setLoading] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedBillingCycle, setSelectedBillingCycle] = useState<'monthly' | 'annual' | null>(null);
  const isEligible = useMemo(() => {
    if (!user) return false;
    return accountType === 'artist_band' || accountType === 'producer' || accountType === 'rights_holder';
  }, [user, accountType]);

  const handleJoin = useCallback(async (billingCycle: 'monthly' | 'annual') => {
    if (!user || !isEligible) {
      setSelectedBillingCycle(billingCycle);
      setShowAuthModal(true);
      return;
    }

    // TEMPORARY: Hardcode new price IDs until environment variables are working
    const monthlyPriceId = 'price_1S7fiJA4Yw5viczUpcdvr4Zs';
    const annualPriceId = 'price_1S7flBA4Yw5viczUFypZhfri';
    const priceId = billingCycle === 'monthly' ? monthlyPriceId : annualPriceId;

    if (!priceId) {
      alert('Pitch product is not configured yet. Please contact support.');
      return;
    }

    try {
      setLoading(true);
      const url = await createCheckoutSession(
        priceId,
        'subscription',
        undefined,
        { service: 'pitch' },
        `${window.location.origin}/pitch/success?session_id={CHECKOUT_SESSION_ID}`
      );
      window.location.href = url;
    } catch (err) {
      console.error('Failed to start checkout', err);
      alert('Unable to initiate checkout. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user, isEligible, navigate]);

  const handleLoginSuccess = useCallback(async () => {
    setShowAuthModal(false);
    if (selectedBillingCycle) {
      // Wait a moment for the auth state to update
      setTimeout(() => {
        handleJoin(selectedBillingCycle);
      }, 500);
    }
    setSelectedBillingCycle(null);
  }, [selectedBillingCycle, handleJoin]);

  return (
    <div className="relative min-h-screen overflow-hidden">
      <VideoBackground
        videoUrl="https://player.vimeo.com/external/434045526.sd.mp4?s=c27eecc69a27dbc4ff2b87d38afc35f1a9e7c02d&profile_id=164&oauth2_token_id=57447761"
        fallbackImage="https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=1920&q=80"
        page="pitch"
        alt="Pitch service background"
      />

      <div className="relative z-10 container mx-auto px-4 py-16">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">MyBeatFi Pitch Service</h1>
            <p className="text-lg text-gray-300">For just $19.99/month, get your music in front of music supervisors and decision-makers.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
            <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-blue-500/20 p-6">
              <h2 className="text-2xl font-semibold text-white mb-4">Why Join the Pitch Service?</h2>
              <ul className="space-y-3 text-gray-200">
                <li className="flex items-start"><CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5 mr-2" /> Don't miss opportunities – We submit briefs to our industry contacts on your behalf.</li>
                <li className="flex items-start"><CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5 mr-2" /> Stay focused on creating – Concentrate on making music while we help with pitching.</li>
                <li className="flex items-start"><CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5 mr-2" /> Expand your reach – Have your work submitted to industry opportunities while you build your own pitch list and relationships.</li>
                <li className="flex items-start"><CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5 mr-2" /> Professional curation – Our team considers genre, mix quality, licensing readiness, and brief requirements to increase chances of success.</li>
              </ul>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-blue-500/20 p-6">
              <h2 className="text-2xl font-semibold text-white mb-4">How It Works</h2>
              <ol className="list-decimal list-inside space-y-2 text-gray-200">
                <li>Subscribe for $19.99/month or $189/year.</li>
                <li>Upload your music through your MyBeatFi Sync account.</li>
                <li>When we receive sync briefs, our team selects tracks that best fit the opportunity.</li>
                <li>Selected tracks are added to playlists and sent directly to the submission address.</li>
              </ol>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-blue-500/20 p-6 mb-10">
            <h2 className="text-2xl font-semibold text-white mb-4">Commission Structure</h2>
            <p className="text-gray-200 mb-4">When your music gets placed through our pitch service, here's how the commissions work:</p>
            
            <div className="bg-blue-900/30 border border-blue-400/30 rounded-lg p-4 mb-4">
              <h3 className="text-lg font-semibold text-white mb-3">Example: $1,000 Deal</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-blue-200">Agent Commission (15%)</span>
                  <span className="text-sm font-medium text-white">$150.00</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-blue-200">MyBeatFi.io Commission (10%)</span>
                  <span className="text-sm font-medium text-white">$100.00</span>
                </div>
                <div className="border-t border-blue-400/30 pt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-blue-200">Total Commissions</span>
                    <span className="text-sm font-bold text-white">$250.00</span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-sm font-semibold text-emerald-300">Your Net Earnings</span>
                    <span className="text-sm font-bold text-emerald-300">$750.00</span>
                  </div>
                </div>
              </div>
            </div>
            
            <p className="text-sm text-gray-300">
              <strong>Transparent Fees:</strong> You'll always know exactly what commissions are being taken from your deals. 
              The agent commission varies by opportunity, but MyBeatFi.io always takes a flat 10% commission.
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-blue-500/20 p-6 mb-10">
            <h2 className="text-2xl font-semibold text-white mb-4">Subscription & Service Terms</h2>
            <ul className="space-y-2 text-gray-200">
              <li>Billing Cycle: The Pitch Service subscription is billed monthly at $19.99 or annually at $189.</li>
              <li>Auto-Renewal: Subscriptions automatically renew each term unless canceled.</li>
              <li>Cancellation: You may cancel at any time; access continues until end of term.</li>
              <li>No Refunds or Proration: Payments are non-refundable and not prorated.</li>
            </ul>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-blue-500/20 p-6 mb-10">
            <h2 className="text-2xl font-semibold text-white mb-4">Disclaimers</h2>
            <ul className="space-y-2 text-gray-200">
              <li>No Guarantee of Pitching or Placement.</li>
              <li>Curated Selection at the sole discretion of MyBeatFi Sync Licensing.</li>
              <li>Playlist Submissions may include tracks from other artists.</li>
              <li>Supportive Service: Designed to supplement your own pitching and relationships.</li>
            </ul>
          </div>

          <div className="text-center mb-14">
            <p className="text-gray-300 mb-4">Start Pitching Smarter</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => handleJoin('monthly')}
                disabled={loading}
                className="px-8 py-4 rounded-lg font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors flex items-center justify-center"
              >
                {loading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Play className="w-5 h-5 mr-2" />}
                Subscribe $19.99/month
              </button>
              <button
                onClick={() => handleJoin('annual')}
                disabled={loading}
                className="px-8 py-4 rounded-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                {loading ? 'Processing…' : 'Subscribe $189/year'}
              </button>
            </div>
            {!user && (
              <p className="text-sm text-gray-400 mt-3">You’ll be asked to log in before subscribing.</p>
            )}
          </div>
        </div>
      </div>

      {/* Authentication Modal */}
      <PitchAuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
}
