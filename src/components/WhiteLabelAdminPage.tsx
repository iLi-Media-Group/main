// WhiteLabelAdminPage.tsx
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase'; // adjust if path is different

interface WhiteLabelClient {
  id: string;
  company_name: string;
  domain: string;
  owner_id: string;
}

export default function WhiteLabelAdminPage() {
  const [clients, setClients] = useState<WhiteLabelClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<WhiteLabelClient | null>(null);
  const [form, setForm] = useState({ company_name: '', domain: '', owner_id: '' });
  const [deletingClient, setDeletingClient] = useState<WhiteLabelClient | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('white_label_clients').select('*');
    if (error) setError(error.message);
    else setClients(data);
    setLoading(false);
  };

  const handleEdit = (client: WhiteLabelClient) => {
    setEditingClient(client);
    setForm({
      company_name: client.company_name,
      domain: client.domain,
      owner_id: client.owner_id,
    });
    setShowForm(true);
  };

  const handleAdd = () => {
    setEditingClient(null);
    setForm({ company_name: '', domain: '', owner_id: '' });
    setShowForm(true);
  };

  const handleDelete = async (client: WhiteLabelClient) => {
    setDeletingClient(client);
  };

  const confirmDelete = async () => {
    if (!deletingClient) return;
    await supabase.from('white_label_clients').delete().eq('id', deletingClient.id);
    setDeletingClient(null);
    fetchClients();
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingClient) {
      // Update
      await supabase.from('white_label_clients').update(form).eq('id', editingClient.id);
    } else {
      // Add
      await supabase.from('white_label_clients').insert([form]);
    }
    setShowForm(false);
    setEditingClient(null);
    fetchClients();
  };

  return (
    <div className="p-6 text-white">
      <h1 className="text-2xl font-bold mb-4">Manage White Label Clients</h1>
      <button
        className="mb-4 bg-green-600 hover:bg-green-700 px-4 py-2 rounded"
        onClick={handleAdd}
      >
        Add Client
      </button>
      {error && <div className="mb-4 p-2 bg-red-500/10 border border-red-500/20 rounded text-red-400">{error}</div>}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <table className="table-auto w-full border-collapse border border-gray-600">
          <thead>
            <tr>
              <th className="border border-gray-600 px-4 py-2">Company</th>
              <th className="border border-gray-600 px-4 py-2">Domain</th>
              <th className="border border-gray-600 px-4 py-2">Owner ID</th>
              <th className="border border-gray-600 px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client) => (
              <tr key={client.id}>
                <td className="border border-gray-600 px-4 py-2">{client.company_name}</td>
                <td className="border border-gray-600 px-4 py-2">{client.domain}</td>
                <td className="border border-gray-600 px-4 py-2">{client.owner_id}</td>
                <td className="border border-gray-600 px-4 py-2 space-x-2">
                  <button className="bg-blue-600 hover:bg-blue-700 px-4 py-1 rounded" onClick={() => handleEdit(client)}>Edit</button>
                  <button className="bg-red-600 hover:bg-red-700 px-4 py-1 rounded" onClick={() => handleDelete(client)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-6 rounded-xl border border-blue-500/20 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{editingClient ? 'Edit Client' : 'Add Client'}</h2>
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Company Name</label>
                <input
                  type="text"
                  name="company_name"
                  value={form.company_name}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 rounded bg-white/10 border border-blue-500/20 text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Domain</label>
                <input
                  type="text"
                  name="domain"
                  value={form.domain}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 rounded bg-white/10 border border-blue-500/20 text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Owner ID</label>
                <input
                  type="text"
                  name="owner_id"
                  value={form.owner_id}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 rounded bg-white/10 border border-blue-500/20 text-white"
                  required
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button type="button" className="px-4 py-2 bg-gray-700 rounded" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white">{editingClient ? 'Update' : 'Add'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingClient && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-6 rounded-xl border border-red-500/20 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 text-red-400">Delete Client</h2>
            <p className="mb-4">Are you sure you want to delete <span className="font-semibold">{deletingClient.company_name}</span>?</p>
            <div className="flex justify-end space-x-2">
              <button className="px-4 py-2 bg-gray-700 rounded" onClick={() => setDeletingClient(null)}>Cancel</button>
              <button className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-white" onClick={confirmDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 