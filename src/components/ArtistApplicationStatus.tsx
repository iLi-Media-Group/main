import React, { useState, useEffect } from 'react';
import { CheckCircle, Clock, XCircle, AlertCircle, Mail, Home } from 'lucide-react';
import { useUnifiedAuth } from '../contexts/UnifiedAuthContext';
import { supabase } from '../lib/supabase';

interface ArtistApplication {
  id: string;
  name: string;
  email: string;
  artist_type: string;
  primary_genre: string;
  status: string;
  application_score: number;
  created_at: string;
  updated_at: string;
}

const ArtistApplicationStatus: React.FC = () => {
  const { user } = useUnifiedAuth();
  const [application, setApplication] = useState<ArtistApplication | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApplication = async () => {
      if (user?.email) {
        try {
          const { data, error } = await supabase
            .from('artist_applications')
            .select('*')
            .eq('email', user.email)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          if (!error && data) {
            setApplication(data);
          }
        } catch (error) {
          console.error('Error fetching application:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchApplication();
  }, [user?.email]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-8 h-8 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-8 h-8 text-red-500" />;
      case 'invited':
        return <Mail className="w-8 h-8 text-blue-500" />;
      case 'onboarded':
        return <CheckCircle className="w-8 h-8 text-green-500" />;
      default:
        return <Clock className="w-8 h-8 text-yellow-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Application Approved';
      case 'rejected':
        return 'Application Not Approved';
      case 'invited':
        return 'Invitation Sent';
      case 'onboarded':
        return 'Account Created & Onboarded';
      case 'new':
        return 'Under Review';
      default:
        return 'Processing';
    }
  };

  const getStatusDescription = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Congratulations! Your artist application has been approved. You can now access your dashboard and start uploading your music.';
      case 'rejected':
        return 'Thank you for your application. Unfortunately, we are unable to approve your application at this time. You may reapply in the future.';
      case 'invited':
        return 'An invitation has been sent to your email address. Please check your inbox and follow the instructions to complete your account setup.';
      case 'onboarded':
        return 'Welcome! Your account has been successfully created and you are now fully onboarded. You can access your dashboard and start uploading your music.';
      case 'new':
        return 'Your application is currently under review. We typically review applications within 5-7 business days. You will receive an email notification once a decision has been made.';
      default:
        return 'Your application is being processed. Please check back later for updates.';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-500/10 border-green-500/20 text-green-400';
      case 'rejected':
        return 'bg-red-500/10 border-red-500/20 text-red-400';
      case 'invited':
        return 'bg-blue-500/10 border-blue-500/20 text-blue-400';
      case 'onboarded':
        return 'bg-green-500/10 border-green-500/20 text-green-400';
      default:
        return 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-green-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading application status...</p>
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-green-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-blue-500/20 text-center">
          <AlertCircle className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-4">No Application Found</h2>
          <p className="text-gray-300 mb-6">
            We couldn't find an artist application for your account. Please submit an application to get started.
          </p>
          <button
            onClick={() => window.location.href = '/artist-application'}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors mb-4"
          >
            Submit Application
          </button>
          <button
            onClick={() => window.location.href = '/'}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-green-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">Artist Application Status</h1>
            <p className="text-xl text-blue-200">
              Track the progress of your artist application
            </p>
          </div>

          {/* Status Card */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-blue-500/20 mb-8">
            <div className="text-center mb-6">
              {getStatusIcon(application.status)}
            </div>
            
            <div className={`text-center p-6 rounded-lg border ${getStatusColor(application.status)} mb-6`}>
              <h2 className="text-2xl font-bold mb-2">{getStatusText(application.status)}</h2>
              <p className="text-lg">{getStatusDescription(application.status)}</p>
            </div>

            {/* Application Details */}
            <div className="bg-white/5 rounded-lg p-6 mb-6">
              <h3 className="text-xl font-semibold text-white mb-4">Application Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-300">
                <div>
                  <span className="font-medium">Name:</span> {application.name}
                </div>
                <div>
                  <span className="font-medium">Email:</span> {application.email}
                </div>
                <div>
                  <span className="font-medium">Artist Type:</span> {application.artist_type}
                </div>
                <div>
                  <span className="font-medium">Primary Genre:</span> {application.primary_genre}
                </div>
                <div>
                  <span className="font-medium">Application Score:</span> {application.application_score}/100
                </div>
                <div>
                  <span className="font-medium">Submitted:</span> {new Date(application.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              {(application.status === 'approved' || application.status === 'onboarded') ? (
                <button
                  onClick={() => window.location.href = '/artist/dashboard'}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                >
                  Access Dashboard
                </button>
              ) : application.status === 'rejected' ? (
                <button
                  onClick={() => window.location.href = '/artist-application'}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                >
                  Reapply
                </button>
              ) : null}
              
              <button
                onClick={() => window.location.href = '/'}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Return to Home
              </button>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-blue-500/20 text-center">
            <h3 className="text-lg font-semibold text-white mb-2">Need Help?</h3>
            <p className="text-gray-300 mb-4">
              If you have any questions about your application, please contact us.
            </p>
            <a
              href="mailto:info@mybeatfi.io"
              className="inline-flex items-center text-blue-400 hover:text-blue-300 transition-colors"
            >
              <Mail className="w-4 h-4 mr-2" />
              info@mybeatfi.io
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArtistApplicationStatus;
