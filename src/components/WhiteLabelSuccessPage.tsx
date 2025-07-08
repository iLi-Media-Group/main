import React, { useEffect, useState } from 'react';
import { CheckCircle, ArrowRight, Mail, Settings } from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';

export function WhiteLabelSuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accountCreated, setAccountCreated] = useState(false);
  const sessionId = searchParams.get('session_id');

  // Read user info from URL params
  const email = searchParams.get('email') || '';
  const password = searchParams.get('password') || '';
  const first_name = searchParams.get('first_name') || '';
  const last_name = searchParams.get('last_name') || '';
  const company = searchParams.get('company') || '';

  useEffect(() => {
    // Call Edge Function to create user and client
    async function createAccount() {
      setLoading(true);
      setError(null);
      setAccountCreated(false);
      try {
        const response = await fetch('https://yciqkebqlajqbpwlujma.supabase.co/functions/v1/create_white_label_client', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({
            email,
            password,
            display_name: company || (first_name + ' ' + last_name),
            first_name,
            last_name
          })
        });
        const text = await response.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch {
          setError('Unexpected response from server. Please try again or contact support.');
          setLoading(false);
          return;
        }
        if (!response.ok || !data.success) {
          setError(data.error || 'Failed to create account.');
          setLoading(false);
          return;
        }
        setAccountCreated(true);
      } catch (err) {
        setError('Failed to create account.');
      } finally {
        setLoading(false);
      }
    }
    if (email && password && first_name && last_name) {
      createAccount();
    } else {
      setLoading(false);
      setError('Missing account information.');
    }
  }, [email, password, first_name, last_name, company]);

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

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center">
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-8">
          <h2 className="text-xl font-semibold text-red-400 mb-2">Account Setup Failed</h2>
          <p className="text-red-300 mb-4">{error}</p>
        </div>
      </div>
    );
  }

  if (accountCreated) {
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
                Your payment was successful and your account has been set up.
              </p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-blue-500/20 mb-8">
              <h2 className="text-2xl font-semibold text-white mb-6">What's Next?</h2>
              <div className="text-left">
                <div className="flex items-center mb-3">
                  <Mail className="w-6 h-6 text-blue-400 mr-3" />
                  <h3 className="text-lg font-semibold text-white">Check Your Email</h3>
                </div>
                <p className="text-gray-300 text-sm">
                  We've sent you a secure login link. Please check your email and click the link to access your dashboard and complete your setup.
                </p>
              </div>
            </div>
            <div className="text-sm text-gray-400">
              Session ID: {sessionId || 'N/A'}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // fallback
  return null;
} 