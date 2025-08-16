import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { uploadFile } from '../lib/storage';

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

export default function PublicServiceOnboardingPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [step, setStep] = useState<'validate' | 'form' | 'success' | 'invalid'>('validate');
  const [email, setEmail] = useState('');
  const [invitedEmail, setInvitedEmail] = useState('');
  const [serviceType, setServiceType] = useState('studios');
  const [form, setForm] = useState({
    type: 'studios',
    name: '',
    description: '',
    contact: '',
    website: '',
    image: '',
    image2: '',
    image3: '',
    subgenres: [] as string[],
    tier: '',
    style_tags: [] as string[]
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile2, setImageFile2] = useState<File | null>(null);
  const [imagePreview2, setImagePreview2] = useState<string | null>(null);
  const [imageFile3, setImageFile3] = useState<File | null>(null);
  const [imagePreview3, setImagePreview3] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Get email from URL parameters
    const emailParam = searchParams.get('email');
    const typeParam = searchParams.get('type');
    
    if (emailParam) {
      setInvitedEmail(emailParam);
      setEmail(emailParam); // Pre-fill the email field
    }
    
    if (typeParam && ['studios', 'engineers', 'artists'].includes(typeParam)) {
      setServiceType(typeParam);
      setForm(f => ({ ...f, type: typeParam }));
    }
  }, [searchParams]);

  const validateEmail = async () => {
    setLoading(true);
    setError('');
    
    // Check if this email has been invited for service onboarding
    const { data, error } = await supabase
      .from('service_onboarding_tokens')
      .select('*')
      .eq('email', email.trim().toLowerCase())
      .eq('used', false)
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      setError('No valid invitation found for this email address. Please contact us for an invitation.');
      setStep('invalid');
      setLoading(false);
      return;
    }

    // Check if email matches the invited email
    if (email.trim().toLowerCase() !== data.email.trim().toLowerCase()) {
      setError('Email does not match the invitation.');
      setLoading(false);
      return;
    }

    setServiceType(data.service_type || 'studios');
    setForm(f => ({ ...f, type: data.service_type || 'studios' }));
    setStep('form');
    setLoading(false);
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    validateEmail();
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, imageNum = 1) => {
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
    if (imageNum === 1) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    } else if (imageNum === 2) {
      setImageFile2(file);
      setImagePreview2(URL.createObjectURL(file));
    } else if (imageNum === 3) {
      setImageFile3(file);
      setImagePreview3(URL.createObjectURL(file));
    }
    setError('');
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      let imageUrl = form.image;
      let imageUrl2 = form.image2;
      let imageUrl3 = form.image3;
      
      if (imageFile) {
        imageUrl = await uploadFile(imageFile, 'service-images');
      }
      if (imageFile2) {
        imageUrl2 = await uploadFile(imageFile2, 'service-images');
      }
      if (imageFile3) {
        imageUrl3 = await uploadFile(imageFile3, 'service-images');
      }

      const { error: insertError } = await supabase.from('services').insert({
        type: form.type,
        name: form.name,
        description: form.description,
        contact: form.contact,
        website: form.website,
        image: imageUrl,
        image2: imageUrl2,
        image3: imageUrl3,
        subgenres: form.subgenres,
        tier: form.tier,
        style_tags: form.style_tags
      });

      if (insertError) throw insertError;

      // Mark the token as used
      const { error: updateError } = await supabase
        .from('service_onboarding_tokens')
        .update({ used: true })
        .eq('email', email.trim().toLowerCase())
        .eq('used', false);

      if (updateError) {
        console.error('Error marking token as used:', updateError);
      }

      setStep('success');
    } catch (err: any) {
      setError(err.message || 'Failed to submit service');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'validate') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-blue-500/20 p-8 max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Welcome to MyBeatFi</h1>
            <p className="text-gray-300">Please verify your email to add your service</p>
          </div>
          
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-blue-500/20 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-400/30"
                placeholder="Enter your email address"
                required
              />
            </div>
            
            {error && (
              <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                {error}
              </div>
            )}
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Continue'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (step === 'invalid') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-red-500/20 p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Invalid Invitation</h1>
          <p className="text-gray-300 mb-6">{error}</p>
          <button
            onClick={() => {
              setStep('validate');
              setError('');
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-green-500/20 p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Service Added Successfully!</h1>
          <p className="text-gray-300 mb-6">
            Thank you for adding your service to MyBeatFi. Your service will be reviewed and published soon.
          </p>
          <button
            onClick={() => navigate('/')}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-blue-500/20 p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Add Your Service</h1>
            <p className="text-gray-300">Complete the form below to add your service to MyBeatFi</p>
            <p className="text-sm text-blue-300 mt-2">Invited Email: {invitedEmail}</p>
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-6">
            {/* Service Type */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Service Type
              </label>
              <select
                name="type"
                value={form.type}
                onChange={handleFormChange}
                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-blue-500/20 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-400/30"
              >
                <option value="studios">Recording Studios</option>
                <option value="engineers">Recording Engineers</option>
                <option value="artists">Graphic Artists</option>
              </select>
            </div>

            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Service Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleFormChange}
                  required
                  className="w-full px-4 py-3 rounded-lg bg-white/10 border border-blue-500/20 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-400/30"
                  placeholder="Enter service name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Contact Email *
                </label>
                <input
                  type="email"
                  name="contact"
                  value={form.contact}
                  onChange={handleFormChange}
                  required
                  className="w-full px-4 py-3 rounded-lg bg-white/10 border border-blue-500/20 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-400/30"
                  placeholder="contact@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Website
              </label>
              <input
                type="url"
                name="website"
                value={form.website}
                onChange={handleFormChange}
                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-blue-500/20 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-400/30"
                placeholder="https://yourwebsite.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description *
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleFormChange}
                required
                rows={4}
                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-blue-500/20 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-400/30"
                placeholder="Describe your service..."
              />
            </div>

            {/* Tier (for studios) */}
            {form.type === 'studios' && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Studio Tier
                </label>
                <select
                  name="tier"
                  value={form.tier}
                  onChange={handleFormChange}
                  className="w-full px-4 py-3 rounded-lg bg-white/10 border border-blue-500/20 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-400/30"
                >
                  <option value="">Select tier</option>
                  {TIER_OPTIONS.studios.map(tier => (
                    <option key={tier} value={tier}>{tier}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Subgenres */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Specialties
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {SUBGENRE_OPTIONS[form.type]?.map(subgenre => (
                  <label key={subgenre} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      name="subgenres"
                      value={subgenre}
                      checked={form.subgenres.includes(subgenre)}
                      onChange={handleFormChange}
                      className="rounded border-blue-500/20 bg-white/10 text-blue-500 focus:ring-blue-400/30"
                    />
                    <span className="text-gray-300 text-sm">{subgenre}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Style Tags (for artists) */}
            {form.type === 'artists' && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Style Tags
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {STYLE_TAGS.map(tag => (
                    <label key={tag} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        name="style_tags"
                        value={tag}
                        checked={form.style_tags.includes(tag)}
                        onChange={handleFormChange}
                        className="rounded border-blue-500/20 bg-white/10 text-blue-500 focus:ring-blue-400/30"
                      />
                      <span className="text-gray-300 text-sm">{tag}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Images */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Images</h3>
              
              {/* Main Image */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Main Image *
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageChange(e, 1)}
                  className="w-full px-4 py-3 rounded-lg bg-white/10 border border-blue-500/20 text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-500 file:text-white hover:file:bg-blue-600"
                />
                {imagePreview && (
                  <img src={imagePreview} alt="Preview" className="mt-2 h-20 w-20 object-cover rounded" />
                )}
              </div>

              {/* Additional Images */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Additional Image 1
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageChange(e, 2)}
                    className="w-full px-4 py-3 rounded-lg bg-white/10 border border-blue-500/20 text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-500 file:text-white hover:file:bg-blue-600"
                  />
                  {imagePreview2 && (
                    <img src={imagePreview2} alt="Preview 2" className="mt-2 h-20 w-20 object-cover rounded" />
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Additional Image 2
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageChange(e, 3)}
                    className="w-full px-4 py-3 rounded-lg bg-white/10 border border-blue-500/20 text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-500 file:text-white hover:file:bg-blue-600"
                  />
                  {imagePreview3 && (
                    <img src={imagePreview3} alt="Preview 3" className="mt-2 h-20 w-20 object-cover rounded" />
                  )}
                </div>
              </div>
            </div>

            {error && (
              <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                {error}
              </div>
            )}

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => setStep('validate')}
                className="px-6 py-3 border border-gray-500 text-gray-300 rounded-lg hover:bg-gray-500/10 transition-colors"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-lg transition-all duration-200 disabled:opacity-50"
              >
                {loading ? 'Submitting...' : 'Submit Service'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
