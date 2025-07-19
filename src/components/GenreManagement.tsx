import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Music, X, Save, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Genre {
  id: string;
  name: string;
  display_name: string;
  created_at: string;
  updated_at: string;
}

interface SubGenre {
  id: string;
  genre_id: string;
  name: string;
  display_name: string;
  created_at: string;
  updated_at: string;
}

interface GenreWithSubGenres extends Genre {
  sub_genres: SubGenre[];
}

export function GenreManagement() {
  const [genres, setGenres] = useState<GenreWithSubGenres[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddGenreModal, setShowAddGenreModal] = useState(false);
  const [showAddSubGenreModal, setShowAddSubGenreModal] = useState(false);
  const [editingGenre, setEditingGenre] = useState<Genre | null>(null);
  const [editingSubGenre, setEditingSubGenre] = useState<SubGenre | null>(null);
  const [selectedGenreForSubGenre, setSelectedGenreForSubGenre] = useState<Genre | null>(null);
  
  const [newGenre, setNewGenre] = useState({
    name: '',
    display_name: ''
  });
  
  const [newSubGenre, setNewSubGenre] = useState({
    name: '',
    display_name: ''
  });

  useEffect(() => {
    fetchGenres();
  }, []);

  const fetchGenres = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch genres with their sub-genres
      const { data: genresData, error: genresError } = await supabase
        .from('genres')
        .select(`
          *,
          sub_genres (*)
        `)
        .order('display_name');

      if (genresError) throw genresError;
      setGenres(genresData || []);
    } catch (err) {
      console.error('Error fetching genres:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch genres');
    } finally {
      setLoading(false);
    }
  };

  const createGenre = async () => {
    try {
      if (!newGenre.name.trim() || !newGenre.display_name.trim()) {
        setError('Please fill in all fields');
        return;
      }

      const { error } = await supabase
        .from('genres')
        .insert({
          name: newGenre.name.toLowerCase().replace(/\s+/g, '_'),
          display_name: newGenre.display_name
        });

      if (error) throw error;

      setNewGenre({ name: '', display_name: '' });
      setShowAddGenreModal(false);
      fetchGenres();
    } catch (err) {
      console.error('Error creating genre:', err);
      setError(err instanceof Error ? err.message : 'Failed to create genre');
    }
  };

  const updateGenre = async (genre: Genre) => {
    try {
      if (!genre.name.trim() || !genre.display_name.trim()) {
        setError('Please fill in all fields');
        return;
      }

      const { error } = await supabase
        .from('genres')
        .update({
          name: genre.name.toLowerCase().replace(/\s+/g, '_'),
          display_name: genre.display_name,
          updated_at: new Date().toISOString()
        })
        .eq('id', genre.id);

      if (error) throw error;

      setEditingGenre(null);
      fetchGenres();
    } catch (err) {
      console.error('Error updating genre:', err);
      setError(err instanceof Error ? err.message : 'Failed to update genre');
    }
  };

  const deleteGenre = async (genreId: string) => {
    if (!confirm('Are you sure you want to delete this genre? This will also delete all associated sub-genres.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('genres')
        .delete()
        .eq('id', genreId);

      if (error) throw error;

      fetchGenres();
    } catch (err) {
      console.error('Error deleting genre:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete genre');
    }
  };

  const createSubGenre = async () => {
    try {
      if (!newSubGenre.name.trim() || !newSubGenre.display_name.trim() || !selectedGenreForSubGenre) {
        setError('Please fill in all fields and select a genre');
        return;
      }

      const { error } = await supabase
        .from('sub_genres')
        .insert({
          genre_id: selectedGenreForSubGenre.id,
          name: newSubGenre.name.toLowerCase().replace(/\s+/g, '_'),
          display_name: newSubGenre.display_name
        });

      if (error) throw error;

      setNewSubGenre({ name: '', display_name: '' });
      setSelectedGenreForSubGenre(null);
      setShowAddSubGenreModal(false);
      fetchGenres();
    } catch (err) {
      console.error('Error creating sub-genre:', err);
      setError(err instanceof Error ? err.message : 'Failed to create sub-genre');
    }
  };

  const updateSubGenre = async (subGenre: SubGenre) => {
    try {
      if (!subGenre.name.trim() || !subGenre.display_name.trim()) {
        setError('Please fill in all fields');
        return;
      }

      const { error } = await supabase
        .from('sub_genres')
        .update({
          name: subGenre.name.toLowerCase().replace(/\s+/g, '_'),
          display_name: subGenre.display_name,
          updated_at: new Date().toISOString()
        })
        .eq('id', subGenre.id);

      if (error) throw error;

      setEditingSubGenre(null);
      fetchGenres();
    } catch (err) {
      console.error('Error updating sub-genre:', err);
      setError(err instanceof Error ? err.message : 'Failed to update sub-genre');
    }
  };

  const deleteSubGenre = async (subGenreId: string) => {
    if (!confirm('Are you sure you want to delete this sub-genre?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('sub_genres')
        .delete()
        .eq('id', subGenreId);

      if (error) throw error;

      fetchGenres();
    } catch (err) {
      console.error('Error deleting sub-genre:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete sub-genre');
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
        <h2 className="text-2xl font-bold text-white">Genre Management</h2>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowAddGenreModal(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Genre
          </button>
          <button
            onClick={() => setShowAddSubGenreModal(true)}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Sub-Genre
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
        {genres.map((genre) => (
          <div key={genre.id} className="bg-white/5 backdrop-blur-sm rounded-xl border border-blue-500/20 p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center">
                <Music className="w-6 h-6 text-blue-500 mr-3" />
                <div>
                  <h3 className="text-xl font-semibold text-white">{genre.display_name}</h3>
                  <p className="text-sm text-gray-400">ID: {genre.name}</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setEditingGenre(genre)}
                  className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded transition-colors"
                  title="Edit genre"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deleteGenre(genre.id)}
                  className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors"
                  title="Delete genre"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-lg font-medium text-gray-300">Sub-Genres ({genre.sub_genres.length})</h4>
              {genre.sub_genres.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {genre.sub_genres.map((subGenre) => (
                    <div key={subGenre.id} className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                      <div>
                        <p className="text-white font-medium">{subGenre.display_name}</p>
                        <p className="text-sm text-gray-400">{subGenre.name}</p>
                      </div>
                      <div className="flex space-x-1">
                        <button
                          onClick={() => setEditingSubGenre(subGenre)}
                          className="p-1 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded transition-colors"
                          title="Edit sub-genre"
                        >
                          <Edit className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => deleteSubGenre(subGenre.id)}
                          className="p-1 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors"
                          title="Delete sub-genre"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-sm">No sub-genres added yet</p>
              )}
            </div>
          </div>
        ))}

        {genres.length === 0 && (
          <div className="text-center py-12">
            <Music className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">No genres found</p>
            <p className="text-gray-500 text-sm">Click "Add Genre" to create your first genre</p>
          </div>
        )}
      </div>

      {/* Add Genre Modal */}
      {showAddGenreModal && (
        <div className="fixed inset-0 bg-blue-900/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl border border-blue-500/20 p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Add New Genre</h3>
              <button
                onClick={() => setShowAddGenreModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={e => { e.preventDefault(); createGenre(); }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Display Name *
                </label>
                <input
                  type="text"
                  value={newGenre.display_name}
                  onChange={(e) => setNewGenre({ ...newGenre, display_name: e.target.value })}
                  className="w-full px-3 py-2 bg-white/5 border border-blue-500/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  placeholder="e.g., Hip Hop"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Internal Name *
                </label>
                <input
                  type="text"
                  value={newGenre.name}
                  onChange={(e) => setNewGenre({ ...newGenre, name: e.target.value })}
                  className="w-full px-3 py-2 bg-white/5 border border-blue-500/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  placeholder="e.g., hip_hop"
                />
                <p className="text-xs text-gray-500 mt-1">This will be converted to lowercase with underscores</p>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddGenreModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Create Genre
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Sub-Genre Modal */}
      {showAddSubGenreModal && (
        <div className="fixed inset-0 bg-blue-900/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl border border-blue-500/20 p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Add New Sub-Genre</h3>
              <button
                onClick={() => setShowAddSubGenreModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={e => { e.preventDefault(); createSubGenre(); }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Parent Genre *
                </label>
                <select
                  value={selectedGenreForSubGenre?.id || ''}
                  onChange={(e) => {
                    const genre = genres.find(g => g.id === e.target.value);
                    setSelectedGenreForSubGenre(genre || null);
                  }}
                  className="w-full px-3 py-2 bg-white/5 border border-blue-500/20 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">Select a genre</option>
                  {genres.map(genre => (
                    <option key={genre.id} value={genre.id}>{genre.display_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Display Name *
                </label>
                <input
                  type="text"
                  value={newSubGenre.display_name}
                  onChange={(e) => setNewSubGenre({ ...newSubGenre, display_name: e.target.value })}
                  className="w-full px-3 py-2 bg-white/5 border border-blue-500/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  placeholder="e.g., Trap"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Internal Name *
                </label>
                <input
                  type="text"
                  value={newSubGenre.name}
                  onChange={(e) => setNewSubGenre({ ...newSubGenre, name: e.target.value })}
                  className="w-full px-3 py-2 bg-white/5 border border-blue-500/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  placeholder="e.g., trap"
                />
                <p className="text-xs text-gray-500 mt-1">This will be converted to lowercase with underscores</p>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddSubGenreModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                >
                  Create Sub-Genre
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Genre Modal */}
      {editingGenre && (
        <div className="fixed inset-0 bg-blue-900/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl border border-blue-500/20 p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Edit Genre</h3>
              <button
                onClick={() => setEditingGenre(null)}
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
                  value={editingGenre.display_name}
                  onChange={(e) => setEditingGenre({ ...editingGenre, display_name: e.target.value })}
                  className="w-full px-3 py-2 bg-white/5 border border-blue-500/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Internal Name *
                </label>
                <input
                  type="text"
                  value={editingGenre.name}
                  onChange={(e) => setEditingGenre({ ...editingGenre, name: e.target.value })}
                  className="w-full px-3 py-2 bg-white/5 border border-blue-500/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">This will be converted to lowercase with underscores</p>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => setEditingGenre(null)}
                  className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => updateGenre(editingGenre)}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Update Genre
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Sub-Genre Modal */}
      {editingSubGenre && (
        <div className="fixed inset-0 bg-blue-900/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl border border-blue-500/20 p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Edit Sub-Genre</h3>
              <button
                onClick={() => setEditingSubGenre(null)}
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
                  value={editingSubGenre.display_name}
                  onChange={(e) => setEditingSubGenre({ ...editingSubGenre, display_name: e.target.value })}
                  className="w-full px-3 py-2 bg-white/5 border border-blue-500/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Internal Name *
                </label>
                <input
                  type="text"
                  value={editingSubGenre.name}
                  onChange={(e) => setEditingSubGenre({ ...editingSubGenre, name: e.target.value })}
                  className="w-full px-3 py-2 bg-white/5 border border-blue-500/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">This will be converted to lowercase with underscores</p>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => setEditingSubGenre(null)}
                  className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => updateSubGenre(editingSubGenre)}
                  className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                >
                  Update Sub-Genre
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 