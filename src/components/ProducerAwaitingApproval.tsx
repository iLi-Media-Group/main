import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useUnifiedAuth } from '../contexts/UnifiedAuthContext';
import { Clock, Music, ArrowLeft } from 'lucide-react';

export function ProducerAwaitingApproval() {
  const navigate = useNavigate();
  const { user, profile, signOut } = useUnifiedAuth();

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
              <Music className="w-8 h-8 text-blue-400" />
              <h1 className="ml-2 text-xl font-bold text-white">Producer Dashboard</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-center">
          <div className="mb-8">
            <Clock className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-4">Application Under Review</h2>
            <p className="text-gray-300 text-lg">
              Thank you for your producer application! We're currently reviewing your submission.
            </p>
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-yellow-300 mb-3">What happens next?</h3>
            <div className="space-y-3 text-yellow-200">
              <div className="flex items-start">
                <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <p>Our team will review your application and verify your information</p>
              </div>
              <div className="flex items-start">
                <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <p>You'll receive an email notification once your application is approved</p>
              </div>
              <div className="flex items-start">
                <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <p>Once approved, you'll be able to access your producer dashboard and start uploading tracks</p>
              </div>
            </div>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-blue-300 mb-3">Application Details</h3>
            <div className="text-left space-y-2 text-blue-200">
              <div className="flex justify-between">
                <span>Name:</span>
                <span className="font-medium">{profile?.first_name} {profile?.last_name}</span>
              </div>
              <div className="flex justify-between">
                <span>Email:</span>
                <span className="font-medium">{profile?.email}</span>
              </div>
              <div className="flex justify-between">
                <span>Application Date:</span>
                <span className="font-medium">
                  {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Status:</span>
                <span className="font-medium text-yellow-400">Under Review</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-gray-400">
              Have questions about your application? Contact our support team.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/contact')}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Contact Support
              </button>
              
              <button
                onClick={signOut}
                className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
