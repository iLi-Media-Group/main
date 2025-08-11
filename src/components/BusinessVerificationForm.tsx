import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { AlertTriangle, CheckCircle, Building2, FileText, Clock, AlertCircle, CheckSquare, Square } from 'lucide-react';

interface BusinessInfo {
  business_name: string;
  business_structure: string;
  ein_number: string;
  business_verified: boolean;
  business_verified_at?: string;
  payment_agreement_accepted?: boolean;
  payment_agreement_accepted_at?: string;
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
  const [showPaymentAgreement, setShowPaymentAgreement] = useState(false);
  const [agreementAccepted, setAgreementAccepted] = useState(false);

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
        .select('business_name, business_structure, ein_number, business_verified, business_verified_at, payment_agreement_accepted, payment_agreement_accepted_at')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (data) {
        setBusinessInfo({
          business_name: data.business_name || '',
          business_structure: data.business_structure || '',
          ein_number: data.ein_number || '',
          business_verified: data.business_verified || false,
          business_verified_at: data.business_verified_at,
          payment_agreement_accepted: data.payment_agreement_accepted || false,
          payment_agreement_accepted_at: data.payment_agreement_accepted_at
        });
        setAgreementAccepted(data.payment_agreement_accepted || false);
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
          business_verified_at: null,
          payment_agreement_accepted: false, // Reset agreement when business info changes
          payment_agreement_accepted_at: null
        })
        .eq('id', user.id);

      if (error) throw error;

      setSuccess(true);
      setBusinessInfo(prev => ({ 
        ...prev, 
        business_verified: false, 
        business_verified_at: undefined,
        payment_agreement_accepted: false,
        payment_agreement_accepted_at: undefined
      }));
      setAgreementAccepted(false);
      
      // Show payment agreement if business info is complete
      if (businessInfo.business_name.trim() && businessInfo.business_structure && businessInfo.ein_number.trim()) {
        setShowPaymentAgreement(true);
      }
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error updating business info:', err);
      setError(err instanceof Error ? err.message : 'Failed to update business information');
    } finally {
      setSaving(false);
    }
  };

  const handlePaymentAgreementAccept = async () => {
    if (!user || !agreementAccepted) return;

    try {
      setSaving(true);
      setError(null);

      const { error } = await supabase
        .from('profiles')
        .update({
          payment_agreement_accepted: true,
          payment_agreement_accepted_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      setBusinessInfo(prev => ({
        ...prev,
        payment_agreement_accepted: true,
        payment_agreement_accepted_at: new Date().toISOString()
      }));

      setShowPaymentAgreement(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error accepting payment agreement:', err);
      setError(err instanceof Error ? err.message : 'Failed to accept payment agreement');
    } finally {
      setSaving(false);
    }
  };

  const getVerificationStatus = () => {
    if (businessInfo.business_verified && businessInfo.payment_agreement_accepted) {
      return {
        status: 'verified',
        icon: <CheckCircle className="w-5 h-5 text-green-500" />,
        text: 'Verified & Agreement Accepted',
        description: 'Your business has been verified and payment agreement accepted. You can use net payment terms.',
        badge: <Badge className="bg-green-100 text-green-800">Verified</Badge>
      };
    }

    if (businessInfo.business_name && businessInfo.business_structure && businessInfo.ein_number) {
      if (businessInfo.payment_agreement_accepted) {
        return {
          status: 'pending_verification',
          icon: <Clock className="w-5 h-5 text-yellow-500" />,
          text: 'Pending Business Verification',
          description: 'Payment agreement accepted. Business information is under review.',
          badge: <Badge className="bg-yellow-100 text-yellow-800">Pending Review</Badge>
        };
      } else {
        return {
          status: 'pending_agreement',
          icon: <AlertCircle className="w-5 h-5 text-orange-500" />,
          text: 'Payment Agreement Required',
          description: 'Business information submitted. Please review and accept the payment agreement.',
          badge: <Badge className="bg-orange-100 text-orange-800">Agreement Required</Badge>
        };
      }
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
            you must provide verified business information and accept the payment agreement.</p>
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
          {businessInfo.payment_agreement_accepted_at && (
            <p className="text-sm text-gray-500 mt-1">
              Agreement accepted on: {new Date(businessInfo.payment_agreement_accepted_at).toLocaleDateString()}
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
                    {businessInfo.payment_agreement_accepted 
                      ? 'Payment agreement accepted successfully! Your business information will be reviewed for verification.'
                      : 'Business information updated successfully! Please review and accept the payment agreement.'
                    }
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

      {/* Payment Agreement Section */}
      {businessInfo.business_name && businessInfo.business_structure && businessInfo.ein_number && !businessInfo.payment_agreement_accepted && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Payment Agreement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 mb-2">Payment Terms Agreement</h4>
                <div className="text-sm text-blue-700 space-y-2">
                  <p><strong>By accepting this agreement, you acknowledge and agree to the following:</strong></p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>You are authorized to enter into payment agreements on behalf of your business</li>
                    <li>You understand that net payment terms (net30, net60, net90) require payment within the specified timeframe</li>
                    <li>You agree to pay the full amount due by the payment due date</li>
                    <li>You acknowledge that files will be released according to the producer's discretion and payment terms</li>
                    <li>You understand that failure to pay by the due date may result in late fees and collection actions</li>
                    <li>You agree to provide accurate business information and notify us of any changes</li>
                  </ul>
                  <p className="mt-3 font-medium">
                    <strong>Important:</strong> This agreement creates a legally binding obligation to pay according to the selected payment terms.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={() => setAgreementAccepted(!agreementAccepted)}
                  className="mt-1"
                >
                  {agreementAccepted ? (
                    <CheckSquare className="w-5 h-5 text-blue-600" />
                  ) : (
                    <Square className="w-5 h-5 text-gray-400" />
                  )}
                </button>
                <div className="flex-1">
                  <label className="text-sm font-medium text-gray-700">
                    I acknowledge and agree to the payment terms and conditions outlined above
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    You must accept this agreement to qualify for net payment terms
                  </p>
                </div>
              </div>

              <Button
                onClick={handlePaymentAgreementAccept}
                disabled={!agreementAccepted || saving}
                className="w-full md:w-auto"
              >
                {saving ? 'Processing...' : 'Accept Payment Agreement'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

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
              businessInfo.business_verified && businessInfo.payment_agreement_accepted ? 'bg-blue-50' : 'bg-gray-50'
            }`}>
              <div>
                <h4 className={`font-medium ${businessInfo.business_verified && businessInfo.payment_agreement_accepted ? 'text-blue-800' : 'text-gray-600'}`}>
                  Net Payment Terms (Net30, Net60, Net90)
                </h4>
                <p className={`text-sm ${businessInfo.business_verified && businessInfo.payment_agreement_accepted ? 'text-blue-600' : 'text-gray-500'}`}>
                  Pay within 30, 60, or 90 days of purchase
                </p>
                {!businessInfo.payment_agreement_accepted && businessInfo.business_name && (
                  <p className="text-xs text-orange-600 mt-1">
                    Requires payment agreement acceptance
                  </p>
                )}
              </div>
              <Badge className={
                businessInfo.business_verified && businessInfo.payment_agreement_accepted
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-gray-100 text-gray-600'
              }>
                {businessInfo.business_verified && businessInfo.payment_agreement_accepted 
                  ? 'Available' 
                  : businessInfo.business_name && businessInfo.business_structure && businessInfo.ein_number
                    ? 'Agreement Required'
                    : 'Requires Verification'
                }
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
