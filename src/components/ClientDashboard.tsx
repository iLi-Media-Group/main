import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Music, Tag, Clock, Hash, FileMusic, Layers, Mic, Star, X, Calendar, ArrowUpDown, AlertCircle, DollarSign, Edit, Check, Trash2, Plus, UserCog, Loader2, FileText } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Track } from '../types';
import { AudioPlayer } from './AudioPlayer';
import { calculateTimeRemaining } from '../utils/dateUtils';
import { ClientProfile } from './ClientProfile';
import { DeleteLicenseDialog } from './DeleteLicenseDialog';
import { EditRequestDialog } from './EditRequestDialog';
import { LicenseDialog } from './LicenseDialog';
import { SyncProposalDialog } from './SyncProposalDialog';
import AIRecommendationWidget from './AIRecommendationWidget';
import { SyncProposalAcceptDialog } from './SyncProposalAcceptDialog';
import { ProposalConfirmDialog } from './ProposalConfirmDialog';
import { Dialog, DialogContent, DialogOverlay, DialogPortal } from './ui/dialog';
import { ProposalNegotiationDialog } from './ProposalNegotiationDialog';
import { ProposalHistoryDialog } from './ProposalHistoryDialog';

// Inside your page component:
<AIRecommendationWidget />



interface License {
  id: string;
  track: Track;
  license_type: string;
  created_at: string;
  expiry_date: string;
}

interface UserStats {
  totalLicenses: number;
  remainingLicenses: number;
  membershipType: 'Single Track' | 'Gold Access' | 'Platinum Access' | 'Ultimate Access' | null;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  daysUntilReset: number | null;
}

interface CustomSyncRequest {
  id: string;
  project_title: string;
  project_description: string;
  sync_fee: number;
  end_date: string;
  genre: string;
  sub_genres: string[];
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  created_at: string;
}

interface SyncProposal {
  id: string;
  sync_fee: number;
  payment_terms: string;
  is_exclusive: boolean;
  last_message_sender_id?: string;
  last_message_at?: string;
  client_terms_accepted?: any;
  producer_terms_accepted?: any;
  [key: string]: any;
}
interface SyncProposalHistoryMessage {
  id: string;
  sender_id: string;
  sender_name?: string;
  message: string;
  created_at: string;
}

const calculateExpiryDate = (purchaseDate: string, membershipType: string): string => {
  const date = new Date(purchaseDate);
  switch (membershipType) {
    case 'Ultimate Access':
      date.setFullYear(date.getFullYear() + 100);
      break;
    case 'Platinum Access':
      date.setFullYear(date.getFullYear() + 3);
      break;
    default:
      date.setFullYear(date.getFullYear() + 1);
  }
  return date.toISOString();
};

const getExpiryStatus = (expiryDate: string): 'expired' | 'expiring-soon' | 'active' => {
  const now = new Date();
  const expiry = new Date(expiryDate);
  const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysUntilExpiry <= 0) return 'expired';
  if (daysUntilExpiry <= 30) return 'expiring-soon';
  return 'active';
};

// Add a helper to determine if a proposal has a pending action
function hasPendingAction(proposal: SyncProposal, userId: string): boolean {
  // Show badge if proposal has a recent message from someone else
  return !!(
    proposal.status === 'pending' && 
    proposal.last_message_sender_id && 
    proposal.last_message_sender_id !== userId &&
    proposal.last_message_at && 
    new Date(proposal.last_message_at) > new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
  );
}

