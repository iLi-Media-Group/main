import React from 'react';
import { Navigate } from 'react-router-dom';
import { useRightsHolderAuth } from '../contexts/RightsHolderAuthContext';
import { Loader2 } from 'lucide-react';

interface RightsHolderProtectedRouteProps {
  children: React.ReactNode;
  requireVerification?: boolean;
}

export function RightsHolderProtectedRoute({ 
  children, 
  requireVerification = false 
}: RightsHolderProtectedRouteProps) {
  const { user, rightsHolder, loading } = useRightsHolderAuth();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user || !rightsHolder) {
    return <Navigate to="/rights-holder/login" replace />;
  }

  // Check if account is active
  if (!rightsHolder.is_active) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Account Suspended</h2>
          <p className="text-gray-300 mb-4">
            Your account has been suspended. Please contact support for assistance.
          </p>
          <a
            href="mailto:support@mybeatfi.com"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            Contact Support
          </a>
        </div>
      </div>
    );
  }

  // Check verification status if required
  if (requireVerification && rightsHolder.verification_status !== 'verified') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Account Verification Required</h2>
          <p className="text-gray-300 mb-4">
            Your account is currently under review. You'll be notified once verification is complete.
          </p>
          <p className="text-sm text-gray-400">
            Status: {rightsHolder.verification_status}
          </p>
        </div>
      </div>
    );
  }

     // Check if terms have been accepted
   if (!rightsHolder.terms_accepted) {
     return (
       <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
         <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-md w-full text-center">
           <h2 className="text-2xl font-bold text-white mb-4">Terms Acceptance Required</h2>
           <p className="text-gray-300 mb-4">
             You must accept the updated terms of service to continue.
           </p>
           <a
             href="/rights-holder/terms"
             className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
           >
             Review Terms
           </a>
         </div>
       </div>
     );
   }

   // Check if rights authority declaration has been accepted
   if (!rightsHolder.rights_authority_declaration_accepted) {
     return (
       <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
         <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-md w-full text-center">
           <h2 className="text-2xl font-bold text-white mb-4">Rights Authority Declaration Required</h2>
           <p className="text-gray-300 mb-4">
             You must accept the Rights Authority Declaration to continue. This declaration confirms your legal authority to administer and license music content.
           </p>
           <a
             href="/rights-holder/declaration"
             className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
           >
             Review Declaration
           </a>
         </div>
       </div>
     );
   }

  // All checks passed, render the protected content
  return <>{children}</>;
}
