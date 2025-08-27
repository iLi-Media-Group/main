import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, 
  User, 
  Music, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  ArrowUpDown, 
  Eye, 
  Edit, 
  Trash2, 
  DollarSign, 
  TrendingUp, 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  X,
  Save,
  Loader2,
  ChevronDown,
  ChevronUp,
  Phone,
  Mail,
  Globe,
  UserPlus,
  BarChart3,
  Upload,
  Image
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useUnifiedAuth } from '../contexts/UnifiedAuthContext';
import { Card, CardContent } from './ui/card';

interface RosterEntity {
  id: string;
  name: string;
  display_name?: string;
  entity_type: 'artist' | 'band' | 'producer';
  email?: string;
  phone?: string;
  website?: string;
  bio?: string;
  genres?: string[];
  image_url?: string;
  social_media?: any;
  contact_info?: any;
  is_active: boolean;
  date_entered: string;
  created_at: string;
  updated_at: string;
  // Analytics data
  total_tracks?: number;
  active_tracks?: number;
  sync_proposals_completed?: number;
  sync_proposals_pending?: number;
  custom_sync_requests_completed?: number;
  custom_sync_requests_pending?: number;
  total_revenue?: number;
}

interface RosterEntityMember {
  id: string;
  member_name: string;
  role?: string;
  email?: string;
  phone?: string;
  is_primary_contact: boolean;
}

