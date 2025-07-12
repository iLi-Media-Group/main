import React, { useState } from 'react';
import { X, Building, Hash, CreditCard } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface BankAccountFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  existingAccounts: any[];
}

export function BankAccountForm({ isOpen, onClose, onSave, existingAccounts }: BankAccountFormProps) {
  const { user } = useAuth();
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [routingNumber, setRoutingNumber] = useState('');
  const [isPrimary, setIsPrimary] = useState(existingAccounts.length === 0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setLoading(true);
      setError('');

      // Validate bank account fields
      if (!bankName.trim() || !accountNumber.trim() || !routingNumber.trim()) {
        throw new Error('Please fill in all bank account fields');
      }

      // Prepare account details
      const accountDetails = {
        bank_name: bankName.trim(),
        account_number: accountNumber.trim(),
        routing_number: routingNumber.trim()
      };

      // If this is set as primary, update all other accounts to not be primary
      if (isPrimary && existingAccounts.length > 0) {
        const { error: updateError } = await supabase
          .from('producer_payment_methods')
          .update({ is_primary: false })
          .eq('payment_method_producer_id', user.id);

        if (updateError) throw updateError;
      }

      // Insert new payment method
      const { error: insertError } = await supabase
        .from('producer_payment_methods')
        .insert({
          payment_method_producer_id: user.id,
          account_type: 'bank',
          account_details: accountDetails,
          is_primary: isPrimary
        });

      if (insertError) throw insertError;

      onSave();
      onClose();
    } catch (err) {
      console.error('Error saving payment method:', err);
      setError(err instanceof Error ? err.message : 'Failed to save payment method');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/5 backdrop-blur-md p-6 rounded-xl border border-purple-500/20 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Add Payout Method</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-400 text-center">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Bank Name
            </label>
            <div className="relative">
              <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full pl-10"
                placeholder="Enter bank name"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Account Number
            </label>
            <div className="relative">
              <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                className="w-full pl-10"
                placeholder="Enter account number"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Routing Number
            </label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={routingNumber}
                onChange={(e) => setRoutingNumber(e.target.value)}
                className="w-full pl-10"
                placeholder="Enter routing number"
                required
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={isPrimary}
              onChange={(e) => setIsPrimary(e.target.checked)}
              className="rounded border-gray-600 text-purple-600 focus:ring-purple-500"
            />
            <label className="text-gray-300">
              Set as primary payment method
            </label>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Payment Method'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
