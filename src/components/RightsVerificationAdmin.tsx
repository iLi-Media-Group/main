import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { sendVerificationEmail, sendRecordingVerificationEmail } from '../lib/emailService';
import { 
  Shield, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle, 
  Search, 
  Filter,
  RefreshCw,
  Eye,
  Edit,
  Download,
  FileText,
  Users,
  Calendar,
  Building2,
  Music,
  Mail,
  Phone,
  Globe,
  MapPin,
  UserCheck,
  UserX,
  FileCheck,
  FileX,
  TrendingUp,
  DollarSign,
  BarChart3,
  Settings,
  Plus,
  X,
  Save,
  Copy,
  Share2,
  ExternalLink,
  AtSign,
  CheckSquare,
  Square
} from 'lucide-react';

interface RightsHolder {
  id: string;
  email: string;
  rights_holder_type: 'record_label' | 'publisher';
  company_name: string;
  legal_entity_name?: string;
  business_structure?: string;
  tax_id?: string;
  website?: string;
  phone?: string;
  address_line_1?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country: string;
  verification_status: 'pending' | 'verified' | 'rejected' | 'suspended';
  verification_notes?: string;
  is_active: boolean;
  terms_accepted: boolean;
  rights_authority_declaration_accepted: boolean;
  created_at: string;
  updated_at: string;
  // Profile fields that were previously in rights_holder_profiles
  contact_person_name?: string;
  contact_person_title?: string;
  contact_person_email?: string;
  contact_person_phone?: string;
  logo_url?: string;
  description?: string;
  genres_specialty?: string[];
  years_in_business?: number;
  pro_affiliations?: string[];
  publishing_admin?: string;
  master_admin?: string;
  emergency_contact_name?: string;
  emergency_contact_email?: string;
  emergency_contact_phone?: string;
}

interface MasterRecording {
  id: string;
  title: string;
  artist: string;
  genre: string;
  mood: string;
  bpm: number;
  key: string;
  duration: number;
  description: string;
  audio_url: string;
  artwork_url?: string;
  rights_holder_id: string;
  rights_verification_status: 'pending' | 'verified' | 'rejected';
  admin_review_status: 'pending' | 'approved' | 'rejected';
  admin_review_notes?: string;
  admin_reviewed_at?: string;
  admin_reviewed_by?: string;
  created_at: string;
  updated_at: string;
  rights_holder?: RightsHolder;
}

interface VerificationStats {
  totalRightsHolders: number;
  pendingRightsHolders: number;
  verifiedRightsHolders: number;
  rejectedRightsHolders: number;
  totalRecordings: number;
  pendingRecordings: number;
  verifiedRecordings: number;
  rejectedRecordings: number;
}

