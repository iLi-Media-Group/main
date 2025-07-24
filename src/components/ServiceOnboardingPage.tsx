import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { uploadFile } from '../lib/storage';
import { Layout } from './Layout';

const SUBGENRE_OPTIONS: Record<string, string[]> = {
  studios: [
    'Vocal Tracking (Hip-Hop, R&B, Pop, etc.)',
    'Full Band Tracking (Rock, Jazz, Indie)',
    'Podcast Recording',
    'Voiceover/ADR',
    'Mixing Suite Access',
    'Mastering Room Rental',
    'Production Rooms',
    'Dolby Atmos or Spatial Audio'
  ],
  engineers: [
    'Vocal Engineer',
    'Mixing Engineer',
    'Mastering Engineer',
    'Live Recording Engineer',
    'Post-Production Engineer',
    'Podcast Engineer',
    'Audio Restoration / Cleanup',
    'Sound Design / FX Engineer'
  ],
  artists: [
    'Cover Art Design',
    'Logo Design',
    'Branding Packages',
    'YouTube Thumbnails',
    'Instagram Promo Design',
    'Album Packaging Design',
    'Motion Graphics / Lyric Videos',
    'Web & App UI Mockups',
    'Merch Design'
  ]
};
const TIER_OPTIONS: Record<string, string[]> = {
  studios: [
    'Premium Studio',
    'Project Studio',
    'Mobile Studio'
  ],
  engineers: [],
  artists: []
};
const STYLE_TAGS = [
  'Minimalist',
  'Retro',
  'Hand-Drawn',
  '3D',
  'Modern',
  'Cartoon',
  'Photorealistic',
  'Abstract'
];

