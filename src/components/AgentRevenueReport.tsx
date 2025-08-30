import React, { useState, useEffect } from 'react';
import { useUnifiedAuth } from '../contexts/UnifiedAuthContext';
import { supabase } from '../lib/supabase';
import { 
  DollarSign, 
  TrendingUp, 
  Calendar,
  Download,
  Filter,
  BarChart3,
  PieChart,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface AgentEarning {
  id: string;
  commission_amount: number;
  commission_percentage: number;
  total_deal_amount: number;
  status: 'pending' | 'paid' | 'cancelled';
  created_at: string;
  paid_at?: string;
  custom_sync_request: {
    project_title: string;
    sync_fee: number;
    status: string;
  };
}

interface RevenueStats {
  totalEarnings: number;
  pendingEarnings: number;
  paidEarnings: number;
  cancelledEarnings: number;
  totalDeals: number;
  averageCommission: number;
  averageCommissionPercentage: number;
  monthlyEarnings: { [key: string]: number };
  statusBreakdown: { [key: string]: number };
}

export function AgentRevenueReport() {
  const { user } = useUnifiedAuth();
  const [earnings, setEarnings] = useState<AgentEarning[]>([]);
  const [stats, setStats] = useState<RevenueStats>({
    totalEarnings: 0,
    pendingEarnings: 0,
    paidEarnings: 0,
    cancelledEarnings: 0,
    totalDeals: 0,
    averageCommission: 0,
    averageCommissionPercentage: 0,
    monthlyEarnings: {},
    statusBreakdown: {}
  });
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'all' | '30days' | '90days' | '1year'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'paid' | 'cancelled'>('all');

  useEffect(() => {
    if (user) {
      fetchRevenueData();
    }
  }, [user, dateRange, statusFilter]);

  const fetchRevenueData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Build date filter
      let dateFilter = '';
      if (dateRange !== 'all') {
        const now = new Date();
        let startDate = new Date();
        
        switch (dateRange) {
          case '30days':
            startDate.setDate(now.getDate() - 30);
            break;
          case '90days':
            startDate.setDate(now.getDate() - 90);
            break;
          case '1year':
            startDate.setFullYear(now.getFullYear() - 1);
            break;
        }
        
        dateFilter = `created_at.gte.${startDate.toISOString()}`;
      }

      // Build status filter
      let statusFilterQuery = '';
      if (statusFilter !== 'all') {
        statusFilterQuery = `status.eq.${statusFilter}`;
      }

      // Combine filters
      let query = supabase
        .from('agent_earnings')
        .select(`
          id,
          commission_amount,
          commission_percentage,
          total_deal_amount,
          status,
          created_at,
          paid_at,
          custom_sync_request:custom_sync_requests (
            project_title,
            sync_fee,
            status
          )
        `)
        .eq('agent_id', user.id);

      if (dateFilter) {
        query = query.filter(dateFilter);
      }

      if (statusFilterQuery) {
        query = query.filter(statusFilterQuery);
      }

      const { data: earningsData, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      setEarnings(earningsData || []);
      calculateStats(earningsData || []);

    } catch (error) {
      console.error('Error fetching revenue data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (earnings: AgentEarning[]) => {
    const totalEarnings = earnings.reduce((sum, earning) => sum + earning.commission_amount, 0);
    const pendingEarnings = earnings.filter(e => e.status === 'pending').reduce((sum, earning) => sum + earning.commission_amount, 0);
    const paidEarnings = earnings.filter(e => e.status === 'paid').reduce((sum, earning) => sum + earning.commission_amount, 0);
    const cancelledEarnings = earnings.filter(e => e.status === 'cancelled').reduce((sum, earning) => sum + earning.commission_amount, 0);
    const totalDeals = earnings.length;
    const averageCommission = totalDeals > 0 ? totalEarnings / totalDeals : 0;
    const averageCommissionPercentage = totalDeals > 0 ? earnings.reduce((sum, e) => sum + e.commission_percentage, 0) / totalDeals : 0;

    // Calculate monthly earnings
    const monthlyEarnings: { [key: string]: number } = {};
    earnings.forEach(earning => {
      const month = new Date(earning.created_at).toISOString().slice(0, 7); // YYYY-MM format
      monthlyEarnings[month] = (monthlyEarnings[month] || 0) + earning.commission_amount;
    });

    // Calculate status breakdown
    const statusBreakdown: { [key: string]: number } = {};
    earnings.forEach(earning => {
      statusBreakdown[earning.status] = (statusBreakdown[earning.status] || 0) + 1;
    });

    setStats({
      totalEarnings,
      pendingEarnings,
      paidEarnings,
      cancelledEarnings,
      totalDeals,
      averageCommission,
      averageCommissionPercentage,
      monthlyEarnings,
      statusBreakdown
    });
  };

  const exportToCSV = () => {
    const headers = [
      'Date',
      'Project Title',
      'Total Deal Amount',
      'Commission Percentage',
      'Commission Amount',
      'Status',
      'Paid Date'
    ];

    const csvData = earnings.map(earning => [
      new Date(earning.created_at).toLocaleDateString(),
      earning.custom_sync_request?.project_title || 'Unknown',
      earning.total_deal_amount.toFixed(2),
      earning.commission_percentage.toFixed(2) + '%',
      earning.commission_amount.toFixed(2),
      earning.status,
      earning.paid_at ? new Date(earning.paid_at).toLocaleDateString() : ''
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agent-revenue-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-400" />;
      case 'cancelled':
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'text-green-400 bg-green-400/20';
      case 'pending':
        return 'text-yellow-400 bg-yellow-400/20';
      case 'cancelled':
        return 'text-red-400 bg-red-400/20';
      default:
        return 'text-gray-400 bg-gray-400/20';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-blue-900/90 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading revenue report...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-900/90">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-lg border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Revenue Report</h1>
              <p className="text-gray-300 mt-1">Track your commissions and earnings</p>
            </div>
            <button
              onClick={exportToCSV}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 mb-8">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <span className="text-gray-300 font-medium">Filters:</span>
            </div>
            
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as any)}
              className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
            >
              <option value="all">All Time</option>
              <option value="30days">Last 30 Days</option>
              <option value="90days">Last 90 Days</option>
              <option value="1year">Last Year</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="flex items-center">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-300">Total Earnings</p>
                <p className="text-2xl font-bold text-white">${stats.totalEarnings.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-500/20 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-300">Pending</p>
                <p className="text-2xl font-bold text-white">${stats.pendingEarnings.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="flex items-center">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <BarChart3 className="w-6 h-6 text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-300">Total Deals</p>
                <p className="text-2xl font-bold text-white">{stats.totalDeals}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="flex items-center">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-300">Avg Commission</p>
                <p className="text-2xl font-bold text-white">${stats.averageCommission.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Status Breakdown */}
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <PieChart className="w-5 h-5 mr-2" />
              Status Breakdown
            </h3>
            <div className="space-y-3">
              {Object.entries(stats.statusBreakdown).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(status)}
                    <span className="text-gray-300 capitalize">{status}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-white font-medium">{count}</span>
                    <span className="text-gray-400 text-sm">
                      ({((count / stats.totalDeals) * 100).toFixed(1)}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Monthly Earnings */}
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              Monthly Earnings
            </h3>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {Object.entries(stats.monthlyEarnings)
                .sort(([a], [b]) => b.localeCompare(a))
                .map(([month, amount]) => (
                  <div key={month} className="flex items-center justify-between">
                    <span className="text-gray-300">
                      {new Date(month + '-01').toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long' 
                      })}
                    </span>
                    <span className="text-white font-medium">${amount.toFixed(2)}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Earnings Table */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
          <h3 className="text-lg font-semibold text-white mb-6 flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Detailed Earnings
          </h3>
          
          {earnings.length === 0 ? (
            <div className="text-center py-8">
              <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-400">No earnings found for the selected filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/20">
                    <th className="text-left py-3 px-4 text-gray-300 font-medium">Date</th>
                    <th className="text-left py-3 px-4 text-gray-300 font-medium">Project</th>
                    <th className="text-left py-3 px-4 text-gray-300 font-medium">Deal Amount</th>
                    <th className="text-left py-3 px-4 text-gray-300 font-medium">Commission %</th>
                    <th className="text-left py-3 px-4 text-gray-300 font-medium">Commission</th>
                    <th className="text-left py-3 px-4 text-gray-300 font-medium">Status</th>
                    <th className="text-left py-3 px-4 text-gray-300 font-medium">Paid Date</th>
                  </tr>
                </thead>
                <tbody>
                  {earnings.map((earning) => (
                    <tr key={earning.id} className="border-b border-white/10 hover:bg-white/5">
                      <td className="py-3 px-4 text-gray-300">
                        {formatDate(earning.created_at)}
                      </td>
                      <td className="py-3 px-4 text-white font-medium">
                        {earning.custom_sync_request?.project_title || 'Unknown'}
                      </td>
                      <td className="py-3 px-4 text-gray-300">
                        ${earning.total_deal_amount.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-gray-300">
                        {earning.commission_percentage.toFixed(1)}%
                      </td>
                      <td className="py-3 px-4 text-green-400 font-medium">
                        ${earning.commission_amount.toFixed(2)}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(earning.status)}`}>
                          {getStatusIcon(earning.status)}
                          <span className="ml-1 capitalize">{earning.status}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-300">
                        {earning.paid_at ? formatDate(earning.paid_at) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
