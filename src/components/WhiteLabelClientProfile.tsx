import React, { useState, useEffect } from 'react';
import { useStableDataFetch } from '../hooks/useStableEffect';
import { Upload, Palette, Settings, Save, X, Globe, Image, ToggleLeft, ToggleRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface WhiteLabelClient {
  id: string;
  display_name: string;
  owner_id: string;
  domain?: string;
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
  created_at: string;
  ai_search_assistance_enabled?: boolean;
  producer_onboarding_enabled?: boolean;
  deep_media_search_enabled?: boolean;
}

export function WhiteLabelClientProfile() {
  const { user } = useAuth();
  const [client, setClient] = useState<WhiteLabelClient | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showLogoUpload, setShowLogoUpload] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    display_name: '',
    domain: '',
    primary_color: '#6366f1',
    secondary_color: '#8b5cf6',
    ai_search_assistance_enabled: false,
    producer_onboarding_enabled: false,
    deep_media_search_enabled: false
  });

  // Use stable effect to prevent unwanted refreshes
  useStableDataFetch(
    fetchClientData,
    [user],
    () => !!user
  );

  const fetchClientData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('white_label_clients')
        .select('*')
        .eq('owner_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching client data:', error);
        setError('Failed to load client data');
        return;
      }

      if (data) {
        setClient(data);
        setFormData({
          display_name: data.display_name || '',
          domain: data.domain || '',
          primary_color: data.primary_color || '#6366f1',
          secondary_color: data.secondary_color || '#8b5cf6',
          ai_search_assistance_enabled: data.ai_search_assistance_enabled || false,
          producer_onboarding_enabled: data.producer_onboarding_enabled || false,
          deep_media_search_enabled: data.deep_media_search_enabled || false
        });
      } else {
        setError('No white label client found for this account');
      }
    } catch (err) {
      console.error('Error fetching client data:', err);
      setError('Failed to load client data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadLogo = async (): Promise<string | null> => {
    if (!logoFile || !user) return null;

    try {
      const fileExt = logoFile.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `white-label-logos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('public')
        .upload(filePath, logoFile);

      if (uploadError) {
        console.error('Error uploading logo:', uploadError);
        return null;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('public')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading logo:', error);
      return null;
    }
  };

  const handleSave = async () => {
    if (!user || !client) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      let logoUrl = client.logo_url;

      // Upload new logo if selected
      if (logoFile) {
        const uploadedLogoUrl = await uploadLogo();
        if (uploadedLogoUrl) {
          logoUrl = uploadedLogoUrl;
        }
      }

      const { error } = await supabase
        .from('white_label_clients')
        .update({
          display_name: formData.display_name,
          domain: formData.domain,
          logo_url: logoUrl,
          primary_color: formData.primary_color,
          secondary_color: formData.secondary_color,
          ai_search_assistance_enabled: formData.ai_search_assistance_enabled,
          producer_onboarding_enabled: formData.producer_onboarding_enabled,
          deep_media_search_enabled: formData.deep_media_search_enabled
        })
        .eq('id', client.id);

      if (error) {
        console.error('Error updating client:', error);
        setError('Failed to save changes');
        return;
      }

      setSuccess('Profile updated successfully!');
      setLogoFile(null);
      setLogoPreview(null);
      setShowLogoUpload(false);
      
      // Refresh client data
      await fetchClientData();
    } catch (err) {
      console.error('Error saving changes:', err);
      setError('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const toggleFeature = (feature: keyof typeof formData) => {
    setFormData(prev => ({
      ...prev,
      [feature]: !prev[feature]
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error && !client) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center">
        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-red-500/20 p-8 max-w-md">
          <h2 className="text-2xl font-bold text-white mb-4">Access Denied</h2>
          <p className="text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white">White Label Profile</h1>
              <p className="text-xl text-gray-300 mt-2">
                Manage your white label branding and features
              </p>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-400 text-center font-medium">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
              <p className="text-green-400 text-center font-medium">{success}</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Basic Information */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-blue-500/20 p-6">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Basic Information
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Display Name *
                  </label>
                  <input
                    type="text"
                    value={formData.display_name}
                    onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                    className="w-full px-3 py-2 bg-white/5 border border-purple-500/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                    placeholder="Enter your company name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Domain (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.domain}
                    onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                    className="w-full px-3 py-2 bg-white/5 border border-purple-500/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                    placeholder="example.com"
                  />
                </div>
              </div>
            </div>

            {/* Logo Upload */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-blue-500/20 p-6">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Image className="w-5 h-5" />
                Company Logo
              </h2>

              <div className="space-y-4">
                {client?.logo_url && !logoPreview && (
                  <div className="flex items-center gap-4">
                    <img
                      src={client.logo_url}
                      alt="Current logo"
                      className="w-16 h-16 object-contain bg-white/10 rounded-lg"
                    />
                    <span className="text-gray-300 text-sm">Current logo</span>
                  </div>
                )}

                {logoPreview && (
                  <div className="flex items-center gap-4">
                    <img
                      src={logoPreview}
                      alt="New logo preview"
                      className="w-16 h-16 object-contain bg-white/10 rounded-lg"
                    />
                    <span className="text-blue-400 text-sm">New logo preview</span>
                  </div>
                )}

                <button
                  onClick={() => setShowLogoUpload(!showLogoUpload)}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  {client?.logo_url ? 'Change Logo' : 'Upload Logo'}
                </button>

                {showLogoUpload && (
                  <div className="space-y-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="w-full px-3 py-2 bg-white/5 border border-purple-500/20 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-purple-600 file:text-white hover:file:bg-purple-700"
                    />
                    <p className="text-xs text-gray-400">
                      Recommended: 200x80px PNG or JPG, max 2MB
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Color Scheme */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-blue-500/20 p-6">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Color Scheme
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Primary Color
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={formData.primary_color}
                      onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                      className="w-12 h-10 rounded border border-purple-500/20"
                    />
                    <input
                      type="text"
                      value={formData.primary_color}
                      onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                      className="flex-1 px-3 py-2 bg-white/5 border border-purple-500/20 rounded-lg text-white text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Secondary Color
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={formData.secondary_color}
                      onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                      className="w-12 h-10 rounded border border-purple-500/20"
                    />
                    <input
                      type="text"
                      value={formData.secondary_color}
                      onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                      className="flex-1 px-3 py-2 bg-white/5 border border-purple-500/20 rounded-lg text-white text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Feature Management */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-blue-500/20 p-6">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Feature Management
              </h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div>
                    <h3 className="text-white font-medium">AI Search Assistance</h3>
                    <p className="text-gray-400 text-sm">Enable AI-powered search help for users</p>
                  </div>
                  <button
                    onClick={() => toggleFeature('ai_search_assistance_enabled')}
                    className="flex items-center"
                  >
                    {formData.ai_search_assistance_enabled ? (
                      <ToggleRight className="w-8 h-8 text-green-400" />
                    ) : (
                      <ToggleLeft className="w-8 h-8 text-gray-400" />
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div>
                    <h3 className="text-white font-medium">Producer Onboarding</h3>
                    <p className="text-gray-400 text-sm">Allow producers to sign up directly</p>
                  </div>
                  <button
                    onClick={() => toggleFeature('producer_onboarding_enabled')}
                    className="flex items-center"
                  >
                    {formData.producer_onboarding_enabled ? (
                      <ToggleRight className="w-8 h-8 text-green-400" />
                    ) : (
                      <ToggleLeft className="w-8 h-8 text-gray-400" />
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div>
                    <h3 className="text-white font-medium">Deep Media Search</h3>
                    <p className="text-gray-400 text-sm">Enable advanced media search capabilities</p>
                  </div>
                  <button
                    onClick={() => toggleFeature('deep_media_search_enabled')}
                    className="flex items-center"
                  >
                    {formData.deep_media_search_enabled ? (
                      <ToggleRight className="w-8 h-8 text-green-400" />
                    ) : (
                      <ToggleLeft className="w-8 h-8 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 