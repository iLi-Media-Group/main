import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { DollarSign, TrendingUp, Users, Calculator, AlertCircle } from 'lucide-react';

interface MembershipDistribution {
  producer_id: string;
  producer_email: string;
  producer_name: string;
  monthly_sales: number;
  previous_month_sales: number;
  growth_percentage: number;
  membership_share: number;
  growth_bonus: number;
  total_membership_earnings: number;
}

interface CompensationSettings {
  standard_rate: number;
  exclusive_rate: number;
  sync_fee_rate: number;
  no_sales_bucket_rate: number;
  growth_bonus_rate: number;
  no_sale_bonus_rate: number;
}

interface MembershipRevenue {
  active_subscriptions: number;
  total_monthly_revenue: number;
  producer_bucket_amount: number;
}

export function MembershipCompensationPlan() {
  const [distribution, setDistribution] = useState<MembershipDistribution[]>([]);
  const [settings, setSettings] = useState<CompensationSettings | null>(null);
  const [revenue, setRevenue] = useState<MembershipRevenue | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  useEffect(() => {
    fetchData();
  }, [selectedMonth]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch compensation settings
      const { data: settingsData, error: settingsError } = await supabase
        .from('compensation_settings')
        .select('*')
        .eq('id', 1)
        .single();
      
      if (settingsError) {
        console.error('Error fetching compensation settings:', settingsError);
        setError('Failed to fetch compensation settings: ' + settingsError.message);
      } else if (settingsData) {
        setSettings(settingsData);
      }

      // Try the working function first
      const { data: revenueData, error: revenueError } = await supabase
        .rpc('calculate_membership_revenue_summary_working', { month_date: selectedMonth + '-01' });
      
      if (revenueError) {
        console.error('Error fetching membership revenue (working):', revenueError);
        // Try the function with join as fallback
        const { data: revenueData2, error: revenueError2 } = await supabase
          .rpc('calculate_membership_revenue_summary_with_join', { month_date: selectedMonth + '-01' });
        
        if (revenueError2) {
          console.error('Error fetching membership revenue (with join):', revenueError2);
          // Try the original function as final fallback
          const { data: revenueData3, error: revenueError3 } = await supabase
            .rpc('calculate_membership_revenue_summary', { month_date: selectedMonth + '-01' });
          
          if (revenueError3) {
            console.error('Error fetching membership revenue (original):', revenueError3);
            setError('Failed to fetch membership revenue: ' + revenueError3.message);
          } else if (revenueData3) {
            setRevenue(revenueData3[0]);
          }
        } else if (revenueData2) {
          setRevenue(revenueData2[0]);
        }
      } else if (revenueData) {
        setRevenue(revenueData[0]);
      }

      // Fetch distribution calculation
      const { data: distributionData, error: distributionError } = await supabase
        .rpc('calculate_membership_plan_distribution', { month_date: selectedMonth + '-01' });
      
      if (distributionError) {
        console.error('Error fetching distribution data:', distributionError);
        setError('Failed to fetch distribution data: ' + distributionError.message);
      } else if (distributionData) {
        setDistribution(distributionData);
      }
    } catch (error) {
      console.error('Error fetching membership compensation data:', error);
      setError('Unexpected error: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const runDistribution = async () => {
    if (!confirm('This will distribute membership revenue to all producers. Continue?')) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase
        .rpc('distribute_membership_revenue', { month_date: selectedMonth + '-01' });
      
      if (error) {
        throw error;
      }
      
      alert('Membership revenue distribution completed successfully!');
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error running distribution:', error);
      setError('Error running distribution: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2 flex items-center">
          <Calculator className="w-6 h-6 mr-2" />
          Membership Compensation Plan
        </h2>
        <p className="text-gray-400">
          The 45% producer bucket distributes membership revenue among producers based on their sales performance.
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-900/20 border border-red-500/20 rounded-lg">
          <h3 className="text-lg font-semibold text-red-400 mb-2">Error</h3>
          <p className="text-red-300">{error}</p>
          <button
            onClick={fetchData}
            className="mt-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
          >
            Retry
          </button>
        </div>
      )}

      {/* Month Selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Select Month
        </label>
        <input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white"
        />
      </div>

      {/* Revenue Summary */}
      {revenue ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-blue-900/20 border border-blue-500/20 rounded-lg p-4">
            <div className="flex items-center">
              <Users className="w-5 h-5 text-blue-400 mr-2" />
              <h3 className="text-lg font-semibold text-white">Active Subscriptions</h3>
            </div>
            <p className="text-2xl font-bold text-blue-400">{revenue.active_subscriptions}</p>
          </div>
          
          <div className="bg-green-900/20 border border-green-500/20 rounded-lg p-4">
            <div className="flex items-center">
              <DollarSign className="w-5 h-5 text-green-400 mr-2" />
              <h3 className="text-lg font-semibold text-white">Total Monthly Revenue</h3>
            </div>
            <p className="text-2xl font-bold text-green-400">
              {formatCurrency(revenue.total_monthly_revenue)}
            </p>
          </div>
          
          <div className="bg-purple-900/20 border border-purple-500/20 rounded-lg p-4">
            <div className="flex items-center">
              <TrendingUp className="w-5 h-5 text-purple-400 mr-2" />
              <h3 className="text-lg font-semibold text-white">Producer Bucket (45%)</h3>
            </div>
            <p className="text-2xl font-bold text-purple-400">
              {formatCurrency(revenue.producer_bucket_amount)}
            </p>
          </div>
        </div>
      ) : (
        <div className="mb-6 p-4 bg-yellow-900/20 border border-yellow-500/20 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-yellow-400 mr-2" />
            <h3 className="text-lg font-semibold text-yellow-400">No Active Subscriptions</h3>
          </div>
          <p className="text-yellow-300 mt-2">
            There are currently no active membership subscriptions for the selected month. 
            The compensation plan will be calculated once subscriptions become active.
          </p>
        </div>
      )}

      {/* Compensation Settings */}
      {settings && (
        <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-white mb-4">Compensation Settings</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-400">Standard Rate</p>
              <p className="text-lg font-semibold text-white">{settings.standard_rate}%</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Exclusive Rate</p>
              <p className="text-lg font-semibold text-white">{settings.exclusive_rate}%</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Sync Fee Rate</p>
              <p className="text-lg font-semibold text-white">{settings.sync_fee_rate}%</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">No Sales Bucket Rate</p>
              <p className="text-lg font-semibold text-white">{settings.no_sales_bucket_rate}%</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Growth Bonus Rate</p>
              <p className="text-lg font-semibold text-white">{settings.growth_bonus_rate}%</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">No Sale Bonus Rate</p>
              <p className="text-lg font-semibold text-white">{settings.no_sale_bonus_rate}%</p>
            </div>
          </div>
        </div>
      )}

      {/* Distribution Table */}
      <div className="bg-gray-800/50 border border-gray-600 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-gray-600 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-white">Producer Distribution</h3>
          <button
            onClick={runDistribution}
            disabled={loading || !revenue || revenue.active_subscriptions === 0}
            className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg flex items-center"
          >
            <Calculator className="w-4 h-4 mr-2" />
            {loading ? 'Running...' : 'Run Distribution'}
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700/50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Producer</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-300">Monthly Sales</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-300">Previous Month</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-300">Growth</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-300">Membership Share</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-300">Growth Bonus</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-300">Total Earnings</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-600">
              {distribution.map((item, index) => (
                <tr key={item.producer_id} className="hover:bg-gray-700/30">
                  <td className="px-4 py-3 text-sm text-white">
                    <div>
                      <p className="font-medium">{item.producer_name}</p>
                      <p className="text-gray-400 text-xs">{item.producer_email}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-white">
                    {formatCurrency(item.monthly_sales)}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-white">
                    {formatCurrency(item.previous_month_sales)}
                  </td>
                  <td className="px-4 py-3 text-sm text-right">
                    <span className={`font-medium ${
                      item.growth_percentage > 0 ? 'text-green-400' : 
                      item.growth_percentage < 0 ? 'text-red-400' : 'text-gray-400'
                    }`}>
                      {formatPercentage(item.growth_percentage)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-white">
                    {formatCurrency(item.membership_share)}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-green-400">
                    {formatCurrency(item.growth_bonus)}
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-semibold text-purple-400">
                    {formatCurrency(item.total_membership_earnings)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {distribution.length === 0 && (
          <div className="p-8 text-center text-gray-400">
            {revenue && revenue.active_subscriptions === 0 ? (
              <div>
                <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-500" />
                <p>No active subscriptions found for the selected month.</p>
                <p className="text-sm mt-1">Producer distribution will be calculated once subscriptions become active.</p>
              </div>
            ) : (
              <div>
                <p>No producers found or no distribution data available for the selected month.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Summary */}
      {distribution.length > 0 && (
        <div className="mt-6 bg-gray-800/50 border border-gray-600 rounded-lg p-4">
          <h4 className="text-lg font-semibold text-white mb-3">Distribution Summary</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-400">Total Producers</p>
              <p className="text-lg font-semibold text-white">{distribution.length}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Total Distribution</p>
              <p className="text-lg font-semibold text-purple-400">
                {formatCurrency(distribution.reduce((sum, item) => sum + item.total_membership_earnings, 0))}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Average Share</p>
              <p className="text-lg font-semibold text-white">
                {formatCurrency(distribution.reduce((sum, item) => sum + item.total_membership_earnings, 0) / distribution.length)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Producers with Growth</p>
              <p className="text-lg font-semibold text-green-400">
                {distribution.filter(item => item.growth_percentage > 0).length}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