export default function ServiceOnboardingPage({ publicMode = false }: { publicMode?: boolean }) {
  const { token } = useParams();
  const navigate = useNavigate();
  const [step, setStep] = useState<'validate' | 'form' | 'success' | 'invalid'>(publicMode ? 'form' : 'validate');
  const [email, setEmail] = useState('');
  const [tokenData, setTokenData] = useState<any>(null);
  const [form, setForm] = useState({
    type: 'studios',
    name: '',
    description: '',
    contact: '',
    website: '',
    image: '',
    subgenres: [] as string[],
    tier: '',
    style_tags: [] as string[]
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!publicMode) {
      setStep('validate');
      setTokenData(null);
      setError('');
    }
  }, [token, publicMode]);

  const validateToken = async () => {
    setLoading(true);
    setError('');
    const { data, error } = await supabase
      .from('service_onboarding_tokens')
      .select('*')
      .eq('token', token)
      .single();
    if (error || !data || data.used || new Date(data.expires_at) < new Date()) {
      setStep('invalid');
      setLoading(false);
      return;
    }
    setTokenData(data);
    setForm(f => ({ ...f, type: data.service_type || 'studios' }));
    setStep('validate');
    setLoading(false);
  };

  useEffect(() => {
    if (!publicMode && token) validateToken();
    // eslint-disable-next-line
  }, [token, publicMode]);

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim().toLowerCase() === tokenData.email.trim().toLowerCase()) {
      setStep('form');
    } else {
      setError('Email does not match the invitation.');
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if ((name === 'subgenres' || name === 'style_tags') && type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      let arr = Array.isArray(form[name as keyof typeof form]) ? [...(form[name as keyof typeof form] as string[])] : [];
      if (checked) {
        arr.push(value);
      } else {
        arr = arr.filter((v: string) => v !== value);
      }
      setForm({ ...form, [name]: arr });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setError('');
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      let imageUrl = form.image;
      if (imageFile) {
        imageUrl = await uploadFile(imageFile, 'service-images');
      }
      const payload = { ...form, image: imageUrl };
      await supabase.from('services').insert([payload]);
      await supabase.from('service_onboarding_tokens').update({ used: true }).eq('id', tokenData.id);
      setStep('success');
    } catch (err: any) {
      setError(err.message || 'Failed to submit service.');
    } finally {
      setLoading(false);
    }
  };

  if (!publicMode && step === 'invalid') {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <h1 className="text-2xl font-bold mb-4 text-red-400">Invalid or Expired Link</h1>
          <p className="text-gray-400">This onboarding link is invalid, expired, or already used.</p>
        </div>
      </Layout>
    );
  }

  if (step === 'success') {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <h1 className="text-2xl font-bold mb-4 text-green-400">Service Submitted!</h1>
          <p className="text-gray-400">Thank you for submitting your service. Our team will review and publish it soon.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
        <div className="w-full max-w-lg bg-white/5 rounded-xl border border-blue-500/20 p-4 sm:p-8 mt-8 mb-8 shadow-xl max-h-[90vh] overflow-y-auto flex flex-col">
          <h1 className="text-2xl font-bold mb-6 text-center">Service Provider Onboarding</h1>
          {!publicMode && step === 'validate' && (
            <form onSubmit={handleEmailSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-1">Enter your email to continue</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded bg-white/10 border border-blue-500/20 text-white"
                  required
                />
              </div>
              {error && <div className="text-red-400">{error}</div>}
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white font-semibold"
                disabled={loading || !email}
              >
                Continue
              </button>
            </form>
          )}
          <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select
                  name="type"
                  value={form.type}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 rounded bg-white/10 border border-blue-500/20 text-white"
                  required
                  disabled
                >
                  <option value="studios">Recording Studios</option>
                  <option value="engineers">Recording Engineers</option>
                  <option value="artists">Graphic Artists</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 rounded bg-white/10 border border-blue-500/20 text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 rounded bg-white/10 border border-blue-500/20 text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Contact Email</label>
                <input
                  type="email"
                  name="contact"
                  value={form.contact}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 rounded bg-white/10 border border-blue-500/20 text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Website</label>
                <input
                  type="text"
                  name="website"
                  value={form.website}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 rounded bg-white/10 border border-blue-500/20 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Service Image/Logo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full px-3 py-2 rounded bg-white/10 border border-blue-500/20 text-white"
                />
                {imagePreview && (
                  <img src={imagePreview} alt="Preview" className="mt-2 h-24 rounded border border-blue-500/20" />
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Subgenres</label>
                <div className="flex flex-wrap gap-2">
                  {SUBGENRE_OPTIONS[form.type]?.map((sub) => (
                    <label key={sub} className="flex items-center space-x-1 text-xs bg-white/10 px-2 py-1 rounded">
                      <input
                        type="checkbox"
                        name="subgenres"
                        value={sub}
                        checked={form.subgenres.includes(sub)}
                        onChange={handleFormChange}
                      />
                      <span>{sub}</span>
                    </label>
                  ))}
                </div>
              </div>
              {TIER_OPTIONS[form.type] && TIER_OPTIONS[form.type].length > 0 && (
                <div>
                  <label className="block text-sm font-medium mb-1">Tier</label>
                  <select
                    name="tier"
                    value={form.tier}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 rounded bg-white/10 border border-blue-500/20 text-white"
                  >
                    <option value="">Select Tier</option>
                    {TIER_OPTIONS[form.type]?.map((tier) => (
                      <option key={tier} value={tier}>{tier}</option>
                    ))}
                  </select>
                </div>
              )}
              {form.type === 'artists' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Style Tags</label>
                  <div className="flex flex-wrap gap-2">
                    {STYLE_TAGS.map((tag) => (
                      <label key={tag} className="flex items-center space-x-1 text-xs bg-white/10 px-2 py-1 rounded">
                        <input
                          type="checkbox"
                          name="style_tags"
                          value={tag}
                          checked={form.style_tags.includes(tag)}
                          onChange={handleFormChange}
                        />
                        <span>{tag}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              {error && <div className="text-red-400">{error}</div>}
              <div className="flex justify-end space-x-2 mt-4">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white"
                  disabled={loading}
                >
                  {loading ? 'Submitting...' : 'Submit Service'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </Layout>
  );
} 