import React, { useState, useEffect } from 'react';
import { useRightsHolderAuth } from '../contexts/RightsHolderAuthContext';
import { supabase } from '../lib/supabase';
import { 
  FileText, 
  DollarSign, 
  Users, 
  TrendingUp, 
  Calendar, 
  Search, 
  Filter,
  RefreshCw,
  Eye,
  Download,
  Mail,
  CheckCircle,
  Clock,
  AlertCircle,
  BarChart3,
  Settings,
  Plus,
  X,
  Save,
  Copy,
  Share2,
  ExternalLink,
  AtSign,
  Music,
  Building2,
  CreditCard,
  Receipt,
  UserCheck,
  UserX,
  FileCheck,
  FileX,
  ArrowRight,
  ArrowLeft,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface RightsHolderLicense {
  id: string;
  master_recording_id: string;
  rights_holder_id: string;
  buyer_id: string;
  license_type: 'single_track' | 'sync_license' | 'exclusive_license' | 'subscription_license';
  license_status: 'active' | 'expired' | 'cancelled' | 'pending';
  amount: number;
  payment_method: string;
  transaction_id?: string;
  stripe_payment_intent_id?: string;
  licensee_info: {
    name: string;
    email: string;
    company?: string;
  };
  license_start_date: string;
  license_end_date?: string;
  territory: string;
  usage_restrictions?: any;
  created_at: string;
  updated_at: string;
  master_recording: {
    title: string;
    artist: string;
    genre: string;
  };
  buyer: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

interface RightsHolderRevenue {
  id: string;
  rights_holder_id: string;
  license_id: string;
  revenue_type: 'license_fee' | 'sync_fee' | 'subscription_revenue' | 'royalty_payment';
  amount: number;
  mybeatfi_commission: number;
  rights_holder_amount: number;
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  stripe_payout_id?: string;
  payout_date?: string;
  created_at: string;
}

interface RightsHolderBalance {
  id: string;
  rights_holder_id: string;
  pending_balance: number;
  available_balance: number;
  lifetime_earnings: number;
  total_payouts: number;
  created_at: string;
  updated_at: string;
}

interface RoyaltyDistribution {
  id: string;
  license_id: string;
  master_recording_id: string;
  rights_holder_id: string;
  participant_id: string;
  participant_name: string;
  participant_role: string;
  percentage: number;
  amount_owed: number;
  amount_paid: number;
  payment_status: 'pending' | 'paid' | 'partial' | 'overdue';
  payment_date?: string;
  payment_method?: string;
  payment_reference?: string;
  notes?: string;
  created_at: string;
}

interface LicensingStats {
  totalLicenses: number;
  totalRevenue: number;
  totalEarnings: number;
  pendingBalance: number;
  availableBalance: number;
  lifetimeEarnings: number;
  activeLicenses: number;
  pendingPayouts: number;
  totalRoyaltyObligations: number;
  paidRoyalties: number;
}

export function RightsHolderLicensing() {
  const { rightsHolder } = useRightsHolderAuth();
  const [licenses, setLicenses] = useState<RightsHolderLicense[]>([]);
  const [revenue, setRevenue] = useState<RightsHolderRevenue[]>([]);
  const [balance, setBalance] = useState<RightsHolderBalance | null>(null);
  const [royaltyDistributions, setRoyaltyDistributions] = useState<RoyaltyDistribution[]>([]);
  const [stats, setStats] = useState<LicensingStats>({
    totalLicenses: 0,
    totalRevenue: 0,
    totalEarnings: 0,
    pendingBalance: 0,
    availableBalance: 0,
    lifetimeEarnings: 0,
    activeLicenses: 0,
    pendingPayouts: 0,
    totalRoyaltyObligations: 0,
    paidRoyalties: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'licenses' | 'revenue' | 'royalties' | 'agreements'>('licenses');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedLicense, setSelectedLicense] = useState<RightsHolderLicense | null>(null);
  const [showLicenseModal, setShowLicenseModal] = useState(false);
  const [showRoyaltyModal, setShowRoyaltyModal] = useState(false);
  const [selectedRoyalty, setSelectedRoyalty] = useState<RoyaltyDistribution | null>(null);

  // Fetch data on component mount
  useEffect(() => {
    if (rightsHolder) {
      fetchData();
    }
  }, [rightsHolder]);

  const fetchData = async () => {
    if (!rightsHolder) return;

    setLoading(true);
    setError(null);

    try {
      // Fetch licenses
      const { data: licensesData, error: licensesError } = await supabase
        .from('rights_holder_licenses')
        .select(`
          *,
          master_recording:master_recordings(title, artist, genre),
          buyer:profiles(first_name, last_name, email)
        `)
        .eq('rights_holder_id', rightsHolder.id)
        .order('created_at', { ascending: false });

      if (licensesError) throw licensesError;

      // Fetch revenue
      const { data: revenueData, error: revenueError } = await supabase
        .from('rights_holder_revenue')
        .select('*')
        .eq('rights_holder_id', rightsHolder.id)
        .order('created_at', { ascending: false });

      if (revenueError) throw revenueError;

      // Fetch balance
      const { data: balanceData, error: balanceError } = await supabase
        .from('rights_holder_balances')
        .select('*')
        .eq('rights_holder_id', rightsHolder.id)
        .single();

      if (balanceError && balanceError.code !== 'PGRST116') throw balanceError;

      // Fetch royalty distributions
      const { data: royaltyData, error: royaltyError } = await supabase
        .from('royalty_distributions')
        .select('*')
        .eq('rights_holder_id', rightsHolder.id)
        .order('created_at', { ascending: false });

      if (royaltyError) throw royaltyError;

      setLicenses(licensesData || []);
      setRevenue(revenueData || []);
      setBalance(balanceData);
      setRoyaltyDistributions(royaltyData || []);

      // Calculate stats
      const stats: LicensingStats = {
        totalLicenses: licensesData?.length || 0,
        totalRevenue: licensesData?.reduce((sum, license) => sum + license.amount, 0) || 0,
        totalEarnings: revenueData?.reduce((sum, rev) => sum + rev.rights_holder_amount, 0) || 0,
        pendingBalance: balanceData?.pending_balance || 0,
        availableBalance: balanceData?.available_balance || 0,
        lifetimeEarnings: balanceData?.lifetime_earnings || 0,
        activeLicenses: licensesData?.filter(l => l.license_status === 'active').length || 0,
        pendingPayouts: revenueData?.filter(r => r.payment_status === 'pending').length || 0,
        totalRoyaltyObligations: royaltyData?.reduce((sum, royalty) => sum + royalty.amount_owed, 0) || 0,
        paidRoyalties: royaltyData?.reduce((sum, royalty) => sum + royalty.amount_paid, 0) || 0,
      };

      setStats(stats);
    } catch (err) {
      console.error('Error fetching licensing data:', err);
      setError('Failed to load licensing data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'paid':
        return 'text-green-400 bg-green-400/20';
      case 'pending':
        return 'text-yellow-400 bg-yellow-400/20';
      case 'expired':
      case 'cancelled':
      case 'failed':
        return 'text-red-400 bg-red-400/20';
      case 'partial':
        return 'text-blue-400 bg-blue-400/20';
      case 'overdue':
        return 'text-orange-400 bg-orange-400/20';
      default:
        return 'text-gray-400 bg-gray-400/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
      case 'paid':
        return <CheckCircle className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'expired':
      case 'cancelled':
      case 'failed':
        return <X className="w-4 h-4" />;
      case 'partial':
        return <AlertCircle className="w-4 h-4" />;
      case 'overdue':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getLicenseTypeLabel = (type: string) => {
    switch (type) {
      case 'single_track':
        return 'Single Track';
      case 'sync_license':
        return 'Sync License';
      case 'exclusive_license':
        return 'Exclusive License';
      case 'subscription_license':
        return 'Subscription License';
      default:
        return type;
    }
  };

  const filteredLicenses = licenses.filter(license => {
    const matchesSearch = license.master_recording.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         license.licensee_info.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         license.license_type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || license.license_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredRoyalties = royaltyDistributions.filter(royalty => {
    const matchesSearch = royalty.participant_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         royalty.participant_role.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || royalty.payment_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleUpdateRoyaltyPayment = async (royaltyId: string, amountPaid: number, paymentMethod: string, notes: string) => {
    try {
      const { error } = await supabase
        .from('royalty_distributions')
        .update({
          amount_paid: amountPaid,
          payment_status: amountPaid >= royaltyDistributions.find(r => r.id === royaltyId)?.amount_owed ? 'paid' : 'partial',
          payment_date: new Date().toISOString(),
          payment_method: paymentMethod,
          notes: notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', royaltyId);

      if (error) throw error;

      await fetchData();
      setShowRoyaltyModal(false);
      setSelectedRoyalty(null);
      alert('Royalty payment updated successfully');
    } catch (err) {
      console.error('Error updating royalty payment:', err);
      alert('Failed to update royalty payment');
    }
  };

  const generateLicenseAgreement = async (licenseId: string) => {
    try {
      // This would integrate with the existing license agreement generation system
      // For now, we'll just show a success message
      alert('License agreement generation would be implemented here');
    } catch (err) {
      console.error('Error generating license agreement:', err);
      alert('Failed to generate license agreement');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-blue-900/90 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-300">Loading licensing data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-900/90 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <FileText className="w-8 h-8 text-blue-400 mr-2" />
            <h1 className="text-3xl font-bold text-white">Licensing & Revenue Management</h1>
          </div>
          <p className="text-gray-300">
            Manage licenses, track revenue, and handle royalty distributions
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="flex items-center">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <FileText className="w-6 h-6 text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-300">Total Licenses</p>
                <p className="text-2xl font-bold text-white">{stats.totalLicenses}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="flex items-center">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-300">Total Revenue</p>
                <p className="text-2xl font-bold text-white">${stats.totalRevenue.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="flex items-center">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-300">Your Earnings</p>
                <p className="text-2xl font-bold text-white">${stats.totalEarnings.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-500/20 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-300">Pending Balance</p>
                <p className="text-2xl font-bold text-white">${stats.pendingBalance.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="flex items-center">
              <div className="p-2 bg-orange-500/20 rounded-lg">
                <Users className="w-6 h-6 text-orange-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-300">Royalty Obligations</p>
                <p className="text-2xl font-bold text-white">${stats.totalRoyaltyObligations.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 mb-6 border border-white/20">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex gap-4">
              <button
                onClick={() => setActiveTab('licenses')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  activeTab === 'licenses'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800/50 text-gray-300 hover:text-white'
                }`}
              >
                Licenses ({stats.totalLicenses})
              </button>
              <button
                onClick={() => setActiveTab('revenue')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  activeTab === 'revenue'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800/50 text-gray-300 hover:text-white'
                }`}
              >
                Revenue ({revenue.length})
              </button>
              <button
                onClick={() => setActiveTab('royalties')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  activeTab === 'royalties'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800/50 text-gray-300 hover:text-white'
                }`}
              >
                Royalties ({royaltyDistributions.length})
              </button>
              <button
                onClick={() => setActiveTab('agreements')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  activeTab === 'agreements'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800/50 text-gray-300 hover:text-white'
                }`}
              >
                Agreements
              </button>
            </div>

            <div className="flex gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder={`Search ${activeTab}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="expired">Expired</option>
                <option value="cancelled">Cancelled</option>
                {activeTab === 'royalties' && (
                  <>
                    <option value="paid">Paid</option>
                    <option value="partial">Partial</option>
                    <option value="overdue">Overdue</option>
                  </>
                )}
              </select>
              <button
                onClick={fetchData}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6 flex items-center">
            <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
            <span className="text-red-400">{error}</span>
          </div>
        )}

        {/* Content */}
        {activeTab === 'licenses' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredLicenses.map((license) => (
              <div
                key={license.id}
                className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:border-blue-500/50 transition-colors"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-1">
                      {license.master_recording.title}
                    </h3>
                    <p className="text-gray-400 text-sm">
                      {license.master_recording.artist}
                    </p>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium flex items-center ${getStatusColor(license.license_status)}`}>
                    {getStatusIcon(license.license_status)}
                    <span className="ml-1">{license.license_status}</span>
                  </div>
                </div>

                {/* License Info */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm">
                    <FileText className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="text-gray-300">{getLicenseTypeLabel(license.license_type)}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <DollarSign className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="text-gray-300">${license.amount.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <AtSign className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="text-gray-300">{license.licensee_info.name}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="text-gray-300">
                      {new Date(license.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedLicense(license);
                      setShowLicenseModal(true);
                    }}
                    className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center text-sm"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View Details
                  </button>
                  <button
                    onClick={() => generateLicenseAgreement(license.id)}
                    className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'revenue' && (
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <h2 className="text-xl font-bold text-white mb-6">Revenue Breakdown</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/20">
                    <th className="py-3 px-4 text-gray-300 font-medium">Date</th>
                    <th className="py-3 px-4 text-gray-300 font-medium">Type</th>
                    <th className="py-3 px-4 text-gray-300 font-medium">Total Amount</th>
                    <th className="py-3 px-4 text-gray-300 font-medium">MyBeatFi Commission</th>
                    <th className="py-3 px-4 text-gray-300 font-medium">Your Earnings</th>
                    <th className="py-3 px-4 text-gray-300 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {revenue.map((rev) => (
                    <tr key={rev.id} className="border-b border-white/10">
                      <td className="py-3 px-4 text-gray-300">
                        {new Date(rev.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-gray-300 capitalize">
                        {rev.revenue_type.replace('_', ' ')}
                      </td>
                      <td className="py-3 px-4 text-white font-medium">
                        ${rev.amount.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-gray-400">
                        ${rev.mybeatfi_commission.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-green-400 font-medium">
                        ${rev.rights_holder_amount.toFixed(2)}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center w-fit ${getStatusColor(rev.payment_status)}`}>
                          {getStatusIcon(rev.payment_status)}
                          <span className="ml-1">{rev.payment_status}</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'royalties' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredRoyalties.map((royalty) => (
              <div
                key={royalty.id}
                className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:border-blue-500/50 transition-colors"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-1">
                      {royalty.participant_name}
                    </h3>
                    <p className="text-gray-400 text-sm capitalize">
                      {royalty.participant_role.replace('_', ' ')}
                    </p>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium flex items-center ${getStatusColor(royalty.payment_status)}`}>
                    {getStatusIcon(royalty.payment_status)}
                    <span className="ml-1">{royalty.payment_status}</span>
                  </div>
                </div>

                {/* Royalty Info */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm">
                    <Users className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="text-gray-300">{royalty.percentage}%</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <DollarSign className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="text-gray-300">Owed: ${royalty.amount_owed.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <CheckCircle className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="text-gray-300">Paid: ${royalty.amount_paid.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <AlertCircle className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="text-gray-300">
                      Outstanding: ${(royalty.amount_owed - royalty.amount_paid).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedRoyalty(royalty);
                      setShowRoyaltyModal(true);
                    }}
                    className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center text-sm"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Update Payment
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'agreements' && (
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <h2 className="text-xl font-bold text-white mb-6">License Agreements</h2>
            <p className="text-gray-300 mb-6">
              Generate and manage license agreements for your recordings. Agreements are automatically created when licenses are purchased.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {licenses.map((license) => (
                <div key={license.id} className="bg-gray-800/30 rounded-lg p-4">
                  <h3 className="text-white font-medium mb-2">{license.master_recording.title}</h3>
                  <p className="text-gray-400 text-sm mb-3">{license.licensee_info.name}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => generateLicenseAgreement(license.id)}
                      className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
                    >
                      <Download className="w-4 h-4 mr-1 inline" />
                      Generate PDF
                    </button>
                    <button className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors">
                      <Mail className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {((activeTab === 'licenses' && filteredLicenses.length === 0) ||
          (activeTab === 'royalties' && filteredRoyalties.length === 0) ||
          (activeTab === 'revenue' && revenue.length === 0)) && !loading && (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No {activeTab} Found</h3>
            <p className="text-gray-400 mb-4">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filters'
                : `No ${activeTab} have been created yet`
              }
            </p>
          </div>
        )}

        {/* License Details Modal */}
        {showLicenseModal && selectedLicense && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">License Details</h2>
                <button
                  onClick={() => setShowLicenseModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {selectedLicense.master_recording.title}
                  </h3>
                  <p className="text-gray-300">{selectedLicense.master_recording.artist}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-400">License Type</p>
                    <p className="text-white">{getLicenseTypeLabel(selectedLicense.license_type)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Amount</p>
                    <p className="text-white">${selectedLicense.amount.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Status</p>
                    <p className="text-white capitalize">{selectedLicense.license_status}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Territory</p>
                    <p className="text-white">{selectedLicense.territory}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-400">Licensee</p>
                  <p className="text-white">{selectedLicense.licensee_info.name}</p>
                  <p className="text-gray-300">{selectedLicense.licensee_info.email}</p>
                  {selectedLicense.licensee_info.company && (
                    <p className="text-gray-300">{selectedLicense.licensee_info.company}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-400">Start Date</p>
                    <p className="text-white">
                      {new Date(selectedLicense.license_start_date).toLocaleDateString()}
                    </p>
                  </div>
                  {selectedLicense.license_end_date && (
                    <div>
                      <p className="text-sm text-gray-400">End Date</p>
                      <p className="text-white">
                        {new Date(selectedLicense.license_end_date).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    onClick={() => generateLicenseAgreement(selectedLicense.id)}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    Generate Agreement
                  </button>
                  <button
                    onClick={() => setShowLicenseModal(false)}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Royalty Payment Modal */}
        {showRoyaltyModal && selectedRoyalty && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 max-w-md w-full">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Update Royalty Payment</h2>
                <button
                  onClick={() => setShowRoyaltyModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {selectedRoyalty.participant_name}
                  </h3>
                  <p className="text-gray-300 capitalize">{selectedRoyalty.participant_role.replace('_', ' ')}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-400">Amount Owed</p>
                    <p className="text-white">${selectedRoyalty.amount_owed.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Amount Paid</p>
                    <p className="text-white">${selectedRoyalty.amount_paid.toFixed(2)}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Additional Amount Paid
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max={selectedRoyalty.amount_owed - selectedRoyalty.amount_paid}
                    className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Payment Method
                  </label>
                  <select className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500">
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="paypal">PayPal</option>
                    <option value="check">Check</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Notes
                  </label>
                  <textarea
                    className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    rows={3}
                    placeholder="Optional notes about this payment..."
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    onClick={() => handleUpdateRoyaltyPayment(selectedRoyalty.id, selectedRoyalty.amount_paid + 0, 'bank_transfer', '')}
                    className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                  >
                    Update Payment
                  </button>
                  <button
                    onClick={() => setShowRoyaltyModal(false)}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                  >
                    Cancel
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
