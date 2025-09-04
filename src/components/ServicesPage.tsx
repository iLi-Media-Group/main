import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

// Utility function to truncate long URLs for display
const truncateUrl = (url: string, maxLength: number = 30): string => {
  if (!url) return '';
  
  // Remove protocol
  let cleanUrl = url.replace(/^https?:\/\//, '');
  
  // If URL is already short enough, return it
  if (cleanUrl.length <= maxLength) {
    return cleanUrl;
  }
  
  // Truncate and add ellipsis
  return cleanUrl.substring(0, maxLength) + '...';
};

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
  subgenres?: string[];
  tier?: string;
  style_tags?: string[];
}

export default function ServicesPage() {
  const [activeTab, setActiveTab] = useState('studios');
  const [search, setSearch] = useState('');
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [subgenreFilter, setSubgenreFilter] = useState('');
  const [tierFilter, setTierFilter] = useState('');
  const [styleTagFilter, setStyleTagFilter] = useState('');

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('services').select('*').order('name');
    if (data) setServices(data);
    setLoading(false);
  };

  const filteredServices = services.filter(
    (service) =>
      service.type === activeTab &&
      (service.name.toLowerCase().includes(search.toLowerCase()) ||
        service.description.toLowerCase().includes(search.toLowerCase()) ||
        service.contact.toLowerCase().includes(search.toLowerCase())) &&
      (subgenreFilter === '' || (service.subgenres && service.subgenres.includes(subgenreFilter))) &&
      (tierFilter === '' || service.tier === tierFilter) &&
      (styleTagFilter === '' || (service.style_tags && service.style_tags.includes(styleTagFilter)))
  );

  return (
    <div className="container mx-auto px-4 py-12 text-white">
      <h1 className="text-3xl font-bold mb-8 text-center">Music Industry Services</h1>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div className="flex space-x-2">
          {SERVICE_TYPES.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all relative
                ${activeTab === tab.key
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-300 hover:text-white hover:bg-white/10'}
              `}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search services..."
          className="w-full md:w-64 px-4 py-2 rounded-full bg-white/10 border border-blue-500/20 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-400/30 text-base shadow-inner transition-all"
        />
      </div>
      <div className="flex flex-wrap gap-4 mb-6">
        {/* Subgenre Filter */}
        {SUBGENRE_OPTIONS[activeTab] && (
          <select
            value={subgenreFilter}
            onChange={e => setSubgenreFilter(e.target.value)}
            className="px-3 py-2 rounded bg-white/10 border border-blue-500/20 text-white"
          >
            <option value="">All Subgenres</option>
            {SUBGENRE_OPTIONS[activeTab].map((sub) => (
              <option key={sub} value={sub}>{sub}</option>
            ))}
          </select>
        )}
        {/* Tier Filter */}
        {TIER_OPTIONS[activeTab] && TIER_OPTIONS[activeTab].length > 0 && (
          <select
            value={tierFilter}
            onChange={e => setTierFilter(e.target.value)}
            className="px-3 py-2 rounded bg-white/10 border border-blue-500/20 text-white"
          >
            <option value="">All Tiers</option>
            {TIER_OPTIONS[activeTab].map((tier) => (
              <option key={tier} value={tier}>{tier}</option>
            ))}
          </select>
        )}
        {/* Style Tag Filter (only for artists) */}
        {activeTab === 'artists' && (
          <select
            value={styleTagFilter}
            onChange={e => setStyleTagFilter(e.target.value)}
            className="px-3 py-2 rounded bg-white/10 border border-blue-500/20 text-white"
          >
            <option value="">All Styles</option>
            {STYLE_TAGS.map((tag) => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
        {loading ? (
          <p className="col-span-full text-center text-gray-400">Loading...</p>
        ) : filteredServices.length === 0 ? (
          <p className="col-span-full text-center text-gray-400">No services found.</p>
        ) : (
          filteredServices.map((service) => (
            <div key={service.id} className="bg-white/5 rounded-xl shadow-xl p-6 flex flex-col items-center">
              <img
                src={service.image?.startsWith("https://") 
                  ? service.image 
                  : `https://yciqkebqlajqbpwlujma.supabase.co/storage/v1/object/public/services-images/${service.image}`}
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
                title={service.website} // Show full URL on hover
              >
                {truncateUrl(service.website)}
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
                    <img 
                      src={service.image2?.startsWith("https://") 
                        ? service.image2 
                        : `https://yciqkebqlajqbpwlujma.supabase.co/storage/v1/object/public/services-images/${service.image2}`}
                      alt="Additional 1" 
                      className="h-20 rounded border border-blue-500/20" 
                    />
                  )}
                  {service.image3 && (
                    <img 
                      src={service.image3?.startsWith("https://") 
                        ? service.image3 
                        : `https://yciqkebqlajqbpwlujma.supabase.co/storage/v1/object/public/services-images/${service.image3}`}
                      alt="Additional 2" 
                      className="h-20 rounded border border-blue-500/20" 
                    />
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
} 