export function RightsVerificationAdmin() {
  const [rightsHolders, setRightsHolders] = useState<RightsHolder[]>([]);
  const [masterRecordings, setMasterRecordings] = useState<MasterRecording[]>([]);
  const [stats, setStats] = useState<VerificationStats>({
    totalRightsHolders: 0,
    pendingRightsHolders: 0,
    verifiedRightsHolders: 0,
    rejectedRightsHolders: 0,
    totalRecordings: 0,
    pendingRecordings: 0,
    verifiedRecordings: 0,
    rejectedRecordings: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'rights-holders' | 'recordings'>('rights-holders');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<RightsHolder | MasterRecording | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve');

  // Fetch data on component mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('Fetching rights verification data...');
      
      // Fetch rights holders from profiles table (consolidated structure)
      const { data: rightsHoldersData, error: rightsHoldersError } = await supabase
        .from('profiles')
        .select('*')
        .eq('account_type', 'rights_holder')
        .order('created_at', { ascending: false });

      console.log('Rights holders query result:', { data: rightsHoldersData, error: rightsHoldersError });

      if (rightsHoldersError) {
        console.error('Rights holders error:', rightsHoldersError);
        throw rightsHoldersError;
      }

      // Fetch master recordings with rights holder info (handle case where table might not exist)
      let recordingsData = [];
      let recordingsError = null;
      
      try {
        const { data, error } = await supabase
          .from('master_recordings')
          .select(`
            *,
            rights_holder:profiles(*)
          `)
          .order('created_at', { ascending: false });
        
        recordingsData = data || [];
        recordingsError = error;
      } catch (err) {
        console.log('master_recordings table may not exist yet, using empty array');
        recordingsData = [];
        recordingsError = null;
      }

      console.log('Master recordings query result:', { data: recordingsData, error: recordingsError });

      if (recordingsError) {
        console.error('Master recordings error:', recordingsError);
        // Don't throw error for recordings, just log it
      }

      setRightsHolders(rightsHoldersData || []);
      setMasterRecordings(recordingsData || []);

      // Calculate stats
      const stats: VerificationStats = {
        totalRightsHolders: rightsHoldersData?.length || 0,
        pendingRightsHolders: rightsHoldersData?.filter(rh => rh.verification_status === 'pending').length || 0,
        verifiedRightsHolders: rightsHoldersData?.filter(rh => rh.verification_status === 'verified').length || 0,
        rejectedRightsHolders: rightsHoldersData?.filter(rh => rh.verification_status === 'rejected').length || 0,
        totalRecordings: recordingsData?.length || 0,
        pendingRecordings: recordingsData?.filter(mr => mr.rights_verification_status === 'pending').length || 0,
        verifiedRecordings: recordingsData?.filter(mr => mr.rights_verification_status === 'verified').length || 0,
        rejectedRecordings: recordingsData?.filter(mr => mr.rights_verification_status === 'rejected').length || 0,
      };

      console.log('Calculated stats:', stats);
      setStats(stats);
    } catch (err) {
      console.error('Error fetching verification data:', err);
      setError(`Failed to load verification data: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async () => {
    if (!selectedItem || !reviewNotes.trim()) {
      alert('Please provide review notes');
      return;
    }

    try {
      if (activeTab === 'rights-holders') {
        const rightsHolder = selectedItem as RightsHolder;
        const newStatus = reviewAction === 'approve' ? 'verified' : 'rejected';
        
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            verification_status: newStatus,
            verification_notes: reviewNotes,
            updated_at: new Date().toISOString()
          })
          .eq('id', rightsHolder.id);

        if (updateError) throw updateError;

        // Send email notification
        await sendVerificationEmail(
          rightsHolder.email,
          rightsHolder.company_name,
          rightsHolder.rights_holder_type,
          newStatus as 'verified' | 'rejected',
          reviewNotes
        );
      } else {
        const recording = selectedItem as MasterRecording;
        const newStatus = reviewAction === 'approve' ? 'verified' : 'rejected';
        
        const { error: updateError } = await supabase
          .from('master_recordings')
          .update({
            rights_verification_status: newStatus,
            admin_review_status: reviewAction === 'approve' ? 'approved' : 'rejected',
            admin_review_notes: reviewNotes,
            admin_reviewed_at: new Date().toISOString(),
            admin_reviewed_by: 'admin', // In a real app, this would be the current admin's ID
            updated_at: new Date().toISOString()
          })
          .eq('id', recording.id);

        if (updateError) throw updateError;

        // Send email notification for recording verification
        const rightsHolderEmail = recording.rights_holder?.email || '';
        if (rightsHolderEmail) {
          await sendRecordingVerificationEmail(
            rightsHolderEmail,
            recording.title,
            recording.artist,
            recording.genre,
            recording.mood,
            recording.bpm,
            recording.key,
            newStatus as 'verified' | 'rejected',
            reviewNotes
          );
        }
      }

      // Refresh data
      await fetchData();
      setShowReviewModal(false);
      setSelectedItem(null);
      setReviewNotes('');
      alert(`Successfully ${reviewAction}d`);
    } catch (err) {
      console.error('Error updating review status:', err);
      alert('Failed to update review status');
    }
  };



  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
      case 'approved':
        return 'text-green-400 bg-green-400/20';
      case 'pending':
        return 'text-yellow-400 bg-yellow-400/20';
      case 'rejected':
        return 'text-red-400 bg-red-400/20';
      case 'suspended':
        return 'text-gray-400 bg-gray-400/20';
      default:
        return 'text-gray-400 bg-gray-400/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
      case 'approved':
        return <CheckCircle className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'rejected':
        return <XCircle className="w-4 h-4" />;
      case 'suspended':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const filteredRightsHolders = rightsHolders.filter(rh => {
    const matchesSearch = rh.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         rh.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         rh.rights_holder_type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || rh.verification_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredRecordings = masterRecordings.filter(mr => {
    const matchesSearch = mr.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         mr.artist.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         mr.genre.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || mr.rights_verification_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-blue-900/90 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-300">Loading verification panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-900/90 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-blue-400 mr-2" />
            <h1 className="text-3xl font-bold text-white">Rights Verification Admin Panel</h1>
          </div>
          <p className="text-gray-300">
            Review and verify rights holders and master recordings
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="flex items-center">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Users className="w-6 h-6 text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-300">Total Rights Holders</p>
                <p className="text-2xl font-bold text-white">{stats.totalRightsHolders}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-500/20 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-300">Pending Rights Holders</p>
                <p className="text-2xl font-bold text-white">{stats.pendingRightsHolders}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="flex items-center">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <Music className="w-6 h-6 text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-300">Total Recordings</p>
                <p className="text-2xl font-bold text-white">{stats.totalRecordings}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-500/20 rounded-lg">
                <FileCheck className="w-6 h-6 text-yellow-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-300">Pending Recordings</p>
                <p className="text-2xl font-bold text-white">{stats.pendingRecordings}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 mb-6 border border-white/20">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex gap-4">
              <button
                onClick={() => setActiveTab('rights-holders')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  activeTab === 'rights-holders'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800/50 text-gray-300 hover:text-white'
                }`}
              >
                Rights Holders ({stats.totalRightsHolders})
              </button>
              <button
                onClick={() => setActiveTab('recordings')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  activeTab === 'recordings'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800/50 text-gray-300 hover:text-white'
                }`}
              >
                Master Recordings ({stats.totalRecordings})
              </button>
            </div>

            <div className="flex gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder={`Search ${activeTab === 'rights-holders' ? 'rights holders' : 'recordings'}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="verified">Verified</option>
                <option value="rejected">Rejected</option>
                {activeTab === 'rights-holders' && <option value="suspended">Suspended</option>}
              </select>
              <button
                onClick={fetchData}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6 flex items-center">
            <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
            <span className="text-red-400">{error}</span>
          </div>
        )}

        {/* Content */}
        {activeTab === 'rights-holders' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredRightsHolders.map((rightsHolder) => (
              <div
                key={rightsHolder.id}
                className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:border-blue-500/50 transition-colors"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-1">
                      {rightsHolder.company_name}
                    </h3>
                    <p className="text-gray-400 text-sm">
                      {rightsHolder.rights_holder_type === 'record_label' ? 'Record Label' : 'Publisher'}
                    </p>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium flex items-center ${getStatusColor(rightsHolder.verification_status)}`}>
                    {getStatusIcon(rightsHolder.verification_status)}
                    <span className="ml-1">{rightsHolder.verification_status}</span>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm">
                    <AtSign className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="text-gray-300">{rightsHolder.email}</span>
                  </div>
                  {rightsHolder.phone && (
                    <div className="flex items-center text-sm">
                      <Phone className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-gray-300">{rightsHolder.phone}</span>
                    </div>
                  )}
                  {rightsHolder.website && (
                    <div className="flex items-center text-sm">
                      <Globe className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-gray-300">{rightsHolder.website}</span>
                    </div>
                  )}
                  {rightsHolder.address_line_1 && (
                    <div className="flex items-center text-sm">
                      <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-gray-300">
                        {rightsHolder.address_line_1}, {rightsHolder.city}, {rightsHolder.state}
                      </span>
                    </div>
                  )}
                </div>

                {/* Status Indicators */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="flex items-center text-xs">
                    <CheckSquare className={`w-3 h-3 mr-1 ${rightsHolder.terms_accepted ? 'text-green-400' : 'text-gray-400'}`} />
                    <span className={rightsHolder.terms_accepted ? 'text-green-400' : 'text-gray-400'}>
                      Terms Accepted
                    </span>
                  </div>
                  <div className="flex items-center text-xs">
                    <CheckSquare className={`w-3 h-3 mr-1 ${rightsHolder.rights_authority_declaration_accepted ? 'text-green-400' : 'text-gray-400'}`} />
                    <span className={rightsHolder.rights_authority_declaration_accepted ? 'text-green-400' : 'text-gray-400'}>
                      Rights Declaration
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedItem(rightsHolder)}
                    className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center text-sm"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View Details
                  </button>
                  {rightsHolder.verification_status === 'pending' && (
                    <button
                      onClick={() => {
                        setSelectedItem(rightsHolder);
                        setReviewAction('approve');
                        setShowReviewModal(true);
                      }}
                      className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Date */}
                <div className="text-xs text-gray-400 mt-3 text-center">
                  Created: {new Date(rightsHolder.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredRecordings.map((recording) => (
              <div
                key={recording.id}
                className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:border-blue-500/50 transition-colors"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-1">
                      {recording.title}
                    </h3>
                    <p className="text-gray-400 text-sm">
                      {recording.artist}
                    </p>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium flex items-center ${getStatusColor(recording.rights_verification_status)}`}>
                    {getStatusIcon(recording.rights_verification_status)}
                    <span className="ml-1">{recording.rights_verification_status}</span>
                  </div>
                </div>

                {/* Recording Info */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm">
                    <Music className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="text-gray-300">{recording.genre} • {recording.mood}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <TrendingUp className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="text-gray-300">{recording.bpm} BPM • Key: {recording.key}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Clock className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="text-gray-300">{Math.floor(recording.duration / 60)}:{(recording.duration % 60).toString().padStart(2, '0')}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Building2 className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="text-gray-300">{recording.rights_holder?.company_name}</span>
                  </div>
                </div>

                {/* Description */}
                {recording.description && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-300 line-clamp-2">
                      {recording.description}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedItem(recording)}
                    className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center text-sm"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View Details
                  </button>
                  {recording.rights_verification_status === 'pending' && (
                    <>
                      <button
                        onClick={() => {
                          setSelectedItem(recording);
                          setReviewAction('approve');
                          setShowReviewModal(true);
                        }}
                        className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedItem(recording);
                          setReviewAction('reject');
                          setShowReviewModal(true);
                        }}
                        className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>

                {/* Date */}
                <div className="text-xs text-gray-400 mt-3 text-center">
                  Created: {new Date(recording.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {(activeTab === 'rights-holders' ? filteredRightsHolders.length === 0 : filteredRecordings.length === 0) && !loading && (
          <div className="text-center py-12">
            <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Items Found</h3>
            <p className="text-gray-400 mb-4">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filters'
                : `No ${activeTab === 'rights-holders' ? 'rights holders' : 'recordings'} to review`
              }
            </p>
          </div>
        )}

        {/* Review Modal */}
        {showReviewModal && selectedItem && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 max-w-md w-full">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">
                  {reviewAction === 'approve' ? 'Approve' : 'Reject'} {activeTab === 'rights-holders' ? 'Rights Holder' : 'Recording'}
                </h2>
                <button
                  onClick={() => setShowReviewModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-2">
                  {activeTab === 'rights-holders' 
                    ? (selectedItem as RightsHolder).company_name
                    : (selectedItem as MasterRecording).title
                  }
                </h3>
                <p className="text-gray-300 text-sm">
                  {activeTab === 'rights-holders' 
                    ? (selectedItem as RightsHolder).email
                    : (selectedItem as MasterRecording).artist
                  }
                </p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Review Notes *
                </label>
                <textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  rows={4}
                  placeholder={`Enter notes for ${reviewAction === 'approve' ? 'approval' : 'rejection'}...`}
                  required
                />
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleReview}
                  className={`flex-1 px-4 py-2 rounded-lg transition-colors flex items-center justify-center ${
                    reviewAction === 'approve'
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
                >
                  {reviewAction === 'approve' ? (
                    <CheckCircle className="w-4 h-4 mr-2" />
                  ) : (
                    <XCircle className="w-4 h-4 mr-2" />
                  )}
                  {reviewAction === 'approve' ? 'Approve' : 'Reject'}
                </button>
                <button
                  onClick={() => setShowReviewModal(false)}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
