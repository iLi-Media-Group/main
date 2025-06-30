import React, { useEffect, useState } from 'react';
import { CheckCircle, ArrowRight, Mail, Settings } from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';

export function WhiteLabelSuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    // Simulate loading while webhook processes
    const timer = setTimeout(() => {
      setLoading(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

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
              Your payment was successful and your white label music licensing platform is being set up.
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-blue-500/20 mb-8">
            <h2 className="text-2xl font-semibold text-white mb-6">What's Next?</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="text-left">
                <div className="flex items-center mb-3">
                  <Mail className="w-6 h-6 text-blue-400 mr-3" />
                  <h3 className="text-lg font-semibold text-white">Check Your Email</h3>
                </div>
                <p className="text-gray-300 text-sm">
                  We'll send you a welcome email with your login credentials and setup instructions within the next few minutes.
                </p>
              </div>

              <div className="text-left">
                <div className="flex items-center mb-3">
                  <Settings className="w-6 h-6 text-blue-400 mr-3" />
                  <h3 className="text-lg font-semibold text-white">Customize Your Brand</h3>
                </div>
                <p className="text-gray-300 text-sm">
                  Once you receive your login credentials, you can customize your platform's branding, colors, and logo.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => navigate('/white-label')}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg transition-colors shadow-lg shadow-blue-500/25"
            >
              <ArrowRight className="w-5 h-5 mr-2" />
              Back to White Label Page
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