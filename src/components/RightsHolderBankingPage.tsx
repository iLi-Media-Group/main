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
  X
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

  useEffect(() => {
    if (user) {
      fetchData();
      fetchRevenueStats();
    }
  }, [user, filterType, dateRange, sortField, sortOrder]);

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
        throw balanceError;
      }

      if (balanceData) {
        setBalance(balanceData.available_balance || 0);
        setPendingBalance(balanceData.pending_balance || 0);
      }

      // Fetch transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('rights_holder_transactions')
        .select('*')
        .eq('rights_holder_id', user.id)
        .order('created_at', { ascending: false });

      if (transactionsError) throw transactionsError;
      setTransactions(transactionsData || []);

      // Fetch bank accounts
      const { data: bankAccountsData, error: bankAccountsError } = await supabase
        .from('rights_holder_bank_accounts')
        .select('*')
        .eq('rights_holder_id', user.id)
        .order('is_primary', { ascending: false });

      if (bankAccountsError && bankAccountsError.code !== 'PGRST116') {
        throw bankAccountsError;
      }
      setBankAccounts(bankAccountsData || []);

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
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      if (dateRange === '30days') {
        startDate.setDate(startDate.getDate() - 30);
      } else if (dateRange === '90days') {
        startDate.setDate(startDate.getDate() - 90);
      } else if (dateRange === 'year') {
        startDate.setFullYear(startDate.getFullYear() - 1);
      } else {
        startDate.setFullYear(2020); // All time
      }

      // Fetch sync proposals revenue
      const { data: syncProposalsData, error: syncProposalsError } = await supabase
        .from('sync_proposals')
        .select('*')
        .eq('rights_holder_id', user.id)
        .eq('status', 'accepted')
        .eq('payment_status', 'paid')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (syncProposalsError) throw syncProposalsError;

      // Fetch custom sync requests revenue
      const { data: customSyncData, error: customSyncError } = await supabase
        .from('custom_sync_requests')
        .select('*')
        .eq('selected_rights_holder_id', user.id)
        .eq('status', 'completed')
        .eq('payment_status', 'paid')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (customSyncError) throw customSyncError;

      // Fetch license fees revenue
      const { data: licenseFeesData, error: licenseFeesError } = await supabase
        .from('rights_holder_revenue')
        .select('*')
        .eq('rights_holder_id', user.id)
        .eq('revenue_type', 'license_fee')
        .eq('payment_status', 'paid')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (licenseFeesError) throw licenseFeesError;

      // Fetch membership revenue
      const { data: membershipData, error: membershipError } = await supabase
        .from('rights_holder_revenue')
        .select('*')
        .eq('rights_holder_id', user.id)
        .eq('revenue_type', 'membership_revenue')
        .eq('payment_status', 'paid')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (membershipError) throw membershipError;

      // Fetch royalty payments
      const { data: royaltyData, error: royaltyError } = await supabase
        .from('rights_holder_revenue')
        .select('*')
        .eq('rights_holder_id', user.id)
        .eq('revenue_type', 'royalty_payment')
        .eq('payment_status', 'paid')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (royaltyError) throw royaltyError;

      // Calculate totals
      const syncProposalsRevenue = syncProposalsData?.reduce((sum, p) => sum + (p.final_amount || p.negotiated_amount || p.sync_fee || 0), 0) || 0;
      const customSyncRevenue = customSyncData?.reduce((sum, c) => sum + (c.final_amount || c.negotiated_amount || c.sync_fee || 0), 0) || 0;
      const licenseFeesRevenue = licenseFeesData?.reduce((sum, l) => sum + l.rights_holder_amount, 0) || 0;
      const membershipRevenue = membershipData?.reduce((sum, m) => sum + m.rights_holder_amount, 0) || 0;
      const royaltyPayments = royaltyData?.reduce((sum, r) => sum + r.rights_holder_amount, 0) || 0;

      const totalRevenue = syncProposalsRevenue + customSyncRevenue + licenseFeesRevenue + membershipRevenue + royaltyPayments;

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
        syncProposalsCount: syncProposalsData?.length || 0,
        customSyncCount: customSyncData?.length || 0,
        licenseCount: licenseFeesData?.length || 0,
        membershipCount: membershipData?.length || 0,
        royaltyCount: royaltyData?.length || 0,
      });

    } catch (error) {
      console.error('Error fetching revenue stats:', error);
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="text-center">
                <p className="text-sm text-gray-400">Sync Proposals</p>
                <p className="text-lg font-bold text-white">${revenueStats.syncProposalsRevenue.toFixed(2)}</p>
                <p className="text-xs text-gray-500">{revenueStats.syncProposalsCount} transactions</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-400">Custom Sync</p>
                <p className="text-lg font-bold text-white">${revenueStats.customSyncRevenue.toFixed(2)}</p>
                <p className="text-xs text-gray-500">{revenueStats.customSyncCount} transactions</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-400">License Fees</p>
                <p className="text-lg font-bold text-white">${revenueStats.licenseFeesRevenue.toFixed(2)}</p>
                <p className="text-xs text-gray-500">{revenueStats.licenseCount} transactions</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-400">Membership</p>
                <p className="text-lg font-bold text-white">${revenueStats.membershipRevenue.toFixed(2)}</p>
                <p className="text-xs text-gray-500">{revenueStats.membershipCount} transactions</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-400">Royalties</p>
                <p className="text-lg font-bold text-white">${revenueStats.royaltyPayments.toFixed(2)}</p>
                <p className="text-xs text-gray-500">{revenueStats.royaltyCount} transactions</p>
              </div>
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
            <div className="bg-white/5 backdrop-blur-md p-6 rounded-xl border border-purple-500/20 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">Comprehensive Revenue Report</h3>
                <button
                  onClick={() => setShowRevenueReport(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-500/20">
                    <CardContent className="p-4">
                      <h4 className="text-lg font-semibold text-white mb-3">Sync Proposals</h4>
                      <p className="text-2xl font-bold text-green-400">${revenueStats.syncProposalsRevenue.toFixed(2)}</p>
                      <p className="text-sm text-gray-400">{revenueStats.syncProposalsCount} transactions</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/20">
                    <CardContent className="p-4">
                      <h4 className="text-lg font-semibold text-white mb-3">Custom Sync Requests</h4>
                      <p className="text-2xl font-bold text-blue-400">${revenueStats.customSyncRevenue.toFixed(2)}</p>
                      <p className="text-sm text-gray-400">{revenueStats.customSyncCount} transactions</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/20">
                    <CardContent className="p-4">
                      <h4 className="text-lg font-semibold text-white mb-3">License Fees</h4>
                      <p className="text-2xl font-bold text-purple-400">${revenueStats.licenseFeesRevenue.toFixed(2)}</p>
                      <p className="text-sm text-gray-400">{revenueStats.licenseCount} transactions</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/10 border-orange-500/20">
                    <CardContent className="p-4">
                      <h4 className="text-lg font-semibold text-white mb-3">Membership Revenue</h4>
                      <p className="text-2xl font-bold text-orange-400">${revenueStats.membershipRevenue.toFixed(2)}</p>
                      <p className="text-sm text-gray-400">{revenueStats.membershipCount} transactions</p>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={() => exportRevenueReport('csv')}
                    disabled={exporting}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>{exporting ? 'Exporting...' : 'Export CSV'}</span>
                  </button>
                  
                  <button
                    onClick={() => exportRevenueReport('pdf')}
                    disabled={exporting}
                    className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                  >
                    <FileTextIcon className="w-4 h-4" />
                    <span>{exporting ? 'Exporting...' : 'Export PDF'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
