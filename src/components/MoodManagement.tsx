import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Music, X, Save, AlertCircle, ChevronDown, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Mood {
  id: string;
  name: string;
  display_name: string;
  display_order: number;
  created_at: string;
  updated_at: string;
}

interface SubMood {
  id: string;
  mood_id: string;
  name: string;
  display_name: string;
  display_order: number;
  created_at: string;
  updated_at: string;
}

interface MoodWithSubMoods extends Mood {
  sub_moods: SubMood[];
}

export function MoodManagement() {
  const [moods, setMoods] = useState<MoodWithSubMoods[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddMoodModal, setShowAddMoodModal] = useState(false);
  const [showAddSubMoodModal, setShowAddSubMoodModal] = useState(false);
  const [editingMood, setEditingMood] = useState<Mood | null>(null);
  const [editingSubMood, setEditingSubMood] = useState<SubMood | null>(null);
  const [selectedMoodForSubMood, setSelectedMoodForSubMood] = useState<Mood | null>(null);
  
  const [newMood, setNewMood] = useState({
    name: '',
    display_name: '',
    display_order: 0
  });
  
  const [newSubMood, setNewSubMood] = useState({
    name: '',
    display_name: '',
    display_order: 0
  });
  
  // State for tracking expanded moods
  const [expandedMoods, setExpandedMoods] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchMoods();
  }, []);

  const fetchMoods = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch moods with their sub-moods
      const { data: moodsData, error: moodsError } = await supabase
        .from('moods')
        .select(`
          *,
          sub_moods (*)
        `)
        .order('display_order', { ascending: true });

      if (moodsError) throw moodsError;
      setMoods(moodsData || []);
    } catch (err) {
      console.error('Error fetching moods:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch moods');
    } finally {
      setLoading(false);
    }
  };

  const createMood = async () => {
    try {
      if (!newMood.name.trim() || !newMood.display_name.trim()) {
        setError('Please fill in all fields');
        return;
      }

      const { error } = await supabase
        .from('moods')
        .insert({
          name: newMood.name.toLowerCase().replace(/\s+/g, '_'),
          display_name: newMood.display_name,
          display_order: newMood.display_order
        });

      if (error) throw error;

      setNewMood({ name: '', display_name: '', display_order: 0 });
      setShowAddMoodModal(false);
      fetchMoods();
    } catch (err) {
      console.error('Error creating mood:', err);
      setError(err instanceof Error ? err.message : 'Failed to create mood');
    }
  };

  const updateMood = async (mood: Mood) => {
    try {
      if (!mood.name.trim() || !mood.display_name.trim()) {
        setError('Please fill in all fields');
        return;
      }

      const { error } = await supabase
        .from('moods')
        .update({
          name: mood.name.toLowerCase().replace(/\s+/g, '_'),
          display_name: mood.display_name,
          display_order: mood.display_order,
          updated_at: new Date().toISOString()
        })
        .eq('id', mood.id);

      if (error) throw error;

      setEditingMood(null);
      fetchMoods();
    } catch (err) {
      console.error('Error updating mood:', err);
      setError(err instanceof Error ? err.message : 'Failed to update mood');
    }
  };

  const deleteMood = async (moodId: string) => {
    if (!confirm('Are you sure you want to delete this mood? This will also delete all associated sub-moods.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('moods')
        .delete()
        .eq('id', moodId);

      if (error) throw error;

      fetchMoods();
    } catch (err) {
      console.error('Error deleting mood:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete mood');
    }
  };

  const createSubMood = async () => {
    try {
      if (!newSubMood.name.trim() || !newSubMood.display_name.trim() || !selectedMoodForSubMood) {
        setError('Please fill in all fields and select a mood');
        return;
      }

      const { error } = await supabase
        .from('sub_moods')
        .insert({
          mood_id: selectedMoodForSubMood.id,
          name: newSubMood.name.toLowerCase().replace(/\s+/g, '_'),
          display_name: newSubMood.display_name,
          display_order: newSubMood.display_order
        });

      if (error) throw error;

      setNewSubMood({ name: '', display_name: '', display_order: 0 });
      setSelectedMoodForSubMood(null);
      setShowAddSubMoodModal(false);
      fetchMoods();
    } catch (err) {
      console.error('Error creating sub-mood:', err);
      setError(err instanceof Error ? err.message : 'Failed to create sub-mood');
    }
  };

  const updateSubMood = async (subMood: SubMood) => {
    try {
      if (!subMood.name.trim() || !subMood.display_name.trim()) {
        setError('Please fill in all fields');
        return;
      }

      const { error } = await supabase
        .from('sub_moods')
        .update({
          name: subMood.name.toLowerCase().replace(/\s+/g, '_'),
          display_name: subMood.display_name,
          display_order: subMood.display_order,
          updated_at: new Date().toISOString()
        })
        .eq('id', subMood.id);

      if (error) throw error;

      setEditingSubMood(null);
      fetchMoods();
    } catch (err) {
      console.error('Error updating sub-mood:', err);
      setError(err instanceof Error ? err.message : 'Failed to update sub-mood');
    }
  };

  const deleteSubMood = async (subMoodId: string) => {
    if (!confirm('Are you sure you want to delete this sub-mood?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('sub_moods')
        .delete()
        .eq('id', subMoodId);

      if (error) throw error;

      fetchMoods();
    } catch (err) {
      console.error('Error deleting sub-mood:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete sub-mood');
    }
  };

  const toggleMoodExpansion = (moodId: string) => {
    setExpandedMoods(prev => {
      const newSet = new Set(prev);
      if (newSet.has(moodId)) {
        newSet.delete(moodId);
      } else {
        newSet.add(moodId);
      }
      return newSet;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-4/5 mx-auto">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Mood Management</h2>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowAddMoodModal(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Mood
          </button>
          <button
            onClick={() => setShowAddSubMoodModal(true)}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Sub-Mood
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
            <p className="text-red-400">{error}</p>
          </div>
        </div>
      )}

      <div className="grid gap-6">
        {moods.map((mood) => (
          <div key={mood.id} className="bg-white/5 backdrop-blur-sm rounded-xl border border-blue-500/20 p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center">
                <Music className="w-6 h-6 text-blue-500 mr-3" />
                <div>
                  <h3 className="text-xl font-semibold text-white">{mood.display_name}</h3>
                  <p className="text-sm text-gray-400">ID: {mood.name}</p>
                  <p className="text-sm text-gray-400">Order: {mood.display_order}</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => toggleMoodExpansion(mood.id)}
                  className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors"
                  title="Toggle sub-moods"
                >
                  {expandedMoods.has(mood.id) ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={() => setEditingMood(mood)}
                  className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded transition-colors"
                  title="Edit mood"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deleteMood(mood.id)}
                  className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors"
                  title="Delete mood"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {expandedMoods.has(mood.id) && (
              <div className="space-y-3">
                <h4 className="text-lg font-medium text-gray-300">Sub-Moods ({mood.sub_moods.length})</h4>
                {mood.sub_moods.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {mood.sub_moods.map((subMood) => (
                      <div key={subMood.id} className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                        <div>
                          <p className="text-white font-medium">{subMood.display_name}</p>
                          <p className="text-sm text-gray-400">{subMood.name}</p>
                          <p className="text-sm text-gray-400">Order: {subMood.display_order}</p>
                        </div>
                        <div className="flex space-x-1">
                          <button
                            onClick={() => setEditingSubMood(subMood)}
                            className="p-1 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded transition-colors"
                            title="Edit sub-mood"
                          >
                            <Edit className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => deleteSubMood(subMood.id)}
                            className="p-1 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors"
                            title="Delete sub-mood"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm">No sub-moods added yet</p>
                )}
              </div>
            )}
          </div>
        ))}

        {moods.length === 0 && (
          <div className="text-center py-12">
            <Music className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">No moods found</p>
            <p className="text-gray-500 text-sm">Click "Add Mood" to create your first mood</p>
          </div>
        )}
      </div>

      {/* Add Mood Modal */}
      {showAddMoodModal && (
        <div className="fixed inset-0 bg-blue-900/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl border border-blue-500/20 p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Add New Mood</h3>
              <button
                onClick={() => setShowAddMoodModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={e => { e.preventDefault(); createMood(); }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Display Name *
                </label>
                <input
                  type="text"
                  value={newMood.display_name}
                  onChange={(e) => setNewMood({ ...newMood, display_name: e.target.value })}
                  className="w-full px-3 py-2 bg-white/5 border border-blue-500/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  placeholder="e.g., Happy & Upbeat"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Internal Name *
                </label>
                <input
                  type="text"
                  value={newMood.name}
                  onChange={(e) => setNewMood({ ...newMood, name: e.target.value })}
                  className="w-full px-3 py-2 bg-white/5 border border-blue-500/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  placeholder="e.g., happy_upbeat"
                />
                <p className="text-xs text-gray-500 mt-1">This will be converted to lowercase with underscores</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Display Order
                </label>
                <input
                  type="number"
                  value={newMood.display_order}
                  onChange={(e) => setNewMood({ ...newMood, display_order: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 bg-white/5 border border-blue-500/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  placeholder="0"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddMoodModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Create Mood
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Sub-Mood Modal */}
      {showAddSubMoodModal && (
        <div className="fixed inset-0 bg-blue-900/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl border border-blue-500/20 p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Add New Sub-Mood</h3>
              <button
                onClick={() => setShowAddSubMoodModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={e => { e.preventDefault(); createSubMood(); }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Parent Mood *
                </label>
                <select
                  value={selectedMoodForSubMood?.id || ''}
                  onChange={(e) => {
                    const mood = moods.find(m => m.id === e.target.value);
                    setSelectedMoodForSubMood(mood || null);
                  }}
                  className="w-full px-3 py-2 bg-white/5 border border-blue-500/20 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">Select a mood</option>
                  {moods.map(mood => (
                    <option key={mood.id} value={mood.id}>{mood.display_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Display Name *
                </label>
                <input
                  type="text"
                  value={newSubMood.display_name}
                  onChange={(e) => setNewSubMood({ ...newSubMood, display_name: e.target.value })}
                  className="w-full px-3 py-2 bg-white/5 border border-blue-500/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  placeholder="e.g., Joyful"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Internal Name *
                </label>
                <input
                  type="text"
                  value={newSubMood.name}
                  onChange={(e) => setNewSubMood({ ...newSubMood, name: e.target.value })}
                  className="w-full px-3 py-2 bg-white/5 border border-blue-500/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  placeholder="e.g., joyful"
                />
                <p className="text-xs text-gray-500 mt-1">This will be converted to lowercase with underscores</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Display Order
                </label>
                <input
                  type="number"
                  value={newSubMood.display_order}
                  onChange={(e) => setNewSubMood({ ...newSubMood, display_order: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 bg-white/5 border border-blue-500/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  placeholder="0"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddSubMoodModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                >
                  Create Sub-Mood
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Mood Modal */}
      {editingMood && (
        <div className="fixed inset-0 bg-blue-900/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl border border-blue-500/20 p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Edit Mood</h3>
              <button
                onClick={() => setEditingMood(null)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Display Name *
                </label>
                <input
                  type="text"
                  value={editingMood.display_name}
                  onChange={(e) => setEditingMood({ ...editingMood, display_name: e.target.value })}
                  className="w-full px-3 py-2 bg-white/5 border border-blue-500/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Internal Name *
                </label>
                <input
                  type="text"
                  value={editingMood.name}
                  onChange={(e) => setEditingMood({ ...editingMood, name: e.target.value })}
                  className="w-full px-3 py-2 bg-white/5 border border-blue-500/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">This will be converted to lowercase with underscores</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Display Order
                </label>
                <input
                  type="number"
                  value={editingMood.display_order}
                  onChange={(e) => setEditingMood({ ...editingMood, display_order: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 bg-white/5 border border-blue-500/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => setEditingMood(null)}
                  className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => updateMood(editingMood)}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Update Mood
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Sub-Mood Modal */}
      {editingSubMood && (
        <div className="fixed inset-0 bg-blue-900/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl border border-blue-500/20 p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Edit Sub-Mood</h3>
              <button
                onClick={() => setEditingSubMood(null)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Display Name *
                </label>
                <input
                  type="text"
                  value={editingSubMood.display_name}
                  onChange={(e) => setEditingSubMood({ ...editingSubMood, display_name: e.target.value })}
                  className="w-full px-3 py-2 bg-white/5 border border-blue-500/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Internal Name *
                </label>
                <input
                  type="text"
                  value={editingSubMood.name}
                  onChange={(e) => setEditingSubMood({ ...editingSubMood, name: e.target.value })}
                  className="w-full px-3 py-2 bg-white/5 border border-blue-500/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">This will be converted to lowercase with underscores</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Display Order
                </label>
                <input
                  type="number"
                  value={editingSubMood.display_order}
                  onChange={(e) => setEditingSubMood({ ...editingSubMood, display_order: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 bg-white/5 border border-blue-500/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => setEditingSubMood(null)}
                  className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => updateSubMood(editingSubMood)}
                  className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                >
                  Update Sub-Mood
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
