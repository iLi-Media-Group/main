import React, { useState } from 'react';
import { Banknote, Wallet, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { createStripePayout } from '../lib/stripe-payout';
import { supabase } from '../lib/supabase';

interface PayoutOnboardingProps {
  userId: string;
  onComplete?: () => void;
}

export function PayoutOnboarding({ userId, onComplete }: PayoutOnboardingProps) {
  const [step, setStep] = useState<'method' | 'bank' | 'complete'>('method');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stripeAccountId, setStripeAccountId] = useState('');
  const [payoutMethod, setPayoutMethod] = useState<'bank' | null>(null);

  const handleMethodSelect = (method: 'bank') => {
    setPayoutMethod(method);
    setStep(method);
  };

  const handleBankSetup = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // In a real app, you would create a Stripe Connect account here
      // This is just a simulation for the demo
      const mockAccountId = `acct_${Math.random().toString(36).substring(2, 10)}`;
      setStripeAccountId(mockAccountId);
      
      // Save to user profile
      const { error } = await supabase
        .from('profiles')
        .update({ 
          stripe_account_id: mockAccountId,
          payout_method: 'bank'
        })
        .eq('id', userId);

      if (error) throw error;
      
      setStep('complete');
      if (onComplete) onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-md mx-auto">
      {step === 'method' && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Select Payout Method</h3>
          <div className="space-y-2">
            <button
              onClick={() => handleMethodSelect('bank')}
              className="w-full py-3 px-6 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all flex items-center justify-center space-x-2"
            >
              <Banknote className="w-5 h-5" />
              <span>Bank Transfer</span>
            </button>
          </div>
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> All payments (including crypto payments from customers) are automatically converted to USD and paid out to your bank account.
            </p>
          </div>
        </div>
      )}

      {step === 'bank' && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Bank Account Setup</h3>
          <p className="text-sm text-gray-600">
            Connect your bank account to receive payments via ACH transfer.
          </p>
          
          <div className="p-4 border rounded-lg bg-gray-50">
            <p className="text-sm">
              In a production app, this would integrate with Stripe Connect to collect:
            </p>
            <ul className="list-disc pl-5 mt-2 text-sm space-y-1">
              <li>Bank account details</li>
              <li>Tax information</li>
              <li>Identity verification</li>
            </ul>
          </div>

          <button
            onClick={handleBankSetup}
            disabled={loading}
            className="w-full py-3 px-6 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <span>Complete Bank Setup</span>
            )}
          </button>
        </div>
      )}

      {step === 'complete' && (
        <div className="text-center space-y-4">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
          <h3 className="text-lg font-medium">Payout Setup Complete!</h3>
          <p className="text-sm text-gray-600">
            Your bank account is now connected for USD payouts. All payments will be automatically converted to USD and sent to your bank account.
          </p>
          <div className="p-3 bg-gray-50 rounded-lg text-sm">
            <p className="font-medium">Account ID: {stripeAccountId}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 text-red-700 rounded-lg flex items-start space-x-2">
          <XCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}
    </div>
  );
}
