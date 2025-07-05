import React, { useState, useEffect } from 'react';
import { X, DollarSign, Download, PieChart, Calendar, FileText, Loader2, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

interface RevenueBreakdownDialogProps {
  isOpen: boolean;
  onClose: () => void;
  producerId?: string; // Optional - if provided, shows only this producer's revenue
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
  producerId
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

      // Fetch pending sync proposals
      let pendingSyncProposalsQuery = supabase
        .from('sync_proposals')
        .select(`
          id,
          sync_fee,
          final_amount,
          payment_terms,
          final_payment_terms,
          client_accepted_at,
          payment_due_date,
          status,
          client_status,
          producer_status,
          created_at,
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
        const amount = proposal.final_amount || proposal.sync_fee;
        const paymentTerms = proposal.final_payment_terms || proposal.payment_terms;
        const acceptedDate = proposal.client_accepted_at || proposal.created_at;
        
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
          description: `"${proposal.track?.title}" - ${paymentTerms || 'immediate'} payment`
        });
      });

      // Add pending custom sync requests
      pendingCustomSyncData?.forEach(request => {
        const amount = request.final_amount || request.sync_fee;
        const paymentTerms = request.final_payment_terms || request.payment_terms;
        const acceptedDate = request.client_accepted_at || request.created_at;
        
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
        amount: syncProposalsData?.reduce((sum, proposal) => sum + (proposal.sync_fee || 0), 0) || 0
      };

      // Process custom sync requests
      const customSyncRevenue = {
        count: customSyncData?.length || 0,
        amount: customSyncData?.reduce((sum, request) => sum + (request.sync_fee || 0), 0) || 0
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
      
      // Initialize months
      const monthCount = timeframe === 'month' ? 1 : 
                         timeframe === 'quarter' ? 3 : 
                         timeframe === 'year' ? 12 : 24;
      
      for (let i = 0; i < monthCount; i++) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthKey = date.toLocaleString('default', { month: 'short', year: 'numeric' });
        months[monthKey] = 0;
      }
      
      // Add track sales to months
      salesData?.forEach(sale => {
        const date = new Date(sale.created_at);
        const monthKey = date.toLocaleString('default', { month: 'short', year: 'numeric' });
        if (months[monthKey] !== undefined) {
          months[monthKey] += sale.amount || 0;
        }
      });
      
      // Add sync proposals to months
      syncProposalsData?.forEach(proposal => {
        const date = new Date(proposal.created_at);
        const monthKey = date.toLocaleString('default', { month: 'short', year: 'numeric' });
        if (months[monthKey] !== undefined) {
          months[monthKey] += proposal.sync_fee || 0;
        }
      });
      
      // Add custom sync requests to months
      customSyncData?.forEach(req => {
        const date = new Date(req.created_at);
        const monthKey = date.toLocaleString('default', { month: 'short', year: 'numeric' });
        if (months[monthKey] !== undefined) {
          months[monthKey] += req.sync_fee || 0;
        }
      });
      
      // Convert to array and sort by date
      const monthlyData = Object.entries(months)
        .map(([month, amount]) => ({ month, amount }))
        .sort((a, b) => {
          const dateA = new Date(a.month);
          const dateB = new Date(b.month);
          return dateA.getTime() - dateB.getTime();
        });

      setRevenueSources(sortedSources);
      setMonthlyRevenue(monthlyData);
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

  const generatePDF = async () => {
    try {
      setPdfGenerating(true);
      
      // Create a new PDF document
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(20);
      doc.setTextColor(40, 40, 40);
      doc.text('Revenue Report', 105, 15, { align: 'center' });
      
      // Add date range
      doc.setFontSize(12);
      doc.setTextColor(80, 80, 80);
      
      let dateRangeText = '';
      if (timeframe === 'month') {
        dateRangeText = 'Last 30 Days';
      } else if (timeframe === 'quarter') {
        dateRangeText = 'Last 3 Months';
      } else if (timeframe === 'year') {
        dateRangeText = 'Last 12 Months';
      } else {
        dateRangeText = 'All Time';
      }
      
      doc.text(`Time Period: ${dateRangeText}`, 105, 25, { align: 'center' });
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 105, 30, { align: 'center' });
      
      // Add total revenue
      doc.setFontSize(16);
      doc.setTextColor(40, 40, 40);
      doc.text(`Total Revenue: $${totalRevenue.toFixed(2)}`, 105, 40, { align: 'center' });
      
      // Add pending revenue if any
      if (totalPendingRevenue > 0) {
        doc.setFontSize(14);
        doc.setTextColor(255, 140, 0); // Orange color for pending
        doc.text(`Pending Revenue: $${totalPendingRevenue.toFixed(2)}`, 105, 50, { align: 'center' });
      }
      
      // Add revenue sources table
      doc.setFontSize(14);
      doc.text('Revenue by Source', 14, 50);
      
      const sourceTableData = revenueSources.map(source => [
        source.source,
        `$${source.amount.toFixed(2)}`,
        source.count.toString(),
        `${source.percentage.toFixed(1)}%`,
        source.type === 'pending' ? 'Pending' : 'Completed'
      ]);
      
      (doc as any).autoTable({
        startY: 55,
        head: [['Source', 'Amount', 'Count', 'Percentage', 'Status']],
        body: sourceTableData,
        theme: 'grid',
        headStyles: { fillColor: [75, 75, 200], textColor: 255 },
        alternateRowStyles: { fillColor: [240, 240, 255] }
      });
      
      // Add monthly revenue table
      const tableEndY = (doc as any).lastAutoTable.finalY + 10;
      doc.setFontSize(14);
      doc.text('Monthly Revenue', 14, tableEndY);
      
      const monthlyTableData = monthlyRevenue.map(item => [
        item.month,
        `$${item.amount.toFixed(2)}`
      ]);
      
      (doc as any).autoTable({
        startY: tableEndY + 5,
        head: [['Month', 'Revenue']],
        body: monthlyTableData,
        theme: 'grid',
        headStyles: { fillColor: [75, 75, 200], textColor: 255 },
        alternateRowStyles: { fillColor: [240, 240, 255] }
      });
      
      // Save the PDF
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
                  {monthlyRevenue.length === 0 ? (
                    <p className="text-gray-400 text-center py-4">No monthly data available</p>
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
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
