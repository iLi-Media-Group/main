import React, { useState, useEffect } from 'react';
import { Users, DollarSign, BarChart3, Upload, X, Mail, Calendar, ArrowUpDown, Music, Plus, Percent, Trash2, Search, Bell, Download, PieChart } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { LogoUpload } from './LogoUpload';
import { useAuth } from '../contexts/AuthContext';
import { ProposalAnalytics } from './ProposalAnalytics';
import { CustomSyncAnalytics } from './CustomSyncAnalytics';
import { ProducerAnalyticsModal } from './ProducerAnalyticsModal';
import { RevenueBreakdownDialog } from './RevenueBreakdownDialog';
import { ClientList } from './ClientList';

import { AdminAnnouncementManager } from './AdminAnnouncementManager';
import { CompensationSettings } from './CompensationSettings';
import { Link } from 'react-router-dom';

interface UserStats {
  total_clients: number;
  total_producers: number;
  total_sales: number;
  total_revenue: number;
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

export function AdminDashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<{ first_name?: string, email: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<UserStats>({
    total_clients: 0,
    total_producers: 0,
    total_sales: 0,
    total_revenue: 0
  });
  const [showLogoUpload, setShowLogoUpload] = useState(false);
  const [producers, setProducers] = useState<UserDetails[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [producerSortField, setProducerSortField] = useState<keyof UserDetails>('total_revenue');
  const [producerSortOrder, setProducerSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedProducer, setSelectedProducer] = useState<UserDetails | null>(null);
  const [showRevenueBreakdown, setShowRevenueBreakdown] = useState(false);
  const [activeTab, setActiveTab] = useState<'analytics' | 'producers' | 'clients' | 'announcements' | 'compensation' | 'white_label'>('analytics');

  useEffect(() => {
    if (user) {
      fetchData();
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
      setStats(prev => ({
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
        setStats(prev => ({
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

        // 3. Custom sync request sales (from custom_sync_requests table)
        const { data: customSyncData, error: customSyncError } = await supabase
          .from('custom_sync_requests')
          .select('sync_fee, created_at, status')
          .gte('created_at', `${currentMonth}-01`)
          .lt('created_at', new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString())
          .eq('status', 'completed');

        if (customSyncError) {
          console.error('Error fetching custom sync requests:', customSyncError);
        }

        // Fetch track sales data
        const { data: trackSalesData, error: trackSalesError } = await supabase
          .from('sales')
          .select('id, amount, created_at')
          .gte('created_at', `${currentMonth}-01`)
          .lt('created_at', new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString());

        if (trackSalesError) {
          console.error('Error fetching track sales:', trackSalesError);
        }

        // Fetch sync proposals data
        const { data: syncProposalsData, error: syncProposalsError } = await supabase
          .from('sync_proposals')
          .select('id, sync_fee, created_at, status')
          .gte('created_at', `${currentMonth}-01`)
          .lt('created_at', new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString())
          .eq('status', 'accepted');

        if (syncProposalsError) {
          console.error('Error fetching sync proposals:', syncProposalsError);
        }

        // Calculate total sales and revenue
        const trackSales = trackSalesData || [];
        const syncProposals = syncProposalsData || [];
        const customSyncRequests = customSyncData || [];

        const totalSales = trackSales.length + syncProposals.length + customSyncRequests.length;
        const totalRevenue = 
          (trackSales.reduce((sum, sale) => sum + (sale.amount || 0), 0)) +
          (syncProposals.reduce((sum, proposal) => sum + (proposal.sync_fee || 0), 0)) +
          (customSyncRequests.reduce((sum, request) => sum + (request.sync_fee || 0), 0));

        // Debug logging
        console.log('Analytics Debug Info:', {
          currentMonth,
          producerUsers: producerUsers.length,
          trackSales: trackSales.length,
          syncProposals: syncProposals.length,
          customSyncRequests: customSyncRequests.length,
          totalSales,
          totalRevenue,
          trackSalesData: trackSales.slice(0, 3), // First 3 for debugging
          syncProposalsData: syncProposals.slice(0, 3), // First 3 for debugging
          customSyncData: customSyncRequests.slice(0, 3) // First 3 for debugging
        });

        // Update stats with comprehensive sales data
        setStats(prev => ({
          ...prev,
          total_sales: totalSales,
          total_revenue: totalRevenue
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
                <p className="text-3xl font-bold text-white">
                  ${stats.total_revenue.toFixed(2)}
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

        {/* Tab Navigation */}
        <div className="flex flex-wrap border-b border-blue-500/20 mb-8">
          {[
            { id: 'analytics', label: 'Analytics', icon: null },
            { id: 'producers', label: 'Producers', icon: null },
            { id: 'clients', label: 'Clients', icon: null },
            { id: 'announcements', label: 'Announcements', icon: <Bell className="w-4 h-4 mr-2" /> },
            { id: 'compensation', label: 'Compensation', icon: <Percent className="w-4 h-4 mr-2" /> },
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
      </div>
			 {activeTab === 'white_label' && (
        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-purple-500/20 p-6">
         <Link
         to="/admin/white-label-clients"
         className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors inline-block"
          >
       Manage White Label Clients
      </Link>
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
    </div>
  );
}
