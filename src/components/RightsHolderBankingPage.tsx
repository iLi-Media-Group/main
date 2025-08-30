import React, { useState, useEffect, useCallback } from 'react';
import { 
  DollarSign, 
  CreditCard, 
  Clock, 
  Download, 
  AlertCircle, 
  CheckCircle, 
  FileText, 
  ChevronDown, 
  ChevronUp, 
  Filter, 
  Calendar, 
  ArrowUpDown, 
  Loader2, 
  Target,
  Upload,
  BarChart3,
  TrendingUp,
  Building2,
  FileSpreadsheet,
  FileText as FileTextIcon,
  X,
  PieChart
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useUnifiedAuth } from '../contexts/UnifiedAuthContext';
import { Card, CardContent } from './ui/card';

interface Transaction {
  id: string;
  amount: number;
  original_amount?: number;
  type: 'sync_proposal' | 'custom_sync' | 'license_fee' | 'membership_revenue' | 'royalty_payment' | 'withdrawal' | 'adjustment';
  status: 'pending' | 'completed' | 'rejected' | 'paid' | 'failed';
  created_at: string;
  description: string;
  track_title?: string;
  reference_id?: string;
  client_name?: string;
  project_title?: string;
}

interface BankAccount {
  id: string;
  account_type: 'bank' | 'paypal' | 'crypto';
  account_details: {
    bank_name?: string;
    account_number?: string;
    routing_number?: string;
    paypal_email?: string;
    crypto_address?: string;
    crypto_type?: string;
  };
  is_primary: boolean;
  created_at: string;
}

interface RevenueStats {
  totalRevenue: number;
  pendingBalance: number;
  availableBalance: number;
  lifetimeEarnings: number;
  syncProposalsRevenue: number;
  customSyncRevenue: number;
  licenseFeesRevenue: number;
  membershipRevenue: number;
  royaltyPayments: number;
  syncProposalsCount: number;
  customSyncCount: number;
  licenseCount: number;
  membershipCount: number;
  royaltyCount: number;
}

