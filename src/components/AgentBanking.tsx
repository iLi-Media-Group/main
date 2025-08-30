import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useUnifiedAuth } from '../contexts/UnifiedAuthContext';
import { supabase } from '../lib/supabase';
import { 
  Building2, 
  DollarSign, 
  TrendingUp, 
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  Users,
  BarChart3,
  Calendar,
  ArrowLeft,
  RefreshCw,
  CreditCard,
  Wallet,
  PiggyBank,
  Download
} from 'lucide-react';

interface AgentEarnings {
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
  };
}

interface BankingStats {
  totalBalance: number;
  availableBalance: number;
  pendingBalance: number;
  totalEarnings: number;
  totalPaid: number;
  totalTransactions: number;
}

export function AgentBanking() {
  const { user, profile } = useUnifiedAuth();
  const [earnings, setEarnings] = useState<AgentEarnings[]>([]);
  const [stats, setStats] = useState<BankingStats>({
    totalBalance: 0,
    availableBalance: 0,
    pendingBalance: 0,
    totalEarnings: 0,
    totalPaid: 0,
    totalTransactions: 0
  });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'paid' | 'cancelled'>('all');
  const [dateRange, setDateRange] = useState<'all' | '30days' | '90days' | '1year'>('all');

  useEffect(() => {
    if (user) {
      fetchBankingData();
    }
  }, [user, filter, dateRange]);

  const fetchBankingData = async () => {
    if (!user) return;

    try {
      setLoading(true);

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
            sync_fee
          )
        `)
        .eq('agent_id', user.id)
        .order('created_at', { ascending: false });

      // Apply status filter
      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      // Apply date range filter
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
        
        query = query.gte('created_at', startDate.toISOString());
      }

      const { data: earningsData, error: earningsError } = await query;

      if (earningsError) throw earningsError;

      setEarnings(earningsData || []);

      // Calculate banking stats
      const totalEarnings = earningsData?.reduce((sum, earning) => sum + earning.commission_amount, 0) || 0;
      const pendingBalance = earningsData?.filter(e => e.status === 'pending').reduce((sum, earning) => sum + earning.commission_amount, 0) || 0;
      const totalPaid = earningsData?.filter(e => e.status === 'paid').reduce((sum, earning) => sum + earning.commission_amount, 0) || 0;
      const availableBalance = totalPaid; // Available balance is what has been paid
      const totalBalance = totalEarnings; // Total balance includes pending
      const totalTransactions = earningsData?.length || 0;

      setStats({
        totalBalance,
        availableBalance,
        pendingBalance,
        totalEarnings,
        totalPaid,
        totalTransactions
      });

    } catch (error) {
      console.error('Error fetching banking data:', error);
    } finally {
      setLoading(false);
    }
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
        return 'text-green-400';
      case 'pending':
        return 'text-yellow-400';
      case 'cancelled':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Project', 'Deal Amount', 'Commission %', 'Commission Amount', 'Status', 'Paid Date'];
    const csvData = earnings.map(earning => [
      formatDate(earning.created_at),
      earning.custom_sync_request?.project_title || 'Unknown Project',
      earning.total_deal_amount.toFixed(2),
      earning.commission_percentage,
      earning.commission_amount.toFixed(2),
      earning.status,
      earning.paid_at ? formatDate(earning.paid_at) : ''
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agent-banking-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-blue-900/90 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading banking information...</p>
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
            <div className="flex items-center space-x-4">
              <Link
                to="/agent/dashboard"
                className="p-2 text-gray-300 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-6 h-6" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-white">
                  Agent Banking
                </h1>
                <p className="text-gray-300 mt-1">
                  Manage your earnings and view transaction history
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={fetchBankingData}
                disabled={loading}
                className="p-2 text-gray-300 hover:text-white transition-colors"
              >
                <RefreshCw className={`w-6 h-6 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={exportToCSV}
                className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </button>
              <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
                <CreditCard className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Account Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 backdrop-blur-lg rounded-xl p-6 border border-green-500/30">
            <div className="flex items-center">
              <div className="p-2 bg-green-500/30 rounded-lg">
                <Wallet className="w-6 h-6 text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-300">Available Balance</p>
                <p className="text-2xl font-bold text-white">${stats.availableBalance.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 backdrop-blur-lg rounded-xl p-6 border border-yellow-500/30">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-500/30 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-300">Pending Balance</p>
                <p className="text-2xl font-bold text-white">${stats.pendingBalance.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-lg rounded-xl p-6 border border-blue-500/30">
            <div className="flex items-center">
              <div className="p-2 bg-blue-500/30 rounded-lg">
                <PiggyBank className="w-6 h-6 text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-300">Total Balance</p>
                <p className="text-2xl font-bold text-white">${stats.totalBalance.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 backdrop-blur-lg rounded-xl p-6 border border-purple-500/30">
            <div className="flex items-center">
              <div className="p-2 bg-purple-500/30 rounded-lg">
                <BarChart3 className="w-6 h-6 text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-300">Total Transactions</p>
                <p className="text-2xl font-bold text-white">{stats.totalTransactions}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <h3 className="text-lg font-semibold text-white">Transaction History</h3>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as any)}
                className="px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Time</option>
                <option value="30days">Last 30 Days</option>
                <option value="90days">Last 90 Days</option>
                <option value="1year">Last Year</option>
              </select>
            </div>
          </div>
        </div>

        {/* Transaction List */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
          {earnings.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-400 text-lg mb-2">No transactions found</p>
              <p className="text-sm text-gray-500">
                {filter !== 'all' || dateRange !== 'all' 
                  ? 'Try adjusting your filters to see more transactions'
                  : 'Create custom sync requests to start earning commissions'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {earnings.map((earning) => (
                <div
                  key={earning.id}
                  className="flex items-center p-4 bg-gray-800/30 rounded-lg hover:bg-gray-800/50 transition-colors"
                >
                  {getStatusIcon(earning.status)}
                  <div className="ml-4 flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-medium">{earning.custom_sync_request?.project_title || 'Unknown Project'}</p>
                        <p className="text-sm text-gray-400">
                          Deal: ${earning.total_deal_amount.toFixed(2)} • Commission: {earning.commission_percentage}%
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`text-lg font-semibold ${getStatusColor(earning.status)}`}>
                          ${earning.commission_amount.toFixed(2)}
                        </p>
                        <p className={`text-sm ${getStatusColor(earning.status)}`}>
                          {earning.status.charAt(0).toUpperCase() + earning.status.slice(1)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      <span>Created: {formatDateTime(earning.created_at)}</span>
                      {earning.paid_at && (
                        <span className="ml-4">Paid: {formatDateTime(earning.paid_at)}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
