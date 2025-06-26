import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Music, Tag, Clock, Hash, FileMusic, Layers, Mic, Star, X, Calendar, ArrowUpDown, AlertCircle, DollarSign, Edit, Check, Trash2, Plus, UserCog, Loader2, FileText, MessageSquare, AlertTriangle, RefreshCw } from 'lucide-react';
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
import { getUserSubscription } from '../lib/stripe';
import { ProposalNegotiationDialog } from './ProposalNegotiationDialog';
import { ProposalHistoryDialog } from './ProposalHistoryDialog';
import { ProposalConfirmDialog } from './ProposalConfirmDialog';

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

const calculatePaymentDueDate = (acceptedDate: string, paymentTerms: string = 'immediate'): Date => {
  const accepted = new Date(acceptedDate);
  
  switch (paymentTerms.toLowerCase()) {
    case 'immediate':
      return accepted; // Due immediately on acceptance
    case 'net30':
      return new Date(accepted.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 days
    case 'net60':
      return new Date(accepted.getTime() + (60 * 24 * 60 * 60 * 1000)); // 60 days
    case 'net90':
      return new Date(accepted.getTime() + (90 * 24 * 60 * 60 * 1000)); // 90 days
    default:
      return accepted; // Default to immediate
  }
};

export function ClientDashboard() {
  const { user, membershipPlan, refreshMembership } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
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
  const [subscription, setSubscription] = useState<any>(null);
  const [proposals, setProposals] = useState<any[]>([]);
  const [selectedProposal, setSelectedProposal] = useState<any>(null);
  const [showNegotiationDialog, setShowNegotiationDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'accept' | 'reject'>('accept');
  const [proposalTab, setProposalTab] = useState<'pending' | 'accepted' | 'declined' | 'expired'>('pending');
  const [unreadProposals, setUnreadProposals] = useState<string[]>([]);
  const negotiationDialogOpenRef = useRef<string | null>(null);
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
  const [showPaymentCancel, setShowPaymentCancel] = useState(false);
  // Add a debug flag at the top of the component
  const showDebug = false;

  // Ensure proposalTab is always set to a valid value
  useEffect(() => {
    if (!proposalTab || !['pending', 'accepted', 'declined', 'expired'].includes(proposalTab)) {
      setProposalTab('pending');
    }
  }, [proposalTab]);

  // Check for payment status in URL parameters
  useEffect(() => {
    const paymentStatus = searchParams.get('payment');
    if (paymentStatus === 'success') {
      setShowPaymentSuccess(true);
      // Remove the payment parameter from URL
      navigate('/dashboard', { replace: true });
      // Refresh proposals to get updated payment status
      fetchProposals();
    } else if (paymentStatus === 'cancel') {
      setShowPaymentCancel(true);
      // Remove the payment parameter from URL
      navigate('/dashboard', { replace: true });
    }
  }, [searchParams, navigate]);

  useEffect(() => {
    if (user) {
      // Refresh membership info first to ensure we have the latest data
      refreshMembership().then(() => {
        fetchDashboardData();
        getUserSubscription().then((sub) => setSubscription(sub));
        fetchProposals();
      });
    }
  }, [user, membershipPlan]);

  // Force refresh proposals when proposalTab changes
  useEffect(() => {
    if (user) {
      fetchProposals();
    }
  }, [proposalTab, user]);

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
        setUserStats((prev: UserStats) => ({
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
            producer_id,
            producer:profiles!tracks_producer_id_fkey (
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
        const formattedLicenses = licensesData.map((license: any) => ({
          ...license,
          expiry_date: license.expiry_date || calculateExpiryDate(license.created_at, profileData.membership_plan),
          track: {
            ...license.track,
            genres: license.track.genres.split(',').map((g: string) => g.trim()),
            image: license.track.image_url || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop'
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
            producer_id,
            producer:profiles!tracks_producer_id_fkey (
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
          subGenres: f.tracks.sub_genres || [],
          producerId: f.tracks.producer_id,
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
          producer_id,
          producer:profiles!producer_id (
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
          subGenres: track.sub_genres || [],
          producerId: track.producer_id,
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

  const fetchProposals = async () => {
    if (!user) return;
    console.log('Fetching proposals for user:', user.id);
    
    try {
      // First try with the full query including payment columns (excluding non-existent columns)
      const { data, error } = await supabase
        .from('sync_proposals')
        .select(`
          id, 
          status, 
          track_id, 
          client_id,
          client_status,
          sync_fee, 
          expiration_date, 
          is_urgent, 
          created_at,
          payment_status,
          payment_due_date,
          tracks!inner(id, title)
        `)
        .eq('client_id', user.id)
        .order('created_at', { ascending: false });
      
      console.log('Proposals fetch result (with payment):', { data, error });
      
      // Add detailed debugging for payment status
      if (data) {
        console.log('=== PAYMENT STATUS DEBUG ===');
        data.forEach((proposal: any) => {
          console.log(`Proposal ${proposal.id.slice(0, 8)}...:`, {
            id: proposal.id,
            status: proposal.status,
            client_status: proposal.client_status,
            payment_status: proposal.payment_status,
            sync_fee: proposal.sync_fee
          });
        });
        console.log('=== END PAYMENT STATUS DEBUG ===');
        
        // Direct database check for the specific proposals
        const specificProposals = data.filter((p: any) => 
          p.id === '7af40356-66f3-45d7-87f3-710dff65b46a' || 
          p.id === '6b2c0641-bae3-4fdb-a43a-e3b0de12b71b'
        );
        
        if (specificProposals.length > 0) {
          console.log('=== DIRECT DATABASE CHECK ===');
          for (const proposal of specificProposals) {
            const { data: dbCheck, error: dbError } = await supabase
              .from('sync_proposals')
              .select('id, status, client_status, payment_status, sync_fee')
              .eq('id', proposal.id)
              .single();
              
            console.log(`Direct DB check for ${proposal.id.slice(0, 8)}...:`, {
              frontend: {
                status: proposal.status,
                client_status: proposal.client_status,
                payment_status: proposal.payment_status
              },
              database: dbCheck,
              error: dbError
            });
          }
          console.log('=== END DIRECT DATABASE CHECK ===');
        }
      }
      
      if (error) {
        console.error('Error fetching proposals:', error);
        // If there's an error, try a simpler query without the payment columns
        const { data: simpleData, error: simpleError } = await supabase
          .from('sync_proposals')
          .select(`
            id, 
            status, 
            track_id, 
            client_id,
            sync_fee, 
            expiration_date, 
            is_urgent, 
            created_at,
            tracks!inner(id, title)
          `)
          .eq('client_id', user.id)
          .order('created_at', { ascending: false });
        
        console.log('Simple proposals fetch result:', { data: simpleData, error: simpleError });
        
        if (simpleError) {
          console.error('Error with simple query:', simpleError);
          setProposals([]);
          return;
        }
        
        // Add default values for missing columns
        const proposalsWithDefaults = (simpleData || []).map((proposal: any) => ({
          ...proposal,
          client_status: proposal.client_status || 'pending',
          payment_status: proposal.payment_status || 'pending',
          payment_due_date: proposal.payment_due_date || null,
          accepted_at: proposal.accepted_at || null
        }));
        
        setProposals(proposalsWithDefaults);
      } else {
        // Use the data as-is since we're now fetching all the payment columns that exist
        setProposals(data || []);
      }
      
      // Check for new negotiation messages
      await checkForNewNegotiationMessages();
    } catch (err) {
      console.error('Unexpected error fetching proposals:', err);
      setProposals([]);
    }
  };

  const checkForNewNegotiationMessages = async () => {
    if (!user) return;
    
    try {
      const newUnreadProposals: string[] = [];
      
      for (const proposal of proposals) {
        // Get the last viewed timestamp for this proposal
        const lastViewed = localStorage.getItem(`negotiation_last_viewed_${proposal.id}_${user.id}`);
        
        if (lastViewed) {
          // Check if there are any new messages since last viewed
          const { data: newMessages } = await supabase
            .from('proposal_negotiations')
            .select('created_at')
            .eq('proposal_id', proposal.id)
            .gt('created_at', lastViewed)
            .neq('sender_id', user.id); // Only count messages from others
          
          if (newMessages && newMessages.length > 0) {
            newUnreadProposals.push(proposal.id);
          }
        } else {
          // If no last viewed timestamp, check if there are any messages from others
          const { data: messages } = await supabase
            .from('proposal_negotiations')
            .select('created_at')
            .eq('proposal_id', proposal.id)
            .neq('sender_id', user.id);
          
          if (messages && messages.length > 0) {
            newUnreadProposals.push(proposal.id);
          }
        }
      }
      
      setUnreadProposals(newUnreadProposals);
    } catch (error) {
      console.error('Error checking for new negotiation messages:', error);
    }
  };

  const filteredProposals = proposals.filter((p: any) => {
    console.log('Filtering proposal:', p.id, 'status:', p.status, 'client_status:', p.client_status, 'tab:', proposalTab);
    
    if (proposalTab === 'pending') {
      const isPending = p.status === 'pending' || p.status === 'active' || p.status === 'producer_accepted';
      console.log('  Pending check:', isPending);
      return isPending;
    }
    
    if (proposalTab === 'accepted') {
      const isAccepted = p.status === 'accepted' || p.client_status === 'accepted';
      console.log('  Accepted check:', isAccepted, '(status:', p.status, 'client_status:', p.client_status, ')');
      return isAccepted;
    }
    
    if (proposalTab === 'declined') {
      const isDeclined = p.status === 'rejected';
      console.log('  Declined check:', isDeclined);
      return isDeclined;
    }
    
    if (proposalTab === 'expired') {
      const isExpired = p.status === 'expired';
      console.log('  Expired check:', isExpired);
      return isExpired;
    }
    
    console.log('  No tab match, returning false');
    return false;
  });

  console.log('=== FILTERING DEBUG ===');
  console.log('Current tab:', proposalTab);
  console.log('All proposals:', proposals);
  console.log('Filtered proposals for tab', proposalTab, ':', filteredProposals);
  console.log('Filtered proposals length:', filteredProposals.length);
  console.log('=== END FILTERING DEBUG ===');

  const handleProposalAction = (proposal: any, action: 'negotiate' | 'history' | 'accept' | 'reject') => {
    setSelectedProposal(proposal);
    if (action === 'negotiate') {
      negotiationDialogOpenRef.current = proposal.id;
      // Mark as viewed now
      localStorage.setItem(`negotiation_last_viewed_${proposal.id}_${user.id}`, new Date().toISOString());
      setUnreadProposals((prev: string[]) => prev.filter((id: string) => id !== proposal.id));
    }
    switch (action) {
      case 'negotiate': setShowNegotiationDialog(true); break;
      case 'history': setShowHistoryDialog(true); break;
      case 'accept': setConfirmAction('accept'); setShowConfirmDialog(true); break;
      case 'reject': setConfirmAction('reject'); setShowConfirmDialog(true); break;
    }
  };

  const handleClientAcceptDecline = async (
    proposal: any,
    action: 'client_accepted' | 'client_rejected' | 'accepted' | 'rejected'
  ) => {
    console.log('handleClientAcceptDecline called', { proposal, action });
    if (!user) return;

    let newStatus = action;
    let newClientStatus = action;
    
    if (action === 'client_accepted') {
      // Only allow if current status is producer_accepted
      const { data: latestProposal } = await supabase
        .from('sync_proposals')
        .select('status')
        .eq('id', proposal.id)
        .single();

      if (latestProposal?.status === 'producer_accepted') {
        newStatus = 'accepted';
        newClientStatus = 'accepted';
      } else {
        // Do not proceed if not allowed
        alert('You can only accept after the producer has accepted.');
        return;
      }
    } else if (action === 'client_rejected') {
      newStatus = 'rejected';
      newClientStatus = 'rejected';
    }

    console.log('Updating proposal status to:', newStatus, 'client_status to:', newClientStatus);

    // Update both the proposal status and client_status
    const { error: updateError } = await supabase
      .from('sync_proposals')
      .update({ 
        status: newStatus, 
        client_status: newClientStatus,
        updated_at: new Date().toISOString() 
      })
      .eq('id', proposal.id);

    if (updateError) {
      console.error('Error updating proposal status:', updateError);
      return;
    }

    console.log('Proposal status updated successfully');

    // Update the local state immediately for instant UI feedback
    setProposals(prevProposals => 
      prevProposals.map(p => 
        p.id === proposal.id 
          ? { ...p, status: newStatus, client_status: newClientStatus }
          : p
      )
    );

    // Log to history
    await supabase
      .from('proposal_history')
      .insert({
        proposal_id: proposal.id,
        previous_status: proposal.status,
        new_status: newStatus,
        changed_by: user.id
      });

    console.log('Proposal history logged, refreshing proposals...');

    // Refresh proposals to show updated status
    await fetchProposals();

    console.log('Proposals refreshed, checking if status is accepted...');

    // If accepted, trigger invoice creation
    if (newStatus === 'accepted') {
      console.log('Triggering payment for accepted proposal...');
      try {
        console.log('Setting up payment for proposal:', proposal.id);
        console.log('Making request to:', `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/trigger-proposal-payment`);
        
        const requestBody = {
          proposal_id: proposal.id
        };
        console.log('Request body:', requestBody);
        
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/trigger-proposal-payment`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        });

        console.log('Response received, status:', response.status);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));
        
        const responseData = await response.json();
        console.log('Payment setup response:', responseData);

        if (!response.ok) {
          if (responseData.error === 'Payment already processed for this proposal') {
            // If payment was already processed but we don't see the session, refresh the data
            alert('Payment session already exists. Refreshing data...');
            await fetchProposals();
          } else {
            alert(`Payment setup failed: ${responseData.error || 'Unknown error'}`);
          }
        } else if (responseData.url) {
          console.log('Redirecting to payment URL:', responseData.url);
          window.location.href = responseData.url;
        } else {
          alert('Invoice created successfully! You will receive payment instructions shortly.');
          await fetchProposals(); // Refresh to show updated status
        }
      } catch (error) {
        console.error('Error setting up payment:', error);
        console.error('Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
        if (error.message.includes('CORS') || error.message.includes('Failed to fetch')) {
          alert('Network error. Please check your connection and try again.');
        } else {
          alert('Failed to set up payment. Please try again.');
        }
      }
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

      setFavorites(favorites.filter((track: Track) => track.id !== trackId));
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

      setSyncRequests((requests: CustomSyncRequest[]) =>
        requests.map((req: CustomSyncRequest) =>
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

  const sortedAndFilteredLicenses = licenses
    .filter((license: License) => !selectedGenre || license.track.genres.includes(selectedGenre))
    .sort((a: License, b: License) => {
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
    .filter((track: Track) => !selectedGenre || track.genres.includes(selectedGenre))
    .sort((a: Track, b: Track) => {
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

        {/* Payment Success Message */}
        {showPaymentSuccess && (
          <div className="mb-6 p-4 bg-green-500/20 border border-green-500/40 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Check className="w-5 h-5 mr-2 text-green-400" />
                <span className="text-green-400 font-semibold">Payment Successful!</span>
                <span className="text-green-300 ml-2">Your sync proposal payment has been processed successfully.</span>
              </div>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={async () => {
                    await fetchProposals();
                    setShowPaymentSuccess(false);
                  }} 
                  className="text-green-300 hover:text-green-100 text-sm underline"
                >
                  Refresh Data
                </button>
                <button 
                  onClick={() => setShowPaymentSuccess(false)} 
                  className="text-green-300 hover:text-green-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Payment Cancel Message */}
        {showPaymentCancel && (
          <div className="mb-6 p-4 bg-yellow-500/20 border border-yellow-500/40 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2 text-yellow-400" />
                <span className="text-yellow-400 font-semibold">Payment Cancelled</span>
                <span className="text-yellow-300 ml-2">Your payment was cancelled. You can try again anytime.</span>
              </div>
              <button 
                onClick={() => setShowPaymentCancel(false)} 
                className="text-yellow-300 hover:text-yellow-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

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
              {subscription && subscription.current_period_start && subscription.current_period_end && (
                <p className="text-sm text-gray-400 mt-2">
                  Plan Start: {new Date(subscription.current_period_start * 1000).toLocaleDateString()}<br />
                  Plan End: {new Date(subscription.current_period_end * 1000).toLocaleDateString()}
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

        <div className="mb-8 bg-white/5 backdrop-blur-sm rounded-xl border border-purple-500/20 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white">Sync Proposals</h2>
            <div className="flex items-center space-x-4">
              {showDebug && (
                <button
                  onClick={fetchProposals}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors flex items-center"
                >
                  <RefreshCw className="w-4 h-4 mr-1" />
                  Refresh
                </button>
              )}
              {showDebug && (
                <button
                  onClick={async () => {
                    try {
                      console.log('Fixing payment status for accepted proposals...');
                      
                      // First, check what proposals need fixing
                      const { data: pendingProposals, error: checkError } = await supabase
                        .from('sync_proposals')
                        .select('id, status, client_status, payment_status, sync_fee')
                        .eq('client_id', user?.id)
                        .eq('status', 'accepted')
                        .eq('payment_status', 'pending')
                        .neq('sync_fee', 0);

                      if (checkError) {
                        console.error('Error checking proposals:', checkError);
                        alert('Failed to check proposals: ' + checkError.message);
                        return;
                      }

                      console.log('Found proposals to fix:', pendingProposals);

                      if (!pendingProposals || pendingProposals.length === 0) {
                        alert('No accepted proposals found with pending payment status');
                        return;
                      }

                      // Manual payment status fix for accepted proposals
                      const { data, error } = await supabase
                        .from('sync_proposals')
                        .update({
                          payment_status: 'paid',
                          payment_date: new Date().toISOString(),
                          updated_at: new Date().toISOString()
                        })
                        .eq('client_id', user?.id)
                        .eq('status', 'accepted')
                        .eq('payment_status', 'pending')
                        .neq('sync_fee', 0);

                      if (error) {
                        console.error('Error fixing payment status:', error);
                        alert('Failed to fix payment status: ' + error.message);
                      } else {
                        console.log('Payment status fix result:', data);
                        alert(`Successfully updated payment status for ${pendingProposals.length} proposal(s)`);
                        await fetchProposals(); // Refresh the data
                      }
                    } catch (err) {
                      console.error('Error in payment status fix:', err);
                      alert('Failed to fix payment status');
                    }
                  }}
                  className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors flex items-center"
                >
                  <Check className="w-4 h-4 mr-1" />
                  Fix Payment Status
                </button>
              )}
              <div className="flex space-x-2">
                <button onClick={() => setProposalTab('pending')} className={`px-3 py-1 rounded ${proposalTab==='pending'?'bg-purple-600 text-white':'bg-white/10 text-gray-300'}`}>Pending/Active</button>
                <button onClick={() => setProposalTab('accepted')} className={`px-3 py-1 rounded ${proposalTab==='accepted'?'bg-green-600 text-white':'bg-white/10 text-gray-300'}`}>Accepted</button>
                <button onClick={() => setProposalTab('declined')} className={`px-3 py-1 rounded ${proposalTab==='declined'?'bg-red-600 text-white':'bg-white/10 text-gray-300'}`}>Declined</button>
                <button onClick={() => setProposalTab('expired')} className={`px-3 py-1 rounded ${proposalTab==='expired'?'bg-yellow-600 text-white':'bg-white/10 text-gray-300'}`}>Expired</button>
              </div>
            </div>
          </div>
          {unreadProposals.length > 0 && (
            <div className="mb-4 p-4 bg-yellow-400/20 border border-yellow-400/40 rounded-lg text-yellow-900 font-semibold flex items-center justify-between">
              <div className="flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2 text-yellow-600" /> 
                You have {unreadProposals.length} new negotiation message{unreadProposals.length > 1 ? 's' : ''} waiting to be reviewed.
              </div>
              <button 
                onClick={() => setUnreadProposals([])} 
                className="text-yellow-700 hover:text-yellow-900 text-sm underline"
              >
                Dismiss
              </button>
            </div>
          )}
          <div className="space-y-4">
            {showDebug && (
              <div className="space-y-4">
                {/* Debug info */}
                <div className="p-2 bg-red-500/10 border border-red-500/20 rounded text-xs text-red-400">
                  Debug: Tab={proposalTab} | All proposals={proposals.length} | Filtered={filteredProposals.length} | 
                  Pending proposals={proposals.filter(p => p.status === 'pending' || p.status === 'active' || p.status === 'producer_accepted').length} |
                  Accepted proposals={proposals.filter(p => p.status === 'accepted' || p.client_status === 'accepted').length}
                </div>
                {/* Payment Status Debug */}
                <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded text-xs text-blue-400">
                  Payment Debug: 
                  {proposals.filter(p => p.payment_status).map((p: any) => (
                    <div key={p.id} className="mt-1">
                      Proposal {p.id.slice(0, 8)}... | Status: {p.status} | Payment: {p.payment_status} | Fee: ${p.sync_fee}
                    </div>
                  ))}
                  {proposals.filter(p => !p.payment_status).length > 0 && (
                    <div className="mt-1 text-yellow-400">
                      {proposals.filter(p => !p.payment_status).length} proposals with no payment_status
                    </div>
                  )}
                </div>
                {/* NEW: Visible Database Debug */}
                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded text-sm text-green-400">
                  <h4 className="font-bold mb-2">Database Debug (Visible)</h4>
                  {proposals.length > 0 ? (
                    proposals.map((p: any) => (
                      <div key={p.id} className="mb-1">
                        ID: {p.id.slice(0, 8)}... | Status: {p.status} | Client Status: {p.client_status} | Payment: {p.payment_status} | Fee: ${p.sync_fee}
                      </div>
                    ))
                  ) : (
                    <div>No proposals found</div>
                  )}
                </div>
              </div>
            )}
            
            {filteredProposals.length === 0 ? (
              <div className="text-center py-6 bg-white/5 rounded-lg border border-purple-500/20">
                <p className="text-gray-400">No proposals found</p>
                {/* Temporary debug section */}
                {showDebug && proposals.length > 0 && (
                  <div className="mt-4 text-left">
                    <p className="text-yellow-400 text-sm mb-2">Debug: All proposals ({proposals.length}) | Current tab: {proposalTab}</p>
                    {proposals.map((p: any) => (
                      <div key={p.id} className="text-xs text-gray-400 mb-1 p-2 bg-gray-800 rounded">
                        ID: {p.id.slice(0, 8)}... | Status: {p.status} | Client Status: {p.client_status} | Track: {p.tracks?.title}
                        <br />
                        <span className="text-blue-400">Should show Accept/Decline: {p.status === 'producer_accepted' ? 'YES' : 'NO'}</span>
                        <br />
                        <span className="text-green-400">Tab filters: Pending={p.status === 'pending' || p.status === 'active' || p.status === 'producer_accepted' ? 'YES' : 'NO'} | Accepted={p.status === 'accepted' || p.client_status === 'accepted' ? 'YES' : 'NO'} | Declined={p.status === 'rejected' ? 'YES' : 'NO'}</span>
                      </div>
                    ))}
                  </div>
                )}
                {!showDebug && (
                  <></>
                )}
              </div>
            ) : (
              <>
                {/* Debug section for filtered proposals */}
                {showDebug && (
                  <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <p className="text-blue-400 text-sm mb-2">Debug: Filtered proposals ({filteredProposals.length}) | Current tab: {proposalTab}</p>
                    {filteredProposals.map((p: any) => (
                      <div key={p.id} className="text-xs text-gray-400 mb-1 p-2 bg-gray-800 rounded">
                        ID: {p.id.slice(0, 8)}... | Status: {p.status} | Client Status: {p.client_status} | Track: {p.tracks?.title}
                        <br />
                        <span className="text-blue-400">Should show Accept/Decline: {p.status === 'producer_accepted' ? 'YES' : 'NO'}</span>
                      </div>
                    ))}
                  </div>
                )}
                {filteredProposals.map((proposal: any) => (
                  <div key={proposal.id} className="bg-white/5 rounded-lg p-4 border border-purple-500/20 relative">
                    {unreadProposals.includes(proposal.id) && (
                      <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs font-bold px-3 py-1 rounded-full animate-pulse flex items-center">
                        <MessageSquare className="w-3 h-3 mr-1" />
                        New Message
                      </div>
                    )}
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="text-white font-medium">
                          {proposal.tracks?.title || `Track ${proposal.track_id?.slice(0, 8)}...`}
                        </h4>
                        <p className="text-sm text-gray-400">
                          Sync Fee: <span className="text-green-400 font-semibold">
                            ${proposal.sync_fee?.toFixed(2) || '0.00'}
                          </span>
                        </p>
                        <p className="text-xs text-gray-400">
                          Expires: {proposal.expiration_date ? new Date(proposal.expiration_date).toLocaleDateString() : 'No expiry date'}
                        </p>
                        {proposal.is_urgent && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-500 text-xs font-semibold mt-1">
                            <AlertTriangle className="w-3 h-3 mr-1" /> Urgent
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-1 rounded-full text-xs ${proposal.status==='pending'?'bg-purple-600/20 text-purple-400':proposal.status==='accepted'?'bg-green-600/20 text-green-400':proposal.status==='rejected'?'bg-red-600/20 text-red-400':proposal.status==='pending_client'?'bg-yellow-600/20 text-yellow-500':'bg-gray-600/20 text-gray-400'}`}>{proposal.status.charAt(0).toUpperCase()+proposal.status.slice(1).replace('_',' ')}</span>
                      </div>
                    </div>
                    {proposal.status === 'producer_accepted' && (
                      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-2 flex flex-col md:flex-row md:items-center md:justify-between">
                        <span className="text-yellow-600 font-semibold flex items-center mb-2 md:mb-0"><AlertTriangle className="w-4 h-4 mr-2" />Producer accepted. Please accept or decline to finalize.</span>
                        <div className="flex space-x-2 mt-2 md:mt-0">
                          <button
                            onClick={() => {
                              console.log('Client Accept clicked', proposal);
                              handleClientAcceptDecline(proposal, 'client_accepted');
                            }}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors animate-blink"
                          >Accept</button>
                          <button 
                            onClick={() => {
                              setSelectedProposal(proposal);
                              setConfirmAction('reject');
                              setShowConfirmDialog(true);
                            }} 
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                          >Decline</button>
                        </div>
                      </div>
                    )}
                    {proposal.status === 'pending' && (
                      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-2 flex flex-col md:flex-row md:items-center md:justify-between">
                        <span className="text-blue-600 font-semibold flex items-center mb-2 md:mb-0"><Clock className="w-4 h-4 mr-2" />Proposal is pending producer review. You can decline at any time.</span>
                        <div className="flex space-x-2 mt-2 md:mt-0">
                          <button 
                            onClick={() => {
                              setSelectedProposal(proposal);
                              setConfirmAction('reject');
                              setShowConfirmDialog(true);
                            }} 
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                          >
                            Decline
                          </button>
                        </div>
                      </div>
                    )}
                    {proposal.status === 'accepted' && (
                      <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mb-2">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                          <div className="mb-2 md:mb-0">
                            <span className="text-green-600 font-semibold flex items-center mb-1">
                              <Check className="w-4 h-4 mr-2" />
                              Proposal Accepted
                            </span>
                            {proposal.sync_fee && (
                              <p className="text-sm text-gray-300">
                                Sync Fee: <span className="text-green-400 font-semibold">${proposal.sync_fee.toFixed(2)}</span>
                              </p>
                            )}
                            {proposal.payment_due_date ? (
                              <p className="text-sm text-gray-300">
                                Payment Due: <span className="text-yellow-400 font-semibold">{new Date(proposal.payment_due_date).toLocaleDateString()}</span>
                              </p>
                            ) : proposal.status === 'accepted' && proposal.created_at ? (
                              <p className="text-sm text-gray-300">
                                Payment Due: <span className="text-yellow-400 font-semibold">{calculatePaymentDueDate(proposal.created_at, 'immediate').toLocaleDateString()}</span>
                              </p>
                            ) : null}
                            {proposal.payment_status && (
                              <p className="text-sm text-gray-300">
                                Payment Status: <span className={`font-semibold ${
                                  proposal.payment_status === 'paid' ? 'text-green-400' : 
                                  proposal.payment_status === 'pending' ? 'text-yellow-400' : 
                                  'text-red-400'
                                }`}>
                                  {proposal.payment_status.charAt(0).toUpperCase() + proposal.payment_status.slice(1)}
                                </span>
                              </p>
                            )}
                          </div>
                          {proposal.payment_status === 'paid' && (
                            <div className="flex items-center mt-2 md:mt-0">
                              <button
                                onClick={async () => {
                                  try {
                                    // Get the current user's access token
                                    const { data: { session } } = await supabase.auth.getSession();
                                    const accessToken = session?.access_token;
                                    if (!accessToken) {
                                      alert('You must be logged in to download the invoice.');
                                      return;
                                    }
                                    // Generate invoice PDF
                                    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-invoice-pdf`, {
                                      method: 'POST',
                                      headers: {
                                        'Authorization': `Bearer ${accessToken}`,
                                        'Content-Type': 'application/json'
                                      },
                                      body: JSON.stringify({
                                        proposal_id: proposal.id
                                      })
                                    });

                                    if (response.ok) {
                                      const blob = await response.blob();
                                      const url = window.URL.createObjectURL(blob);
                                      const a = document.createElement('a');
                                      a.href = url;
                                      a.download = `invoice-${proposal.id.slice(0, 8)}.pdf`;
                                      document.body.appendChild(a);
                                      a.click();
                                      window.URL.revokeObjectURL(url);
                                      document.body.removeChild(a);
                                    } else {
                                      alert('Failed to generate invoice. Please try again.');
                                    }
                                  } catch (error) {
                                    console.error('Error generating invoice:', error);
                                    alert('Failed to generate invoice. Please try again.');
                                  }
                                }}
                                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center"
                              >
                                <FileText className="w-4 h-4 mr-2" />
                                Download Invoice
                              </button>
                            </div>
                          )}
                          {proposal.payment_status === 'pending' && (
                            <div className="flex space-x-2 mt-2 md:mt-0">
                              <button
                                onClick={async () => {
                                  try {
                                    console.log('Setting up payment for proposal:', proposal.id);
                                    console.log('Making request to:', `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/trigger-proposal-payment`);
                                    
                                    const requestBody = {
                                      proposal_id: proposal.id
                                    };
                                    console.log('Request body:', requestBody);
                                    
                                    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/trigger-proposal-payment`, {
                                      method: 'POST',
                                      headers: {
                                        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
                                        'Content-Type': 'application/json'
                                      },
                                      body: JSON.stringify(requestBody)
                                    });

                                    console.log('Response received, status:', response.status);
                                    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
                                    
                                    const responseData = await response.json();
                                    console.log('Payment setup response:', responseData);

                                    if (!response.ok) {
                                      if (responseData.error === 'Payment already processed for this proposal') {
                                        // If payment was already processed but we don't see the session, refresh the data
                                        alert('Payment session already exists. Refreshing data...');
                                        await fetchProposals();
                                      } else {
                                        alert(`Payment setup failed: ${responseData.error || 'Unknown error'}`);
                                      }
                                    } else if (responseData.url) {
                                      console.log('Redirecting to payment URL:', responseData.url);
                                      window.location.href = responseData.url;
                                    } else {
                                      alert('Invoice created successfully! You will receive payment instructions shortly.');
                                      await fetchProposals(); // Refresh to show updated status
                                    }
                                  } catch (error) {
                                    console.error('Error setting up payment:', error);
                                    console.error('Error details:', {
                                      name: error.name,
                                      message: error.message,
                                      stack: error.stack
                                    });
                                    if (error.message.includes('CORS') || error.message.includes('Failed to fetch')) {
                                      alert('Network error. Please check your connection and try again.');
                                    } else {
                                      alert('Failed to set up payment. Please try again.');
                                    }
                                  }
                                }}
                                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center"
                              >
                                <DollarSign className="w-4 h-4 mr-2" />
                                Pay Now
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    <div className="flex space-x-2 mt-2">
                      <button onClick={() => handleProposalAction(proposal, 'history')} className="px-2 py-1 bg-white/10 hover:bg-white/20 text-white text-xs rounded transition-colors"><Clock className="w-3 h-3 inline mr-1" />History</button>
                      {/* Only show negotiate button if proposal is not fully accepted */}
                      {proposal.status !== 'accepted' && proposal.status !== 'client_accepted' && proposal.status !== 'producer_accepted' && (
                        <button onClick={() => handleProposalAction(proposal, 'negotiate')} className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"><MessageSquare className="w-3 h-3 inline mr-1" />Negotiate</button>
                      )}
                      {/* Show negotiation disabled message if proposal is accepted */}
                      {proposal.status === 'accepted' && (
                        <span className="px-2 py-1 bg-gray-600/20 text-gray-400 text-xs rounded flex items-center">
                          <MessageSquare className="w-3 h-3 inline mr-1" />
                          Negotiation Closed
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        <div className="mb-8 bg-white/5 backdrop-blur-sm rounded-xl border border-purple-500/20 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Your Sync Requests</h2>
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
                            {license.track.audio_url && (
                              <AudioPlayer
                                src={license.track.audio_url}
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
          track={selectedTrackToLicense}
          onClose={() => {
            setShowLicenseDialog(false);
            setSelectedTrackToLicense(null);
          }}
          onSuccess={() => {
            setShowLicenseDialog(false);
            setSelectedTrackToLicense(null);
            fetchDashboardData();
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
          onSuccess={() => {
            setShowProposalDialog(false);
            setSelectedTrackToLicense(null);
          }}
        />
      )}

      {selectedProposal && showNegotiationDialog && (
        <ProposalNegotiationDialog
          isOpen={showNegotiationDialog}
          onClose={() => { setShowNegotiationDialog(false); setSelectedProposal(null); fetchProposals(); }}
          proposal={selectedProposal}
          onNegotiationSent={() => { setShowNegotiationDialog(false); setSelectedProposal(null); fetchProposals(); }}
        />
      )}

      {selectedProposal && showHistoryDialog && (
        <ProposalHistoryDialog
          isOpen={showHistoryDialog}
          onClose={() => { setShowHistoryDialog(false); setSelectedProposal(null); }}
          proposalId={selectedProposal.id}
        />
      )}

      {selectedProposal && showConfirmDialog && (
        <ProposalConfirmDialog
          isOpen={showConfirmDialog}
          onClose={() => { setShowConfirmDialog(false); setSelectedProposal(null); fetchProposals(); }}
          onConfirm={() => {
            console.log('onConfirm in ClientDashboard', { selectedProposal, confirmAction });
            // Only allow 'accept' if status is producer_accepted
            if (confirmAction === 'accept') {
              handleClientAcceptDecline(selectedProposal, 'client_accepted');
            } else if (confirmAction === 'reject') {
              handleClientAcceptDecline(selectedProposal, 'client_rejected');
            }
          }}
          action={confirmAction}
          proposal={selectedProposal}
        />
      )}
    </div>
  );
}
