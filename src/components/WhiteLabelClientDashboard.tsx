import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Loader2, CheckCircle } from 'lucide-react';

// Optionally import your LogoUpload component if you want to reuse it
// import { LogoUpload } from './LogoUpload';

interface WhiteLabelClient {
  id: string;
  display_name: string;
  domain?: string;
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
  features?: string[];
  owner_id: string;
  email?: string;
}

export default function WhiteLabelClientDashboard() {
  const { user } = useAuth();
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
    const fileExt = file.name.split('.').pop();
    const filePath = `white_label_logos/${user?.id}.${fileExt}`;
    setLoading(true);
    setError(null);
    try {
      const { error: uploadError } = await supabase.storage
        .from('public')
        .upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('public').getPublicUrl(filePath);
      setLogoUrl(urlData.publicUrl);
    } catch (err) {
      setError('Failed to upload logo.');
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin w-8 h-8 text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-8">
          <p className="text-red-400 text-center font-medium">{error}</p>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-white/5 border border-blue-500/20 rounded-lg p-8">
          <p className="text-gray-300 text-center font-medium">No white label client profile found for your account.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 px-4 py-8">
      <div className="max-w-2xl mx-auto bg-white/5 rounded-xl border border-blue-500/20 p-8">
        <h1 className="text-3xl font-bold text-white mb-6">White Label Admin Dashboard</h1>
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">Company Name</label>
          <input
            type="text"
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            className="w-full px-3 py-2 bg-white/10 border border-blue-500/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            placeholder="Enter your company name"
          />
        </div>
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">Domain</label>
          <input
            type="text"
            value={domain}
            onChange={e => setDomain(e.target.value)}
            className="w-full px-3 py-2 bg-white/10 border border-blue-500/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            placeholder="yourdomain.com"
          />
        </div>
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">Logo</label>
          <div className="flex items-center space-x-4">
            {logoUrl && (
              <img src={logoUrl} alt="Logo" className="w-16 h-16 rounded-full object-cover border border-blue-500/30" />
            )}
            <input type="file" accept="image/*" onChange={handleLogoUpload} className="text-white" />
          </div>
        </div>
        <div className="mb-6 grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Primary Color</label>
            <input
              type="color"
              value={primaryColor}
              onChange={e => setPrimaryColor(e.target.value)}
              className="w-12 h-10 rounded border border-blue-500/20"
            />
            <input
              type="text"
              value={primaryColor}
              onChange={e => setPrimaryColor(e.target.value)}
              className="ml-2 px-3 py-2 bg-white/10 border border-blue-500/20 rounded-lg text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Secondary Color</label>
            <input
              type="color"
              value={secondaryColor}
              onChange={e => setSecondaryColor(e.target.value)}
              className="w-12 h-10 rounded border border-blue-500/20"
            />
            <input
              type="text"
              value={secondaryColor}
              onChange={e => setSecondaryColor(e.target.value)}
              className="ml-2 px-3 py-2 bg-white/10 border border-blue-500/20 rounded-lg text-white text-sm"
            />
          </div>
        </div>
        {/* Features Section */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">Enabled Features</label>
          <ul className="list-disc list-inside text-white">
            {client.features && client.features.length > 0 ? (
              client.features.map((feature, idx) => (
                <li key={idx}>{feature}</li>
              ))
            ) : (
              <li>No features enabled</li>
            )}
          </ul>
        </div>
        <button
          onClick={handleSave}
          className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center"
          disabled={loading}
        >
          {loading ? <Loader2 className="animate-spin w-5 h-5 mr-2" /> : null}
          Save Changes
        </button>
        {success && (
          <div className="mt-4 flex items-center justify-center text-green-400">
            <CheckCircle className="w-5 h-5 mr-2" /> Changes saved!
          </div>
        )}
      </div>
    </div>
  );
} 