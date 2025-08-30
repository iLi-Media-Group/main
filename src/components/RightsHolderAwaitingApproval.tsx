import React, { useState, useEffect } from 'react';
import { useUnifiedAuth } from '../contexts/UnifiedAuthContext';
import { Clock, Building2, CheckCircle, AlertCircle, Mail, Phone, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export function RightsHolderAwaitingApproval() {
  const { user, profile, signOut, fetchProfile } = useUnifiedAuth();
  const navigate = useNavigate();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState<string | null>(null);
  const [applicationDetails, setApplicationDetails] = useState<any>(null);

  const handleSignOut = () => {
    signOut();
    navigate('/');
  };

  const fetchApplicationStatus = async () => {
    if (!user?.email) return;
    
    try {
      console.log('Fetching application status for email:', user.email);
      
      // Fetch the rights holder application status
      const { data: applicationData, error } = await supabase
        .from('rights_holder_applications')
        .select('*')
        .eq('email', user.email)
        .single();

      if (error) {
        console.error('Error fetching application status:', error);
        return;
      }

      console.log('Application data received:', applicationData);
      setApplicationDetails(applicationData);
      setApplicationStatus(applicationData.status);
    } catch (error) {
      console.error('Error fetching application status:', error);
    }
  };

  const handleRefreshStatus = async () => {
    if (!user) return;
    
    setIsRefreshing(true);
    try {
      await fetchProfile(user.id, user.email || '');
      await fetchApplicationStatus();
      console.log('Profile refreshed, verification status:', profile?.verification_status);
    } catch (error) {
      console.error('Error refreshing profile:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Fetch application status on component mount
  useEffect(() => {
    fetchApplicationStatus();
  }, [user?.email]);

  // Add debugging to see what status we're getting
  useEffect(() => {
    console.log('Application Status Debug:', {
      applicationStatus,
      profileVerificationStatus: profile?.verification_status,
      applicationDetails
    });
  }, [applicationStatus, profile?.verification_status, applicationDetails]);

  // Get status display based on application status and profile verification
  const getStatusDisplay = () => {
    if (profile?.verification_status === 'verified') {
      return {
        currentStep: 'approved',
        steps: [
          { status: 'completed', text: 'Application Submitted', icon: 'check' },
          { status: 'completed', text: 'Under Review', icon: 'check' },
          { status: 'current', text: 'Approved', icon: 'check' }
        ]
      };
    }

    switch (applicationStatus) {
      case 'manual_review':
      case 'save_for_later':
        return {
          currentStep: 'review',
          steps: [
            { status: 'completed', text: 'Application Submitted', icon: 'check' },
            { status: 'current', text: 'Under Review', icon: 'clock' },
            { status: 'pending', text: 'Approved', icon: 'check' }
          ]
        };
      case 'onboarded':
        return {
          currentStep: 'approved',
          steps: [
            { status: 'completed', text: 'Application Submitted', icon: 'check' },
            { status: 'completed', text: 'Under Review', icon: 'check' },
            { status: 'current', text: 'Approved', icon: 'check' }
          ]
        };
      default:
        return {
          currentStep: 'submitted',
          steps: [
            { status: 'current', text: 'Application Submitted', icon: 'check' },
            { status: 'pending', text: 'Under Review', icon: 'clock' },
            { status: 'pending', text: 'Approved', icon: 'check' }
          ]
        };
    }
  };

  const statusDisplay = getStatusDisplay();

  return (
    <div className="min-h-screen bg-blue-900/90 text-white p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-blue-600/20 rounded-full flex items-center justify-center">
              <Clock className="w-10 h-10 text-blue-400" />
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-4">Awaiting Approval</h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Thank you for submitting your rights holder account application. 
            Our team is currently reviewing your information.
          </p>
        </div>

        {/* Status Card */}
        <div className="bg-blue-900/90 backdrop-blur-lg rounded-xl p-8 border border-white/20 mb-8">
          <div className="flex items-center mb-6">
            <Clock className="w-8 h-8 text-yellow-400 mr-3" />
            <h2 className="text-2xl font-semibold">Application Status</h2>
          </div>
          
          <div className="space-y-4">
            {statusDisplay.steps.map((step, index) => (
              <div 
                key={index}
                className={`flex items-center p-4 rounded-lg border ${
                  step.status === 'completed' 
                    ? 'bg-green-500/10 border-green-500/20' 
                    : step.status === 'current'
                    ? 'bg-yellow-500/10 border-yellow-500/20'
                    : 'bg-gray-500/10 border-gray-500/20 opacity-50'
                }`}
              >
                {step.icon === 'check' ? (
                  <CheckCircle className={`w-5 h-5 mr-3 ${
                    step.status === 'completed' ? 'text-green-400' : 'text-gray-400'
                  }`} />
                ) : (
                  <Clock className={`w-5 h-5 mr-3 ${
                    step.status === 'current' ? 'text-yellow-400' : 'text-gray-400'
                  }`} />
                )}
                <span className={
                  step.status === 'completed' ? 'text-green-300' :
                  step.status === 'current' ? 'text-yellow-300' : 'text-gray-300'
                }>
                  {step.text}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Application Details */}
        {applicationDetails && (
          <div className="bg-blue-900/90 backdrop-blur-lg rounded-xl p-8 border border-white/20 mb-8">
            <div className="flex items-center mb-6">
              <Building2 className="w-8 h-8 text-blue-400 mr-3" />
              <h2 className="text-2xl font-semibold">Application Details</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-4 text-blue-300">Company Information</h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-gray-400 text-sm">Company Name:</span>
                    <p className="text-white font-medium">{applicationDetails.company_name || 'Not provided'}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 text-sm">Rights Holder Type:</span>
                    <p className="text-white font-medium capitalize">
                      {applicationDetails.rights_holder_type?.replace('_', ' ') || 'Not specified'}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-400 text-sm">Business Structure:</span>
                    <p className="text-white font-medium capitalize">
                      {applicationDetails.business_structure?.replace('_', ' ') || 'Not specified'}
                    </p>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-4 text-blue-300">Contact Information</h3>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <Mail className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="text-white">{user?.email}</span>
                  </div>
                  {applicationDetails.phone && (
                    <div className="flex items-center">
                      <Phone className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-white">{applicationDetails.phone}</span>
                    </div>
                  )}
                  {applicationDetails.address_line_1 && (
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-white">
                        {applicationDetails.address_line_1}
                        {applicationDetails.city && `, ${applicationDetails.city}`}
                        {applicationDetails.state && `, ${applicationDetails.state}`}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* What Happens Next */}
        <div className="bg-blue-900/90 backdrop-blur-lg rounded-xl p-8 border border-white/20 mb-8">
          <h2 className="text-2xl font-semibold mb-6">What Happens Next?</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-blue-400 font-bold">1</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Review Process</h3>
              <p className="text-gray-300 text-sm">
                Our team will review your application and verify your business information.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-blue-400 font-bold">2</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Email Notification</h3>
              <p className="text-gray-300 text-sm">
                You'll receive an email notification once your application has been reviewed.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-blue-400 font-bold">3</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Access Granted</h3>
              <p className="text-gray-300 text-sm">
                Upon approval, you'll have full access to the rights holder dashboard.
              </p>
            </div>
          </div>
        </div>

        {/* Refresh Status Section */}
        <div className="bg-blue-900/90 backdrop-blur-lg rounded-xl p-8 border border-white/20 mb-8">
          <div className="text-center">
            <h2 className="text-2xl font-semibold mb-4">Check Approval Status</h2>
            <p className="text-gray-300 mb-6">
              If you've received an approval email, click the button below to refresh your status.
            </p>
            <button
              onClick={handleRefreshStatus}
              disabled={isRefreshing}
              className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white font-semibold rounded-lg transition-colors"
            >
              {isRefreshing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Refreshing...
                </>
              ) : (
                'Refresh Status'
              )}
            </button>
          </div>
        </div>

        {/* Support Information */}
        <div className="bg-blue-900/90 backdrop-blur-lg rounded-xl p-8 border border-white/20 mb-8">
          <div className="flex items-center mb-4">
            <AlertCircle className="w-6 h-6 text-blue-400 mr-2" />
            <h2 className="text-xl font-semibold">Need Help?</h2>
          </div>
          <p className="text-gray-300 mb-4">
            If you have any questions about your application or need to provide additional information, 
            please contact our support team.
          </p>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => navigate('/contact')}
              className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              <Mail className="w-4 h-4 mr-2" />
              Contact Support
            </button>
            <button
              onClick={handleSignOut}
              className="flex items-center px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Estimated Timeline */}
        <div className="text-center text-gray-400 text-sm">
          <p>Typical review time: 1-3 business days</p>
          <p className="mt-1">You'll be notified via email once your application is reviewed.</p>
        </div>
      </div>
    </div>
  );
}
