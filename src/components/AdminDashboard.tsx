import React, { useState, useEffect } from 'react';
import { Users, DollarSign, BarChart3, Upload, X, Mail, Calendar, ArrowUpDown, Music, Plus, Percent, Trash2, Search, Bell, Download, PieChart, Wallet } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { LogoUpload } from './LogoUpload';
import { useAuth } from '../contexts/AuthContext';
import { useFeatureFlag } from '../hooks/useFeatureFlag';
import { ProposalAnalytics } from './ProposalAnalytics';
import { CustomSyncAnalytics } from './CustomSyncAnalytics';
import { ProducerAnalyticsModal } from './ProducerAnalyticsModal';
import { RevenueBreakdownDialog } from './RevenueBreakdownDialog';
import { ClientList } from './ClientList';
import { ProducerPayoutsPage } from './ProducerPayoutsPage';
import { AdminAnnouncementManager } from './AdminAnnouncementManager';
import { CompensationSettings } from './CompensationSettings';
import { FeatureManagement } from './FeatureManagement';
import { DiscountManagement } from './DiscountManagement';
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
  const { isEnabled: hasDiscountManagementAccess } = useFeatureFlag('discount_management');
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
  const [activeTab, setActiveTab] = useState<'analytics' | 'producers' | 'clients' | 'announcements' | 'compensation' | 'features' | 'discounts' | 'advanced-analytics'>('analytics');

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === 'discounts' && !hasDiscountManagementAccess) {
      setActiveTab('analytics');
    }
  }, [activeTab, hasDiscountManagementAccess]);

  const fetchData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);

      // --- Admin Profile ---
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('first_name, email')
        .eq('id', user.id)
        .maybeSingle();
          
      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
      }
      if (profileData) {
        setProfile(profileData);
      }

      // --- Monthly Stats ---
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();

      const { data: monthlySalesData, error: monthlySalesError } = await supabase
        .from('sales')
        .select('amount')
        .gte('created_at', firstDayOfMonth)
        .lte('created_at', lastDayOfMonth);
      if (monthlySalesError) throw monthlySalesError;

      const { data: monthlySyncData, error: monthlySyncError } = await supabase
        .from('sync_proposals')
        .select('sync_fee')
        .eq('payment_status', 'paid')
        .eq('status', 'accepted')
        .gte('created_at', firstDayOfMonth)
        .lte('created_at', lastDayOfMonth);
      if (monthlySyncError) throw monthlySyncError;

      const { data: monthlyCustomSyncData, error: monthlyCustomSyncError } = await supabase
        .from('custom_sync_requests')
        .select('sync_fee')
        .eq('status', 'completed')
        .gte('created_at', firstDayOfMonth)
        .lte('created_at', lastDayOfMonth);
      if (monthlyCustomSyncError) throw monthlyCustomSyncError;

      const monthlySalesRevenue = monthlySalesData?.reduce((sum, sale) => sum + sale.amount, 0) || 0;
      const monthlySyncRevenue = monthlySyncData?.reduce((sum, p) => sum + p.sync_fee, 0) || 0;
      const monthlyCustomSyncRevenue = monthlyCustomSyncData?.reduce((sum, r) => sum + r.sync_fee, 0) || 0;
      
      // --- All-Time Producer Analytics ---
      const { data: userData, error: userError } = await supabase.from('profiles').select('*');
      if (userError) throw userError;

      const clients = userData.filter(u => u.account_type === 'client');
      const producerUsers = userData.filter(u => u.account_type === 'producer');
      
      const { data: tracksData, error: tracksError } = await supabase.from('tracks').select('id, producer_id');
      if (tracksError) throw tracksError;
      const trackProducerMap = new Map(tracksData.map(t => [t.id, t.producer_id]));

      const { data: allSalesData, error: allSalesError } = await supabase.from('sales').select('amount, track_id');
      if (allSalesError) throw allSalesError;

      const { data: allSyncData, error: allSyncError } = await supabase
        .from('sync_proposals')
        .select('sync_fee, track_id')
        .eq('payment_status', 'paid')
        .eq('status', 'accepted');
      if (allSyncError) throw allSyncError;

      const producerRevenueMap = new Map<string, { sales: number, revenue: number, tracks: Set<string> }>();

      allSalesData.forEach(sale => {
        const producerId = trackProducerMap.get(sale.track_id);
        if (producerId) {
          const current = producerRevenueMap.get(producerId) || { sales: 0, revenue: 0, tracks: new Set() };
          current.sales += 1;
          current.revenue += sale.amount;
          current.tracks.add(sale.track_id);
          producerRevenueMap.set(producerId, current);
        }
      });

      allSyncData.forEach(proposal => {
        const producerId = trackProducerMap.get(proposal.track_id);
        if (producerId) {
          const current = producerRevenueMap.get(producerId) || { sales: 0, revenue: 0, tracks: new Set() };
          current.revenue += proposal.sync_fee;
          producerRevenueMap.set(producerId, current);
        }
      });
      
      const totalSales = allSalesData.length;
      const totalRevenue = monthlySalesRevenue + monthlySyncRevenue + monthlyCustomSyncRevenue;

      setStats({
        total_clients: clients.length,
        total_producers: producerUsers.length,
        total_sales: totalSales,
        total_revenue: totalRevenue,
      });

      const transformedProducers = producerUsers.map(producer => {
        const analytics = producerRevenueMap.get(producer.id) || { sales: 0, revenue: 0, tracks: new Set() };
        return {
          ...producer,
          total_tracks: analytics.tracks.size,
          total_sales: analytics.sales,
          total_revenue: analytics.revenue,
        };
      });

      setProducers(transformedProducers as UserDetails[]);

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
            { id: 'features', label: 'Feature Management', icon: null },
            // Only show Discount Management tab if user has access
            ...(hasDiscountManagementAccess ? [{ id: 'discounts', label: 'Discount Management', icon: null }] : []),
            { id: 'advanced-analytics', label: 'Advanced Analytics', icon: null },
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

        {/* Feature Management section */}
        {activeTab === 'features' && (
          <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-blue-500/20 p-6">
            <FeatureManagement />
          </div>
        )}

        {/* Discount Management section */}
        {activeTab === 'discounts' && hasDiscountManagementAccess && (
          <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-purple-500/20 p-6">
            <DiscountManagement />
          </div>
        )}

        {/* Advanced Analytics section */}
        {activeTab === 'advanced-analytics' && (
          <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-purple-500/20 p-6">
            <div className="text-center py-12">
              <BarChart3 className="w-16 h-16 text-blue-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-4">Advanced Analytics Dashboard</h2>
              <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
                Access comprehensive analytics and reporting features including revenue forecasting,
                client churn analysis, genre distribution insights, and AI-powered business recommendations.
              </p>
              <Link
                to="/advanced-analytics"
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg transition-all shadow-lg hover:shadow-xl"
              >
                <BarChart3 className="w-5 h-5 mr-2" />
                Open Advanced Analytics
              </Link>
            </div>
          </div>
        )}
      </div>

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
