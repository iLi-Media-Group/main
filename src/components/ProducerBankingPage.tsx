import React, { useState, useEffect, useCallback } from 'react';
import { DollarSign, CreditCard, Clock, Download, AlertCircle, CheckCircle, FileText, ChevronDown, ChevronUp, Filter, Calendar, ArrowUpDown, Loader2, Target } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useProducerBalancesRealTime } from '../hooks/useRealTimeUpdates';
import { BankAccountForm } from './BankAccountForm';
import { WithdrawalRequestForm } from './WithdrawalRequestForm';
import { Card, CardContent } from './ui/card';

interface Transaction {
  id: string;
  amount: number; // compensation amount
  original_amount?: number; // original transaction amount
  type: 'sale' | 'withdrawal' | 'adjustment';
  status: 'pending' | 'completed' | 'rejected';
  created_at: string;
  description: string;
  track_title?: string;
  reference_id?: string;
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

export function ProducerBankingPage() {
  const { user } = useAuth();
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
  const [filterType, setFilterType] = useState<'all' | 'sales' | 'withdrawals' | 'adjustments'>('all');
  const [dateRange, setDateRange] = useState<'all' | '30days' | '90days' | 'year'>('30days');
  const [profile, setProfile] = useState<{ first_name?: string, email: string } | null>(null);
  const [bucketPercentage, setBucketPercentage] = useState<{
    totalLicenses: number;
    producerLicenses: number;
    percentage: number;
    estimatedEarnings: number;
  } | null>(null);

  useEffect(() => {
    if (user) {
      fetchData();
      fetchBucketPercentage();
    }
  }, [user, filterType, dateRange, sortField, sortOrder]);

  // Set up real-time subscription for producer balances
  const handleBalanceUpdate = useCallback((payload: any) => {
    console.log('Producer balance real-time update:', payload);
    fetchData();
    fetchBucketPercentage();
  }, []);

  useProducerBalancesRealTime(handleBalanceUpdate);

  // Add manual refresh function
  const handleManualRefresh = async () => {
    if (user) {
      setLoading(true);
      try {
        // Force refresh by clearing any cached data
        setBalance(0);
        setPendingBalance(0);
        setTransactions([]);
        
        // Add a small delay to ensure state is cleared
        await new Promise(resolve => setTimeout(resolve, 100));
        
        await fetchData();
      } catch (error) {
        console.error('Error refreshing banking data:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch profile data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('first_name, email')
        .eq('id', user?.id)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Fetch producer balance using maybeSingle() instead of single()
      const { data: balanceData, error: balanceError } = await supabase
        .from('producer_balances')
        .select('available_balance, pending_balance, lifetime_earnings')
        .eq('balance_producer_id', user?.id)
        .maybeSingle();

      if (balanceError) throw balanceError;
      
      console.log('Balance data fetched:', balanceData); // Debug log
      
      if (balanceData) {
        setBalance(balanceData.available_balance || 0);
        setPendingBalance(balanceData.pending_balance || 0);
        console.log('Set balance:', balanceData.available_balance, 'pending:', balanceData.pending_balance); // Debug log
      } else {
        // Create balance record if it doesn't exist
        const { error: insertError } = await supabase
          .from('producer_balances')
          .insert({
            balance_producer_id: user?.id,
            available_balance: 0,
            pending_balance: 0,
            lifetime_earnings: 0
          });

        if (insertError) throw insertError;
        setBalance(0);
        setPendingBalance(0);
      }

      // Fetch bank accounts
      const { data: accountsData, error: accountsError } = await supabase
        .from('producer_payment_methods')
        .select('*')
        .eq('payment_method_producer_id', user?.id)
        .order('is_primary', { ascending: false });

      if (accountsError) throw accountsError;
      setBankAccounts(accountsData || []);

      // Build date filter
      let dateFilter = '';
      const now = new Date();
      if (dateRange === '30days') {
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(now.getDate() - 30);
        dateFilter = `created_at.gte.${thirtyDaysAgo.toISOString()}`;
      } else if (dateRange === '90days') {
        const ninetyDaysAgo = new Date(now);
        ninetyDaysAgo.setDate(now.getDate() - 90);
        dateFilter = `created_at.gte.${ninetyDaysAgo.toISOString()}`;
      } else if (dateRange === 'year') {
        const oneYearAgo = new Date(now);
        oneYearAgo.setFullYear(now.getFullYear() - 1);
        dateFilter = `created_at.gte.${oneYearAgo.toISOString()}`;
      }

      // Build type filter
      let typeFilter = '';
      if (filterType === 'sales') {
        typeFilter = 'type.eq.sale';
      } else if (filterType === 'withdrawals') {
        typeFilter = 'type.eq.withdrawal';
      } else if (filterType === 'adjustments') {
        typeFilter = 'type.eq.adjustment';
      }

      // Fetch transactions with proper filtering
      let query = supabase
        .from('producer_transactions')
        .select('*')
        .eq('transaction_producer_id', user?.id);

      // Apply date filter if specified
      if (dateFilter) {
        const filterParts = dateFilter.split('.');
        if (filterParts.length === 3) {
          query = query.gte(filterParts[0], filterParts[2]);
        }
      }

      // Apply type filter if specified
      if (typeFilter) {
        const filterParts = typeFilter.split('.');
        if (filterParts.length === 3) {
          query = query.eq(filterParts[0], filterParts[2]);
        }
      }

      // Apply sorting
      query = query.order(sortField === 'date' ? 'created_at' : sortField, { 
        ascending: sortOrder === 'asc' 
      });

      const { data: transactionsData, error: transactionsError } = await query;

      if (transactionsError) throw transactionsError;
      setTransactions(transactionsData || []);

    } catch (err) {
      console.error('Error fetching banking data:', err);
      setError('Failed to load banking information. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Add function to fetch bucket percentage
  const fetchBucketPercentage = async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_producer_bucket_percentage', {
          producer_id_input: user?.id,
          month_input: new Date().toISOString().slice(0, 7) // YYYY-MM format
        });

      if (error) {
        console.error('Error fetching bucket percentage:', error);
        return;
      }

      if (data && data.length > 0) {
        setBucketPercentage({
          totalLicenses: data[0].total_licenses || 0,
          producerLicenses: data[0].total_producer_licenses || 0,
          percentage: data[0].bucket_percentage || 0,
          estimatedEarnings: data[0].estimated_bucket_earnings || 0
        });
      }
    } catch (error) {
      console.error('Error fetching bucket percentage:', error);
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
    if (type === 'sale') {
      return <DollarSign className="w-5 h-5 text-green-400" />;
    } else if (type === 'withdrawal') {
      if (status === 'pending') {
        return <Clock className="w-5 h-5 text-yellow-400" />;
      } else if (status === 'completed') {
        return <CheckCircle className="w-5 h-5 text-blue-400" />;
      } else {
        return <AlertCircle className="w-5 h-5 text-red-400" />;
      }
    } else {
      return <FileText className="w-5 h-5 text-purple-400" />;
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
            <h1 className="text-3xl font-bold text-white">Producer Banking</h1>
            {profile && (
              <p className="text-xl text-gray-300 mt-2">
                Welcome {profile.first_name || profile.email.split('@')[0]}
              </p>
            )}
          </div>
          <button
            onClick={handleManualRefresh}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors flex items-center space-x-2"
          >
            <Loader2 className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-400 text-center">{error}</p>
          </div>
        )}

        {/* Balance Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          {/* Available Balance */}
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

          {/* Pending Balance */}
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

          {/* Membership Bucket Percentage */}
          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-400">Membership Bucket</p>
                  <p className="text-2xl font-bold text-white">{bucketPercentage?.percentage.toFixed(1) || '0.0'}%</p>
                  <p className="text-xs text-purple-300">
                    {bucketPercentage?.producerLicenses || 0} of {bucketPercentage?.totalLicenses || 0} licenses
                  </p>
                  {bucketPercentage && bucketPercentage.estimatedEarnings > 0 && (
                    <p className="text-xs text-purple-300">
                      Est: ${bucketPercentage.estimatedEarnings.toFixed(2)}
                    </p>
                  )}
                </div>
                <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center">
                  <Target className="w-6 h-6 text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Membership Bucket Explanation */}
        {bucketPercentage && (
          <Card className="mb-8 bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/20">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                <Target className="w-5 h-5 text-blue-400 mr-2" />
                Membership Revenue Sharing
              </h3>
              <div className="text-sm text-gray-300 space-y-2">
                <p>
                  <strong>Your Share:</strong> {bucketPercentage.percentage.toFixed(1)}% of the 45% producer bucket
                </p>
                <p>
                  <strong>Based on:</strong> {bucketPercentage.producerLicenses} track licenses this month 
                  (out of {bucketPercentage.totalLicenses} total licenses across all producers)
                </p>
                <p>
                  <strong>Estimated Earnings:</strong> ${bucketPercentage.estimatedEarnings.toFixed(2)} from membership revenue sharing
                </p>
                <p className="text-xs text-gray-400 mt-3">
                  The 45% producer bucket is distributed among all producers based on their track license activity. 
                  More licenses = higher percentage of the membership revenue pool.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-purple-500/20 p-6 mb-8">
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
                  <option value="sales">Sales</option>
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
                          {transaction.type === 'sale' && 'Sale: '}
                          {transaction.type === 'withdrawal' && 'Withdrawal: '}
                          {transaction.type === 'adjustment' && 'Adjustment: '}
                          {transaction.description}
                        </p>
                        <p className="text-sm text-gray-400">
                          {new Date(transaction.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <p className={`text-lg font-semibold ${
                        transaction.type === 'sale' || transaction.type === 'adjustment' && transaction.amount > 0
                          ? 'text-green-400'
                          : 'text-red-400'
                      }`}>
                        {transaction.type === 'sale' || transaction.type === 'adjustment' && transaction.amount > 0
                          ? '+'
                          : ''}
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
                    <div className="p-4 bg-black/20 border-t border-purple-500/10">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-400">Transaction ID</p>
                          <p className="text-white">{transaction.id}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">Status</p>
                          <p className={`
                            ${transaction.status === 'completed' ? 'text-green-400' : ''}
                            ${transaction.status === 'pending' ? 'text-yellow-400' : ''}
                            ${transaction.status === 'rejected' ? 'text-red-400' : ''}
                          `}>
                            {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                          </p>
                        </div>
                        {transaction.track_title && (
                          <div>
                            <p className="text-sm text-gray-400">Track</p>
                            <p className="text-white">{transaction.track_title}</p>
                          </div>
                        )}
                        {transaction.reference_id && (
                          <div>
                            <p className="text-sm text-gray-400">Reference</p>
                            <p className="text-white">{transaction.reference_id}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-sm text-gray-400">Date & Time</p>
                          <p className="text-white">{new Date(transaction.created_at).toLocaleString()}</p>
                        </div>
                      </div>
                      
                      {transaction.type === 'withdrawal' && transaction.status === 'completed' && (
                        <button
                          className="mt-4 flex items-center text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download Receipt
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showBankForm && (
        <BankAccountForm
          isOpen={showBankForm}
          onClose={() => setShowBankForm(false)}
          onSave={fetchData}
          existingAccounts={bankAccounts}
        />
      )}

      {showWithdrawalForm && (
        <WithdrawalRequestForm
          isOpen={showWithdrawalForm}
          onClose={() => setShowWithdrawalForm(false)}
          onSubmit={fetchData}
          availableBalance={balance}
          paymentMethods={bankAccounts}
        />
      )}
    </div>
  );
}
