import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Music, X, Save, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Instrument {
  id: string;
  name: string;
  display_name: string;
  category: string;
  created_at: string;
  updated_at: string;
}

interface InstrumentCategory {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

interface InstrumentWithCategory extends Instrument {
  category_name: string;
}

export function InstrumentManagement() {
  const [instruments, setInstruments] = useState<InstrumentWithCategory[]>([]);
  const [categories, setCategories] = useState<InstrumentCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddInstrumentModal, setShowAddInstrumentModal] = useState(false);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [editingInstrument, setEditingInstrument] = useState<Instrument | null>(null);
  const [editingCategory, setEditingCategory] = useState<InstrumentCategory | null>(null);
  
  const [newInstrument, setNewInstrument] = useState({
    name: '',
    category: ''
  });
  
  const [newCategory, setNewCategory] = useState({
    name: ''
  });

  useEffect(() => {
    fetchInstruments();
    fetchCategories();
  }, []);

  const fetchInstruments = async () => {
    try {
      setLoading(true);
      setError(null);

      // First try to fetch instruments with category info
      let instrumentsData = [];
      let instrumentsError = null;
      
      try {
        // Fetch instruments with their category info (using the current schema)
        const { data, error } = await supabase
          .from('instruments')
          .select('*')
          .order('category, display_name');
        
        instrumentsData = data || [];
        instrumentsError = error;
      } catch (err) {
        console.log('Failed to fetch instruments:', err);
        instrumentsData = [];
        instrumentsError = err;
      }

      if (instrumentsError) throw instrumentsError;
      
      // Transform the data to include category name (category is already a text field)
      const instrumentsWithCategory = (instrumentsData || []).map(instrument => ({
        ...instrument,
        category_name: instrument.category || 'Unknown'
      }));
      
      setInstruments(instrumentsWithCategory);
    } catch (err) {
      console.error('Error fetching instruments:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch instruments');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    // Use predefined categories since instrument_categories table doesn't exist in current schema
    const predefinedCategories = [
      { id: 'strings', name: 'Strings' },
      { id: 'keys', name: 'Keys' },
      { id: 'drums-percussion', name: 'Drums & Percussion' },
      { id: 'woodwinds-brass', name: 'Woodwinds & Brass' },
      { id: 'orchestral-strings', name: 'Orchestral Strings' },
      { id: 'vocals', name: 'Vocals' },
      { id: 'bass', name: 'Bass' },
      { id: 'atmosphere-texture', name: 'Atmosphere & Texture' },
      { id: 'sound-effects', name: 'Sound Effects' },
      { id: 'samples-loops', name: 'Samples & Loops' },
      { id: 'other', name: 'Other' }
    ];
    setCategories(predefinedCategories);
  };

  const createInstrument = async () => {
    try {
      if (!newInstrument.name.trim()) {
        setError('Please fill in the instrument name');
        return;
      }

      const { error } = await supabase
        .from('instruments')
        .insert({
          name: newInstrument.name.toLowerCase().replace(/\s+/g, '_'),
          display_name: newInstrument.name,
          category: newInstrument.category
        });

      if (error) throw error;

      setNewInstrument({ name: '', category: '' });
      setShowAddInstrumentModal(false);
      fetchInstruments();
    } catch (err) {
      console.error('Error creating instrument:', err);
      setError(err instanceof Error ? err.message : 'Failed to create instrument');
    }
  };

  const createCategory = async () => {
    setError('Category management is not available with the current database schema. Categories are predefined.');
  };

  const updateInstrument = async (instrument: Instrument) => {
    try {
      if (!instrument.name.trim() || !instrument.category.trim()) {
        setError('Please fill in all fields');
        return;
      }

      const { error } = await supabase
        .from('instruments')
        .update({
          name: instrument.name.toLowerCase().replace(/\s+/g, '_'),
          display_name: instrument.name,
          category: instrument.category,
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

  const updateCategory = async (category: InstrumentCategory) => {
    setError('Category management is not available with the current database schema. Categories are predefined.');
  };

  const deleteInstrument = async (instrumentId: string) => {
    if (!confirm('Are you sure you want to delete this instrument?')) {
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

  const deleteCategory = async (categoryId: string) => {
    setError('Category management is not available with the current database schema. Categories are predefined.');
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
            onClick={() => setShowAddCategoryModal(true)}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Category
          </button>
          <button
            onClick={() => setShowAddInstrumentModal(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Instrument
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

      {/* Categories Section */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-blue-500/20 p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Categories</h3>
        <div className="grid gap-4">
          {categories.map((category) => (
            <div key={category.id} className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
              <div>
                <p className="text-white font-medium">{category.name}</p>
                <p className="text-sm text-gray-400">ID: {category.id}</p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setEditingCategory(category)}
                  className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded transition-colors"
                  title="Edit category"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deleteCategory(category.id)}
                  className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors"
                  title="Delete category"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Instruments Section */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-blue-500/20 p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Instruments</h3>
        <div className="grid gap-4">
          {instruments.map((instrument) => (
            <div key={instrument.id} className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
              <div>
                <p className="text-white font-medium">{instrument.name}</p>
                <p className="text-sm text-gray-400">Category: {instrument.category_name}</p>
                <p className="text-sm text-gray-400">ID: {instrument.id}</p>
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
          ))}
        </div>
      </div>

      {/* Add Category Modal */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 bg-blue-900/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl border border-blue-500/20 p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Add New Category</h3>
              <button
                onClick={() => setShowAddCategoryModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={e => { e.preventDefault(); createCategory(); }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Category Name *
                </label>
                <input
                  type="text"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({ name: e.target.value })}
                  className="w-full px-3 py-2 bg-white/5 border border-blue-500/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  placeholder="e.g., Guitar"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddCategoryModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                >
                  Create Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Instrument Modal */}
      {showAddInstrumentModal && (
        <div className="fixed inset-0 bg-blue-900/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl border border-blue-500/20 p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Add New Instrument</h3>
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
                  Instrument Name *
                </label>
                <input
                  type="text"
                  value={newInstrument.name}
                  onChange={(e) => setNewInstrument({ ...newInstrument, name: e.target.value })}
                  className="w-full px-3 py-2 bg-white/5 border border-blue-500/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  placeholder="e.g., acoustic_guitar"
                />
                <p className="text-xs text-gray-500 mt-1">This will be converted to lowercase with underscores</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Category *
                </label>
                <select
                  value={newInstrument.category}
                  onChange={(e) => setNewInstrument({ ...newInstrument, category: e.target.value })}
                  className="w-full px-3 py-2 bg-white/5 border border-blue-500/20 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">Select a category</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.name}>{category.name}</option>
                  ))}
                </select>
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

      {/* Edit Category Modal */}
      {editingCategory && (
        <div className="fixed inset-0 bg-blue-900/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl border border-blue-500/20 p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Edit Category</h3>
              <button
                onClick={() => setEditingCategory(null)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Category Name *
                </label>
                <input
                  type="text"
                  value={editingCategory.name}
                  onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                  className="w-full px-3 py-2 bg-white/5 border border-blue-500/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => setEditingCategory(null)}
                  className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => updateCategory(editingCategory)}
                  className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                >
                  Update Category
                </button>
              </div>
            </div>
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
                  Instrument Name *
                </label>
                <input
                  type="text"
                  value={editingInstrument.name}
                  onChange={(e) => setEditingInstrument({ ...editingInstrument, name: e.target.value })}
                  className="w-full px-3 py-2 bg-white/5 border border-blue-500/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">This will be converted to lowercase with underscores</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Category *
                </label>
                <select
                  value={editingInstrument.category}
                  onChange={(e) => setEditingInstrument({ ...editingInstrument, category: e.target.value })}
                  className="w-full px-3 py-2 bg-white/5 border border-blue-500/20 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">Select a category</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.name}>{category.name}</option>
                  ))}
                </select>
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
    </div>
  );
}
