import React, { useState, useEffect } from 'react';
import { Download, FileText, Calendar, BarChart3, DollarSign, Users, Filter, X, Globe } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { saveAs } from 'file-saver';
import { Page, Image, View, Text } from '@react-pdf/renderer';
import { ReportBackgroundPicker } from './ReportBackgroundPicker';

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
    membershipSubscriptions: number;
    trackLicenseRevenue: number;
    syncProposalRevenue: number;
    customSyncRevenue: number;
    whiteLabelSetupRevenue: number;
    whiteLabelMonthlyRevenue: number;
    membershipSubscriptionRevenue: number;
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
    membershipSubscriptions: number;
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
    membershipSubscriptions: number;
    totalSales: number;
    totalRevenue: number;
  }>;
}

interface AdminReportGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  background?: string; // Add background prop
}

export function AdminReportGenerator({ isOpen, onClose }: AdminReportGeneratorProps) {
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [error, setError] = useState('');
  const [clientName, setClientName] = useState<string>('MyBeatFi');
  const [selectedCover, setSelectedCover] = useState<string>("");
  const [defaultCover, setDefaultCover] = useState<string>("");
  const [settingDefault, setSettingDefault] = useState(false);

  // Fetch default cover from report_settings on mount
  const fetchDefaultCover = async () => {
    const { data, error } = await supabase.from('report_settings').select('default_cover_url').eq('id', 1).single();
    if (data && data.default_cover_url) {
      setDefaultCover(data.default_cover_url);
      setSelectedCover(data.default_cover_url);
    }
  };

  // Set a new default cover in the database
  const handleSetDefaultCover = async (url: string) => {
    setSettingDefault(true);
    await supabase.from('report_settings').update({ default_cover_url: url, updated_at: new Date().toISOString() }).eq('id', 1);
    setDefaultCover(url);
    setSelectedCover(url);
    setSettingDefault(false);
  };

  useEffect(() => {
    if (isOpen) {
      generateReport();
      fetchClientName();
      fetchDefaultCover();
    }
  }, [isOpen, dateRange]);

  // Fetch the white label client display_name
  const fetchClientName = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      if (!user) return;
      const { data, error } = await supabase
        .from('white_label_clients')
        .select('display_name')
        .eq('owner_id', user.id)
        .maybeSingle();
      if (data && data.display_name) {
        setClientName(data.display_name);
      }
    } catch (err) {
      // fallback to default
    }
  };

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

      // Fetch white label monthly payments (paid and pending)
      const { data: whiteLabelMonthlyPayments, error: whiteLabelMonthlyPaymentsError } = await supabase
        .from('white_label_monthly_payments')
        .select('id, client_id, amount, due_date, paid_date, status, created_at')
        .gte('due_date', startDate.toISOString().split('T')[0])
        .lte('due_date', endDate.toISOString().split('T')[0]);
      if (whiteLabelMonthlyPaymentsError) throw whiteLabelMonthlyPaymentsError;

      // Split into paid and pending
      const paidMonthly = (whiteLabelMonthlyPayments || []).filter(p => p.status === 'paid');
      const pendingMonthly = (whiteLabelMonthlyPayments || []).filter(p => p.status === 'pending');

      // Fetch membership subscriptions (Gold, Platinum, Ultimate Access)
      const { data: membershipSubscriptions, error: membershipSubscriptionsError } = await supabase
        .from('stripe_subscriptions')
        .select('id, subscription_id, status, price_id, created_at')
        .eq('status', 'active')
        .in('price_id', [
          'price_1RdAfqR8RYA8TFzwKP7zrKsm', // Ultimate Access
          'price_1RdAfXR8RYA8TFzwFZyaSREP', // Platinum Access
          'price_1RdAfER8RYA8TFzw7RrrNmtt'  // Gold Access
        ])
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (membershipSubscriptionsError) throw membershipSubscriptionsError;

      // Process data
      const processedData = processReportData(
        trackSales || [],
        syncProposals || [],
        customSyncRequests || [],
        whiteLabelSetup || [],
        paidMonthly,
        pendingMonthly,
        membershipSubscriptions || []
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
    paidMonthly: any[],
    pendingMonthly: any[],
    membershipSubscriptions: any[]
  ): ReportData => {
    // Calculate summary
    const trackLicenseRevenue = trackSales.reduce((sum, sale) => sum + (sale.amount || 0), 0);
    const syncProposalRevenue = syncProposals.reduce((sum, proposal) => sum + (proposal.final_amount || proposal.negotiated_amount || proposal.sync_fee || 0), 0);
    const customSyncRevenue = customSyncRequests.reduce((sum, request) => sum + (request.final_amount || request.negotiated_amount || request.sync_fee || 0), 0);
    const whiteLabelSetupRevenue = whiteLabelSetup.reduce((sum, setup) => sum + (setup.setup_fee || 0), 0);
    const whiteLabelMonthlyRevenue = (paidMonthly.reduce((sum, p) => sum + (p.amount || 0), 0) + pendingMonthly.reduce((sum, p) => sum + (p.amount || 0), 0));
    
    // Calculate membership subscription revenue
    const membershipSubscriptionRevenue = membershipSubscriptions.reduce((sum, subscription) => {
      // Map price IDs to monthly amounts
      switch (subscription.price_id) {
        case 'price_1RdAfqR8RYA8TFzwKP7zrKsm': // Ultimate Access
          return sum + 299;
        case 'price_1RdAfXR8RYA8TFzwFZyaSREP': // Platinum Access
          return sum + 199;
        case 'price_1RdAfER8RYA8TFzw7RrrNmtt': // Gold Access
          return sum + 99;
        default:
          return sum + 99; // Default to Gold Access amount
      }
    }, 0);
    
    const totalRevenue = trackLicenseRevenue + syncProposalRevenue + customSyncRevenue + whiteLabelSetupRevenue + whiteLabelMonthlyRevenue + membershipSubscriptionRevenue;
    const totalSales = trackSales.length + syncProposals.length + customSyncRequests.length + whiteLabelSetup.length + paidMonthly.length + pendingMonthly.length + membershipSubscriptions.length;

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
        count: paidMonthly.length + pendingMonthly.length,
        revenue: whiteLabelMonthlyRevenue,
        percentage: totalRevenue > 0 ? (whiteLabelMonthlyRevenue / totalRevenue) * 100 : 0
      },
      {
        type: 'Membership Subscriptions',
        count: membershipSubscriptions.length,
        revenue: membershipSubscriptionRevenue,
        percentage: totalRevenue > 0 ? (membershipSubscriptionRevenue / totalRevenue) * 100 : 0
      }
    ];

    // Sales by producer
    const producerMap = new Map();
    
    // Process track sales
    trackSales.forEach(sale => {
      if (!sale.track || !sale.track.producer) return;
      const producerId = sale.track.producer.id;
      if (!producerId) return;
      if (!producerMap.has(producerId)) {
        producerMap.set(producerId, {
          producerId,
          producerName: `${sale.track.producer.first_name || ''} ${sale.track.producer.last_name || ''}`.trim() || 'Unknown',
          producerEmail: sale.track.producer.email || 'unknown',
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
      if (!proposal.track || !proposal.track.producer) return;
      const producerId = proposal.track.producer.id;
      if (!producerId) return;
      if (!producerMap.has(producerId)) {
        producerMap.set(producerId, {
          producerId,
          producerName: `${proposal.track.producer.first_name || ''} ${proposal.track.producer.last_name || ''}`.trim() || 'Unknown',
          producerEmail: proposal.track.producer.email || 'unknown',
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
      if (!request.preferred_producer) return;
      const producerId = request.preferred_producer.id;
      if (!producerId) return;
      if (!producerMap.has(producerId)) {
        producerMap.set(producerId, {
          producerId,
          producerName: `${request.preferred_producer.first_name || ''} ${request.preferred_producer.last_name || ''}`.trim() || 'Unknown',
          producerEmail: request.preferred_producer.email || 'unknown',
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

    // Process white label monthly payments
    paidMonthly.forEach(p => {
      const producerId = p.client_id; // Assuming client_id is the producer_id for monthly payments
      if (!producerMap.has(producerId)) {
        producerMap.set(producerId, {
          producerId,
          producerName: `${p.client_id} (White Label)`, // Placeholder, needs actual client name lookup
          producerEmail: 'info@mybeatfi.com', // Placeholder
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
      producer.totalRevenue += p.amount || 0;
    });

    pendingMonthly.forEach(p => {
      const producerId = p.client_id; // Assuming client_id is the producer_id for monthly payments
      if (!producerMap.has(producerId)) {
        producerMap.set(producerId, {
          producerId,
          producerName: `${p.client_id} (White Label)`, // Placeholder, needs actual client name lookup
          producerEmail: 'info@mybeatfi.com', // Placeholder
          trackLicenses: 0,
          syncProposals: 0,
          customSyncRequests: 0,
          whiteLabelSetup: 0,
          whiteLabelMonthly: 0,
          membershipSubscriptions: 0,
          totalSales: 0,
          totalRevenue: 0
        });
      }
      const producer = producerMap.get(producerId);
      producer.whiteLabelMonthly++;
      producer.totalSales++;
      producer.totalRevenue += p.amount || 0;
    });

    // Process membership subscriptions
    membershipSubscriptions.forEach(subscription => {
      // For membership subscriptions, we'll create a general entry since they're not tied to specific producers
      const producerId = 'membership_subscriptions';
      if (!producerMap.has(producerId)) {
        producerMap.set(producerId, {
          producerId,
          producerName: 'Membership Subscriptions',
          producerEmail: 'memberships@mybeatfi.com',
          trackLicenses: 0,
          syncProposals: 0,
          customSyncRequests: 0,
          whiteLabelSetup: 0,
          whiteLabelMonthly: 0,
          membershipSubscriptions: 0,
          totalSales: 0,
          totalRevenue: 0
        });
      }
      const producer = producerMap.get(producerId);
      producer.membershipSubscriptions++;
      producer.totalSales++;
      // Calculate revenue based on price ID
      let revenue = 99; // Default to Gold Access
      switch (subscription.price_id) {
        case 'price_1RdAfqR8RYA8TFzwKP7zrKsm': // Ultimate Access
          revenue = 299;
          break;
        case 'price_1RdAfXR8RYA8TFzwFZyaSREP': // Platinum Access
          revenue = 199;
          break;
        case 'price_1RdAfER8RYA8TFzw7RrrNmtt': // Gold Access
          revenue = 99;
          break;
      }
      producer.totalRevenue += revenue;
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
      ...paidMonthly.map(p => ({ ...p, type: 'white_label_monthly_paid' })),
      ...pendingMonthly.map(p => ({ ...p, type: 'white_label_monthly_pending' })),
      ...membershipSubscriptions.map(subscription => ({ ...subscription, type: 'membership_subscription' }))
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
          membershipSubscriptions: 0,
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
      } else if (sale.type === 'white_label_monthly_paid') {
        day.whiteLabelMonthly++;
        day.totalRevenue += sale.amount || 0;
      } else if (sale.type === 'white_label_monthly_pending') {
        day.whiteLabelMonthly++;
        day.totalRevenue += sale.amount || 0;
      } else if (sale.type === 'membership_subscription') {
        day.membershipSubscriptions++;
        // Calculate revenue based on price ID
        let revenue = 99; // Default to Gold Access
        switch (sale.price_id) {
          case 'price_1RdAfqR8RYA8TFzwKP7zrKsm': // Ultimate Access
            revenue = 299;
            break;
          case 'price_1RdAfXR8RYA8TFzwFZyaSREP': // Platinum Access
            revenue = 199;
            break;
          case 'price_1RdAfER8RYA8TFzw7RrrNmtt': // Gold Access
            revenue = 99;
            break;
        }
        day.totalRevenue += revenue;
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
        whiteLabelMonthly: paidMonthly.length + pendingMonthly.length,
        membershipSubscriptions: membershipSubscriptions.length,
        trackLicenseRevenue,
        syncProposalRevenue,
        customSyncRevenue,
        whiteLabelSetupRevenue,
        whiteLabelMonthlyRevenue,
        membershipSubscriptionRevenue
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
      ['Membership Subscriptions', reportData.summary.membershipSubscriptions, `$${reportData.summary.membershipSubscriptionRevenue.toFixed(2)}`],
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
      ['Producer', 'Email', 'Track Licenses', 'Sync Proposals', 'Custom Sync', 'White Label Setup', 'White Label Monthly', 'Membership Subscriptions', 'Total Sales', 'Total Revenue'],
      ...reportData.salesByProducer.map(producer => [
        producer.producerName,
        producer.producerEmail,
        producer.trackLicenses,
        producer.syncProposals,
        producer.customSyncRequests,
        producer.whiteLabelSetup,
        producer.whiteLabelMonthly,
        producer.membershipSubscriptions,
        producer.totalSales,
        `$${producer.totalRevenue.toFixed(2)}`
      ]),
      [''],
      
      // Daily Sales
      ['Daily Sales Breakdown'],
      ['Date', 'Track Licenses', 'Sync Proposals', 'Custom Sync', 'White Label Setup', 'White Label Monthly', 'Membership Subscriptions', 'Total Sales', 'Total Revenue'],
      ...reportData.dailySales.map(day => [
        day.date,
        day.trackLicenses,
        day.syncProposals,
        day.customSyncRequests,
        day.whiteLabelSetup,
        day.whiteLabelMonthly,
        day.membershipSubscriptions,
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
          {/* Cover page: only background image, no overlays */}
          <Page size="A4" style={{ position: 'relative', width: '100%', height: '100%' }}>
            {selectedCover && (
              <Image src={selectedCover} style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%' }} />
            )}
          </Page>
          {/* Sales data: allow content to flow across as many pages as needed */}
          <Page size="A4" style={styles.page} wrap>
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
                    <View style={styles.tableRow} key={i} wrap={false}>
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
                  {reportData.salesByProducer.map((producer, i) => (
                    <View style={styles.tableRow} key={i} wrap={false}>
                      <Text style={styles.tableCell}>{producer.producerName}</Text>
                      <Text style={styles.tableCell}>{producer.totalSales}</Text>
                      <Text style={styles.tableCell}>${producer.totalRevenue.toFixed(2)}</Text>
                    </View>
                  ))}
                </View>
              </View>
              {/* Daily Sales Table */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Daily Sales Breakdown</Text>
                <View style={styles.table}>
                  <View style={[styles.tableRow, styles.header]}>
                    <Text style={styles.tableCell}>Date</Text>
                    <Text style={styles.tableCell}>Track Licenses</Text>
                    <Text style={styles.tableCell}>Sync Proposals</Text>
                    <Text style={styles.tableCell}>Custom Sync</Text>
                    <Text style={styles.tableCell}>White Label Setup</Text>
                    <Text style={styles.tableCell}>White Label Monthly</Text>
                    <Text style={styles.tableCell}>Total Sales</Text>
                    <Text style={styles.tableCell}>Total Revenue</Text>
                  </View>
                  {reportData.dailySales.map((day, i) => (
                    <View style={styles.tableRow} key={i} wrap={false}>
                      <Text style={styles.tableCell}>{day.date}</Text>
                      <Text style={styles.tableCell}>{day.trackLicenses}</Text>
                      <Text style={styles.tableCell}>{day.syncProposals}</Text>
                      <Text style={styles.tableCell}>{day.customSyncRequests}</Text>
                      <Text style={styles.tableCell}>{day.whiteLabelSetup}</Text>
                      <Text style={styles.tableCell}>{day.whiteLabelMonthly}</Text>
                      <Text style={styles.tableCell}>{day.totalSales}</Text>
                      <Text style={styles.tableCell}>${day.totalRevenue.toFixed(2)}</Text>
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
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
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
              <div className="bg-white/5 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">White Label Setup</p>
                    <p className="text-2xl font-bold text-white">{reportData.summary.whiteLabelSetup}</p>
                  </div>
                  <Globe className="w-8 h-8 text-orange-500" />
                </div>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">White Label Monthly</p>
                    <p className="text-2xl font-bold text-white">{reportData.summary.whiteLabelMonthly}</p>
                  </div>
                  <Calendar className="w-8 h-8 text-pink-500" />
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
                      <th className="px-4 py-2 text-left text-gray-300">White Label Setup</th>
                      <th className="px-4 py-2 text-left text-gray-300">White Label Monthly</th>
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
                        <td className="px-4 py-2 text-white">{producer.whiteLabelSetup}</td>
                        <td className="px-4 py-2 text-white">{producer.whiteLabelMonthly}</td>
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

        {/* Cover Picker - now at the bottom */}
        <div className="mt-8 mb-2">
          <h3 className="text-lg font-semibold text-white mb-2">Report Cover Pages</h3>
          <ReportBackgroundPicker
            selected={selectedCover}
            onChange={setSelectedCover}
            renderActions={(imgUrl: string) => (
              <button
                className={`mt-2 px-2 py-1 rounded text-xs ${defaultCover === imgUrl ? 'bg-blue-600 text-white' : 'bg-white/10 text-blue-300 hover:bg-blue-500/20'}`}
                disabled={settingDefault || defaultCover === imgUrl}
                onClick={() => handleSetDefaultCover(imgUrl)}
                type="button"
              >
                {defaultCover === imgUrl ? 'Default' : 'Set as Default'}
              </button>
            )}
          />
        </div>
      </div>
    </div>
  );
} 