import React from 'react';
import { TrackDurationUpdater } from '../components/TrackDurationUpdater';
import { useUnifiedAuth } from '../contexts/UnifiedAuthContext';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function TrackDurationAdminPage() {
  const { user, accountType } = useUnifiedAuth();
  const navigate = useNavigate();

  // Debug logging
  console.log('🔐 TrackDurationAdminPage access check:', {
    userEmail: user?.email,
    accountType: accountType,
    user: user
  });

  // Only allow producers or admins to access this page
  // Check for admin email first, then account type
  const isAdmin = user?.email && ['knockriobeats@gmail.com', 'info@mybeatfi.io', 'derykbanks@yahoo.com', 'knockriobeats2@gmail.com'].includes(user.email.toLowerCase());
  const isProducer = accountType === 'producer' || (accountType && accountType.includes('producer'));
  const isAdminAccount = accountType === 'admin' || (accountType && accountType.includes('admin'));
  
  console.log('🔐 Access control variables:', {
    isAdmin,
    isProducer,
    isAdminAccount,
    finalAccess: isAdmin || isProducer || isAdminAccount
  });
  
  if (!user || (!isAdmin && !isProducer && !isAdminAccount)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-gray-300">You don't have permission to access this page.</p>
          <p className="text-gray-400 text-sm mt-2">User: {user?.email} | Account Type: {accountType}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-blue-300 hover:text-blue-200 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          
          <h1 className="text-3xl font-bold text-white mb-2">
            Track Duration Management
          </h1>
          <p className="text-gray-300">
            Update track durations by calculating them from the actual audio files.
          </p>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-gray-900/80 border border-gray-700 rounded-xl p-6">
            <TrackDurationUpdater />
          </div>
        </div>

        {/* Instructions */}
        <div className="max-w-4xl mx-auto mt-8">
          <div className="bg-blue-950/80 border border-blue-500/40 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-blue-200 mb-4">
              How it works:
            </h3>
            <ul className="text-blue-100 space-y-2">
              <li>• Finds tracks with missing, default (3:30), or zero (0:00) durations</li>
              <li>• Loads each audio file and extracts the actual duration</li>
              <li>• Updates the database with the correct duration</li>
              <li>• Shows progress and results for each track</li>
              <li>• Handles errors gracefully and continues with other tracks</li>
            </ul>
            
            <div className="mt-4 p-4 bg-yellow-900/80 border border-yellow-500/40 rounded-lg">
              <h4 className="text-yellow-200 font-semibold mb-2">Important Notes:</h4>
              <ul className="text-yellow-100 text-sm space-y-1">
                <li>• Audio files must be accessible via URL</li>
                <li>• CORS must be enabled for the audio files</li>
                <li>• Process may take time for large numbers of tracks</li>
                <li>• Only updates tracks that need duration fixes</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
