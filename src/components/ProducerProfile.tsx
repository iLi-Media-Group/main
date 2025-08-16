import React, { useState, useEffect } from 'react';
import { useStableDataFetch } from '../hooks/useStableEffect';
import { User, Mail, X, Phone, MapPin, Building2, Hash, Music, Info, Wallet, Lock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ProfilePhotoUpload } from './ProfilePhotoUpload';
import { ProducerUsageBadges } from './ProducerUsageBadges';
import { ChangePasswordModal } from './ChangePasswordModal';

interface ProducerProfileProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileUpdated?: () => void;
}

export function ProducerProfile({ isOpen, onClose, onProfileUpdated }: ProducerProfileProps) {
  const { user } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [producerNumber, setProducerNumber] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('');
  const [ipiNumber, setIpiNumber] = useState('');
  const [performingRightsOrg, setPerformingRightsOrg] = useState('');

  const [ein, setEin] = useState('');
  const [businessStructure, setBusinessStructure] = useState('');
  const [avatarPath, setAvatarPath] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [bio, setBio] = useState('');
  const [showChangePassword, setShowChangePassword] = useState(false);
  
  // Usage badges state
  const [usesLoops, setUsesLoops] = useState(false);
  const [usesSamples, setUsesSamples] = useState(false);
  const [usesSplice, setUsesSplice] = useState(false);

  // Use stable effect to prevent unwanted refreshes
  useStableDataFetch(
    fetchProfile,
    [user],
    () => !!user
  );

  const fetchProfile = async () => {
    try {
      setLoading(true);
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
        setProducerNumber(data.producer_number || '');
        setPhoneNumber(data.phone_number || '');
        setStreetAddress(data.street_address || '');
        setCity(data.city || '');
        setState(data.state || '');
        setPostalCode(data.postal_code || '');
        setCountry(data.country || '');
        setIpiNumber(data.ipi_number || '');
        setPerformingRightsOrg(data.performing_rights_org || '');

        setEin(data.ein || '');
        setBusinessStructure(data.business_structure || '');
        setBio(data.bio || '');
        setAvatarPath(data.avatar_path);
        
        // Load usage badge fields
        setUsesLoops(data.uses_loops || false);
        setUsesSamples(data.uses_samples || false);
        setUsesSplice(data.uses_splice || false);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpdate = (newAvatarPath: string) => {
    setAvatarPath(newAvatarPath);
    if (onProfileUpdated) {
      onProfileUpdated();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setSaving(true);
      setError('');
      setSuccess(false);

      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          display_name: displayName.trim() || null,
          company_name: companyName.trim() || null,
          phone_number: phoneNumber.trim() || null,
          street_address: streetAddress.trim() || null,
          city: city.trim() || null,
          state: state.trim() || null,
          postal_code: postalCode.trim() || null,
          country: country.trim() || null,
          ipi_number: ipiNumber.trim() || null,
          performing_rights_org: performingRightsOrg.trim() || null,

          ein: ein.trim() || null,
          business_structure: businessStructure || null,
          bio: bio.trim() || null,
          
          // Note: Production tool badges are managed by admin, not editable by producers
          
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        if (onProfileUpdated) {
          onProfileUpdated();
        }
      }, 3000);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-blue-900/90 backdrop-blur-md p-6 rounded-xl border border-purple-500/20 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Producer Profile</h2>
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
                <p className="text-red-400 text-center">{error}</p>
              </div>
            )}

            {success && (
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                <p className="text-green-400 text-center">Profile updated successfully!</p>
              </div>
            )}

            {/* Profile Photo Upload */}
            <div className="flex justify-center mb-6">
              <ProfilePhotoUpload
                currentPhotoUrl={avatarPath}
                onPhotoUpdate={handlePhotoUpdate}
                size="lg"
                userId={user?.id}
              />
            </div>

            {/* Producer Credit Name */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Producer Credit Name
              </label>
              <div className="flex items-center space-x-2 bg-blue-950/60 border border-blue-700 text-white rounded-lg px-4 py-2">
                <User className="w-5 h-5 text-gray-400" />
                <span className="font-semibold text-lg">{firstName} {lastName}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Producer Number
                </label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={producerNumber}
                    className="w-full pl-10 opacity-50"
                    disabled
                  />
                </div>
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
              </div>
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
                className="w-full flex items-center justify-center px-4 py-2 bg-blue-950/60 border border-blue-700 hover:bg-blue-900 text-white rounded-lg transition-colors"
              >
                <Lock className="w-4 h-4 mr-2" />
                Change Password
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    className="w-full pl-10 bg-blue-950/60 border border-blue-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
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
                    className="w-full pl-10 bg-blue-950/60 border border-blue-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Display Name (Artist Name)
              </label>
              <div className="relative">
                <Music className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full pl-10 bg-blue-950/60 border border-blue-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="Your artist name or stage name"
                />
              </div>
              <p className="mt-1 text-xs text-gray-400">
                This will be used in welcome messages and can be your artist/stage name
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Company Name
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full pl-10 bg-blue-950/60 border border-blue-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="Your publishing company or label name"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  EIN (Tax ID)
                </label>
                <input
                  type="text"
                  value={ein}
                  onChange={e => setEin(e.target.value)}
                  className="w-full bg-blue-950/60 border border-blue-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 p-3"
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
                  className="w-full bg-blue-950/60 border border-blue-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 p-3"
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
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full pl-10 bg-blue-950/60 border border-blue-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="International format"
                />
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-lg font-medium text-white">Music Rights Information</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  IPI Number <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Music className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={ipiNumber}
                    onChange={(e) => setIpiNumber(e.target.value)}
                    className={`w-full pl-10 bg-blue-950/60 border border-blue-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 ${!ipiNumber.trim() ? 'border-red-500' : ''}`}
                    required
                  />
                </div>
                {!ipiNumber.trim() && (
                  <p className="mt-1 text-sm text-red-400">IPI Number is required</p>
                )}
                <p className="mt-1 text-xs text-gray-400">
                  Your Interested Parties Information number from your PRO
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Performing Rights Organization <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Info className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <select
                    value={performingRightsOrg}
                    onChange={(e) => setPerformingRightsOrg(e.target.value)}
                    className={`w-full pl-10 bg-blue-950/60 border border-blue-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 ${!performingRightsOrg ? 'border-red-500' : ''}`}
                    required
                  >
                    <option value="">Select your PRO</option>
                    <option value="ASCAP">ASCAP</option>
                    <option value="BMI">BMI</option>
                    <option value="SESAC">SESAC</option>
                    <option value="GMR">Global Music Rights</option>
                    <option value="PRS">PRS for Music (UK)</option>
                    <option value="SOCAN">SOCAN (Canada)</option>
                    <option value="APRA">APRA AMCOS (Australia/NZ)</option>
                    <option value="SACEM">SACEM (France)</option>
                    <option value="GEMA">GEMA (Germany)</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                {!performingRightsOrg && (
                  <p className="mt-1 text-sm text-red-400">PRO is required</p>
                )}
              </div>
            </div>



            <div>
              <h3 className="text-lg font-medium text-white">Address Information</h3>
              
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
                    className="w-full pl-10 bg-blue-950/60 border border-blue-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
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
                    className="w-full bg-blue-950/60 border border-blue-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 p-3"
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
                    className="w-full bg-blue-950/60 border border-blue-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 p-3"
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
                    className="w-full bg-blue-950/60 border border-blue-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 p-3"
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
                    className="w-full bg-blue-950/60 border border-blue-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 p-3"
                  />
                </div>
              </div>
            </div>

            {/* Bio field */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Bio (max 800 characters)
              </label>
              <textarea
                value={bio}
                onChange={e => {
                  if (e.target.value.length <= 800) setBio(e.target.value);
                }}
                maxLength={800}
                rows={5}
                className="w-full rounded-lg bg-blue-950/60 border border-blue-700 text-white p-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Tell clients about yourself, your experience, and your music (max 800 characters)"
              />
              <div className="text-xs text-gray-400 text-right mt-1">{bio.length}/800</div>
            </div>

            {/* Production Tools Badges (Admin Controlled) */}
            <div>
              <h3 className="text-lg font-medium text-white mb-4">Production Tools</h3>
              <p className="text-sm text-gray-400 mb-4">
                Your verified production tools (managed by admin)
              </p>
              
              <div className="p-4 bg-blue-950/20 rounded-lg border border-blue-700/30">
                <ProducerUsageBadges 
                  usesLoops={usesLoops}
                  usesSamples={usesSamples}
                  usesSplice={usesSplice}
                />
                {!usesLoops && !usesSamples && !usesSplice && (
                  <p className="text-sm text-gray-500 mt-2">No production tools verified yet</p>
                )}
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 px-6 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Changes'}
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
