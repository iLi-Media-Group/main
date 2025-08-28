import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  DollarSign, 
  Calendar, 
  Download, 
  Filter, 
  Search, 
  TrendingUp, 
  TrendingDown,
  FileText,
  Music,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Eye,
  Printer,
  Share2,
  RefreshCw,
  ArrowUpDown,
  PieChart,
  LineChart,
  Activity
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useUnifiedAuth } from '../contexts/UnifiedAuthContext';

interface RosterFinancialData {
  roster_entity_id: string;
  entity_name: string;
  entity_type: string;
  year: number;
  month: number;
  transaction_count: number;
  total_gross_revenue: number;
  total_net_revenue: number;
  license_fee_revenue: number;
  sync_proposal_revenue: number;
  custom_sync_revenue: number;
  royalty_payment_revenue: number;
  advance_payment_revenue: number;
  paid_transactions: number;
  pending_transactions: number;
  paid_amount: number;
  pending_amount: number;
}

interface YTDData {
  roster_entity_id: string;
  entity_name: string;
  entity_type: string;
  current_year: number;
  total_transactions_ytd: number;
  total_gross_revenue_ytd: number;
  total_net_revenue_ytd: number;
  license_fee_revenue_ytd: number;
  sync_proposal_revenue_ytd: number;
  custom_sync_revenue_ytd: number;
  royalty_payment_revenue_ytd: number;
  advance_payment_revenue_ytd: number;
  paid_transactions_ytd: number;
  paid_amount_ytd: number;
  pending_amount_ytd: number;
}

interface PaymentSchedule {
  roster_entity_id: string;
  entity_name: string;
  entity_type: string;
  payment_period_start: string;
  payment_period_end: string;
  total_amount: number;
  payment_method: string;
  payment_status: string;
  payment_date: string;
  payment_reference: string;
  notes: string;
  payment_status_display: string;
}

