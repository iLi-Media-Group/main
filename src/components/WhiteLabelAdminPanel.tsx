import React, { useState, useEffect } from 'react';
import { 
  Palette, 
  Upload, 
  Save, 
  Eye, 
  EyeOff, 
  Globe, 
  Settings, 
  Users, 
  Crown, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  Copy,
  ExternalLink,
  Trash2,
  Plus,
  Edit3,
  Image as ImageIcon,
  Type,
  Layout
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface WhiteLabelClient {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  company_name: string | null;
  domain: string | null;
  created_at: string;
  is_active: boolean;
}

interface BrandingConfig {
  id: string;
  client_id: string;
  logo_url: string | null;
  favicon_url: string | null;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  background_gradient: string;
  font_family: string;
  custom_css: string | null;
  site_title: string;
  meta_description: string;
  contact_email: string;
  support_email: string;
  created_at: string;
  updated_at: string;
}

export function WhiteLabelAdminPanel() {
  const { user } = useAuth();
  const [clients, setClients] = useState<WhiteLabelClient[]>([]);
  const [selectedClient, setSelectedClient] = useState<WhiteLabelClient | null>(null);
  const [brandingConfig, setBrandingConfig] = useState<BrandingConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);

  // Branding form state
  const [brandingForm, setBrandingForm] = useState({
    logo_url: '',
    favicon_url: '',
    primary_color: '#3b82f6',
    secondary_color: '#1e40af',
    accent_color: '#10b981',
    background_gradient: 'from-gray-900 via-blue-900 to-gray-900',
    font_family: 'Inter',
    custom_css: '',
    site_title: '',
    meta_description: '',
    contact_email: '',
    support_email: ''
  });

  useEffect(() => {
    if (user) {
      fetchWhiteLabelClients();
    }
  }, [user]);

  useEffect(() => {
    if (selectedClient) {
      fetchBrandingConfig(selectedClient.id);
    }
  }, [selectedClient]);

  const fetchWhiteLabelClients = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: clientData, error: clientError } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name, company_name, domain, created_at, is_active')
        .eq('account_type', 'white_label')
        .order('created_at', { ascending: false });

      if (clientError) throw clientError;

      setClients(clientData || []);
    } catch (err) {
      console.error('Error fetching white label clients:', err);
      setError('Failed to load white label clients');
    } finally {
      setLoading(false);
    }
  };

  const fetchBrandingConfig = async (clientId: string) => {
    try {
      const { data: configData, error: configError } = await supabase
        .from('white_label_branding')
        .select('*')
        .eq('client_id', clientId)
        .single();

      if (configError && configError.code !== 'PGRST116') {
        throw configError;
      }

      if (configData) {
        setBrandingConfig(configData);
        setBrandingForm({
          logo_url: configData.logo_url || '',
          favicon_url: configData.favicon_url || '',
          primary_color: configData.primary_color || '#3b82f6',
          secondary_color: configData.secondary_color || '#1e40af',
          accent_color: configData.accent_color || '#10b981',
          background_gradient: configData.background_gradient || 'from-gray-900 via-blue-900 to-gray-900',
          font_family: configData.font_family || 'Inter',
          custom_css: configData.custom_css || '',
          site_title: configData.site_title || '',
          meta_description: configData.meta_description || '',
          contact_email: configData.contact_email || '',
          support_email: configData.support_email || ''
        });
      } else {
        // Create default config
        setBrandingConfig(null);
        setBrandingForm({
          logo_url: '',
          favicon_url: '',
          primary_color: '#3b82f6',
          secondary_color: '#1e40af',
          accent_color: '#10b981',
          background_gradient: 'from-gray-900 via-blue-900 to-gray-900',
          font_family: 'Inter',
          custom_css: '',
          site_title: selectedClient?.company_name || '',
          meta_description: '',
          contact_email: selectedClient?.email || '',
          support_email: selectedClient?.email || ''
        });
      }
    } catch (err) {
      console.error('Error fetching branding config:', err);
      setError('Failed to load branding configuration');
    }
  };

  const handleLogoUpload = async (file: File) => {
    if (!selectedClient) return;

    try {
      setUploadingLogo(true);
      setError(null);

      const fileExt = file.name.split('.').pop();
      const fileName = `${selectedClient.id}/logo.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('white-label-assets')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('white-label-assets')
        .getPublicUrl(fileName);

      setBrandingForm(prev => ({ ...prev, logo_url: publicUrl }));
      setSuccess('Logo uploaded successfully!');
    } catch (err) {
      console.error('Error uploading logo:', err);
      setError('Failed to upload logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleFaviconUpload = async (file: File) => {
    if (!selectedClient) return;

    try {
      setUploadingFavicon(true);
      setError(null);

      const fileExt = file.name.split('.').pop();
      const fileName = `${selectedClient.id}/favicon.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('white-label-assets')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('white-label-assets')
        .getPublicUrl(fileName);

      setBrandingForm(prev => ({ ...prev, favicon_url: publicUrl }));
      setSuccess('Favicon uploaded successfully!');
    } catch (err) {
      console.error('Error uploading favicon:', err);
      setError('Failed to upload favicon');
    } finally {
      setUploadingFavicon(false);
    }
  };

  const saveBrandingConfig = async () => {
    if (!selectedClient) return;

    try {
      setSaving(true);
      setError(null);

      const configData = {
        client_id: selectedClient.id,
        ...brandingForm,
        updated_at: new Date().toISOString()
      };

      let result;
      if (brandingConfig) {
        // Update existing config
        result = await supabase
          .from('white_label_branding')
          .update(configData)
          .eq('id', brandingConfig.id);
      } else {
        // Create new config
        result = await supabase
          .from('white_label_branding')
          .insert([configData]);
      }

      if (result.error) throw result.error;

      setSuccess('Branding configuration saved successfully!');
      fetchBrandingConfig(selectedClient.id);
    } catch (err) {
      console.error('Error saving branding config:', err);
      setError('Failed to save branding configuration');
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccess('Copied to clipboard!');
  };

  const fontOptions = [
    { value: 'Inter', label: 'Inter (Modern)' },
    { value: 'Roboto', label: 'Roboto (Clean)' },
    { value: 'Open Sans', label: 'Open Sans (Readable)' },
    { value: 'Poppins', label: 'Poppins (Professional)' },
    { value: 'Montserrat', label: 'Montserrat (Bold)' },
    { value: 'Lato', label: 'Lato (Friendly)' }
  ];

  const gradientOptions = [
    { value: 'from-gray-900 via-blue-900 to-gray-900', label: 'Blue Professional' },
    { value: 'from-purple-900 via-pink-900 to-purple-900', label: 'Purple Creative' },
    { value: 'from-green-900 via-emerald-900 to-green-900', label: 'Green Natural' },
    { value: 'from-red-900 via-orange-900 to-red-900', label: 'Red Energetic' },
    { value: 'from-indigo-900 via-purple-900 to-indigo-900', label: 'Indigo Modern' },
    { value: 'from-slate-900 via-gray-900 to-slate-900', label: 'Gray Minimal' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-300">Loading white label clients...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">White Label Admin Panel</h1>
            <p className="text-xl text-gray-300 mt-2">Manage branding and customization for white label clients</p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setPreviewMode(!previewMode)}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center ${
                previewMode 
                  ? 'bg-green-600 hover:bg-green-700 text-white' 
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
            >
              {previewMode ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
              {previewMode ? 'Hide Preview' : 'Show Preview'}
            </button>
          </div>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center">
            <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
            <span className="text-red-400">{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center">
            <CheckCircle className="w-5 h-5 text-green-400 mr-2" />
            <span className="text-green-400">{success}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Client List */}
          <div className="lg:col-span-1">
            <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-blue-500/20 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  White Label Clients
                </h2>
                <Crown className="w-5 h-5 text-yellow-400" />
              </div>

              {clients.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400">No white label clients found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {clients.map((client) => (
                    <div
                      key={client.id}
                      onClick={() => setSelectedClient(client)}
                      className={`p-4 rounded-lg cursor-pointer transition-all ${
                        selectedClient?.id === client.id
                          ? 'bg-blue-600/20 border border-blue-500/40'
                          : 'bg-white/5 hover:bg-white/10 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-white">
                            {client.company_name || client.first_name || client.email}
                          </h3>
                          <p className="text-sm text-gray-400">{client.email}</p>
                          {client.domain && (
                            <p className="text-xs text-blue-400">{client.domain}</p>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          {client.is_active ? (
                            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                          ) : (
                            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Branding Configuration */}
          <div className="lg:col-span-2">
            {selectedClient ? (
              <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-blue-500/20 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-white flex items-center">
                      <Palette className="w-5 h-5 mr-2" />
                      Branding Configuration
                    </h2>
                    <p className="text-gray-400 mt-1">
                      {selectedClient.company_name || selectedClient.first_name || selectedClient.email}
                    </p>
                  </div>
                  <button
                    onClick={saveBrandingConfig}
                    disabled={saving}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center disabled:opacity-50"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Save Changes
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Logo Upload */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white flex items-center">
                      <ImageIcon className="w-4 h-4 mr-2" />
                      Logo & Favicon
                    </h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Company Logo
                        </label>
                        <div className="flex items-center space-x-4">
                          {brandingForm.logo_url && (
                            <img 
                              src={brandingForm.logo_url} 
                              alt="Logo preview" 
                              className="w-16 h-16 object-contain bg-white/10 rounded-lg"
                            />
                          )}
                          <label className="flex items-center justify-center w-32 h-16 border-2 border-dashed border-blue-500/20 rounded-lg hover:border-blue-500/40 transition-colors cursor-pointer">
                            <div className="text-center">
                              {uploadingLogo ? (
                                <Loader2 className="w-6 h-6 text-blue-500 animate-spin mx-auto" />
                              ) : (
                                <>
                                  <Upload className="w-6 h-6 text-blue-500 mx-auto mb-1" />
                                  <span className="text-xs text-gray-400">Upload Logo</span>
                                </>
                              )}
                            </div>
                            <input
                              type="file"
                              className="hidden"
                              accept="image/*"
                              onChange={(e) => e.target.files?.[0] && handleLogoUpload(e.target.files[0])}
                              disabled={uploadingLogo}
                            />
                          </label>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Favicon
                        </label>
                        <div className="flex items-center space-x-4">
                          {brandingForm.favicon_url && (
                            <img 
                              src={brandingForm.favicon_url} 
                              alt="Favicon preview" 
                              className="w-8 h-8 object-contain bg-white/10 rounded"
                            />
                          )}
                          <label className="flex items-center justify-center w-16 h-16 border-2 border-dashed border-blue-500/20 rounded-lg hover:border-blue-500/40 transition-colors cursor-pointer">
                            <div className="text-center">
                              {uploadingFavicon ? (
                                <Loader2 className="w-4 h-4 text-blue-500 animate-spin mx-auto" />
                              ) : (
                                <>
                                  <Upload className="w-4 h-4 text-blue-500 mx-auto mb-1" />
                                  <span className="text-xs text-gray-400">Favicon</span>
                                </>
                              )}
                            </div>
                            <input
                              type="file"
                              className="hidden"
                              accept="image/*"
                              onChange={(e) => e.target.files?.[0] && handleFaviconUpload(e.target.files[0])}
                              disabled={uploadingFavicon}
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Color Scheme */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white flex items-center">
                      <Palette className="w-4 h-4 mr-2" />
                      Color Scheme
                    </h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Primary Color
                        </label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="color"
                            value={brandingForm.primary_color}
                            onChange={(e) => setBrandingForm(prev => ({ ...prev, primary_color: e.target.value }))}
                            className="w-12 h-10 rounded border border-gray-600"
                          />
                          <input
                            type="text"
                            value={brandingForm.primary_color}
                            onChange={(e) => setBrandingForm(prev => ({ ...prev, primary_color: e.target.value }))}
                            className="flex-1 px-3 py-2 bg-white/10 border border-gray-600 rounded text-white"
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
                            value={brandingForm.secondary_color}
                            onChange={(e) => setBrandingForm(prev => ({ ...prev, secondary_color: e.target.value }))}
                            className="w-12 h-10 rounded border border-gray-600"
                          />
                          <input
                            type="text"
                            value={brandingForm.secondary_color}
                            onChange={(e) => setBrandingForm(prev => ({ ...prev, secondary_color: e.target.value }))}
                            className="flex-1 px-3 py-2 bg-white/10 border border-gray-600 rounded text-white"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Accent Color
                        </label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="color"
                            value={brandingForm.accent_color}
                            onChange={(e) => setBrandingForm(prev => ({ ...prev, accent_color: e.target.value }))}
                            className="w-12 h-10 rounded border border-gray-600"
                          />
                          <input
                            type="text"
                            value={brandingForm.accent_color}
                            onChange={(e) => setBrandingForm(prev => ({ ...prev, accent_color: e.target.value }))}
                            className="flex-1 px-3 py-2 bg-white/10 border border-gray-600 rounded text-white"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Background & Typography */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white flex items-center">
                      <Layout className="w-4 h-4 mr-2" />
                      Background & Typography
                    </h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Background Gradient
                        </label>
                        <select
                          value={brandingForm.background_gradient}
                          onChange={(e) => setBrandingForm(prev => ({ ...prev, background_gradient: e.target.value }))}
                          className="w-full px-3 py-2 bg-white/10 border border-gray-600 rounded text-white"
                        >
                          {gradientOptions.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Font Family
                        </label>
                        <select
                          value={brandingForm.font_family}
                          onChange={(e) => setBrandingForm(prev => ({ ...prev, font_family: e.target.value }))}
                          className="w-full px-3 py-2 bg-white/10 border border-gray-600 rounded text-white"
                        >
                          {fontOptions.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Site Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white flex items-center">
                      <Type className="w-4 h-4 mr-2" />
                      Site Information
                    </h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Site Title
                        </label>
                        <input
                          type="text"
                          value={brandingForm.site_title}
                          onChange={(e) => setBrandingForm(prev => ({ ...prev, site_title: e.target.value }))}
                          className="w-full px-3 py-2 bg-white/10 border border-gray-600 rounded text-white"
                          placeholder="Enter site title"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Meta Description
                        </label>
                        <textarea
                          value={brandingForm.meta_description}
                          onChange={(e) => setBrandingForm(prev => ({ ...prev, meta_description: e.target.value }))}
                          className="w-full px-3 py-2 bg-white/10 border border-gray-600 rounded text-white"
                          rows={3}
                          placeholder="Enter meta description"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Contact Email
                        </label>
                        <input
                          type="email"
                          value={brandingForm.contact_email}
                          onChange={(e) => setBrandingForm(prev => ({ ...prev, contact_email: e.target.value }))}
                          className="w-full px-3 py-2 bg-white/10 border border-gray-600 rounded text-white"
                          placeholder="contact@company.com"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Support Email
                        </label>
                        <input
                          type="email"
                          value={brandingForm.support_email}
                          onChange={(e) => setBrandingForm(prev => ({ ...prev, support_email: e.target.value }))}
                          className="w-full px-3 py-2 bg-white/10 border border-gray-600 rounded text-white"
                          placeholder="support@company.com"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Custom CSS */}
                  <div className="md:col-span-2 space-y-4">
                    <h3 className="text-lg font-semibold text-white flex items-center">
                      <Settings className="w-4 h-4 mr-2" />
                      Custom CSS
                    </h3>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Additional CSS Styles
                      </label>
                      <textarea
                        value={brandingForm.custom_css}
                        onChange={(e) => setBrandingForm(prev => ({ ...prev, custom_css: e.target.value }))}
                        className="w-full px-3 py-2 bg-white/10 border border-gray-600 rounded text-white font-mono text-sm"
                        rows={6}
                        placeholder="/* Add custom CSS styles here */"
                      />
                    </div>
                  </div>
                </div>

                {/* Preview Section */}
                {previewMode && (
                  <div className="mt-8 p-6 bg-white/5 rounded-xl border border-blue-500/20">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                      <Eye className="w-4 h-4 mr-2" />
                      Live Preview
                    </h3>
                    <div 
                      className="p-6 rounded-lg"
                      style={{
                        background: `linear-gradient(to bottom right, ${brandingForm.primary_color}20, ${brandingForm.secondary_color}20)`,
                        fontFamily: brandingForm.font_family
                      }}
                    >
                      <div className="flex items-center justify-between mb-6">
                        {brandingForm.logo_url && (
                          <img 
                            src={brandingForm.logo_url} 
                            alt="Logo" 
                            className="h-8 object-contain"
                          />
                        )}
                        <h1 className="text-2xl font-bold" style={{ color: brandingForm.primary_color }}>
                          {brandingForm.site_title || 'Your Brand'}
                        </h1>
                      </div>
                      
                      <div className="space-y-4">
                        <p className="text-gray-300">
                          {brandingForm.meta_description || 'Your music licensing platform description'}
                        </p>
                        
                        <div className="flex space-x-4">
                          <button 
                            className="px-4 py-2 rounded-lg text-white transition-colors"
                            style={{ backgroundColor: brandingForm.primary_color }}
                          >
                            Primary Button
                          </button>
                          <button 
                            className="px-4 py-2 rounded-lg text-white transition-colors"
                            style={{ backgroundColor: brandingForm.accent_color }}
                          >
                            Accent Button
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-blue-500/20 p-12 text-center">
                <Palette className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Select a Client</h3>
                <p className="text-gray-400">Choose a white label client from the list to configure their branding</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 