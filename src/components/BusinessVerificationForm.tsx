import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { AlertTriangle, CheckCircle, Building2, FileText, Clock, AlertCircle } from 'lucide-react';

interface BusinessInfo {
  business_name: string;
  business_structure: string;
  ein_number: string;
  business_verified: boolean;
  business_verified_at?: string;
}

export function BusinessVerificationForm() {
  const { user } = useAuth();
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo>({
    business_name: '',
    business_structure: '',
    ein_number: '',
    business_verified: false
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      fetchBusinessInfo();
    }
  }, [user]);

  const fetchBusinessInfo = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('profiles')
        .select('business_name, business_structure, ein_number, business_verified, business_verified_at')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (data) {
        setBusinessInfo({
          business_name: data.business_name || '',
          business_structure: data.business_structure || '',
          ein_number: data.ein_number || '',
          business_verified: data.business_verified || false,
          business_verified_at: data.business_verified_at
        });
      }
    } catch (err) {
      console.error('Error fetching business info:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch business information');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validate required fields
    if (!businessInfo.business_name.trim()) {
      setError('Business name is required');
      return;
    }
    if (!businessInfo.business_structure) {
      setError('Business structure is required');
      return;
    }
    if (!businessInfo.ein_number.trim()) {
      setError('EIN number is required');
      return;
    }

    // Validate EIN format (basic validation)
    const einRegex = /^\d{2}-\d{7}$/;
    if (!einRegex.test(businessInfo.ein_number)) {
      setError('EIN must be in format XX-XXXXXXX');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      const { error } = await supabase
        .from('profiles')
        .update({
          business_name: businessInfo.business_name.trim(),
          business_structure: businessInfo.business_structure,
          ein_number: businessInfo.ein_number.trim(),
          business_verified: false, // Reset verification status when info is updated
          business_verified_at: null
        })
        .eq('id', user.id);

      if (error) throw error;

      setSuccess(true);
      setBusinessInfo(prev => ({ ...prev, business_verified: false, business_verified_at: undefined }));
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error updating business info:', err);
      setError(err instanceof Error ? err.message : 'Failed to update business information');
    } finally {
      setSaving(false);
    }
  };

  const getVerificationStatus = () => {
    if (businessInfo.business_verified) {
      return {
        status: 'verified',
        icon: <CheckCircle className="w-5 h-5 text-green-500" />,
        text: 'Verified',
        description: 'Your business has been verified and you can use net payment terms.',
        badge: <Badge className="bg-green-100 text-green-800">Verified</Badge>
      };
    }

    if (businessInfo.business_name && businessInfo.business_structure && businessInfo.ein_number) {
      return {
        status: 'pending',
        icon: <Clock className="w-5 h-5 text-yellow-500" />,
        text: 'Pending Review',
        description: 'Your business information has been submitted and is under review.',
        badge: <Badge className="bg-yellow-100 text-yellow-800">Pending Review</Badge>
      };
    }

    return {
      status: 'not_submitted',
      icon: <AlertCircle className="w-5 h-5 text-gray-500" />,
      text: 'Not Submitted',
      description: 'Please submit your business information to qualify for net payment terms.',
      badge: <Badge className="bg-gray-100 text-gray-800">Not Submitted</Badge>
    };
  };

  const verificationStatus = getVerificationStatus();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading business information...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Building2 className="w-6 h-6 text-blue-600" />
        <h2 className="text-2xl font-bold">Business Verification</h2>
        {verificationStatus.badge}
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div className="text-sm text-yellow-800">
            <p className="font-medium mb-1"><strong>Net Payment Terms:</strong></p>
            <p>To qualify for net30, net60, or net90 payment terms, 
            you must provide verified business information including business name, structure, and EIN number.</p>
          </div>
        </div>
      </div>

      <div className="flex items-start gap-4">
        {verificationStatus.icon}
        <div className="flex-1">
          <h3 className="font-semibold text-lg">{verificationStatus.text}</h3>
          <p className="text-gray-600">{verificationStatus.description}</p>
          {businessInfo.business_verified_at && (
            <p className="text-sm text-gray-500 mt-1">
              Verified on: {new Date(businessInfo.business_verified_at).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Business Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="space-y-2">
                 <label htmlFor="business_name" className="block text-sm font-medium text-gray-700">Business Name *</label>
                 <input
                   id="business_name"
                   type="text"
                   value={businessInfo.business_name}
                   onChange={(e) => setBusinessInfo(prev => ({ ...prev, business_name: e.target.value }))}
                   placeholder="Enter your business name"
                   disabled={businessInfo.business_verified}
                   className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                 />
               </div>

               <div className="space-y-2">
                 <label htmlFor="business_structure" className="block text-sm font-medium text-gray-700">Business Structure *</label>
                 <select
                   id="business_structure"
                   value={businessInfo.business_structure}
                   onChange={(e) => setBusinessInfo(prev => ({ ...prev, business_structure: e.target.value }))}
                   disabled={businessInfo.business_verified}
                   className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                 >
                   <option value="">Select business structure</option>
                   <option value="LLC">LLC</option>
                   <option value="Corporation">Corporation</option>
                   <option value="S-Corporation">S-Corporation</option>
                   <option value="Partnership">Partnership</option>
                   <option value="Sole Proprietorship">Sole Proprietorship</option>
                   <option value="Non-Profit">Non-Profit</option>
                   <option value="Government">Government</option>
                   <option value="Other">Other</option>
                 </select>
               </div>
             </div>

             <div className="space-y-2">
               <label htmlFor="ein_number" className="block text-sm font-medium text-gray-700">EIN Number *</label>
               <input
                 id="ein_number"
                 type="text"
                 value={businessInfo.ein_number}
                 onChange={(e) => setBusinessInfo(prev => ({ ...prev, ein_number: e.target.value }))}
                 placeholder="XX-XXXXXXX"
                 disabled={businessInfo.business_verified}
                 className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
               />
               <p className="text-sm text-gray-500">
                 Enter your Employer Identification Number in format XX-XXXXXXX
               </p>
             </div>

                         {error && (
               <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                 <div className="flex items-start gap-3">
                   <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                   <div className="text-sm text-red-800">{error}</div>
                 </div>
               </div>
             )}

             {success && (
               <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                 <div className="flex items-start gap-3">
                   <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                   <div className="text-sm text-green-800">
                     Business information updated successfully! Your information will be reviewed for verification.
                   </div>
                 </div>
               </div>
             )}

            {!businessInfo.business_verified && (
              <Button 
                type="submit" 
                disabled={saving}
                className="w-full md:w-auto"
              >
                {saving ? 'Saving...' : 'Submit for Verification'}
              </Button>
            )}
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Payment Terms Eligibility
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div>
                <h4 className="font-medium text-green-800">Immediate Payment</h4>
                <p className="text-sm text-green-600">Pay immediately upon purchase</p>
              </div>
              <Badge className="bg-green-100 text-green-800">Always Available</Badge>
            </div>

            <div className={`flex items-center justify-between p-3 rounded-lg ${
              businessInfo.business_verified ? 'bg-blue-50' : 'bg-gray-50'
            }`}>
              <div>
                <h4 className={`font-medium ${businessInfo.business_verified ? 'text-blue-800' : 'text-gray-600'}`}>
                  Net Payment Terms (Net30, Net60, Net90)
                </h4>
                <p className={`text-sm ${businessInfo.business_verified ? 'text-blue-600' : 'text-gray-500'}`}>
                  Pay within 30, 60, or 90 days of purchase
                </p>
              </div>
              <Badge className={
                businessInfo.business_verified 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-gray-100 text-gray-600'
              }>
                {businessInfo.business_verified ? 'Available' : 'Requires Verification'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
