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
  image2?: string;
  image3?: string;
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
  image2?: string;
  image3?: string;
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
  const [form, setForm] = useState<ServiceForm>({ type: 'studios', name: '', description: '', contact: '', website: '', image: '', image2: '', image3: '', subgenres: [], tier: '', style_tags: [] });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile2, setImageFile2] = useState<File | null>(null);
  const [imagePreview2, setImagePreview2] = useState<string | null>(null);
  const [imageFile3, setImageFile3] = useState<File | null>(null);
  const [imagePreview3, setImagePreview3] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [onboardingEmail, setOnboardingEmail] = useState('');
  const [onboardingType, setOnboardingType] = useState('studios');
  const [onboardingLink, setOnboardingLink] = useState('');
  const [sendingOnboarding, setSendingOnboarding] = useState(false);
  const [onboardingError, setOnboardingError] = useState('');
  const [uploadingImages, setUploadingImages] = useState(false);
  const [existingImages, setExistingImages] = useState({
    image: '',
    image2: '',
    image3: ''
  });

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
      image2: service.image2 || '',
      image3: service.image3 || '',
      subgenres: service.subgenres,
      tier: service.tier,
      style_tags: service.style_tags
    });
    // Store existing images for reference
    setExistingImages({
      image: service.image || '',
      image2: service.image2 || '',
      image3: service.image3 || ''
    });
    setImagePreview(service.image || null);
    setImagePreview2(service.image2 || null);
    setImagePreview3(service.image3 || null);
    setImageFile(null);
    setImageFile2(null);
    setImageFile3(null);
    setShowForm(true);
  };

  const handleAdd = () => {
    setEditingService(null);
    setForm({ type: 'studios', name: '', description: '', contact: '', website: '', image: '', image2: '', image3: '', subgenres: [], tier: '', style_tags: [] });
    setExistingImages({ image: '', image2: '', image3: '' });
    setImagePreview(null);
    setImagePreview2(null);
    setImagePreview3(null);
    setImageFile(null);
    setImageFile2(null);
    setImageFile3(null);
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, imageNum = 1) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }
    
    // Validate file size (2MB limit)
    if (file.size > 2 * 1024 * 1024) {
      setError('Image file size must be less than 2MB');
      return;
    }

    setError(null); // Clear any previous errors

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
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadingImages(true);
    setError(null);

    try {
      let imageUrl = form.image;
      let imageUrl2 = form.image2;
      let imageUrl3 = form.image3;

      // Upload new images if files are selected
      if (imageFile) {
        try {
          imageUrl = await (await import('../lib/storage')).uploadFile(imageFile, 'service-images');
        } catch (uploadError) {
          throw new Error(`Failed to upload main image: ${uploadError}`);
        }
      }

      if (imageFile2) {
        try {
          imageUrl2 = await (await import('../lib/storage')).uploadFile(imageFile2, 'service-images');
        } catch (uploadError) {
          throw new Error(`Failed to upload additional image 1: ${uploadError}`);
        }
      }

      if (imageFile3) {
        try {
          imageUrl3 = await (await import('../lib/storage')).uploadFile(imageFile3, 'service-images');
        } catch (uploadError) {
          throw new Error(`Failed to upload additional image 2: ${uploadError}`);
        }
      }

      const payload = { 
        ...form, 
        image: imageUrl, 
        image2: imageUrl2, 
        image3: imageUrl3 
      };

      if (editingService) {
        const { error: updateError } = await supabase
          .from('services')
          .update(payload)
          .eq('id', editingService.id);
        
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('services')
          .insert([payload]);
        
        if (insertError) throw insertError;
      }

      setShowForm(false);
      setEditingService(null);
      fetchServices();
    } catch (err: any) {
      setError(err.message || 'Failed to save service');
    } finally {
      setUploadingImages(false);
    }
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
      const link = `${window.location.origin}/service-onboarding-public?email=${encodeURIComponent(onboardingEmail)}&type=${encodeURIComponent(onboardingType)}`;
      setOnboardingLink(link);
  
      // Call your Supabase Edge Function to send the email
      const functionUrl = `${import.meta.env.VITE_SUPABASE_FUNCTION_URL}/send-service-onboarding-email`;
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          to: onboardingEmail, 
          link,
          email: onboardingEmail,
          type: onboardingType
        })
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
                  <div key={service.id} className="bg-white/5 rounded-xl shadow-xl p-6 flex flex-col items-center relative">
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
                    {/* Display additional images at the bottom */}
                    {(service.image2 || service.image3) && (
                      <div className="flex gap-2 mt-4">
                        {service.image2 && (
                          <img src={service.image2} alt="Additional 1" className="h-20 rounded border border-blue-500/20" />
                        )}
                        {service.image3 && (
                          <img src={service.image3} alt="Additional 2" className="h-20 rounded border border-blue-500/20" />
                        )}
                      </div>
                    )}
                    <div className="flex space-x-2 mt-4">
                      <button type="button" className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm" onClick={() => handleEdit(service)}>Edit</button>
                      <button type="button" className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm" onClick={() => handleDelete(service)}>Delete</button>
                    </div>
                  </div>
                ))
              )}
            </div>
            {/* Add/Edit Modal */}
            {showForm && (
              <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                <div className="bg-blue-900/90 p-4 sm:p-6 rounded-xl border border-blue-500/20 w-full max-w-2xl max-h-[90vh] sm:max-h-[85vh] overflow-y-auto">
                  <h2 className="text-lg sm:text-xl font-bold mb-3">{editingService ? 'Edit Service' : 'Add Service'}</h2>
                  <form onSubmit={handleFormSubmit} className="space-y-3">
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
                      <label className="block text-sm font-medium mb-1">Main Image</label>
                      {editingService && existingImages.image && (
                        <div className="mb-1 p-2 bg-blue-500/10 rounded border border-blue-500/20">
                          <p className="text-xs text-blue-300 mb-1">Current Image:</p>
                          <img src={existingImages.image} alt="Current" className="h-14 rounded border border-blue-500/20" />
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={e => handleImageChange(e, 1)}
                        className="w-full px-3 py-2 rounded bg-white/10 border border-blue-500/20 text-white"
                        placeholder="Select an image file (max 2MB)"
                      />
                      {imagePreview && (
                        <div className="mt-1 p-2 bg-green-500/10 rounded border border-green-500/20">
                          <p className="text-xs text-green-300 mb-1">New Image Preview:</p>
                          <img src={imagePreview} alt="Preview" className="h-20 rounded border border-green-500/20" />
                        </div>
                      )}
                      {editingService && !imageFile && existingImages.image && (
                        <p className="text-xs text-gray-400 mt-1">No new image selected - current image will be kept</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Additional Image 1 (optional)</label>
                      {editingService && existingImages.image2 && (
                        <div className="mb-1 p-2 bg-blue-500/10 rounded border border-blue-500/20">
                          <p className="text-xs text-blue-300 mb-1">Current Image:</p>
                          <img src={existingImages.image2} alt="Current" className="h-14 rounded border border-blue-500/20" />
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={e => handleImageChange(e, 2)}
                        className="w-full px-3 py-2 rounded bg-white/10 border border-blue-500/20 text-white"
                        placeholder="Select an image file (max 2MB)"
                      />
                      {imagePreview2 && (
                        <div className="mt-1 p-2 bg-green-500/10 rounded border border-green-500/20">
                          <p className="text-xs text-green-300 mb-1">New Image Preview:</p>
                          <img src={imagePreview2} alt="Preview 2" className="h-20 rounded border border-green-500/20" />
                        </div>
                      )}
                      {editingService && !imageFile2 && existingImages.image2 && (
                        <p className="text-xs text-gray-400 mt-1">No new image selected - current image will be kept</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Additional Image 2 (optional)</label>
                      {editingService && existingImages.image3 && (
                        <div className="mb-1 p-2 bg-blue-500/10 rounded border border-blue-500/20">
                          <p className="text-xs text-blue-300 mb-1">Current Image:</p>
                          <img src={existingImages.image3} alt="Current" className="h-14 rounded border border-blue-500/20" />
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={e => handleImageChange(e, 3)}
                        className="w-full px-3 py-2 rounded bg-white/10 border border-blue-500/20 text-white"
                        placeholder="Select an image file (max 2MB)"
                      />
                      {imagePreview3 && (
                        <div className="mt-1 p-2 bg-green-500/10 rounded border border-green-500/20">
                          <p className="text-xs text-green-300 mb-1">New Image Preview:</p>
                          <img src={imagePreview3} alt="Preview 3" className="h-20 rounded border border-green-500/20" />
                        </div>
                      )}
                      {editingService && !imageFile3 && existingImages.image3 && (
                        <p className="text-xs text-gray-400 mt-1">No new image selected - current image will be kept</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Subgenres</label>
                      <div className="flex flex-wrap gap-1">
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
                        <div className="flex flex-wrap gap-1">
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
                    {error && (
                      <div className="p-3 bg-red-500/10 border border-red-500/20 rounded text-red-300 text-sm">
                        {error}
                      </div>
                    )}
                    <div className="flex justify-end space-x-2">
                      <button 
                        type="button" 
                        className="px-4 py-2 bg-gray-700 rounded" 
                        onClick={() => setShowForm(false)}
                        disabled={uploadingImages}
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        className={`px-4 py-2 rounded text-white flex items-center ${
                          uploadingImages 
                            ? 'bg-blue-500 cursor-not-allowed' 
                            : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                        disabled={uploadingImages}
                      >
                        {uploadingImages ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                            {editingService ? 'Updating...' : 'Adding...'}
                          </>
                        ) : (
                          editingService ? 'Update' : 'Add'
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
} 