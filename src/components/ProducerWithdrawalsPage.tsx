import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Clock, CheckCircle, AlertCircle, DollarSign, Calendar, Loader2 } from 'lucide-react';

interface Withdrawal {
  id: string;
  withdrawal_producer_id: string;
  amount: number;
  status: 'pending' | 'completed' | 'rejected';
  created_at: string;
  updated_at: string;
  payment_method_type?: string;
  payment_details?: any;
}

export function ProducerWithdrawalsPage() {
  const { user } = useAuth();
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchWithdrawals();
    }
  }, [user]);

  const fetchWithdrawals = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('producer_withdrawals')
        .select('*')
        .eq('withdrawal_producer_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setWithdrawals(data || []);
    } catch (err) {
      console.error('Error fetching withdrawals:', err);
      setError('Failed to load withdrawal requests');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-400" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'rejected':
        return <AlertCircle className="w-5 h-5 text-red-400" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs">Pending</span>;
      case 'completed':
        return <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs">Completed</span>;
      case 'rejected':
        return <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded-full text-xs">Rejected</span>;
      default:
        return null;
    }
  };

  const getPaymentMethodLabel = (withdrawal: Withdrawal) => {
    if (!withdrawal.payment_method_type) return 'Unknown';
    
    if (withdrawal.payment_method_type === 'bank') {
      return `Bank Transfer`;
    } else if (withdrawal.payment_method_type === 'paypal') {
      return `PayPal`;
    } else if (withdrawal.payment_method_type === 'crypto') {
      return `Crypto`;
    }
    return 'Unknown';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">My Withdrawal Requests</h1>
          <p className="text-gray-400">
            Track the status of your withdrawal requests and payment history
          </p>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-400 text-center">{error}</p>
          </div>
        )}

        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-purple-500/20 p-6">
          {withdrawals.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-400">No withdrawal requests found</p>
              <p className="text-gray-500 text-sm mt-2">
                You haven't made any withdrawal requests yet.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {withdrawals.map((withdrawal) => (
                <div
                  key={withdrawal.id}
                  className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-purple-500/20 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {getStatusIcon(withdrawal.status)}
                      <div>
                        <div className="flex items-center space-x-2">
                          <p className="text-xl font-semibold text-white">
                            ${withdrawal.amount.toFixed(2)}
                          </p>
                          {getStatusBadge(withdrawal.status)}
                        </div>
                        <p className="text-gray-400 text-sm">
                          {getPaymentMethodLabel(withdrawal)}
                        </p>
                        <p className="text-gray-500 text-xs">
                          Requested: {new Date(withdrawal.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-gray-400 text-sm">
                        {withdrawal.status === 'completed' && withdrawal.updated_at && (
                          <span>Completed: {new Date(withdrawal.updated_at).toLocaleDateString()}</span>
                        )}
                      </p>
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