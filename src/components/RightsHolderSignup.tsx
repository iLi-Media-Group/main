import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUnifiedAuth } from '../contexts/UnifiedAuthContext';
import { Loader2, Building2, FileText, CheckCircle, AlertCircle } from 'lucide-react';

interface SignupFormData {
  email: string;
  password: string;
  confirmPassword: string;
  rightsHolderType: 'record_label' | 'publisher';
  companyName: string;
  legalEntityName: string;
  businessStructure: 'sole_proprietorship' | 'llc' | 'corporation' | 'partnership' | 'other';
  website: string;
  phone: string;
  addressLine1: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  termsAccepted: boolean;
  privacyAccepted: boolean;
  rightsAuthorityAccepted: boolean;
}

export function RightsHolderSignup() {
  const navigate = useNavigate();
  const { signUpRightsHolder } = useUnifiedAuth();
  
  const [formData, setFormData] = useState<SignupFormData>({
    email: '',
    password: '',
    confirmPassword: '',
    rightsHolderType: 'record_label',
    companyName: '',
    legalEntityName: '',
    businessStructure: 'llc',
    website: '',
    phone: '',
    addressLine1: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'US',
    termsAccepted: false,
    privacyAccepted: false,
    rightsAuthorityAccepted: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const businessStructures = [
    { value: 'sole_proprietorship', label: 'Sole Proprietorship' },
    { value: 'llc', label: 'LLC' },
    { value: 'corporation', label: 'Corporation' },
    { value: 'partnership', label: 'Partnership' },
    { value: 'other', label: 'Other' },
  ];

  const states = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const validateForm = (): string | null => {
    if (!formData.email || !formData.email.includes('@')) {
      return 'Please enter a valid email address';
    }

    if (formData.password.length < 8) {
      return 'Password must be at least 8 characters long';
    }

    if (formData.password !== formData.confirmPassword) {
      return 'Passwords do not match';
    }

    if (!formData.companyName.trim()) {
      return 'Company name is required';
    }

    if (!formData.legalEntityName.trim()) {
      return 'Legal entity name is required';
    }

    if (!formData.phone.trim()) {
      return 'Phone number is required';
    }

    if (!formData.addressLine1.trim()) {
      return 'Address is required';
    }

    if (!formData.city.trim()) {
      return 'City is required';
    }

    if (!formData.state.trim()) {
      return 'State is required';
    }

    if (!formData.postalCode.trim()) {
      return 'Postal code is required';
    }

    if (!formData.termsAccepted) {
      return 'You must accept the Terms of Service';
    }

    if (!formData.privacyAccepted) {
      return 'You must accept the Privacy Policy';
    }

    if (!formData.rightsAuthorityAccepted) {
      return 'You must accept the Rights Authority Declaration';
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
             const rightsHolderData = {
         rights_holder_type: formData.rightsHolderType,
         company_name: formData.companyName,
         legal_entity_name: formData.legalEntityName,
         business_structure: formData.businessStructure,
         website: formData.website || null,
         phone: formData.phone,
         address_line_1: formData.addressLine1,
         city: formData.city,
         state: formData.state,
         postal_code: formData.postalCode,
         country: formData.country,
         terms_accepted: true,
         terms_accepted_at: new Date().toISOString(),
         rights_authority_declaration_accepted: true,
         rights_authority_declaration_accepted_at: new Date().toISOString(),
       };

      const { error } = await signUpRightsHolder(formData.email, formData.password, rightsHolderData);

      if (error) {
        setError(error.message || 'Signup failed. Please try again.');
      } else {
        setSuccess(true);
        setTimeout(() => {
          navigate('/rights-holder/dashboard');
        }, 2000);
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-blue-900/90 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-md w-full text-center">
          <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Account Created Successfully!</h2>
          <p className="text-gray-300 mb-4">
            Please check your email to verify your account before signing in.
          </p>
          <div className="animate-pulse">
            <p className="text-sm text-gray-400">Redirecting to dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-900/90 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-2xl w-full">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Building2 className="w-8 h-8 text-blue-400 mr-2" />
            <h1 className="text-3xl font-bold text-white">Rights Holder Signup</h1>
          </div>
          <p className="text-gray-300">
            Join MyBeatFi as a Record Label or Publisher to manage your music rights and licensing
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Rights Holder Type Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                formData.rightsHolderType === 'record_label'
                  ? 'border-blue-500 bg-blue-500/20'
                  : 'border-gray-600 bg-gray-800/50 hover:border-gray-500'
              }`}
              onClick={() => setFormData(prev => ({ ...prev, rightsHolderType: 'record_label' }))}
            >
              <div className="flex items-center">
                <input
                  type="radio"
                  name="rightsHolderType"
                  value="record_label"
                  checked={formData.rightsHolderType === 'record_label'}
                  onChange={handleInputChange}
                  className="sr-only"
                />
                <div className="w-4 h-4 border-2 border-gray-400 rounded-full mr-3 flex items-center justify-center">
                  {formData.rightsHolderType === 'record_label' && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-white">Record Label</h3>
                  <p className="text-sm text-gray-400">Manage master recordings and artist rights</p>
                </div>
              </div>
            </div>

            <div
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                formData.rightsHolderType === 'publisher'
                  ? 'border-blue-500 bg-blue-500/20'
                  : 'border-gray-600 bg-gray-800/50 hover:border-gray-500'
              }`}
              onClick={() => setFormData(prev => ({ ...prev, rightsHolderType: 'publisher' }))}
            >
              <div className="flex items-center">
                <input
                  type="radio"
                  name="rightsHolderType"
                  value="publisher"
                  checked={formData.rightsHolderType === 'publisher'}
                  onChange={handleInputChange}
                  className="sr-only"
                />
                <div className="w-4 h-4 border-2 border-gray-400 rounded-full mr-3 flex items-center justify-center">
                  {formData.rightsHolderType === 'publisher' && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-white">Publisher</h3>
                  <p className="text-sm text-gray-400">Manage publishing rights and songwriter royalties</p>
                </div>
              </div>
            </div>
          </div>

          {/* Account Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                placeholder="your@email.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Company Name *
              </label>
              <input
                type="text"
                name="companyName"
                value={formData.companyName}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                placeholder="Your Company Name"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Legal Entity Name *
              </label>
              <input
                type="text"
                name="legalEntityName"
                value={formData.legalEntityName}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                placeholder="Legal Business Name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Business Structure *
              </label>
              <select
                name="businessStructure"
                value={formData.businessStructure}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                required
              >
                {businessStructures.map(structure => (
                  <option key={structure.value} value={structure.value}>
                    {structure.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Website
              </label>
              <input
                type="url"
                name="website"
                value={formData.website}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                placeholder="https://yourwebsite.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Phone Number *
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                placeholder="(555) 123-4567"
                required
              />
            </div>
          </div>

          {/* Address Information */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Address Line 1 *
            </label>
            <input
              type="text"
              name="addressLine1"
              value={formData.addressLine1}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              placeholder="123 Business Street"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                City *
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                placeholder="City"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                State *
              </label>
              <select
                name="state"
                value={formData.state}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                required
              >
                <option value="">Select State</option>
                {states.map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Postal Code *
              </label>
              <input
                type="text"
                name="postalCode"
                value={formData.postalCode}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                placeholder="12345"
                required
              />
            </div>
          </div>

          {/* Password Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Password *
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                placeholder="Minimum 8 characters"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Confirm Password *
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                placeholder="Confirm your password"
                required
              />
            </div>
          </div>

                     {/* Legal Agreements */}
           <div className="space-y-4">
             <div className="flex items-start">
               <input
                 type="checkbox"
                 name="termsAccepted"
                 checked={formData.termsAccepted}
                 onChange={handleInputChange}
                 className="mt-1 w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                 required
               />
               <label className="ml-3 text-sm text-gray-300">
                 I accept the{' '}
                 <a href="/terms" target="_blank" className="text-blue-400 hover:underline">
                   Terms of Service
                 </a>
                 {' '}and agree to the rights verification process *
               </label>
             </div>

             <div className="flex items-start">
               <input
                 type="checkbox"
                 name="privacyAccepted"
                 checked={formData.privacyAccepted}
                 onChange={handleInputChange}
                 className="mt-1 w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                 required
               />
               <label className="ml-3 text-sm text-gray-300">
                 I accept the{' '}
                 <a href="/privacy" target="_blank" className="text-blue-400 hover:underline">
                   Privacy Policy
                 </a> *
               </label>
             </div>

             {/* Rights Authority Declaration */}
             <div className="bg-blue-900/30 border border-blue-500/50 rounded-lg p-4">
               <div className="flex items-start">
                 <input
                   type="checkbox"
                   name="rightsAuthorityAccepted"
                   checked={formData.rightsAuthorityAccepted}
                   onChange={handleInputChange}
                   className="mt-1 w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                   required
                 />
                 <div className="ml-3">
                   <label className="text-sm font-medium text-white">
                     Rights Authority Declaration *
                   </label>
                   <p className="text-xs text-gray-300 mt-1">
                     By checking this box, I hereby testify and declare under penalty of perjury that:
                   </p>
                   <ul className="text-xs text-gray-300 mt-2 space-y-1 list-disc list-inside">
                     <li>I have the legal authority to administer and license the music content I will upload to MyBeatFi</li>
                     <li>I represent a duly authorized record label or publishing company with rights to the content</li>
                     <li>I have obtained all necessary permissions from co-writers, producers, and other rights holders</li>
                     <li>I can grant third-party licenses for the content without additional approval</li>
                     <li>I will maintain accurate ownership and split information for all uploaded content</li>
                   </ul>
                 </div>
               </div>
             </div>
           </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
              <span className="text-red-400">{error}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Creating Account...
              </>
            ) : (
              <>
                <FileText className="w-5 h-5 mr-2" />
                Create Rights Holder Account
              </>
            )}
          </button>

          {/* Login Link */}
          <div className="text-center">
            <p className="text-gray-400">
              Already have an account?{' '}
              <a href="/rights-holder/login" className="text-blue-400 hover:underline">
                Sign in here
              </a>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