export function RightsHolderRosterPage() {
  const { user } = useUnifiedAuth();
  const [rosterEntities, setRosterEntities] = useState<RosterEntity[]>([]);
  const [disabledRosterEntities, setDisabledRosterEntities] = useState<RosterEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'artist' | 'band' | 'producer'>('all');
  const [sortField, setSortField] = useState<'name' | 'date_entered' | 'total_revenue' | 'total_tracks'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [activeTab, setActiveTab] = useState<'active' | 'disabled'>('active');
  const [selectedEntity, setSelectedEntity] = useState<RosterEntity | null>(null);
  const [showEntityModal, setShowEntityModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [entityMembers, setEntityMembers] = useState<RosterEntityMember[]>([]);
  const [entityTracks, setEntityTracks] = useState<any[]>([]);

  // Form state for adding/editing entities
  const [formData, setFormData] = useState({
    name: '',
    display_name: '',
    entity_type: 'artist' as 'artist' | 'band' | 'producer',
    email: '',
    phone: '',
    website: '',
    bio: '',
    genres: [] as string[],
    image_url: '',
    is_active: true
  });

  // Image upload state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      fetchRosterEntities();
    }
  }, [user, searchTerm, filterType, sortField, sortOrder, activeTab]);

  const fetchRosterEntities = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch active entities
      let activeQuery = supabase
        .from('roster_entities')
        .select('*')
        .eq('rights_holder_id', user.id)
        .eq('is_active', true);

      // Apply filters for active entities only when on active tab
      if (activeTab === 'active' && filterType !== 'all') {
        activeQuery = activeQuery.eq('entity_type', filterType);
      }

      // Apply search for active entities only when on active tab
      if (activeTab === 'active' && searchTerm) {
        activeQuery = activeQuery.ilike('name', `%${searchTerm}%`);
      }

      // Apply sorting for active entities only when on active tab
      if (activeTab === 'active') {
        activeQuery = activeQuery.order(sortField, { ascending: sortOrder === 'asc' });
      } else {
        activeQuery = activeQuery.order('name', { ascending: true });
      }

      const { data: activeData, error: activeError } = await activeQuery;

      if (activeError) throw activeError;

      // Fetch disabled entities (always fetch all disabled, no filters)
      const { data: disabledData, error: disabledError } = await supabase
        .from('roster_entities')
        .select('*')
        .eq('rights_holder_id', user.id)
        .eq('is_active', false)
        .order('name', { ascending: true });

      if (disabledError) throw disabledError;

      // Add default analytics values to active entities
      const activeEntitiesWithDefaults = (activeData || []).map(entity => ({
        ...entity,
        entity_name: entity.name,
        total_tracks: 0,
        active_tracks: 0,
        sync_proposals_completed: 0,
        sync_proposals_pending: 0,
        custom_sync_requests_completed: 0,
        custom_sync_requests_pending: 0,
        total_revenue: 0
      }));

      // Add default analytics values to disabled entities
      const disabledEntitiesWithDefaults = (disabledData || []).map(entity => ({
        ...entity,
        entity_name: entity.name,
        total_tracks: 0,
        active_tracks: 0,
        sync_proposals_completed: 0,
        sync_proposals_pending: 0,
        custom_sync_requests_completed: 0,
        custom_sync_requests_pending: 0,
        total_revenue: 0
      }));

      setRosterEntities(activeEntitiesWithDefaults);
      setDisabledRosterEntities(disabledEntitiesWithDefaults);

    } catch (err) {
      console.error('Error fetching roster entities:', err);
      setError('Failed to load roster data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchEntityDetails = async (entityId: string) => {
    try {
      // Fetch entity members
      const { data: membersData, error: membersError } = await supabase
        .from('roster_entity_members')
        .select('*')
        .eq('roster_entity_id', entityId)
        .order('is_primary_contact', { ascending: false });

      if (membersError) throw membersError;
      setEntityMembers(membersData || []);

      // Fetch entity tracks
      const { data: tracksData, error: tracksError } = await supabase
        .from('tracks')
        .select(`
          id,
          title,
          artist,
          genres,
          bpm,
          duration,
          audio_url,
          image_url,
          created_at,
          sync_proposals!inner(id, status, final_amount),
          custom_sync_requests!inner(id, status, final_amount),
          sales!inner(id, amount)
        `)
        .eq('roster_entity_id', entityId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (tracksError) throw tracksError;
      setEntityTracks(tracksData || []);

    } catch (err) {
      console.error('Error fetching entity details:', err);
    }
  };

  const handleEntityClick = (entity: RosterEntity) => {
    setSelectedEntity(entity);
    fetchEntityDetails(entity.id);
    setShowEntityModal(true);
  };

  const handleSort = (field: 'name' | 'date_entered' | 'total_revenue' | 'total_tracks') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleAddEntity = async () => {
    if (!user || !formData.name.trim()) return;

    try {
      let imageUrl = formData.image_url;

      // Upload image if selected
      if (imageFile) {
        setImageUploading(true);
        const fileName = `roster-${Date.now()}-${imageFile.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('profile-photos')
          .upload(fileName, imageFile);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('profile-photos')
          .getPublicUrl(fileName);

        imageUrl = urlData.publicUrl;
        setImageUploading(false);
      }

      const { data, error } = await supabase
        .from('roster_entities')
        .insert({
          rights_holder_id: user.id,
          ...formData,
          image_url: imageUrl
        })
        .select()
        .single();

      if (error) throw error;

      setShowAddModal(false);
      setFormData({
        name: '',
        display_name: '',
        entity_type: 'artist',
        email: '',
        phone: '',
        website: '',
        bio: '',
        genres: [],
        image_url: '',
        is_active: true
      });
      setImageFile(null);
      setImagePreview(null);
      fetchRosterEntities();

    } catch (err) {
      console.error('Error adding roster entity:', err);
      setError('Failed to add roster entity. Please try again.');
      setImageUploading(false);
    }
  };

  const handleDisableEntity = async (entityId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('roster_entities')
        .update({ is_active: false })
        .eq('id', entityId)
        .eq('rights_holder_id', user.id);

      if (error) throw error;

      // Refresh the roster entities
      fetchRosterEntities();
    } catch (err) {
      console.error('Error disabling roster entity:', err);
      setError('Failed to disable roster entity. Please try again.');
    }
  };

  const handleEnableEntity = async (entityId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('roster_entities')
        .update({ is_active: true })
        .eq('id', entityId)
        .eq('rights_holder_id', user.id);

      if (error) throw error;

      // Refresh the roster entities
      fetchRosterEntities();
    } catch (err) {
      console.error('Error enabling roster entity:', err);
      setError('Failed to enable roster entity. Please try again.');
    }
  };

  // Image upload handlers
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image file size must be less than 5MB');
        return;
      }

      setImageFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageRemove = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const openImageSelector = () => {
    fileInputRef.current?.click();
  };

  const getEntityIcon = (entityType: string) => {
    switch (entityType) {
      case 'artist':
        return <User className="w-5 h-5 text-blue-400" />;
      case 'band':
        return <Users className="w-5 h-5 text-green-400" />;
      case 'producer':
        return <Music className="w-5 h-5 text-purple-400" />;
      default:
        return <User className="w-5 h-5 text-gray-400" />;
    }
  };

  const getEntityTypeLabel = (entityType: string) => {
    switch (entityType) {
      case 'artist':
        return 'Artist';
      case 'band':
        return 'Band';
      case 'producer':
        return 'Producer';
      default:
        return entityType;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Roster Management</h1>
            <p className="text-xl text-gray-300 mt-2">
              Manage your artists, bands, and producers
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add to Roster</span>
          </button>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Filters and Search */}
        <Card className="mb-8 bg-white/5 backdrop-blur-sm rounded-xl border border-purple-500/20">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder={activeTab === 'active' ? "Search roster entities..." : "Search disabled roster entities..."}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  disabled={activeTab === 'disabled'}
                  className={`w-full pl-10 pr-4 py-2 bg-white/5 border border-purple-500/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 ${
                    activeTab === 'disabled' ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                />
              </div>

              {/* Type Filter */}
              <div className="relative">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as any)}
                  disabled={activeTab === 'disabled'}
                  className={`pl-8 pr-4 py-2 bg-white/5 border border-purple-500/20 rounded-lg text-white text-sm appearance-none ${
                    activeTab === 'disabled' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                  }`}
                >
                  <option value="all">All Types</option>
                  <option value="artist">Artists</option>
                  <option value="band">Bands</option>
                  <option value="producer">Producers</option>
                </select>
                <Filter className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>
            {activeTab === 'disabled' && (
              <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <p className="text-yellow-400 text-sm">
                  <AlertCircle className="w-4 h-4 inline mr-2" />
                  Search and filters are disabled for disabled roster entities. All disabled entities are shown.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tabs */}
        <div className="flex space-x-1 mb-6 bg-white/5 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('active')}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'active'
                ? 'bg-purple-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            Active Roster ({rosterEntities.length})
          </button>
          <button
            onClick={() => setActiveTab('disabled')}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'disabled'
                ? 'bg-purple-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            Disabled Roster ({disabledRosterEntities.length})
          </button>
        </div>

        {/* Roster List */}
        <Card className="bg-white/5 backdrop-blur-sm rounded-xl border border-purple-500/20">
          <CardContent className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="px-4 py-3 text-left text-gray-400">
                      <button
                        onClick={() => handleSort('name')}
                        className="flex items-center space-x-1 hover:text-white transition-colors"
                      >
                        <span>Name</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left text-gray-400">Type</th>
                    <th className="px-4 py-3 text-left text-gray-400">
                      <button
                        onClick={() => handleSort('date_entered')}
                        className="flex items-center space-x-1 hover:text-white transition-colors"
                      >
                        <span>Date Entered</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-center text-gray-400">
                      <button
                        onClick={() => handleSort('total_tracks')}
                        className="flex items-center space-x-1 hover:text-white transition-colors"
                      >
                        <span>Tracks</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-center text-gray-400">Sync Proposals</th>
                    <th className="px-4 py-3 text-center text-gray-400">Custom Sync</th>
                    <th className="px-4 py-3 text-center text-gray-400">
                      <button
                        onClick={() => handleSort('total_revenue')}
                        className="flex items-center space-x-1 hover:text-white transition-colors"
                      >
                        <span>Revenue</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-center text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const currentEntities = activeTab === 'active' ? rosterEntities : disabledRosterEntities;
                    const entityCount = currentEntities.length;
                    
                    if (entityCount === 0) {
                      return (
                        <tr>
                          <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                            <Users className="w-12 h-12 mx-auto mb-4 text-gray-500" />
                            <p>
                              {activeTab === 'active' 
                                ? 'No active roster entities found' 
                                : 'No disabled roster entities found'
                              }
                            </p>
                            <p className="text-sm mt-1">
                              {activeTab === 'active' 
                                ? 'Add your first artist, band, or producer to get started' 
                                : 'Disabled roster entities will appear here'
                              }
                            </p>
                          </td>
                        </tr>
                      );
                    }

                    return currentEntities.map((entity) => (
                      <tr
                        key={entity.id}
                        className={`border-b border-gray-800 hover:bg-white/5 cursor-pointer ${
                          activeTab === 'disabled' ? 'opacity-60' : ''
                        }`}
                        onClick={() => handleEntityClick(entity)}
                      >
                        <td className="px-4 py-4">
                          <div className="flex items-center space-x-3">
                            {entity.image_url ? (
                              <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-700 flex-shrink-0">
                                <img 
                                  src={entity.image_url} 
                                  alt={entity.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                  }}
                                />
                                <div className="w-full h-full flex items-center justify-center hidden">
                                  {getEntityIcon(entity.entity_type)}
                                </div>
                              </div>
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
                                {getEntityIcon(entity.entity_type)}
                              </div>
                            )}
                            <div>
                              <p className="text-white font-medium">{entity.name}</p>
                              {entity.display_name && (
                                <p className="text-sm text-gray-400">{entity.display_name}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            entity.entity_type === 'artist' ? 'bg-blue-500/20 text-blue-400' :
                            entity.entity_type === 'band' ? 'bg-green-500/20 text-green-400' :
                            'bg-purple-500/20 text-purple-400'
                          }`}>
                            {getEntityTypeLabel(entity.entity_type)}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-gray-300">
                          {new Date(entity.date_entered).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-4 text-center">
                          <div className="flex flex-col items-center">
                            <span className="text-white font-medium">{entity.total_tracks || 0}</span>
                            <span className="text-xs text-gray-400">active: {entity.active_tracks || 0}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <div className="flex flex-col items-center">
                            <span className="text-green-400 font-medium">{entity.sync_proposals_completed || 0}</span>
                            <span className="text-xs text-yellow-400">pending: {entity.sync_proposals_pending || 0}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <div className="flex flex-col items-center">
                            <span className="text-blue-400 font-medium">{entity.custom_sync_requests_completed || 0}</span>
                            <span className="text-xs text-yellow-400">pending: {entity.custom_sync_requests_pending || 0}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className="text-white font-medium">
                            ${(entity.total_revenue || 0).toFixed(2)}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <div className="flex justify-center space-x-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEntityClick(entity);
                              }}
                              className="p-1 text-gray-400 hover:text-white transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {activeTab === 'active' ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (confirm(`Are you sure you want to disable ${entity.name}? This will hide their tracks from the library but preserve existing licenses.`)) {
                                    handleDisableEntity(entity.id);
                                  }
                                }}
                                className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                                title="Disable roster creator"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (confirm(`Are you sure you want to re-enable ${entity.name}? This will make their tracks visible in the library again.`)) {
                                    handleEnableEntity(entity.id);
                                  }
                                }}
                                className="p-1 text-gray-400 hover:text-green-400 transition-colors"
                                title="Re-enable roster creator"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Entity Details Modal */}
        {showEntityModal && selectedEntity && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-blue-900/90 backdrop-blur-md rounded-xl border border-purple-500/20 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-purple-500/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {selectedEntity.image_url ? (
                      <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-700 flex-shrink-0">
                        <img 
                          src={selectedEntity.image_url} 
                          alt={selectedEntity.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                        <div className="w-full h-full flex items-center justify-center hidden">
                          {getEntityIcon(selectedEntity.entity_type)}
                        </div>
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
                        {getEntityIcon(selectedEntity.entity_type)}
                      </div>
                    )}
                    <div>
                      <h2 className="text-2xl font-bold text-white">{selectedEntity.name}</h2>
                      <p className="text-gray-400">{getEntityTypeLabel(selectedEntity.entity_type)}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowEntityModal(false)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Entity Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white/5 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-white mb-3">Contact Information</h3>
                    <div className="space-y-2">
                      {selectedEntity.email && (
                        <div className="flex items-center space-x-2">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-300">{selectedEntity.email}</span>
                        </div>
                      )}
                      {selectedEntity.phone && (
                        <div className="flex items-center space-x-2">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-300">{selectedEntity.phone}</span>
                        </div>
                      )}
                      {selectedEntity.website && (
                        <div className="flex items-center space-x-2">
                          <Globe className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-300">{selectedEntity.website}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-white/5 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-white mb-3">Performance Overview</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Total Tracks:</span>
                        <span className="text-white">{selectedEntity.total_tracks || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Active Tracks:</span>
                        <span className="text-white">{selectedEntity.active_tracks || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Total Revenue:</span>
                        <span className="text-green-400 font-medium">${(selectedEntity.total_revenue || 0).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Band Members (if applicable) */}
                {selectedEntity.entity_type === 'band' && entityMembers.length > 0 && (
                  <div className="bg-white/5 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-white mb-3">Band Members</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {entityMembers.map((member) => (
                        <div key={member.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                          <div>
                            <p className="text-white font-medium">{member.member_name}</p>
                            {member.role && <p className="text-sm text-gray-400">{member.role}</p>}
                          </div>
                          {member.is_primary_contact && (
                            <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs">
                              Primary Contact
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tracks */}
                {entityTracks.length > 0 && (
                  <div className="bg-white/5 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-white mb-3">Tracks</h3>
                    <div className="space-y-3">
                      {entityTracks.map((track) => (
                        <div key={track.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center">
                              <Music className="w-6 h-6 text-gray-400" />
                            </div>
                            <div>
                              <p className="text-white font-medium">{track.title}</p>
                              <p className="text-sm text-gray-400">{track.artist}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-400">
                              {new Date(track.created_at).toLocaleDateString()}
                            </p>
                            <p className="text-xs text-gray-500">
                              {track.genres?.join(', ')}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Add Entity Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-blue-900/90 backdrop-blur-md rounded-xl border border-purple-500/20 w-full max-w-2xl">
              <div className="p-6 border-b border-purple-500/20">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-white">Add to Roster</h2>
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                {/* Image Upload Section */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Profile Image
                  </label>
                  <div className="flex items-center space-x-4">
                    <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-700 flex items-center justify-center flex-shrink-0">
                      {imagePreview ? (
                        <img 
                          src={imagePreview} 
                          alt="Preview" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Image className="w-8 h-8 text-gray-400" />
                      )}
                    </div>
                    <div className="flex flex-col space-y-2">
                      <button
                        type="button"
                        onClick={openImageSelector}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors flex items-center space-x-2"
                      >
                        <Upload className="w-4 h-4" />
                        <span>Upload Image</span>
                      </button>
                      {imagePreview && (
                        <button
                          type="button"
                          onClick={handleImageRemove}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors flex items-center space-x-2"
                        >
                          <X className="w-4 h-4" />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Supported formats: JPG, PNG, GIF. Max size: 5MB
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Creator Type
                  </label>
                  <select
                    value={formData.entity_type}
                    onChange={(e) => setFormData({ ...formData, entity_type: e.target.value as any })}
                    className="w-full px-3 py-2 bg-white/5 border border-purple-500/20 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="artist">Artist</option>
                    <option value="band">Band</option>
                    <option value="producer">Producer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Creator Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-white/5 border border-purple-500/20 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    placeholder="Enter creator name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={formData.display_name}
                    onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                    className="w-full px-3 py-2 bg-white/5 border border-purple-500/20 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    placeholder="Enter display name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 bg-white/5 border border-purple-500/20 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    placeholder="Enter email"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-white/5 border border-purple-500/20 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    placeholder="Enter phone number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Website
                  </label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    className="w-full px-3 py-2 bg-white/5 border border-purple-500/20 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    placeholder="Enter website URL"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Bio
                  </label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 bg-white/5 border border-purple-500/20 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    placeholder="Enter bio"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={() => setShowAddModal(false)}
                    disabled={imageUploading}
                    className="px-4 py-2 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddEntity}
                    disabled={!formData.name.trim() || imageUploading}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white font-semibold rounded-lg transition-colors flex items-center space-x-2"
                  >
                    {imageUploading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    <span>{imageUploading ? 'Uploading...' : 'Add Creator'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
