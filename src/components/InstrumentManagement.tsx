import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Music, X, Save, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Instrument {
  id: string;
  name: string;
  display_name: string;
  created_at: string;
  updated_at: string;
}

interface SubInstrument {
  id: string;
  instrument_id: string;
  name: string;
  display_name: string;
  created_at: string;
  updated_at: string;
}

interface InstrumentWithSubInstruments extends Instrument {
  sub_instruments: SubInstrument[];
}

export function InstrumentManagement() {
  const [instruments, setInstruments] = useState<InstrumentWithSubInstruments[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddInstrumentModal, setShowAddInstrumentModal] = useState(false);
  const [showAddSubInstrumentModal, setShowAddSubInstrumentModal] = useState(false);
  const [editingInstrument, setEditingInstrument] = useState<Instrument | null>(null);
  const [editingSubInstrument, setEditingSubInstrument] = useState<SubInstrument | null>(null);
  const [selectedInstrumentForSubInstrument, setSelectedInstrumentForSubInstrument] = useState<Instrument | null>(null);
  
  const [newInstrument, setNewInstrument] = useState({
    name: '',
    display_name: ''
  });
  
  const [newSubInstrument, setNewSubInstrument] = useState({
    name: '',
    display_name: ''
  });

  useEffect(() => {
    fetchInstruments();
  }, []);

  const fetchInstruments = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch instruments with their category info
      const { data: instrumentsData, error: instrumentsError } = await supabase
        .from('instruments')
        .select('*')
        .order('display_name');

      if (instrumentsError) throw instrumentsError;
      
      // Transform the data to match the expected interface
      const instrumentsWithCategory = (instrumentsData || []).map(instrument => ({
        ...instrument,
        sub_instruments: [] // Empty array since we don't have sub_instruments table
      }));
      
      setInstruments(instrumentsWithCategory);
    } catch (err) {
      console.error('Error fetching instruments:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch instruments');
    } finally {
      setLoading(false);
    }
  };

  const createInstrument = async () => {
    try {
      if (!newInstrument.name.trim() || !newInstrument.display_name.trim()) {
        setError('Please fill in all fields');
        return;
      }

      const { error } = await supabase
        .from('instruments')
        .insert({
          name: newInstrument.name.toLowerCase().replace(/\s+/g, '_'),
          display_name: newInstrument.display_name
        });

      if (error) throw error;

      setNewInstrument({ name: '', display_name: '' });
      setShowAddInstrumentModal(false);
      fetchInstruments();
    } catch (err) {
      console.error('Error creating instrument:', err);
      setError(err instanceof Error ? err.message : 'Failed to create instrument');
    }
  };

  const updateInstrument = async (instrument: Instrument) => {
    try {
      if (!instrument.name.trim() || !instrument.display_name.trim()) {
        setError('Please fill in all fields');
        return;
      }

      const { error } = await supabase
        .from('instruments')
        .update({
          name: instrument.name.toLowerCase().replace(/\s+/g, '_'),
          display_name: instrument.display_name,
          updated_at: new Date().toISOString()
        })
        .eq('id', instrument.id);

      if (error) throw error;

      setEditingInstrument(null);
      fetchInstruments();
    } catch (err) {
      console.error('Error updating instrument:', err);
      setError(err instanceof Error ? err.message : 'Failed to update instrument');
    }
  };

  const deleteInstrument = async (instrumentId: string) => {
    if (!confirm('Are you sure you want to delete this instrument? This will also delete all associated sub-instruments.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('instruments')
        .delete()
        .eq('id', instrumentId);

      if (error) throw error;

      fetchInstruments();
    } catch (err) {
      console.error('Error deleting instrument:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete instrument');
    }
  };

  const createSubInstrument = async () => {
    try {
      if (!newSubInstrument.name.trim() || !newSubInstrument.display_name.trim() || !selectedInstrumentForSubInstrument) {
        setError('Please fill in all fields and select an instrument');
        return;
      }

      const { error } = await supabase
        .from('sub_instruments')
        .insert({
          instrument_id: selectedInstrumentForSubInstrument.id,
          name: newSubInstrument.name.toLowerCase().replace(/\s+/g, '_'),
          display_name: newSubInstrument.display_name
        });

      if (error) throw error;

      setNewSubInstrument({ name: '', display_name: '' });
      setSelectedInstrumentForSubInstrument(null);
      setShowAddSubInstrumentModal(false);
      fetchInstruments();
    } catch (err) {
      console.error('Error creating sub-instrument:', err);
      setError(err instanceof Error ? err.message : 'Failed to create sub-instrument');
    }
  };

  const updateSubInstrument = async (subInstrument: SubInstrument) => {
    try {
      if (!subInstrument.name.trim() || !subInstrument.display_name.trim()) {
        setError('Please fill in all fields');
        return;
      }

      const { error } = await supabase
        .from('sub_instruments')
        .update({
          name: subInstrument.name.toLowerCase().replace(/\s+/g, '_'),
          display_name: subInstrument.display_name,
          updated_at: new Date().toISOString()
        })
        .eq('id', subInstrument.id);

      if (error) throw error;

      setEditingSubInstrument(null);
      fetchInstruments();
    } catch (err) {
      console.error('Error updating sub-instrument:', err);
      setError(err instanceof Error ? err.message : 'Failed to update sub-instrument');
    }
  };

  const deleteSubInstrument = async (subInstrumentId: string) => {
    if (!confirm('Are you sure you want to delete this sub-instrument?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('sub_instruments')
        .delete()
        .eq('id', subInstrumentId);

      if (error) throw error;

      fetchInstruments();
    } catch (err) {
      console.error('Error deleting sub-instrument:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete sub-instrument');
    }
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
        <h2 className="text-2xl font-bold text-white">Instrument Management</h2>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowAddInstrumentModal(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Instrument Category
          </button>
          <button
            onClick={() => setShowAddSubInstrumentModal(true)}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Sub-Instrument
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
        {instruments.map((instrument) => (
          <div key={instrument.id} className="bg-white/5 backdrop-blur-sm rounded-xl border border-blue-500/20 p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center">
                <Music className="w-6 h-6 text-blue-500 mr-3" />
                <div>
                  <h3 className="text-xl font-semibold text-white">{instrument.display_name}</h3>
                  <p className="text-sm text-gray-400">ID: {instrument.name}</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setEditingInstrument(instrument)}
                  className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded transition-colors"
                  title="Edit instrument"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deleteInstrument(instrument.id)}
                  className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors"
                  title="Delete instrument"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-lg font-medium text-gray-300">Sub-Instruments ({instrument.sub_instruments.length})</h4>
              {instrument.sub_instruments.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {instrument.sub_instruments.map((subInstrument) => (
                    <div key={subInstrument.id} className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                      <div>
                        <p className="text-white font-medium">{subInstrument.display_name}</p>
                        <p className="text-sm text-gray-400">{subInstrument.name}</p>
                      </div>
                      <div className="flex space-x-1">
                        <button
                          onClick={() => setEditingSubInstrument(subInstrument)}
                          className="p-1 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded transition-colors"
                          title="Edit sub-instrument"
                        >
                          <Edit className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => deleteSubInstrument(subInstrument.id)}
                          className="p-1 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors"
                          title="Delete sub-instrument"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-sm">No sub-instruments added yet</p>
              )}
            </div>
          </div>
        ))}

        {instruments.length === 0 && (
          <div className="text-center py-12">
            <Music className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">No instruments found</p>
            <p className="text-gray-500 text-sm">Click "Add Instrument Category" to create your first instrument</p>
          </div>
        )}
      </div>

      {/* Add Instrument Modal */}
      {showAddInstrumentModal && (
        <div className="fixed inset-0 bg-blue-900/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl border border-blue-500/20 p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Add New Instrument Category</h3>
              <button
                onClick={() => setShowAddInstrumentModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={e => { e.preventDefault(); createInstrument(); }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Display Name *
                </label>
                <input
                  type="text"
                  value={newInstrument.display_name}
                  onChange={(e) => setNewInstrument({ ...newInstrument, display_name: e.target.value })}
                  className="w-full px-3 py-2 bg-white/5 border border-blue-500/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  placeholder="e.g., Strings"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Internal Name *
                </label>
                <input
                  type="text"
                  value={newInstrument.name}
                  onChange={(e) => setNewInstrument({ ...newInstrument, name: e.target.value })}
                  className="w-full px-3 py-2 bg-white/5 border border-blue-500/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  placeholder="e.g., strings"
                />
                <p className="text-xs text-gray-500 mt-1">This will be converted to lowercase with underscores</p>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddInstrumentModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Create Instrument
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Sub-Instrument Modal */}
      {showAddSubInstrumentModal && (
        <div className="fixed inset-0 bg-blue-900/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl border border-blue-500/20 p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Add New Sub-Instrument</h3>
              <button
                onClick={() => setShowAddSubInstrumentModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={e => { e.preventDefault(); createSubInstrument(); }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Parent Instrument *
                </label>
                <select
                  value={selectedInstrumentForSubInstrument?.id || ''}
                  onChange={(e) => {
                    const instrument = instruments.find(i => i.id === e.target.value);
                    setSelectedInstrumentForSubInstrument(instrument || null);
                  }}
                  className="w-full px-3 py-2 bg-white/5 border border-blue-500/20 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">Select an instrument</option>
                  {instruments.map(instrument => (
                    <option key={instrument.id} value={instrument.id}>{instrument.display_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Display Name *
                </label>
                <input
                  type="text"
                  value={newSubInstrument.display_name}
                  onChange={(e) => setNewSubInstrument({ ...newSubInstrument, display_name: e.target.value })}
                  className="w-full px-3 py-2 bg-white/5 border border-blue-500/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  placeholder="e.g., Violin"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Internal Name *
                </label>
                <input
                  type="text"
                  value={newSubInstrument.name}
                  onChange={(e) => setNewSubInstrument({ ...newSubInstrument, name: e.target.value })}
                  className="w-full px-3 py-2 bg-white/5 border border-blue-500/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  placeholder="e.g., violin"
                />
                <p className="text-xs text-gray-500 mt-1">This will be converted to lowercase with underscores</p>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddSubInstrumentModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                >
                  Create Sub-Instrument
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Instrument Modal */}
      {editingInstrument && (
        <div className="fixed inset-0 bg-blue-900/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl border border-blue-500/20 p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Edit Instrument</h3>
              <button
                onClick={() => setEditingInstrument(null)}
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
                  value={editingInstrument.display_name}
                  onChange={(e) => setEditingInstrument({ ...editingInstrument, display_name: e.target.value })}
                  className="w-full px-3 py-2 bg-white/5 border border-blue-500/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Internal Name *
                </label>
                <input
                  type="text"
                  value={editingInstrument.name}
                  onChange={(e) => setEditingInstrument({ ...editingInstrument, name: e.target.value })}
                  className="w-full px-3 py-2 bg-white/5 border border-blue-500/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">This will be converted to lowercase with underscores</p>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => setEditingInstrument(null)}
                  className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => updateInstrument(editingInstrument)}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Update Instrument
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Sub-Instrument Modal */}
      {editingSubInstrument && (
        <div className="fixed inset-0 bg-blue-900/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl border border-blue-500/20 p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Edit Sub-Instrument</h3>
              <button
                onClick={() => setEditingSubInstrument(null)}
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
                  value={editingSubInstrument.display_name}
                  onChange={(e) => setEditingSubInstrument({ ...editingSubInstrument, display_name: e.target.value })}
                  className="w-full px-3 py-2 bg-white/5 border border-blue-500/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Internal Name *
                </label>
                <input
                  type="text"
                  value={editingSubInstrument.name}
                  onChange={(e) => setEditingSubInstrument({ ...editingSubInstrument, name: e.target.value })}
                  className="w-full px-3 py-2 bg-white/5 border border-blue-500/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">This will be converted to lowercase with underscores</p>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => setEditingSubInstrument(null)}
                  className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => updateSubInstrument(editingSubInstrument)}
                  className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                >
                  Update Sub-Instrument
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
