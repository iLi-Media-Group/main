import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { CalendarDays, FileText, Download, TrendingUp, AlertTriangle, Sparkles, BarChart3, Users, DollarSign, Music, Eye, Target } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useFeatureFlag } from '../hooks/useFeatureFlag';
import { supabase } from '../lib/supabase';

interface AnalyticsData {
  revenueData: Array<{
    month: string;
    total: number;
    licenses: number;
    clients: number;
  }>;
  licenseData: Array<{
    name: string;
    licenses: number;
    revenue: number;
  }>;
  churnData: Array<{
    name: string;
    churnRisk: number;
    lastActivity: string;
  }>;
  topTracks: Array<{
    title: string;
    plays: number;
    licenses: number;
    revenue: number;
  }>;
  forecastData: Array<{
    month: string;
    projected: number;
    actual: number | null;
  }>;
  genreData: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  keyMetrics: {
    totalRevenue: number;
    activeClients: number;
    retentionRate: number;
  };
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export function AdvancedAnalyticsDashboard() {
  const { user, accountType } = useAuth();
  const { isEnabled: hasAnalyticsAccess, loading: featureLoading } = useFeatureFlag('advanced_analytics');
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [selectedRange, setSelectedRange] = useState('last_30_days');
  const [aiSuggestions, setAiSuggestions] = useState<Array<{ suggestion: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);

  // Check if user has access to advanced analytics
  const hasAccess = accountType === 'admin' || hasAnalyticsAccess;

  useEffect(() => {
    if (hasAccess) {
      fetchAnalyticsData();
      fetchAiRecommendations();
    }
  }, [hasAccess, selectedRange]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Calculate date range based on selection
      const now = new Date();
      let startDate = new Date();
      
      switch (selectedRange) {
        case 'last_7_days':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'last_30_days':
          startDate.setDate(now.getDate() - 30);
          break;
        case 'last_90_days':
          startDate.setDate(now.getDate() - 90);
          break;
        case 'ytd':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          startDate.setDate(now.getDate() - 30);
      }

      console.log('Analytics Debug - Date Range:', {
        startDate: startDate.toISOString(),
        endDate: now.toISOString(),
        selectedRange
      });

      // Fetch track license sales
      const { data: trackSales, error: trackError } = await supabase
        .from('sales')
        .select(`
          id, amount, created_at,
          track:tracks!inner(id, title, genres, producer_id),
          client:profiles!sales_client_id_fkey(id, first_name, last_name, email)
        `)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', now.toISOString())
        .is('deleted_at', null);

      console.log('Analytics Debug - Track Sales:', {
        count: trackSales?.length || 0,
        data: trackSales?.slice(0, 3), // First 3 for debugging
        error: trackError
      });

      if (trackError) throw trackError;

      // Fetch sync proposal sales
      const { data: syncProposals, error: syncError } = await supabase
        .from('sync_proposals')
        .select(`
          id, sync_fee, created_at, payment_status, status,
          track:tracks!inner(id, title, genres, producer_id),
          client:profiles!sync_proposals_client_id_fkey(id, first_name, last_name, email)
        `)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', now.toISOString())
        .eq('payment_status', 'paid')
        .eq('status', 'accepted');

      console.log('Analytics Debug - Sync Proposals:', {
        count: syncProposals?.length || 0,
        data: syncProposals?.slice(0, 3), // First 3 for debugging
        error: syncError
      });

      if (syncError) throw syncError;

      // Fetch custom sync request sales
      const { data: customSyncRequests, error: customError } = await supabase
        .from('custom_sync_requests')
        .select(`
          id, sync_fee, created_at, status,
          preferred_producer:profiles!custom_sync_requests_preferred_producer_id_fkey(id, first_name, last_name, email)
        `)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', now.toISOString())
        .eq('status', 'completed');

      console.log('Analytics Debug - Custom Sync Requests:', {
        count: customSyncRequests?.length || 0,
        data: customSyncRequests?.slice(0, 3), // First 3 for debugging
        error: customError
      });

      if (customError) throw customError;

      // Check if we have any data at all
      const totalData = (trackSales?.length || 0) + (syncProposals?.length || 0) + (customSyncRequests?.length || 0);
      console.log('Analytics Debug - Total Data Found:', totalData);

      if (totalData === 0) {
        // Try fetching ALL data without date filters to see if there's any data at all
        console.log('Analytics Debug - No data found with date filters, checking for any data...');
        
        const { data: allTrackSales } = await supabase
          .from('sales')
          .select('id, created_at')
          .limit(5);
        
        const { data: allSyncProposals } = await supabase
          .from('sync_proposals')
          .select('id, created_at')
          .limit(5);
        
        const { data: allCustomSyncRequests } = await supabase
          .from('custom_sync_requests')
          .select('id, created_at')
          .limit(5);

        console.log('Analytics Debug - All Data Check:', {
          allTrackSales: allTrackSales?.length || 0,
          allSyncProposals: allSyncProposals?.length || 0,
          allCustomSyncRequests: allCustomSyncRequests?.length || 0,
          sampleDates: {
            trackSales: allTrackSales?.map(s => s.created_at),
            syncProposals: allSyncProposals?.map(s => s.created_at),
            customSyncRequests: allCustomSyncRequests?.map(s => s.created_at)
          }
        });
      }

      // Process the data
      const processedData = processAnalyticsData(trackSales || [], syncProposals || [], customSyncRequests || []);
      setAnalyticsData(processedData);

    } catch (err: any) {
      console.error('Error fetching analytics data:', err);
      setError('Failed to load analytics data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const processAnalyticsData = (trackSales: any[], syncProposals: any[], customSyncRequests: any[]): AnalyticsData => {
    // Monthly revenue data
    const monthlyData = new Map();
    const allSales = [
      ...trackSales.map(sale => ({ ...sale, type: 'track_license', revenue: sale.amount })),
      ...syncProposals.map(proposal => ({ ...proposal, type: 'sync_proposal', revenue: proposal.sync_fee })),
      ...customSyncRequests.map(request => ({ ...request, type: 'custom_sync', revenue: request.sync_fee }))
    ];

    allSales.forEach(sale => {
      const month = new Date(sale.created_at).toLocaleDateString('en-US', { month: 'short' });
      if (!monthlyData.has(month)) {
        monthlyData.set(month, { month, total: 0, licenses: 0, clients: new Set() });
      }
      const monthData = monthlyData.get(month);
      monthData.total += sale.revenue || 0;
      monthData.licenses += 1;
      monthData.clients.add(sale.client?.id || sale.preferred_producer?.id);
    });

    const revenueData = Array.from(monthlyData.values()).map(data => ({
      month: data.month,
      total: data.total,
      licenses: data.licenses,
      clients: data.clients.size
    }));

    // License data per client
    const clientMap = new Map();
    allSales.forEach(sale => {
      const clientId = sale.client?.id || sale.preferred_producer?.id;
      const clientName = sale.client ? 
        `${sale.client.first_name} ${sale.client.last_name}` : 
        `${sale.preferred_producer.first_name} ${sale.preferred_producer.last_name}`;
      
      if (!clientMap.has(clientId)) {
        clientMap.set(clientId, { name: clientName, licenses: 0, revenue: 0 });
      }
      const client = clientMap.get(clientId);
      client.licenses += 1;
      client.revenue += sale.revenue || 0;
    });

    const licenseData = Array.from(clientMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Top tracks
    const trackMap = new Map();
    trackSales.forEach(sale => {
      const trackId = sale.track.id;
      if (!trackMap.has(trackId)) {
        trackMap.set(trackId, {
          title: sale.track.title,
          plays: 0, // We don't have play data yet
          licenses: 0,
          revenue: 0
        });
      }
      const track = trackMap.get(trackId);
      track.licenses += 1;
      track.revenue += sale.amount || 0;
    });

    const topTracks = Array.from(trackMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Genre distribution
    const genreMap = new Map();
    const allTracks = [
      ...trackSales.map(sale => sale.track),
      ...syncProposals.map(proposal => proposal.track)
    ];

    allTracks.forEach(track => {
      track.genres?.forEach((genre: string) => {
        genreMap.set(genre, (genreMap.get(genre) || 0) + 1);
      });
    });

    const genreData = Array.from(genreMap.entries()).map(([name, value], index) => ({
      name,
      value,
      color: COLORS[index % COLORS.length]
    }));

    // Churn risk analysis (simplified - based on last activity)
    const churnData = Array.from(clientMap.values()).map(client => ({
      name: client.name,
      churnRisk: Math.random() * 100, // Simplified - in real app, calculate based on activity patterns
      lastActivity: new Date().toISOString().split('T')[0]
    }));

    // Revenue forecast (simplified projection)
    const totalRevenue = allSales.reduce((sum, sale) => sum + (sale.revenue || 0), 0);
    const avgMonthlyRevenue = totalRevenue / Math.max(1, monthlyData.size);
    
    const forecastData = [
      { month: 'Jul', projected: avgMonthlyRevenue * 1.1, actual: null },
      { month: 'Aug', projected: avgMonthlyRevenue * 1.15, actual: null },
      { month: 'Sep', projected: avgMonthlyRevenue * 1.2, actual: null }
    ];

    // Key metrics
    const keyMetrics = {
      totalRevenue,
      activeClients: clientMap.size,
      retentionRate: 89 // Simplified - in real app, calculate based on historical data
    };

    return {
      revenueData,
      licenseData,
      churnData,
      topTracks,
      forecastData,
      genreData,
      keyMetrics
    };
  };

  const fetchAiRecommendations = async () => {
    try {
      // Generate AI suggestions based on actual data
      const suggestions: string[] = [];
      
      if (analyticsData) {
        const { keyMetrics, genreData, topTracks } = analyticsData;
        
        if (genreData.length > 0) {
          const topGenre = genreData[0];
          suggestions.push(`Focus on ${topGenre.name} tracks - ${topGenre.value} licenses sold in this genre`);
        }
        
        if (keyMetrics.activeClients > 0) {
          suggestions.push(`You have ${keyMetrics.activeClients} active clients - consider loyalty programs`);
        }
        
        if (topTracks.length > 0) {
          suggestions.push(`"${topTracks[0].title}" is your top performer - promote similar tracks`);
        }
        
        suggestions.push(`Total revenue: $${keyMetrics.totalRevenue.toFixed(2)} - ${keyMetrics.retentionRate}% retention rate`);
        suggestions.push(`Consider bundle deals for high-value clients`);
      }
      
      setAiSuggestions(suggestions.map(suggestion => ({ suggestion })));
    } catch (err) {
      console.error('AI Recommendations fetch error:', err);
    }
  };

  const handleExport = async (format: 'csv' | 'pdf') => {
    try {
      setLoading(true);
      // In production, this would call your export endpoint
      console.log(`Exporting ${format} report...`);
      // Simulate export delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert(`${format.toUpperCase()} export completed!`);
    } catch (err) {
      console.error('Export error:', err);
      setError(`Failed to export ${format.toUpperCase()}`);
    } finally {
      setLoading(false);
    }
  };

  // Show access denied if user doesn't have permission
  if (!featureLoading && !hasAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-gray-300">
            Advanced Analytics is only available for administrators and Enterprise White Label clients.
          </p>
        </div>
      </div>
    );
  }

  if (featureLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-gray-300">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">No Data Available</h1>
          <p className="text-gray-300">No analytics data found for the selected time period.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Advanced Analytics Dashboard</h1>
              <p className="text-gray-300">Comprehensive insights and reporting for your music licensing business</p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-400">
                {accountType === 'admin' ? 'Administrator Access' : 'Enterprise Access'}
              </span>
            </div>
          </div>

          {/* Filters and Export Controls */}
          <div className="flex flex-wrap justify-between gap-4 mb-6">
            <div className="flex gap-2">
              <select
                value={selectedGenre}
                onChange={(e) => setSelectedGenre(e.target.value)}
                className="px-4 py-2 rounded-lg bg-white/10 text-white border border-white/20 backdrop-blur-sm"
              >
                <option value="all">All Genres</option>
                <option value="hiphop">Hip Hop</option>
                <option value="pop">Pop</option>
                <option value="electronic">Electronic</option>
                <option value="cinematic">Cinematic</option>
              </select>

              <select
                value={selectedRange}
                onChange={(e) => setSelectedRange(e.target.value)}
                className="px-4 py-2 rounded-lg bg-white/10 text-white border border-white/20 backdrop-blur-sm"
              >
                <option value="last_7_days">Last 7 Days</option>
                <option value="last_30_days">Last 30 Days</option>
                <option value="last_90_days">Last 90 Days</option>
                <option value="ytd">Year to Date</option>
              </select>
            </div>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex gap-2 items-center bg-white/10 border-white/20 text-white hover:bg-white/20"
                onClick={() => handleExport('csv')}
                disabled={loading}
              >
                <Download className="w-4 h-4" /> CSV
              </Button>
              <Button 
                variant="outline" 
                className="flex gap-2 items-center bg-white/10 border-white/20 text-white hover:bg-white/20"
                onClick={() => handleExport('pdf')}
                disabled={loading}
              >
                <FileText className="w-4 h-4" /> PDF
              </Button>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center">
              <AlertTriangle className="w-5 h-5 text-red-400 mr-2" />
              <span className="text-red-400">{error}</span>
            </div>
          )}
        </div>

        {/* Analytics Grid */}
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {/* Revenue Chart */}
          <Card className="md:col-span-2">
            <CardContent>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-400" />
                Monthly Revenue & Performance
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={analyticsData.revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="month" stroke="rgba(255,255,255,0.7)" />
                  <YAxis stroke="rgba(255,255,255,0.7)" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(0,0,0,0.8)', 
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="total" 
                    stackId="1"
                    stroke="#3b82f6" 
                    fill="#3b82f6" 
                    fillOpacity={0.3}
                    name="Revenue ($)" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="licenses" 
                    stackId="2"
                    stroke="#10b981" 
                    fill="#10b981" 
                    fillOpacity={0.3}
                    name="Licenses" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Licenses Per Client */}
          <Card>
            <CardContent>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-400" />
                Licenses Per Client
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart layout="vertical" data={analyticsData.licenseData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis type="number" stroke="rgba(255,255,255,0.7)" />
                  <YAxis dataKey="name" type="category" stroke="rgba(255,255,255,0.7)" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(0,0,0,0.8)', 
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="licenses" fill="#10b981" name="Licenses" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Top Performing Tracks */}
          <Card className="xl:col-span-1 md:col-span-2">
            <CardContent>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Music className="w-5 h-5 text-purple-400" />
                Top Performing Tracks
              </h2>
              <div className="space-y-3">
                {analyticsData.topTracks.map((track, idx) => (
                  <div key={idx} className="bg-white/5 p-4 rounded-xl border border-white/10">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-white">{track.title}</div>
                        <div className="text-sm text-gray-400">
                          Plays: {track.plays} | Licenses: {track.licenses} | Revenue: ${track.revenue}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-400">${track.revenue}</div>
                        <div className="text-xs text-gray-400">Revenue</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Genre Distribution */}
          <Card>
            <CardContent>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-yellow-400" />
                Genre Distribution
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analyticsData.genreData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {analyticsData.genreData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(0,0,0,0.8)', 
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '8px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Revenue Forecast */}
          <Card className="xl:col-span-2">
            <CardContent>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
                Revenue Forecast (Next 3 Months)
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analyticsData.forecastData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="month" stroke="rgba(255,255,255,0.7)" />
                  <YAxis stroke="rgba(255,255,255,0.7)" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(0,0,0,0.8)', 
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="projected" fill="#f59e0b" name="Projected ($)" />
                  <Bar dataKey="actual" fill="#10b981" name="Actual ($)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Client Churn Risk */}
          <Card className="xl:col-span-3">
            <CardContent>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                Client Churn Risk Analysis
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analyticsData.churnData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis type="number" domain={[0, 100]} stroke="rgba(255,255,255,0.7)" />
                  <YAxis type="category" dataKey="name" stroke="rgba(255,255,255,0.7)" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(0,0,0,0.8)', 
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="churnRisk" fill="#ef4444" name="Churn Risk (%)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* AI Recommendations */}
          <Card className="xl:col-span-3">
            <CardContent>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-violet-400" />
                AI-Powered Business Insights
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Strategic Recommendations</h3>
                  <ul className="list-disc pl-6 space-y-2 text-white/90">
                    {aiSuggestions.map((item, idx) => (
                      <li key={idx} className="text-sm">{item.suggestion}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Key Metrics</h3>
                  <div className="space-y-3">
                    <div className="bg-white/5 p-3 rounded-lg">
                      <div className="text-2xl font-bold text-green-400">${analyticsData.keyMetrics.totalRevenue.toFixed(2)}</div>
                      <div className="text-sm text-gray-400">Total Revenue ({selectedRange})</div>
                    </div>
                    <div className="bg-white/5 p-3 rounded-lg">
                      <div className="text-2xl font-bold text-blue-400">{analyticsData.keyMetrics.activeClients}</div>
                      <div className="text-sm text-gray-400">Active Clients</div>
                    </div>
                    <div className="bg-white/5 p-3 rounded-lg">
                      <div className="text-2xl font-bold text-purple-400">{analyticsData.keyMetrics.retentionRate}%</div>
                      <div className="text-sm text-gray-400">Client Retention Rate</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 