import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useUnifiedAuth } from '../contexts/UnifiedAuthContext';
import { Loader2, CheckCircle, Settings, Palette, Globe, Upload, Save, Check, X, Users, Brain, Search, Shield, DollarSign, BarChart3, Plus, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ReportBackgroundPicker } from './ReportBackgroundPicker';

interface WhiteLabelClient {
  id: string;
  display_name: string;
  domain?: string;
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
  owner_id: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  plan?: string;
  ai_search_assistance_enabled?: boolean;
  producer_onboarding_enabled?: boolean;
  deep_media_search_enabled?: boolean;
  ai_search_assistance_paid?: boolean;
  producer_onboarding_paid?: boolean;
  deep_media_search_paid?: boolean;
  password_setup_required?: boolean;
}

export default function WhiteLabelClientDashboard() {
  const { user } = useUnifiedAuth();
  const navigate = useNavigate();
  const [client, setClient] = useState<WhiteLabelClient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [primaryColor, setPrimaryColor] = useState('#6366f1');
  const [secondaryColor, setSecondaryColor] = useState('#8b5cf6');
  const [logoUrl, setLogoUrl] = useState<string | undefined>(undefined);
  const [displayName, setDisplayName] = useState('');
  const [domain, setDomain] = useState('');

  useEffect(() => {
    if (user) {
      fetchClient();
    }
    // eslint-disable-next-line
  }, [user]);

  // Redirect to password setup if required
  useEffect(() => {
    if (client && client.password_setup_required) {
      navigate('/white-label-password-setup');
    }
  }, [client, navigate]);

  useEffect(() => {
    if (!user || !client) return;
    // Subscribe to real-time changes for this client
    const channel = supabase.channel('client-wl-features')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'white_label_clients', filter: `id=eq.${client.id}` },
        (payload) => {
          setClient((prev) => prev && payload.new ? { ...prev, ...(payload.new as WhiteLabelClient) } : prev);
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, client]);

  const fetchClient = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('white_label_clients')
        .select('*')
        .eq('owner_id', user?.id)
        .maybeSingle();
      if (error) throw error;
      if (data) {
        setClient(data);
        setDisplayName(data.display_name || '');
        setDomain(data.domain || '');
        setPrimaryColor(data.primary_color || '#6366f1');
        setSecondaryColor(data.secondary_color || '#8b5cf6');
        setLogoUrl(data.logo_url);
      }
    } catch (err) {
      setError('Failed to load your white label client profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }
    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('File size must be less than 2MB');
      return;
    }
    const fileExt = file.name.split('.').pop();
    const filePath = `white-label-logos/${user?.id}.${fileExt}`;
    setLoading(true);
    setError(null);
    try {
      const { error: uploadError } = await supabase.storage
        .from('public')
        .upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('public').getPublicUrl(filePath);
      if (!urlData || !urlData.publicUrl) throw new Error('Failed to get public URL for logo.');
      setLogoUrl(urlData.publicUrl);
    } catch (err: any) {
      setError(err.message || 'Failed to upload logo.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const { error } = await supabase
        .from('white_label_clients')
        .update({
          display_name: displayName,
          domain,
          primary_color: primaryColor,
          secondary_color: secondaryColor,
          logo_url: logoUrl,
        })
        .eq('owner_id', user?.id);
      if (error) throw error;
      setSuccess(true);
      fetchClient();
    } catch (err) {
      setError('Failed to save changes.');
    } finally {
      setLoading(false);
      setTimeout(() => setSuccess(false), 2000);
    }
  };

  const getEnabledFeatures = () => {
    if (!client) return [];
    
    const features = [];
    if (client.ai_search_assistance_enabled) {
      features.push({
        name: 'AI Search Assistance',
        description: 'AI-powered search and recommendations',
        icon: Brain,
        paid: client.ai_search_assistance_paid
      });
    }
    if (client.producer_onboarding_enabled) {
      features.push({
        name: 'Producer Onboarding',
        description: 'Let producers apply to join your library',
        icon: Users,
        paid: client.producer_onboarding_paid
      });
    }
    if (client.deep_media_search_enabled) {
      features.push({
        name: 'Deep Media Search',
        description: 'Advanced media type tagging and filtering',
        icon: Search,
        paid: client.deep_media_search_paid
      });
    }
    return features;
  };

  const getAvailableFeatures = () => {
    if (!client) return [];
    
    const allFeatures = [
      {
        id: 'ai_recommendations',
        name: 'AI Search Assistance',
        description: 'Advanced AI-powered search and recommendations for your platform',
        icon: Brain,
        price: 249,
        enabled: client.ai_search_assistance_enabled,
        paid: client.ai_search_assistance_paid
      },
      {
        id: 'producer_applications',
        name: 'Producer Onboarding',
        description: 'Producer application and onboarding system for your platform',
        icon: Users,
        price: 249,
        enabled: client.producer_onboarding_enabled,
        paid: client.producer_onboarding_paid
      },
      {
        id: 'deep_media_search',
        name: 'Deep Media Search',
        description: 'Advanced media search and filtering capabilities',
        icon: Search,
        price: 249,
        enabled: client.deep_media_search_enabled,
        paid: client.deep_media_search_paid
      }
    ];
    
    // Return only features that are not enabled or not paid
    return allFeatures.filter(feature => !feature.enabled || !feature.paid);
  };

  const getBundlePricing = () => {
    const availableFeatures = getAvailableFeatures();
    const featureCount = availableFeatures.length;
    
    if (featureCount === 0) return null;
    if (featureCount === 1) return null;
    if (featureCount === 2) {
      return {
        type: 'bundle_2',
        price: 449,
        savings: 49,
        description: 'Any 2 Add-Ons for $449'
      };
    }
    if (featureCount === 3) {
      return {
        type: 'bundle_3',
        price: 599,
        savings: 148,
        description: 'All 3 Add-Ons for $599'
      };
    }
    return null;
  };

  const handleBuyFeature = async (feature: any) => {
    try {
      if (!client) return;
      
      // Redirect to the white label calculator with the specific feature pre-selected
      const params = new URLSearchParams({
        feature: feature.id,
        client_id: client.id
      });
      window.location.href = `/white-label-calculator?${params.toString()}`;
    } catch (error) {
      console.error('Error handling feature purchase:', error);
    }
  };

  const handleBuyBundle = async (bundleType: string | undefined) => {
    try {
      if (!client || !bundleType) return;
      
      // Get all available features for the bundle
      const availableFeatures = getAvailableFeatures();
      const featureIds = availableFeatures.map(f => f.id);
      
      // Redirect to the white label calculator with all features pre-selected
      const params = new URLSearchParams({
        features: featureIds.join(','),
        client_id: client.id,
        bundle: bundleType
      });
      window.location.href = `/white-label-calculator?${params.toString()}`;
    } catch (error) {
      console.error('Error handling bundle purchase:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      window.location.href = '/';
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin w-12 h-12 text-blue-500 mx-auto mb-4" />
          <p className="text-gray-300">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center">
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-8 max-w-md">
          <p className="text-red-400 text-center font-medium">{error}</p>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center">
        <div className="bg-white/5 border border-blue-500/20 rounded-lg p-8 max-w-md">
          <p className="text-gray-300 text-center font-medium">No white label client profile found for your account.</p>
        </div>
      </div>
    );
  }

  const enabledFeatures = getEnabledFeatures();

  return (
    <WhiteLabelClientDashboardContent
      client={client}
      displayName={displayName}
      setDisplayName={setDisplayName}
      domain={domain}
      setDomain={setDomain}
      logoUrl={logoUrl}
      handleLogoUpload={handleLogoUpload}
      primaryColor={primaryColor}
      setPrimaryColor={setPrimaryColor}
      secondaryColor={secondaryColor}
      setSecondaryColor={setSecondaryColor}
      handleSave={handleSave}
      handleSignOut={handleSignOut}
      loading={loading}
      success={success}
      getEnabledFeatures={getEnabledFeatures}
      getAvailableFeatures={getAvailableFeatures}
      getBundlePricing={getBundlePricing}
      handleBuyFeature={handleBuyFeature}
      handleBuyBundle={handleBuyBundle}
    />
  );
}

interface WhiteLabelClientDashboardContentProps {
  client: WhiteLabelClient;
  displayName: string;
  setDisplayName: React.Dispatch<React.SetStateAction<string>>;
  domain: string;
  setDomain: React.Dispatch<React.SetStateAction<string>>;
  logoUrl?: string;
  handleLogoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  primaryColor: string;
  setPrimaryColor: React.Dispatch<React.SetStateAction<string>>;
  secondaryColor: string;
  setSecondaryColor: React.Dispatch<React.SetStateAction<string>>;
  handleSave: () => void;
  handleSignOut: () => void;
  loading: boolean;
  success: boolean;
  getEnabledFeatures: () => any[];
  getAvailableFeatures: () => any[];
  getBundlePricing: () => any;
  handleBuyFeature: (feature: any) => void;
  handleBuyBundle: (bundleType: string | undefined) => void;
}

function WhiteLabelClientDashboardContent(props: WhiteLabelClientDashboardContentProps) {
  const { client, displayName, setDisplayName, domain, setDomain, logoUrl, handleLogoUpload, primaryColor, setPrimaryColor, secondaryColor, setSecondaryColor, handleSave, handleSignOut, loading, success, getEnabledFeatures, getAvailableFeatures, getBundlePricing, handleBuyFeature, handleBuyBundle } = props;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">White Label Dashboard</h1>
              <p className="text-gray-300">Manage your white label platform settings and branding</p>
            </div>
            <div className="flex items-center space-x-4">
              {client.logo_url && (
                <img src={client.logo_url} alt="Logo" className="w-16 h-16 rounded-lg object-cover border border-blue-500/30" />
              )}
              <button
                onClick={handleSignOut}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center font-medium"
                title="Sign out"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Settings Panel */}
          <div className="lg:col-span-2 space-y-6">
            {/* Branding Settings */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-blue-500/20 p-6">
              <div className="flex items-center mb-6">
                <Settings className="w-6 h-6 text-blue-400 mr-3" />
                <h2 className="text-xl font-semibold text-white">Branding Settings</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Company Name</label>
                  <input
                    type="text"
                    value={client.display_name}
                    onChange={e => setDisplayName(e.target.value)}
                    className="w-full px-3 py-2 bg-white/10 border border-blue-500/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                    placeholder="Enter your company name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Domain</label>
                  <input
                    type="text"
                    value={client.domain}
                    onChange={e => setDomain(e.target.value)}
                    className="w-full px-3 py-2 bg-white/10 border border-blue-500/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                    placeholder="yourdomain.com"
                  />
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">Logo</label>
                <div className="flex items-center space-x-4">
                  {client.logo_url && (
                    <img src={client.logo_url} alt="Logo" className="w-16 h-16 rounded-lg object-cover border border-blue-500/30" />
                  )}
                  <div className="flex-1">
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleLogoUpload} 
                      className="text-white text-sm" 
                    />
                    <p className="text-xs text-gray-400 mt-1">Recommended: 256x256px, PNG or JPG</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Primary Color</label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="color"
                      value={client.primary_color}
                      onChange={e => setPrimaryColor(e.target.value)}
                      className="w-12 h-10 rounded border border-blue-500/20"
                    />
                    <input
                      type="text"
                      value={client.primary_color}
                      onChange={e => setPrimaryColor(e.target.value)}
                      className="flex-1 px-3 py-2 bg-white/10 border border-blue-500/20 rounded-lg text-white text-sm"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Secondary Color</label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="color"
                      value={client.secondary_color}
                      onChange={e => setSecondaryColor(e.target.value)}
                      className="w-12 h-10 rounded border border-blue-500/20"
                    />
                    <input
                      type="text"
                      value={client.secondary_color}
                      onChange={e => setSecondaryColor(e.target.value)}
                      className="flex-1 px-3 py-2 bg-white/10 border border-blue-500/20 rounded-lg text-white text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-blue-500/20 p-6">
              <button
                onClick={handleSave}
                className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center font-semibold"
                disabled={loading}
              >
                {loading ? <Loader2 className="animate-spin w-5 h-5 mr-2" /> : <Save className="w-5 h-5 mr-2" />}
                Save Changes
              </button>
              {success && (
                <div className="mt-4 flex items-center justify-center text-green-400">
                  <CheckCircle className="w-5 h-5 mr-2" /> Changes saved successfully!
                </div>
              )}
            </div>

            {/* PDF Report Background */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-blue-500/20 p-6">
              <div className="flex items-center mb-6">
                <Palette className="w-6 h-6 text-blue-400 mr-3" />
                <h2 className="text-xl font-semibold text-white">PDF Report Background</h2>
              </div>
              <ReportBackgroundPicker selected={''} onChange={() => {}} />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Plan Information */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-blue-500/20 p-6">
              <div className="flex items-center mb-4">
                <Shield className="w-6 h-6 text-blue-400 mr-3" />
                <h3 className="text-lg font-semibold text-white">Your Plan</h3>
              </div>
              <div className="bg-blue-500/10 rounded-lg p-4 mb-4">
                <p className="text-white font-semibold capitalize">{client.plan || 'Starter'}</p>
                <p className="text-gray-300 text-sm">White Label Platform</p>
              </div>
            </div>

            {/* Enabled Features */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-blue-500/20 p-6">
              <div className="flex items-center mb-4">
                <Check className="w-6 h-6 text-green-400 mr-3" />
                <h3 className="text-lg font-semibold text-white">Enabled Features</h3>
              </div>
              
              {getEnabledFeatures().length > 0 ? (
                <div className="space-y-3">
                  {getEnabledFeatures().map((feature, index) => {
                    const Icon = feature.icon;
                    return (
                      <div key={index} className="bg-white/10 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center">
                            <Icon className="w-4 h-4 text-blue-400 mr-2" />
                            <span className="text-white font-medium text-sm">{feature.name}</span>
                          </div>
                          {feature.paid ? (
                            <span className="text-green-400 text-xs bg-green-500/20 px-2 py-1 rounded">Paid</span>
                          ) : (
                            <span className="text-yellow-400 text-xs bg-yellow-500/20 px-2 py-1 rounded">Pending</span>
                          )}
                        </div>
                        <p className="text-gray-300 text-xs">{feature.description}</p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-6">
                  <X className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">No features enabled</p>
                  <p className="text-gray-500 text-xs mt-1">Contact support to enable features</p>
                </div>
              )}
            </div>

            {/* Available Features */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-blue-500/20 p-6">
              <div className="flex items-center mb-4">
                <Plus className="w-6 h-6 text-blue-400 mr-3" />
                <h3 className="text-lg font-semibold text-white">Available Features</h3>
              </div>
              
              {getAvailableFeatures().length > 0 ? (
                <div className="space-y-4">
                  {/* Bundle Pricing */}
                  {getBundlePricing() && (
                    <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg p-4 border border-blue-500/30">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <DollarSign className="w-5 h-5 text-green-400 mr-2" />
                          <span className="text-white font-semibold text-sm">Bundle and Save</span>
                        </div>
                        <span className="text-green-400 text-xs bg-green-500/20 px-2 py-1 rounded">Save ${getBundlePricing()?.savings}</span>
                      </div>
                      <p className="text-gray-300 text-xs mb-3">{getBundlePricing()?.description}</p>
                      <button
                        onClick={() => handleBuyBundle(getBundlePricing()?.type)}
                        className="w-full px-3 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white text-xs rounded-lg transition-colors font-medium"
                      >
                        Buy Bundle - ${getBundlePricing()?.price}
                      </button>
                    </div>
                  )}

                  {/* Individual Features */}
                  <div className="space-y-3">
                    {getAvailableFeatures().map((feature, index) => {
                      const Icon = feature.icon;
                      return (
                        <div key={index} className="bg-white/10 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center">
                              <Icon className="w-4 h-4 text-blue-400 mr-2" />
                              <span className="text-white font-medium text-sm">{feature.name}</span>
                            </div>
                            <span className="text-blue-400 text-xs bg-blue-500/20 px-2 py-1 rounded">${feature.price}</span>
                          </div>
                          <p className="text-gray-300 text-xs mb-3">{feature.description}</p>
                          <button
                            onClick={() => handleBuyFeature(feature)}
                            className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg transition-colors font-medium"
                          >
                            Buy Feature
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <p className="text-green-400 text-sm font-medium">All Features Unlocked!</p>
                  <p className="text-gray-500 text-xs mt-1">You have access to all current features</p>
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-blue-500/20 p-6">
              <div className="flex items-center mb-4">
                <BarChart3 className="w-6 h-6 text-blue-400 mr-3" />
                <h3 className="text-lg font-semibold text-white">Platform Status</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300 text-sm">Status</span>
                  <span className="text-green-400 text-sm font-medium">Active</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300 text-sm">Domain</span>
                  <span className="text-blue-400 text-sm">{client.domain || 'Not set'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300 text-sm">Features</span>
                  <span className="text-white text-sm font-medium">{getEnabledFeatures().length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 