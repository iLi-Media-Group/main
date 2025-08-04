import React, { useState, useEffect } from 'react';
import { X, AlertCircle, FileText, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Track } from '../types';
import { LicenseTermsSummary } from './LicenseTermsSummary';
import { sendLicenseEmail } from '../lib/email';
import { LicenseConfirmationDialog } from './LicenseConfirmationDialog';
import { CryptoPaymentButton } from './CryptoPaymentButton';

interface LicenseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  track: Track;
  membershipType: 'Single Track' | 'Gold Access' | 'Platinum Access' | 'Ultimate Access';
  remainingLicenses: number;
  onLicenseCreated?: () => void;
}

interface ProfileInfo {
  first_name: string;
  last_name: string;
  email: string;
}

const getExpirationDate = (licenseType: string, purchaseDate: string): string => {
  const purchase = new Date(purchaseDate);

  switch (licenseType) {
    case 'Ultimate Access':
      return 'Perpetual (No Expiration)';
    case 'Platinum Access':
      purchase.setFullYear(purchase.getFullYear() + 3); // 3 years
      break;
    case 'Gold Access':
    case 'Single Track':
    default:
      purchase.setFullYear(purchase.getFullYear() + 1); // 1 year
  }

  return purchase.toLocaleDateString();
};

export function LicenseDialog({
  isOpen,
  onClose,
  track,
  membershipType,
  remainingLicenses,
  onLicenseCreated
}: LicenseDialogProps) {
  const { user, refreshMembership } = useAuth();
  const [step, setStep] = useState<'terms' | 'profile' | 'confirm'>('terms');
  const [profile, setProfile] = useState<ProfileInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [createdLicenseId, setCreatedLicenseId] = useState<string | null>(null);
  const [showExistingLicenseWarning, setShowExistingLicenseWarning] = useState(false);
  const [existingLicensesInfo, setExistingLicensesInfo] = useState<{count: number, latestDate: string} | null>(null);

  useEffect(() => {
    if (isOpen && user) {
      fetchProfile();
    }
  }, [isOpen, user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('first_name, last_name, email, membership_plan')
        .eq('id', user?.id)
        .single();

      if (error) throw error;

      if (data) {
        setProfile(data);
        setFirstName(data.first_name || '');
        setLastName(data.last_name || '');
        setEmail(data.email || '');
        
        // Refresh membership info to ensure we have the latest
        await refreshMembership();
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to load profile');
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          email: email.trim()
        })
        .eq('id', user?.id);

      if (updateError) throw updateError;

      setProfile({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim()
      });
      setStep('confirm');
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleLicense = async () => {
    if (!user || !profile) return;

    try {
      setLoading(true);
      setError('');

      // Check for existing licenses but don't prevent creation
      const { data: existingLicenses, error: checkError } = await supabase
        .from('sales')
        .select('id, created_at, license_type')
        .eq('track_id', track.id)
        .eq('buyer_id', user.id)
        .is('deleted_at', null);

      if (checkError) {
        console.error('Error checking existing licenses:', checkError);
      } else if (existingLicenses && existingLicenses.length > 0) {
        // Show a warning but allow the user to proceed
        const existingCount = existingLicenses.length;
        const latestLicense = existingLicenses.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0];
        
        const warningMessage = `You already have ${existingCount} license${existingCount > 1 ? 's' : ''} for this track (latest: ${new Date(latestLicense.created_at).toLocaleDateString()}). You can license this track again for different projects.`;
        
        // Show the warning dialog instead of just logging
        setExistingLicensesInfo({
          count: existingCount,
          latestDate: new Date(latestLicense.created_at).toLocaleDateString()
        });
        setShowExistingLicenseWarning(true);
        setLoading(false);
        return; // Stop here and wait for user confirmation
      }

      // If no existing licenses or user confirmed, proceed with license creation
      await createLicenseRecord();
    } catch (err) {
      console.error('Error creating license:', err);
      setError(err instanceof Error ? err.message : 'Failed to create license');
    } finally {
      setLoading(false);
    }
  };

  const createLicenseRecord = async () => {
    if (!user || !profile) return;

    try {
      setLoading(true);
      setError('');

      const purchaseDate = new Date().toISOString();

      // Create license record with correct sale_producer_id
      const { data: license, error: licenseError } = await supabase
        .from('sales')
        .insert([
          {
            track_id: track.id,
            sale_producer_id: track.producerId, // Use correct column name
            buyer_id: user.id,
            license_type: membershipType,
            amount: 0,
            payment_method: 'subscription',
            created_at: purchaseDate,
            licensee_info: {
              name: `${profile.first_name} ${profile.last_name}`,
              email: profile.email
            },
            stems_path: track.stemsUrl || null,
            trackouts_path: track.trackoutsUrl || null,
            split_sheet_path: track.splitSheetUrl || null
          }
        ])
        .select('id')
        .single();

      if (licenseError) {
        console.error('License creation error:', licenseError);
        throw new Error('Failed to create license. Please try again.');
      }

      if (!license) {
        throw new Error('No license data returned after creation');
      }

      setCreatedLicenseId(license.id);
      setShowConfirmation(true);
      
      // Show success message
      console.log('License created successfully!', license.id);
      alert(`License created successfully for "${track.title}"!`);
      
      // Redirect to dashboard for Gold, Platinum, or Ultimate
      if (["Gold Access", "Platinum Access", "Ultimate Access"].includes(membershipType)) {
        setTimeout(() => {
          window.location.href = "/client-dashboard";
        }, 2000); // 2 seconds delay
      }
      
      // Call the callback if provided
      if (onLicenseCreated) {
        onLicenseCreated();
      }
    } catch (err) {
      console.error('Error creating license:', err);
      setError(err instanceof Error ? err.message : 'Failed to create license');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Check if user has available licenses
  if (membershipType === 'Gold Access' && remainingLicenses <= 0) {
    const nextPlan = 'Platinum Access';
    return (
      <div className="fixed inset-0 bg-blue-900/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="p-6 rounded-xl border border-purple-500/20 w-full max-w-md bg-blue-900/90">
          <h3 className="text-xl font-bold text-white mb-4">License Limit Reached</h3>
          <p className="text-gray-300 mb-6">
            You've used all your available licenses under the Gold Access plan.
            Upgrade to {nextPlan} for unlimited licensing!
          </p>
          <div className="flex justify-end space-x-4">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <a
              href="/upgrade"
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              Upgrade Now
            </a>
          </div>
        </div>
      </div>
    );
  }

  const purchaseDate = new Date().toISOString();

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4" onClick={onClose}>
        <div className="bg-blue-900/90 p-4 sm:p-6 rounded-xl border border-purple-500/20 w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h3 className="text-lg sm:text-xl font-bold text-white">License Track</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors p-1"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>

          {error && (
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-400 text-center text-sm sm:text-base">{error}</p>
            </div>
          )}

          {step === 'terms' && (
            <LicenseTermsSummary
              licenseType={membershipType}
              trackId={track.id}
              onAccept={() => {
                if (!profile?.first_name || !profile?.last_name || !profile?.email) {
                  setStep('profile');
                } else {
                  setStep('confirm');
                }
              }}
            />
          )}

          {step === 'profile' && (
            <form onSubmit={handleProfileSubmit} className="space-y-4 sm:space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-3 py-2 bg-white/10 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-3 py-2 bg-white/10 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-white/10 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-4 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-4 py-2 text-gray-300 hover:text-white transition-colors"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Continue'}
                </button>
              </div>
            </form>
          )}

          {step === 'confirm' && profile && (
            <div className="space-y-4 sm:space-y-6">
              <div className="bg-white/5 rounded-lg p-4 sm:p-6">
                <h4 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">License Summary</h4>
                <div className="space-y-2 sm:space-y-3 text-sm sm:text-base">
                  <p className="text-gray-300">
                    <span className="font-medium text-white">Track:</span> {track.title}
                  </p>
                  <p className="text-gray-300">
                    <span className="font-medium text-white">License Type:</span> {membershipType}
                  </p>
                  <p className="text-gray-300">
                    <span className="font-medium text-white">Purchase Date:</span>{' '}
                    {new Date(purchaseDate).toLocaleDateString()}
                  </p>
                  <p className="text-gray-300">
                    <span className="font-medium text-white">Expiration Date:</span>{' '}
                    {getExpirationDate(membershipType, purchaseDate)}
                  </p>
                  <p className="text-gray-300">
                    <span className="font-medium text-white">Licensee:</span>{' '}
                    {profile.first_name} {profile.last_name}
                  </p>
                  <p className="text-gray-300">
                    <span className="font-medium text-white">Email:</span> {profile.email}
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-4 pt-4">
                <button
                  onClick={onClose}
                  className="w-full sm:w-auto px-4 py-2 text-gray-300 hover:text-white transition-colors"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleLicense}
                  className="w-full sm:w-auto px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center justify-center"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <FileText className="w-5 h-5 mr-2" />
                      Confirm & License
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <LicenseConfirmationDialog
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        trackTitle={track.title}
        licenseType={membershipType}
        licenseId={createdLicenseId || ''}
      />

      {/* Existing License Warning Dialog */}
      {showExistingLicenseWarning && existingLicensesInfo && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-blue-900/90 border border-purple-500/20 rounded-xl p-4 sm:p-6 max-w-sm sm:max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg sm:text-xl font-bold text-white">Multiple Licenses</h3>
              <button
                onClick={() => {
                  setShowExistingLicenseWarning(false);
                  setExistingLicensesInfo(null);
                }}
                className="text-gray-400 hover:text-white transition-colors p-1"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
            
            <div className="mb-4 sm:mb-6">
              <p className="text-gray-300 mb-3 sm:mb-4 text-sm sm:text-base">
                You already have {existingLicensesInfo.count} license{existingLicensesInfo.count > 1 ? 's' : ''} for this track 
                (latest: {existingLicensesInfo.latestDate}).
              </p>
              <p className="text-blue-200 text-xs sm:text-sm">
                You can license this track again for different projects. Each license is valid for separate commercial use.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-4">
              <button
                onClick={() => {
                  setShowExistingLicenseWarning(false);
                  setExistingLicensesInfo(null);
                }}
                className="w-full sm:w-auto px-4 py-2 text-gray-300 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowExistingLicenseWarning(false);
                  setExistingLicensesInfo(null);
                  createLicenseRecord();
                }}
                className="w-full sm:w-auto px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