export function ClientDashboard() {
  const { user, membershipPlan, refreshMembership } = useAuth();
  const navigate = useNavigate();
  const [licenses, setLicenses] = useState<License[]>([]);
  const [favorites, setFavorites] = useState<Track[]>([]);
  const [newTracks, setNewTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortField, setSortField] = useState<'renewal' | 'title' | 'genre' | 'bpm'>('renewal');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [profile, setProfile] = useState<{ first_name?: string, email: string } | null>(null);
  const [userStats, setUserStats] = useState<UserStats>({
    totalLicenses: 0,
    remainingLicenses: 0,
    membershipType: null,
    currentPeriodStart: null,
    currentPeriodEnd: null,
    daysUntilReset: null
  });
  const [removingFavorite, setRemovingFavorite] = useState<string | null>(null);
  const [syncRequests, setSyncRequests] = useState<CustomSyncRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<CustomSyncRequest | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [selectedLicenseToDelete, setSelectedLicenseToDelete] = useState<License | null>(null);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [currentlyPlayingFavorite, setCurrentlyPlayingFavorite] = useState<string | null>(null);
  const [currentlyPlayingNew, setCurrentlyPlayingNew] = useState<string | null>(null);
  const [showLicenseDialog, setShowLicenseDialog] = useState(false);
  const [selectedTrackToLicense, setSelectedTrackToLicense] = useState<Track | null>(null);
  const [showProposalDialog, setShowProposalDialog] = useState(false);
  const [syncProposals, setSyncProposals] = useState<any[]>([]);
  const [selectedProposal, setSelectedProposal] = useState<any | null>(null);
  const [showAcceptDialog, setShowAcceptDialog] = useState(false);
  const [syncProposalsTab, setSyncProposalsTab] = useState<'pending' | 'accepted' | 'declined'>('pending');
  const [showDeclineDialog, setShowDeclineDialog] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyProposal, setHistoryProposal] = useState<SyncProposal | null>(null);
  const [historyMessages, setHistoryMessages] = useState<SyncProposalHistoryMessage[]>([]);
  const [showNegotiationModal, setShowNegotiationModal] = useState(false);

  useEffect(() => {
    if (user) {
      // Refresh membership info first to ensure we have the latest data
      refreshMembership().then(() => {
        fetchDashboardData();
        fetchSyncProposals();
      });
    }
  }, [user, membershipPlan]);

  const fetchDashboardData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError('');

      const { data: profileData } = await supabase
        .from('profiles')
        .select('first_name, email, membership_plan')
        .eq('id', user.id)
        .single();

      if (profileData) {
        setProfile(profileData);
        setUserStats(prev => ({
          ...prev,
          membershipType: profileData.membership_plan as UserStats['membershipType']
        }));
      }

      const { data: licensesData } = await supabase
        .from('sales')
        .select(`
          id,
          license_type,
          created_at,
          expiry_date,
          track:tracks (
            id,
            title,
            genres,
            bpm,
            audio_url,
            image_url,
            track_producer_id,
            producer:profiles!tracks_track_producer_id_fkey (
              id,
              first_name,
              last_name,
              email
            )
          )
        `)
        .eq('buyer_id', user.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (licensesData) {
        const formattedLicenses = licensesData.map(license => ({
          ...license,
          expiry_date: license.expiry_date || calculateExpiryDate(license.created_at, profileData.membership_plan),
          track: {
            ...license.track,
            genres: license.track.genres.split(',').map((g: string) => g.trim()),
            audioUrl: license.track.audio_url || '',
            image: license.track.image_url || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop',
            producerId: license.track.track_producer_id,
            duration: license.track.duration || '3:30',
            hasStingEnding: license.track.has_sting_ending || false,
            isOneStop: license.track.is_one_stop || false,
            mp3Url: license.track.mp3_url || '',
            trackoutsUrl: license.track.trackouts_url || '',
            splitSheetUrl: license.track.split_sheet_url || '',
            hasVocals: license.track.has_vocals,
            vocalsUsageType: license.track.vocals_usage_type,
            subGenres: license.track.sub_genres ? license.track.sub_genres.split(',').map((g: string) => g.trim()) : [],
            moods: license.track.moods ? license.track.moods.split(',').map((m: string) => m.trim()) : [],
            artist: license.track.artist || '',
            producer: license.track.producer ? {
              id: license.track.producer.id,
              firstName: license.track.producer.first_name || '',
              lastName: license.track.producer.last_name || '',
              email: license.track.producer.email,
            } : undefined,
            fileFormats: { stereoMp3: { format: [], url: '' }, stems: { format: [], url: '' }, stemsWithVocals: { format: [], url: '' } },
            pricing: { stereoMp3: 0, stems: 0, stemsWithVocals: 0 },
            leaseAgreementUrl: ''
          }
        }));
        setLicenses(formattedLicenses);
      }

      const { data: favoritesData } = await supabase
        .from('favorites')
        .select(`
          track_id,
          tracks (
            id,
            title,
            artist,
            genres,
            moods,
            duration,
            bpm,
            audio_url,
            image_url,
            has_sting_ending,
            is_one_stop,
            mp3_url,
            trackouts_url,
            has_vocals,
            vocals_usage_type,
            sub_genres,
            track_producer_id,
            producer:profiles!tracks_track_producer_id_fkey (
              id,
              first_name,
              last_name,
              email
            )
          )
        `)
        .eq('user_id', user.id);

      if (favoritesData) {
        const formattedFavorites = favoritesData.map(f => ({
          id: f.tracks.id,
          title: f.tracks.title,
          artist: f.tracks.producer ? `${f.tracks.producer.first_name} ${f.tracks.producer.last_name}`.trim() : 'Unknown Artist',
          genres: f.tracks.genres.split(',').map((g: string) => g.trim()),
          moods: f.tracks.moods ? f.tracks.moods.split(',').map((m: string) => m.trim()) : [],
          duration: f.tracks.duration || '3:30',
          bpm: f.tracks.bpm,
          audioUrl: f.tracks.audio_url,
          image: f.tracks.image_url || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop',
          hasStingEnding: f.tracks.has_sting_ending,
          isOneStop: f.tracks.is_one_stop,
          mp3Url: f.tracks.mp3_url,
          trackoutsUrl: f.tracks.trackouts_url,
          hasVocals: f.tracks.has_vocals,
          vocalsUsageType: f.tracks.vocals_usage_type,
          subGenres: f.tracks.sub_genres ? f.tracks.sub_genres.split(',').map((g: string) => g.trim()) : [],
          producerId: f.tracks.track_producer_id,
          producer: f.tracks.producer ? {
            id: f.tracks.producer.id,
            firstName: f.tracks.producer.first_name || '',
            lastName: f.tracks.producer.last_name || '',
            email: f.tracks.producer.email
          } : undefined,
          fileFormats: { stereoMp3: { format: [], url: '' }, stems: { format: [], url: '' }, stemsWithVocals: { format: [], url: '' } },
          pricing: { stereoMp3: 0, stems: 0, stemsWithVocals: 0 },
          leaseAgreementUrl: ''
        }));
        setFavorites(formattedFavorites);
      }

      const { data: newTracksData } = await supabase
        .from('tracks')
        .select(`
          id,
          title,
          genres,
          bpm,
          audio_url,
          image_url,
          has_vocals,
          vocals_usage_type,
          sub_genres,
          moods,
          duration,
          artist,
          has_sting_ending,
          is_one_stop,
          mp3_url,
          trackouts_url,
          split_sheet_url,
          track_producer_id,
          producer:profiles!tracks_track_producer_id_fkey (
            id,
            first_name,
            last_name,
            email
          )
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      if (newTracksData) {
        const formattedNewTracks = newTracksData.map(track => ({
          id: track.id,
          title: track.title,
          artist: track.producer?.first_name 
            ? `${track.producer.first_name} ${track.producer.last_name || ''}`.trim()
            : track.artist || 'Unknown Artist',
          genres: track.genres.split(',').map((g: string) => g.trim()),
          moods: track.moods ? track.moods.split(',').map((m: string) => m.trim()) : [],
          bpm: track.bpm,
          audioUrl: track.audio_url,
          image: track.image_url || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop',
          hasVocals: track.has_vocals,
          vocalsUsageType: track.vocals_usage_type,
          subGenres: track.sub_genres ? track.sub_genres.split(',').map((g: string) => g.trim()) : [],
          duration: track.duration || '3:30',
          hasStingEnding: track.has_sting_ending || false,
          isOneStop: track.is_one_stop || false,
          mp3Url: track.mp3_url || '',
          trackoutsUrl: track.trackouts_url || '',
          splitSheetUrl: track.split_sheet_url || '',
          producerId: track.track_producer_id,
          producer: track.producer ? {
            id: track.producer.id,
            firstName: track.producer.first_name || '',
            lastName: track.producer.last_name || '',
            email: track.producer.email
          } : undefined,
          fileFormats: { stereoMp3: { format: [], url: '' }, stems: { format: [], url: '' }, stemsWithVocals: { format: [], url: '' } },
          pricing: { stereoMp3: 0, stems: 0, stemsWithVocals: 0 },
          leaseAgreementUrl: ''
        }));
        setNewTracks(formattedNewTracks);
      }

      const { data: syncRequestsData } = await supabase
        .from('custom_sync_requests')
        .select('*')
        .eq('client_id', user.id)
        .order('created_at', { ascending: false });

      if (syncRequestsData) {
        setSyncRequests(syncRequestsData);
      }

      // Calculate remaining licenses for Gold Access
      if (membershipPlan === 'Gold Access') {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const { count } = await supabase
          .from('sales')
          .select('id', { count: 'exact' })
          .eq('buyer_id', user.id)
          .gte('created_at', startOfMonth.toISOString());

        const totalLicenses = count || 0;
        const remainingLicenses = 10 - totalLicenses;

        setUserStats(prev => ({
          ...prev,
          totalLicenses,
          remainingLicenses,
          currentPeriodStart: startOfMonth,
          currentPeriodEnd: new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 0),
          daysUntilReset: Math.ceil((new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 1).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
        }));
      }

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchSyncProposals = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('sync_proposals')
      .select(`
        *, 
        track:tracks(*, producer:profiles(*)),
        last_message_sender_id,
        last_message_at,
        client_terms_accepted,
        producer_terms_accepted
      `)
      .eq('client_id', user.id)
      .order('created_at', { ascending: false });
    if (!error && data) setSyncProposals(data);
  };

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleRemoveFavorite = async (trackId: string) => {
    if (!user) return;

    try {
      setRemovingFavorite(trackId);
      
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('track_id', trackId);

      if (error) throw error;

      setFavorites(favorites.filter(track => track.id !== trackId));
    } catch (error) {
      console.error('Error removing favorite:', error);
    } finally {
      setRemovingFavorite(null);
    }
  };

  const togglePlayFavorite = (trackId: string) => {
    if (currentlyPlayingFavorite === trackId) {
      setCurrentlyPlayingFavorite(null);
    } else {
      setCurrentlyPlayingFavorite(trackId);
      // Stop other players if they're playing
      setCurrentlyPlayingNew(null);
    }
  };

  const togglePlayNew = (trackId: string) => {
    if (currentlyPlayingNew === trackId) {
      setCurrentlyPlayingNew(null);
    } else {
      setCurrentlyPlayingNew(trackId);
      // Stop other players if they're playing
      setCurrentlyPlayingFavorite(null);
    }
  };

  const handleLicenseClick = (track: Track) => {
    // For sync-only tracks, show the proposal dialog
    if (track.hasVocals && track.vocalsUsageType === 'sync_only') {
      setSelectedTrackToLicense(track);
      setShowProposalDialog(true);
      return;
    }
    
    // For regular tracks, show the license dialog
    setSelectedTrackToLicense(track);
    setShowLicenseDialog(true);
  };

  const handleUpdateRequest = async (requestId: string, updates: Partial<CustomSyncRequest>) => {
    try {
      const { error } = await supabase
        .from('custom_sync_requests')
        .update(updates)
        .eq('id', requestId);

      if (error) throw error;

      setSyncRequests(requests =>
        requests.map(req =>
          req.id === requestId ? { ...req, ...updates } : req
        )
      );
    } catch (err) {
      console.error('Error updating request:', err);
      throw err;
    }
  };

  const handleDeleteRequest = async (requestId: string) => {
    if (!confirm('Are you sure you want to delete this request?')) return;

    try {
      const { error } = await supabase
        .from('custom_sync_requests')
        .delete()
        .eq('id', requestId);

      if (error) throw error;

      setSyncRequests(requests => requests.filter(req => req.id !== requestId));
    } catch (err) {
      console.error('Error deleting request:', err);
    }
  };

  const handleDeleteLicense = async () => {
    if (!selectedLicenseToDelete) return;

    const { error } = await supabase
      .from('sales')
      .update({
        deleted_at: new Date().toISOString()
      })
      .eq('id', selectedLicenseToDelete.id);

    if (error) throw error;

    setLicenses(licenses.filter(l => l.id !== selectedLicenseToDelete.id));
  };

  const handleViewLicenseAgreement = (licenseId: string) => {
    navigate(`/license-agreement/${licenseId}`);
  };

  const handleDeclineProposal = async (proposal: SyncProposal) => {
    // Update proposal status to declined, disable negotiation, notify other party
    await supabase
      .from('sync_proposals')
      .update({ client_status: 'rejected', status: 'declined', updated_at: new Date().toISOString() })
      .eq('id', proposal.id);
    // Optionally: send notification to producer
    fetchSyncProposals();
  };

  const handleShowHistory = async (proposal: SyncProposal) => {
    setHistoryProposal(proposal);
    // Fetch negotiation/history messages from the new sync_proposal_history table
    const { data, error } = await supabase
      .from('sync_proposal_history')
      .select('*')
      .eq('proposal_id', proposal.id)
      .order('created_at', { ascending: true });
    if (!error && data) setHistoryMessages(data);
    setShowHistoryModal(true);
  };

  const sortedAndFilteredLicenses = licenses
    .filter(license => !selectedGenre || license.track.genres.includes(selectedGenre))
    .sort((a, b) => {
      const modifier = sortOrder === 'asc' ? 1 : -1;
      switch (sortField) {
        case 'renewal':
          return (new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime()) * modifier;
        case 'title':
          return a.track.title.localeCompare(b.track.title) * modifier;
        default:
          return 0;
      }
    });

  const sortedAndFilteredFavorites = favorites
    .filter(track => !selectedGenre || track.genres.includes(selectedGenre))
    .sort((a, b) => {
      const modifier = sortOrder === 'asc' ? 1 : -1;
      switch (sortField) {
        case 'title':
          return a.title.localeCompare(b.title) * modifier;
        case 'genre':
          return a.genres[0].localeCompare(b.genres[0]) * modifier;
        case 'bpm':
          return (a.bpm - b.bpm) * modifier;
        default:
          return 0;
      }
    });

  // Tab filter logic
  const pendingProposals = syncProposals.filter(p => p.status === 'pending' || (p.client_status !== 'accepted' && p.producer_status !== 'accepted'));
  const acceptedProposals = syncProposals.filter(p => p.client_status === 'accepted' && p.producer_status === 'accepted');
  const declinedProposals = syncProposals.filter(p => p.client_status === 'rejected' || p.producer_status === 'rejected');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Your Client Dashboard</h1>
            {profile && (
              <p className="text-xl text-gray-300 mt-2">
                Welcome {profile.first_name || profile.email.split('@')[0]}
              </p>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowProfileDialog(true)}
              className="flex items-center px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
            >
              <UserCog className="w-5 h-5 mr-2" />
              Edit Profile
            </button>
            <Link
              to="/pricing"
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors"
            >
              Upgrade Membership
            </Link>
          </div>
        </div>

        <div className="mb-8 p-6 glass-card rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white mb-2">License Usage</h2>
              <p className="text-gray-300">
                <span className="font-semibold text-white">Current Plan: {membershipPlan}</span>
                <br />
                {membershipPlan === 'Gold Access' ? (
                  <>
                    You have used {userStats.totalLicenses} of your 10 monthly licenses
                    ({userStats.remainingLicenses} remaining)
                  </>
                ) : membershipPlan === 'Platinum Access' || membershipPlan === 'Ultimate Access' ? (
                  'You have unlimited licenses available'
                ) : (
                  'Single track license'
                )}
              </p>
              {userStats.currentPeriodStart && userStats.currentPeriodEnd && (
                <p className="text-sm text-gray-400 mt-2">
                  Current period: {userStats.currentPeriodStart.toLocaleDateString()} - {userStats.currentPeriodEnd.toLocaleDateString()}
                  {userStats.daysUntilReset !== null && (
                    <span className="ml-2">
                      ({userStats.daysUntilReset} days until reset)
                    </span>
                  )}
                </p>
              )}
            </div>
            {membershipPlan === 'Gold Access' && userStats.remainingLicenses < 3 && (
              <div className="flex items-center text-yellow-400">
                <AlertCircle className="w-5 h-5 mr-2" />
                <span>Running low on licenses</span>
              </div>
            )}
          </div>
          {membershipPlan === 'Gold Access' && (
            <div className="mt-4 w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-purple-600 rounded-full h-2 transition-all duration-300"
                style={{ width: `${(userStats.totalLicenses / 10) * 100}%` }}
              />
            </div>
          )}
        </div>

        {/* Sync Proposals Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-4">Sync Proposals</h2>
          <div className="flex space-x-2 mb-4">
            <button onClick={() => setSyncProposalsTab('pending')} className={`px-4 py-2 rounded-lg ${syncProposalsTab === 'pending' ? 'bg-blue-600 text-white' : 'bg-white/10 text-gray-300 hover:bg-white/20'}`}>Pending/Active</button>
            <button onClick={() => setSyncProposalsTab('accepted')} className={`px-4 py-2 rounded-lg ${syncProposalsTab === 'accepted' ? 'bg-green-600 text-white' : 'bg-white/10 text-gray-300 hover:bg-white/20'}`}>Accepted</button>
            <button onClick={() => setSyncProposalsTab('declined')} className={`px-4 py-2 rounded-lg ${syncProposalsTab === 'declined' ? 'bg-red-600 text-white' : 'bg-white/10 text-gray-300 hover:bg-white/20'}`}>Declined</button>
          </div>
          {syncProposalsTab === 'pending' && (
            pendingProposals.length === 0 ? (
              <p className="text-gray-400">You have no pending or active sync proposals.</p>
            ) : (
              <div className="space-y-4">
                {pendingProposals.map((proposal) => (
                  <div key={proposal.id} className="bg-white/5 rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between relative">
                    {/* Notification Badge */}
                    {user && hasPendingAction(proposal, user.id) && (
                      <span className="absolute top-2 right-2 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
                      </span>
                    )}
                    <div>
                      <div className="font-semibold text-white">{proposal.track?.title || 'Untitled Track'}</div>
                      <div className="text-gray-400 text-sm">Status: {proposal.status}</div>
                      <div className="text-gray-400 text-sm">Sync Fee: ${proposal.sync_fee}</div>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
                      <button className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700" onClick={() => handleShowHistory(proposal)}>History</button>
                      <button className="px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700" onClick={() => { setSelectedProposal(proposal); setShowNegotiationModal(true); }}>Negotiate</button>
                      <button className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700" onClick={() => { setSelectedProposal(proposal); setShowAcceptDialog(true); }}>Accept</button>
                      <button className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700" onClick={() => { setSelectedProposal(proposal); setShowDeclineDialog(true); }} disabled={proposal.status === 'declined'}>Decline</button>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
          {syncProposalsTab === 'accepted' && (
            acceptedProposals.length === 0 ? (
              <p className="text-gray-400">You have no accepted sync proposals.</p>
            ) : (
              <div className="space-y-4">
                {acceptedProposals.map((proposal) => (
                  <div key={proposal.id} className="bg-green-500/10 rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="font-semibold text-white">{proposal.track?.title || 'Untitled Track'}</div>
                      <div className="text-gray-400 text-sm">Status: Accepted</div>
                      <div className="text-gray-400 text-sm">Sync Fee: ${proposal.sync_fee}</div>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
                      <button className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700" onClick={() => {/* Show history logic here */}}>History</button>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
          {syncProposalsTab === 'declined' && (
            declinedProposals.length === 0 ? (
              <p className="text-gray-400">You have no declined sync proposals.</p>
            ) : (
              <div className="space-y-4">
                {declinedProposals.map((proposal) => (
                  <div key={proposal.id} className="bg-red-500/10 rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="font-semibold text-white">{proposal.track?.title || 'Untitled Track'}</div>
                      <div className="text-gray-400 text-sm">Status: Declined</div>
                      <div className="text-gray-400 text-sm">Sync Fee: ${proposal.sync_fee}</div>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
                      <button className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700" onClick={() => {/* Show history logic here */}}>History</button>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </section>
        {/* History Modal */}
        {showHistoryModal && historyProposal && (
          <ProposalHistoryDialog
            isOpen={showHistoryModal}
            onClose={() => setShowHistoryModal(false)}
            proposal={historyProposal}
          />
        )}
        {/* Custom Sync Requests Section */}
        <div className="mb-8 bg-white/5 backdrop-blur-sm rounded-xl border border-purple-500/20 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Your Custom Sync Requests</h2>
            <Link
              to="/custom-sync-request"
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Request
            </Link>
          </div>

          {syncRequests.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400">No sync requests yet</p>
              <Link
                to="/custom-sync-request"
                className="inline-block mt-4 text-purple-400 hover:text-purple-300"
              >
                Create your first sync request
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {syncRequests.map((request) => (
                <div
                  key={request.id}
                  className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-purple-500/20"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-1">
                        {request.project_title}
                      </h3>
                      <p className="text-gray-400 text-sm mb-2">
                        {request.project_description}
                      </p>
                      <div className="flex items-center space-x-4 text-sm">
                        <span className="text-purple-400">${request.sync_fee.toFixed(2)}</span>
                        <span className="text-gray-400">{request.genre}</span>
                        <span className="text-gray-400">
                          Due: {new Date(request.end_date).toLocaleDateString()}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          request.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                          request.status === 'in_progress' ? 'bg-blue-500/20 text-blue-400' :
                          request.status === 'cancelled' ? 'bg-red-500/20 text-red-400' :
                          'bg-purple-500/20 text-purple-400'
                        }`}>
                          {request.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setSelectedRequest(request);
                          setShowEditDialog(true);
                        }}
                        className="p-2 text-gray-400 hover:text-white transition-colors"
                        title="Edit request"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      {request.status !== 'completed' && (
                        <button
                          onClick={() => handleUpdateRequest(request.id, { status: 'completed' })}
                          className="p-2 text-gray-400 hover:text-green-400 transition-colors"
                          title="Mark as completed"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteRequest(request.id)}
                        className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                        title="Delete request"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sync Proposals Section */}
        <div className="mb-8 bg-white/5 backdrop-blur-sm rounded-xl border border-purple-500/20 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center">
              <FileText className="w-5 h-5 mr-2 text-yellow-400" />
              Sync Proposals
            </h2>
          </div>
          
          {/* Tab Navigation */}
          <div className="flex space-x-1 mb-4 bg-white/5 rounded-lg p-1">
            <button
              onClick={() => setSyncProposalsTab('pending')}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                syncProposalsTab === 'pending'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
            >
              Pending/Active ({pendingProposals.length})
            </button>
            <button
              onClick={() => setSyncProposalsTab('accepted')}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                syncProposalsTab === 'accepted'
                  ? 'bg-green-600 text-white'
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
            >
              Accepted ({acceptedProposals.length})
            </button>
            <button
              onClick={() => setSyncProposalsTab('declined')}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                syncProposalsTab === 'declined'
                  ? 'bg-red-600 text-white'
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
            >
              Declined ({declinedProposals.length})
            </button>
          </div>

          {/* Tab Content */}
          <div className="space-y-4">
            {syncProposalsTab === 'pending' && (
              pendingProposals.length === 0 ? (
                <div className="text-center py-6 bg-white/5 backdrop-blur-sm rounded-lg border border-blue-500/20">
                  <p className="text-gray-400">No pending or active proposals</p>
                </div>
              ) : (
                pendingProposals.map((proposal) => (
                  <div
                    key={proposal.id}
                    className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-blue-500/20 relative"
                  >
                    {/* Notification Badge */}
                    {user && hasPendingAction(proposal, user.id) && (
                      <span className="absolute top-2 right-2 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
                      </span>
                    )}
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="text-white font-medium">{proposal.track?.title || 'Untitled Track'}</h4>
                        <p className="text-sm text-gray-400">
                          Producer: {proposal.track?.producer?.first_name} {proposal.track?.producer?.last_name}
                        </p>
                        <p className="text-xs text-gray-500">
                          Status: {proposal.status} {proposal.producer_status && `(${proposal.producer_status})`}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-green-400">${proposal.sync_fee.toFixed(2)}</p>
                        <p className="text-xs text-gray-400">
                          Expires: {new Date(proposal.expiration_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mt-4">
                      <button
                        onClick={() => handleShowHistory(proposal)}
                        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                      >
                        History
                      </button>
                      <button
                        onClick={() => { setSelectedProposal(proposal); setShowNegotiationModal(true); }}
                        className="px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm"
                      >
                        Negotiate
                      </button>
                      <button
                        onClick={() => { setSelectedProposal(proposal); setShowAcceptDialog(true); }}
                        className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => { setSelectedProposal(proposal); setShowDeclineDialog(true); }}
                        className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                        disabled={proposal.status === 'declined'}
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))
              )
            )}

            {syncProposalsTab === 'accepted' && (
              acceptedProposals.length === 0 ? (
                <div className="text-center py-6 bg-white/5 backdrop-blur-sm rounded-lg border border-blue-500/20">
                  <p className="text-gray-400">No accepted proposals</p>
                </div>
              ) : (
                acceptedProposals.map((proposal) => (
                  <div
                    key={proposal.id}
                    className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-green-500/20"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="text-white font-medium">{proposal.track?.title || 'Untitled Track'}</h4>
                        <p className="text-sm text-gray-400">
                          Producer: {proposal.track?.producer?.first_name} {proposal.track?.producer?.last_name}
                        </p>
                        <p className="text-xs text-green-400">
                          ✓ Accepted by both parties
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-green-400">${proposal.sync_fee.toFixed(2)}</p>
                        <p className="text-xs text-gray-400">
                          Accepted: {new Date(proposal.updated_at || proposal.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mt-4">
                      <button
                        onClick={() => handleShowHistory(proposal)}
                        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                      >
                        History
                      </button>
                    </div>
                  </div>
                ))
              )
            )}

            {syncProposalsTab === 'declined' && (
              declinedProposals.length === 0 ? (
                <div className="text-center py-6 bg-white/5 backdrop-blur-sm rounded-lg border border-blue-500/20">
                  <p className="text-gray-400">No declined proposals</p>
                </div>
              ) : (
                declinedProposals.map((proposal) => (
                  <div
                    key={proposal.id}
                    className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-red-500/20"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="text-white font-medium">{proposal.track?.title || 'Untitled Track'}</h4>
                        <p className="text-sm text-gray-400">
                          Producer: {proposal.track?.producer?.first_name} {proposal.track?.producer?.last_name}
                        </p>
                        <p className="text-xs text-red-400">
                          ✗ Declined {proposal.producer_status === 'rejected' ? 'by producer' : 'by you'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-gray-400">${proposal.sync_fee.toFixed(2)}</p>
                        <p className="text-xs text-gray-400">
                          Declined: {new Date(proposal.updated_at || proposal.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-4">
                      <button
                        onClick={() => handleShowHistory(proposal)}
                        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                      >
                        History
                      </button>
                    </div>
                  </div>
                ))
              )
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Your Licensed Tracks</h2>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => handleSort('renewal')}
                  className="flex items-center space-x-2 px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20"
                >
                  <Calendar className="w-4 h-4" />
                  <ArrowUpDown className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleSort('title')}
                  className="flex items-center space-x-2 px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20"
                >
                  <span>A-Z</span>
                  <ArrowUpDown className="w-4 h-4" />
                </button>
                <select
                  value={selectedGenre}
                  onChange={(e) => setSelectedGenre(e.target.value)}
                  className="bg-white/10 border border-purple-500/20 rounded-lg px-3 py-1 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">All Genres</option>
                  {Array.from(new Set(licenses.flatMap(l => l.track.genres))).map(genre => (
                    <option key={genre} value={genre}>{genre}</option>
                  ))}
                </select>
              </div>
            </div>

            {sortedAndFilteredLicenses.length === 0 ? (
              <div className="text-center py-12 bg-white/5 backdrop-blur-sm rounded-lg border border-purple-500/20">
                <Music className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400">No licensed tracks found</p>
                <Link
                  to="/catalog"
                  className="inline-block mt-4 px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors"
                >
                  Browse Catalog
                </Link>
              </div>
            ) : (
              sortedAndFilteredLicenses.map((license) => {
                const expiryStatus = getExpiryStatus(license.expiry_date);
                
                return (
                  <div
                    key={license.id}
                    className={`bg-white/5 backdrop-blur-sm rounded-lg p-4 border ${
                      expiryStatus === 'expired' ? 'border-red-500/20' :
                      expiryStatus === 'expiring-soon' ? 'border-yellow-500/20' :
                      'border-purple-500/20'
                    }`}
                  >
                    <div className="flex flex-col space-y-3">
                      <div className="flex items-start space-x-4">
                        <img
                          src={license.track.image}
                          alt={license.track.title}
                          className="w-16 h-16 object-cover rounded-lg flex-shrink-0 cursor-pointer"
                          onClick={() => navigate(`/track/${license.track.id}`)}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <button
                              onClick={() => navigate(`/track/${license.track.id}`)}
                              className="text-lg font-semibold text-white hover:text-blue-400 transition-colors text-left"
                            >
                              {license.track.title}
                            </button>
                            <div className="flex items-center space-x-2 mt-2 md:mt-0">
                              <button
                                onClick={() => handleViewLicenseAgreement(license.id)}
                                className="flex items-center px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                              >
                                <FileText className="w-4 h-4 mr-1" />
                                View Agreement
                              </button>
                              <button
                                onClick={() => setSelectedLicenseToDelete(license)}
                                className="flex items-center px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4 mr-1" />
                                Delete
                              </button>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-400 mt-2">
                            <span className="flex items-center">
                              <Tag className="w-4 h-4 mr-1" />
                              {license.track.genres.join(', ')}
                            </span>
                            <span className="flex items-center">
                              <Hash className="w-4 h-4 mr-1" />
                              {license.track.bpm} BPM
                            </span>
                            <span className="flex items-center">
                              <Layers className="w-4 h-4 mr-1" />
                              {license.license_type}
                            </span>
                          </div>
                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                expiryStatus === 'expired' ? 'bg-red-500/20 text-red-400' :
                                expiryStatus === 'expiring-soon' ? 'bg-yellow-500/20 text-yellow-400' :
                                'bg-green-500/20 text-green-400'
                              }`}>
                                {expiryStatus === 'expired' ? 'Expired' :
                                 expiryStatus === 'expiring-soon' ? 'Expiring Soon' :
                                 'Active'}
                              </span>
                              <span className="text-xs text-gray-400">
                                {expiryStatus === 'expired' ? 'Expired' : 'Expires'}: {new Date(license.expiry_date).toLocaleDateString()}
                              </span>
                            </div>
                            {license.track.audioUrl && (
                              <AudioPlayer
                                src={license.track.audioUrl}
                                title={license.track.title}
                                isPlaying={currentlyPlaying === license.track.id}
                                onToggle={() => {
                                  if (currentlyPlaying === license.track.id) {
                                    setCurrentlyPlaying(null);
                                  } else {
                                    setCurrentlyPlaying(license.track.id);
                                  }
                                }}
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-purple-500/20 p-6">
              <h3 className="text-xl font-bold text-white mb-4">Your Favorites</h3>
              {favorites.length === 0 ? (
                <div className="text-center py-8">
                  <Star className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400">No favorites yet</p>
                  <Link
                    to="/catalog"
                    className="inline-block mt-4 text-purple-400 hover:text-purple-300"
                  >
                    Browse tracks to add favorites
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {sortedAndFilteredFavorites.slice(0, 5).map((track) => (
                    <div
                      key={track.id}
                      className="bg-white/5 backdrop-blur-sm rounded-lg p-3 border border-purple-500/20"
                    >
                      <div className="flex items-center space-x-3">
                        <img
                          src={track.image}
                          alt={track.title}
                          className="w-12 h-12 object-cover rounded-lg flex-shrink-0 cursor-pointer"
                          onClick={() => navigate(`/track/${track.id}`)}
                        />
                        <div className="flex-1 min-w-0">
                          <button
                            onClick={() => navigate(`/track/${track.id}`)}
                            className="text-sm font-semibold text-white hover:text-blue-400 transition-colors text-left block truncate"
                          >
                            {track.title}
                          </button>
                          <p className="text-xs text-gray-400 truncate">{track.artist}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-xs text-purple-400">{track.genres[0]}</span>
                            <span className="text-xs text-gray-400">{track.bpm} BPM</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {track.audioUrl && (
                            <AudioPlayer
                              src={track.audioUrl}
                              title={track.title}
                              isPlaying={currentlyPlayingFavorite === track.id}
                              onToggle={() => togglePlayFavorite(track.id)}
                              size="sm"
                            />
                          )}
                          <button
                            onClick={() => navigate(`/track/${track.id}`)}
                            className="px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded transition-colors"
                          >
                            View Track
                          </button>
                          <button
                            onClick={() => handleRemoveFavorite(track.id)}
                            disabled={removingFavorite === track.id}
                            className="p-1 text-gray-400 hover:text-red-400 transition-colors disabled:opacity-50"
                          >
                            {removingFavorite === track.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <X className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {favorites.length > 5 && (
                    <Link
                      to="/catalog?favorites=true"
                      className="block text-center text-purple-400 hover:text-purple-300 text-sm mt-4"
                    >
                      View all favorites ({favorites.length})
                    </Link>
                  )}
                </div>
              )}
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-purple-500/20 p-6">
              <h3 className="text-xl font-bold text-white mb-4">New Tracks</h3>
              {newTracks.length === 0 ? (
                <div className="text-center py-8">
                  <Music className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400">No new tracks available</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {newTracks.map((track) => (
                    <div
                      key={track.id}
                      className="bg-white/5 backdrop-blur-sm rounded-lg p-3 border border-purple-500/20"
                    >
                      <div className="flex items-center space-x-3">
                        <img
                          src={track.image}
                          alt={track.title}
                          className="w-12 h-12 object-cover rounded-lg flex-shrink-0 cursor-pointer"
                          onClick={() => navigate(`/track/${track.id}`)}
                        />
                        <div className="flex-1 min-w-0">
                          <button
                            onClick={() => navigate(`/track/${track.id}`)}
                            className="text-sm font-semibold text-white hover:text-blue-400 transition-colors text-left block truncate"
                          >
                            {track.title}
                          </button>
                          <p className="text-xs text-gray-400 truncate">{track.artist}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-xs text-purple-400">{track.genres[0]}</span>
                            <span className="text-xs text-gray-400">{track.bpm} BPM</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {track.audioUrl && (
                            <AudioPlayer
                              src={track.audioUrl}
                              title={track.title}
                              isPlaying={currentlyPlayingNew === track.id}
                              onToggle={() => togglePlayNew(track.id)}
                              size="sm"
                            />
                          )}
                          <button
                            onClick={() => navigate(`/track/${track.id}`)}
                            className="px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded transition-colors"
                          >
                            View Track
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showProfileDialog && (
        <ClientProfile
          onClose={() => setShowProfileDialog(false)}
          onUpdate={fetchDashboardData}
        />
      )}

      {selectedRequest && showEditDialog && (
        <EditRequestDialog
          request={selectedRequest}
          onClose={() => {
            setShowEditDialog(false);
            setSelectedRequest(null);
          }}
          onUpdate={handleUpdateRequest}
        />
      )}

      {selectedLicenseToDelete && (
        <DeleteLicenseDialog
          license={selectedLicenseToDelete}
          onClose={() => setSelectedLicenseToDelete(null)}
          onConfirm={handleDeleteLicense}
        />
      )}

      {showLicenseDialog && selectedTrackToLicense && (
        <LicenseDialog
          isOpen={showLicenseDialog}
          track={selectedTrackToLicense}
          membershipType={userStats.membershipType}
          remainingLicenses={userStats.remainingLicenses}
          onClose={() => {
            setShowLicenseDialog(false);
            setSelectedTrackToLicense(null);
          }}
        />
      )}

      {showProposalDialog && selectedTrackToLicense && (
        <SyncProposalDialog
          track={selectedTrackToLicense}
          onClose={() => {
            setShowProposalDialog(false);
            setSelectedTrackToLicense(null);
          }}
        />
      )}

      <SyncProposalAcceptDialog
        isOpen={showAcceptDialog}
        onClose={() => setShowAcceptDialog(false)}
        proposal={selectedProposal}
        onAccept={() => { setShowAcceptDialog(false); fetchSyncProposals(); }}
      />

      <ProposalConfirmDialog
        isOpen={showDeclineDialog}
        onClose={() => setShowDeclineDialog(false)}
        onConfirm={() => handleDeclineProposal(selectedProposal)}
        action="reject"
        proposal={selectedProposal}
      />

      {/* Negotiation Modal */}
      {showNegotiationModal && selectedProposal && (
        <ProposalNegotiationDialog
          isOpen={showNegotiationModal}
          onClose={() => setShowNegotiationModal(false)}
          proposal={selectedProposal}
          onNegotiationSent={() => {
            setShowNegotiationModal(false);
            setSelectedProposal(null);
            fetchSyncProposals();
          }}
        />
      )}
    </div>
  );
}
