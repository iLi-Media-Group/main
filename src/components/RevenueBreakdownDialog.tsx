import React, { useState, useEffect } from 'react';
import { X, DollarSign, Download, PieChart, Calendar, FileText, Loader2, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { ReportBackgroundPicker } from './ReportBackgroundPicker';

interface RevenueBreakdownDialogProps {
  isOpen: boolean;
  onClose: () => void;
  producerId?: string; // Optional - if provided, shows only this producer's revenue
  logoUrl?: string;
  companyName?: string;
  domain?: string;
  email?: string;
}

interface RevenueSource {
  source: string;
  amount: number;
  count: number;
  percentage: number;
  type: 'completed' | 'pending';
}

interface MonthlyRevenue {
  month: string;
  amount: number;
}

interface PendingPayment {
  id: string;
  source: string;
  amount: number;
  expectedDate?: string;
  status: string;
  description: string;
}

export function RevenueBreakdownDialog({
  isOpen,
  onClose,
  producerId,
  logoUrl,
  companyName,
  domain,
  email
}: RevenueBreakdownDialogProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revenueSources, setRevenueSources] = useState<RevenueSource[]>([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState<MonthlyRevenue[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [pendingPayments, setPendingPayments] = useState<PendingPayment[]>([]);
  const [totalPendingRevenue, setTotalPendingRevenue] = useState(0);
  const [timeframe, setTimeframe] = useState<'month' | 'quarter' | 'year' | 'all'>('month');
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [selectedCover, setSelectedCover] = useState<string>("");
  const [defaultCover, setDefaultCover] = useState<string>("");

  // Fetch default cover from report_settings on mount
  useEffect(() => {
    const fetchDefaultCover = async () => {
      const { data, error } = await supabase.from('report_settings').select('default_cover_url').eq('id', 1).single();
      if (data && data.default_cover_url) {
        setDefaultCover(data.default_cover_url);
        setSelectedCover(data.default_cover_url);
      }
    };
    if (isOpen) fetchDefaultCover();
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      fetchRevenueBreakdown();
    }
  }, [isOpen, producerId, timeframe]);

  const fetchRevenueBreakdown = async () => {
    try {
      setLoading(true);
      setError(null);

      // Calculate date range based on timeframe
      const endDate = new Date();
      const startDate = new Date();
      
      if (timeframe === 'month') {
        startDate.setMonth(startDate.getMonth() - 1);
      } else if (timeframe === 'quarter') {
        startDate.setMonth(startDate.getMonth() - 3);
      } else if (timeframe === 'year') {
        startDate.setFullYear(startDate.getFullYear() - 1);
      } else {
        // 'all' - set to a date far in the past
        startDate.setFullYear(2020);
      }

      // Fetch sales data (track licenses)
      let salesQuery = supabase
        .from('sales')
        .select(`
          id,
          license_type,
          amount,
          created_at,
          track:tracks!inner (
            title,
            track_producer_id
          )
        `)
        .gte('created_at', startDate.toISOString())
        .is('deleted_at', null);

      // Filter by producer if specified
      if (producerId) {
        salesQuery = salesQuery.eq('track.track_producer_id', producerId);
      }

      const { data: salesData, error: salesError } = await salesQuery;

      if (salesError) throw salesError;

      // Fetch paid sync proposals
      let syncProposalsQuery = supabase
        .from('sync_proposals')
        .select(`
          id,
          sync_fee,
          final_amount,
          negotiated_amount,
          status,
          created_at,
          track:tracks!inner (
            title,
            track_producer_id
          )
        `)
        .eq('payment_status', 'paid')
        .eq('status', 'accepted')
        .gte('created_at', startDate.toISOString());

      // Filter by producer if specified
      if (producerId) {
        syncProposalsQuery = syncProposalsQuery.eq('track.track_producer_id', producerId);
      }

      const { data: syncProposalsData, error: syncProposalsError } = await syncProposalsQuery;

      if (syncProposalsError) throw syncProposalsError;

      // Fetch completed custom sync requests
      let customSyncQuery = supabase
        .from('custom_sync_requests')
        .select(`
          id,
          sync_fee,
          final_amount,
          negotiated_amount,
          status,
          created_at,
          preferred_producer_id
        `)
        .eq('status', 'completed')
        .gte('created_at', startDate.toISOString());

      // Filter by producer if specified
      if (producerId) {
        customSyncQuery = customSyncQuery.eq('preferred_producer_id', producerId);
      }

      const { data: customSyncData, error: customSyncError } = await customSyncQuery;

      if (customSyncError) throw customSyncError;

      // Fetch white label setup fees
      let whiteLabelSetupQuery = supabase
        .from('white_label_clients')
        .select(`
          id,
          setup_fee,
          created_at,
          owner:profiles!inner(id, first_name, last_name, email)
        `)
        .not('setup_fee', 'is', null)
        .gte('created_at', startDate.toISOString());

      // Filter by producer if specified (for white label setup, this would be the owner)
      if (producerId) {
        whiteLabelSetupQuery = whiteLabelSetupQuery.eq('owner.id', producerId);
      }

      const { data: whiteLabelSetupData, error: whiteLabelSetupError } = await whiteLabelSetupQuery;

      if (whiteLabelSetupError) throw whiteLabelSetupError;

      // Fetch white label monthly payments (paid and pending)
      let whiteLabelMonthlyQuery = supabase
        .from('white_label_monthly_payments')
        .select('id, client_id, amount, due_date, paid_date, status, created_at')
        .gte('due_date', startDate.toISOString().split('T')[0])
        .lte('due_date', endDate.toISOString().split('T')[0]);

      // Filter by producer if specified (for monthly payments, this would be the client_id)
      if (producerId) {
        whiteLabelMonthlyQuery = whiteLabelMonthlyQuery.eq('client_id', producerId);
      }

      const { data: whiteLabelMonthlyData, error: whiteLabelMonthlyError } = await whiteLabelMonthlyQuery;

      if (whiteLabelMonthlyError) throw whiteLabelMonthlyError;

      // Split into paid and pending
      const paidMonthly = (whiteLabelMonthlyData || []).filter(p => p.status === 'paid');
      const pendingMonthly = (whiteLabelMonthlyData || []).filter(p => p.status === 'pending');

      // Fetch pending sync proposals
      let pendingSyncProposalsQuery = supabase
        .from('sync_proposals')
        .select(`
          id,
          sync_fee,
          final_amount,
          negotiated_amount,
          payment_terms,
          final_payment_terms,
          negotiated_payment_terms,
          client_accepted_at,
          payment_due_date,
          status,
          client_status,
          producer_status,
          created_at,
          updated_at,
          track:tracks!inner (
            title,
            track_producer_id
          )
        `)
        .eq('payment_status', 'pending')
        .eq('client_status', 'accepted')
        .eq('producer_status', 'accepted');

      // Filter by producer if specified
      if (producerId) {
        pendingSyncProposalsQuery = pendingSyncProposalsQuery.eq('track.track_producer_id', producerId);
      }

      const { data: pendingSyncProposalsData, error: pendingSyncProposalsError } = await pendingSyncProposalsQuery;

      if (pendingSyncProposalsError) throw pendingSyncProposalsError;

      // Debug logging for pending sync proposals
      console.log('=== PENDING SYNC PROPOSALS DEBUG ===');
      console.log('Pending sync proposals count:', pendingSyncProposalsData?.length || 0);
      console.log('Pending sync proposals data:', pendingSyncProposalsData);
      console.log('=== END PENDING SYNC PROPOSALS DEBUG ===');

      // Fetch pending custom sync requests
      let pendingCustomSyncQuery = supabase
        .from('custom_sync_requests')
        .select(`
          id,
          sync_fee,
          final_amount,
          payment_terms,
          final_payment_terms,
          client_accepted_at,
          payment_due_date,
          status,
          negotiation_status,
          created_at,
          updated_at,
          preferred_producer_id
        `)
        .eq('payment_status', 'pending')
        .eq('negotiation_status', 'accepted');

      // Filter by producer if specified
      if (producerId) {
        pendingCustomSyncQuery = pendingCustomSyncQuery.eq('preferred_producer_id', producerId);
      }

      const { data: pendingCustomSyncData, error: pendingCustomSyncError } = await pendingCustomSyncQuery;

      if (pendingCustomSyncError) throw pendingCustomSyncError;

      // Process pending payments
      const pendingPaymentsList: PendingPayment[] = [];

      // Add pending sync proposals
      pendingSyncProposalsData?.forEach(proposal => {
        const amount = proposal.final_amount || proposal.negotiated_amount || proposal.sync_fee;
        const paymentTerms = proposal.final_payment_terms || proposal.negotiated_payment_terms || proposal.payment_terms;
        const acceptedDate = proposal.client_accepted_at || proposal.updated_at || proposal.created_at;
        
        // Calculate expected payment date based on payment terms
        let expectedDate: string | undefined;
        if (acceptedDate && paymentTerms) {
          const accepted = new Date(acceptedDate);
          switch (paymentTerms) {
            case 'net30':
              accepted.setDate(accepted.getDate() + 30);
              expectedDate = accepted.toISOString();
              break;
            case 'net60':
              accepted.setDate(accepted.getDate() + 60);
              expectedDate = accepted.toISOString();
              break;
            case 'net90':
              accepted.setDate(accepted.getDate() + 90);
              expectedDate = accepted.toISOString();
              break;
            case 'immediate':
            default:
              expectedDate = accepted.toISOString();
              break;
          }
        }

        pendingPaymentsList.push({
          id: proposal.id,
          source: 'Sync Proposal',
          amount: amount,
          expectedDate: expectedDate,
          status: 'Payment Pending',
          description: `"${proposal.track?.[0]?.title || 'Untitled Track'}" - ${paymentTerms || 'immediate'} payment`
        });
      });

      // Add pending custom sync requests
      pendingCustomSyncData?.forEach(request => {
        const amount = request.final_amount || request.sync_fee;
        const paymentTerms = request.final_payment_terms || request.payment_terms;
        const acceptedDate = request.client_accepted_at || request.updated_at || request.created_at;
        
        // Calculate expected payment date based on payment terms
        let expectedDate: string | undefined;
        if (acceptedDate && paymentTerms) {
          const accepted = new Date(acceptedDate);
          switch (paymentTerms) {
            case 'net30':
              accepted.setDate(accepted.getDate() + 30);
              expectedDate = accepted.toISOString();
              break;
            case 'net60':
              accepted.setDate(accepted.getDate() + 60);
              expectedDate = accepted.toISOString();
              break;
            case 'net90':
              accepted.setDate(accepted.getDate() + 90);
              expectedDate = accepted.toISOString();
              break;
            case 'immediate':
            default:
              expectedDate = accepted.toISOString();
              break;
          }
        }

        pendingPaymentsList.push({
          id: request.id,
          source: 'Custom Sync Request',
          amount: amount,
          expectedDate: expectedDate,
          status: 'Payment Pending',
          description: `Custom sync project - ${paymentTerms || 'immediate'} payment`
        });
      });

      // Calculate total pending revenue
      const totalPending = pendingPaymentsList.reduce((sum, payment) => sum + payment.amount, 0);

      // Debug logging for pending payments
      console.log('=== PENDING PAYMENTS DEBUG ===');
      console.log('Total pending payments count:', pendingPaymentsList.length);
      console.log('Total pending revenue:', totalPending);
      console.log('Pending payments list:', pendingPaymentsList);
      console.log('=== END PENDING PAYMENTS DEBUG ===');

      // Process sales by license type
      const salesByLicenseType = salesData?.reduce((acc, sale) => {
        const licenseType = sale.license_type || 'Unknown';
        if (!acc[licenseType]) {
          acc[licenseType] = {
            count: 0,
            amount: 0
          };
        }
        acc[licenseType].count += 1;
        acc[licenseType].amount += sale.amount || 0;
        return acc;
      }, {} as Record<string, { count: number; amount: number }>) || {};

      // Process sync proposals
      const syncProposalsRevenue = {
        count: syncProposalsData?.length || 0,
        amount: syncProposalsData?.reduce((sum, proposal) => sum + (proposal.final_amount || proposal.negotiated_amount || proposal.sync_fee || 0), 0) || 0
      };

      // Process custom sync requests
      const customSyncRevenue = {
        count: customSyncData?.length || 0,
        amount: customSyncData?.reduce((sum, request) => sum + (request.final_amount || request.sync_fee || 0), 0) || 0
      };

      // Process white label setup fees
      const whiteLabelSetupRevenue = {
        count: whiteLabelSetupData?.length || 0,
        amount: whiteLabelSetupData?.reduce((sum, setup) => sum + (setup.setup_fee || 0), 0) || 0
      };

      // Process white label monthly payments
      const whiteLabelMonthlyRevenue = {
        count: (paidMonthly.length + pendingMonthly.length),
        amount: (paidMonthly.reduce((sum, p) => sum + (p.amount || 0), 0) + pendingMonthly.reduce((sum, p) => sum + (p.amount || 0), 0))
      };

      // Combine all revenue sources
      const completedSources = [
        ...Object.entries(salesByLicenseType).map(([source, data]) => ({
          source: `${source} License`,
          amount: (data as { count: number; amount: number }).amount,
          count: (data as { count: number; amount: number }).count,
          type: 'completed' as const,
          percentage: 0 // Will be calculated later
        }))
      ];

      if (syncProposalsRevenue.count > 0) {
        completedSources.push({
          source: 'Sync Proposals',
          amount: syncProposalsRevenue.amount,
          count: syncProposalsRevenue.count,
          type: 'completed',
          percentage: 0 // Will be calculated later
        });
      }

      if (customSyncRevenue.count > 0) {
        completedSources.push({
          source: 'Custom Sync Requests',
          amount: customSyncRevenue.amount,
          count: customSyncRevenue.count,
          type: 'completed',
          percentage: 0 // Will be calculated later
        });
      }

      if (whiteLabelSetupRevenue.count > 0) {
        completedSources.push({
          source: 'White Label Setup',
          amount: whiteLabelSetupRevenue.amount,
          count: whiteLabelSetupRevenue.count,
          type: 'completed',
          percentage: 0 // Will be calculated later
        });
      }

      if (whiteLabelMonthlyRevenue.count > 0) {
        completedSources.push({
          source: 'White Label Monthly',
          amount: whiteLabelMonthlyRevenue.amount,
          count: whiteLabelMonthlyRevenue.count,
          type: 'completed',
          percentage: 0 // Will be calculated later
        });
      }

      // Create pending sources
      const pendingSources: RevenueSource[] = [];
      if (pendingPaymentsList.length > 0) {
        // Group pending payments by source
        const pendingBySource = pendingPaymentsList.reduce((acc, payment) => {
          if (!acc[payment.source]) {
            acc[payment.source] = { count: 0, amount: 0 };
          }
          acc[payment.source].count += 1;
          acc[payment.source].amount += payment.amount;
          return acc;
        }, {} as Record<string, { count: number; amount: number }>);

        // Add pending sources
        Object.entries(pendingBySource).forEach(([source, data]) => {
          pendingSources.push({
            source: `Pending ${source}`,
            amount: data.amount,
            count: data.count,
            type: 'pending',
            percentage: 0 // Will be calculated later
          });
        });
      }

      // Combine all sources
      const allSources = [...completedSources, ...pendingSources];

      // Calculate total revenue (including pending)
      const total = allSources.reduce((sum, source) => sum + source.amount, 0);

      // Calculate percentages
      const sourcesWithPercentage = allSources.map(source => ({
        ...source,
        percentage: total > 0 ? (source.amount / total) * 100 : 0
      }));

      // Sort by amount descending
      const sortedSources = sourcesWithPercentage.sort((a, b) => b.amount - a.amount);

      // Calculate monthly revenue
      const months: Record<string, number> = {};
      
      // Initialize months with proper date handling
      const monthCount = timeframe === 'month' ? 1 : 
                         timeframe === 'quarter' ? 3 : 
                         timeframe === 'year' ? 12 : 24;
      
      // Create a more robust month key generation
      for (let i = 0; i < monthCount; i++) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        // Use a more consistent month key format
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const displayMonth = date.toLocaleString('default', { month: 'short', year: 'numeric' });
        months[monthKey] = 0;
        // Store display name for later use
        (months as any)[`${monthKey}_display`] = displayMonth;
      }
      
      // Debug logging
      console.log('=== MONTHLY REVENUE DEBUG ===');
      console.log('Timeframe:', timeframe);
      console.log('Month count:', monthCount);
      console.log('Initialized months:', months);
      console.log('Sales data count:', salesData?.length || 0);
      console.log('Sync proposals count:', syncProposalsData?.length || 0);
      console.log('Custom sync count:', customSyncData?.length || 0);
      console.log('White Label Setup count:', whiteLabelSetupData?.length || 0);
      console.log('White Label Monthly (paid) count:', paidMonthly.length);
      console.log('White Label Monthly (pending) count:', pendingMonthly.length);
      
      // Helper function to get month key
      const getMonthKey = (date: Date) => {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      };
      
      // Add track sales to months
      salesData?.forEach(sale => {
        const date = new Date(sale.created_at);
        const monthKey = getMonthKey(date);
        console.log(`Sale: ${date.toISOString()} -> ${monthKey}, amount: ${sale.amount}`);
        if (months[monthKey] !== undefined) {
          months[monthKey] += sale.amount || 0;
        }
      });
      
      // Add sync proposals to months
      syncProposalsData?.forEach(proposal => {
        const date = new Date(proposal.created_at);
        const monthKey = getMonthKey(date);
        console.log(`Sync proposal: ${date.toISOString()} -> ${monthKey}, amount: ${proposal.final_amount || proposal.negotiated_amount || proposal.sync_fee}`);
        if (months[monthKey] !== undefined) {
          months[monthKey] += (proposal.final_amount || proposal.negotiated_amount || proposal.sync_fee) || 0;
        }
      });
      
      // Add custom sync requests to months
      customSyncData?.forEach(req => {
        const date = new Date(req.created_at);
        const monthKey = getMonthKey(date);
        console.log(`Custom sync: ${date.toISOString()} -> ${monthKey}, amount: ${req.final_amount || req.sync_fee}`);
        if (months[monthKey] !== undefined) {
          months[monthKey] += (req.final_amount || req.sync_fee) || 0;
        }
      });

      // Add white label setup fees to months
      whiteLabelSetupData?.forEach(setup => {
        const date = new Date(setup.created_at);
        const monthKey = getMonthKey(date);
        console.log(`White Label Setup: ${date.toISOString()} -> ${monthKey}, amount: ${setup.setup_fee}`);
        if (months[monthKey] !== undefined) {
          months[monthKey] += (setup.setup_fee || 0);
        }
      });

      // Add white label monthly payments to months
      paidMonthly.forEach(payment => {
        const date = new Date(payment.paid_date || payment.due_date);
        const monthKey = getMonthKey(date);
        console.log(`White Label Monthly (Paid): ${date.toISOString()} -> ${monthKey}, amount: ${payment.amount}`);
        if (months[monthKey] !== undefined) {
          months[monthKey] += (payment.amount || 0);
        }
      });

      pendingMonthly.forEach(payment => {
        const date = new Date(payment.due_date);
        const monthKey = getMonthKey(date);
        console.log(`White Label Monthly (Pending): ${date.toISOString()} -> ${monthKey}, amount: ${payment.amount}`);
        if (months[monthKey] !== undefined) {
          months[monthKey] += (payment.amount || 0);
        }
      });
      
      // Add pending payments to months (use expected payment date or acceptance date)
      pendingPaymentsList.forEach(payment => {
        let date: Date;
        if (payment.expectedDate) {
          date = new Date(payment.expectedDate);
        } else {
          // If no expected date, use current date for immediate payments
          date = new Date();
        }
        const monthKey = getMonthKey(date);
        console.log(`Pending payment: ${date.toISOString()} -> ${monthKey}, amount: ${payment.amount}`);
        if (months[monthKey] !== undefined) {
          months[monthKey] += payment.amount || 0;
        }
      });
      
      console.log('Final months data:', months);
      
      // Convert to array and sort by date, using display names
      const monthlyData = Object.entries(months)
        .filter(([key]) => !key.endsWith('_display')) // Exclude display name entries
        .map(([monthKey, amount]) => ({ 
          month: (months as any)[`${monthKey}_display`] || monthKey, 
          amount 
        }))
        .sort((a, b) => {
          // Parse the month key for sorting
          const [yearA, monthA] = a.month.includes('-') ? a.month.split('-') : [a.month, '1'];
          const [yearB, monthB] = b.month.includes('-') ? b.month.split('-') : [b.month, '1'];
          const dateA = new Date(parseInt(yearA), parseInt(monthA) - 1);
          const dateB = new Date(parseInt(yearB), parseInt(monthB) - 1);
          return dateA.getTime() - dateB.getTime();
        });
      
      console.log('Monthly data array:', monthlyData);
      console.log('=== END MONTHLY REVENUE DEBUG ===');

      // Pad monthlyData to always show the last 6 or 12 months, even if some are zero
      const padMonths = (data: { month: string; amount: number }[], monthsToShow: number): { month: string; amount: number }[] => {
        const now = new Date();
        const padded: { month: string; amount: number }[] = [];
        for (let i = monthsToShow - 1; i >= 0; i--) {
          const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          const display = date.toLocaleString('default', { month: 'short', year: 'numeric' });
          const found = data.find((m: { month: string; amount: number }) => m.month === display || m.month === key);
          padded.push({ month: display, amount: found ? found.amount : 0 });
        }
        return padded;
      };
      let monthsToShow = 6;
      if (timeframe === 'year' || timeframe === 'all') monthsToShow = 12;
      const paddedMonthlyData = padMonths(monthlyData, monthsToShow);
      setRevenueSources(sortedSources);
      setMonthlyRevenue(paddedMonthlyData);
      setTotalRevenue(total);
      setPendingPayments(pendingPaymentsList);
      setTotalPendingRevenue(totalPending);
    } catch (err) {
      console.error('Error fetching revenue breakdown:', err);
      setError('Failed to load revenue data');
    } finally {
      setLoading(false);
    }
  };

  // Helper to load a background image as base64
  const getBase64ImageFromURL = (url: string) =>
    new Promise<string>((resolve, reject) => {
      const img = new window.Image();
      img.setAttribute('crossOrigin', 'anonymous');
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        } else {
          reject(new Error('Could not get canvas context'));
        }
      };
      img.onerror = (error) => reject(error);
      img.src = url;
    });

  const generatePDF = async () => {
    try {
      setPdfGenerating(true);
      const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      // === Page 1: Cover ONLY ===
      const backgroundPath = selectedCover || defaultCover || '/report-backgrounds/option-mybeatfi.png';
      try {
        const bgBase64 = await getBase64ImageFromURL(backgroundPath);
        doc.addImage(bgBase64, 'PNG', 0, 0, pageWidth, pageHeight);
      } catch (err) {
        console.warn('Failed to load report background:', err);
      }
      doc.addPage();
      // === Page 2: Data (no background) ===
      // Header (no blue fill, just text)
      let y = 60;
      if (logoUrl) {
        const img = await fetch(logoUrl).then(r => r.blob());
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(img);
        });
        doc.addImage(base64, 'PNG', 40, y, 60, 60, undefined, 'FAST');
      }
      let titleFontSize = 32;
      let title = 'Monthly Revenue Report';
      let titleX = 120;
      let maxTitleWidth = pageWidth - 180;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(titleFontSize);
      while (doc.getTextWidth(title) > maxTitleWidth && titleFontSize > 16) {
        titleFontSize -= 2;
        doc.setFontSize(titleFontSize);
      }
      doc.setTextColor(30, 30, 30); // dark text
      doc.text(title, titleX, y + 30, { maxWidth: maxTitleWidth });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(16);
      doc.setTextColor(80, 80, 80);
      const subtitle = 'This report provides an in-depth analysis of revenue performance.';
      const subtitleLines = doc.splitTextToSize(subtitle, maxTitleWidth);
      doc.text(subtitleLines, titleX, y + 60);
      y += 110;
      // Revenue by Source Table
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(30, 30, 30);
      doc.text('Revenue by Source', 50, y + 20);
      const sourceTableData = revenueSources.map(source => [
        source.source,
        `$${source.amount.toFixed(2)}`,
        source.count.toString(),
        `${source.percentage.toFixed(1)}%`,
        source.type === 'pending' ? 'Pending' : 'Completed'
      ]);
      (doc as any).autoTable({
        startY: y + 30,
        head: [['Source', 'Amount', 'Count', 'Percentage', 'Status']],
        body: sourceTableData,
        theme: 'grid',
        headStyles: { fillColor: [229, 231, 235], textColor: [30, 30, 30], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        styles: { textColor: [30, 30, 30], font: 'helvetica', fontSize: 11 },
        margin: { left: 40, right: 40 }
      });
      y = (doc as any).lastAutoTable.finalY + 40; // Add extra space after table
      // Monthly Revenue Table
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16); // Match previous section
      doc.setTextColor(30, 30, 30);
      doc.text('Monthly Revenue', 50, y);
      const monthlyTableData = monthlyRevenue.map(item => [
        item.month,
        `$${item.amount.toFixed(2)}`
      ]);
      (doc as any).autoTable({
        startY: y + 10,
        head: [['Month', 'Revenue']],
        body: monthlyTableData,
        theme: 'grid',
        headStyles: { fillColor: [229, 231, 235], textColor: [30, 30, 30], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        styles: { textColor: [30, 30, 30], font: 'helvetica', fontSize: 11 },
        margin: { left: 40, right: 40 }
      });
      y = (doc as any).lastAutoTable.finalY + 30;
      // Total Revenue (moved below tables)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.setTextColor(30, 30, 30);
      doc.text(`Total Revenue: $${totalRevenue.toFixed(2)}`, 50, y);
      y += 30;
      if (totalPendingRevenue > 0) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(14);
        doc.setTextColor(200, 120, 0);
        doc.text(`Pending Revenue: $${totalPendingRevenue.toFixed(2)}`, 50, y);
        y += 25;
      }
      // Footer with Brand Info
      const footerY = doc.internal.pageSize.getHeight() - 80;
      doc.setDrawColor(90, 90, 180);
      doc.setLineWidth(1);
      doc.line(40, footerY, pageWidth - 40, footerY);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(80, 80, 80);
      doc.text(companyName || '', 50, footerY + 25);
      // Add generated date at the very bottom left
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(120, 120, 120);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 50, pageHeight - 20);
      doc.save('revenue-report.pdf');
    } catch (err) {
      console.error('Error generating PDF:', err);
      setError('Failed to generate PDF report');
    } finally {
      setPdfGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-blue-900/90 backdrop-blur-md rounded-xl border border-purple-500/20 w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="p-6 border-b border-purple-500/20 flex-shrink-0">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <DollarSign className="w-6 h-6 text-green-500 mr-2" />
              <h2 className="text-2xl font-bold text-white">Revenue Breakdown</h2>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex space-x-2">
                {(['month', 'quarter', 'year', 'all'] as const).map((period) => (
                  <button
                    key={period}
                    onClick={() => setTimeframe(period)}
                    className={`px-3 py-1 rounded-lg transition-colors ${
                      timeframe === period
                        ? 'bg-purple-600 text-white'
                        : 'bg-white/5 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    {period === 'month' ? 'Month' : 
                     period === 'quarter' ? 'Quarter' : 
                     period === 'year' ? 'Year' : 'All Time'}
                  </button>
                ))}
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-400 text-center">{error}</p>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
            </div>
          ) : (
            <div className="space-y-8">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold text-white">Total Revenue</h3>
              <button
                onClick={generatePDF}
                disabled={pdfGenerating}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center"
              >
                {pdfGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5 mr-2" />
                    Download Report
                  </>
                )}
              </button>
            </div>
            
            <div className="bg-white/5 rounded-lg p-6 border border-purple-500/20">
              <p className="text-3xl font-bold text-white">${totalRevenue.toFixed(2)}</p>
              <p className="text-gray-400 mt-1">
                {timeframe === 'month' ? 'Last 30 days' : 
                 timeframe === 'quarter' ? 'Last 3 months' : 
                 timeframe === 'year' ? 'Last 12 months' : 'All time'}
              </p>
            </div>

            {totalPendingRevenue > 0 && (
              <div className="bg-white/5 rounded-lg p-6 border border-yellow-500/20">
                <p className="text-2xl font-bold text-yellow-400">${totalPendingRevenue.toFixed(2)}</p>
                <p className="text-gray-400 mt-1">Pending Revenue</p>
                <p className="text-xs text-yellow-400 mt-2">
                  {pendingPayments.length} payment{pendingPayments.length !== 1 ? 's' : ''} awaiting completion
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Revenue by Source */}
              <div className="bg-white/5 rounded-lg p-6 border border-purple-500/20">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <PieChart className="w-5 h-5 mr-2 text-blue-400" />
                  Revenue by Source
                </h3>
                
                <div className="space-y-4">
                  {revenueSources.length === 0 ? (
                    <p className="text-gray-400 text-center py-4">No revenue data available</p>
                  ) : (
                    revenueSources.map((source, index) => (
                      <div key={index}>
                        <div className="flex justify-between items-center mb-1">
                          <div className="flex items-center">
                            <span className={`${source.type === 'pending' ? 'text-yellow-400' : 'text-white'}`}>
                              {source.source}
                            </span>
                            <span className="text-gray-400 text-sm ml-2">({source.count} {source.count === 1 ? 'sale' : 'sales'})</span>
                            {source.type === 'pending' && (
                              <span className="text-yellow-400 text-xs ml-2">(Pending)</span>
                            )}
                          </div>
                          <span className={`${source.type === 'pending' ? 'text-yellow-400' : 'text-white'} font-semibold`}>
                            ${source.amount.toFixed(2)}
                          </span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div 
                            className={`${source.type === 'pending' ? 'bg-yellow-500' : 'bg-blue-600'} h-2 rounded-full`}
                            style={{ width: `${source.percentage}%` }}
                          ></div>
                        </div>
                        <p className="text-right text-xs text-gray-400 mt-1">{source.percentage.toFixed(1)}%</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Monthly Revenue Trend */}
              <div className="bg-white/5 rounded-lg p-6 border border-purple-500/20">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <Calendar className="w-5 h-5 mr-2 text-blue-400" />
                  Monthly Revenue Trend
                </h3>
                
                <div className="h-64 relative">
                  {monthlyRevenue.length === 0 || monthlyRevenue.every(item => item.amount === 0) ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <Calendar className="w-12 h-12 text-gray-500 mb-2" />
                      <p className="text-gray-400">No revenue data for this period</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Try selecting a different timeframe or check if you have any completed sales
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="flex h-full items-end space-x-1">
                        {monthlyRevenue.map((item, index) => {
                          const maxRevenue = Math.max(...monthlyRevenue.map(m => m.amount));
                          const height = maxRevenue > 0 ? (item.amount / maxRevenue) * 100 : 0;
                          
                          return (
                            <div key={index} className="flex-1 flex flex-col items-center">
                              <div 
                                className="w-full bg-blue-600 rounded-t-sm hover:bg-blue-500 transition-colors"
                                style={{ height: `${height}%` }}
                                title={`${item.month}: $${item.amount.toFixed(2)}`}
                              ></div>
                            </div>
                          );
                        })}
                      </div>
                      
                      <div className="flex justify-between mt-2">
                        {monthlyRevenue.map((item, index) => (
                          <div key={index} className="text-xs text-gray-400 transform -rotate-45 origin-top-left">
                            {item.month}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Pending Payments Table */}
            {pendingPayments.length > 0 && (
              <div className="bg-white/5 rounded-lg p-6 border border-yellow-500/20">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <Clock className="w-5 h-5 mr-2 text-yellow-400" />
                  Pending Payments
                </h3>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="px-4 py-2 text-left text-gray-400">Source</th>
                        <th className="px-4 py-2 text-left text-gray-400">Description</th>
                        <th className="px-4 py-2 text-right text-gray-400">Amount</th>
                        <th className="px-4 py-2 text-right text-gray-400">Expected Date</th>
                        <th className="px-4 py-2 text-center text-gray-400">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingPayments.map((payment, index) => (
                        <tr key={index} className="border-b border-gray-800">
                          <td className="px-4 py-3 text-white">{payment.source}</td>
                          <td className="px-4 py-3 text-gray-300">{payment.description}</td>
                          <td className="px-4 py-3 text-right text-yellow-400 font-medium">${payment.amount.toFixed(2)}</td>
                          <td className="px-4 py-3 text-right text-gray-300">
                            {payment.expectedDate ? new Date(payment.expectedDate).toLocaleDateString() : 'Immediate'}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs">
                              {payment.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-white/5">
                        <td className="px-4 py-3 text-white font-semibold" colSpan={2}>Total Pending</td>
                        <td className="px-4 py-3 text-right text-yellow-400 font-semibold">${totalPendingRevenue.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right text-gray-300" colSpan={2}></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Detailed Revenue Table */}
            <div className="bg-white/5 rounded-lg p-6 border border-purple-500/20">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-blue-400" />
                Detailed Revenue Breakdown
              </h3>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="px-4 py-2 text-left text-gray-400">Revenue Source</th>
                      <th className="px-4 py-2 text-right text-gray-400">Count</th>
                      <th className="px-4 py-2 text-right text-gray-400">Amount</th>
                      <th className="px-4 py-2 text-right text-gray-400">Percentage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {revenueSources.map((source, index) => (
                      <tr key={index} className="border-b border-gray-800">
                        <td className={`px-4 py-3 ${source.type === 'pending' ? 'text-yellow-400' : 'text-white'}`}>
                          {source.source}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-300">{source.count}</td>
                        <td className={`px-4 py-3 text-right font-medium ${source.type === 'pending' ? 'text-yellow-400' : 'text-white'}`}>
                          ${source.amount.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-300">{source.percentage.toFixed(1)}%</td>
                      </tr>
                    ))}
                    <tr className="bg-white/5">
                      <td className="px-4 py-3 text-white font-semibold">Total</td>
                      <td className="px-4 py-3 text-right text-gray-300">
                        {revenueSources.reduce((sum, source) => sum + source.count, 0)}
                      </td>
                      <td className="px-4 py-3 text-right text-white font-semibold">${totalRevenue.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right text-gray-300">100%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <ReportBackgroundPicker selected={selectedCover} onChange={setSelectedCover} />
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
