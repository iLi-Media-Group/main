import React, { useState } from 'react';
import { Mail, CheckCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export function EmailVerificationPage() {
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const handleResendEmail = async () => {
    setResending(true);
    setResendSuccess(false);
    
    try {
      // Get the email from URL params or localStorage
      const urlParams = new URLSearchParams(window.location.search);
      const email = urlParams.get('email') || localStorage.getItem('pendingVerificationEmail');
      
      if (!email) {
        throw new Error('No email found for verification');
      }

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email
      });

      if (error) throw error;
      
      setResendSuccess(true);
      setTimeout(() => setResendSuccess(false), 5000);
    } catch (error) {
      console.error('Error resending verification email:', error);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-blue-500/20 p-8 text-center">
          <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Mail className="w-8 h-8 text-blue-400" />
          </div>
          
          <h1 className="text-2xl font-bold text-white mb-4">
            Verify Your Email
          </h1>
          
          <p className="text-gray-300 mb-6">
            We've sent a verification link to your email address. Please check your inbox and click the link to verify your account.
          </p>
          
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center text-blue-400 mb-2">
              <CheckCircle className="w-5 h-5 mr-2" />
              <span className="text-sm font-medium">Check your email</span>
            </div>
            <p className="text-sm text-gray-400">
              Don't forget to check your spam folder if you don't see the email in your inbox.
            </p>
          </div>
          
          <div className="space-y-4">
            <button
              onClick={handleResendEmail}
              disabled={resending}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white rounded-lg transition-colors flex items-center justify-center"
            >
              {resending ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Resending...
                </>
              ) : (
                'Resend Verification Email'
              )}
            </button>
            
            {resendSuccess && (
              <div className="text-green-400 text-sm">
                Verification email sent successfully!
              </div>
            )}
            
            <Link
              to="/login"
              className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors flex items-center justify-center"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Login
            </Link>
          </div>
          
          <div className="mt-6 text-sm text-gray-400">
            <p>Already verified your email?</p>
            <Link to="/login" className="text-blue-400 hover:text-blue-300">
              Sign in to your account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 