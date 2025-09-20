import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

export function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the session from the URL hash
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }

        if (data.session) {
          // User is authenticated, create their profile if it doesn't exist
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', data.session.user.id)
            .maybeSingle();

          if (!profile && !profileError) {
            // Profile doesn't exist, create it
            const { error: insertError } = await supabase
              .from('profiles')
              .insert({
                id: data.session.user.id,
                email: data.session.user.email,
                account_type: 'client',
                membership_plan: 'Single Track'
              });

            if (insertError) {
              console.error('Error creating profile:', insertError);
            } else {
              // Send welcome email for new client accounts created via email confirmation
              // This handles users who signed up but needed email confirmation
              try {
                console.log('Sending welcome email after email verification...');
                const { error: emailError } = await supabase.functions.invoke('send-welcome-email', {
                  body: {
                    email: data.session.user.email,
                    first_name: data.session.user.user_metadata?.first_name || 'there',
                    account_type: 'client'
                  }
                });
                
                if (emailError) {
                  console.error('Welcome email error:', emailError);
                } else {
                  console.log('Welcome email sent successfully after verification');
                }
                // Also schedule the welcome drip series based on account type
                const account_type = data.session.user.user_metadata?.account_type || 'client';
                
                if (account_type === 'client') {
                  try {
                    await supabase.functions.invoke('schedule-client-welcome-drip', {
                      body: {
                        user_id: data.session.user.id,
                        email: data.session.user.email,
                        first_name: data.session.user.user_metadata?.first_name || 'there',
                        account_type: 'client'
                      }
                    });
                    console.log('Client welcome drip scheduled after verification');
                  } catch (scheduleErr) {
                    console.error('Failed to schedule client welcome drip after verification:', scheduleErr);
                  }
                } else if (['producer', 'artist_band', 'rights_holder'].includes(account_type)) {
                  try {
                    await supabase.functions.invoke('schedule-producer-welcome-drip', {
                      body: {
                        user_id: data.session.user.id,
                        email: data.session.user.email,
                        first_name: data.session.user.user_metadata?.first_name || 'there',
                        account_type: account_type
                      }
                    });
                    console.log('Producer welcome drip scheduled after verification');
                  } catch (scheduleErr) {
                    console.error('Failed to schedule producer welcome drip after verification:', scheduleErr);
                  }
                }
              } catch (emailErr) {
                console.error('Welcome email failed after verification:', emailErr);
              }
            }
          }

          setStatus('success');
          setMessage('Email verified successfully! Redirecting to dashboard...');
          
          // Redirect to dashboard after a short delay
          setTimeout(() => {
            navigate('/dashboard');
          }, 2000);
        } else {
          setStatus('error');
          setMessage('Verification failed. Please try again.');
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        setStatus('error');
        setMessage('An error occurred during verification. Please try again.');
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-blue-500/20 p-8 text-center">
          {status === 'loading' && (
            <>
              <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-4">
                Verifying Email
              </h1>
              <p className="text-gray-300">
                Please wait while we verify your email address...
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-4">
                Verification Successful
              </h1>
              <p className="text-gray-300">
                {message}
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <XCircle className="w-8 h-8 text-red-400" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-4">
                Verification Failed
              </h1>
              <p className="text-gray-300 mb-6">
                {message}
              </p>
              <button
                onClick={() => navigate('/login')}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Go to Login
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
} 