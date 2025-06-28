import React, { useState, useEffect } from 'react';
import { User, Mail, X, MapPin, Upload, Loader2, Building2, FileText, Hash } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface ClientProfileProps {
  onClose: () => void;
  onUpdate?: () => void;
}

export function ClientProfile({ onClose, onUpdate }: ClientProfileProps) {
  const { user } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [businessType, setBusinessType] = useState<'sole-proprietor' | 'llc' | 'corporation' | 'partnership' | ''>('');
  const [ein, setEin] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('');
  const [avatarPath, setAvatarPath] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Check if business fields should be shown
  const showBusinessFields = companyName.trim().length > 0;
  const requiresEin = businessType === 'llc' || businessType === 'corporation' || businessType === 'partnership';

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      
      // First try to fetch with business fields
      let { data, error } = await supabase
        .from('profiles')
        .select('first_name, last_name, email, company_name, business_type, ein, business_name, street_address, city, state, postal_code, country, avatar_path')
        .eq('id', user?.id)
        .single();

      // If that fails (business fields don't exist yet), fall back to original fields
      if (error && error.code === '42703') { // Column doesn't exist error
        console.log('Business fields not available yet, using original fields');
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('profiles')
          .select('first_name, last_name, email, company_name, street_address, city, state, postal_code, country, avatar_path')
          .eq('id', user?.id)
          .single();
        
        if (fallbackError) throw fallbackError;
        data = fallbackData;
      } else if (error) {
        throw error;
      }

      if (data) {
        setFirstName(data.first_name || '');
        setLastName(data.last_name || '');
        setEmail(data.email || '');
        setCompanyName(data.company_name || '');
        setBusinessType(data.business_type || '');
        setEin(data.ein || '');
        setBusinessName(data.business_name || '');
        setStreetAddress(data.street_address || '');
        setCity(data.city || '');
        setState(data.state || '');
        setPostalCode(data.postal_code || '');
        setCountry(data.country || '');
        setAvatarPath(data.avatar_path);
        
        if (data.avatar_path) {
          const { data: { publicUrl } } = supabase.storage
            .from('profile-photos')
            .getPublicUrl(data.avatar_path.replace('profile-photos/', ''));
          setAvatarPreview(publicUrl);
        }
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    // Validate file size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('Image size must be less than 2MB');
      return;
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setSaving(true);
      setError('');
      setSuccess(false);

      // Upload avatar if changed
      let newAvatarPath = avatarPath;
      if (avatarFile) {
        const fileName = `${user.id}-${Date.now()}.jpg`;
        const filePath = `profile-photos/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('profile-photos')
          .upload(filePath, avatarFile, {
            contentType: 'image/jpeg',
            upsert: true
          });

        if (uploadError) throw uploadError;
        newAvatarPath = filePath;
      }

      // Prepare update data
      const updateData: any = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        company_name: companyName.trim() || null,
        street_address: streetAddress.trim() || null,
        city: city.trim() || null,
        state: state.trim() || null,
        postal_code: postalCode.trim() || null,
        country: country.trim() || null,
        avatar_path: newAvatarPath,
        updated_at: new Date().toISOString()
      };

      // Only include business fields if they exist (migration applied)
      if (businessType || ein || businessName) {
        updateData.business_type = businessType || null;
        updateData.ein = ein.trim() || null;
        updateData.business_name = businessName.trim() || null;
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
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
      <div className="bg-blue-900 p-6 rounded-xl border border-purple-500/20 w-full max-w-md max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
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
              <div className="relative">
                <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-800 border-2 border-blue-500/20">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-800">
                      <User className="w-16 h-16 text-gray-600" />
                    </div>
                  )}
                </div>
                <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity cursor-pointer rounded-full">
                  <Upload className="w-8 h-8 text-white" />
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    disabled={saving}
                  />
                </label>
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
              <p className="mt-1 text-xs text-gray-400">
                Email cannot be changed
              </p>
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

            {/* Business Information - Only show if company name is entered */}
            {showBusinessFields && (
              <div className="space-y-6 p-4 bg-white/5 rounded-lg border border-blue-500/20">
                <h3 className="text-lg font-medium text-white flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-blue-400" />
                  Business Information
                </h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Business Type <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={businessType}
                    onChange={(e) => setBusinessType(e.target.value as any)}
                    className="w-full bg-white/10 border border-blue-500/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                    required={showBusinessFields}
                  >
                    <option value="">Select business type</option>
                    <option value="sole-proprietor">Sole Proprietor</option>
                    <option value="llc">LLC (Limited Liability Company)</option>
                    <option value="corporation">Corporation</option>
                    <option value="partnership">Partnership</option>
                  </select>
                  <p className="mt-1 text-xs text-gray-400">
                    Required for tax and legal purposes
                  </p>
                </div>

                {requiresEin && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      EIN (Employer Identification Number) <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={ein}
                        onChange={(e) => setEin(e.target.value)}
                        className="w-full pl-10"
                        placeholder="XX-XXXXXXX"
                        required={requiresEin}
                        pattern="[0-9]{2}-[0-9]{7}"
                        title="EIN format: XX-XXXXXXX"
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-400">
                      Required for LLC, Corporation, and Partnership entities
                    </p>
                  </div>
                )}

                {businessType === 'sole-proprietor' && (
                  <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                    <p className="text-sm text-blue-300">
                      <strong>Note:</strong> Sole proprietors typically use their Social Security Number (SSN) for tax purposes instead of an EIN.
                    </p>
                  </div>
                )}
              </div>
            )}

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
    </div>
  );
}
