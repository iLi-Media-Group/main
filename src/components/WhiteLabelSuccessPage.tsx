import React, { useEffect, useState } from 'react';
import { CheckCircle, ArrowRight, Mail, Settings } from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export function WhiteLabelSuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const sessionId = searchParams.get('session_id');

  // Helper function to update payment status
  const updatePaymentStatus = async (clientId: string, featuresString: string) => {
    try {
      const purchasedFeatures = featuresString ? featuresString.split(',') : [];
      
      const updateObj: any = {};
      
      if (purchasedFeatures.includes('ai_recommendations')) {
        updateObj.ai_search_assistance_paid = true;
      }
      if (purchasedFeatures.includes('producer_applications')) {
        updateObj.producer_onboarding_paid = true;
      }
      if (purchasedFeatures.includes('deep_media_search')) {
        updateObj.deep_media_search_paid = true;
      }

      if (Object.keys(updateObj).length > 0) {
        const { error } = await supabase
          .from('white_label_clients')
          .update(updateObj)
          .eq('id', clientId);

        if (error) {
          console.error('Error updating payment status:', error);
        } else {
          console.log('Successfully marked features as paid');
        }
      }
    } catch (error) {
      console.error('Error updating payment status:', error);
    }
  };

  useEffect(() => {
    async function handlePaymentSuccess() {
      if (!sessionId) {
        setLoading(false);
        return;
      }

      try {
        // 1. Fetch session details from Stripe
        const response = await fetch(`https://api.stripe.com/v1/checkout/sessions/${sessionId}`, {
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        });

        if (!response.ok) {
          console.error('Failed to fetch session details');
          setLoading(false);
          return;
        }

        const session = await response.json();
        const metadata = session.metadata || {};
        const clientId = metadata.client_id;

        if (!clientId) {
          console.error('No client_id found in session metadata');
          // Try to find the client by email instead
          const customerEmail = metadata.customer_email;
          if (customerEmail) {
            const { data: clientData } = await supabase
              .from('white_label_clients')
              .select('id')
              .eq('owner_email', customerEmail.toLowerCase())
              .maybeSingle();
            
            if (clientData) {
              await updatePaymentStatus(clientData.id, metadata.features);
            }
          }
          setLoading(false);
          return;
        }

        await updatePaymentStatus(clientId, metadata.features);

      } catch (error) {
        console.error('Error processing payment success:', error);
      } finally {
        setLoading(false);
      }
    }

    // Simulate loading while webhook processes
    const timer = setTimeout(() => {
      handlePaymentSuccess();
    }, 2000);

    return () => clearTimeout(timer);
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-white mb-2">Setting up your white label platform...</h2>
          <p className="text-gray-400">Please wait while we configure your account.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-20">
        <div className="text-center">
          <div className="mb-8">
            <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Welcome to Your White Label Platform!
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Your payment was successful! Your white label music licensing platform is now ready to use.
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-blue-500/20 mb-8">
            <h2 className="text-2xl font-semibold text-white mb-6">What's Next?</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="text-left">
                <div className="flex items-center mb-3">
                  <Mail className="w-6 h-6 text-blue-400 mr-3" />
                  <h3 className="text-lg font-semibold text-white">Access Your Dashboard</h3>
                </div>
                <p className="text-gray-300 text-sm">
                  Click the button below to access your white label dashboard where you can manage your platform.
                </p>
              </div>

              <div className="text-left">
                <div className="flex items-center mb-3">
                  <Settings className="w-6 h-6 text-blue-400 mr-3" />
                  <h3 className="text-lg font-semibold text-white">Customize Your Brand</h3>
                </div>
                <p className="text-gray-300 text-sm">
                  In your dashboard, you can customize your platform's branding, colors, and logo to match your brand.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => navigate('/white-label-dashboard')}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg transition-colors shadow-lg shadow-blue-500/25"
            >
              <ArrowRight className="w-5 h-5 mr-2" />
              Go to Your Dashboard
            </button>
            
            <div className="text-sm text-gray-400">
              Session ID: {sessionId || 'N/A'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 