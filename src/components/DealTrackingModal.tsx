import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useUnifiedAuth } from '../contexts/UnifiedAuthContext';
import { X, DollarSign, Calendar, FileText, Bell, CheckCircle, Clock, AlertTriangle, User, Mail } from 'lucide-react';

interface Deal {
  id: string;
  opportunity_id: string;
  track_id: string;
  submission_id: string;
  client_name: string;
  track_title: string;
  producer_name: string;
  deal_status: string;
  deal_value: number;
  deal_currency: string;
  negotiation_notes: string;
  expected_close_date: string;
  actual_close_date: string;
  commission_rate: number;
  commission_amount: number;
  created_at: string;
  updated_at: string;
}

interface DealTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  submissionId: string;
  trackTitle: string;
  producerName: string;
  clientName: string;
  onDealUpdated: () => void;
}

export function DealTrackingModal({
  isOpen,
  onClose,
  submissionId,
  trackTitle,
  producerName,
  clientName,
  onDealUpdated
}: DealTrackingModalProps) {
  const { user } = useUnifiedAuth();
  const [deal, setDeal] = useState<Deal | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);

  // Form state
  const [dealStatus, setDealStatus] = useState('negotiating');
  const [dealValue, setDealValue] = useState('');
  const [dealCurrency, setDealCurrency] = useState('USD');
  const [negotiationNotes, setNegotiationNotes] = useState('');
  const [expectedCloseDate, setExpectedCloseDate] = useState('');
  const [actualCloseDate, setActualCloseDate] = useState('');
  const [commissionRate, setCommissionRate] = useState('15');

  useEffect(() => {
    if (isOpen && submissionId) {
      fetchDeal();
    }
  }, [isOpen, submissionId]);

  const fetchDeal = async () => {
    try {
      setLoading(true);

      // Check if deal already exists
      const { data: existingDeal, error } = await supabase
        .from('pitch_deals')
        .select('*')
        .eq('submission_id', submissionId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error fetching deal:', error);
        return;
      }

      if (existingDeal) {
        setDeal(existingDeal);
        setDealStatus(existingDeal.deal_status);
        setDealValue(existingDeal.deal_value?.toString() || '');
        setDealCurrency(existingDeal.deal_currency || 'USD');
        setNegotiationNotes(existingDeal.negotiation_notes || '');
        setExpectedCloseDate(existingDeal.expected_close_date || '');
        setActualCloseDate(existingDeal.actual_close_date || '');
        setCommissionRate(existingDeal.commission_rate?.toString() || '15');
      }
    } catch (error) {
      console.error('Error fetching deal:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDeal = async () => {
    if (!dealValue || !dealStatus) {
      alert('Please provide deal value and status.');
      return;
    }

    try {
      setSaving(true);

      const dealData = {
        submission_id: submissionId,
        track_title: trackTitle,
        producer_name: producerName,
        client_name: clientName,
        deal_status: dealStatus,
        deal_value: parseFloat(dealValue),
        deal_currency: dealCurrency,
        negotiation_notes: negotiationNotes,
        expected_close_date: expectedCloseDate || null,
        actual_close_date: actualCloseDate || null,
        commission_rate: parseFloat(commissionRate),
        commission_amount: parseFloat(dealValue) * (parseFloat(commissionRate) / 100),
        updated_at: new Date().toISOString()
      };

      if (deal) {
        // Update existing deal
        const { error } = await supabase
          .from('pitch_deals')
          .update(dealData)
          .eq('id', deal.id);

        if (error) {
          console.error('Error updating deal:', error);
          alert('Error updating deal. Please try again.');
          return;
        }
      } else {
        // Create new deal
        const { error } = await supabase
          .from('pitch_deals')
          .insert(dealData);

        if (error) {
          console.error('Error creating deal:', error);
          alert('Error creating deal. Please try again.');
          return;
        }
      }

      // Log deal activity
      await supabase
        .from('pitch_analytics')
        .insert({
          user_id: null, // Admin action
          opportunity_id: null,
          track_id: null,
          metric_type: 'deal_updated',
          metric_value: parseFloat(dealValue),
          metric_details: {
            submission_id,
            deal_status: dealStatus,
            commission_rate: parseFloat(commissionRate),
            commission_amount: parseFloat(dealValue) * (parseFloat(commissionRate) / 100)
          }
        });

      onDealUpdated();
      onClose();
    } catch (error) {
      console.error('Error saving deal:', error);
      alert('Error saving deal. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleNotifyStakeholders = async () => {
    if (!deal) return;

    try {
      // Send notification to producer
      await supabase.functions.invoke('send-deal-notification', {
        body: {
          type: 'deal_update',
          deal_id: deal.id,
          track_title: trackTitle,
          producer_name: producerName,
          deal_status: dealStatus,
          deal_value: dealValue,
          deal_currency: dealCurrency,
          commission_amount: parseFloat(dealValue) * (parseFloat(commissionRate) / 100),
          notes: negotiationNotes
        }
      });

      setShowNotificationModal(false);
      alert('Notifications sent to stakeholders successfully!');
    } catch (error) {
      console.error('Error sending notifications:', error);
      alert('Error sending notifications. Please try again.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'negotiating': return 'text-yellow-600 bg-yellow-100';
      case 'pending_approval': return 'text-blue-600 bg-blue-100';
      case 'approved': return 'text-green-600 bg-green-100';
      case 'closed': return 'text-purple-600 bg-purple-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'negotiating': return <Clock className="w-4 h-4" />;
      case 'pending_approval': return <AlertTriangle className="w-4 h-4" />;
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      case 'closed': return <CheckCircle className="w-4 h-4" />;
      case 'cancelled': return <X className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Deal Tracking</h2>
            <p className="text-gray-600 mt-1">
              {trackTitle} • {producerName} • {clientName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Deal Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Deal Status
                </label>
                <select
                  value={dealStatus}
                  onChange={(e) => setDealStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="negotiating">Negotiating</option>
                  <option value="pending_approval">Pending Approval</option>
                  <option value="approved">Approved</option>
                  <option value="closed">Closed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {/* Deal Value */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Deal Value
                  </label>
                  <input
                    type="number"
                    value={dealValue}
                    onChange={(e) => setDealValue(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Currency
                  </label>
                  <select
                    value={dealCurrency}
                    onChange={(e) => setDealCurrency(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="CAD">CAD</option>
                  </select>
                </div>
              </div>

              {/* Commission */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Commission Rate (%)
                  </label>
                  <input
                    type="number"
                    value={commissionRate}
                    onChange={(e) => setCommissionRate(e.target.value)}
                    placeholder="15"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Commission Amount
                  </label>
                  <div className="px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600">
                    {dealValue && commissionRate 
                      ? `${dealCurrency} ${(parseFloat(dealValue) * (parseFloat(commissionRate) / 100)).toFixed(2)}`
                      : 'Enter deal value and rate'
                    }
                  </div>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expected Close Date
                  </label>
                  <input
                    type="date"
                    value={expectedCloseDate}
                    onChange={(e) => setExpectedCloseDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Actual Close Date
                  </label>
                  <input
                    type="date"
                    value={actualCloseDate}
                    onChange={(e) => setActualCloseDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Negotiation Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Negotiation Notes
                </label>
                <textarea
                  value={negotiationNotes}
                  onChange={(e) => setNegotiationNotes(e.target.value)}
                  placeholder="Add notes about the negotiation process, client feedback, etc..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Current Status Display */}
              {deal && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Current Status</h3>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(deal.deal_status)}`}>
                      {getStatusIcon(deal.deal_status)}
                      <span className="ml-1">{deal.deal_status.replace('_', ' ')}</span>
                    </span>
                    {deal.deal_value && (
                      <span className="text-sm text-gray-600">
                        {deal.deal_currency} {deal.deal_value.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200">
          <button
            onClick={() => setShowNotificationModal(true)}
            className="flex items-center px-4 py-2 text-blue-600 hover:text-blue-800 transition-colors"
          >
            <Bell className="w-4 h-4 mr-2" />
            Notify Stakeholders
          </button>
          
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveDeal}
              disabled={saving || !dealValue || !dealStatus}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <DollarSign className="w-4 h-4 mr-2" />
                  Save Deal
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Notification Modal */}
      {showNotificationModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Notify Stakeholders
              </h3>
              <p className="text-gray-600 mb-6">
                Send notifications to the producer and relevant parties about the deal status update.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowNotificationModal(false)}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleNotifyStakeholders}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Send Notifications
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
