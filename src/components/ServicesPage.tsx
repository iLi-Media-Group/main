import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const SERVICE_TYPES = [
  { key: 'studios', label: 'Recording Studios' },
  { key: 'engineers', label: 'Recording Engineers' },
  { key: 'artists', label: 'Graphic Artists' },
];

interface Service {
  id: string;
  type: string;
  name: string;
  description: string;
  contact: string;
  website: string;
  image: string;
}

export default function ServicesPage() {
  const [activeTab, setActiveTab] = useState('studios');
  const [search, setSearch] = useState('');
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

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
        service.contact.toLowerCase().includes(search.toLowerCase()))
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
                  ? 'bg-gradient-to-tr from-blue-500 via-purple-500 to-blue-400 text-white shadow-md'
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
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
        {loading ? (
          <p className="col-span-full text-center text-gray-400">Loading...</p>
        ) : filteredServices.length === 0 ? (
          <p className="col-span-full text-center text-gray-400">No services found.</p>
        ) : (
          filteredServices.map((service) => (
            <div key={service.id} className="bg-white/5 rounded-xl shadow-xl p-6 flex flex-col items-center animated-border">
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
            </div>
          ))
        )}
      </div>
    </div>
  );
} 