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

export default function AdminServicesPage() {
  const [activeTab, setActiveTab] = useState('services');
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [form, setForm] = useState({ type: 'studios', name: '', description: '', contact: '', website: '', image: '' });
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

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
    });
    setShowForm(true);
  };

  const handleAdd = () => {
    setEditingService(null);
    setForm({ type: 'studios', name: '', description: '', contact: '', website: '', image: '' });
    setShowForm(true);
  };

  const handleDelete = async (service: Service) => {
    await supabase.from('services').delete().eq('id', service.id);
    fetchServices();
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingService) {
      await supabase.from('services').update(form).eq('id', editingService.id);
    } else {
      await supabase.from('services').insert([form]);
    }
    setShowForm(false);
    setEditingService(null);
    fetchServices();
  };

  const filteredServices = services.filter(
    (service) =>
      (form.type === service.type || form.type === '') &&
      (service.name.toLowerCase().includes(search.toLowerCase()) ||
        service.description.toLowerCase().includes(search.toLowerCase()) ||
        service.contact.toLowerCase().includes(search.toLowerCase()))
  );

  return (
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
                  <div className="flex space-x-2 mt-4">
                    <button className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm" onClick={() => handleEdit(service)}>Edit</button>
                    <button className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm" onClick={() => handleDelete(service)}>Delete</button>
                  </div>
                </div>
              ))
            )}
          </div>
          {/* Add/Edit Modal */}
          {showForm && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
              <div className="bg-gray-900 p-6 rounded-xl border border-blue-500/20 w-full max-w-md">
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
                  <div className="flex justify-end space-x-2">
                    <button type="button" className="px-4 py-2 bg-gray-700 rounded" onClick={() => setShowForm(false)}>Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white">{editingService ? 'Update' : 'Add'}</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
} 