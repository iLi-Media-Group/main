import React from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useUnifiedAuth } from '../contexts/UnifiedAuthContext';
import { Loader2, Building2, AlertCircle, Clock, FileText } from 'lucide-react';

interface RightsHolderProtectedRouteProps {
  children: React.ReactNode;
  requireVerification?: boolean;
}

export function RightsHolderProtectedRoute({ 
  children, 
  requireVerification = false 
}: RightsHolderProtectedRouteProps) {
  const { user, profile, accountType, loading, signOut } = useUnifiedAuth();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-blue-900/90 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-blue-900/90 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-md w-full">
          <div className="text-center">
            <Building2 className="w-12 h-12 text-blue-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Authentication Required</h2>
            <p className="text-gray-300 mb-6">
              Please sign in to access the rights holder dashboard.
            </p>
            <Link
              to="/rights-holder/login"
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Check if user is a rights holder
  if (!profile || accountType !== 'rights_holder') {
    return (
      <div className="min-h-screen bg-blue-900/90 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-md w-full">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Account Not Found</h2>
            <p className="text-gray-300 mb-6">
              Your rights holder account could not be found. Please contact support.
            </p>
            <button
              onClick={signOut}
              className="inline-flex items-center px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (profile.verification_status === 'pending') {
    return (
      <div className="min-h-screen bg-blue-900/90 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-md w-full">
          <div className="text-center">
            <Clock className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Account Pending Verification</h2>
            <p className="text-gray-300 mb-6">
              Your rights holder account is pending verification. You'll be notified once it's approved.
            </p>
            <button
              onClick={signOut}
              className="inline-flex items-center px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!profile.terms_accepted || !profile.rights_authority_declaration_accepted) {
    return (
      <div className="min-h-screen bg-blue-900/90 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-md w-full">
          <div className="text-center">
            <FileText className="w-12 h-12 text-blue-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Terms Acceptance Required</h2>
            <p className="text-gray-300 mb-6">
              Please accept the terms and conditions to continue.
            </p>
            <Link
              to="/rights-holder/terms"
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Review Terms
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // All checks passed, render the protected content
  return <>{children}</>;
}
