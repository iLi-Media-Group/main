import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Layout } from './Layout';
import { v4 as uuidv4 } from 'uuid';

const SERVICE_TYPES = [
  { key: 'studios', label: 'Recording Studios' },
  { key: 'engineers', label: 'Recording Engineers' },
  { key: 'artists', label: 'Graphic Artists' },
];

// Subgenre and tier options for each service type
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

interface Service {
  id: string;
  type: string;
  name: string;
  description: string;
  contact: string;
  website: string;
  image: string;
  subgenres: string[];
  tier: string;
  style_tags: string[];
}

interface ServiceForm {
  type: string;
  name: string;
  description: string;
  contact: string;
  website: string;
  image: string;
  subgenres: string[];
  tier: string;
  style_tags: string[];
}

export default function AdminServicesPage() {
  const [activeTab, setActiveTab] = useState('services');
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [form, setForm] = useState<ServiceForm>({ type: 'studios', name: '', description: '', contact: '', website: '', image: '', subgenres: [], tier: '', style_tags: [] });
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [onboardingEmail, setOnboardingEmail] = useState('');
  const [onboardingType, setOnboardingType] = useState('studios');
  const [onboardingLink, setOnboardingLink] = useState('');
  const [sendingOnboarding, setSendingOnboarding] = useState(false);
  const [onboardingError, setOnboardingError] = useState('');

  useEffect(() => {
    if (activeTab === 'services') fetchServices();
  }, [activeTab]);

  const fetchServices = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('services').select('*').order('name');
    if (error) setError(error.message);
    else setServices(data);
    setLoading(false);
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setForm({
      type: service.type,
      name: service.name,
      description: service.description,
      contact: service.contact,
      website: service.website,
      image: service.image,
      subgenres: service.subgenres,
      tier: service.tier,
      style_tags: service.style_tags
    });
    setShowForm(true);
  };

  const handleAdd = () => {
    setEditingService(null);
    setForm({ type: 'studios', name: '', description: '', contact: '', website: '', image: '', subgenres: [], tier: '', style_tags: [] });
    setShowForm(true);
  };

  const handleDelete = async (service: Service) => {
    await supabase.from('services').delete().eq('id', service.id);
    fetchServices();
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if ((name === 'subgenres' || name === 'style_tags') && type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      let arr = Array.isArray(form[name as keyof ServiceForm]) ? [...(form[name as keyof ServiceForm] as string[])] : [];
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

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...form };
    if (editingService) {
      await supabase.from('services').update(payload).eq('id', editingService.id);
    } else {
      await supabase.from('services').insert([payload]);
    }
    setShowForm(false);
    setEditingService(null);
    fetchServices();
  };

  const handleSendOnboardingLink = async () => {
    setSendingOnboarding(true);
    setOnboardingError('');
    setOnboardingLink('');
    try {
      const token = uuidv4();
      const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 3).toISOString(); // 3 days
      const { error } = await supabase.from('service_onboarding_tokens').insert({
        email: onboardingEmail,
        token,
        service_type: onboardingType,
        expires_at: expiresAt
      });
      if (error) throw error;
      const link = `${window.location.origin}/service-onboarding/${token}`;
      setOnboardingLink(link);
  
      // Call your Supabase Edge Function to send the email
      const functionUrl = `${import.meta.env.VITE_SUPABASE_FUNCTION_URL}/send-service-onboarding-email`;
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: onboardingEmail, link })
      });
      if (!response.ok) {
        const { error } = await response.json();
        throw new Error(error || 'Failed to send onboarding email');
      }
    } catch (err: any) {
      setOnboardingError(err.message || 'Failed to send onboarding link');
    } finally {
      setSendingOnboarding(false);
    }
  };

  const filteredServices = services.filter(
    (service) =>
      (form.type === service.type || form.type === '') &&
      (service.name.toLowerCase().includes(search.toLowerCase()) ||
        service.description.toLowerCase().includes(search.toLowerCase()) ||
        service.contact.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <Layout>
      <div className="p-6 text-white max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Admin Panel</h1>
        <div className="flex space-x-2 mb-8">
          <button
            className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${activeTab === 'services' ? 'bg-gradient-to-tr from-blue-500 via-purple-500 to-blue-400 text-white shadow-md' : 'text-gray-300 hover:text-white hover:bg-white/10'}`}
            onClick={() => setActiveTab('services')}
          >
            Services
          </button>
          {/* Future: Add more tabs here */}
        </div>
        {activeTab === 'services' && (
          <>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
              <button
                className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded mb-2 md:mb-0"
                onClick={handleAdd}
              >
                Add Service
              </button>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search services..."
                className="w-full md:w-64 px-4 py-2 rounded-full bg-white/10 border border-blue-500/20 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-400/30 text-base shadow-inner transition-all"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
              {loading ? (
                <p className="col-span-full text-center text-gray-400">Loading...</p>
              ) : filteredServices.length === 0 ? (
                <p className="col-span-full text-center text-gray-400">No services found.</p>
              ) : (
                filteredServices.map((service) => (
                  <div key={service.id} className="bg-white/5 rounded-xl shadow-xl p-6 flex flex-col items-center animated-border relative">
                    <img
                      src={service.image}
                      alt={service.name}
                      className="w-24 h-24 object-cover rounded-full mb-4 border-4 border-blue-500/20"
                    />
                    <h2 className="text-xl font-bold mb-2 text-center">{service.name}</h2>
                    <p className="text-gray-300 text-center mb-3">{service.description}</p>
                    <a
                      href={`mailto:${service.contact}`}
                      className="text-blue-400 hover:underline mb-1"
                    >
                      {service.contact}
                    </a>
                    <a
                      href={service.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:underline text-sm"
                    >
                      {service.website.replace(/^https?:\/\//, '')}
                    </a>
                    {service.subgenres && service.subgenres.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {service.subgenres.map((sub) => (
                          <span key={sub} className="bg-blue-500/20 text-blue-300 text-xs px-2 py-1 rounded-full">{sub}</span>
                        ))}
                      </div>
                    )}
                    {service.tier && (
                      <div className="mt-1 text-xs text-purple-300 font-semibold">{service.tier}</div>
                    )}
                    {service.style_tags && service.style_tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {service.style_tags.map((tag) => (
                          <span key={tag} className="bg-purple-500/20 text-purple-300 text-xs px-2 py-1 rounded-full">{tag}</span>
                        ))}
                      </div>
                    )}
                    <div className="flex space-x-2 mt-4">
                      <button className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm" onClick={() => handleEdit(service)}>Edit</button>
                      <button className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm" onClick={() => handleDelete(service)}>Delete</button>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="mb-8">
              <button
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
                onClick={() => setShowOnboardingModal(true)}
              >
                Invite Service Provider
              </button>
            </div>
            {/* Add/Edit Modal */}
            {showForm && (
              <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
                <div className="bg-gray-900 p-6 rounded-xl border border-blue-500/20 w-full max-w-2xl max-h-screen overflow-y-auto">
                  <h2 className="text-xl font-bold mb-4">{editingService ? 'Edit Service' : 'Add Service'}</h2>
                  <form onSubmit={handleFormSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Type</label>
                      <select
                        name="type"
                        value={form.type}
                        onChange={handleFormChange}
                        className="w-full px-3 py-2 rounded bg-white/10 border border-blue-500/20 text-white"
                        required
                      >
                        {SERVICE_TYPES.map((t) => (
                          <option key={t.key} value={t.key}>{t.label}</option>
                        ))}
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
                      <label className="block text-sm font-medium mb-1">Contact</label>
                      <input
                        type="text"
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
                      <label className="block text-sm font-medium mb-1">Image URL</label>
                      <input
                        type="text"
                        name="image"
                        value={form.image}
                        onChange={handleFormChange}
                        className="w-full px-3 py-2 rounded bg-white/10 border border-blue-500/20 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Subgenres</label>
                      <div className="flex flex-wrap gap-2">
                        {SUBGENRE_OPTIONS[form.type]?.map((sub: string) => (
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
                          {TIER_OPTIONS[form.type]?.map((tier: string) => (
                            <option key={tier} value={tier}>{tier}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    {form.type === 'artists' && (
                      <div>
                        <label className="block text-sm font-medium mb-1">Style Tags</label>
                        <div className="flex flex-wrap gap-2">
                          {STYLE_TAGS.map((tag: string) => (
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
                    <div className="flex justify-end space-x-2">
                      <button type="button" className="px-4 py-2 bg-gray-700 rounded" onClick={() => setShowForm(false)}>Cancel</button>
                      <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white">{editingService ? 'Update' : 'Add'}</button>
                    </div>
                  </form>
                </div>
              </div>
            )}
            {/* Onboarding Modal */}
            {showOnboardingModal && (
              <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
                <div className="bg-gray-900 p-6 rounded-xl border border-blue-500/20 w-full max-w-md">
                  <h2 className="text-xl font-bold mb-4">Invite Service Provider</h2>
                  <label className="block text-sm font-medium mb-1">Provider Email</label>
                  <input
                    type="email"
                    value={onboardingEmail}
                    onChange={e => setOnboardingEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded bg-white/10 border border-blue-500/20 text-white mb-4"
                    required
                  />
                  <label className="block text-sm font-medium mb-1">Service Type</label>
                  <select
                    value={onboardingType}
                    onChange={e => setOnboardingType(e.target.value)}
                    className="w-full px-3 py-2 rounded bg-white/10 border border-blue-500/20 text-white mb-4"
                  >
                    {SERVICE_TYPES.map((t) => (
                      <option key={t.key} value={t.key}>{t.label}</option>
                    ))}
                  </select>
                  {onboardingError && <div className="text-red-400 mb-2">{onboardingError}</div>}
                  {onboardingLink && (
                    <div className="text-green-400 mb-2 break-all">
                      Link sent! <a href={onboardingLink} className="underline" target="_blank" rel="noopener noreferrer">{onboardingLink}</a>
                    </div>
                  )}
                  <div className="flex justify-end space-x-2 mt-4">
                    <button
                      className="px-4 py-2 bg-gray-700 rounded"
                      onClick={() => setShowOnboardingModal(false)}
                    >
                      Close
                    </button>
                    <button
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white"
                      onClick={handleSendOnboardingLink}
                      disabled={sendingOnboarding || !onboardingEmail}
                    >
                      {sendingOnboarding ? 'Sending...' : 'Send Link'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
} 