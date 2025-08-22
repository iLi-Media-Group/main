import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Percent, DollarSign, Save, Loader2, AlertTriangle, Clock, Calculator } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useUnifiedAuth } from '../contexts/UnifiedAuthContext';
import { MembershipCompensationPlan } from './MembershipCompensationPlan';

export function CompensationSettings() {
  const { user } = useUnifiedAuth();
  const [standardRate, setStandardRate] = useState(75); // Updated to 75%
  const [exclusiveRate, setExclusiveRate] = useState(80);
  const [syncFeeRate, setSyncFeeRate] = useState(90); // Updated to 90%
  const [customSyncRate, setCustomSyncRate] = useState(90); // Added custom sync rate
  const [holdingPeriod, setHoldingPeriod] = useState(30);
  const [minimumWithdrawal, setMinimumWithdrawal] = useState(50);
  const [processingFee, setProcessingFee] = useState(2);
  const [noSalesBucketRate, setNoSalesBucketRate] = useState(2); // Added no sales bucket rate
  const [growthBonusRate, setGrowthBonusRate] = useState(5); // Added growth bonus rate
  const [noSaleBonusRate, setNoSaleBonusRate] = useState(3); // Added no sale bonus rate
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [activeSection, setActiveSection] = useState<'settings' | 'membership'>('settings');

  useEffect(() => {
    if (user) {
      fetchSettings();
    }
  }, [user]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if user is admin
      const { data: profileData } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', user?.id)
        .single();

      if (!profileData || !['knockriobeats@gmail.com', 'info@mybeatfi.io', 'derykbanks@yahoo.com', 'knockriobeats2@gmail.com'].includes(profileData.email)) {
        throw new Error('Unauthorized access');
      }

      // Fetch compensation settings
      const { data, error } = await supabase
        .from('compensation_settings')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setStandardRate(data.standard_rate);
        setExclusiveRate(data.exclusive_rate);
        setSyncFeeRate(data.sync_fee_rate);
        setCustomSyncRate(data.custom_sync_rate || 90); // Load custom sync rate
        setHoldingPeriod(data.holding_period);
        setMinimumWithdrawal(data.minimum_withdrawal);
        setProcessingFee(data.processing_fee);
        setNoSalesBucketRate(data.no_sales_bucket_rate || 2);
        setGrowthBonusRate(data.growth_bonus_rate || 5);
        setNoSaleBonusRate(data.no_sale_bonus_rate || 3);
      }
    } catch (err) {
      console.error('Error fetching compensation settings:', err);
      setError('Failed to load compensation settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      // Validate inputs
      if (standardRate < 0 || standardRate > 100) {
        throw new Error('Standard rate must be between 0 and 100');
      }
      if (exclusiveRate < 0 || exclusiveRate > 100) {
        throw new Error('Exclusive rate must be between 0 and 100');
      }
      if (syncFeeRate < 0 || syncFeeRate > 100) {
        throw new Error('Sync fee rate must be between 0 and 100');
      }
      if (customSyncRate < 0 || customSyncRate > 100) {
        throw new Error('Custom sync rate must be between 0 and 100');
      }
      if (holdingPeriod < 0) {
        throw new Error('Holding period must be a positive number');
      }
      if (minimumWithdrawal < 0) {
        throw new Error('Minimum withdrawal must be a positive number');
      }
      if (processingFee < 0 || processingFee > 100) {
        throw new Error('Processing fee must be between 0 and 100');
      }
      if (noSalesBucketRate < 0 || noSalesBucketRate > 100) {
        throw new Error('No sales bucket rate must be between 0 and 100');
      }
      if (growthBonusRate < 0 || growthBonusRate > 100) {
        throw new Error('Growth bonus rate must be between 0 and 100');
      }
      if (noSaleBonusRate < 0 || noSaleBonusRate > 100) {
        throw new Error('No sale bonus rate must be between 0 and 100');
      }

      // Update compensation settings
      const { error: updateError } = await supabase
        .from('compensation_settings')
        .upsert({
          id: 1,
          standard_rate: standardRate,
          exclusive_rate: exclusiveRate,
          sync_fee_rate: syncFeeRate,
          custom_sync_rate: customSyncRate, // Save custom sync rate
          holding_period: holdingPeriod,
          minimum_withdrawal: minimumWithdrawal,
          processing_fee: processingFee,
          no_sales_bucket_rate: noSalesBucketRate,
          growth_bonus_rate: growthBonusRate,
          no_sale_bonus_rate: noSaleBonusRate,
          updated_at: new Date().toISOString()
        });

      if (updateError) throw updateError;

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving compensation settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Compensation Management</h1>
        <p className="text-gray-400">Manage compensation rates and membership revenue distribution</p>
      </div>

      {/* Section Navigation */}
      <div className="flex space-x-1 mb-8 bg-white/5 rounded-lg p-1">
        <button
          onClick={() => setActiveSection('settings')}
          className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
            activeSection === 'settings'
              ? 'bg-blue-600 text-white'
              : 'text-gray-300 hover:text-white hover:bg-blue-500/10'
          }`}
        >
          <div className="flex items-center justify-center space-x-2">
            <Percent className="w-4 h-4" />
            <span>Basic Settings</span>
          </div>
        </button>
        <button
          onClick={() => setActiveSection('membership')}
          className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
            activeSection === 'membership'
              ? 'bg-purple-600 text-white'
              : 'text-gray-300 hover:text-white hover:bg-purple-500/10'
          }`}
        >
          <div className="flex items-center justify-center space-x-2">
            <Calculator className="w-4 h-4" />
            <span>Membership Plan</span>
          </div>
        </button>
      </div>

      {/* Basic Compensation Settings */}
      {activeSection === 'settings' && (
        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-blue-500/20 p-6">
          <div className="flex items-center mb-6">
            <Percent className="w-6 h-6 text-blue-400 mr-2" />
            <h2 className="text-2xl font-bold text-white">Basic Compensation Settings</h2>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-900/20 border border-red-500/20 rounded-lg">
              <div className="flex items-center">
                <AlertTriangle className="w-5 h-5 text-red-400 mr-2" />
                <span className="text-red-300">{error}</span>
              </div>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-900/20 border border-green-500/20 rounded-lg">
              <div className="flex items-center">
                <Save className="w-5 h-5 text-green-400 mr-2" />
                <span className="text-green-300">Settings saved successfully!</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Track Sales Compensation */}
            <div className="p-4 bg-blue-900/20 border border-blue-500/20 rounded-lg">
              <h3 className="text-lg font-semibold text-white mb-4">Track Sales Compensation</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Standard License Rate (%)
                  </label>
                  <div className="relative">
                    <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="number"
                      value={standardRate}
                      onChange={(e) => setStandardRate(parseInt(e.target.value))}
                      className="w-full pl-10"
                      min="0"
                      max="100"
                      required
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-400">
                    Percentage of track sales revenue that goes to producers
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Exclusive License Rate (%)
                  </label>
                  <div className="relative">
                    <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="number"
                      value={exclusiveRate}
                      onChange={(e) => setExclusiveRate(parseInt(e.target.value))}
                      className="w-full pl-10"
                      min="0"
                      max="100"
                      required
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-400">
                    Percentage of exclusive license revenue that goes to producers
                  </p>
                </div>
              </div>
            </div>

            {/* Sync Proposal Compensation */}
            <div className="p-4 bg-green-900/20 border border-green-500/20 rounded-lg">
              <h3 className="text-lg font-semibold text-white mb-4">Sync Proposal Compensation</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Sync Fee Rate (%)
                  </label>
                  <div className="relative">
                    <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="number"
                      value={syncFeeRate}
                      onChange={(e) => setSyncFeeRate(parseInt(e.target.value))}
                      className="w-full pl-10"
                      min="0"
                      max="100"
                      required
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-400">
                    Percentage of sync proposal fees that goes to producers
                  </p>
                </div>
              </div>
            </div>

            {/* Custom Sync Request Compensation */}
            <div className="p-4 bg-purple-900/20 border border-purple-500/20 rounded-lg">
              <h3 className="text-lg font-semibold text-white mb-4">Custom Sync Request Compensation</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Custom Sync Rate (%)
                  </label>
                  <div className="relative">
                    <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="number"
                      value={customSyncRate}
                      onChange={(e) => setCustomSyncRate(parseInt(e.target.value))}
                      className="w-full pl-10"
                      min="0"
                      max="100"
                      required
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-400">
                    Percentage of custom sync request fees that goes to producers
                  </p>
                </div>
              </div>
            </div>

            {/* Payout Settings */}
            <div className="p-4 bg-purple-900/20 border border-purple-500/20 rounded-lg">
              <h3 className="text-lg font-semibold text-white mb-4">Payout Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Holding Period (Days)
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="number"
                      value={holdingPeriod}
                      onChange={(e) => setHoldingPeriod(parseInt(e.target.value))}
                      className="w-full pl-10"
                      min="0"
                      required
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-400">
                    Days to hold earnings before they become available
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Minimum Withdrawal ($)
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="number"
                      value={minimumWithdrawal}
                      onChange={(e) => setMinimumWithdrawal(parseInt(e.target.value))}
                      className="w-full pl-10"
                      min="0"
                      required
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-400">
                    Minimum amount required for withdrawal
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Processing Fee (%)
                  </label>
                  <div className="relative">
                    <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="number"
                      value={processingFee}
                      onChange={(e) => setProcessingFee(parseInt(e.target.value))}
                      className="w-full pl-10"
                      min="0"
                      max="100"
                      required
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-400">
                    Processing fee for withdrawals
                  </p>
                </div>
              </div>
            </div>

            {/* Membership Plan Revenue */}
            <div className="p-4 bg-blue-900/20 border border-blue-500/20 rounded-lg">
              <h3 className="text-lg font-semibold text-white mb-4">Membership Plan Revenue</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    No Sales Bucket Rate (%)
                  </label>
                  <div className="relative">
                    <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="number"
                      value={noSalesBucketRate}
                      onChange={(e) => setNoSalesBucketRate(parseInt(e.target.value))}
                      className="w-full pl-10"
                      min="0"
                      max="100"
                      required
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-400">
                    Percentage of membership revenue allocated to producers with no sales (2% recommended)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Growth Bonus Rate (%)
                  </label>
                  <div className="relative">
                    <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="number"
                      value={growthBonusRate}
                      onChange={(e) => setGrowthBonusRate(parseInt(e.target.value))}
                      className="w-full pl-10"
                      min="0"
                      max="100"
                      required
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-400">
                    Bonus percentage for producers with increasing sales
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    No Sale Bonus Rate (%)
                  </label>
                  <div className="relative">
                    <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="number"
                      value={noSaleBonusRate}
                      onChange={(e) => setNoSaleBonusRate(parseInt(e.target.value))}
                      className="w-full pl-10"
                      min="0"
                      max="100"
                      required
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-400">
                    Additional bonus for producers with no sales
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-2 rounded-lg flex items-center"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Settings
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Membership Compensation Plan */}
      {activeSection === 'membership' && (
        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-purple-500/20">
          <MembershipCompensationPlan />
        </div>
      )}
    </div>
  );
}