export function RightsHolderBankingPage() {
  const { user } = useUnifiedAuth();
  const [balance, setBalance] = useState(0);
  const [pendingBalance, setPendingBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showBankForm, setShowBankForm] = useState(false);
  const [showWithdrawalForm, setShowWithdrawalForm] = useState(false);
  const [expandedTransaction, setExpandedTransaction] = useState<string | null>(null);
  const [sortField, setSortField] = useState<'date' | 'amount' | 'type'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterType, setFilterType] = useState<'all' | 'sync_proposals' | 'custom_sync' | 'license_fees' | 'membership' | 'royalties' | 'withdrawals' | 'adjustments'>('all');
  const [dateRange, setDateRange] = useState<'all' | '30days' | '90days' | 'year'>('30days');
  const [profile, setProfile] = useState<{ first_name?: string, display_name?: string, email: string } | null>(null);
  const [revenueStats, setRevenueStats] = useState<RevenueStats>({
    totalRevenue: 0,
    pendingBalance: 0,
    availableBalance: 0,
    lifetimeEarnings: 0,
    syncProposalsRevenue: 0,
    customSyncRevenue: 0,
    licenseFeesRevenue: 0,
    membershipRevenue: 0,
    royaltyPayments: 0,
    syncProposalsCount: 0,
    customSyncCount: 0,
    licenseCount: 0,
    membershipCount: 0,
    royaltyCount: 0,
  });
  const [showRevenueReport, setShowRevenueReport] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [timeframe, setTimeframe] = useState<'month' | 'quarter' | 'year' | 'all'>('month');
  const [monthlyRevenue, setMonthlyRevenue] = useState<{ month: string; amount: number }[]>([]);
  const [revenueSources, setRevenueSources] = useState<{ source: string; amount: number; count: number; percentage: number; type: 'completed' | 'pending' }[]>([]);

  useEffect(() => {
    if (user) {
      fetchData();
      fetchRevenueStats();
    }
  }, [user, filterType, dateRange, sortField, sortOrder, timeframe]);

  const fetchData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch profile information
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('first_name, last_name, email, display_name')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Fetch rights holder balance
      const { data: balanceData, error: balanceError } = await supabase
        .from('rights_holder_balances')
        .select('*')
        .eq('rights_holder_id', user.id)
        .single();

      if (balanceError && balanceError.code !== 'PGRST116') {
        console.error('Balance error:', balanceError);
      }

      if (balanceData) {
        setBalance(balanceData.available_balance || 0);
        setPendingBalance(balanceData.pending_balance || 0);
      } else {
        setBalance(0);
        setPendingBalance(0);
      }

      // Fetch transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('rights_holder_transactions')
        .select('*')
        .eq('rights_holder_id', user.id)
        .order('created_at', { ascending: false });

      if (transactionsError) {
        console.error('Transactions error:', transactionsError);
        setTransactions([]);
      } else {
        setTransactions(transactionsData || []);
      }

      // Bank accounts table doesn't exist yet
      setBankAccounts([]);

    } catch (err) {
      console.error('Error fetching banking data:', err);
      setError('Failed to load banking information. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchRevenueStats = async () => {
    if (!user) return;

    try {
      // Calculate date range based on timeframe
      const endDate = new Date();
      const startDate = new Date();
      
      if (timeframe === 'month') {
        startDate.setMonth(startDate.getMonth() - 1);
      } else if (timeframe === 'quarter') {
        startDate.setMonth(startDate.getMonth() - 3);
      } else if (timeframe === 'year') {
        startDate.setFullYear(startDate.getFullYear() - 1);
      } else {
        // 'all' - set to a date far in the past
        startDate.setFullYear(2020);
      }

      // Fetch revenue data from rights_holder_revenue table
      const { data: revenueData, error: revenueError } = await supabase
        .from('rights_holder_revenue')
        .select('*')
        .eq('rights_holder_id', user.id)
        .eq('payment_status', 'paid')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (revenueError) {
        console.error('Revenue error:', revenueError);
        // Set default values if error
        const defaultStats: RevenueStats = {
          totalRevenue: 0,
          pendingBalance: 0,
          availableBalance: 0,
          lifetimeEarnings: 0,
          syncProposalsRevenue: 0,
          customSyncRevenue: 0,
          licenseFeesRevenue: 0,
          membershipRevenue: 0,
          royaltyPayments: 0,
          syncProposalsCount: 0,
          customSyncCount: 0,
          licenseCount: 0,
          membershipCount: 0,
          royaltyCount: 0,
        };
        setRevenueStats(defaultStats);
        setMonthlyRevenue([]);
        setRevenueSources([]);
        return;
      }

      // Calculate totals by revenue type
      const syncProposalsRevenue = revenueData?.filter(r => r.revenue_type === 'sync_fee').reduce((sum, r) => sum + r.rights_holder_amount, 0) || 0;
      const customSyncRevenue = 0; // Not implemented yet
      const licenseFeesRevenue = revenueData?.filter(r => r.revenue_type === 'license_fee').reduce((sum, r) => sum + r.rights_holder_amount, 0) || 0;
      const membershipRevenue = revenueData?.filter(r => r.revenue_type === 'membership_revenue').reduce((sum, r) => sum + r.rights_holder_amount, 0) || 0;
      const royaltyPayments = revenueData?.filter(r => r.revenue_type === 'royalty_payment').reduce((sum, r) => sum + r.rights_holder_amount, 0) || 0;

      const totalRevenue = syncProposalsRevenue + customSyncRevenue + licenseFeesRevenue + membershipRevenue + royaltyPayments;

      // Create revenue sources array for the sophisticated report
      const sources = [];
      if (syncProposalsRevenue > 0) {
        sources.push({
          source: 'Sync Proposals',
          amount: syncProposalsRevenue,
          count: revenueData?.filter(r => r.revenue_type === 'sync_fee').length || 0,
          percentage: (syncProposalsRevenue / totalRevenue) * 100,
          type: 'completed' as const
        });
      }
      if (licenseFeesRevenue > 0) {
        sources.push({
          source: 'License Fees',
          amount: licenseFeesRevenue,
          count: revenueData?.filter(r => r.revenue_type === 'license_fee').length || 0,
          percentage: (licenseFeesRevenue / totalRevenue) * 100,
          type: 'completed' as const
        });
      }
      if (membershipRevenue > 0) {
        sources.push({
          source: 'Membership Revenue',
          amount: membershipRevenue,
          count: revenueData?.filter(r => r.revenue_type === 'membership_revenue').length || 0,
          percentage: (membershipRevenue / totalRevenue) * 100,
          type: 'completed' as const
        });
      }
      if (royaltyPayments > 0) {
        sources.push({
          source: 'Royalty Payments',
          amount: royaltyPayments,
          count: revenueData?.filter(r => r.revenue_type === 'royalty_payment').length || 0,
          percentage: (royaltyPayments / totalRevenue) * 100,
          type: 'completed' as const
        });
      }

      setRevenueSources(sources);

      // Generate monthly revenue data (simplified for now)
      const monthlyData = [];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      for (let i = 0; i < 12; i++) {
        monthlyData.push({
          month: months[i],
          amount: Math.random() * totalRevenue * 0.1 // Simplified random data
        });
      }
      setMonthlyRevenue(monthlyData);

      setRevenueStats({
        totalRevenue,
        pendingBalance: pendingBalance,
        availableBalance: balance,
        lifetimeEarnings: totalRevenue,
        syncProposalsRevenue,
        customSyncRevenue,
        licenseFeesRevenue,
        membershipRevenue,
        royaltyPayments,
        syncProposalsCount: revenueData?.filter(r => r.revenue_type === 'sync_fee').length || 0,
        customSyncCount: 0,
        licenseCount: revenueData?.filter(r => r.revenue_type === 'license_fee').length || 0,
        membershipCount: revenueData?.filter(r => r.revenue_type === 'membership_revenue').length || 0,
        royaltyCount: revenueData?.filter(r => r.revenue_type === 'royalty_payment').length || 0,
      });

    } catch (err) {
      console.error('Error fetching revenue stats:', err);
    }
  };

  const handleSort = (field: 'date' | 'amount' | 'type') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const toggleTransaction = (id: string) => {
    setExpandedTransaction(expandedTransaction === id ? null : id);
  };

  const getTransactionIcon = (type: string, status: string) => {
    if (type === 'sync_proposal') {
      return <FileText className="w-5 h-5 text-green-400" />;
    } else if (type === 'custom_sync') {
      return <BarChart3 className="w-5 h-5 text-blue-400" />;
    } else if (type === 'license_fee') {
      return <Building2 className="w-5 h-5 text-purple-400" />;
    } else if (type === 'membership_revenue') {
      return <Target className="w-5 h-5 text-orange-400" />;
    } else if (type === 'royalty_payment') {
      return <TrendingUp className="w-5 h-5 text-yellow-400" />;
    } else if (type === 'withdrawal') {
      if (status === 'pending') {
        return <Clock className="w-5 h-5 text-yellow-400" />;
      } else if (status === 'completed') {
        return <CheckCircle className="w-5 h-5 text-blue-400" />;
      } else {
        return <AlertCircle className="w-5 h-5 text-red-400" />;
      }
    } else {
      return <FileTextIcon className="w-5 h-5 text-purple-400" />;
    }
  };

  const exportRevenueReport = async (format: 'csv' | 'pdf') => {
    if (!user) return;

    setExporting(true);
    try {
      // This would integrate with your existing export functionality
      console.log(`Exporting ${format} report for rights holder ${user.id}`);
      // Implement actual export logic here
    } catch (error) {
      console.error('Error exporting report:', error);
    } finally {
      setExporting(false);
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
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Rights Holder Banking</h1>
            {profile && (
              <p className="text-xl text-gray-300 mt-2">
                Welcome {profile.display_name || profile.first_name || profile.email.split('@')[0]}
              </p>
            )}
          </div>
          <button
            onClick={() => fetchData()}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors flex items-center space-x-2"
          >
            <Loader2 className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-400">Available Balance</p>
                  <p className="text-2xl font-bold text-white">${balance.toFixed(2)}</p>
                </div>
                <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 border-yellow-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-yellow-400">Pending Balance</p>
                  <p className="text-2xl font-bold text-white">${pendingBalance.toFixed(2)}</p>
                </div>
                <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center">
                  <Clock className="w-6 h-6 text-yellow-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-400">Total Revenue</p>
                  <p className="text-2xl font-bold text-white">${revenueStats.totalRevenue.toFixed(2)}</p>
                </div>
                <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Revenue Report Card */}
          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/20 cursor-pointer hover:bg-purple-500/15 transition-colors" onClick={() => setShowRevenueReport(true)}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-400">Revenue Report</p>
                  <p className="text-xs text-purple-300">Click to view</p>
                </div>
                <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Revenue Breakdown */}
        <Card className="mb-8 bg-gradient-to-br from-gray-500/10 to-gray-600/10 border-gray-500/20">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <BarChart3 className="w-5 h-5 text-gray-400 mr-2" />
              Revenue Breakdown
            </h3>
            
            <div className="space-y-4">
              {revenueStats.totalRevenue === 0 ? (
                <p className="text-gray-400 text-center py-4">No revenue data available</p>
              ) : (
                <>
                  {/* Sync Proposals */}
                  {revenueStats.syncProposalsRevenue > 0 && (
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center">
                          <span className="text-green-400">Sync Proposals</span>
                          <span className="text-gray-400 text-sm ml-2">({revenueStats.syncProposalsCount} {revenueStats.syncProposalsCount === 1 ? 'transaction' : 'transactions'})</span>
                        </div>
                        <span className="text-white font-semibold">
                          ${revenueStats.syncProposalsRevenue.toFixed(2)}
                        </span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full"
                          style={{ width: `${(revenueStats.syncProposalsRevenue / revenueStats.totalRevenue) * 100}%` }}
                        ></div>
                      </div>
                      <p className="text-right text-xs text-gray-400 mt-1">
                        {((revenueStats.syncProposalsRevenue / revenueStats.totalRevenue) * 100).toFixed(1)}%
                      </p>
                    </div>
                  )}

                  {/* Custom Sync Requests */}
                  {revenueStats.customSyncRevenue > 0 && (
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center">
                          <span className="text-blue-400">Custom Sync Requests</span>
                          <span className="text-gray-400 text-sm ml-2">({revenueStats.customSyncCount} {revenueStats.customSyncCount === 1 ? 'transaction' : 'transactions'})</span>
                        </div>
                        <span className="text-white font-semibold">
                          ${revenueStats.customSyncRevenue.toFixed(2)}
                        </span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${(revenueStats.customSyncRevenue / revenueStats.totalRevenue) * 100}%` }}
                        ></div>
                      </div>
                      <p className="text-right text-xs text-gray-400 mt-1">
                        {((revenueStats.customSyncRevenue / revenueStats.totalRevenue) * 100).toFixed(1)}%
                      </p>
                    </div>
                  )}

                  {/* License Fees */}
                  {revenueStats.licenseFeesRevenue > 0 && (
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center">
                          <span className="text-purple-400">License Fees</span>
                          <span className="text-gray-400 text-sm ml-2">({revenueStats.licenseCount} {revenueStats.licenseCount === 1 ? 'transaction' : 'transactions'})</span>
                        </div>
                        <span className="text-white font-semibold">
                          ${revenueStats.licenseFeesRevenue.toFixed(2)}
                        </span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-purple-600 h-2 rounded-full"
                          style={{ width: `${(revenueStats.licenseFeesRevenue / revenueStats.totalRevenue) * 100}%` }}
                        ></div>
                      </div>
                      <p className="text-right text-xs text-gray-400 mt-1">
                        {((revenueStats.licenseFeesRevenue / revenueStats.totalRevenue) * 100).toFixed(1)}%
                      </p>
                    </div>
                  )}

                  {/* Membership Revenue */}
                  {revenueStats.membershipRevenue > 0 && (
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center">
                          <span className="text-orange-400">Membership Revenue</span>
                          <span className="text-gray-400 text-sm ml-2">({revenueStats.membershipCount} {revenueStats.membershipCount === 1 ? 'transaction' : 'transactions'})</span>
                        </div>
                        <span className="text-white font-semibold">
                          ${revenueStats.membershipRevenue.toFixed(2)}
                        </span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-orange-600 h-2 rounded-full"
                          style={{ width: `${(revenueStats.membershipRevenue / revenueStats.totalRevenue) * 100}%` }}
                        ></div>
                      </div>
                      <p className="text-right text-xs text-gray-400 mt-1">
                        {((revenueStats.membershipRevenue / revenueStats.totalRevenue) * 100).toFixed(1)}%
                      </p>
                    </div>
                  )}

                  {/* Royalty Payments */}
                  {revenueStats.royaltyPayments > 0 && (
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center">
                          <span className="text-yellow-400">Royalty Payments</span>
                          <span className="text-gray-400 text-sm ml-2">({revenueStats.royaltyCount} {revenueStats.royaltyCount === 1 ? 'transaction' : 'transactions'})</span>
                        </div>
                        <span className="text-white font-semibold">
                          ${revenueStats.royaltyPayments.toFixed(2)}
                        </span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-yellow-600 h-2 rounded-full"
                          style={{ width: `${(revenueStats.royaltyPayments / revenueStats.totalRevenue) * 100}%` }}
                        ></div>
                      </div>
                      <p className="text-right text-xs text-gray-400 mt-1">
                        {((revenueStats.royaltyPayments / revenueStats.totalRevenue) * 100).toFixed(1)}%
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Transaction History */}
        <Card className="bg-white/5 backdrop-blur-sm rounded-xl border border-purple-500/20 p-6 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <h2 className="text-2xl font-bold text-white mb-4 md:mb-0">Transaction History</h2>
            
            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as any)}
                  className="pl-8 pr-4 py-1 bg-white/5 border border-purple-500/20 rounded-lg text-white text-sm"
                >
                  <option value="all">All Types</option>
                  <option value="sync_proposals">Sync Proposals</option>
                  <option value="custom_sync">Custom Sync</option>
                  <option value="license_fees">License Fees</option>
                  <option value="membership">Membership</option>
                  <option value="royalties">Royalties</option>
                  <option value="withdrawals">Withdrawals</option>
                  <option value="adjustments">Adjustments</option>
                </select>
                <Filter className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
              
              <div className="relative">
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value as any)}
                  className="pl-8 pr-4 py-1 bg-white/5 border border-purple-500/20 rounded-lg text-white text-sm"
                >
                  <option value="30days">Last 30 Days</option>
                  <option value="90days">Last 90 Days</option>
                  <option value="year">Last Year</option>
                  <option value="all">All Time</option>
                </select>
                <Calendar className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
              
              <button
                onClick={() => handleSort('date')}
                className="flex items-center space-x-1 px-3 py-1 bg-white/5 border border-purple-500/20 rounded-lg text-white text-sm hover:bg-white/10"
              >
                <span>Date</span>
                <ArrowUpDown className="w-3 h-3" />
              </button>
              
              <button
                onClick={() => handleSort('amount')}
                className="flex items-center space-x-1 px-3 py-1 bg-white/5 border border-purple-500/20 rounded-lg text-white text-sm hover:bg-white/10"
              >
                <span>Amount</span>
                <ArrowUpDown className="w-3 h-3" />
              </button>
            </div>
          </div>

          {transactions.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-400">No transactions found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="bg-white/5 rounded-lg overflow-hidden"
                >
                  <div 
                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/5"
                    onClick={() => toggleTransaction(transaction.id)}
                  >
                    <div className="flex items-center space-x-4">
                      {getTransactionIcon(transaction.type, transaction.status)}
                      <div>
                        <p className="text-white font-medium">
                          {transaction.description}
                        </p>
                        <p className="text-sm text-gray-400">
                          {new Date(transaction.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <p className={`text-lg font-semibold ${
                        transaction.type === 'withdrawal' || (transaction.type === 'adjustment' && transaction.amount < 0)
                          ? 'text-red-400'
                          : 'text-green-400'
                      }`}>
                        {transaction.type === 'withdrawal' || (transaction.type === 'adjustment' && transaction.amount < 0)
                          ? '-'
                          : '+'}
                        ${Math.abs(transaction.amount).toFixed(2)}
                      </p>
                      {expandedTransaction === transaction.id ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                  
                  {expandedTransaction === transaction.id && (
                    <div className="px-4 pb-4 bg-white/5">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-400">Transaction ID</p>
                          <p className="text-white font-mono">{transaction.id}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Status</p>
                          <p className="text-white capitalize">{transaction.status}</p>
                        </div>
                        {transaction.track_title && (
                          <div>
                            <p className="text-gray-400">Track</p>
                            <p className="text-white">{transaction.track_title}</p>
                          </div>
                        )}
                        {transaction.client_name && (
                          <div>
                            <p className="text-gray-400">Client</p>
                            <p className="text-white">{transaction.client_name}</p>
                          </div>
                        )}
                        {transaction.project_title && (
                          <div>
                            <p className="text-gray-400">Project</p>
                            <p className="text-white">{transaction.project_title}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>

                 {/* Revenue Report Modal */}
         {showRevenueReport && (
           <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
             <div className="bg-blue-900/90 backdrop-blur-md rounded-xl border border-purple-500/20 w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden">
               <div className="p-6 border-b border-purple-500/20 flex-shrink-0">
                 <div className="flex items-center justify-between mb-6">
                   <div className="flex items-center">
                     <DollarSign className="w-6 h-6 text-green-500 mr-2" />
                     <h2 className="text-2xl font-bold text-white">Revenue Breakdown</h2>
                   </div>
                   <div className="flex items-center space-x-4">
                     <div className="flex space-x-2">
                       {(['month', 'quarter', 'year', 'all'] as const).map((period) => (
                         <button
                           key={period}
                           onClick={() => setTimeframe(period)}
                           className={`px-3 py-1 rounded-lg transition-colors ${
                             timeframe === period
                               ? 'bg-purple-600 text-white'
                               : 'bg-white/5 text-gray-400 hover:bg-white/10'
                           }`}
                         >
                           {period === 'month' ? 'Month' : 
                            period === 'quarter' ? 'Quarter' : 
                            period === 'year' ? 'Year' : 'All Time'}
                         </button>
                       ))}
                     </div>
                     <button
                       onClick={() => setShowRevenueReport(false)}
                       className="text-gray-400 hover:text-white transition-colors"
                     >
                       <X className="w-6 h-6" />
                     </button>
                   </div>
                 </div>
               </div>

               <div className="flex-1 overflow-y-auto p-6">
                 <div className="space-y-8">
                   <div className="flex justify-between items-center">
                     <h3 className="text-xl font-semibold text-white">Total Revenue</h3>
                     <button
                       onClick={() => exportRevenueReport('pdf')}
                       disabled={exporting}
                       className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center"
                     >
                       {exporting ? (
                         <>
                           <Loader2 className="w-5 h-5 animate-spin mr-2" />
                           Generating...
                         </>
                       ) : (
                         <>
                           <Download className="w-5 h-5 mr-2" />
                           Download Report
                         </>
                       )}
                     </button>
                   </div>
                   
                   <div className="bg-white/5 rounded-lg p-6 border border-purple-500/20">
                     <p className="text-3xl font-bold text-white">${revenueStats.totalRevenue.toFixed(2)}</p>
                     <p className="text-gray-400 mt-1">
                       {timeframe === 'month' ? 'Last 30 days' : 
                        timeframe === 'quarter' ? 'Last 3 months' : 
                        timeframe === 'year' ? 'Last 12 months' : 'All time'}
                     </p>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     {/* Revenue by Source */}
                     <div className="bg-white/5 rounded-lg p-6 border border-purple-500/20">
                       <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                         <PieChart className="w-5 h-5 mr-2 text-blue-400" />
                         Revenue by Source
                       </h3>
                       
                       <div className="space-y-4">
                         {revenueSources.length === 0 ? (
                           <p className="text-gray-400 text-center py-4">No revenue data available</p>
                         ) : (
                           revenueSources.map((source, index) => (
                             <div key={index}>
                               <div className="flex justify-between items-center mb-1">
                                 <div className="flex items-center">
                                   <span className="text-white">
                                     {source.source}
                                   </span>
                                   <span className="text-gray-400 text-sm ml-2">({source.count} {source.count === 1 ? 'transaction' : 'transactions'})</span>
                                 </div>
                                 <span className="text-white font-semibold">
                                   ${source.amount.toFixed(2)}
                                 </span>
                               </div>
                               <div className="w-full bg-gray-700 rounded-full h-2">
                                 <div 
                                   className="bg-blue-600 h-2 rounded-full"
                                   style={{ width: `${source.percentage}%` }}
                                 ></div>
                               </div>
                               <p className="text-right text-xs text-gray-400 mt-1">{source.percentage.toFixed(1)}%</p>
                             </div>
                           ))
                         )}
                       </div>
                     </div>

                     {/* Monthly Revenue Trend */}
                     <div className="bg-white/5 rounded-lg p-6 border border-purple-500/20">
                       <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                         <Calendar className="w-5 h-5 mr-2 text-blue-400" />
                         Monthly Revenue Trend
                       </h3>
                       
                       <div className="h-64 relative">
                         {monthlyRevenue.length === 0 || monthlyRevenue.every(item => item.amount === 0) ? (
                           <div className="flex flex-col items-center justify-center h-full text-center">
                             <Calendar className="w-12 h-12 text-gray-500 mb-2" />
                             <p className="text-gray-400">No revenue data for this period</p>
                             <p className="text-xs text-gray-500 mt-1">
                               Try selecting a different timeframe or check if you have any completed transactions
                             </p>
                           </div>
                         ) : (
                           <>
                             <div className="flex h-full items-end space-x-1">
                               {monthlyRevenue.map((item, index) => {
                                 const maxRevenue = Math.max(...monthlyRevenue.map(m => m.amount));
                                 const height = maxRevenue > 0 ? (item.amount / maxRevenue) * 100 : 0;
                                 
                                 return (
                                   <div key={index} className="flex-1 flex flex-col items-center">
                                     <div 
                                       className="w-full bg-blue-600 rounded-t-sm hover:bg-blue-500 transition-colors"
                                       style={{ height: `${height}%` }}
                                       title={`${item.month}: $${item.amount.toFixed(2)}`}
                                     ></div>
                                   </div>
                                 );
                               })}
                             </div>
                             
                             <div className="flex justify-between mt-2">
                               {monthlyRevenue.map((item, index) => (
                                 <div key={index} className="text-xs text-gray-400 transform -rotate-45 origin-top-left">
                                   {item.month}
                                 </div>
                               ))}
                             </div>
                           </>
                         )}
                       </div>
                     </div>
                   </div>

                   {/* Detailed Revenue Table */}
                   <div className="bg-white/5 rounded-lg p-6 border border-purple-500/20">
                     <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                       <FileText className="w-5 h-5 mr-2 text-blue-400" />
                       Detailed Revenue Breakdown
                     </h3>
                     
                     <div className="overflow-x-auto">
                       <table className="w-full">
                         <thead>
                           <tr className="border-b border-gray-700">
                             <th className="px-4 py-2 text-left text-gray-400">Revenue Source</th>
                             <th className="px-4 py-2 text-right text-gray-400">Count</th>
                             <th className="px-4 py-2 text-right text-gray-400">Amount</th>
                             <th className="px-4 py-2 text-right text-gray-400">Percentage</th>
                           </tr>
                         </thead>
                         <tbody>
                           {revenueSources.map((source, index) => (
                             <tr key={index} className="border-b border-gray-800">
                               <td className="px-4 py-3 text-white">
                                 {source.source}
                               </td>
                               <td className="px-4 py-3 text-right text-gray-300">{source.count}</td>
                               <td className="px-4 py-3 text-right font-medium text-white">
                                 ${source.amount.toFixed(2)}
                               </td>
                               <td className="px-4 py-3 text-right text-gray-300">{source.percentage.toFixed(1)}%</td>
                             </tr>
                           ))}
                           <tr className="bg-white/5">
                             <td className="px-4 py-3 text-white font-semibold">Total</td>
                             <td className="px-4 py-3 text-right text-gray-300">
                               {revenueSources.reduce((sum, source) => sum + source.count, 0)}
                             </td>
                             <td className="px-4 py-3 text-right text-white font-semibold">${revenueStats.totalRevenue.toFixed(2)}</td>
                             <td className="px-4 py-3 text-right text-gray-300">100%</td>
                           </tr>
                         </tbody>
                       </table>
                     </div>
                   </div>
                 </div>
               </div>
             </div>
           </div>
         )}
      </div>
    </div>
  );
}
