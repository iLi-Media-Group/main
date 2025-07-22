import React, { useState, useEffect } from 'react';
import { DollarSign, BarChart3, Calendar, Music, Mic, Users, Plus, Search, Filter, Download, Eye, Edit, Trash2, Clock, FileMusic, Mic as MicIcon, Star, TrendingUp, AlertCircle, Loader2, UserCog, Check, FileText, ArrowUpDown, Tag, Layers, Hash, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Link, useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogOverlay, DialogPortal } from './ui/dialog';
import { createCheckoutSession } from '../lib/stripe';

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
import { ProposalNegotiationDialog } from './ProposalNegotiationDialog';
import { ProposalHistoryDialog } from './ProposalHistoryDialog';
import { useSignedUrl } from '../hooks/useSignedUrl';

// Track Image Component with Signed URL
const TrackImage = ({ imageUrl, title, className, onClick }: { 
  imageUrl: string; 
  title: string; 
  className: string; 
  onClick?: () => void;
}) => {
  // If it's already a public URL (like Unsplash), use it directly
  if (imageUrl && imageUrl.startsWith('https://')) {
    return (
      <img
        src={imageUrl}
        alt={title}
        className={className}
        onClick={onClick}
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.src = 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop';
        }}
      />
    );
  }

  // For file paths, use signed URL with hardcoded bucket name
  const { signedUrl, loading, error } = useSignedUrl('track-images', imageUrl);

  if (loading) {
    return (
      <div className={`${className} bg-white/5 flex items-center justify-center`}>
        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !signedUrl) {
    return (
      <img
        src="https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop"
        alt={title}
        className={className}
        onClick={onClick}
      />
    );
  }

  return (
    <img
      src={signedUrl}
      alt={title}
      className={className}
      onClick={onClick}
      onError={(e) => {
        const target = e.target as HTMLImageElement;
        target.src = 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop';
      }}
    />
  );
};

