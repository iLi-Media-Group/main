import React, { useState, useEffect } from 'react';
import { Users, BarChart3, DollarSign, Calendar, Music, Search, Plus, Edit, Trash2, Eye, Download, Percent, Shield, Settings, Palette, Upload, PieChart, Bell, Globe, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Link, useNavigate } from 'react-router-dom';
import { ClientList } from './ClientList';
import { AdminAnnouncementManager } from './AdminAnnouncementManager';
import { CompensationSettings } from './CompensationSettings';
import { DiscountManagement } from './DiscountManagement';
import { FeatureManagement } from './FeatureManagement';
import { ProposalAnalytics } from './ProposalAnalytics';
import { CustomSyncAnalytics } from './CustomSyncAnalytics';
import { AdvancedAnalyticsDashboard } from './AdvancedAnalyticsDashboard';
import { ProducerAnalyticsModal } from './ProducerAnalyticsModal';
import { RevenueBreakdownDialog } from './RevenueBreakdownDialog';
import { LogoUpload } from './LogoUpload';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

interface UserStats {
  total_clients: number;
  total_producers: number;
  total_sales: number;
  total_revenue: number;
  track_sales_count: number;
  track_sales_amount: number;
  sync_proposals_paid_count: number;
  sync_proposals_paid_amount: number;
  sync_proposals_pending_count: number;
  sync_proposals_pending_amount: number;
  custom_syncs_paid_count: number;
  custom_syncs_paid_amount: number;
  custom_syncs_pending_count: number;
  custom_syncs_pending_amount: number;
  white_label_setup_count: number;
  white_label_setup_amount: number;
  white_label_subscriptions_count: number;
  white_label_monthly_amount: number;
  new_memberships_count: number;
}

interface UserDetails {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  account_type: 'client' | 'producer';
  created_at: string;
  producer_number?: string | null;
  total_tracks?: number;
  total_sales?: number;
  total_revenue?: number;
  total_proposals?: number;
  acceptance_rate?: number;
}

interface WhiteLabelClient {
  id: string;
  display_name: string;
  owner_id: string;
  domain?: string;
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
  created_at: string;
  owner?: {
    email: string;
    first_name?: string;
    last_name?: string;
  };
  ai_search_assistance_enabled?: boolean;
  producer_onboarding_enabled?: boolean;
  deep_media_search_enabled?: boolean;
  password_setup_required?: boolean;
  temp_password?: string;
}

