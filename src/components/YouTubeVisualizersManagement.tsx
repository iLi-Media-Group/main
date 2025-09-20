import React, { useState, useEffect, useRef } from 'react';
import { Plus, Edit, Trash2, Save, X, ExternalLink, Search, Filter } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface YouTubeVisualizer {
  id: string;
  title: string;
  description?: string;
  youtube_url: string;
  thumbnail_url?: string;
  track_id?: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  track?: {
    id: string;
    title: string;
    producer: {
      firstName: string;
    };
  };
}

interface Track {
  id: string;
  title: string;
  producer: {
    firstName: string;
  };
}

export function YouTubeVisualizersManagement() {
  const [visualizers, setVisualizers] = useState<YouTubeVisualizer[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingVisualizer, setEditingVisualizer] = useState<YouTubeVisualizer | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState<boolean | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    youtube_url: '',
    track_id: '',
    display_order: 0,
    is_active: true
  });
  const [trackSearchTerm, setTrackSearchTerm] = useState('');
  const [filteredTracks, setFilteredTracks] = useState<Track[]>([]);
  const [showTrackDropdown, setShowTrackDropdown] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const trackDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchVisualizers();
    fetchTracks();
  }, []);

  useEffect(() => {
    console.log('Track search effect triggered:', { trackSearchTerm, tracksCount: tracks.length });
    
    if (trackSearchTerm.trim() === '') {
      setFilteredTracks([]);
    } else {
      const filtered = tracks.filter(track =>
        track.title.toLowerCase().includes(trackSearchTerm.toLowerCase()) ||
        track.producer.firstName.toLowerCase().includes(trackSearchTerm.toLowerCase())
      );
      console.log('Filtered tracks:', filtered.length);
      setFilteredTracks(filtered.slice(0, 10)); // Limit to 10 results
    }
  }, [trackSearchTerm, tracks]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (trackDropdownRef.current && !trackDropdownRef.current.contains(event.target as Node)) {
        setShowTrackDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchVisualizers = async () => {
    try {
      const { data, error } = await supabase
        .from('youtube_visualizers')
        .select(`
          *,
          track:tracks(
            id,
            title,
            producer:profiles(
              id,
              first_name,
              last_name,
              display_name
            )
          )
        `)
        .order('display_order', { ascending: true });

      if (error) {
        // If table doesn't exist yet, show empty state instead of error
        if (error.message.includes('relation "youtube_visualizers" does not exist') || 
            error.message.includes('relation "public.youtube_visualizers" does not exist')) {
          console.log('YouTube visualizers table not found - showing empty state');
          setVisualizers([]);
          setError('YouTube visualizers table not found. Please apply the database migration first.');
          return;
        }
        throw error;
      }

      // Transform the data to match our interface
      const transformedData = data?.map(item => ({
        ...item,
        track: item.track ? {
          id: item.track.id,
          title: item.track.title,
          producer: {
            firstName: item.track.producer?.display_name || item.track.producer?.first_name || 'Unknown Producer'
          }
        } : undefined
      })) || [];

      setVisualizers(transformedData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchTracks = async () => {
    try {
      const { data, error } = await supabase
        .from('tracks')
        .select(`
          id,
          title,
          producer:profiles(
            id,
            first_name,
            last_name,
            display_name
          )
        `)
        .eq('is_active', true)
        .order('title', { ascending: true });

      if (error) throw error;

      const transformedData = data?.map(track => ({
        id: track.id,
        title: track.title,
        producer: {
          firstName: track.producer?.display_name || track.producer?.first_name || 'Unknown Producer'
        }
      })) || [];

      console.log('Fetched tracks:', transformedData.length);
      setTracks(transformedData);
    } catch (err: any) {
      console.error('Error fetching tracks:', err);
    }
  };

  const getYouTubeVideoId = (url: string): string | null => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const getYouTubeThumbnail = (url: string): string => {
    const videoId = getYouTubeVideoId(url);
    return videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingVisualizer) {
        // Update existing visualizer
        const { error } = await supabase
          .from('youtube_visualizers')
          .update({
            title: formData.title,
            description: formData.description,
            youtube_url: formData.youtube_url,
            track_id: formData.track_id || null,
            display_order: formData.display_order,
            is_active: formData.is_active,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingVisualizer.id);

        if (error) throw error;
      } else {
        // Create new visualizer
        const { error } = await supabase
          .from('youtube_visualizers')
          .insert([{
            title: formData.title,
            description: formData.description,
            youtube_url: formData.youtube_url,
            track_id: formData.track_id || null,
            display_order: formData.display_order,
            is_active: formData.is_active
          }]);

        if (error) throw error;
      }

      await fetchVisualizers();
      resetForm();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleEdit = (visualizer: YouTubeVisualizer) => {
    setEditingVisualizer(visualizer);
    setFormData({
      title: visualizer.title,
      description: visualizer.description || '',
      youtube_url: visualizer.youtube_url,
      track_id: visualizer.track_id || '',
      display_order: visualizer.display_order,
      is_active: visualizer.is_active
    });
    
    // Set the selected track if it exists
    if (visualizer.track) {
      setSelectedTrack(visualizer.track);
      setTrackSearchTerm(`${visualizer.track.title} - ${visualizer.track.producer.firstName}`);
    } else {
      setSelectedTrack(null);
      setTrackSearchTerm('');
    }
    
    setShowForm(true);
  };

  const handleTrackSelect = (track: Track) => {
    setSelectedTrack(track);
    setFormData({ ...formData, track_id: track.id });
    setTrackSearchTerm(`${track.title} - ${track.producer.firstName}`);
    setShowTrackDropdown(false);
  };

  const handleTrackSearchChange = (value: string) => {
    setTrackSearchTerm(value);
    setShowTrackDropdown(true);
    
    // If user clears the search, clear the selection
    if (value.trim() === '') {
      setSelectedTrack(null);
      setFormData({ ...formData, track_id: '' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this visualizer?')) return;

    try {
      const { error } = await supabase
        .from('youtube_visualizers')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchVisualizers();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      youtube_url: '',
      track_id: '',
      display_order: 0,
      is_active: true
    });
    setEditingVisualizer(null);
    setShowForm(false);
    setSelectedTrack(null);
    setTrackSearchTerm('');
    setShowTrackDropdown(false);
  };

  const filteredVisualizers = visualizers.filter(visualizer => {
    const matchesSearch = visualizer.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         visualizer.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         visualizer.track?.title.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterActive === null || visualizer.is_active === filterActive;
    
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">YouTube Visualizers Management</h2>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Visualizer
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search visualizers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <select
          value={filterActive === null ? 'all' : filterActive.toString()}
          onChange={(e) => setFilterActive(e.target.value === 'all' ? null : e.target.value === 'true')}
          className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">
                {editingVisualizer ? 'Edit Visualizer' : 'Add New Visualizer'}
              </h3>
              <button
                onClick={resetForm}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  YouTube URL *
                </label>
                <input
                  type="url"
                  required
                  value={formData.youtube_url}
                  onChange={(e) => setFormData({ ...formData, youtube_url: e.target.value })}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {formData.youtube_url && (
                  <div className="mt-2">
                    <img
                      src={getYouTubeThumbnail(formData.youtube_url)}
                      alt="YouTube thumbnail"
                      className="w-32 h-20 object-cover rounded"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>

              <div className="relative">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Linked Track {tracks.length > 0 && <span className="text-xs text-gray-400">({tracks.length} tracks available)</span>}
                </label>
                <div className="relative" ref={trackDropdownRef}>
                  <input
                    type="text"
                    value={trackSearchTerm}
                    onChange={(e) => handleTrackSearchChange(e.target.value)}
                    onFocus={() => setShowTrackDropdown(true)}
                    placeholder="Search for a track..."
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  
                  {/* Track dropdown */}
                  {showTrackDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-white/20 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {filteredTracks.length > 0 ? (
                        filteredTracks.map((track) => (
                          <button
                            key={track.id}
                            type="button"
                            onClick={() => handleTrackSelect(track)}
                            className="w-full px-3 py-2 text-left text-white hover:bg-white/10 focus:bg-white/10 focus:outline-none"
                          >
                            <div className="font-medium">{track.title}</div>
                            <div className="text-sm text-gray-400">by {track.producer.firstName}</div>
                          </button>
                        ))
                      ) : trackSearchTerm.trim() !== '' ? (
                        <div className="px-3 py-2 text-gray-400 text-sm">
                          No tracks found matching "{trackSearchTerm}"
                        </div>
                      ) : (
                        <div className="px-3 py-2 text-gray-400 text-sm">
                          Start typing to search tracks...
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Clear selection button */}
                  {selectedTrack && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTrack(null);
                        setTrackSearchTerm('');
                        setFormData({ ...formData, track_id: '' });
                        setShowTrackDropdown(false);
                      }}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                
                {/* Selected track display */}
                {selectedTrack && (
                  <div className="mt-2 p-2 bg-blue-500/20 border border-blue-500/30 rounded text-sm">
                    <div className="text-blue-300 font-medium">Selected: {selectedTrack.title}</div>
                    <div className="text-blue-400">by {selectedTrack.producer.firstName}</div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 text-blue-600 bg-white/10 border-white/20 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="is_active" className="ml-2 text-sm text-gray-300">
                    Active
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <Save className="w-4 h-4" />
                  {editingVisualizer ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Visualizers List */}
      <div className="bg-white/5 backdrop-blur-sm rounded-lg border border-blue-500/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/10">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Preview
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Linked Track
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Order
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filteredVisualizers.map((visualizer) => {
                const videoId = getYouTubeVideoId(visualizer.youtube_url);
                const thumbnail = getYouTubeThumbnail(visualizer.youtube_url);

                return (
                  <tr key={visualizer.id} className="hover:bg-white/5">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <img
                        src={thumbnail || visualizer.thumbnail_url || '/placeholder-video.jpg'}
                        alt={visualizer.title}
                        className="w-16 h-12 object-cover rounded"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/placeholder-video.jpg';
                        }}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-white">{visualizer.title}</div>
                        {visualizer.description && (
                          <div className="text-sm text-gray-400 truncate max-w-xs">
                            {visualizer.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {visualizer.track ? (
                        <div className="text-sm text-white">
                          {visualizer.track.title}
                          <div className="text-xs text-gray-400">
                            by {visualizer.track.producer.firstName}
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">No track linked</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      {visualizer.display_order}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        visualizer.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {visualizer.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(visualizer)}
                          className="text-blue-400 hover:text-blue-300"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(visualizer.id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        {visualizer.track && (
                          <a
                            href={`/track/${visualizer.track.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-green-400 hover:text-green-300"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredVisualizers.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-400">No visualizers found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