export function RosterFinancialReporting() {
  const { user } = useUnifiedAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Data states
  const [monthlyData, setMonthlyData] = useState<RosterFinancialData[]>([]);
  const [ytdData, setYtdData] = useState<YTDData[]>([]);
  const [paymentSchedules, setPaymentSchedules] = useState<PaymentSchedule[]>([]);
  
  // Filter states
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedEntity, setSelectedEntity] = useState<string>('all');
  const [selectedEntityType, setSelectedEntityType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // View states
  const [activeTab, setActiveTab] = useState<'monthly' | 'ytd' | 'payments'>('monthly');
  const [expandedEntities, setExpandedEntities] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<string>('total_net_revenue');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    if (user) {
      fetchFinancialData();
    }
  }, [user, selectedYear, selectedMonth, selectedEntity, selectedEntityType, activeTab]);

  const fetchFinancialData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      if (activeTab === 'monthly') {
        await fetchMonthlyData();
      } else if (activeTab === 'ytd') {
        await fetchYTDData();
      } else if (activeTab === 'payments') {
        await fetchPaymentSchedules();
      }
    } catch (err) {
      console.error('Error fetching financial data:', err);
      setError('Failed to load financial data');
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthlyData = async () => {
    let query = supabase
      .from('roster_monthly_analytics')
      .select('*')
      .eq('rights_holder_id', user.id)
      .eq('year', selectedYear);

    if (selectedMonth !== 0) {
      query = query.eq('month', selectedMonth);
    }

    if (selectedEntity !== 'all') {
      query = query.eq('roster_entity_id', selectedEntity);
    }

    if (selectedEntityType !== 'all') {
      query = query.eq('entity_type', selectedEntityType);
    }

    if (searchTerm) {
      query = query.ilike('entity_name', `%${searchTerm}%`);
    }

    const { data, error } = await query.order(sortField, { ascending: sortOrder === 'asc' });

    if (error) throw error;
    setMonthlyData(data || []);
  };

  const fetchYTDData = async () => {
    let query = supabase
      .from('roster_ytd_analytics')
      .select('*')
      .eq('rights_holder_id', user.id);

    if (selectedEntity !== 'all') {
      query = query.eq('roster_entity_id', selectedEntity);
    }

    if (selectedEntityType !== 'all') {
      query = query.eq('entity_type', selectedEntityType);
    }

    if (searchTerm) {
      query = query.ilike('entity_name', `%${searchTerm}%`);
    }

    const { data, error } = await query.order(sortField, { ascending: sortOrder === 'asc' });

    if (error) throw error;
    setYtdData(data || []);
  };

  const fetchPaymentSchedules = async () => {
    let query = supabase
      .from('roster_payment_tracking')
      .select('*')
      .eq('rights_holder_id', user.id);

    if (selectedEntity !== 'all') {
      query = query.eq('roster_entity_id', selectedEntity);
    }

    if (selectedEntityType !== 'all') {
      query = query.eq('entity_type', selectedEntityType);
    }

    if (searchTerm) {
      query = query.ilike('entity_name', `%${searchTerm}%`);
    }

    const { data, error } = await query.order('payment_period_end', { ascending: false });

    if (error) throw error;
    setPaymentSchedules(data || []);
  };

  const toggleEntityExpansion = (entityId: string) => {
    const newExpanded = new Set(expandedEntities);
    if (newExpanded.has(entityId)) {
      newExpanded.delete(entityId);
    } else {
      newExpanded.add(entityId);
    }
    setExpandedEntities(newExpanded);
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getMonthName = (month: number) => {
    return new Date(2024, month - 1).toLocaleDateString('en-US', { month: 'long' });
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'text-green-600 bg-green-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'overdue':
        return 'text-red-600 bg-red-100';
      case 'due':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getPaymentStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'overdue':
        return <AlertCircle className="w-4 h-4" />;
      case 'due':
        return <Calendar className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const exportToCSV = () => {
    let data: any[] = [];
    let filename = '';

    if (activeTab === 'monthly') {
      data = monthlyData;
      filename = `roster_monthly_revenue_${selectedYear}_${selectedMonth}.csv`;
    } else if (activeTab === 'ytd') {
      data = ytdData;
      filename = `roster_ytd_revenue_${selectedYear}.csv`;
    } else if (activeTab === 'payments') {
      data = paymentSchedules;
      filename = `roster_payment_schedules.csv`;
    }

    if (data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => JSON.stringify(row[header])).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const generatePDF = () => {
    // PDF generation logic would go here
    console.log('PDF generation not implemented yet');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading financial data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
          <span className="text-red-800">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Roster Financial Reporting</h2>
          <p className="text-gray-600">Comprehensive revenue tracking and payment management for your roster</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={fetchFinancialData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
          <button
            onClick={exportToCSV}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </button>
          <button
            onClick={generatePDF}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center"
          >
            <FileText className="w-4 h-4 mr-2" />
            Export PDF
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          {/* Year Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          {/* Month Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={0}>All Months</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                <option key={month} value={month}>{getMonthName(month)}</option>
              ))}
            </select>
          </div>

          {/* Entity Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Entity Type</label>
            <select
              value={selectedEntityType}
              onChange={(e) => setSelectedEntityType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="artist">Artist</option>
              <option value="band">Band</option>
              <option value="producer">Producer</option>
            </select>
          </div>

          {/* Search */}
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by entity name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('monthly')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'monthly'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Calendar className="w-4 h-4 inline mr-2" />
              Monthly Revenue
            </button>
            <button
              onClick={() => setActiveTab('ytd')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'ytd'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <TrendingUp className="w-4 h-4 inline mr-2" />
              Year-to-Date
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'payments'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <DollarSign className="w-4 h-4 inline mr-2" />
              Payment Schedules
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Monthly Revenue Tab */}
          {activeTab === 'monthly' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Monthly Revenue Breakdown
                </h3>
                <div className="text-sm text-gray-500">
                  {monthlyData.length} entities found
                </div>
              </div>

              {monthlyData.length === 0 ? (
                <div className="text-center py-8">
                  <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No monthly revenue data found for the selected filters.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {monthlyData.map((entity) => (
                    <div key={`${entity.roster_entity_id}-${entity.year}-${entity.month}`} className="border border-gray-200 rounded-lg">
                      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() => toggleEntityExpansion(`${entity.roster_entity_id}-${entity.year}-${entity.month}`)}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              {expandedEntities.has(`${entity.roster_entity_id}-${entity.year}-${entity.month}`) ? (
                                <ChevronUp className="w-5 h-5" />
                              ) : (
                                <ChevronDown className="w-5 h-5" />
                              )}
                            </button>
                            <div>
                              <h4 className="font-semibold text-gray-900">{entity.entity_name}</h4>
                              <p className="text-sm text-gray-500">
                                {entity.entity_type} • {getMonthName(entity.month)} {entity.year}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-semibold text-gray-900">
                              {formatCurrency(entity.total_net_revenue)}
                            </div>
                            <div className="text-sm text-gray-500">
                              {entity.transaction_count} transactions
                            </div>
                          </div>
                        </div>
                      </div>

                      {expandedEntities.has(`${entity.roster_entity_id}-${entity.year}-${entity.month}`) && (
                        <div className="p-4 space-y-4">
                          {/* Revenue Breakdown */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-blue-50 p-3 rounded-lg">
                              <div className="text-sm text-blue-600 font-medium">License Fees</div>
                              <div className="text-lg font-semibold text-blue-900">
                                {formatCurrency(entity.license_fee_revenue)}
                              </div>
                            </div>
                            <div className="bg-green-50 p-3 rounded-lg">
                              <div className="text-sm text-green-600 font-medium">Sync Proposals</div>
                              <div className="text-lg font-semibold text-green-900">
                                {formatCurrency(entity.sync_proposal_revenue)}
                              </div>
                            </div>
                            <div className="bg-purple-50 p-3 rounded-lg">
                              <div className="text-sm text-purple-600 font-medium">Custom Sync</div>
                              <div className="text-lg font-semibold text-purple-900">
                                {formatCurrency(entity.custom_sync_revenue)}
                              </div>
                            </div>
                            <div className="bg-orange-50 p-3 rounded-lg">
                              <div className="text-sm text-orange-600 font-medium">Royalties</div>
                              <div className="text-lg font-semibold text-orange-900">
                                {formatCurrency(entity.royalty_payment_revenue)}
                              </div>
                            </div>
                          </div>

                          {/* Payment Status */}
                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-green-50 p-3 rounded-lg">
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="text-sm text-green-600 font-medium">Paid</div>
                                  <div className="text-lg font-semibold text-green-900">
                                    {formatCurrency(entity.paid_amount)}
                                  </div>
                                </div>
                                <CheckCircle className="w-8 h-8 text-green-400" />
                              </div>
                              <div className="text-sm text-green-600 mt-1">
                                {entity.paid_transactions} transactions
                              </div>
                            </div>
                            <div className="bg-yellow-50 p-3 rounded-lg">
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="text-sm text-yellow-600 font-medium">Pending</div>
                                  <div className="text-lg font-semibold text-yellow-900">
                                    {formatCurrency(entity.pending_amount)}
                                  </div>
                                </div>
                                <Clock className="w-8 h-8 text-yellow-400" />
                              </div>
                              <div className="text-sm text-yellow-600 mt-1">
                                {entity.pending_transactions} transactions
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Year-to-Date Tab */}
          {activeTab === 'ytd' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Year-to-Date Revenue Summary
                </h3>
                <div className="text-sm text-gray-500">
                  {ytdData.length} entities found
                </div>
              </div>

              {ytdData.length === 0 ? (
                <div className="text-center py-8">
                  <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No year-to-date data found for the selected filters.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Entity
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total Revenue
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Transactions
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Paid Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Pending Amount
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {ytdData.map((entity) => (
                        <tr key={entity.roster_entity_id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{entity.entity_name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                              {entity.entity_type}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-semibold text-gray-900">
                              {formatCurrency(entity.total_net_revenue_ytd)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{entity.total_transactions_ytd}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-green-600 font-medium">
                              {formatCurrency(entity.paid_amount_ytd)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-yellow-600 font-medium">
                              {formatCurrency(entity.pending_amount_ytd)}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Payment Schedules Tab */}
          {activeTab === 'payments' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Payment Schedules & Tracking
                </h3>
                <div className="text-sm text-gray-500">
                  {paymentSchedules.length} payment schedules found
                </div>
              </div>

              {paymentSchedules.length === 0 ? (
                <div className="text-center py-8">
                  <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No payment schedules found for the selected filters.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {paymentSchedules.map((payment) => (
                    <div key={payment.roster_entity_id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div>
                            <h4 className="font-semibold text-gray-900">{payment.entity_name}</h4>
                            <p className="text-sm text-gray-500">
                              {payment.entity_type} • {formatDate(payment.payment_period_start)} - {formatDate(payment.payment_period_end)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold text-gray-900">
                            {formatCurrency(payment.total_amount)}
                          </div>
                          <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(payment.payment_status_display)}`}>
                            {getPaymentStatusIcon(payment.payment_status_display)}
                            <span className="ml-1">{payment.payment_status_display}</span>
                          </div>
                        </div>
                      </div>
                      
                      {payment.payment_method && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Payment Method:</span>
                              <div className="font-medium">{payment.payment_method}</div>
                            </div>
                            {payment.payment_date && (
                              <div>
                                <span className="text-gray-500">Payment Date:</span>
                                <div className="font-medium">{formatDate(payment.payment_date)}</div>
                              </div>
                            )}
                            {payment.payment_reference && (
                              <div>
                                <span className="text-gray-500">Reference:</span>
                                <div className="font-medium">{payment.payment_reference}</div>
                              </div>
                            )}
                            {payment.notes && (
                              <div>
                                <span className="text-gray-500">Notes:</span>
                                <div className="font-medium">{payment.notes}</div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
