import React, { useState, useEffect } from 'react';
import { Download, FileText, Calendar, BarChart3, DollarSign, Users, Filter, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { saveAs } from 'file-saver';
import { Page, Image, View, Text } from '@react-pdf/renderer';

interface ReportData {
  dateRange: {
    start: string;
    end: string;
  };
  summary: {
    totalSales: number;
    totalRevenue: number;
    trackLicenses: number;
    syncProposals: number;
    customSyncRequests: number;
    whiteLabelSetup: number;
    whiteLabelMonthly: number;
    trackLicenseRevenue: number;
    syncProposalRevenue: number;
    customSyncRevenue: number;
    whiteLabelSetupRevenue: number;
    whiteLabelMonthlyRevenue: number;
  };
  salesByType: Array<{
    type: string;
    count: number;
    revenue: number;
    percentage: number;
  }>;
  salesByProducer: Array<{
    producerId: string;
    producerName: string;
    producerEmail: string;
    trackLicenses: number;
    syncProposals: number;
    customSyncRequests: number;
    whiteLabelSetup: number;
    whiteLabelMonthly: number;
    totalSales: number;
    totalRevenue: number;
  }>;
  dailySales: Array<{
    date: string;
    trackLicenses: number;
    syncProposals: number;
    customSyncRequests: number;
    whiteLabelSetup: number;
    whiteLabelMonthly: number;
    totalSales: number;
    totalRevenue: number;
  }>;
}

interface AdminReportGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  background?: string; // Add background prop
}