export function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<{ first_name?: string, email: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<{
    total_clients: number;
    total_producers: number;
    total_sales: number;
    total_revenue: number;
    track_sales_count: number;
    track_sales_amount: number;
    sync_proposals_paid_count: number;
    sync_proposals_paid_amount: number;
    sync_proposals_pending_count: number;
    sync_proposals_pending_amount: number;
    custom_syncs_paid_count: number;
    custom_syncs_paid_amount: number;
    custom_syncs_pending_count: number;
    custom_syncs_pending_amount: number;
    white_label_setup_count: number;
    white_label_setup_amount: number;
    white_label_subscriptions_count: number;
    white_label_monthly_amount: number;
    new_memberships_count: number;
  }>({
    total_clients: 0,
    total_producers: 0,
    total_sales: 0,
    total_revenue: 0,
    track_sales_count: 0,
    track_sales_amount: 0,
    sync_proposals_paid_count: 0,
    sync_proposals_paid_amount: 0,
    sync_proposals_pending_count: 0,
    sync_proposals_pending_amount: 0,
    custom_syncs_paid_count: 0,
    custom_syncs_paid_amount: 0,
    custom_syncs_pending_count: 0,
    custom_syncs_pending_amount: 0,
    white_label_setup_count: 0,
    white_label_setup_amount: 0,
    white_label_subscriptions_count: 0,
    white_label_monthly_amount: 0,
    new_memberships_count: 0
  });
  const [showLogoUpload, setShowLogoUpload] = useState(false);
  const [producers, setProducers] = useState<UserDetails[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [producerSortField, setProducerSortField] = useState<keyof UserDetails>('total_revenue');
  const [producerSortOrder, setProducerSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedProducer, setSelectedProducer] = useState<UserDetails | null>(null);
  const [showRevenueBreakdown, setShowRevenueBreakdown] = useState(false);
  const [activeTab, setActiveTab] = useState<'analytics' | 'advanced_analytics' | 'producers' | 'clients' | 'announcements' | 'compensation' | 'discounts' | 'white_label'>('analytics');
  
  // White Label Admin State
  const [whiteLabelClients, setWhiteLabelClients] = useState<WhiteLabelClient[]>([]);
  const [whiteLabelLoading, setWhiteLabelLoading] = useState(false);
  const [whiteLabelError, setWhiteLabelError] = useState<string | null>(null);
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [editingClient, setEditingClient] = useState<WhiteLabelClient | null>(null);
  const [newClient, setNewClient] = useState({
    display_name: '',
    owner_email: '',
    domain: '',
    primary_color: '#6366f1',
    secondary_color: '#8b5cf6'
  });

  useEffect(() => {
    if (user) {
      fetchData();
      fetchWhiteLabelClients();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);

      // Define currentMonth for analytics queries
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format

      // Fetch admin profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('first_name, email')
        .eq('id', user.id)
        .maybeSingle();
          
      if (profileError) {
        // If profile doesn't exist yet, create it
        if (profileError.code === 'PGRST116') {
          // Create a profile for the admin user
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              email: user.email,
              account_type: 'admin',
              first_name: user.email?.split('@')[0] || 'Admin'
            });
            
          if (insertError) {
            console.error('Error creating admin profile:', insertError);
            throw insertError;
          }
          
          // Set profile data manually since we just created it
          setProfile({
            email: user.email || '',
            first_name: user.email?.split('@')[0] || 'Admin'
          });
        } else {
          console.error('Error fetching admin profile:', profileError);
          throw profileError;
        }
      } else if (profileData) {
        setProfile(profileData);
      }

      // Fetch all users with their details
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('*');

      if (userError) throw userError;

      // Process user data
      const clients = userData.filter(u => u.account_type === 'client');
      const producerUsers = userData.filter(u => 
        u.account_type === 'producer' || 
        ['knockriobeats@gmail.com', 'info@mybeatfi.io', 'derykbanks@yahoo.com'].includes(u.email)
      );

      // Update stats with user counts
      setStats((prev) => ({
        ...prev,
        total_clients: clients.length,
        total_producers: producerUsers.length
      }));

      // Fetch sales analytics
      const { data: analyticsData, error: analyticsError } = await supabase
        .from('sales_analytics')
        .select('*')
        .order('month', { ascending: false });

      if (analyticsError) {
        console.error('Analytics error:', analyticsError);
      } else {
        // Get the most recent analytics data or use default values
        const latestAnalytics = analyticsData && analyticsData.length > 0 ? analyticsData[0] : {
          monthly_sales_count: 0,
          monthly_revenue: 0,
          track_count: 0,
          producer_sales_count: 0,
          producer_revenue: 0
        };

        // Update stats with sales data
        setStats((prev) => ({
          ...prev,
          total_sales: latestAnalytics.monthly_sales_count || 0,
          total_revenue: latestAnalytics.monthly_revenue || 0
        }));

        // Transform producer data - create a map of producer analytics by producer_id
        const initialProducerAnalyticsMap = analyticsData.reduce((map, item) => {
          if (item.producer_id) {
            if (!map[item.producer_id]) {
              map[item.producer_id] = {
                producer_sales_count: item.producer_sales_count || 0,
                producer_revenue: item.producer_revenue || 0,
                track_count: item.track_count || 0
              };
            }
          }
          return map;
        }, {});

        // Fetch track sales data (all paid)
        const { data: trackSalesData, error: trackSalesError } = await supabase
          .from('sales')
          .select('id, amount, created_at');
        if (trackSalesError) {
          console.error('Error fetching track sales:', trackSalesError);
        }
        const trackSales = trackSalesData || [];
        const track_sales_count = trackSales.length;
        const track_sales_amount = trackSales.reduce((sum, sale) => sum + (sale.amount || 0), 0);

        // Fetch sync proposals (paid and pending)
        const { data: syncProposalsData, error: syncProposalsError } = await supabase
          .from('sync_proposals')
          .select('id, sync_fee, status, payment_status')
        if (syncProposalsError) {
          console.error('Error fetching sync proposals:', syncProposalsError);
        }
        const syncProposals = syncProposalsData || [];
        const sync_proposals_paid = syncProposals.filter(p => p.status === 'accepted' && p.payment_status === 'paid');
        const sync_proposals_pending = syncProposals.filter(p => p.status === 'pending' || p.status === 'pending_client' || p.status === 'producer_accepted');
        const sync_proposals_paid_count = sync_proposals_paid.length;
        const sync_proposals_paid_amount = sync_proposals_paid.reduce((sum, p) => sum + (p.sync_fee || 0), 0);
        const sync_proposals_pending_count = sync_proposals_pending.length;
        const sync_proposals_pending_amount = sync_proposals_pending.reduce((sum, p) => sum + (p.sync_fee || 0), 0);

        // Fetch custom sync requests (paid and pending) - only fetch once
        const { data: customSyncs, error: customSyncRequestsError } = await supabase
          .from('custom_sync_requests')
          .select('id, sync_fee, status, payment_status');
        if (customSyncRequestsError) {
          console.error('Error fetching custom sync requests:', customSyncRequestsError);
        }
        const customSyncsData = customSyncs || [];
        const custom_syncs_paid = customSyncsData.filter(c => (c.status === 'completed' || c.status === 'accepted') && c.payment_status === 'paid');
        const custom_syncs_pending = customSyncsData.filter(c => c.status === 'pending' || c.status === 'negotiating' || c.status === 'client_acceptance_required' || c.status === 'open');
        const custom_syncs_paid_count = custom_syncs_paid.length;
        const custom_syncs_paid_amount = custom_syncs_paid.reduce((sum, c) => sum + (c.sync_fee || 0), 0);
        const custom_syncs_pending_count = custom_syncs_pending.length;
        const custom_syncs_pending_amount = custom_syncs_pending.reduce((sum, c) => sum + (c.sync_fee || 0), 0);

        // Fetch new memberships for the current period
        const { data: newMembershipsData, error: newMembershipsError } = await supabase
          .from('profiles')
          .select('id, created_at')
          .gte('created_at', `${currentMonth}-01`)
          .lt('created_at', new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString());
      
      if (newMembershipsError) {
        console.error('Error fetching new memberships:', newMembershipsError);
      }
      const new_memberships_count = newMembershipsData?.length || 0;

        // Fetch white label client purchases (setup fees and subscriptions)
        const { data: whiteLabelOrdersData, error: whiteLabelOrdersError } = await supabase
          .from('stripe_orders')
          .select('id, amount_total, payment_status, status, metadata, created_at')
          .eq('payment_status', 'paid')
          .eq('status', 'completed')
          .not('metadata', 'is', null);
        
        if (whiteLabelOrdersError) {
          console.error('Error fetching white label orders:', whiteLabelOrdersError);
        }
        
        const whiteLabelOrders = whiteLabelOrdersData || [];
        console.log('White Label Orders found:', whiteLabelOrders.length);
        console.log('White Label Orders data:', whiteLabelOrders);
        
        const whiteLabelSetupFees = whiteLabelOrders.filter(order => 
          order.metadata?.type === 'white_label_setup'
        );
        console.log('White Label Setup Fees found:', whiteLabelSetupFees.length);
        console.log('White Label Setup Fees data:', whiteLabelSetupFees);
        
        const white_label_setup_count = whiteLabelSetupFees.length;
        const white_label_setup_amount = whiteLabelSetupFees.reduce((sum, order) => sum + (order.amount_total || 0), 0) / 100; // Convert from cents

        // Fetch white label subscriptions (monthly fees)
        const { data: whiteLabelSubscriptionsData, error: whiteLabelSubscriptionsError } = await supabase
          .from('stripe_subscriptions')
          .select('id, subscription_id, status, price_id, created_at')
          .eq('status', 'active');
        
        if (whiteLabelSubscriptionsError) {
          console.error('Error fetching white label subscriptions:', whiteLabelSubscriptionsError);
        }
        
        const whiteLabelSubscriptions = whiteLabelSubscriptionsData || [];
        console.log('White Label Subscriptions found:', whiteLabelSubscriptions.length);
        console.log('White Label Subscriptions data:', whiteLabelSubscriptions);
        
        // Count active white label subscriptions and calculate actual monthly revenue
        const white_label_subscriptions_count = whiteLabelSubscriptions.length;
        
        // Calculate actual monthly revenue based on price IDs
        let white_label_monthly_amount = 0;
        whiteLabelSubscriptions.forEach(subscription => {
          if (subscription.price_id) {
            // Map price IDs to monthly amounts
            if (subscription.price_id.includes('white_label_starter')) {
              white_label_monthly_amount += 49; // Starter plan
            } else if (subscription.price_id.includes('white_label_pro')) {
              white_label_monthly_amount += 299; // Pro plan
            } else {
              // Default estimate for unknown price IDs
              white_label_monthly_amount += 49;
            }
          }
        });

        // Update stats with comprehensive data
        setStats((prev: typeof stats) => ({
          ...prev,
          total_clients: clients.length,
          total_producers: producerUsers.length,
          total_sales: track_sales_count + sync_proposals_paid_count + custom_syncs_paid_count + white_label_setup_count,
          total_revenue: track_sales_amount + sync_proposals_paid_amount + custom_syncs_paid_amount + white_label_setup_amount + white_label_monthly_amount,
          track_sales_count,
          track_sales_amount,
          sync_proposals_paid_count,
          sync_proposals_paid_amount,
          sync_proposals_pending_count,
          sync_proposals_pending_amount,
          custom_syncs_paid_count,
          custom_syncs_paid_amount,
          custom_syncs_pending_count,
          custom_syncs_pending_amount,
          white_label_setup_count,
          white_label_setup_amount,
          white_label_subscriptions_count,
          white_label_monthly_amount,
          new_memberships_count
        }));

        // Fetch producer analytics using the existing function
        const { data: producerAnalyticsData, error: producerAnalyticsError } = await supabase
          .rpc('get_producer_analytics');

        if (producerAnalyticsError) {
          console.error('Error fetching producer analytics:', producerAnalyticsError);
        }

        // Create a map of producer analytics by producer_id - fixed duplicate declaration
        const producerAnalyticsMap: Record<string, {
          total_tracks: number;
          total_sales: number;
          total_revenue: number;
        }> = {};

        // Initialize with data from initial map if available
        Object.keys(initialProducerAnalyticsMap).forEach(producerId => {
          const initialData = initialProducerAnalyticsMap[producerId];
          producerAnalyticsMap[producerId] = {
            total_tracks: initialData.track_count || 0,
            total_sales: initialData.producer_sales_count || 0,
            total_revenue: initialData.producer_revenue || 0
          };
        });

        if (producerAnalyticsData) {
          producerAnalyticsData.forEach((item: {
            proposal_producer_id: string;
            total_tracks: number;
            total_sales: number;
            total_revenue: number;
          }) => {
            producerAnalyticsMap[item.proposal_producer_id] = {
              total_tracks: item.total_tracks || 0,
              total_sales: item.total_sales || 0,
              total_revenue: item.total_revenue || 0
            };
          });
        }

        // For producers not in the analytics (like admin emails), fetch their data manually
        const producersNotInAnalytics = producerUsers.filter(producer => !producerAnalyticsMap[producer.id]);
        
        if (producersNotInAnalytics.length > 0) {
          // Fetch tracks for these producers
          const { data: tracksData, error: tracksError } = await supabase
            .from('tracks')
            .select('id, track_producer_id, title')
            .in('track_producer_id', producersNotInAnalytics.map(p => p.id));

          if (tracksError) {
            console.error('Error fetching tracks for producers:', tracksError);
          }

          // Fetch sales for these producers' tracks
          const trackIds = tracksData?.map(t => t.id) || [];
          let salesData: any[] = [];
          if (trackIds.length > 0) {
            const { data: sales, error: salesError } = await supabase
              .from('sales')
              .select('id, track_id, amount')
              .in('track_id', trackIds);

            if (salesError) {
              console.error('Error fetching sales for producers:', salesError);
            } else {
              salesData = sales || [];
            }
          }

          // Fetch sync proposals for these producers' tracks
          let syncProposalsData: any[] = [];
          if (trackIds.length > 0) {
            const { data: syncProposals, error: syncProposalsError } = await supabase
              .from('sync_proposals')
              .select('id, track_id, sync_fee, payment_status, status')
              .in('track_id', trackIds)
              .eq('payment_status', 'paid')
              .eq('status', 'accepted');

            if (syncProposalsError) {
              console.error('Error fetching sync proposals for producers:', syncProposalsError);
            } else {
              syncProposalsData = syncProposals || [];
            }
          }

          // Fetch custom sync requests for these producers (where they are the preferred producer)
          let customSyncRequestsData: any[] = [];
          const producerIds = producersNotInAnalytics.map(p => p.id);
          if (producerIds.length > 0) {
            const { data: customSyncRequests, error: customSyncRequestsError } = await supabase
              .from('custom_sync_requests')
              .select('id, preferred_producer_id, sync_fee, status')
              .in('preferred_producer_id', producerIds)
              .eq('status', 'completed');

            if (customSyncRequestsError) {
              console.error('Error fetching custom sync requests for producers:', customSyncRequestsError);
            } else {
              customSyncRequestsData = customSyncRequests || [];
            }
          }

          // Calculate analytics for producers not in the function
          producersNotInAnalytics.forEach(producer => {
            const producerTracks = tracksData?.filter(t => t.track_producer_id === producer.id) || [];
            const producerTrackIds = producerTracks.map(t => t.id);
            const producerSales = salesData.filter(s => producerTrackIds.includes(s.track_id));
            const producerSyncProposals = syncProposalsData.filter(sp => producerTrackIds.includes(sp.track_id));
            const producerCustomSyncRequests = customSyncRequestsData.filter(csr => csr.preferred_producer_id === producer.id);

            producerAnalyticsMap[producer.id] = {
              total_tracks: producerTracks.length,
              total_sales: producerSales.length + producerSyncProposals.length + producerCustomSyncRequests.length,
              total_revenue: 
                producerSales.reduce((sum, sale) => sum + (sale.amount || 0), 0) +
                producerSyncProposals.reduce((sum, proposal) => sum + (proposal.sync_fee || 0), 0) +
                producerCustomSyncRequests.reduce((sum, request) => sum + (request.sync_fee || 0), 0)
            };
          });
        }

        // Map producer users to include their analytics
        const transformedProducers = producerUsers.map(producer => {
          const analytics = producerAnalyticsMap[producer.id] || {
            total_tracks: 0,
            total_sales: 0,
            total_revenue: 0
          };
          
          return {
            id: producer.id,
            email: producer.email,
            first_name: producer.first_name,
            last_name: producer.last_name,
            account_type: 'producer' as const,
            created_at: producer.created_at,
            producer_number: producer.producer_number,
            total_tracks: analytics.total_tracks,
            total_sales: analytics.total_sales,
            total_revenue: analytics.total_revenue
          };
        });

        setProducers(transformedProducers);
      }

    } catch (err) {
      console.error('Error fetching admin data:', err);
      setError('Failed to load dashboard data. Please try refreshing the page.');
    } finally {
      setLoading(false);
    }
  };

  // White Label Admin Functions
  const fetchWhiteLabelClients = async () => {
    setWhiteLabelLoading(true);
    setWhiteLabelError(null);
    try {
      const { data, error } = await supabase
        .from('white_label_clients')
        .select(`
          *,
          owner:profiles!white_label_clients_owner_id_fkey(
            email,
            first_name,
            last_name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWhiteLabelClients(data || []);
    } catch (error) {
      console.error('Error fetching white label clients:', error);
      setWhiteLabelError('Failed to fetch white label clients');
    } finally {
      setWhiteLabelLoading(false);
    }
  };

  const createWhiteLabelClient = async () => {
    if (!newClient.display_name || !newClient.owner_email) {
      setWhiteLabelError('Display name and email are required');
      return;
    }

    // Generate a random temporary password
    const generateTempPassword = () => {
      // 12 chars, alphanumeric + special
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
      let pwd = '';
      for (let i = 0; i < 12; i++) {
        pwd += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return pwd;
    };
    const tempPassword = generateTempPassword();

    const emailLower = newClient.owner_email.toLowerCase();
    // Create Supabase Auth user via Edge Function
    let authUserId = null;
    let userCreated = false;
    try {
      // Use Supabase Auth client to create the user directly
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: emailLower,
        password: tempPassword,
      });
      if (signUpError && !signUpError.message.includes('User already registered')) {
        setWhiteLabelError('Failed to create auth user: ' + signUpError.message);
        return;
      }
      if (data?.user) {
        authUserId = data.user.id;
        userCreated = true;
      }
      // If user already exists, fetch their id
      if (!authUserId) {
        const { data: userData, error: userFetchError } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', emailLower)
          .maybeSingle();
        if (userFetchError || !userData) {
          setWhiteLabelError('Failed to find or create user.');
          return;
        }
        authUserId = userData.id;
      }
      // Insert into profiles if not exists
      if (userCreated) {
        await supabase.from('profiles').insert({
          id: authUserId,
          email: emailLower,
          first_name: newClient.display_name,
          account_type: 'white_label',
        });
      } else {
        // If user exists, update account_type if not already set
        await supabase.from('profiles').update({
          account_type: 'white_label',
          first_name: newClient.display_name,
        }).eq('id', authUserId);
      }
    } catch (err) {
      console.error('Error creating auth user:', err);
      setWhiteLabelError('Failed to create auth user.');
      return;
    }

    // Insert into white_label_clients
    const payload = {
      display_name: newClient.display_name,
      owner_email: emailLower,
      owner_id: authUserId,
      domain: newClient.domain,
      primary_color: newClient.primary_color,
      secondary_color: newClient.secondary_color,
      password_setup_required: true,
      temp_password: tempPassword, // Store temp password
    };

    const { error } = await supabase
      .from('white_label_clients')
      .insert(payload);

    if (error) {
      setWhiteLabelError(error.message || 'Failed to create white label client');
      // Optionally: clean up auth user
      return;
    }

    // Reset form and refresh data
    setNewClient({
      display_name: '',
      owner_email: '',
      domain: '',
      primary_color: '#6366f1',
      secondary_color: '#8b5cf6'
    });
    setShowAddClientModal(false);
    setActiveTab('white_label');
    fetchWhiteLabelClients();
    // Show the generated password to the admin (for now, use alert)
    alert(`Temporary password for ${payload.owner_email}: ${tempPassword}\nShare this with the client. They will be required to change it on first login.`);
    // Navigate to the white label client dashboard for new white label clients
    navigate('/white-label-dashboard');
  };

  const updateWhiteLabelClient = async (client: WhiteLabelClient) => {
    try {
      const { error } = await supabase
        .from('white_label_clients')
        .update({
          display_name: client.display_name,
          domain: client.domain,
          primary_color: client.primary_color,
          secondary_color: client.secondary_color
        })
        .eq('id', client.id);

      if (error) throw error;
      setEditingClient(null);
      fetchWhiteLabelClients();
    } catch (error) {
      console.error('Error updating white label client:', error);
      setWhiteLabelError('Failed to update white label client');
    }
  };

  const deleteWhiteLabelClient = async (clientId: string) => {
    if (!confirm('Are you sure you want to delete this white label client? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('white_label_clients')
        .delete()
        .eq('id', clientId);

      if (error) throw error;
      fetchWhiteLabelClients();
    } catch (error) {
      console.error('Error deleting white label client:', error);
      setWhiteLabelError('Failed to delete white label client');
    }
  };

  const handleProducerSort = (field: keyof UserDetails) => {
    if (producerSortField === field) {
      setProducerSortOrder(producerSortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setProducerSortField(field);
      setProducerSortOrder('asc');
    }
  };

  const filteredProducers = producers
    .filter(producer => {
      if (!searchQuery) return true;
      const searchLower = searchQuery.toLowerCase();
      return (
        producer.email.toLowerCase().includes(searchLower) ||
        (producer.first_name?.toLowerCase() || '').includes(searchLower) ||
        (producer.last_name?.toLowerCase() || '').includes(searchLower) ||
        (producer.producer_number?.toLowerCase() || '').includes(searchLower)
      );
    })
    .sort((a, b) => {
      const aValue = a[producerSortField];
      const bValue = b[producerSortField];
      const modifier = producerSortOrder === 'asc' ? 1 : -1;

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return aValue.localeCompare(bValue) * modifier;
      }
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return (aValue - bValue) * modifier;
      }
      return 0;
    });

  const handleDownloadRevenuePDF = async () => {
    // Fetch logo from site_settings (same as header)
    let logoUrl = null;
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'logo_url')
        .single();
      if (!error && data) {
        logoUrl = data.value;
      }
    } catch (e) {
      // fallback: no logo
    }
    const companyName = editingClient?.display_name || 'MyBeatFi';
    const domain = editingClient?.domain || 'www.mybeatfi.com';
    const email = editingClient?.owner?.email || 'info@mybeatfi.io';
    // PDF setup
    const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 40;
    const contentWidth = pageWidth - (margin * 2);
    let y = 0;
    // Blue header bar
    doc.setFillColor(30, 41, 59); // #1e293b
    doc.rect(0, 0, pageWidth, 80, 'F');
    y = 40;
    // Logo in header
    if (logoUrl) {
      try {
        const img = await fetch(logoUrl).then(r => r.blob());
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(img);
        });
        doc.addImage(base64, 'PNG', margin, y-20, 80, 32, undefined, 'FAST');
      } catch (error) {
        // ignore logo error
      }
    }
    // Title in header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(26);
    doc.setTextColor(255,255,255);
    doc.text('Comprehensive Revenue Report', margin+100, y, { align: 'left' });
    // Subtitle
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(13);
    doc.setTextColor(220,220,220);
    doc.text('This report provides a comprehensive breakdown of revenue and business metrics.', margin+100, y+22, { align: 'left' });
    // Date
    doc.setFontSize(10);
    doc.setTextColor(200,200,200);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, margin+100, y+38, { align: 'left' });
    // White background for content
    doc.setFillColor(255,255,255);
    doc.rect(0, 80, pageWidth, pageHeight-80, 'F');
    y = 110;
    // Section Divider
    doc.setDrawColor(90, 90, 180);
    doc.setLineWidth(1);
    doc.line(margin, y, pageWidth - margin, y);
    y += 20;
    // Revenue Summary Table
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(30, 30, 30);
    doc.text('Revenue Breakdown', margin, y);
    y += 20;
    // Table headers (fit 5 columns in contentWidth)
    const colWidths = [110, 70, 90, 70, 90];
    const colX = [margin, margin+colWidths[0], margin+colWidths[0]+colWidths[1], margin+colWidths[0]+colWidths[1]+colWidths[2], margin+colWidths[0]+colWidths[1]+colWidths[2]+colWidths[3]];
    doc.setFontSize(10);
    doc.setFillColor(230, 230, 230);
    doc.rect(margin, y, contentWidth, 18, 'F');
    doc.setTextColor(30, 30, 30);
    doc.text('Category', colX[0]+4, y + 12);
    doc.text('Paid', colX[1]+4, y + 12);
    doc.text('Paid $', colX[2]+4, y + 12);
    doc.text('Pending', colX[3]+4, y + 12);
    doc.text('Pending $', colX[4]+4, y + 12);
    y += 22;
    // Table rows
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(30, 30, 30);
    // Helper for truncation
    const fitText = (text: string, maxWidth: number) => {
      if (doc.getTextWidth(text) <= maxWidth) return text;
      let truncated = text;
      while (doc.getTextWidth(truncated + '…') > maxWidth && truncated.length > 0) {
        truncated = truncated.slice(0, -1);
      }
      return truncated + '…';
    };
    // Track Sales
    doc.text(fitText('Track Sales', colWidths[0]-8), colX[0]+4, y + 12);
    doc.text(stats.track_sales_count.toString(), colX[1]+4, y + 12, { align: 'left' });
    doc.text(`$${stats.track_sales_amount.toFixed(2)}`, colX[2]+4, y + 12, { align: 'left' });
    doc.text('-', colX[3]+4, y + 12, { align: 'left' });
    doc.text('-', colX[4]+4, y + 12, { align: 'left' });
    y += 18;
    // Sync Proposals
    doc.text(fitText('Sync Proposals', colWidths[0]-8), colX[0]+4, y + 12);
    doc.text(stats.sync_proposals_paid_count.toString(), colX[1]+4, y + 12, { align: 'left' });
    doc.text(`$${stats.sync_proposals_paid_amount.toFixed(2)}`, colX[2]+4, y + 12, { align: 'left' });
    doc.text(stats.sync_proposals_pending_count.toString(), colX[3]+4, y + 12, { align: 'left' });
    doc.text(`$${stats.sync_proposals_pending_amount.toFixed(2)}`, colX[4]+4, y + 12, { align: 'left' });
    y += 18;
    // Custom Syncs
    doc.text(fitText('Custom Syncs', colWidths[0]-8), colX[0]+4, y + 12);
    doc.text(stats.custom_syncs_paid_count.toString(), colX[1]+4, y + 12, { align: 'left' });
    doc.text(`$${stats.custom_syncs_paid_amount.toFixed(2)}`, colX[2]+4, y + 12, { align: 'left' });
    doc.text(stats.custom_syncs_pending_count.toString(), colX[3]+4, y + 12, { align: 'left' });
    doc.text(`$${stats.custom_syncs_pending_amount.toFixed(2)}`, colX[4]+4, y + 12, { align: 'left' });
    y += 18;
    // White Label Setup Fees
    doc.text(fitText('White Label Setup', colWidths[0]-8), colX[0]+4, y + 12);
    doc.text(stats.white_label_setup_count.toString(), colX[1]+4, y + 12, { align: 'left' });
    doc.text(`$${stats.white_label_setup_amount.toFixed(2)}`, colX[2]+4, y + 12, { align: 'left' });
    doc.text('-', colX[3]+4, y + 12, { align: 'left' });
    doc.text('-', colX[4]+4, y + 12, { align: 'left' });
    y += 18;
    // White Label Subscriptions
    doc.text(fitText('White Label Monthly', colWidths[0]-8), colX[0]+4, y + 12);
    doc.text(stats.white_label_subscriptions_count.toString(), colX[1]+4, y + 12, { align: 'left' });
    doc.text(`$${stats.white_label_monthly_amount.toFixed(2)}`, colX[2]+4, y + 12, { align: 'left' });
    doc.text('-', colX[3]+4, y + 12, { align: 'left' });
    doc.text('-', colX[4]+4, y + 12, { align: 'left' });
    y += 22;
    // Totals row
    doc.setFont('helvetica', 'bold');
    doc.setFillColor(210, 210, 210);
    doc.rect(margin, y, contentWidth, 18, 'F');
    doc.setTextColor(30, 30, 30);
    doc.text('Totals', colX[0]+4, y + 12);
    doc.text((stats.track_sales_count + stats.sync_proposals_paid_count + stats.custom_syncs_paid_count + stats.white_label_setup_count + stats.white_label_subscriptions_count).toString(), colX[1]+4, y + 12, { align: 'left' });
    doc.text(`$${(stats.track_sales_amount + stats.sync_proposals_paid_amount + stats.custom_syncs_paid_amount + stats.white_label_setup_amount + stats.white_label_monthly_amount).toFixed(2)}`, colX[2]+4, y + 12, { align: 'left' });
    doc.text((stats.sync_proposals_pending_count + stats.custom_syncs_pending_count).toString(), colX[3]+4, y + 12, { align: 'left' });
    doc.text(`$${(stats.sync_proposals_pending_amount + stats.custom_syncs_pending_amount).toFixed(2)}`, colX[4]+4, y + 12, { align: 'left' });
    y += 30;
    // Business Metrics
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(30, 30, 30);
    doc.text('Business Metrics', margin, y);
    y += 20;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(30, 30, 30);
    doc.text(`Total Producers: ${stats.total_producers}`, margin, y);
    y += 16;
    doc.text(`Total Clients: ${stats.total_clients}`, margin, y);
    y += 16;
    doc.text(`New Memberships (This Period): ${stats.new_memberships_count || 0}`, margin, y);
    // Footer with branding
    const footerY = pageHeight - 60;
    doc.setDrawColor(90, 90, 180);
    doc.setLineWidth(1);
    doc.line(margin, footerY, pageWidth - margin, footerY);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(90, 90, 180);
    doc.text(companyName || '', margin, footerY + 20);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(90, 90, 180);
    doc.text(`Website: ${domain || ''}`, margin, footerY + 35);
    doc.text(`Email: ${email || ''}`, margin, footerY + 50);
    // Download PDF
    doc.save('comprehensive-revenue-report.pdf');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-400 text-center font-medium">{error}</p>
          </div>
        )}

        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
            {profile && (
              <p className="text-xl text-gray-300 mt-2">
                Welcome {profile.first_name || profile.email.split('@')[0]}
              </p>
            )}
          </div>
          <button
            onClick={() => setShowLogoUpload(!showLogoUpload)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center"
          >
            <Upload className="w-4 h-4 mr-2" />
            Change Logo
          </button>
        </div>

        {showLogoUpload && <LogoUpload />}

        {/* Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/5 backdrop-blur-sm p-6 rounded-xl border border-blue-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400">Total Clients</p>
                <p className="text-3xl font-bold text-white">{stats.total_clients}</p>
              </div>
              <Users className="w-12 h-12 text-blue-500" />
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm p-6 rounded-xl border border-blue-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400">Total Producers</p>
                <p className="text-3xl font-bold text-white">{stats.total_producers}</p>
              </div>
              <Users className="w-12 h-12 text-blue-500" />
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm p-6 rounded-xl border border-blue-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400">Total Sales</p>
                <p className="text-3xl font-bold text-white">{stats.total_sales}</p>
              </div>
              <BarChart3 className="w-12 h-12 text-blue-500" />
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm p-6 rounded-xl border border-blue-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400">Total Revenue (Current Month)</p>
                <p className="text-3xl font-bold text-white flex items-center gap-2">
                  ${stats.total_revenue.toFixed(2)}
                  <button
                    onClick={handleDownloadRevenuePDF}
                    title="Download PDF"
                    className="ml-2 p-1 rounded hover:bg-blue-600/30 transition-colors"
                  >
                    <Download className="w-5 h-5 text-blue-400" />
                  </button>
                </p>
              </div>
              <div 
                className="relative cursor-pointer group" 
                onClick={() => setShowRevenueBreakdown(true)}
                title="View revenue breakdown"
              >
                <DollarSign className="w-12 h-12 text-green-500" />
                <PieChart className="w-5 h-5 text-blue-400 absolute -bottom-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute -bottom-6 right-0 text-xs text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  Click for details
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Comprehensive Revenue Report Section */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-blue-500/20 p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">Comprehensive Revenue Report</h2>
            <button
              onClick={handleDownloadRevenuePDF}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download PDF
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-blue-500/20">
                  <th className="text-left py-3 px-4 text-gray-300 font-semibold">Category</th>
                  <th className="text-right py-3 px-4 text-gray-300 font-semibold">Paid Count</th>
                  <th className="text-right py-3 px-4 text-gray-300 font-semibold">Paid Amount</th>
                  <th className="text-right py-3 px-4 text-gray-300 font-semibold">Pending Count</th>
                  <th className="text-right py-3 px-4 text-gray-300 font-semibold">Pending Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-blue-500/10">
                  <td className="py-3 px-4 text-white">Track Sales</td>
                  <td className="py-3 px-4 text-right text-white">{stats.track_sales_count}</td>
                  <td className="py-3 px-4 text-right text-green-400">${stats.track_sales_amount.toFixed(2)}</td>
                  <td className="py-3 px-4 text-right text-gray-400">-</td>
                  <td className="py-3 px-4 text-right text-gray-400">-</td>
                </tr>
                <tr className="border-b border-blue-500/10">
                  <td className="py-3 px-4 text-white">Sync Proposals</td>
                  <td className="py-3 px-4 text-right text-white">{stats.sync_proposals_paid_count}</td>
                  <td className="py-3 px-4 text-right text-green-400">${stats.sync_proposals_paid_amount.toFixed(2)}</td>
                  <td className="py-3 px-4 text-right text-yellow-400">{stats.sync_proposals_pending_count}</td>
                  <td className="py-3 px-4 text-right text-yellow-400">${stats.sync_proposals_pending_amount.toFixed(2)}</td>
                </tr>
                <tr className="border-b border-blue-500/10">
                  <td className="py-3 px-4 text-white">Custom Syncs</td>
                  <td className="py-3 px-4 text-right text-white">{stats.custom_syncs_paid_count}</td>
                  <td className="py-3 px-4 text-right text-green-400">${stats.custom_syncs_paid_amount.toFixed(2)}</td>
                  <td className="py-3 px-4 text-right text-yellow-400">{stats.custom_syncs_pending_count}</td>
                  <td className="py-3 px-4 text-right text-yellow-400">${stats.custom_syncs_pending_amount.toFixed(2)}</td>
                </tr>
                <tr className="border-b border-blue-500/10">
                  <td className="py-3 px-4 text-white">White Label Setup</td>
                  <td className="py-3 px-4 text-right text-white">{stats.white_label_setup_count}</td>
                  <td className="py-3 px-4 text-right text-green-400">${stats.white_label_setup_amount.toFixed(2)}</td>
                  <td className="py-3 px-4 text-right text-gray-400">-</td>
                  <td className="py-3 px-4 text-right text-gray-400">-</td>
                </tr>
                <tr className="border-b border-blue-500/10">
                  <td className="py-3 px-4 text-white">White Label Monthly</td>
                  <td className="py-3 px-4 text-right text-white">{stats.white_label_subscriptions_count}</td>
                  <td className="py-3 px-4 text-right text-green-400">${stats.white_label_monthly_amount.toFixed(2)}</td>
                  <td className="py-3 px-4 text-right text-gray-400">-</td>
                  <td className="py-3 px-4 text-right text-gray-400">-</td>
                </tr>
                <tr className="border-t-2 border-blue-500/30 bg-blue-500/5">
                  <td className="py-3 px-4 text-white font-semibold">Totals</td>
                  <td className="py-3 px-4 text-right text-white font-semibold">
                    {stats.track_sales_count + stats.sync_proposals_paid_count + stats.custom_syncs_paid_count + stats.white_label_setup_count + stats.white_label_subscriptions_count}
                  </td>
                  <td className="py-3 px-4 text-right text-green-400 font-semibold">
                    ${(stats.track_sales_amount + stats.sync_proposals_paid_amount + stats.custom_syncs_paid_amount + stats.white_label_setup_amount + stats.white_label_monthly_amount).toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-right text-yellow-400 font-semibold">
                    {stats.sync_proposals_pending_count + stats.custom_syncs_pending_count}
                  </td>
                  <td className="py-3 px-4 text-right text-yellow-400 font-semibold">
                    ${(stats.sync_proposals_pending_amount + stats.custom_syncs_pending_amount).toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 pt-6 border-t border-blue-500/20">
            <div className="text-center">
              <p className="text-gray-400 text-sm">Total Producers</p>
              <p className="text-2xl font-bold text-white">{stats.total_producers}</p>
            </div>
            <div className="text-center">
              <p className="text-gray-400 text-sm">Total Clients</p>
              <p className="text-2xl font-bold text-white">{stats.total_clients}</p>
            </div>
            <div className="text-center">
              <p className="text-gray-400 text-sm">New Memberships (This Period)</p>
              <p className="text-2xl font-bold text-white">{stats.new_memberships_count || 0}</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap border-b border-blue-500/20 mb-8">
          {[
            { id: 'analytics', label: 'Analytics', icon: null },
            { id: 'advanced_analytics', label: 'Advanced Analytics', icon: <BarChart3 className="w-4 h-4 mr-2" /> },
            { id: 'producers', label: 'Producers', icon: null },
            { id: 'clients', label: 'Clients', icon: null },
            { id: 'announcements', label: 'Announcements', icon: <Bell className="w-4 h-4 mr-2" /> },
            { id: 'compensation', label: 'Compensation', icon: <Percent className="w-4 h-4 mr-2" /> },
            { id: 'discounts', label: 'Discounts', icon: <Percent className="w-4 h-4 mr-2" /> },
            { id: 'white_label', label: 'White Label Clients', icon: null },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-6 py-3 font-medium transition-colors ${tab.icon ? 'flex items-center' : ''} ${
                activeTab === tab.id 
                  ? 'text-white border-b-2 border-blue-500' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Analytics Sections */}
        {activeTab === 'analytics' && (
          <div className="space-y-12">
            {/* Proposal Analytics */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-blue-500/20 p-6">
              <h2 className="text-2xl font-bold text-white mb-6">Sync Proposal Analytics</h2>
              <ProposalAnalytics />
            </div>

            {/* Custom Sync Analytics */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-blue-500/20 p-6">
              <h2 className="text-2xl font-bold text-white mb-6">Custom Sync Analytics</h2>
              <CustomSyncAnalytics />
            </div>
          </div>
        )}

        {/* Advanced Analytics Section */}
        {activeTab === 'advanced_analytics' && (
          <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-blue-500/20 p-6">
            <h2 className="text-2xl font-bold text-white mb-6">Advanced Analytics Dashboard</h2>
            <AdvancedAnalyticsDashboard />
          </div>
        )}

        {/* Producer List */}
        {activeTab === 'producers' && (
          <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-purple-500/20 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Producer Analytics</h2>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search producers..."
                    className="pl-10 pr-4 py-2 bg-white/5 border border-purple-500/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <Link
                  to="/admin/banking"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center"
                >
                  <DollarSign className="w-5 h-5 mr-2" />
                  Manage Payments
                </Link>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-black/20">
                    <th className="px-6 py-3 text-left">
                      <button
                        onClick={() => handleProducerSort('first_name')}
                        className="flex items-center text-sm font-semibold text-gray-300 hover:text-white"
                      >
                        <Users className="w-4 h-4 mr-2" />
                        Producer
                        {producerSortField === 'first_name' && (
                          <span className="ml-1">{producerSortOrder === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left">
                      <button
                        onClick={() => handleProducerSort('producer_number')}
                        className="flex items-center text-sm font-semibold text-gray-300 hover:text-white"
                      >
                        ID
                        {producerSortField === 'producer_number' && (
                          <span className="ml-1">{producerSortOrder === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left">
                      <button
                        onClick={() => handleProducerSort('total_tracks')}
                        className="flex items-center text-sm font-semibold text-gray-300 hover:text-white"
                      >
                        <Music className="w-4 h-4 mr-2" />
                        Tracks
                        {producerSortField === 'total_tracks' && (
                          <span className="ml-1">{producerSortOrder === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left">
                      <button
                        onClick={() => handleProducerSort('total_sales')}
                        className="flex items-center text-sm font-semibold text-gray-300 hover:text-white"
                      >
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Sales
                        {producerSortField === 'total_sales' && (
                          <span className="ml-1">{producerSortOrder === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left">
                      <button
                        onClick={() => handleProducerSort('total_revenue')}
                        className="flex items-center text-sm font-semibold text-gray-300 hover:text-white"
                      >
                        <DollarSign className="w-4 h-4 mr-2" />
                        Revenue
                        {producerSortField === 'total_revenue' && (
                          <span className="ml-1">{producerSortOrder === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left">
                      <button
                        onClick={() => handleProducerSort('created_at')}
                        className="flex items-center text-sm font-semibold text-gray-300 hover:text-white"
                      >
                        <Calendar className="w-4 h-4 mr-2" />
                        Joined
                        {producerSortField === 'created_at' && (
                          <span className="ml-1">{producerSortOrder === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-500/10">
                  {filteredProducers.map((producer) => (
                    <tr
                      key={producer.id}
                      className="hover:bg-white/5 cursor-pointer transition-colors"
                      onClick={() => setSelectedProducer(producer)}
                    >
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-white font-medium">
                            {producer.first_name && producer.last_name
                              ? `${producer.first_name} ${producer.last_name}`
                              : producer.email.split('@')[0]}
                          </p>
                          <p className="text-sm text-gray-400">{producer.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-300">
                        {producer.producer_number || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-gray-300">{producer.total_tracks || 0}</td>
                      <td className="px-6 py-4 text-gray-300">{producer.total_sales || 0}</td>
                      <td className="px-6 py-4 text-gray-300">
                        ${(producer.total_revenue || 0).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-gray-300">
                        {new Date(producer.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Client List section */}
        {activeTab === 'clients' && (
          <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-purple-500/20 p-6">
            <ClientList />
          </div>
        )}



        {/* Announcements Management */}
        {activeTab === 'announcements' && (
          <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-purple-500/20 p-6">
            <AdminAnnouncementManager />
          </div>
        )}

        {/* Compensation Settings */}
        {activeTab === 'compensation' && (
          <CompensationSettings />
        )}

        {/* Discount Management */}
        {activeTab === 'discounts' && (
          <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-purple-500/20 p-6">
            <DiscountManagement />
          </div>
        )}
      </div>
        {/* White Label Admin Panel */}
        {activeTab === 'white_label' && (
          <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-purple-500/20 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">White Label Clients</h2>
              <button
                onClick={() => setShowAddClientModal(true)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add New Client
              </button>
            </div>

            {whiteLabelError && (
              <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-red-400 text-center font-medium">{whiteLabelError}</p>
              </div>
            )}

            {whiteLabelLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-black/20">
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Client Name</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Owner</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Domain</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Colors</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Created</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">AI Search</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Onboarding</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Deep Media</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-purple-500/10">
                    {whiteLabelClients.map((client) => (
                      <tr key={client.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            {client.logo_url && (
                              <img 
                                src={client.logo_url} 
                                alt={client.display_name}
                                className="w-8 h-8 rounded-full mr-3 object-cover"
                              />
                            )}
                            <div>
                              <p className="text-white font-medium">{client.display_name}</p>
                              <p className="text-sm text-gray-400">ID: {client.id.slice(0, 8)}...</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-white">
                              {client.owner?.first_name && client.owner?.last_name
                                ? `${client.owner.first_name} ${client.owner.last_name}`
                                : client.owner?.email || 'Unknown'}
                            </p>
                            <p className="text-sm text-gray-400">{client.owner?.email}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {client.domain ? (
                            <a 
                              href={`https://${client.domain}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:text-blue-300 flex items-center"
                            >
                              <Globe className="w-4 h-4 mr-1" />
                              {client.domain}
                            </a>
                          ) : (
                            <span className="text-gray-500">No domain</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <div 
                              className="w-6 h-6 rounded border border-white/20"
                              style={{ backgroundColor: client.primary_color }}
                              title={`Primary: ${client.primary_color}`}
                            />
                            <div 
                              className="w-6 h-6 rounded border border-white/20"
                              style={{ backgroundColor: client.secondary_color }}
                              title={`Secondary: ${client.secondary_color}`}
                            />
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-300">
                          {new Date(client.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <input
                            type="checkbox"
                            checked={!!client.ai_search_assistance_enabled}
                            onChange={async (e: React.ChangeEvent<HTMLInputElement>) => {
                              await supabase.from('white_label_clients').update({ ai_search_assistance_enabled: e.target.checked }).eq('id', client.id);
                              fetchWhiteLabelClients();
                            }}
                          />
                        </td>
                        <td className="px-6 py-4 text-center">
                          <input
                            type="checkbox"
                            checked={!!client.producer_onboarding_enabled}
                            onChange={async (e: React.ChangeEvent<HTMLInputElement>) => {
                              await supabase.from('white_label_clients').update({ producer_onboarding_enabled: e.target.checked }).eq('id', client.id);
                              fetchWhiteLabelClients();
                            }}
                          />
                        </td>
                        <td className="px-6 py-4 text-center">
                          <input
                            type="checkbox"
                            checked={!!client.deep_media_search_enabled}
                            onChange={async (e: React.ChangeEvent<HTMLInputElement>) => {
                              await supabase.from('white_label_clients').update({ deep_media_search_enabled: e.target.checked }).eq('id', client.id);
                              fetchWhiteLabelClients();
                            }}
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => setEditingClient(client)}
                              className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded transition-colors"
                              title="Edit client"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteWhiteLabelClient(client.id)}
                              className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors"
                              title="Delete client"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {whiteLabelClients.length === 0 && (
                  <div className="text-center py-8 text-gray-400">
                    <Globe className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No white label clients found</p>
                    <p className="text-sm">Click "Add New Client" to create your first white label client</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}


      {/* Producer Analytics Modal */}
      {selectedProducer && (
        <ProducerAnalyticsModal
          isOpen={true}
          onClose={() => setSelectedProducer(null)}
          producerId={selectedProducer.id}
          producerName={
            selectedProducer.first_name && selectedProducer.last_name
              ? `${selectedProducer.first_name} ${selectedProducer.last_name}`
              : selectedProducer.email.split('@')[0]
          }
        />
      )}
      
      {/* Revenue Breakdown Dialog */}
      <RevenueBreakdownDialog
        isOpen={showRevenueBreakdown}
        onClose={() => setShowRevenueBreakdown(false)}
      />

      {/* Add White Label Client Modal */}
      {showAddClientModal && (
        <div className="fixed inset-0 bg-blue-900/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl border border-purple-500/20 p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Add White Label Client</h3>
              <button
                onClick={() => setShowAddClientModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={e => { e.preventDefault(); createWhiteLabelClient(); }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Display Name *
                </label>
                <input
                  type="text"
                  value={newClient.display_name}
                  onChange={(e) => setNewClient({ ...newClient, display_name: e.target.value })}
                  className="w-full px-3 py-2 bg-white/5 border border-purple-500/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                  placeholder="Enter client display name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Owner Email *
                </label>
                <input
                  type="email"
                  value={newClient.owner_email}
                  onChange={(e) => setNewClient({ ...newClient, owner_email: e.target.value })}
                  className="w-full px-3 py-2 bg-white/5 border border-purple-500/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                  placeholder="Enter owner email address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Domain (Optional)
                </label>
                <input
                  type="text"
                  value={newClient.domain}
                  onChange={(e) => setNewClient({ ...newClient, domain: e.target.value })}
                  className="w-full px-3 py-2 bg-white/5 border border-purple-500/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                  placeholder="example.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Primary Color
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={newClient.primary_color}
                      onChange={(e) => setNewClient({ ...newClient, primary_color: e.target.value })}
                      className="w-12 h-10 rounded border border-purple-500/20"
                    />
                    <input
                      type="text"
                      value={newClient.primary_color}
                      onChange={(e) => setNewClient({ ...newClient, primary_color: e.target.value })}
                      className="flex-1 px-3 py-2 bg-white/5 border border-purple-500/20 rounded-lg text-white text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Secondary Color
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={newClient.secondary_color}
                      onChange={(e) => setNewClient({ ...newClient, secondary_color: e.target.value })}
                      className="w-12 h-10 rounded border border-purple-500/20"
                    />
                    <input
                      type="text"
                      value={newClient.secondary_color}
                      onChange={(e) => setNewClient({ ...newClient, secondary_color: e.target.value })}
                      className="flex-1 px-3 py-2 bg-white/5 border border-purple-500/20 rounded-lg text-white text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddClientModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                >
                  Create Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit White Label Client Modal */}
      {editingClient && (
        <div className="fixed inset-0 bg-blue-900/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl border border-purple-500/20 p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Edit White Label Client</h3>
              <button
                onClick={() => setEditingClient(null)}
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
                  value={editingClient.display_name}
                  onChange={(e) => setEditingClient({ ...editingClient, display_name: e.target.value })}
                  className="w-full px-3 py-2 bg-white/5 border border-purple-500/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                  placeholder="Enter client display name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Domain (Optional)
                </label>
                <input
                  type="text"
                  value={editingClient.domain || ''}
                  onChange={(e) => setEditingClient({ ...editingClient, domain: e.target.value })}
                  className="w-full px-3 py-2 bg-white/5 border border-purple-500/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                  placeholder="example.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Primary Color
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={editingClient.primary_color || '#6366f1'}
                      onChange={(e) => setEditingClient({ ...editingClient, primary_color: e.target.value })}
                      className="w-12 h-10 rounded border border-purple-500/20"
                    />
                    <input
                      type="text"
                      value={editingClient.primary_color || '#6366f1'}
                      onChange={(e) => setEditingClient({ ...editingClient, primary_color: e.target.value })}
                      className="flex-1 px-3 py-2 bg-white/5 border border-purple-500/20 rounded-lg text-white text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Secondary Color
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={editingClient.secondary_color || '#8b5cf6'}
                      onChange={(e) => setEditingClient({ ...editingClient, secondary_color: e.target.value })}
                      className="w-12 h-10 rounded border border-purple-500/20"
                    />
                    <input
                      type="text"
                      value={editingClient.secondary_color || '#8b5cf6'}
                      onChange={(e) => setEditingClient({ ...editingClient, secondary_color: e.target.value })}
                      className="flex-1 px-3 py-2 bg-white/5 border border-purple-500/20 rounded-lg text-white text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => setEditingClient(null)}
                  className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => updateWhiteLabelClient(editingClient)}
                  className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                >
                  Update Client
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
