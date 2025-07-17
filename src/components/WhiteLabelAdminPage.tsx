// WhiteLabelAdminPage.tsx
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { AdminPasswordPrompt } from './AdminPasswordPrompt';
import { FeatureManagement } from './FeatureManagement';
import { Layout } from './Layout';
import { ReportBackgroundProvider, useReportBackground } from '../contexts/ReportBackgroundContext';
import { ReportBackgroundPicker } from './ReportBackgroundPicker';

interface WhiteLabelClient {
  id: string;
  company_name: string;
  domain: string;
  owner_id: string;
  email?: string;
  ai_recommendation_enabled?: boolean;
}

export default function WhiteLabelAdminPage() {
  const [clients, setClients] = useState<WhiteLabelClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<WhiteLabelClient | null>(null);
  const [form, setForm] = useState({ email: '', company_name: '', first_name: '', last_name: '', domain: '' });
  const [deletingClient, setDeletingClient] = useState<WhiteLabelClient | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [apiToken, setApiToken] = useState<string | null>(null);
  const [savingFeature, setSavingFeature] = useState<string | null>(null); // clientId currently saving feature

  useEffect(() => {
    if (!apiToken) return;
    fetchClients();
  }, [apiToken]);

  const fetchClients = async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.from('white_label_clients').select('*');
    if (error) setError(error.message);
    else setClients(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  const handleEdit = (client: WhiteLabelClient) => {
    setEditingClient(client);
    setForm({
      email: client.email || '',
      company_name: client.company_name,
      first_name: '',
      last_name: '',
      domain: client.domain || '',
    });
    setShowForm(true);
  };

  const handleAdd = () => {
    setEditingClient(null);
    setForm({ email: '', company_name: '', first_name: '', last_name: '', domain: '' });
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
    try {
      if (editingClient) {
        // Update existing profile
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            email: form.email,
            first_name: form.first_name,
            last_name: form.last_name
          })
          .eq('id', editingClient.id);
        
        if (profileError) throw profileError;
      } else {
        // Create new profile and white label client
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .insert([{
            email: form.email,
            first_name: form.first_name,
            last_name: form.last_name,
            account_type: 'white_label'
          }])
          .select()
          .single();
        
        if (profileError) throw profileError;
        
        // Create white label client record
        const { error: clientError } = await supabase
          .from('white_label_clients')
          .insert({
            owner_id: profileData.id,
            owner_email: form.email,
            display_name: form.company_name,
            domain: form.domain || null
          });
        
        if (clientError) throw clientError;
      }
      
      setShowForm(false);
      setEditingClient(null);
      fetchClients();
    } catch (error) {
      console.error('Error creating/updating white label client:', error);
      setError('Failed to create/update white label client');
    }
  };

  // Feature toggle (e.g., AI Recommendation)
  const toggleAIRecommendation = async (clientId: string, enabled: boolean) => {
    if (!apiToken) return;
    setSavingFeature(clientId);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_FUNCTION_URL}/update_white_label_feature`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiToken}`,
          },
          body: JSON.stringify({
            clientId,
            field: 'ai_recommendation_enabled',
            value: enabled,
          }),
        }
      );
      const data = await res.json();
      if (res.ok) {
        setClients((prev) =>
          prev.map((client) =>
            client.id === clientId
              ? { ...client, ai_recommendation_enabled: enabled }
              : client
          )
        );
      } else {
        setError(data.error || 'Unknown error');
      }
    } catch (error) {
      setError('Fetch error: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setSavingFeature(null);
    }
  };

  if (!apiToken) {
    return <AdminPasswordPrompt onPasswordSet={setApiToken} />;
  }

  // Assume only one client is managed at a time, use first client id or selected client id
  const clientId = clients[0]?.id || '';
  return (
    <ReportBackgroundProvider clientId={clientId}>
      <WhiteLabelAdminContent
        clients={clients}
        loading={loading}
        error={error}
        handleAdd={handleAdd}
        handleEdit={handleEdit}
        handleDelete={handleDelete}
        showForm={showForm}
        setShowForm={setShowForm}
        editingClient={editingClient}
        handleFormSubmit={handleFormSubmit}
        form={form}
        handleFormChange={handleFormChange}
        deletingClient={deletingClient}
        setDeletingClient={setDeletingClient}
        confirmDelete={confirmDelete}
        apiToken={apiToken}
        setApiToken={setApiToken}
        savingFeature={savingFeature}
        toggleAIRecommendation={toggleAIRecommendation}
      />
    </ReportBackgroundProvider>
  );
}

function WhiteLabelAdminContent(props: any) {
  const { clients, loading, error, handleAdd, handleEdit, handleDelete, showForm, setShowForm, editingClient, handleFormSubmit, form, handleFormChange, deletingClient, setDeletingClient, confirmDelete, apiToken, setApiToken, savingFeature, toggleAIRecommendation } = props;
  const { selectedBackground, setSelectedBackground } = useReportBackground();
  return (
    <Layout>
      <div className="p-6 text-white max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Manage White Label Clients & Features</h1>
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
              {clients.map((client: any) => (
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
            <div className="bg-blue-700 p-6 rounded-xl border border-blue-500/20 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">{editingClient ? 'Edit Client' : 'Add Client'}</h2>
              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 rounded bg-white/10 border border-blue-500/20 text-white"
                    required
                  />
                </div>
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
                  <label className="block text-sm font-medium mb-1">Domain (Optional)</label>
                  <input
                    type="text"
                    name="domain"
                    value={form.domain}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 rounded bg-white/10 border border-blue-500/20 text-white"
                    placeholder="example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">First Name</label>
                  <input
                    type="text"
                    name="first_name"
                    value={form.first_name}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 rounded bg-white/10 border border-blue-500/20 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Last Name</label>
                  <input
                    type="text"
                    name="last_name"
                    value={form.last_name}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 rounded bg-white/10 border border-blue-500/20 text-white"
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
            <div className="bg-blue-700 p-6 rounded-xl border border-red-500/20 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4 text-red-400">Delete Client</h2>
              <p className="mb-4">Are you sure you want to delete <span className="font-semibold">{deletingClient.company_name}</span>?</p>
              <div className="flex justify-end space-x-2">
                <button className="px-4 py-2 bg-gray-700 rounded" onClick={() => setDeletingClient(null)}>Cancel</button>
                <button className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-white" onClick={confirmDelete}>Delete</button>
              </div>
            </div>
          </div>
        )}

        <h2 className="text-xl font-bold mt-10 mb-4">Feature Management</h2>
        <FeatureManagement />

        <button
          onClick={() => {
            localStorage.removeItem('adminApiToken');
            setApiToken(null);
          }}
          className="mt-6 text-sm text-blue-400 underline"
        >
          Clear Admin Password
        </button>

        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white mb-2">PDF Report Background</h3>
          <ReportBackgroundPicker selected={selectedBackground} onChange={setSelectedBackground} />
        </div>
      </div>
    </Layout>
  );
} 