export function AdminReportGenerator({ isOpen, onClose, background }: AdminReportGeneratorProps) {
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      generateReport();
    }
  }, [isOpen, dateRange]);

  const generateReport = async () => {
    try {
      setLoading(true);
      setError('');

      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      endDate.setHours(23, 59, 59, 999); // End of day

      // Fetch track license sales
      const { data: trackSales, error: trackError } = await supabase
        .from('sales')
        .select(`
          id, amount, created_at,
          track:tracks!inner(
            id, title,
            producer:profiles!inner(id, first_name, last_name, email)
          )
        `)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .is('deleted_at', null);

      if (trackError) throw trackError;

      // Fetch sync proposal sales
      const { data: syncProposals, error: syncError } = await supabase
        .from('sync_proposals')
        .select(`
          id, sync_fee, created_at, payment_status, status,
          track:tracks!inner(
            id, title,
            producer:profiles!inner(id, first_name, last_name, email)
          )
        `)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .eq('payment_status', 'paid')
        .eq('status', 'accepted');

      if (syncError) throw syncError;

      // Fetch custom sync request sales
      const { data: customSyncRequests, error: customError } = await supabase
        .from('custom_sync_requests')
        .select(`
          id, sync_fee, final_amount, negotiated_amount, created_at, status, payment_status,
          preferred_producer:profiles!custom_sync_requests_preferred_producer_id_fkey(id, first_name, last_name, email)
        `)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .eq('payment_status', 'paid')
        .in('status', ['completed', 'accepted']);

      if (customError) throw customError;

      // Fetch white label setup fees
      const { data: whiteLabelSetup, error: whiteLabelSetupError } = await supabase
        .from('white_label_clients')
        .select(`
          id, setup_fee, created_at,
          owner:profiles!inner(id, first_name, last_name, email)
        `)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .not('setup_fee', 'is', null);

      if (whiteLabelSetupError) throw whiteLabelSetupError;

      // Fetch white label monthly subscriptions
      const { data: whiteLabelMonthly, error: whiteLabelMonthlyError } = await supabase
        .from('white_label_clients')
        .select(`
          id, monthly_fee, created_at,
          owner:profiles!inner(id, first_name, last_name, email)
        `)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .not('monthly_fee', 'is', null);

      if (whiteLabelMonthlyError) throw whiteLabelMonthlyError;

      // Process data
      const processedData = processReportData(
        trackSales || [], 
        syncProposals || [], 
        customSyncRequests || [],
        whiteLabelSetup || [],
        whiteLabelMonthly || []
      );
      setReportData(processedData);

    } catch (err: any) {
      // Log detailed error information for debugging
      console.error('Error generating report - Message:', err?.message);
      console.error('Error generating report - Stack:', err?.stack);
      console.error('Error generating report - Full error:', err);
      
      // Set a more specific error message based on the error type
      let errorMessage = 'Failed to generate report. Please try again.';
      if (err?.message) {
        if (err.message.includes('permission')) {
          errorMessage = 'Permission denied. Please check your access rights.';
        } else if (err.message.includes('network') || err.message.includes('fetch')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else if (err.message.includes('column') || err.message.includes('relation')) {
          errorMessage = 'Database schema error. Please contact support.';
        }
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const processReportData = (
    trackSales: any[], 
    syncProposals: any[], 
    customSyncRequests: any[],
    whiteLabelSetup: any[],
    whiteLabelMonthly: any[]
  ): ReportData => {
    // Calculate summary
    const trackLicenseRevenue = trackSales.reduce((sum, sale) => sum + (sale.amount || 0), 0);
    const syncProposalRevenue = syncProposals.reduce((sum, proposal) => sum + (proposal.final_amount || proposal.negotiated_amount || proposal.sync_fee || 0), 0);
    const customSyncRevenue = customSyncRequests.reduce((sum, request) => sum + (request.final_amount || request.negotiated_amount || request.sync_fee || 0), 0);
    const whiteLabelSetupRevenue = whiteLabelSetup.reduce((sum, setup) => sum + (setup.setup_fee || 0), 0);
    const whiteLabelMonthlyRevenue = whiteLabelMonthly.reduce((sum, monthly) => sum + (monthly.monthly_fee || 0), 0);
    
    const totalRevenue = trackLicenseRevenue + syncProposalRevenue + customSyncRevenue + whiteLabelSetupRevenue + whiteLabelMonthlyRevenue;
    const totalSales = trackSales.length + syncProposals.length + customSyncRequests.length + whiteLabelSetup.length + whiteLabelMonthly.length;

    // Sales by type
    const salesByType = [
      {
        type: 'Track Licenses',
        count: trackSales.length,
        revenue: trackLicenseRevenue,
        percentage: totalRevenue > 0 ? (trackLicenseRevenue / totalRevenue) * 100 : 0
      },
      {
        type: 'Sync Proposals',
        count: syncProposals.length,
        revenue: syncProposalRevenue,
        percentage: totalRevenue > 0 ? (syncProposalRevenue / totalRevenue) * 100 : 0
      },
      {
        type: 'Custom Sync Requests',
        count: customSyncRequests.length,
        revenue: customSyncRevenue,
        percentage: totalRevenue > 0 ? (customSyncRevenue / totalRevenue) * 100 : 0
      },
      {
        type: 'White Label Setup',
        count: whiteLabelSetup.length,
        revenue: whiteLabelSetupRevenue,
        percentage: totalRevenue > 0 ? (whiteLabelSetupRevenue / totalRevenue) * 100 : 0
      },
      {
        type: 'White Label Monthly',
        count: whiteLabelMonthly.length,
        revenue: whiteLabelMonthlyRevenue,
        percentage: totalRevenue > 0 ? (whiteLabelMonthlyRevenue / totalRevenue) * 100 : 0
      }
    ];

    // Sales by producer
    const producerMap = new Map();
    
    // Process track sales
    trackSales.forEach(sale => {
      const producerId = sale.track.producer.id;
      if (!producerMap.has(producerId)) {
        producerMap.set(producerId, {
          producerId,
          producerName: `${sale.track.producer.first_name} ${sale.track.producer.last_name}`,
          producerEmail: sale.track.producer.email,
          trackLicenses: 0,
          syncProposals: 0,
          customSyncRequests: 0,
          whiteLabelSetup: 0,
          whiteLabelMonthly: 0,
          totalSales: 0,
          totalRevenue: 0
        });
      }
      const producer = producerMap.get(producerId);
      producer.trackLicenses++;
      producer.totalSales++;
      producer.totalRevenue += sale.amount || 0;
    });

    // Process sync proposals
    syncProposals.forEach(proposal => {
      const producerId = proposal.track.producer.id;
      if (!producerMap.has(producerId)) {
        producerMap.set(producerId, {
          producerId,
          producerName: `${proposal.track.producer.first_name} ${proposal.track.producer.last_name}`,
          producerEmail: proposal.track.producer.email,
          trackLicenses: 0,
          syncProposals: 0,
          customSyncRequests: 0,
          whiteLabelSetup: 0,
          whiteLabelMonthly: 0,
          totalSales: 0,
          totalRevenue: 0
        });
      }
      const producer = producerMap.get(producerId);
      producer.syncProposals++;
      producer.totalSales++;
      producer.totalRevenue += proposal.final_amount || proposal.negotiated_amount || proposal.sync_fee || 0;
    });

    // Process custom sync requests
    customSyncRequests.forEach(request => {
      const producerId = request.preferred_producer.id;
      if (!producerMap.has(producerId)) {
        producerMap.set(producerId, {
          producerId,
          producerName: `${request.preferred_producer.first_name} ${request.preferred_producer.last_name}`,
          producerEmail: request.preferred_producer.email,
          trackLicenses: 0,
          syncProposals: 0,
          customSyncRequests: 0,
          whiteLabelSetup: 0,
          whiteLabelMonthly: 0,
          totalSales: 0,
          totalRevenue: 0
        });
      }
      const producer = producerMap.get(producerId);
      producer.customSyncRequests++;
      producer.totalSales++;
      producer.totalRevenue += request.final_amount || request.negotiated_amount || request.sync_fee || 0;
    });

    // Process white label setup fees
    whiteLabelSetup.forEach(setup => {
      const producerId = setup.owner.id;
      if (!producerMap.has(producerId)) {
        producerMap.set(producerId, {
          producerId,
          producerName: `${setup.owner.first_name} ${setup.owner.last_name}`,
          producerEmail: setup.owner.email,
          trackLicenses: 0,
          syncProposals: 0,
          customSyncRequests: 0,
          whiteLabelSetup: 0,
          whiteLabelMonthly: 0,
          totalSales: 0,
          totalRevenue: 0
        });
      }
      const producer = producerMap.get(producerId);
      producer.whiteLabelSetup++;
      producer.totalSales++;
      producer.totalRevenue += setup.setup_fee || 0;
    });

    // Process white label monthly subscriptions
    whiteLabelMonthly.forEach(monthly => {
      const producerId = monthly.owner.id;
      if (!producerMap.has(producerId)) {
        producerMap.set(producerId, {
          producerId,
          producerName: `${monthly.owner.first_name} ${monthly.owner.last_name}`,
          producerEmail: monthly.owner.email,
          trackLicenses: 0,
          syncProposals: 0,
          customSyncRequests: 0,
          whiteLabelSetup: 0,
          whiteLabelMonthly: 0,
          totalSales: 0,
          totalRevenue: 0
        });
      }
      const producer = producerMap.get(producerId);
      producer.whiteLabelMonthly++;
      producer.totalSales++;
      producer.totalRevenue += monthly.monthly_fee || 0;
    });

    const salesByProducer = Array.from(producerMap.values())
      .sort((a, b) => b.totalRevenue - a.totalRevenue);

    // Daily sales breakdown
    const dailyMap = new Map();
    const allSales = [
      ...trackSales.map(sale => ({ ...sale, type: 'track_license' })),
      ...syncProposals.map(proposal => ({ ...proposal, type: 'sync_proposal' })),
      ...customSyncRequests.map(request => ({ ...request, type: 'custom_sync' })),
      ...whiteLabelSetup.map(setup => ({ ...setup, type: 'white_label_setup' })),
      ...whiteLabelMonthly.map(monthly => ({ ...monthly, type: 'white_label_monthly' }))
    ];

    allSales.forEach(sale => {
      const date = new Date(sale.created_at).toISOString().split('T')[0];
      if (!dailyMap.has(date)) {
        dailyMap.set(date, {
          date,
          trackLicenses: 0,
          syncProposals: 0,
          customSyncRequests: 0,
          whiteLabelSetup: 0,
          whiteLabelMonthly: 0,
          totalSales: 0,
          totalRevenue: 0
        });
      }
      const day = dailyMap.get(date);
      day.totalSales++;
      
      if (sale.type === 'track_license') {
        day.trackLicenses++;
        day.totalRevenue += sale.amount || 0;
      } else if (sale.type === 'sync_proposal') {
        day.syncProposals++;
        day.totalRevenue += sale.final_amount || sale.negotiated_amount || sale.sync_fee || 0;
      } else if (sale.type === 'custom_sync') {
        day.customSyncRequests++;
        day.totalRevenue += sale.final_amount || sale.negotiated_amount || sale.sync_fee || 0;
      } else if (sale.type === 'white_label_setup') {
        day.whiteLabelSetup++;
        day.totalRevenue += sale.setup_fee || 0;
      } else if (sale.type === 'white_label_monthly') {
        day.whiteLabelMonthly++;
        day.totalRevenue += sale.monthly_fee || 0;
      }
    });

    const dailySales = Array.from(dailyMap.values())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return {
      dateRange: { start: dateRange.start, end: dateRange.end },
      summary: {
        totalSales,
        totalRevenue,
        trackLicenses: trackSales.length,
        syncProposals: syncProposals.length,
        customSyncRequests: customSyncRequests.length,
        whiteLabelSetup: whiteLabelSetup.length,
        whiteLabelMonthly: whiteLabelMonthly.length,
        trackLicenseRevenue,
        syncProposalRevenue,
        customSyncRevenue,
        whiteLabelSetupRevenue,
        whiteLabelMonthlyRevenue
      },
      salesByType,
      salesByProducer,
      dailySales
    };
  };

  const exportToCSV = () => {
    if (!reportData) return;

    const csvData = [
      // Summary
      ['Sales Report Summary'],
      ['Date Range', `${reportData.dateRange.start} to ${reportData.dateRange.end}`],
      [''],
      ['Metric', 'Count', 'Revenue'],
      ['Total Sales', reportData.summary.totalSales, `$${reportData.summary.totalRevenue.toFixed(2)}`],
      ['Track Licenses', reportData.summary.trackLicenses, `$${reportData.summary.trackLicenseRevenue.toFixed(2)}`],
      ['Sync Proposals', reportData.summary.syncProposals, `$${reportData.summary.syncProposalRevenue.toFixed(2)}`],
      ['Custom Sync Requests', reportData.summary.customSyncRequests, `$${reportData.summary.customSyncRevenue.toFixed(2)}`],
      ['White Label Setup', reportData.summary.whiteLabelSetup, `$${reportData.summary.whiteLabelSetupRevenue.toFixed(2)}`],
      ['White Label Monthly', reportData.summary.whiteLabelMonthly, `$${reportData.summary.whiteLabelMonthlyRevenue.toFixed(2)}`],
      [''],
      
      // Sales by Type
      ['Sales by Type'],
      ['Type', 'Count', 'Revenue', 'Percentage'],
      ...reportData.salesByType.map(type => [
        type.type,
        type.count,
        `$${type.revenue.toFixed(2)}`,
        `${type.percentage.toFixed(1)}%`
      ]),
      [''],
      
      // Sales by Producer
      ['Sales by Producer'],
      ['Producer', 'Email', 'Track Licenses', 'Sync Proposals', 'Custom Sync', 'White Label Setup', 'White Label Monthly', 'Total Sales', 'Total Revenue'],
      ...reportData.salesByProducer.map(producer => [
        producer.producerName,
        producer.producerEmail,
        producer.trackLicenses,
        producer.syncProposals,
        producer.customSyncRequests,
        producer.whiteLabelSetup,
        producer.whiteLabelMonthly,
        producer.totalSales,
        `$${producer.totalRevenue.toFixed(2)}`
      ]),
      [''],
      
      // Daily Sales
      ['Daily Sales Breakdown'],
      ['Date', 'Track Licenses', 'Sync Proposals', 'Custom Sync', 'White Label Setup', 'White Label Monthly', 'Total Sales', 'Total Revenue'],
      ...reportData.dailySales.map(day => [
        day.date,
        day.trackLicenses,
        day.syncProposals,
        day.customSyncRequests,
        day.whiteLabelSetup,
        day.whiteLabelMonthly,
        day.totalSales,
        `$${day.totalRevenue.toFixed(2)}`
      ])
    ];

    const csvContent = csvData.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `sales-report-${dateRange.start}-to-${dateRange.end}.csv`);
  };

  const exportToPDF = async () => {
    if (!reportData) return;

    try {
      const { Document, StyleSheet, Text } = await import('@react-pdf/renderer');
      
      const styles = StyleSheet.create({
        page: { position: 'relative', width: '100%', height: '100%' },
        background: {
          position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', zIndex: 0,
        },
        content: {
          position: 'relative', zIndex: 1, padding: 20, color: '#222', fontSize: 12, width: '100%',
        },
        title: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, textAlign: 'center', color: '#222' },
        section: { marginBottom: 18 },
        sectionTitle: { fontSize: 14, marginBottom: 10, fontWeight: 'bold', color: '#333' },
        table: { display: 'flex', width: '100%', marginTop: 8, marginBottom: 12 },
        tableRow: { flexDirection: 'row' },
        tableCell: { flex: 1, padding: 4, borderBottom: '1pt solid #eee', fontSize: 11 },
        header: { fontWeight: 'bold', backgroundColor: '#f0f0f0', color: '#222' },
        summaryRow: { flexDirection: 'row', marginBottom: 4 },
        summaryCell: { flex: 1, fontSize: 12, color: '#222' },
      });

      // CustomPage component for background on every page
      interface CustomPageProps {
        background?: string;
        children: React.ReactNode;
        [key: string]: any;
      }
      const CustomPage = ({ background, children, ...props }: CustomPageProps) => {
        return (
          <Page {...props}>
            {background && (
              <Image src={background} style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', zIndex: 0 }} />
            )}
            <View style={{ position: 'relative', zIndex: 1, padding: 20, width: '100%' }}>
              {children}
            </View>
          </Page>
        );
      };

      const ReportPDF = () => (
        <Document>
          <CustomPage size="A4" background={background}>
            <View style={{ height: 1 }} />
          </CustomPage>
          {/* Report content starts on second page, no background */}
          <Page size="A4" style={styles.page}>
            <View style={styles.content}>
              <Text style={styles.title}>Sales Report</Text>
              <Text style={{ textAlign: 'center', marginBottom: 12, fontSize: 11 }}>
                Date Range: {reportData.dateRange.start} to {reportData.dateRange.end}
              </Text>
              {/* Summary Table */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Summary</Text>
                <View style={styles.table}>
                  <View style={[styles.tableRow, styles.header]}>
                    <Text style={styles.tableCell}>Total Sales</Text>
                    <Text style={styles.tableCell}>Total Revenue</Text>
                    <Text style={styles.tableCell}>Track Licenses</Text>
                    <Text style={styles.tableCell}>Sync Proposals</Text>
                  </View>
                  <View style={styles.tableRow}>
                    <Text style={styles.tableCell}>{reportData.summary.totalSales}</Text>
                    <Text style={styles.tableCell}>${reportData.summary.totalRevenue.toFixed(2)}</Text>
                    <Text style={styles.tableCell}>{reportData.summary.trackLicenses}</Text>
                    <Text style={styles.tableCell}>{reportData.summary.syncProposals}</Text>
                  </View>
                </View>
              </View>
              {/* Sales by Type Table */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Sales by Type</Text>
                <View style={styles.table}>
                  <View style={[styles.tableRow, styles.header]}>
                    <Text style={styles.tableCell}>Type</Text>
                    <Text style={styles.tableCell}>Count</Text>
                    <Text style={styles.tableCell}>Revenue</Text>
                    <Text style={styles.tableCell}>%</Text>
                  </View>
                  {reportData.salesByType.map((type, i) => (
                    <View style={styles.tableRow} key={i}>
                      <Text style={styles.tableCell}>{type.type}</Text>
                      <Text style={styles.tableCell}>{type.count}</Text>
                      <Text style={styles.tableCell}>${type.revenue.toFixed(2)}</Text>
                      <Text style={styles.tableCell}>{type.percentage.toFixed(1)}%</Text>
                    </View>
                  ))}
                </View>
              </View>
              {/* Top Producers Table */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Top Producers</Text>
                <View style={styles.table}>
                  <View style={[styles.tableRow, styles.header]}>
                    <Text style={styles.tableCell}>Producer</Text>
                    <Text style={styles.tableCell}>Total Sales</Text>
                    <Text style={styles.tableCell}>Total Revenue</Text>
                  </View>
                  {reportData.salesByProducer.slice(0, 10).map((producer, i) => (
                    <View style={styles.tableRow} key={i}>
                      <Text style={styles.tableCell}>{producer.producerName}</Text>
                      <Text style={styles.tableCell}>{producer.totalSales}</Text>
                      <Text style={styles.tableCell}>${producer.totalRevenue.toFixed(2)}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          </Page>
        </Document>
      );

      const { pdf } = await import('@react-pdf/renderer');
      const blob = await pdf(<ReportPDF />).toBlob();
      saveAs(blob, `sales-report-${dateRange.start}-to-${dateRange.end}.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
      setError('Failed to generate PDF. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-blue-900 p-6 rounded-xl border border-purple-500/20 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Admin Report Generator</h2>
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

        {/* Date Range Selector */}
        <div className="bg-white/5 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-white mb-4">Select Date Range</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Start Date</label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="w-full bg-white/10 border border-blue-500/20 rounded-lg px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">End Date</label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="w-full bg-white/10 border border-blue-500/20 rounded-lg px-3 py-2 text-white"
              />
            </div>
          </div>
        </div>

        {/* Report Summary */}
        {reportData && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white/5 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Total Sales</p>
                    <p className="text-2xl font-bold text-white">{reportData.summary.totalSales}</p>
                  </div>
                  <BarChart3 className="w-8 h-8 text-blue-500" />
                </div>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Total Revenue</p>
                    <p className="text-2xl font-bold text-green-400">${reportData.summary.totalRevenue.toFixed(2)}</p>
                  </div>
                  <DollarSign className="w-8 h-8 text-green-500" />
                </div>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Track Licenses</p>
                    <p className="text-2xl font-bold text-white">{reportData.summary.trackLicenses}</p>
                  </div>
                  <FileText className="w-8 h-8 text-purple-500" />
                </div>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Sync Proposals</p>
                    <p className="text-2xl font-bold text-white">{reportData.summary.syncProposals}</p>
                  </div>
                  <Users className="w-8 h-8 text-yellow-500" />
                </div>
              </div>
            </div>

            {/* Sales by Type */}
            <div className="bg-white/5 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-4">Sales by Type</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-black/20">
                      <th className="px-4 py-2 text-left text-gray-300">Type</th>
                      <th className="px-4 py-2 text-left text-gray-300">Count</th>
                      <th className="px-4 py-2 text-left text-gray-300">Revenue</th>
                      <th className="px-4 py-2 text-left text-gray-300">Percentage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.salesByType.map((type, index) => (
                      <tr key={index} className="border-b border-white/10">
                        <td className="px-4 py-2 text-white">{type.type}</td>
                        <td className="px-4 py-2 text-white">{type.count}</td>
                        <td className="px-4 py-2 text-green-400">${type.revenue.toFixed(2)}</td>
                        <td className="px-4 py-2 text-white">{type.percentage.toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Top Producers */}
            <div className="bg-white/5 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-4">Top Producers</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-black/20">
                      <th className="px-4 py-2 text-left text-gray-300">Producer</th>
                      <th className="px-4 py-2 text-left text-gray-300">Track Licenses</th>
                      <th className="px-4 py-2 text-left text-gray-300">Sync Proposals</th>
                      <th className="px-4 py-2 text-left text-gray-300">Custom Sync</th>
                      <th className="px-4 py-2 text-left text-gray-300">Total Sales</th>
                      <th className="px-4 py-2 text-left text-gray-300">Total Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.salesByProducer.slice(0, 10).map((producer, index) => (
                      <tr key={index} className="border-b border-white/10">
                        <td className="px-4 py-2 text-white">{producer.producerName}</td>
                        <td className="px-4 py-2 text-white">{producer.trackLicenses}</td>
                        <td className="px-4 py-2 text-white">{producer.syncProposals}</td>
                        <td className="px-4 py-2 text-white">{producer.customSyncRequests}</td>
                        <td className="px-4 py-2 text-white">{producer.totalSales}</td>
                        <td className="px-4 py-2 text-green-400">${producer.totalRevenue.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Export Buttons */}
            <div className="flex justify-center space-x-4">
              <button
                onClick={exportToCSV}
                disabled={loading}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center disabled:opacity-50"
              >
                <Download className="w-5 h-5 mr-2" />
                Export to CSV
              </button>
              <button
                onClick={exportToPDF}
                disabled={loading}
                className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center disabled:opacity-50"
              >
                <FileText className="w-5 h-5 mr-2" />
                Export to PDF
              </button>
            </div>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-white">Generating report...</span>
          </div>
        )}
      </div>
    </div>
  );
} 