import React, { useState, useEffect } from 'react';
import { useUnifiedAuth } from '../contexts/UnifiedAuthContext';
import { supabase } from '../lib/supabase';
import { 
  ArrowLeft, 
  Save, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle,
  Building2,
  User,
  Mail,
  Phone,
  MapPin,
  Globe,
  FileText,
  Shield,
  Settings,
  Edit,
  Camera
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface RightsHolderProfileProps {
  onClose?: () => void;
  onProfileUpdated?: () => void;
}

export function RightsHolderProfile({ onClose, onProfileUpdated }: RightsHolderProfileProps) {
  const { user, profile } = useUnifiedAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Form state
  const [companyName, setCompanyName] = useState('');
  const [legalEntityName, setLegalEntityName] = useState('');
  const [rightsHolderType, setRightsHolderType] = useState<'record_label' | 'publisher'>('record_label');
  const [businessStructure, setBusinessStructure] = useState('');
  const [taxId, setTaxId] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('');
  const [description, setDescription] = useState('');
  const [contactPersonName, setContactPersonName] = useState('');
  const [contactPersonTitle, setContactPersonTitle] = useState('');
  const [contactPersonEmail, setContactPersonEmail] = useState('');
  const [contactPersonPhone, setContactPersonPhone] = useState('');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactEmail, setEmergencyContactEmail] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');
  const [yearsInBusiness, setYearsInBusiness] = useState<number>(0);
  const [logoUrl, setLogoUrl] = useState('');

  useEffect(() => {
    if (profile) {
      loadProfileData();
    }
  }, [profile]);

  const loadProfileData = () => {
    if (!profile) return;

    setCompanyName(profile.company_name || '');
    setLegalEntityName(profile.legal_entity_name || '');
    setRightsHolderType(profile.rights_holder_type || 'record_label');
    setBusinessStructure(profile.business_structure || '');
    setTaxId(profile.tax_id || '');
    setPhone(profile.phone || '');
    setWebsite(profile.website || '');
    setAddressLine1(profile.address_line_1 || '');
    setAddressLine2(profile.address_line_2 || '');
    setCity(profile.city || '');
    setState(profile.state || '');
    setPostalCode(profile.postal_code || '');
    setCountry(profile.country || '');
    setDescription(profile.description || '');
    setContactPersonName(profile.contact_person_name || '');
    setContactPersonTitle(profile.contact_person_title || '');
    setContactPersonEmail(profile.contact_person_email || '');
    setContactPersonPhone(profile.contact_person_phone || '');
    setEmergencyContactName(profile.emergency_contact_name || '');
    setEmergencyContactEmail(profile.emergency_contact_email || '');
    setEmergencyContactPhone(profile.emergency_contact_phone || '');
    setYearsInBusiness(profile.years_in_business || 0);
    setLogoUrl(profile.logo_url || '');
    setLoading(false);
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    setError('');
    setSuccess(false);

    try {
      const updateData = {
        company_name: companyName,
        legal_entity_name: legalEntityName,
        rights_holder_type: rightsHolderType,
        business_structure: businessStructure,
        tax_id: taxId,
        phone,
        website,
        address_line_1: addressLine1,
        address_line_2: addressLine2,
        city,
        state,
        postal_code: postalCode,
        country,
        description,
        contact_person_name: contactPersonName,
        contact_person_title: contactPersonTitle,
        contact_person_email: contactPersonEmail,
        contact_person_phone: contactPersonPhone,
        emergency_contact_name: emergencyContactName,
        emergency_contact_email: emergencyContactEmail,
        emergency_contact_phone: emergencyContactPhone,
        years_in_business: yearsInBusiness,
        logo_url: logoUrl,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (error) throw error;

      setSuccess(true);
      if (onProfileUpdated) {
        onProfileUpdated();
      }

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      navigate(-1);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-400" />
            <span className="ml-3 text-lg">Loading profile...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-6">
          <button
            onClick={handleClose}
            className="flex items-center text-gray-400 hover:text-white transition-colors mr-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </button>
          <h1 className="text-3xl font-bold">Rights Holder Profile</h1>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 p-4 bg-green-900/50 border border-green-500 rounded-lg flex items-center">
            <CheckCircle className="w-5 h-5 text-green-400 mr-2" />
            <span>Profile updated successfully!</span>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-900/50 border border-red-500 rounded-lg flex items-center">
            <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
            <span>{error}</span>
          </div>
        )}

        {/* Profile Form */}
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Company Information */}
            <div className="space-y-6">
              <div className="flex items-center mb-4">
                <Building2 className="w-5 h-5 mr-2 text-blue-400" />
                <h2 className="text-xl font-semibold">Company Information</h2>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Company Name *</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
                  placeholder="Enter company name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Legal Entity Name</label>
                <input
                  type="text"
                  value={legalEntityName}
                  onChange={(e) => setLegalEntityName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
                  placeholder="Legal entity name if different"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Rights Holder Type *</label>
                <select
                  value={rightsHolderType}
                  onChange={(e) => setRightsHolderType(e.target.value as 'record_label' | 'publisher')}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
                >
                  <option value="record_label">Record Label</option>
                  <option value="publisher">Publisher</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Business Structure</label>
                <select
                  value={businessStructure}
                  onChange={(e) => setBusinessStructure(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
                >
                  <option value="">Select business structure</option>
                  <option value="sole_proprietorship">Sole Proprietorship</option>
                  <option value="llc">LLC</option>
                  <option value="corporation">Corporation</option>
                  <option value="partnership">Partnership</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Tax ID</label>
                <input
                  type="text"
                  value={taxId}
                  onChange={(e) => setTaxId(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
                  placeholder="EIN or Tax ID"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Years in Business</label>
                <input
                  type="number"
                  value={yearsInBusiness}
                  onChange={(e) => setYearsInBusiness(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
                  placeholder="Number of years"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
                  placeholder="Company description"
                />
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-6">
              <div className="flex items-center mb-4">
                <User className="w-5 h-5 mr-2 text-blue-400" />
                <h2 className="text-xl font-semibold">Contact Information</h2>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Phone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
                    placeholder="Phone number"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Website</label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
                    placeholder="https://example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Address Line 1</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    value={addressLine1}
                    onChange={(e) => setAddressLine1(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
                    placeholder="Street address"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Address Line 2</label>
                <input
                  type="text"
                  value={addressLine2}
                  onChange={(e) => setAddressLine2(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
                  placeholder="Suite, unit, etc."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
                    placeholder="City"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">State</label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
                    placeholder="State"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Postal Code</label>
                  <input
                    type="text"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
                    placeholder="ZIP/Postal code"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Country</label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
                    placeholder="Country"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Primary Contact Person */}
          <div className="mt-8 pt-8 border-t border-gray-700">
            <div className="flex items-center mb-4">
              <User className="w-5 h-5 mr-2 text-green-400" />
              <h2 className="text-xl font-semibold">Primary Contact Person</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Contact Person Name</label>
                <input
                  type="text"
                  value={contactPersonName}
                  onChange={(e) => setContactPersonName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
                  placeholder="Full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Title</label>
                <input
                  type="text"
                  value={contactPersonTitle}
                  onChange={(e) => setContactPersonTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
                  placeholder="Job title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="email"
                    value={contactPersonEmail}
                    onChange={(e) => setContactPersonEmail(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
                    placeholder="Email address"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Phone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="tel"
                    value={contactPersonPhone}
                    onChange={(e) => setContactPersonPhone(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
                    placeholder="Phone number"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="mt-8 pt-8 border-t border-gray-700">
            <div className="flex items-center mb-4">
              <AlertCircle className="w-5 h-5 mr-2 text-red-400" />
              <h2 className="text-xl font-semibold">Emergency Contact</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Emergency Contact Name</label>
                <input
                  type="text"
                  value={emergencyContactName}
                  onChange={(e) => setEmergencyContactName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
                  placeholder="Full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Emergency Contact Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="email"
                    value={emergencyContactEmail}
                    onChange={(e) => setEmergencyContactEmail(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
                    placeholder="Email address"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Emergency Contact Phone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="tel"
                    value={emergencyContactPhone}
                    onChange={(e) => setEmergencyContactPhone(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
                    placeholder="Phone number"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="mt-8 pt-8 border-t border-gray-700 flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 rounded-lg transition-colors"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Profile
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
