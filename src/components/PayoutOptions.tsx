import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Building2, DollarSign, CheckCircle, AlertCircle } from 'lucide-react';

interface PayoutOptionsProps {
  onComplete?: () => void;
}

export function PayoutOptions({ onComplete }: PayoutOptionsProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [payoutMethod, setPayoutMethod] = useState<'bank' | null>(null);
  const [stripeAccountId, setStripeAccountId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      fetchPayoutSettings();
    }
  }, [user]);

  const fetchPayoutSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('producer_profiles')
        .select('payout_method, stripe_account_id')
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching payout settings:', error);
        return;
      }

      if (data) {
        setPayoutMethod(data.payout_method);
        setStripeAccountId(data.stripe_account_id);
      }
    } catch (err) {
      console.error('Error fetching payout settings:', err);
    }
  };

  const handlePayout = async (method: 'bank') => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase
        .from('producer_profiles')
        .upsert({
          user_id: user.id,
          payout_method: method,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      setPayoutMethod(method);
      setSuccess(true);
      
      if (onComplete) {
        onComplete();
      }
    } catch (err) {
      console.error('Error updating payout method:', err);
      setError('Failed to update payout method');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Choose Your Payout Method</h2>
        <p className="text-gray-400">
          Select how you'd like to receive your earnings. All payments are processed in USD.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center">
          <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
          <span className="text-red-400">{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center">
          <CheckCircle className="w-5 h-5 text-green-400 mr-2" />
          <span className="text-green-400">Payout method updated successfully!</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        <button
          onClick={() => handlePayout('bank')}
          disabled={loading || payoutMethod === 'bank'}
          className={`p-6 rounded-lg border transition-all ${
            payoutMethod === 'bank'
              ? 'border-green-500/40 bg-green-500/10'
              : 'border-purple-500/20 bg-white/5 hover:border-purple-500/40 hover:bg-white/10'
          } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Building2 className="w-6 h-6 text-blue-400" />
              </div>
              <div className="text-left">
                <h3 className="text-lg font-semibold text-white">Bank Account</h3>
                <p className="text-gray-400">Receive payments directly to your bank account</p>
              </div>
            </div>
            {payoutMethod === 'bank' && (
              <CheckCircle className="w-6 h-6 text-green-400" />
            )}
          </div>
        </button>
      </div>

      <div className="bg-blue-900/20 border border-blue-500/20 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <DollarSign className="w-5 h-5 text-blue-400 flex-shrink-0 mt-1" />
          <div>
            <h3 className="text-white font-medium mb-1">Payment Processing</h3>
            <p className="text-gray-300 text-sm">
              All payments (including crypto payments from customers) are automatically converted to USD and paid out to your bank account. 
              No crypto wallet setup required.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