// Audio Player Component with Signed URL
const AudioPlayerWithSignedUrl = ({ 
  audioUrl, 
  title, 
  isPlaying, 
  onToggle, 
  size = "md" 
}: { 
  audioUrl: string; 
  title: string; 
  isPlaying: boolean; 
  onToggle: () => void; 
  size?: "sm" | "md" | "lg";
}) => {
  // If it's already a public URL, use it directly
  if (audioUrl && audioUrl.startsWith('https://')) {
    return (
      <AudioPlayer
        src={audioUrl}
        title={title}
        isPlaying={isPlaying}
        onToggle={onToggle}
        size={size}
      />
    );
  }

  // For file paths, use signed URL with hardcoded bucket name
  const { signedUrl, loading, error } = useSignedUrl('track-audio', audioUrl);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-16 bg-white/5 rounded-lg">
        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !signedUrl) {
    return (
      <div className="flex items-center justify-center h-16 bg-red-500/10 rounded-lg">
        <p className="text-red-400 text-sm">Audio unavailable</p>
      </div>
    );
  }

  return (
    <AudioPlayer
      src={signedUrl}
      title={title}
      isPlaying={isPlaying}
      onToggle={onToggle}
      size={size}
    />
  );
};

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
  final_amount?: number;
  negotiated_amount?: number;
  final_payment_terms?: string;
  negotiated_payment_terms?: string;
  expiration_date: string;
  is_urgent: boolean;
  status: 'pending' | 'accepted' | 'declined';
  client_status: 'pending' | 'accepted' | 'rejected';
  producer_status: 'pending' | 'accepted' | 'rejected';
  payment_status: 'pending' | 'paid' | 'cancelled';
  negotiation_status: 'pending' | 'negotiating' | 'client_acceptance_required' | 'accepted' | 'rejected';
  client_accepted_at?: string;
  created_at: string;
  updated_at: string;
  [key: string]: any;
}
interface SyncProposalHistoryMessage {
  id: string;
  sender_id: string;
  sender_name?: string;
  message: string;
  created_at: string;
  type?: 'status_change' | 'negotiation';
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

// Calculate payment due date based on payment terms and acceptance date
const calculatePaymentDueDate = (paymentTerms: string, acceptanceDate: string): Date => {
  const acceptance = new Date(acceptanceDate);
  
  switch (paymentTerms) {
    case 'immediate':
      return acceptance; // Same day
    case 'net30':
      return new Date(acceptance.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 days
    case 'net60':
      return new Date(acceptance.getTime() + (60 * 24 * 60 * 60 * 1000)); // 60 days
    case 'net90':
      return new Date(acceptance.getTime() + (90 * 24 * 60 * 60 * 1000)); // 90 days
    default:
      return acceptance; // Default to immediate
  }
};

// Get payment terms display text
const getPaymentTermsDisplay = (paymentTerms: string): string => {
  switch (paymentTerms) {
    case 'immediate':
      return 'Immediate';
    case 'net30':
      return 'Net 30';
    case 'net60':
      return 'Net 60';
    case 'net90':
      return 'Net 90';
    default:
      return 'Immediate';
  }
};

// Add a helper to determine if a proposal has a pending action
function hasPendingAction(proposal: SyncProposal, userId: string): boolean {
  // Show badge if proposal has a message from someone else that hasn't been responded to
  const hasNewMessage = !!(
    proposal.last_message_sender_id && 
    proposal.last_message_sender_id !== userId &&
    proposal.last_message_at
  );

  // Show badge if there's a counter offer that needs acceptance
  const hasCounterOffer = proposal.negotiation_status === 'client_acceptance_required';

  // Show badge if there's a pending negotiation that requires response
  const needsResponse = proposal.negotiation_status === 'negotiating' && hasNewMessage;

  return hasNewMessage && (hasCounterOffer || needsResponse);
}

// Add this function near the other handlers
const handleDownloadSupabase = async (bucket: string, path: string, filename: string) => {
  try {
    const decodedPath = decodeURIComponent(path);
    const { data, error } = await supabase.storage.from(bucket).createSignedUrl(decodedPath, 60);
    if (data?.signedUrl) {
      const link = document.createElement('a');
      link.href = data.signedUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      console.error('Download failed. Error:', error);
      alert('Download failed. Please check your license or contact support.');
    }
  } catch (err) {
    console.error('Download failed. Exception:', err);
    alert('Download failed. Please contact support.');
  }
};

const handleSyncProposalDownload = async (proposalId: string, trackId: string, filename: string, fileType: string, fileUrl: string, trackTitle?: string) => {
  try {
    let bucket = 'track-files';
    if (fileType === 'pdf') {
      bucket = 'split-sheets';
    } else if (fileType === 'trackouts' || fileType === 'stems') {
      bucket = 'trackouts';
    } else if (fileType === 'mp3') {
      bucket = 'track-audio';
    }
    let path = decodeURIComponent(fileUrl);
    const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 60);
    if (data?.signedUrl) {
      const link = document.createElement('a');
      link.href = data.signedUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      console.error('Download failed. Error:', error);
      alert('Download failed. Please check your license or contact support.');
    }
  } catch (error) {
    console.error('Download failed. Exception:', error);
    alert('Download failed. Please contact support.');
  }
};

// Add this helper to get the working Supabase signed URL if the generated one fails
const getSupabaseDashboardUrl = (bucket: string, path: string) => {
  // This is a fallback: it will only work if the user is authenticated and the file is not public
  return `https://yciqkebqlajqbpwlujma.supabase.co/storage/v1/object/sign/${bucket}/${encodeURIComponent(path)}`;
};

export function ClientDashboard() {
  const { user, membershipPlan, refreshMembership } = useAuth();
  const navigate = useNavigate();
  const [licenses, setLicenses] = useState<License[]>([]);
  const [favorites, setFavorites] = useState<Track[]>([]);
  const [newTracks, setNewTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  // Debug logs to diagnose blank dashboard
  console.log('DEBUG ClientDashboard:', {
    user,
    membershipPlan,
    loading,
  });
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
  const [syncProposalsTab, setSyncProposalsTab] = useState<'pending' | 'payment-pending' | 'accepted' | 'paid' | 'declined'>('pending');
  const [showDeclineDialog, setShowDeclineDialog] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyProposal, setHistoryProposal] = useState<SyncProposal | null>(null);
  const [showNegotiationModal, setShowNegotiationModal] = useState(false);
  const [syncProposalSuccess, setSyncProposalSuccess] = useState(false);
  const [syncProposalSortField, setSyncProposalSortField] = useState<'date' | 'title' | 'amount' | 'status'>('date');
  const [syncProposalSortOrder, setSyncProposalSortOrder] = useState<'asc' | 'desc'>('desc');
  // Add state for pending downgrade
  const [pendingDowngrade, setPendingDowngrade] = useState(false);
  const [downgradeEffectiveDate, setDowngradeEffectiveDate] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      // Refresh membership info first to ensure we have the latest data
      refreshMembership().then(() => {
        fetchDashboardData();
        fetchSyncProposals();
      });
    }
  }, [user, membershipPlan]);

  // Add a manual refresh function for testing
  const handleManualRefresh = async () => {
    if (user) {
      setLoading(true);
      try {
        await refreshMembership();
        await fetchDashboardData();
        await fetchSyncProposals();
      } catch (error) {
        console.error('Error refreshing dashboard:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const fetchDashboardData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError('');

      // Fetch profile with downgrade info
      const { data: profileData } = await supabase
        .from('profiles')
        .select('first_name, email, membership_plan, subscription_cancel_at_period_end, subscription_current_period_end')
        .eq('id', user.id)
        .single();

      if (profileData) {
        setProfile(profileData);
        setPendingDowngrade(!!profileData.subscription_cancel_at_period_end);
        setDowngradeEffectiveDate(profileData.subscription_current_period_end || null);
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
            mp3_url,
            trackouts_url,
            split_sheet_url,
            stems_url,
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
        .order('created_at', { ascending: false });

      console.log('Sales query result:', licensesData);
      console.log('User ID:', user.id);

      if (licensesData) {
        const formattedLicenses = licensesData.map(license => ({
          ...license,
          expiry_date: license.expiry_date || calculateExpiryDate(license.created_at, profileData?.membership_plan || ''),
          track: {
            ...(!Array.isArray(license.track) ? (license.track as any) : {}),
            genres: !Array.isArray(license.track) && typeof (license.track as any)?.genres === 'string' ? ((license.track as any).genres as string).split(',').map((g: string) => g.trim()) : (!Array.isArray(license.track) && Array.isArray((license.track as any)?.genres) ? (license.track as any).genres : []),
            audioUrl: !Array.isArray(license.track) ? (license.track as any)?.audio_url || (license.track as any)?.mp3_url || '' : '',
            image: !Array.isArray(license.track) ? (license.track as any)?.image_url || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop' : 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop',
            producerId: !Array.isArray(license.track) ? (license.track as any)?.track_producer_id : '',
            duration: !Array.isArray(license.track) ? (license.track as any)?.duration || '3:30' : '3:30',
            hasStingEnding: !Array.isArray(license.track) ? (license.track as any)?.has_sting_ending || false : false,
            isOneStop: !Array.isArray(license.track) ? (license.track as any)?.is_one_stop || false : false,
            mp3Url: !Array.isArray(license.track) ? (license.track as any)?.mp3_url || '' : '',
            trackoutsUrl: !Array.isArray(license.track) ? (license.track as any)?.trackouts_url || '' : '',
            splitSheetUrl: !Array.isArray(license.track) ? (license.track as any)?.split_sheet_url || '' : '',
            hasVocals: !Array.isArray(license.track) ? (license.track as any)?.has_vocals : undefined,
            vocalsUsageType: !Array.isArray(license.track) ? (license.track as any)?.vocals_usage_type : undefined,
            subGenres: !Array.isArray(license.track) && (license.track as any)?.sub_genres ? (typeof (license.track as any).sub_genres === 'string' ? (license.track as any).sub_genres.split(',').map((g: string) => g.trim()) : (Array.isArray((license.track as any).sub_genres) ? (license.track as any).sub_genres : [])) : [],
            moods: !Array.isArray(license.track) && (license.track as any)?.moods ? (typeof (license.track as any).moods === 'string' ? (license.track as any).moods.split(',').map((m: string) => m.trim()) : (Array.isArray((license.track as any).moods) ? (license.track as any).moods : [])) : [],
            artist: !Array.isArray(license.track) ? (license.track as any)?.artist || '' : '',
            producer: !Array.isArray(license.track) && (license.track as any)?.producer ? {
              id: (license.track as any).producer.id,
              firstName: (license.track as any).producer.first_name || '',
              lastName: (license.track as any).producer.last_name || '',
              email: (license.track as any).producer.email,
            } : undefined,
            fileFormats: { stereoMp3: { format: [], url: '' }, stems: { format: [], url: '' }, stemsWithVocals: { format: [], url: '' } },
            pricing: { stereoMp3: 0, stems: 0, stemsWithVocals: 0 },
            leaseAgreementUrl: '',
            stemsUrl: !Array.isArray(license.track) ? ((license.track as any)?.stems_url || '') : '',
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
        const formattedFavorites = favoritesData.map(f => {
          const track = Array.isArray(f.tracks) ? f.tracks[0] : f.tracks;
          let producer: any = undefined;
          if (track && track.producer) {
            if (Array.isArray(track.producer)) {
              producer = track.producer.length > 0 ? track.producer[0] : undefined;
            } else if (typeof track.producer === 'object') {
              producer = track.producer;
            }
          }
          return {
            id: track.id,
            title: track.title,
            artist: producer && typeof producer.first_name === 'string' && typeof producer.last_name === 'string' ? `${producer.first_name} ${producer.last_name}`.trim() : 'Unknown Artist',
            genres: typeof track.genres === 'string' ? track.genres.split(',').map((g: string) => g.trim()) : (Array.isArray(track.genres) ? track.genres : []),
            moods: track.moods ? (typeof track.moods === 'string' ? track.moods.split(',').map((m: string) => m.trim()) : (Array.isArray(track.moods) ? track.moods : [])) : [],
            duration: track.duration || '3:30',
            bpm: track.bpm,
            audioUrl: track.audio_url,
            image: track.image_url || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop',
            hasStingEnding: track.has_sting_ending,
            isOneStop: track.is_one_stop,
            mp3Url: track.mp3_url,
            trackoutsUrl: track.trackouts_url,
            hasVocals: track.has_vocals,
            vocalsUsageType: track.vocals_usage_type,
            subGenres: track.sub_genres ? (typeof track.sub_genres === 'string' ? track.sub_genres.split(',').map((g: string) => g.trim()) : (Array.isArray(track.sub_genres) ? track.sub_genres : [])) : [],
            producerId: track.track_producer_id,
            producer: producer && typeof producer.id !== 'undefined' ? {
              id: producer.id,
              firstName: producer.first_name || '',
              lastName: producer.last_name || '',
              email: producer.email
            } : undefined,
            fileFormats: { stereoMp3: { format: [], url: '' }, stems: { format: [], url: '' }, stemsWithVocals: { format: [], url: '' } },
            pricing: { stereoMp3: 0, stems: 0, stemsWithVocals: 0 },
            leaseAgreementUrl: '',
            stemsUrl: (track && typeof (track as any).stems_url === 'string') ? (track as any).stems_url : '',
          };
        });
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
        const formattedNewTracks = newTracksData.map(track => {
          let producer: any = undefined;
          if (track && track.producer) {
            if (Array.isArray(track.producer)) {
              producer = track.producer.length > 0 ? track.producer[0] : undefined;
            } else if (typeof track.producer === 'object') {
              producer = track.producer;
            }
          }
          return {
            id: track.id,
            title: track.title,
            artist: producer && typeof producer.first_name === 'string' && producer.first_name
              ? `${producer.first_name} ${producer.last_name || ''}`.trim()
              : track.artist || 'Unknown Artist',
            genres: typeof track.genres === 'string' ? track.genres.split(',').map((g: string) => g.trim()) : (Array.isArray(track.genres) ? track.genres : []),
            moods: track.moods ? (typeof track.moods === 'string' ? track.moods.split(',').map((m: string) => m.trim()) : (Array.isArray(track.moods) ? track.moods : [])) : [],
            bpm: track.bpm,
            audioUrl: track.audio_url,
            image: track.image_url || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop',
            hasVocals: track.has_vocals,
            vocalsUsageType: track.vocals_usage_type,
            subGenres: track.sub_genres ? (typeof track.sub_genres === 'string' ? track.sub_genres.split(',').map((g: string) => g.trim()) : (Array.isArray(track.sub_genres) ? track.sub_genres : [])) : [],
            duration: track.duration || '3:30',
            hasStingEnding: track.has_sting_ending || false,
            isOneStop: track.is_one_stop || false,
            mp3Url: track.mp3_url || '',
            trackoutsUrl: track.trackouts_url || '',
            splitSheetUrl: track.split_sheet_url || '',
            producerId: track.track_producer_id,
            producer: producer && typeof producer.id !== 'undefined' ? {
              id: producer.id,
              firstName: producer.first_name || '',
              lastName: producer.last_name || '',
              email: producer.email
            } : undefined,
            fileFormats: { stereoMp3: { format: [], url: '' }, stems: { format: [], url: '' }, stemsWithVocals: { format: [], url: '' } },
            pricing: { stereoMp3: 0, stems: 0, stemsWithVocals: 0 },
            leaseAgreementUrl: '',
            stemsUrl: (track && typeof (track as any).stems_url === 'string') ? (track as any).stems_url : '',
          };
        });
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
    try {
      const { data, error } = await supabase
        .from('sync_proposals')
        .select(`
          id,
          track_id,
          client_id,
          project_type,
          duration,
          is_exclusive,
          sync_fee,
          payment_terms,
          final_amount,
          negotiated_amount,
          final_payment_terms,
          negotiated_payment_terms,
          expiration_date,
          is_urgent,
          status,
          client_status,
          producer_status,
          payment_status,
          negotiation_status,
          client_accepted_at,
          license_url,
          created_at,
          updated_at,
          last_message_sender_id,
          last_message_at,
          client_terms_accepted,
          producer_terms_accepted,
          client:profiles!sync_proposals_client_id_fkey(
            id,
            first_name,
            last_name,
            email
          ),
          track:tracks(
            id,
            title,
            artist,
            genres,
            audio_url,
            image_url,
            mp3_url,
            trackouts_url,
            split_sheet_url,
            track_producer_id,
            producer:profiles!tracks_track_producer_id_fkey(
              id,
              first_name,
              last_name,
              email
            )
          )
        `)
        .eq('client_id', user.id)
        .order('created_at', { ascending: false });
      if (error) {
        console.error('Error fetching sync proposals:', error, error.message, error.details, error.hint);
        return;
      }
      if (data) {
        setSyncProposals(data);
      }
    } catch (err) {
      console.error('Error in fetchSyncProposals:', err);
    }
  };

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleSyncProposalSort = (field: typeof syncProposalSortField) => {
    if (syncProposalSortField === field) {
      setSyncProposalSortOrder(syncProposalSortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSyncProposalSortField(field);
      setSyncProposalSortOrder('desc');
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
    if (track.isSyncOnly || (track.hasVocals && track.vocalsUsageType === 'sync_only')) {
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

  const handleViewSyncProposalLicense = (proposalId: string) => {
    navigate(`/sync-proposal-license-agreement/${proposalId}`);
  };

  const handleDeclineProposal = async (proposal: SyncProposal) => {
    try {
      // Update proposal status to declined, disable negotiation, notify other party
      const { error } = await supabase
        .from('sync_proposals')
        .update({ 
          client_status: 'rejected', 
          status: 'declined', 
          updated_at: new Date().toISOString() 
        })
        .eq('id', proposal.id);

      if (error) throw error;

      // Create history entry
      const { error: historyError } = await supabase
        .from('proposal_history')
        .insert({
          proposal_id: proposal.id,
          previous_status: proposal.client_status || 'pending',
          new_status: 'rejected',
          changed_by: user?.id
        });

      if (historyError) {
        console.error('Error creating history entry:', historyError);
        // Don't throw, just log the error
      }

      // Refresh the proposals data
      await fetchSyncProposals();
    } catch (err) {
      console.error('Error declining proposal:', err);
      alert('Failed to decline proposal. Please try again.');
    }
  };

  const handleShowHistory = async (proposal: SyncProposal) => {
    setHistoryProposal(proposal);
    setShowHistoryModal(true);
  };

  const handlePaymentPendingProposal = async (proposal: SyncProposal) => {
    try {
      // Ensure negotiation is finalized before payment
      if (
        proposal.client_status === 'accepted' &&
        proposal.producer_status === 'accepted' &&
        (proposal.status !== 'accepted' || proposal.negotiation_status !== 'accepted')
      ) {
        const { error: rpcError } = await supabase.rpc('handle_negotiation_acceptance', {
          proposal_id: proposal.id,
          is_sync_proposal: true
        });
        if (rpcError) throw rpcError;
        // Optionally, refetch the proposal here if needed
      }
      const paymentTerms = proposal.final_payment_terms || proposal.negotiated_payment_terms || proposal.payment_terms || 'immediate';
      const amount = proposal.final_amount || proposal.sync_fee;
      // For all payment terms, redirect to Stripe checkout to pay the invoice
      const checkoutUrl = await createCheckoutSession(
        'price_custom',
        'payment',
        undefined,
        {
          proposal_id: proposal.id,
          amount: Math.round(amount * 100),
          description: `Sync license for "${proposal.track?.title}"`,
          payment_terms: paymentTerms
        },
        `${window.location.origin}/sync-proposal/success?session_id={CHECKOUT_SESSION_ID}&proposal_id=${proposal.id}`
      );
      window.location.href = checkoutUrl;
    } catch (err) {
      console.error('Error initiating payment:', err);
      alert('Failed to initiate payment. Please try again.');
    }
  };

  // New secure download handler using Edge Function streaming
  const handleDownload = async (trackId: string, filename: string, fileType: string = "mp3", boomBoxUrl?: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const jwt = session?.access_token;
      if (!jwt) {
        alert("You must be logged in to download.");
        return;
      }
      let shareId = trackId;
      if (boomBoxUrl && boomBoxUrl.includes('app.boombox.io/app/shares/')) {
        shareId = boomBoxUrl.split('app.boombox.io/app/shares/')[1];
      }
      const projectRef = 'yciqkebqlajqbpwlujma';
      const url = `https://${projectRef}.functions.supabase.co/secure-download?trackId=${encodeURIComponent(trackId)}&shareId=${encodeURIComponent(shareId)}&filename=${encodeURIComponent(filename)}&fileType=${encodeURIComponent(fileType)}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${jwt}` }
      });
      if (!res.ok) {
        alert("Download failed. Please check your license or contact support.");
        return;
      }
      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = filename;
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      alert("Download failed. Please contact support.");
    }
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
          return (Array.isArray(a.genres) && a.genres[0] ? a.genres[0] : '').localeCompare(Array.isArray(b.genres) && b.genres[0] ? b.genres[0] : '') * modifier;
        case 'bpm':
          return (a.bpm - b.bpm) * modifier;
        default:
          return 0;
      }
    });

  // Tab filter logic - ensure no overlap between tabs
  const pendingProposals = syncProposals.filter(p => 
    // Only show proposals that are NOT accepted by both parties AND NOT rejected by either party
    !(p.client_status === 'accepted' && p.producer_status === 'accepted') &&
    !(p.client_status === 'rejected' || p.producer_status === 'rejected') &&
    (p.status === 'pending' || 
     p.status === 'pending_producer' ||
     p.status === 'pending_client' ||
     p.status === 'accepted' && (p.client_status !== 'accepted' || p.producer_status !== 'accepted') ||
     p.negotiation_status === 'pending' ||
     p.negotiation_status === 'negotiating' ||
     p.negotiation_status === 'client_acceptance_required' ||
     p.negotiation_status === 'client_accepted' ||
     p.negotiation_status === 'producer_accepted')
  );
  
  // Payment pending proposals - accepted by both parties but payment not complete
  const paymentPendingProposals = syncProposals.filter(p => 
    (p.client_status === 'accepted' && p.producer_status === 'accepted') &&
    (p.payment_status === 'pending' || p.payment_status === null || p.payment_status === undefined)
  );
  
  // Accepted proposals (accepted by both parties but not yet paid)
  const acceptedProposals = syncProposals.filter(p => 
    p.client_status === 'accepted' && 
    p.producer_status === 'accepted' && 
    (p.payment_status === 'pending' || p.payment_status === null || p.payment_status === undefined)
  );
  
  // Paid proposals (accepted by both parties and payment completed)
  const paidProposals = syncProposals.filter(p => 
    p.client_status === 'accepted' && 
    p.producer_status === 'accepted' && 
    p.payment_status === 'paid'
  );
  
  const declinedProposals = syncProposals.filter(p => p.client_status === 'rejected' || p.producer_status === 'rejected');

  // Sort function for sync proposals
  const sortSyncProposals = (proposals: any[]) => {
    return proposals.sort((a, b) => {
      let aValue: any;
      let bValue: any;
      
      switch (syncProposalSortField) {
        case 'date':
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
        case 'title':
          aValue = a.track?.title || '';
          bValue = b.track?.title || '';
          break;
        case 'amount':
          aValue = a.final_amount || a.sync_fee || 0;
          bValue = b.final_amount || b.sync_fee || 0;
          break;
        case 'status':
          aValue = a.status || '';
          bValue = b.status || '';
          break;
        default:
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
      }
      
      if (syncProposalSortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  };

  // Sorted proposal arrays
  const sortedPendingProposals = sortSyncProposals([...pendingProposals]);
  const sortedPaymentPendingProposals = sortSyncProposals([...paymentPendingProposals]);
  const sortedAcceptedProposals = sortSyncProposals([...acceptedProposals]);
  const sortedPaidProposals = sortSyncProposals([...paidProposals]);
  const sortedDeclinedProposals = sortSyncProposals([...declinedProposals]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  // Debug: Log stemsUrl for each licensed track before rendering
  console.log('DEBUG LICENSE TRACKS:', sortedAndFilteredLicenses.map(l => ({
    id: l.track.id,
    title: l.track.title,
    stemsUrl: l.track.stemsUrl
  })));

  useEffect(() => {
    if (!user) return;

    // Subscribe to changes on the current user's profile
    const channel = supabase
      .channel('profile-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          // Refetch dashboard data on any profile change
          fetchDashboardData();
        }
      )
      .subscribe();

    // Cleanup on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

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
            <button
              onClick={handleManualRefresh}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors flex items-center space-x-2"
            >
              <Loader2 className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
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
              {pendingDowngrade && downgradeEffectiveDate && (
                <div className="mt-2 p-3 bg-yellow-900/80 text-yellow-200 rounded-lg flex items-center">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  <span>
                    Your account will be downgraded to <b>Single Track</b> on{' '}
                    <b>{new Date(new Date(downgradeEffectiveDate).getTime() + 24 * 60 * 60 * 1000).toLocaleDateString()}</b>. You will retain your current plan until then.
                  </span>
                </div>
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


        {/* Custom Sync Requests Section */}
        <div className="mb-8 bg-white/5 backdrop-blur-sm rounded-xl border border-purple-500/20 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Your Custom Sync Requests</h2>
            <div className="flex gap-2">
              <Link
                to="/custom-sync-request-subs"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center"
              >
                See Submissions
              </Link>
              <Link
                to="/custom-sync-request"
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Request
              </Link>
            </div>
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
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleSyncProposalSort('date')}
                className={`flex items-center space-x-1 px-2 py-1 rounded text-xs transition-colors ${
                  syncProposalSortField === 'date' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white/10 text-gray-300 hover:text-white'
                }`}
              >
                <Calendar className="w-3 h-3" />
                <span>Date</span>
                {syncProposalSortField === 'date' && (
                  <ArrowUpDown className="w-3 h-3" />
                )}
              </button>
              <button
                onClick={() => handleSyncProposalSort('title')}
                className={`flex items-center space-x-1 px-2 py-1 rounded text-xs transition-colors ${
                  syncProposalSortField === 'title' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white/10 text-gray-300 hover:text-white'
                }`}
              >
                <span>Title</span>
                {syncProposalSortField === 'title' && (
                  <ArrowUpDown className="w-3 h-3" />
                )}
              </button>
              <button
                onClick={() => handleSyncProposalSort('amount')}
                className={`flex items-center space-x-1 px-2 py-1 rounded text-xs transition-colors ${
                  syncProposalSortField === 'amount' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white/10 text-gray-300 hover:text-white'
                }`}
              >
                <DollarSign className="w-3 h-3" />
                <span>Amount</span>
                {syncProposalSortField === 'amount' && (
                  <ArrowUpDown className="w-3 h-3" />
                )}
              </button>
              <button
                onClick={() => handleSyncProposalSort('status')}
                className={`flex items-center space-x-1 px-2 py-1 rounded text-xs transition-colors ${
                  syncProposalSortField === 'status' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white/10 text-gray-300 hover:text-white'
                }`}
              >
                <span>Status</span>
                {syncProposalSortField === 'status' && (
                  <ArrowUpDown className="w-3 h-3" />
                )}
              </button>
            </div>
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
              onClick={() => setSyncProposalsTab('payment-pending')}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                syncProposalsTab === 'payment-pending'
                  ? 'bg-yellow-600 text-white'
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
            >
              Payment Pending ({paymentPendingProposals.length})
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
              onClick={() => setSyncProposalsTab('paid')}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                syncProposalsTab === 'paid'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
            >
              Paid ({paidProposals.length})
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
          <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
            {syncProposalsTab === 'pending' && (
              sortedPendingProposals.length === 0 ? (
                <div className="text-center py-6 bg-white/5 backdrop-blur-sm rounded-lg border border-blue-500/20">
                  <p className="text-gray-400">No pending or active proposals</p>
                </div>
              ) : (
                sortedPendingProposals.map((proposal) => (
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
                        <p className="text-lg font-semibold text-green-400">${(proposal.final_amount || proposal.sync_fee).toFixed(2)}</p>
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

            {syncProposalsTab === 'payment-pending' && (
              sortedPaymentPendingProposals.length === 0 ? (
                <div className="text-center py-6 bg-white/5 backdrop-blur-sm rounded-lg border border-blue-500/20">
                  <p className="text-gray-400">No payment pending proposals</p>
                </div>
              ) : (
                sortedPaymentPendingProposals.map((proposal) => (
                  <div
                    key={proposal.id}
                    className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-yellow-500/20 relative"
                  >
                    {/* Payment Pending Badge */}
                    <div className="absolute bottom-2 right-2">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                        Payment Pending
                      </span>
                    </div>
                    
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="text-white font-medium">{proposal.track?.title || 'Untitled Track'}</h4>
                        <p className="text-sm text-gray-400">
                          Producer: {proposal.track?.producer?.first_name} {proposal.track?.producer?.last_name}
                        </p>
                        <p className="text-xs text-yellow-400">
                          ✓ Accepted by both parties - Payment required
                        </p>
                        {(() => {
                          const paymentTerms = proposal.final_payment_terms || proposal.negotiated_payment_terms || proposal.payment_terms || 'immediate';
                          const acceptanceDate = proposal.client_accepted_at || proposal.updated_at || proposal.created_at;
                          const dueDate = calculatePaymentDueDate(paymentTerms, acceptanceDate);
                          const isOverdue = dueDate < new Date();
                          const daysUntilDue = Math.ceil((dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                          
                          return (
                            <div className="mt-3 space-y-2">
                              <p className="text-sm text-gray-400">
                                Payment Terms: <span className="text-blue-400 font-medium">{getPaymentTermsDisplay(paymentTerms)}</span>
                              </p>
                              <div className="bg-white/10 rounded-lg p-3 border border-yellow-500/30">
                                <p className={`text-lg font-bold ${isOverdue ? 'text-red-400' : daysUntilDue <= 7 ? 'text-orange-400' : 'text-green-400'}`}>
                                  {isOverdue ? '⚠️ OVERDUE' : daysUntilDue === 0 ? '🕐 DUE TODAY' : daysUntilDue === 1 ? '🕐 DUE TOMORROW' : `📅 DUE IN ${daysUntilDue} DAYS`}
                                </p>
                                <p className="text-base font-medium text-white mt-1">
                                  Due Date: {dueDate.toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-yellow-400">${(proposal.final_amount || proposal.sync_fee).toFixed(2)}</p>
                        <p className="text-xs text-gray-400">
                          Accepted: {new Date(proposal.updated_at || proposal.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                                        <div className="flex flex-wrap gap-2 mt-4">
                      <button
                        onClick={() => handlePaymentPendingProposal(proposal)}
                        className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors flex items-center text-sm font-medium"
                      >
                        <DollarSign className="w-4 h-4 mr-2" />
                        Complete Payment
                      </button>
                      
                      {proposal.payment_status === 'paid' && (
                        <button
                          onClick={() => handleViewSyncProposalLicense(proposal.id)}
                          className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm flex items-center"
                          title="Generate License Agreement PDF"
                        >
                          <FileText className="w-3 h-3 mr-1" />
                          View Agreement
                        </button>
                      )}
                      {proposal.payment_status === 'paid' && (proposal.track.mp3_url || proposal.track.trackouts_url || proposal.track.split_sheet_url) && (
                        <div className="flex items-center space-x-1" key={`sync-download-${proposal.id}`}>
                          <div className="text-sm font-medium text-gray-300">Download Files:</div>
                          {proposal.track.mp3_url && (
                            <button
                              onClick={() => handleDownload(proposal.track.id, `${proposal.track.title}_MP3.mp3`, 'mp3', proposal.track.mp3_url)}
                              className="flex items-center px-2 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded transition-colors"
                              title="Download MP3"
                            >
                              <Download className="w-3 h-3 mr-1" />
                              MP3
                            </button>
                          )}
                          {proposal.track.trackouts_url && (
                            <button
                              onClick={() => handleSyncProposalDownload(proposal.id, proposal.track.id, `${proposal.track.title}_Trackouts.zip`, 'trackouts', proposal.track.trackouts_url)}
                              className="flex items-center px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                              title="Download Trackouts"
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Download Trackouts
                            </button>
                          )}
                          {proposal.track.stemsUrl && (
                            <button
                              onClick={() => handleDownloadSupabase('stems', proposal.track.stemsUrl, `${proposal.track.title}_Stems.zip`)}
                              className="flex items-center px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition-colors"
                              title="Download Stems"
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Download Stems
                            </button>
                          )}
                          {proposal.track.split_sheet_url && (
                            <button
                              onClick={() => handleDownloadSupabase('split-sheets', proposal.track.split_sheet_url, `${proposal.track.title}_Splitsheets.zip`)}
                              className="flex items-center px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm rounded-lg transition-colors"
                              title="Download Split Sheet"
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Download Split Sheet
                            </button>
                          )}
                        </div>
                      )}
 
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

            {syncProposalsTab === 'accepted' && (
              sortedAcceptedProposals.length === 0 ? (
                <div className="text-center py-6 bg-white/5 backdrop-blur-sm rounded-lg border border-blue-500/20">
                  <p className="text-gray-400">No accepted proposals</p>
                </div>
              ) : (
                sortedAcceptedProposals.map((proposal) => (
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
                        <p className="text-lg font-semibold text-green-400">${(proposal.final_amount || proposal.sync_fee).toFixed(2)}</p>
                        <p className="text-xs text-gray-400">
                          Accepted: {new Date(proposal.updated_at || proposal.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mt-4">
                      {proposal.payment_status === 'paid' && (
                        <button
                          onClick={() => handleViewSyncProposalLicense(proposal.id)}
                          className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm flex items-center"
                          title="Generate License Agreement PDF"
                        >
                          <FileText className="w-3 h-3 mr-1" />
                          View Agreement
                        </button>
                      )}
                      
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

            {syncProposalsTab === 'paid' && (
              sortedPaidProposals.length === 0 ? (
                <div className="text-center py-6 bg-white/5 backdrop-blur-sm rounded-lg border border-blue-500/20">
                  <p className="text-gray-400">No paid proposals</p>
                </div>
              ) : (
                sortedPaidProposals.map((proposal) => (
                  <div
                    key={proposal.id}
                    className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-purple-500/20"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="text-white font-medium">{proposal.track?.title || 'Untitled Track'}</h4>
                        <p className="text-sm text-gray-400">
                          Producer: {proposal.track?.producer?.first_name} {proposal.track?.producer?.last_name}
                        </p>
                        <p className="text-xs text-purple-400">
                          ✓ Paid - Sync License
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-purple-400">${(proposal.final_amount || proposal.sync_fee).toFixed(2)}</p>
                        <p className="text-xs text-gray-400">
                          Paid: {new Date(proposal.updated_at || proposal.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mt-4">
                      {proposal.payment_status === 'paid' && (
                        <button
                          onClick={() => handleViewSyncProposalLicense(proposal.id)}
                          className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm flex items-center"
                          title="Generate License Agreement PDF"
                        >
                          <FileText className="w-3 h-3 mr-1" />
                          View Agreement
                        </button>
                      )}
                      
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
              sortedDeclinedProposals.length === 0 ? (
                <div className="text-center py-6 bg-white/5 backdrop-blur-sm rounded-lg border border-blue-500/20">
                  <p className="text-gray-400">No declined proposals</p>
                </div>
              ) : (
                sortedDeclinedProposals.map((proposal) => (
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

            {(() => {
              // Combine regular licenses and paid sync proposals
              const allLicensedTracks = [
                ...sortedAndFilteredLicenses.map(license => ({
                  type: 'license',
                  data: license,
                  track: license.track,
                  id: license.id
                })),
                ...paidProposals.map(proposal => ({
                  type: 'sync_proposal',
                  data: proposal,
                  // Normalize track object to always include all required fields for Track type
                  track: {
                    ...(!Array.isArray(proposal.track) ? (proposal.track as any) : {}),
                    id: !Array.isArray(proposal.track) ? (proposal.track as any)?.id : '',
                    title: !Array.isArray(proposal.track) ? (proposal.track as any)?.title || '' : '',
                    artist: !Array.isArray(proposal.track) && (proposal.track as any)?.producer?.first_name && (proposal.track as any)?.producer?.last_name
                      ? `${(proposal.track as any).producer.first_name} ${(proposal.track as any).producer.last_name}`.trim()
                      : !Array.isArray(proposal.track) ? (proposal.track as any)?.artist || 'Unknown Artist' : 'Unknown Artist',
                    genres: !Array.isArray(proposal.track) && typeof (proposal.track as any)?.genres === 'string' ? ((proposal.track as any).genres as string).split(',').map((g: string) => g.trim()) : (!Array.isArray(proposal.track) && Array.isArray((proposal.track as any)?.genres) ? (proposal.track as any).genres : []),
                    subGenres: !Array.isArray(proposal.track) && (proposal.track as any)?.sub_genres ? (typeof (proposal.track as any).sub_genres === 'string' ? (proposal.track as any).sub_genres.split(',').map((g: string) => g.trim()) : (Array.isArray((proposal.track as any).sub_genres) ? (proposal.track as any).sub_genres : [])) : [],
                    moods: !Array.isArray(proposal.track) && (proposal.track as any)?.moods ? (typeof (proposal.track as any).moods === 'string' ? (proposal.track as any).moods.split(',').map((m: string) => m.trim()) : (Array.isArray((proposal.track as any).moods) ? (proposal.track as any).moods : [])) : [],
                    duration: !Array.isArray(proposal.track) ? (proposal.track as any)?.duration || '3:30' : '3:30',
                    bpm: !Array.isArray(proposal.track) ? (proposal.track as any)?.bpm || 0 : 0,
                    hasStingEnding: !Array.isArray(proposal.track) ? (proposal.track as any)?.has_sting_ending || false : false,
                    isOneStop: !Array.isArray(proposal.track) ? (proposal.track as any)?.is_one_stop || false : false,
                    audioUrl: !Array.isArray(proposal.track) ? (proposal.track as any)?.audio_url || (proposal.track as any)?.mp3_url || '' : '',
                    image: !Array.isArray(proposal.track) ? (proposal.track as any)?.image_url || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop' : 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop',
                    mp3Url: !Array.isArray(proposal.track) ? (proposal.track as any)?.mp3_url || '' : '',
                    trackoutsUrl: !Array.isArray(proposal.track) ? (proposal.track as any)?.trackouts_url || '' : '',
                    splitSheetUrl: !Array.isArray(proposal.track) ? (proposal.track as any)?.split_sheet_url || '' : '',
                    hasVocals: !Array.isArray(proposal.track) ? (proposal.track as any)?.has_vocals : undefined,
                    vocalsUsageType: !Array.isArray(proposal.track) ? (proposal.track as any)?.vocals_usage_type : undefined,
                    isSyncOnly: !Array.isArray(proposal.track) ? (proposal.track as any)?.is_sync_only : undefined,
                    producerId: !Array.isArray(proposal.track) ? (proposal.track as any)?.track_producer_id || '' : '',
                    producer: !Array.isArray(proposal.track) && (proposal.track as any)?.producer ? {
                      id: (proposal.track as any).producer.id,
                      firstName: (proposal.track as any).producer.first_name || '',
                      lastName: (proposal.track as any).producer.last_name || '',
                      email: (proposal.track as any).producer.email,
                    } : undefined,
                    fileFormats: { stereoMp3: { format: [], url: '' }, stems: { format: [], url: '' }, stemsWithVocals: { format: [], url: '' } },
                    pricing: { stereoMp3: 0, stems: 0, stemsWithVocals: 0 },
                    leaseAgreementUrl: '',
                    stemsUrl: !Array.isArray(proposal.track) ? (proposal.track as any)?.stems_url || '' : '',
                  },
                  id: proposal.id
                }))
              ];

              if (allLicensedTracks.length === 0) {
                return (
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
                );
              }

              return allLicensedTracks.map((item) => {
                if (item.type === 'license') {
                  const license = item.data;
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
                      <div className="flex flex-col h-full">
                        <div className="flex items-start space-x-4 flex-1">
                          <TrackImage
                            imageUrl={license.track.image}
                            title={license.track.title}
                            className="w-16 h-16 object-cover rounded-lg flex-shrink-0 cursor-pointer"
                            onClick={() => navigate(`/track/${license.track.id}`)}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col">
                              <button
                                onClick={() => navigate(`/track/${license.track.id}`)}
                                className="text-lg font-semibold text-white hover:text-blue-400 transition-colors text-left mb-2"
                              >
                                {license.track.title}
                              </button>
                              <div className="flex items-center space-x-4 text-sm text-gray-400 mb-2">
                                <span className="flex items-center">
                                  <Tag className="w-4 h-4 mr-1" />
                                  {Array.isArray(license.track.genres) ? license.track.genres.join(', ') : license.track.genres || 'Unknown'}
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
                              <div className="flex items-center justify-between mb-2">
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
                                  <AudioPlayerWithSignedUrl
                                    audioUrl={license.track.audioUrl}
                                    title={license.track.title}
                                    isPlaying={currentlyPlaying === `license-${license.id}`}
                                    onToggle={() => {
                                      if (currentlyPlaying === `license-${license.id}`) {
                                        setCurrentlyPlaying(null);
                                      } else {
                                        setCurrentlyPlaying(`license-${license.id}`);
                                      }
                                    }}
                                  />
                                )}
                                {!license.track.audioUrl && (
                                  <div className="text-xs text-gray-400 italic">
                                    No audio preview available
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-600/30">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleViewLicenseAgreement(license.id)}
                              className="flex items-center px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                            >
                              <FileText className="w-4 h-4 mr-2" />
                              View Agreement
                            </button>
                            {license.track.mp3Url && (
                              <button
                                onClick={() => handleDownloadSupabase('track-audio', license.track.mp3Url, `${license.track.title}_MP3.mp3`)}
                                className="flex items-center px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors"
                                title="Download MP3"
                              >
                                <Download className="w-4 h-4 mr-2" />
                                Download MP3
                              </button>
                            )}
                            {license.track.trackoutsUrl && (
                              <button
                                onClick={() => handleDownloadSupabase('trackouts', license.track.trackoutsUrl, `${license.track.title}_Trackouts.zip`)}
                                className="flex items-center px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                                title="Download Trackouts"
                              >
                                <Download className="w-4 h-4 mr-2" />
                                Download Trackouts
                              </button>
                            )}
                            {license.track.stemsUrl && (
                              <button
                                onClick={() => handleDownloadSupabase('stems', license.track.stemsUrl, `${license.track.title}_Stems.zip`)}
                                className="flex items-center px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition-colors"
                                title="Download Stems"
                              >
                                <Download className="w-4 h-4 mr-2" />
                                Download Stems
                              </button>
                            )}
                            {license.track.splitSheetUrl && (
                              <button
                                onClick={() => handleDownloadSupabase('split-sheets', license.track.splitSheetUrl, `${license.track.title}_Splitsheets.zip`)}
                                className="flex items-center px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm rounded-lg transition-colors"
                                title="Download Split Sheet"
                              >
                                <Download className="w-4 h-4 mr-2" />
                                Download Split Sheet
                              </button>
                            )}
                            {!license.track.mp3Url && !license.track.trackoutsUrl && !license.track.splitSheetUrl && (
                              <span className="text-sm text-gray-400 italic">No files available for download</span>
                            )}
                            {license.track.splitSheetUrl && !license.track.splitSheetUrl.endsWith('split_sheet.pdf') && (
                              <div className="mb-2 p-2 bg-yellow-900/80 text-yellow-200 rounded text-xs">
                                Warning: Split sheet path does not match expected pattern. Please check upload logic and database.
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => setSelectedLicenseToDelete(license)}
                            className="flex items-center px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                } else {
                  // Sync proposal
                  const proposal = item.data;
                  
                  return (
                    <div
                      key={proposal.id}
                      className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-purple-500/20"
                    >
                      <div className="flex flex-col h-full">
                        <div className="flex items-start space-x-4 flex-1">
                          <TrackImage
                            imageUrl={proposal.track.image_url || ''}
                            title={proposal.track.title}
                            className="w-16 h-16 object-cover rounded-lg flex-shrink-0 cursor-pointer"
                            onClick={() => navigate(`/track/${proposal.track.id}`)}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col space-y-3">
                              <div className="flex items-center justify-between mb-2">
                                <button
                                  onClick={() => navigate(`/track/${proposal.track.id}`)}
                                  className="text-lg font-semibold text-white hover:text-blue-400 transition-colors text-left"
                                >
                                  {proposal.track.title}
                                </button>
                              </div>
                              <div className="flex items-center space-x-4 text-sm text-gray-400 mb-2">
                                <span className="flex items-center">
                                  <Tag className="w-4 h-4 mr-1" />
                                  {Array.isArray(proposal.track.genres) ? proposal.track.genres.join(', ') : proposal.track.genres || 'Unknown'}
                                </span>
                                <span className="flex items-center">
                                  <Hash className="w-4 h-4 mr-1" />
                                  {proposal.track.bpm} BPM
                                </span>
                                <span className="flex items-center">
                                  <DollarSign className="w-4 h-4 mr-1" />
                                  ${(proposal.final_amount || proposal.sync_fee).toFixed(2)}
                                </span>
                              </div>
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center space-x-2">
                                  <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs">
                                    Paid
                                  </span>
                                  <span className="text-xs text-gray-400">
                                    Paid: {new Date(proposal.updated_at || proposal.created_at).toLocaleDateString()}
                                  </span>
                                </div>
                                {(proposal.track.audio_url || proposal.track.mp3_url) && (
                                  <AudioPlayerWithSignedUrl
                                    audioUrl={proposal.track.audio_url || proposal.track.mp3_url}
                                    title={proposal.track.title}
                                    isPlaying={currentlyPlaying === `proposal-${proposal.id}`}
                                    onToggle={() => {
                                      if (currentlyPlaying === `proposal-${proposal.id}`) {
                                        setCurrentlyPlaying(null);
                                      } else {
                                        setCurrentlyPlaying(`proposal-${proposal.id}`);
                                      }
                                    }}
                                  />
                                )}
                                {!proposal.track.audio_url && !proposal.track.mp3_url && (
                                  <div className="text-xs text-gray-400 italic">
                                    No audio preview available
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-600/30">
                          <div className="flex items-center space-x-2">
                            <span className="px-3 py-2 bg-purple-500/20 text-purple-400 rounded-lg text-sm font-medium">
                              Sync Proposal
                            </span>
                            <button
                              onClick={() => handleViewSyncProposalLicense(proposal.id)}
                              className="flex items-center px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors font-medium"
                              title="View License Agreement"
                            >
                              <FileText className="w-4 h-4 mr-2" />
                              View Agreement
                            </button>
                            <button
                              onClick={() => handleShowHistory(proposal)}
                              className="flex items-center px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors font-medium"
                            >
                              <FileText className="w-4 h-4 mr-2" />
                              History
                            </button>
                            {proposal.payment_status === 'paid' && (
                              <>
                                <div className="text-sm font-medium text-gray-300 border-l border-gray-600 pl-3 ml-3">Download Files:</div>
                                {proposal.track.mp3_url && (
                                  <div className="mb-2 p-2 bg-blue-900/80 text-blue-200 rounded text-xs">
                                    <div>DEBUG: Downloading MP3 from bucket <b>track-audio</b> with path:</div>
                                    <div className="break-all">{proposal.track.mp3_url}</div>
                                    <div>
                                      <button
                                        onClick={() => handleDownloadSupabase('track-audio', proposal.track.mp3_url, `${proposal.track.title}_MP3.mp3`)}
                                        className="mt-2 px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded"
                                      >
                                        Download via App
                                      </button>
                                      <a
                                        href={getSupabaseDashboardUrl('track-audio', proposal.track.mp3_url)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="ml-2 px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded"
                                      >
                                        Fallback: Download via Supabase URL
                                      </a>
                                    </div>
                                  </div>
                                )}
                                {proposal.track.trackouts_url && (
                                  <div className="mb-2 p-2 bg-blue-900/80 text-blue-200 rounded text-xs">
                                    <div>DEBUG: Downloading trackouts from bucket <b>trackouts</b> with path:</div>
                                    <div className="break-all">{proposal.track.trackouts_url}</div>
                                    <div>
                                      <button
                                        onClick={() => handleDownloadSupabase('trackouts', proposal.track.trackouts_url, `${proposal.track.title}_Trackouts.zip`)}
                                        className="mt-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded"
                                      >
                                        Download via App
                                      </button>
                                      <a
                                        href={getSupabaseDashboardUrl('trackouts', proposal.track.trackouts_url)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="ml-2 px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded"
                                      >
                                        Fallback: Download via Supabase URL
                                      </a>
                                    </div>
                                  </div>
                                )}
                                {proposal.track.stemsUrl && (
                                  <div className="mb-2 p-2 bg-blue-900/80 text-blue-200 rounded text-xs">
                                    <div>DEBUG: Downloading stems from bucket <b>stems</b> with path:</div>
                                    <div className="break-all">{proposal.track.stemsUrl}</div>
                                    <div>
                                      <button
                                        onClick={() => handleDownloadSupabase('stems', proposal.track.stemsUrl, `${proposal.track.title}_Stems.zip`)}
                                        className="mt-2 px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded"
                                      >
                                        Download via App
                                      </button>
                                      <a
                                        href={getSupabaseDashboardUrl('stems', proposal.track.stemsUrl)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="ml-2 px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded"
                                      >
                                        Fallback: Download via Supabase URL
                                      </a>
                                    </div>
                                  </div>
                                )}
                                {!proposal.track.mp3_url && !proposal.track.trackouts_url && !proposal.track.split_sheet_url && (
                                  <span className="text-sm text-gray-400 italic">No files available for download</span>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }
              });
            })()}
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
                            <span className="text-xs text-purple-400">{Array.isArray(track.genres) && track.genres[0] ? track.genres[0] : 'Unknown'}</span>
                            <span className="text-xs text-gray-400">{track.bpm} BPM</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {track.audioUrl && (
                            <AudioPlayerWithSignedUrl
                              audioUrl={track.audioUrl}
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
                        <TrackImage
                          imageUrl={track.image}
                          title={track.title}
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
                            <span className="text-xs text-purple-400">{Array.isArray(track.genres) && track.genres[0] ? track.genres[0] : 'Unknown'}</span>
                            <span className="text-xs text-gray-400">{track.bpm} BPM</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {track.audioUrl && (
                            <AudioPlayerWithSignedUrl
                              audioUrl={track.audioUrl}
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

      {showProfileDialog && profile && (
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
          onUpdate={(updates) => handleUpdateRequest(selectedRequest.id, updates)}
        />
      )}

      {selectedLicenseToDelete && (
        <DeleteLicenseDialog
          license={selectedLicenseToDelete}
          onClose={() => setSelectedLicenseToDelete(null)}
          onConfirm={handleDeleteLicense}
        />
      )}

      {showLicenseDialog && selectedTrackToLicense && typeof membershipPlan === 'string' && (
        <LicenseDialog
          isOpen={showLicenseDialog}
          track={selectedTrackToLicense}
          membershipType={membershipPlan}
          remainingLicenses={userStats.remainingLicenses}
          onClose={() => {
            setShowLicenseDialog(false);
            setSelectedTrackToLicense(null);
          }}
        />
      )}

      {showProposalDialog && selectedTrackToLicense && (
        <SyncProposalDialog
          isOpen={showProposalDialog}
          track={selectedTrackToLicense}
          onClose={() => {
            setShowProposalDialog(false);
            setSelectedTrackToLicense(null);
          }}
          onSuccess={() => {
            setSyncProposalSuccess(true);
            setTimeout(() => setSyncProposalSuccess(false), 2500);
          }}
        />
      )}

      {/* Sync Proposal Success Modal */}
      {syncProposalSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-green-700/95 p-6 rounded-xl shadow-xl flex flex-col items-center animate-fade-in">
            <svg className="w-12 h-12 text-white mb-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            <div className="text-lg font-bold text-white mb-1">Sync Proposal Submitted!</div>
            <div className="text-white text-sm">Your proposal has been sent to the producer.</div>
          </div>
        </div>
      )}

      {showAcceptDialog && selectedProposal && (
        <SyncProposalAcceptDialog
          isOpen={showAcceptDialog}
          onClose={() => setShowAcceptDialog(false)}
          proposal={selectedProposal}
          onAccept={() => { setShowAcceptDialog(false); fetchSyncProposals(); }}
        />
      )}

      {showDeclineDialog && selectedProposal && (
        <ProposalConfirmDialog
          isOpen={showDeclineDialog}
          onClose={() => setShowDeclineDialog(false)}
          onConfirm={async () => {
            await handleDeclineProposal(selectedProposal);
            setShowDeclineDialog(false);
          }}
          action="reject"
          proposal={selectedProposal}
        />
      )}

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

      {/* History Modal */}
      {showHistoryModal && historyProposal && (
        <ProposalHistoryDialog
          isOpen={showHistoryModal}
          onClose={() => setShowHistoryModal(false)}
          proposal={historyProposal}
        />
      )}
    </div>
  );
}
//end
