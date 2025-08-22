import React, { useState, useEffect } from 'react';
import { useStableDataFetch } from '../hooks/useStableEffect';
import { User, Mail, X, MapPin, Upload, Loader2, Building2, Lock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useUnifiedAuth } from '../contexts/UnifiedAuthContext';
import { ProfilePhotoUpload } from './ProfilePhotoUpload';
import { ChangePasswordModal } from './ChangePasswordModal';

interface ClientProfileProps {
  onClose: () => void;
  onUpdate?: () => void;
}

export function ClientProfile({ onClose, onUpdate }: ClientProfileProps) {
  const { user } = useUnifiedAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('');
  const [avatarPath, setAvatarPath] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [ein, setEin] = useState('');
  const [businessStructure, setBusinessStructure] = useState('');
  const [showChangePassword, setShowChangePassword] = useState(false);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      
      if (!user?.id) {
        throw new Error('User not authenticated');
      }
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error) throw error;

      if (data) {
        setFirstName(data.first_name || '');
        setLastName(data.last_name || '');
        setDisplayName(data.display_name || '');
        setEmail(data.email || '');
        setCompanyName(data.company_name || '');
        setStreetAddress(data.street_address || '');
        setCity(data.city || '');
        setState(data.state || '');
        setPostalCode(data.postal_code || '');
        setCountry(data.country || '');
        setAvatarPath(data.avatar_path);
        setEin(data.ein || '');
        setBusinessStructure(data.business_structure || '');
        
        if (data.avatar_path) {
          const { data: { publicUrl } } = supabase.storage
            .from('profile-photos')
            .getPublicUrl(data.avatar_path.replace('profile-photos/', ''));
          // setAvatarPreview(publicUrl); // This line is removed as per new_code
        }
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      console.error('User ID:', user?.id);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  // Use stable effect to prevent unwanted refreshes
  useStableDataFetch(
    fetchProfile,
    [user],
    () => !!user
  );

  // Add handler for photo update
  const handlePhotoUpdate = (newAvatarPath: string) => {
    setAvatarPath(newAvatarPath);
    fetchProfile(); // Refresh profile info and image
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setSaving(true);
      setError('');
      setSuccess(false);

      // Only update profile fields, not avatar_path
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          display_name: displayName.trim() || null,
          company_name: companyName.trim() || null,
          street_address: streetAddress.trim() || null,
          city: city.trim() || null,
          state: state.trim() || null,
          postal_code: postalCode.trim() || null,
          country: country.trim() || null,
          ein: ein.trim() || null,
          business_structure: businessStructure || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      setSuccess(true);
      if (onUpdate) {
        onUpdate();
      }
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-blue-900/90 backdrop-blur-md p-6 rounded-xl border border-purple-500/20 w-full max-w-md max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Edit Profile</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-red-400 text-center font-medium">{error}</p>
              </div>
            )}

            {success && (
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                <p className="text-green-400 text-center">Profile updated successfully!</p>
              </div>
            )}

            <div className="flex justify-center mb-6">
              <ProfilePhotoUpload
                currentPhotoUrl={avatarPath}
                onPhotoUpdate={handlePhotoUpdate}
                size="md"
                userId={user?.id}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  className="w-full pl-10 opacity-50"
                  disabled
                />
              </div>
              <p className="mt-1 text-xs text-gray-400">
                Email cannot be changed
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowChangePassword(true);
                }}
                className="w-full flex items-center justify-center px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                <Lock className="w-4 h-4 mr-2" />
                Change Password
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                First Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full pl-10"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Last Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full pl-10"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Display Name (Optional)
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full pl-10"
                  placeholder="Your preferred display name"
                />
              </div>
              <p className="mt-1 text-xs text-gray-400">
                This will be used in welcome messages (defaults to first name if not set)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Company Name (Optional)
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full pl-10"
                  placeholder="Your company or organization name"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                EIN (Tax ID)
              </label>
              <input
                type="text"
                value={ein}
                onChange={e => setEin(e.target.value)}
                className="w-full"
                placeholder="Employer Identification Number"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Business Structure
              </label>
              <select
                value={businessStructure}
                onChange={e => setBusinessStructure(e.target.value)}
                className="w-full"
              >
                <option value="">Select...</option>
                <option value="Corporation">Corporation</option>
                <option value="LLC">LLC</option>
                <option value="Partnership">Partnership</option>
                <option value="Sole Proprietor">Sole Proprietor</option>
                <option value="Nonprofit">Nonprofit</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="space-y-6">
              <h3 className="text-lg font-medium text-white">Address Information (Optional)</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Street Address
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={streetAddress}
                    onChange={(e) => setStreetAddress(e.target.value)}
                    className="w-full pl-10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    State/Province/Region
                  </label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Postal Code
                  </label>
                  <input
                    type="text"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Country
                  </label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 px-6 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
              disabled={saving}
            >
              {saving ? (
                <span className="flex items-center justify-center">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Saving...
                </span>
              ) : (
                'Save Changes'
              )}
            </button>
          </form>
        )}
      </div>
      
      <ChangePasswordModal 
        isOpen={showChangePassword}
        onClose={() => setShowChangePassword(false)}
      />
    </div>
  );
}
