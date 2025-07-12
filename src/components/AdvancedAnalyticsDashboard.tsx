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
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

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

interface AdvancedAnalyticsDashboardProps {
  logoUrl?: string;
  companyName?: string;
  domain?: string;
  email?: string;
}

export function AdvancedAnalyticsDashboard({ logoUrl, companyName, domain, email }: AdvancedAnalyticsDashboardProps) {
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

      // First, let's check if there's ANY data in the tables without filters
      console.log('Analytics Debug - Checking for any data in tables...');
      
      const { data: allSalesData, error: allSalesError } = await supabase
        .from('sales')
        .select('id, created_at, amount')
        .limit(10);
      
      const { data: allSyncData, error: allSyncError } = await supabase
        .from('sync_proposals')
        .select('id, created_at, sync_fee, payment_status, status')
        .limit(10);
      
      const { data: allCustomSyncData, error: allCustomSyncError } = await supabase
        .from('custom_sync_requests')
        .select('id, created_at, sync_fee, status')
        .limit(10);

      console.log('Analytics Debug - Raw table data:', {
        sales: {
          count: allSalesData?.length || 0,
          sample: allSalesData?.slice(0, 3),
          error: allSalesError
        },
        syncProposals: {
          count: allSyncData?.length || 0,
          sample: allSyncData?.slice(0, 3),
          error: allSyncError
        },
        customSyncRequests: {
          count: allCustomSyncData?.length || 0,
          sample: allCustomSyncData?.slice(0, 3),
          error: allCustomSyncError
        }
      });

      // Fetch track license sales
      const { data: trackSales, error: trackError } = await supabase
        .from('sales')
        .select(`
          id, amount, created_at,
          track:tracks!inner(id, title, genres, track_producer_id),
          buyer:profiles!sales_buyer_id_fkey(id, first_name, last_name, email)
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
          track:tracks!inner(id, title, genres, track_producer_id),
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
      console.log('Analytics Debug - Processed Data:', {
        revenueDataLength: processedData.revenueData.length,
        licenseDataLength: processedData.licenseData.length,
        topTracksLength: processedData.topTracks.length,
        keyMetrics: processedData.keyMetrics
      });
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
      ...syncProposals.map(proposal => ({ ...proposal, type: 'sync_proposal', revenue: proposal.final_amount || proposal.negotiated_amount || proposal.sync_fee })),
      ...customSyncRequests.map(request => ({ ...request, type: 'custom_sync', revenue: request.final_amount || request.negotiated_amount || request.sync_fee }))
    ];

    allSales.forEach(sale => {
      const month = new Date(sale.created_at).toLocaleDateString('en-US', { month: 'short' });
      if (!monthlyData.has(month)) {
        monthlyData.set(month, { month, total: 0, licenses: 0, clients: new Set() });
      }
      const monthData = monthlyData.get(month);
      monthData.total += sale.revenue || 0;
      monthData.licenses += 1;
      monthData.clients.add(sale.buyer?.id || sale.preferred_producer?.id);
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
      const clientId = sale.buyer?.id || sale.preferred_producer?.id;
      
      // Add defensive checks for undefined buyer/preferred_producer
      let clientName = 'Unknown Client';
      if (sale.buyer && sale.buyer.first_name && sale.buyer.last_name) {
        clientName = `${sale.buyer.first_name} ${sale.buyer.last_name}`;
      } else if (sale.preferred_producer && sale.preferred_producer.first_name && sale.preferred_producer.last_name) {
        clientName = `${sale.preferred_producer.first_name} ${sale.preferred_producer.last_name}`;
      } else if (sale.buyer?.email) {
        clientName = sale.buyer.email;
      } else if (sale.preferred_producer?.email) {
        clientName = sale.preferred_producer.email;
      }
      
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
      // Add defensive check for track data
      if (!sale.track || !sale.track.id) {
        console.warn('Analytics Debug - Skipping sale with missing track data:', sale);
        return;
      }
      
      const trackId = sale.track.id;
      if (!trackMap.has(trackId)) {
        trackMap.set(trackId, {
          title: sale.track.title || 'Unknown Track',
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
      ...trackSales.map(sale => sale.track).filter(track => track), // Filter out undefined tracks
      ...syncProposals.map(proposal => proposal.track).filter(track => track) // Filter out undefined tracks
    ];

    console.log('Analytics Debug - Genre Distribution:', {
      totalTracks: allTracks.length,
      trackSalesCount: trackSales.length,
      syncProposalsCount: syncProposals.length,
      sampleTracks: allTracks.slice(0, 3).map(track => ({
        title: track.title,
        genres: track.genres,
        genresType: typeof track.genres,
        isArray: Array.isArray(track.genres)
      }))
    });

    allTracks.forEach(track => {
      // Add defensive check for genres
      if (track.genres && Array.isArray(track.genres)) {
        track.genres.forEach((genre: string) => {
          if (genre && typeof genre === 'string') {
            genreMap.set(genre, (genreMap.get(genre) || 0) + 1);
          }
        });
      } else if (track.genres && typeof track.genres === 'string') {
        // Handle case where genres is a comma-separated string
        const genres = track.genres.split(',').map((g: string) => g.trim()).filter((g: string) => g);
        genres.forEach((genre: string) => {
          if (genre && typeof genre === 'string') {
            genreMap.set(genre, (genreMap.get(genre) || 0) + 1);
          }
        });
      }
    });

    console.log('Analytics Debug - Genre Map:', {
      genreMapSize: genreMap.size,
      genreEntries: Array.from(genreMap.entries())
    });

    const genreData = Array.from(genreMap.entries()).map(([name, value], index) => ({
      name,
      value,
      color: COLORS[index % COLORS.length]
    }));

    console.log('Analytics Debug - Final Genre Data:', genreData);

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
    if (!analyticsData) return;
    try {
      setLoading(true);
      if (format === 'csv') {
        // === CSV Export ===
        let csv = '';
        // Monthly Revenue
        csv += 'Monthly Revenue\nMonth,Total\n';
        analyticsData.revenueData.forEach(row => {
          csv += `${row.month},${row.total}\n`;
        });
        csv += '\n';
        // License Data
        csv += 'License Data\nName,Licenses,Revenue\n';
        analyticsData.licenseData.forEach(row => {
          csv += `${row.name},${row.licenses},${row.revenue}\n`;
        });
        csv += '\n';
        // Churn Data
        csv += 'Churn Data\nName,Churn Risk,Last Activity\n';
        analyticsData.churnData.forEach(row => {
          csv += `${row.name},${row.churnRisk},${row.lastActivity}\n`;
        });
        csv += '\n';
        // Top Tracks
        csv += 'Top Tracks\nTitle,Plays,Licenses,Revenue\n';
        analyticsData.topTracks.forEach(row => {
          csv += `${row.title},${row.plays},${row.licenses},${row.revenue}\n`;
        });
        csv += '\n';
        // Key Metrics
        csv += 'Key Metrics\nTotal Revenue,Active Clients,Retention Rate\n';
        const km = analyticsData.keyMetrics;
        csv += `${km.totalRevenue},${km.activeClients},${km.retentionRate}\n`;
        // Download CSV
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'advanced-analytics.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else if (format === 'pdf') {
        // === PDF Export with Logo and Branding ===
        const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
        const pageWidth = doc.internal.pageSize.getWidth();
        let y = 40;
        // Add logo if provided
        if (logoUrl) {
          const img = await fetch(logoUrl).then(r => r.blob());
          const reader = new FileReader();
          const base64 = await new Promise<string>((resolve) => {
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(img);
          });
          doc.addImage(base64, 'PNG', 40, y, 100, 40, undefined, 'FAST');
        }
        // Title and subtitle
        y += logoUrl ? 60 : 0;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(22);
        doc.text('Advanced Analytics Report', 160, y, { align: 'left' });
        y += 30;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(12);
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, 160, y, { align: 'left' });
        y += 20;
        // Monthly Revenue Table
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text('Monthly Revenue', 40, y);
        y += 10;
        (doc as any).autoTable({
          startY: y,
          head: [['Month', 'Total']],
          body: analyticsData.revenueData.map(row => [row.month, row.total]),
          margin: { left: 40, right: 40 },
          theme: 'grid',
        });
        y = (doc as any).lastAutoTable.finalY + 20;
        // License Data Table
        doc.text('License Data', 40, y);
        y += 10;
        (doc as any).autoTable({
          startY: y,
          head: [['Name', 'Licenses', 'Revenue']],
          body: analyticsData.licenseData.map(row => [row.name, row.licenses, row.revenue]),
          margin: { left: 40, right: 40 },
          theme: 'grid',
        });
        y = (doc as any).lastAutoTable.finalY + 20;
        // Churn Data Table
        doc.text('Churn Data', 40, y);
        y += 10;
        (doc as any).autoTable({
          startY: y,
          head: [['Name', 'Churn Risk', 'Last Activity']],
          body: analyticsData.churnData.map(row => [row.name, row.churnRisk, row.lastActivity]),
          margin: { left: 40, right: 40 },
          theme: 'grid',
        });
        y = (doc as any).lastAutoTable.finalY + 20;
        // Top Tracks Table
        doc.text('Top Tracks', 40, y);
        y += 10;
        (doc as any).autoTable({
          startY: y,
          head: [['Title', 'Plays', 'Licenses', 'Revenue']],
          body: analyticsData.topTracks.map(row => [row.title, row.plays, row.licenses, row.revenue]),
          margin: { left: 40, right: 40 },
          theme: 'grid',
        });
        y = (doc as any).lastAutoTable.finalY + 20;
        // Key Metrics Table
        doc.text('Key Metrics', 40, y);
        y += 10;
        (doc as any).autoTable({
          startY: y,
          head: [['Total Revenue', 'Active Clients', 'Retention Rate']],
          body: [[analyticsData.keyMetrics.totalRevenue, analyticsData.keyMetrics.activeClients, analyticsData.keyMetrics.retentionRate]],
          margin: { left: 40, right: 40 },
          theme: 'grid',
        });
        // Footer with branding
        const footerY = doc.internal.pageSize.getHeight() - 80;
        doc.setDrawColor(90, 90, 180);
        doc.setLineWidth(1);
        doc.line(40, footerY, pageWidth - 40, footerY);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(90, 90, 180);
        doc.text(companyName || '', 50, footerY + 25);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(12);
        doc.setTextColor(90, 90, 180);
        doc.text(`Website: ${domain || ''}`, 50, footerY + 45);
        doc.text(`Email: ${email || ''}`, 50, footerY + 65);
        // Download PDF
        doc.save('advanced-analytics.pdf');
      }
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
        <div className="text-center max-w-2xl mx-auto px-4">
          <BarChart3 className="w-16 h-16 text-blue-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-4">Analytics Dashboard Ready</h1>
          <p className="text-gray-300 mb-6">
            Your analytics dashboard is set up and ready to display comprehensive insights once you have sales activity.
          </p>
          
          <div className="bg-white/5 backdrop-blur-sm p-6 rounded-xl border border-blue-500/20 text-left">
            <h3 className="text-lg font-semibold text-white mb-4">What will appear here:</h3>
            <div className="space-y-3 text-sm text-gray-300">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <span className="font-medium text-white">Track License Sales</span> - When users purchase track licenses
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <span className="font-medium text-white">Sync Proposals</span> - When sync proposals are paid and accepted
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <span className="font-medium text-white">Custom Sync Requests</span> - When custom sync requests are completed
                </div>
              </div>
            </div>
          </div>
          
          <p className="text-gray-400 text-sm mt-6">
            The dashboard will automatically populate with charts, metrics, and insights as your business grows.
          </p>
          
          {/* Debug Section */}
          <div className="mt-8 bg-yellow-500/10 backdrop-blur-sm p-4 rounded-xl border border-yellow-500/20 text-left">
            <h3 className="text-lg font-semibold text-yellow-400 mb-2">Debug Information</h3>
            <p className="text-yellow-300 text-sm mb-2">
              Check the browser console for detailed debug logs about data fetching.
            </p>
            <p className="text-yellow-300 text-sm">
              If you have sales activity but see this message, the issue might be:
            </p>
            <ul className="text-yellow-300 text-sm mt-2 space-y-1">
              <li>• Date range filtering (try changing the time period)</li>
              <li>• Data structure issues (check console for errors)</li>
              <li>• Permission issues (ensure you have admin access)</li>
            </ul>
          </div>
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
                      backgroundColor: 'rgba(0,0,0,0.9)', 
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '12px',
                      fontWeight: '500'
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
                      backgroundColor: 'rgba(0,0,0,0.9)', 
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}
                  />
                  <Bar dataKey="licenses" fill="#10b981" name="Licenses" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Top Performing Tracks */}
          <Card>
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
              {analyticsData.genreData.length > 0 ? (
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
                        backgroundColor: 'rgba(0,0,0,0.9)', 
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '8px',
                        color: '#ffffff',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}
                      itemStyle={{
                        color: '#fff',
                        fontWeight: 500
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-64 text-center">
                  <div>
                    <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-400 mb-2">No genre data available</p>
                    <p className="text-sm text-gray-500">
                      Genre distribution will appear when tracks with genre information are sold or licensed.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Revenue Forecast */}
          <Card>
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
                      backgroundColor: 'rgba(0,0,0,0.9)', 
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '12px',
                      fontWeight: '500'
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
          <Card>
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
                      backgroundColor: 'rgba(0,0,0,0.9)', 
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="churnRisk" fill="#ef4444" name="Churn Risk (%)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* AI Recommendations */}
          <Card className="xl:col-span-2">
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