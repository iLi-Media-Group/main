import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useUnifiedAuth } from '../contexts/UnifiedAuthContext';
import { uploadFile } from '../lib/storage';

const COLOR_FIELDS = [
  { key: 'brand_primary_color', label: 'Primary Color' },
  { key: 'brand_secondary_color', label: 'Secondary Color' },
  { key: 'accent_color', label: 'Accent Color' },
  { key: 'background_color', label: 'Background Color' },
];

export default function ClientBrandingSettings() {
  const { user } = useUnifiedAuth();
  const [client, setClient] = useState<any>(null);
  const [form, setForm] = useState<any>({});
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    supabase
      .from('white_label_clients')
      .select('*')
      .eq('owner_id', user.id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          setError('Could not load your white label client settings.');
        } else {
          setClient(data);
          setForm({ ...data });
          setLogoPreview(data.logo_url || null);
        }
        setLoading(false);
      });
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setForm((f: any) => ({ ...f, [name]: value }));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('Image size must be less than 2MB');
      return;
    }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      let logoUrl = form.logo_url;
      if (logoFile) {
        logoUrl = await uploadFile(logoFile, 'service-images');
      }
      const payload = { ...form, logo_url: logoUrl };
      const { error } = await supabase
        .from('white_label_clients')
        .update(payload)
        .eq('id', client.id);
      if (error) throw error;
      setSuccess('Branding updated!');
      setLogoFile(null);
    } catch (err: any) {
      setError(err.message || 'Failed to update branding.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-400">Loading...</div>;
  }
  if (!client) {
    return <div className="p-8 text-center text-red-400">You do not have access to branding settings.</div>;
  }

  // Live preview styles
  const previewStyle = {
    background: form.background_color || '#18181b',
    color: form.brand_primary_color || '#fff',
    border: `2px solid ${form.brand_secondary_color || '#6366f1'}`,
    padding: '2rem',
    borderRadius: '1rem',
    marginTop: '2rem',
    textAlign: 'center' as const,
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Branding Settings</h1>
      <form onSubmit={handleSubmit} className="space-y-6 bg-white/5 rounded-xl border border-blue-500/20 p-6">
        <div>
          <label className="block text-sm font-medium mb-1">Site Name</label>
          <input
            type="text"
            name="display_name"
            value={form.display_name || ''}
            onChange={handleChange}
            className="w-full px-3 py-2 rounded bg-white/10 border border-blue-500/20 text-white"
            placeholder="Enter your site name"
          />
        </div>
        {COLOR_FIELDS.map((field) => (
          <div key={field.key}>
            <label className="block text-sm font-medium mb-1">{field.label}</label>
            <input
              type="color"
              name={field.key}
              value={form[field.key] || '#000000'}
              onChange={handleChange}
              className="w-16 h-10 p-0 border-none bg-transparent"
            />
          </div>
        ))}
        <div>
          <label className="block text-sm font-medium mb-1">Logo</label>
          <input type="file" accept="image/*" onChange={handleLogoChange} />
          {logoPreview && (
            <img src={logoPreview} alt="Logo Preview" className="h-20 mt-2 rounded border border-blue-500/20 object-contain" style={{ background: 'transparent' }} />
          )}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Footer Text</label>
          <textarea
            name="footer_text"
            value={form.footer_text || ''}
            onChange={handleChange}
            className="w-full px-3 py-2 rounded bg-white/10 border border-blue-500/20 text-white"
          />
        </div>
        {error && <div className="text-red-400">{error}</div>}
        {success && <div className="text-green-400">{success}</div>}
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white font-semibold"
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
      <div style={previewStyle} className="shadow-xl">
        {logoPreview && <img src={logoPreview} alt="Logo Preview" className="h-16 mx-auto mb-4 object-contain" style={{ background: 'transparent' }} />}
        <h2 className="text-xl font-bold mb-2">{form.display_name || 'Live Preview'}</h2>
        <p>This is how your branding will look!</p>
        <div className="mt-4 text-sm text-gray-400">{form.footer_text}</div>
      </div>
    </div>
  );
} 