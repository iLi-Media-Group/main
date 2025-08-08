import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Synonym {
  id: string;
  term: string;
  synonyms: string[];
  created_at: string;
}

export function SynonymManager() {
  const [synonyms, setSynonyms] = useState<Synonym[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newTerm, setNewTerm] = useState('');
  const [newSynonyms, setNewSynonyms] = useState('');
  const [editingTerm, setEditingTerm] = useState('');
  const [editingSynonyms, setEditingSynonyms] = useState('');

  useEffect(() => {
    fetchSynonyms();
  }, []);

  const fetchSynonyms = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('search_synonyms')
        .select('*')
        .order('term');

      if (error) throw error;
      setSynonyms(data || []);
    } catch (error) {
      console.error('Error fetching synonyms:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!newTerm.trim() || !newSynonyms.trim()) return;

    try {
      const synonymsArray = newSynonyms
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      const { error } = await supabase
        .from('search_synonyms')
        .insert({
          term: newTerm.trim().toLowerCase(),
          synonyms: synonymsArray
        });

      if (error) throw error;

      setNewTerm('');
      setNewSynonyms('');
      fetchSynonyms();
    } catch (error) {
      console.error('Error adding synonym:', error);
    }
  };

  const handleEdit = async (id: string) => {
    if (!editingTerm.trim() || !editingSynonyms.trim()) return;

    try {
      const synonymsArray = editingSynonyms
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      const { error } = await supabase
        .from('search_synonyms')
        .update({
          term: editingTerm.trim().toLowerCase(),
          synonyms: synonymsArray
        })
        .eq('id', id);

      if (error) throw error;

      setEditingId(null);
      setEditingTerm('');
      setEditingSynonyms('');
      fetchSynonyms();
    } catch (error) {
      console.error('Error updating synonym:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this synonym?')) return;

    try {
      const { error } = await supabase
        .from('search_synonyms')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchSynonyms();
    } catch (error) {
      console.error('Error deleting synonym:', error);
    }
  };

  const startEditing = (synonym: Synonym) => {
    setEditingId(synonym.id);
    setEditingTerm(synonym.term);
    setEditingSynonyms(synonym.synonyms.join(', '));
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingTerm('');
    setEditingSynonyms('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-6">Search Synonyms Manager</h1>
        <p className="text-gray-300 mb-6">
          Manage search synonyms to improve search accuracy. Synonyms help users find tracks even when they use different terms.
        </p>
      </div>

      {/* Add New Synonym */}
      <div className="bg-gray-800/50 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold text-white mb-4">Add New Synonym</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Main Term
            </label>
            <input
              type="text"
              value={newTerm}
              onChange={(e) => setNewTerm(e.target.value)}
              placeholder="e.g., jazz"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Synonyms (comma-separated)
            </label>
            <input
              type="text"
              value={newSynonyms}
              onChange={(e) => setNewSynonyms(e.target.value)}
              placeholder="e.g., jazzy, smooth, groovy"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleAdd}
              disabled={!newTerm.trim() || !newSynonyms.trim()}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Synonym
            </button>
          </div>
        </div>
      </div>

      {/* Synonyms List */}
      <div className="bg-gray-800/50 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Current Synonyms</h2>
        <div className="space-y-4">
          {synonyms.map((synonym) => (
            <div key={synonym.id} className="bg-gray-700/50 rounded-lg p-4">
              {editingId === synonym.id ? (
                // Edit Mode
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Main Term
                    </label>
                    <input
                      type="text"
                      value={editingTerm}
                      onChange={(e) => setEditingTerm(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Synonyms
                    </label>
                    <input
                      type="text"
                      value={editingSynonyms}
                      onChange={(e) => setEditingSynonyms(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(synonym.id)}
                      className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </button>
                    <button
                      onClick={cancelEditing}
                      className="px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 flex items-center"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                // View Mode
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-white mb-2">
                      {synonym.term}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {synonym.synonyms.map((syn, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-blue-600/20 text-blue-300 rounded-full text-sm"
                        >
                          {syn}
                        </span>
                      ))}
                    </div>
                    <p className="text-gray-400 text-sm mt-2">
                      Created: {new Date(synonym.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => startEditing(synonym)}
                      className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(synonym.id)}
                      className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
