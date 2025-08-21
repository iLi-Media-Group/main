import React from 'react';
import { Link } from 'react-router-dom';
import { useRightsHolderAuth } from '../contexts/RightsHolderAuthContext';
import { Building2, CheckCircle, AlertCircle } from 'lucide-react';

export function RightsHolderTest() {
  const { user, rightsHolder, loading } = useRightsHolderAuth();

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

  return (
    <div className="min-h-screen bg-blue-900/90 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-2xl w-full">
        <div className="text-center mb-8">
          <Building2 className="w-16 h-16 text-blue-400 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-white mb-2">Rights Holders System Test</h1>
          <p className="text-gray-300">Testing the integration of the Rights Holders system</p>
        </div>

        <div className="space-y-6">
          {/* Authentication Status */}
          <div className="bg-gray-800/30 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Authentication Status</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-300">User Authenticated:</span>
                <div className="flex items-center">
                  {user ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-green-400 mr-2" />
                      <span className="text-green-400">Yes</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
                      <span className="text-red-400">No</span>
                    </>
                  )}
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Rights Holder Profile:</span>
                <div className="flex items-center">
                  {rightsHolder ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-green-400 mr-2" />
                      <span className="text-green-400">Yes</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
                      <span className="text-red-400">No</span>
                    </>
                  )}
                </div>
              </div>

              {rightsHolder && (
                <div className="bg-gray-700/50 rounded-lg p-4 mt-4">
                  <h3 className="text-lg font-medium text-white mb-2">Rights Holder Details</h3>
                  <div className="space-y-2 text-sm">
                    <div><span className="text-gray-400">Company:</span> <span className="text-white">{rightsHolder.company_name}</span></div>
                    <div><span className="text-gray-400">Type:</span> <span className="text-white">{rightsHolder.rights_holder_type}</span></div>
                    <div><span className="text-gray-400">Status:</span> <span className="text-white">{rightsHolder.verification_status}</span></div>
                    <div><span className="text-gray-400">Terms Accepted:</span> <span className="text-white">{rightsHolder.terms_accepted ? 'Yes' : 'No'}</span></div>
                    <div><span className="text-gray-400">Rights Authority Declaration:</span> <span className="text-white">{rightsHolder.rights_authority_declaration_accepted ? 'Accepted' : 'Pending'}</span></div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Navigation Links */}
          <div className="bg-gray-800/30 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Navigation Links</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link
                to="/rights-holder/signup"
                className="flex items-center justify-center p-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <Building2 className="w-5 h-5 mr-2" />
                Sign Up
              </Link>
              
              <Link
                to="/rights-holder/login"
                className="flex items-center justify-center p-4 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                <Building2 className="w-5 h-5 mr-2" />
                Login
              </Link>
              
              {rightsHolder && (
                <Link
                  to="/rights-holder/dashboard"
                  className="flex items-center justify-center p-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors md:col-span-2"
                >
                  <Building2 className="w-5 h-5 mr-2" />
                  Dashboard
                </Link>
              )}
            </div>
          </div>

          {/* Back to Main Site */}
          <div className="text-center">
            <Link
              to="/"
              className="inline-block px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              Back to Main Site
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
