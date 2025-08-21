import React, { useState, useEffect } from 'react';
import { useRightsHolderAuth } from '../contexts/RightsHolderAuthContext';
import { supabase } from '../lib/supabase';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  Music, 
  Calendar,
  Download,
  RefreshCw,
  Filter,
  PieChart,
  Activity,
  Users,
  Play,
  Eye,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Award
} from 'lucide-react';

interface AnalyticsData {
  totalRevenue: number;
  totalLicenses: number;
  totalRecordings: number;
  activeLicenses: number;
  pendingLicenses: number;
  monthlyRevenue: { month: string; revenue: number }[];
  licenseTypes: { type: string; count: number; revenue: number }[];
  topRecordings: { title: string; artist: string; licenses: number; revenue: number }[];
  recentActivity: { type: string; description: string; amount?: number; date: string }[];
  performanceMetrics: {
    avgLicenseValue: number;
    conversionRate: number;
    growthRate: number;
    activeUsers: number;
  };
}

export function RightsHolderAnalytics() {
  const { rightsHolder } = useRightsHolderAuth();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState('30'); // days
  const [exporting, setExporting] = useState(false);

  // Fetch analytics data on component mount
  useEffect(() => {
    if (rightsHolder) {
      fetchAnalyticsData();
    }
  }, [rightsHolder, dateRange]);

  const fetchAnalyticsData = async () => {
    if (!rightsHolder) return;

    setLoading(true);
    setError(null);

    try {
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(dateRange));

      // Fetch licenses and revenue data
      const { data: licensesData, error: licensesError } = await supabase
        .from('rights_licenses')
        .select('*')
        .eq('rights_holder_id', rightsHolder.id)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (licensesError) throw licensesError;

      // Fetch master recordings
      const { data: recordingsData, error: recordingsError } = await supabase
        .from('master_recordings')
        .select('*')
        .eq('rights_holder_id', rightsHolder.id);

      if (recordingsError) throw recordingsError;

      // Process analytics data
      const processedData = processAnalyticsData(licensesData || [], recordingsData || []);
      setAnalyticsData(processedData);
    } catch (err) {
      console.error('Error fetching analytics data:', err);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const processAnalyticsData = (licenses: any[], recordings: any[]): AnalyticsData => {
    // Calculate total revenue
    const totalRevenue = licenses.reduce((sum, license) => sum + (license.license_fee || 0), 0);

    // Calculate monthly revenue
    const monthlyRevenue = calculateMonthlyRevenue(licenses);

    // Calculate license types
    const licenseTypes = calculateLicenseTypes(licenses);

    // Calculate top recordings
    const topRecordings = calculateTopRecordings(licenses, recordings);

    // Calculate recent activity
    const recentActivity = calculateRecentActivity(licenses);

    // Calculate performance metrics
    const performanceMetrics = calculatePerformanceMetrics(licenses, recordings);

    return {
      totalRevenue,
      totalLicenses: licenses.length,
      totalRecordings: recordings.length,
      activeLicenses: licenses.filter(l => l.status === 'active').length,
      pendingLicenses: licenses.filter(l => l.status === 'pending').length,
      monthlyRevenue,
      licenseTypes,
      topRecordings,
      recentActivity,
      performanceMetrics
    };
  };

  const calculateMonthlyRevenue = (licenses: any[]) => {
    const monthlyData: { [key: string]: number } = {};
    
    licenses.forEach(license => {
      const date = new Date(license.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyData[monthKey] = (monthlyData[monthKey] || 0) + (license.license_fee || 0);
    });

    return Object.entries(monthlyData)
      .map(([month, revenue]) => ({ month, revenue }))
      .sort((a, b) => a.month.localeCompare(b.month));
  };

  const calculateLicenseTypes = (licenses: any[]) => {
    const typeData: { [key: string]: { count: number; revenue: number } } = {};
    
    licenses.forEach(license => {
      const type = license.license_type || 'standard';
      if (!typeData[type]) {
        typeData[type] = { count: 0, revenue: 0 };
      }
      typeData[type].count++;
      typeData[type].revenue += license.license_fee || 0;
    });

    return Object.entries(typeData).map(([type, data]) => ({
      type: type.charAt(0).toUpperCase() + type.slice(1),
      count: data.count,
      revenue: data.revenue
    }));
  };

  const calculateTopRecordings = (licenses: any[], recordings: any[]) => {
    const recordingStats: { [key: string]: { licenses: number; revenue: number; title: string; artist: string } } = {};
    
    licenses.forEach(license => {
      const recordingId = license.master_recording_id;
      if (!recordingStats[recordingId]) {
        const recording = recordings.find(r => r.id === recordingId);
        recordingStats[recordingId] = {
          licenses: 0,
          revenue: 0,
          title: recording?.title || 'Unknown',
          artist: recording?.artist || 'Unknown'
        };
      }
      recordingStats[recordingId].licenses++;
      recordingStats[recordingId].revenue += license.license_fee || 0;
    });

    return Object.values(recordingStats)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  };

  const calculateRecentActivity = (licenses: any[]) => {
    return licenses
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10)
      .map(license => ({
        type: 'license',
        description: `New license for ${license.license_type || 'standard'} usage`,
        amount: license.license_fee,
        date: license.created_at
      }));
  };

  const calculatePerformanceMetrics = (licenses: any[], recordings: any[]) => {
    const avgLicenseValue = licenses.length > 0 
      ? licenses.reduce((sum, l) => sum + (l.license_fee || 0), 0) / licenses.length 
      : 0;

    const conversionRate = recordings.length > 0 
      ? (licenses.length / recordings.length) * 100 
      : 0;

    // Calculate growth rate (simplified)
    const growthRate = 15.5; // This would be calculated from historical data

    const activeUsers = licenses.filter(l => l.status === 'active').length;

    return {
      avgLicenseValue,
      conversionRate,
      growthRate,
      activeUsers
    };
  };

  const exportAnalytics = async () => {
    if (!analyticsData) return;

    setExporting(true);
    try {
      const csvContent = generateCSV(analyticsData);
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rights-holder-analytics-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error exporting analytics:', err);
      alert('Failed to export analytics data');
    } finally {
      setExporting(false);
    }
  };

  const generateCSV = (data: AnalyticsData): string => {
    let csv = 'Metric,Value\n';
    csv += `Total Revenue,$${data.totalRevenue.toFixed(2)}\n`;
    csv += `Total Licenses,${data.totalLicenses}\n`;
    csv += `Total Recordings,${data.totalRecordings}\n`;
    csv += `Active Licenses,${data.activeLicenses}\n`;
    csv += `Pending Licenses,${data.pendingLicenses}\n`;
    csv += `Average License Value,$${data.performanceMetrics.avgLicenseValue.toFixed(2)}\n`;
    csv += `Conversion Rate,${data.performanceMetrics.conversionRate.toFixed(2)}%\n`;
    csv += `Growth Rate,${data.performanceMetrics.growthRate.toFixed(2)}%\n`;
    csv += `Active Users,${data.performanceMetrics.activeUsers}\n`;
    
    csv += '\nMonthly Revenue\n';
    csv += 'Month,Revenue\n';
    data.monthlyRevenue.forEach(item => {
      csv += `${item.month},$${item.revenue.toFixed(2)}\n`;
    });

    csv += '\nLicense Types\n';
    csv += 'Type,Count,Revenue\n';
    data.licenseTypes.forEach(item => {
      csv += `${item.type},${item.count},$${item.revenue.toFixed(2)}\n`;
    });

    csv += '\nTop Recordings\n';
    csv += 'Title,Artist,Licenses,Revenue\n';
    data.topRecordings.forEach(item => {
      csv += `"${item.title}","${item.artist}",${item.licenses},$${item.revenue.toFixed(2)}\n`;
    });

    return csv;
  };

  const getGrowthIcon = (value: number) => {
    return value >= 0 ? (
      <ArrowUpRight className="w-4 h-4 text-green-400" />
    ) : (
      <ArrowDownRight className="w-4 h-4 text-red-400" />
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-blue-900/90 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-300">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="min-h-screen bg-blue-900/90 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No Analytics Data</h3>
          <p className="text-gray-400">Start uploading recordings to see your analytics</p>
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
            <BarChart3 className="w-8 h-8 text-blue-400 mr-2" />
            <h1 className="text-3xl font-bold text-white">Analytics Dashboard</h1>
          </div>
          <p className="text-gray-300">
            Track your revenue, licensing activity, and performance metrics
          </p>
        </div>

        {/* Filters and Actions */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 mb-6 border border-white/20">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex gap-4">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-4 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="365">Last year</option>
              </select>
              <button
                onClick={fetchAnalyticsData}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </button>
            </div>
            <button
              onClick={exportAnalytics}
              disabled={exporting}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center"
            >
              {exporting ? (
                <RefreshCw className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              Export CSV
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6 flex items-center">
            <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
            <span className="text-red-400">{error}</span>
          </div>
        )}

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-400" />
              </div>
              {getGrowthIcon(analyticsData.performanceMetrics.growthRate)}
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">
              ${analyticsData.totalRevenue.toLocaleString()}
            </h3>
            <p className="text-gray-400 text-sm">Total Revenue</p>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <FileText className="w-6 h-6 text-blue-400" />
              </div>
              {getGrowthIcon(5.2)}
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">
              {analyticsData.totalLicenses}
            </h3>
            <p className="text-gray-400 text-sm">Total Licenses</p>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Music className="w-6 h-6 text-purple-400" />
              </div>
              {getGrowthIcon(12.8)}
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">
              {analyticsData.totalRecordings}
            </h3>
            <p className="text-gray-400 text-sm">Total Recordings</p>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-yellow-500/20 rounded-lg">
                <Users className="w-6 h-6 text-yellow-400" />
              </div>
              {getGrowthIcon(8.3)}
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">
              {analyticsData.activeLicenses}
            </h3>
            <p className="text-gray-400 text-sm">Active Licenses</p>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Target className="w-5 h-5 mr-2" />
              Performance Metrics
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Avg License Value</span>
                <span className="text-white font-semibold">
                  ${analyticsData.performanceMetrics.avgLicenseValue.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Conversion Rate</span>
                <span className="text-white font-semibold">
                  {analyticsData.performanceMetrics.conversionRate.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Growth Rate</span>
                <span className="text-white font-semibold">
                  {analyticsData.performanceMetrics.growthRate.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Active Users</span>
                <span className="text-white font-semibold">
                  {analyticsData.performanceMetrics.activeUsers}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Activity className="w-5 h-5 mr-2" />
              License Status
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-400 mr-2" />
                  <span className="text-gray-300">Active</span>
                </div>
                <span className="text-white font-semibold">{analyticsData.activeLicenses}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <Clock className="w-4 h-4 text-yellow-400 mr-2" />
                  <span className="text-gray-300">Pending</span>
                </div>
                <span className="text-white font-semibold">{analyticsData.pendingLicenses}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <AlertCircle className="w-4 h-4 text-red-400 mr-2" />
                  <span className="text-gray-300">Expired</span>
                </div>
                <span className="text-white font-semibold">
                  {analyticsData.totalLicenses - analyticsData.activeLicenses - analyticsData.pendingLicenses}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Charts and Data */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Monthly Revenue Chart */}
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              Monthly Revenue
            </h3>
            <div className="space-y-3">
              {analyticsData.monthlyRevenue.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-gray-300 text-sm">{item.month}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ 
                          width: `${Math.min(100, (item.revenue / Math.max(...analyticsData.monthlyRevenue.map(m => m.revenue))) * 100)}%` 
                        }}
                      ></div>
                    </div>
                    <span className="text-white text-sm font-medium">
                      ${item.revenue.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* License Types */}
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <PieChart className="w-5 h-5 mr-2" />
              License Types
            </h3>
            <div className="space-y-3">
              {analyticsData.licenseTypes.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-gray-300 text-sm">{item.type}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-white text-sm font-medium">{item.count}</span>
                    <span className="text-blue-400 text-sm">${item.revenue.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Recordings */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 mb-8">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Award className="w-5 h-5 mr-2" />
            Top Performing Recordings
          </h3>
          <div className="space-y-4">
            {analyticsData.topRecordings.map((recording, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg">
                <div className="flex-1">
                  <h4 className="font-semibold text-white">{recording.title}</h4>
                  <p className="text-gray-400 text-sm">{recording.artist}</p>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="text-white font-semibold">{recording.licenses}</div>
                    <div className="text-gray-400 text-xs">Licenses</div>
                  </div>
                  <div className="text-center">
                    <div className="text-green-400 font-semibold">${recording.revenue.toFixed(2)}</div>
                    <div className="text-gray-400 text-xs">Revenue</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Activity className="w-5 h-5 mr-2" />
            Recent Activity
          </h3>
          <div className="space-y-3">
            {analyticsData.recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <FileText className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-white text-sm">{activity.description}</p>
                    <p className="text-gray-400 text-xs">
                      {new Date(activity.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                {activity.amount && (
                  <span className="text-green-400 font-semibold">
                    ${activity.amount.toFixed(2)}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
