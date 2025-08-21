import React, { useState, useEffect } from 'react';
import { useRightsHolderAuth } from '../contexts/RightsHolderAuthContext';
import { supabase } from '../lib/supabase';
import { 
  Mail, 
  UserPlus, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Send, 
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  Download,
  FileText,
  Users,
  Calendar,
  Search,
  Filter,
  Plus,
  X,
  Save,
  Copy,
  Share2,
  ExternalLink,
  Phone,
  AtSign,
  Building2,
  Music
} from 'lucide-react';

interface CoSigner {
  id: string;
  split_sheet_id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  percentage: number;
  invitation_sent: boolean;
  invitation_sent_at?: string;
  invitation_expires_at?: string;
  signature_status: 'pending' | 'signed' | 'expired' | 'declined';
  signed_at?: string;
  signature_data?: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  updated_at: string;
}

interface SplitSheet {
  id: string;
  master_recording_id: string;
  rights_holder_id: string;
  status: 'pending_signatures' | 'completed' | 'expired';
  created_at: string;
  updated_at: string;
  master_recording: {
    title: string;
    artist: string;
    genre: string;
  };
  co_signers: CoSigner[];
}

interface InvitationFormData {
  name: string;
  email: string;
  phone: string;
  role: string;
  percentage: number;
}

export function RightsHolderESignatures() {
  const { rightsHolder } = useRightsHolderAuth();
  const [splitSheets, setSplitSheets] = useState<SplitSheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedSplitSheet, setSelectedSplitSheet] = useState<SplitSheet | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [invitationFormData, setInvitationFormData] = useState<InvitationFormData>({
    name: '',
    email: '',
    phone: '',
    role: '',
    percentage: 0
  });
  const [sendingInvitation, setSendingInvitation] = useState(false);
  const [editingCoSigner, setEditingCoSigner] = useState<CoSigner | null>(null);

  // Fetch split sheets on component mount
  useEffect(() => {
    if (rightsHolder) {
      fetchSplitSheets();
    }
  }, [rightsHolder]);

  const fetchSplitSheets = async () => {
    if (!rightsHolder) return;

    setLoading(true);
    setError(null);

    try {
      const { data: splitSheetsData, error: splitSheetsError } = await supabase
        .from('split_sheets')
        .select(`
          *,
          master_recordings (
            title,
            artist,
            genre
          ),
          co_signers (*)
        `)
        .eq('rights_holder_id', rightsHolder.id)
        .order('created_at', { ascending: false });

      if (splitSheetsError) throw splitSheetsError;

      setSplitSheets(splitSheetsData || []);
    } catch (err) {
      console.error('Error fetching split sheets:', err);
      setError('Failed to load split sheets');
    } finally {
      setLoading(false);
    }
  };

  const handleSendInvitation = async (splitSheetId: string) => {
    if (!invitationFormData.name || !invitationFormData.email || !invitationFormData.role) {
      alert('Please fill in all required fields');
      return;
    }

    setSendingInvitation(true);
    try {
      // Create co-signer record
      const { data: coSignerData, error: coSignerError } = await supabase
        .from('co_signers')
        .insert({
          split_sheet_id: splitSheetId,
          name: invitationFormData.name,
          email: invitationFormData.email,
          phone: invitationFormData.phone,
          role: invitationFormData.role,
          percentage: invitationFormData.percentage,
          invitation_sent: true,
          invitation_sent_at: new Date().toISOString(),
          invitation_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
          signature_status: 'pending'
        })
        .select()
        .single();

      if (coSignerError) throw coSignerError;

      // In a real implementation, you would send the email here
      // For now, we'll simulate the email sending
      console.log('Sending invitation email to:', invitationFormData.email);
      
      // Update local state
      setSplitSheets(prev => prev.map(sheet => 
        sheet.id === splitSheetId 
          ? { ...sheet, co_signers: [...sheet.co_signers, coSignerData] }
          : sheet
      ));

      // Reset form and close modal
      setInvitationFormData({
        name: '',
        email: '',
        phone: '',
        role: '',
        percentage: 0
      });
      setShowInviteModal(false);

      alert('Invitation sent successfully!');
    } catch (err) {
      console.error('Error sending invitation:', err);
      alert('Failed to send invitation');
    } finally {
      setSendingInvitation(false);
    }
  };

  const handleResendInvitation = async (coSignerId: string) => {
    try {
      const { error: updateError } = await supabase
        .from('co_signers')
        .update({
          invitation_sent: true,
          invitation_sent_at: new Date().toISOString(),
          invitation_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          signature_status: 'pending'
        })
        .eq('id', coSignerId);

      if (updateError) throw updateError;

      // Update local state
      setSplitSheets(prev => prev.map(sheet => ({
        ...sheet,
        co_signers: sheet.co_signers.map(signer => 
          signer.id === coSignerId 
            ? { 
                ...signer, 
                invitation_sent: true,
                invitation_sent_at: new Date().toISOString(),
                invitation_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                signature_status: 'pending'
              }
            : signer
        )
      })));

      alert('Invitation resent successfully!');
    } catch (err) {
      console.error('Error resending invitation:', err);
      alert('Failed to resend invitation');
    }
  };

  const handleEditCoSigner = async (coSignerId: string, updatedData: Partial<CoSigner>) => {
    try {
      const { error: updateError } = await supabase
        .from('co_signers')
        .update(updatedData)
        .eq('id', coSignerId);

      if (updateError) throw updateError;

      // Update local state
      setSplitSheets(prev => prev.map(sheet => ({
        ...sheet,
        co_signers: sheet.co_signers.map(signer => 
          signer.id === coSignerId 
            ? { ...signer, ...updatedData }
            : signer
        )
      })));

      setEditingCoSigner(null);
    } catch (err) {
      console.error('Error updating co-signer:', err);
      alert('Failed to update co-signer');
    }
  };

  const handleDeleteCoSigner = async (coSignerId: string) => {
    if (!confirm('Are you sure you want to remove this co-signer?')) {
      return;
    }

    try {
      const { error: deleteError } = await supabase
        .from('co_signers')
        .delete()
        .eq('id', coSignerId);

      if (deleteError) throw deleteError;

      // Update local state
      setSplitSheets(prev => prev.map(sheet => ({
        ...sheet,
        co_signers: sheet.co_signers.filter(signer => signer.id !== coSignerId)
      })));
    } catch (err) {
      console.error('Error deleting co-signer:', err);
      alert('Failed to delete co-signer');
    }
  };

  const getSignatureStatusColor = (status: string) => {
    switch (status) {
      case 'signed':
        return 'text-green-400 bg-green-400/20';
      case 'pending':
        return 'text-yellow-400 bg-yellow-400/20';
      case 'expired':
        return 'text-red-400 bg-red-400/20';
      case 'declined':
        return 'text-gray-400 bg-gray-400/20';
      default:
        return 'text-gray-400 bg-gray-400/20';
    }
  };

  const getSignatureStatusIcon = (status: string) => {
    switch (status) {
      case 'signed':
        return <CheckCircle className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'expired':
        return <AlertCircle className="w-4 h-4" />;
      case 'declined':
        return <X className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const calculateSignatureProgress = (coSigners: CoSigner[]) => {
    const total = coSigners.length;
    const signed = coSigners.filter(signer => signer.signature_status === 'signed').length;
    return total > 0 ? Math.round((signed / total) * 100) : 0;
  };

  const filteredSplitSheets = splitSheets.filter(sheet => {
    const matchesSearch = sheet.master_recording.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sheet.master_recording.artist.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || sheet.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-blue-900/90 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-300">Loading e-signatures...</p>
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
            <Mail className="w-8 h-8 text-blue-400 mr-2" />
            <h1 className="text-3xl font-bold text-white">E-Signature Management</h1>
          </div>
          <p className="text-gray-300">
            Send co-signer invitations and track digital signatures for split sheets
          </p>
        </div>

        {/* Filters and Actions */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 mb-6 border border-white/20">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search split sheets..."
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
                <option value="pending_signatures">Pending Signatures</option>
                <option value="completed">Completed</option>
                <option value="expired">Expired</option>
              </select>
              <button
                onClick={fetchSplitSheets}
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

        {/* Split Sheets Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredSplitSheets.map((splitSheet) => (
            <div
              key={splitSheet.id}
              className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:border-blue-500/50 transition-colors"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-1">
                    {splitSheet.master_recording.title}
                  </h3>
                  <p className="text-gray-400 text-sm">
                    {splitSheet.master_recording.artist}
                  </p>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-medium flex items-center ${getSignatureStatusColor(splitSheet.status)}`}>
                  {getSignatureStatusIcon(splitSheet.status)}
                  <span className="ml-1">{splitSheet.status.replace('_', ' ')}</span>
                </div>
              </div>

              {/* Signature Progress */}
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-300">Signature Progress</span>
                  <span className="text-white">
                    {calculateSignatureProgress(splitSheet.co_signers)}%
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${calculateSignatureProgress(splitSheet.co_signers)}%` }}
                  ></div>
                </div>
              </div>

              {/* Co-Signers List */}
              <div className="space-y-2 mb-4">
                {splitSheet.co_signers.map((coSigner) => (
                  <div
                    key={coSigner.id}
                    className="flex items-center justify-between p-2 bg-gray-800/30 rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="text-white text-sm font-medium">{coSigner.name}</p>
                      <p className="text-gray-400 text-xs">{coSigner.role} ({coSigner.percentage}%)</p>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium flex items-center ${getSignatureStatusColor(coSigner.signature_status)}`}>
                      {getSignatureStatusIcon(coSigner.signature_status)}
                      <span className="ml-1">{coSigner.signature_status}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedSplitSheet(splitSheet)}
                  className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center text-sm"
                >
                  <Eye className="w-4 h-4 mr-1" />
                  View Details
                </button>
                <button
                  onClick={() => {
                    setSelectedSplitSheet(splitSheet);
                    setShowInviteModal(true);
                  }}
                  className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  <UserPlus className="w-4 h-4" />
                </button>
              </div>

              {/* Date */}
              <div className="text-xs text-gray-400 mt-3 text-center">
                Created: {new Date(splitSheet.created_at).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredSplitSheets.length === 0 && !loading && (
          <div className="text-center py-12">
            <Mail className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Split Sheets Found</h3>
            <p className="text-gray-400 mb-4">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'Create split sheets to start managing e-signatures'
              }
            </p>
          </div>
        )}

        {/* Split Sheet Detail Modal */}
        {selectedSplitSheet && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Split Sheet Details</h2>
                <button
                  onClick={() => setSelectedSplitSheet(null)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Recording Info */}
              <div className="bg-gray-800/30 rounded-lg p-4 mb-6">
                <h3 className="text-lg font-semibold text-white mb-4">Recording Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm text-gray-400">Title</label>
                    <p className="text-white">{selectedSplitSheet.master_recording.title}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Artist</label>
                    <p className="text-white">{selectedSplitSheet.master_recording.artist}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Genre</label>
                    <p className="text-white">{selectedSplitSheet.master_recording.genre}</p>
                  </div>
                </div>
              </div>

              {/* Co-Signers Management */}
              <div className="bg-gray-800/30 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Co-Signers</h3>
                  <button
                    onClick={() => setShowInviteModal(true)}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add Co-Signer
                  </button>
                </div>

                <div className="space-y-4">
                  {selectedSplitSheet.co_signers.map((coSigner) => (
                    <div
                      key={coSigner.id}
                      className="bg-gray-700/30 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="text-white font-medium">{coSigner.name}</h4>
                          <p className="text-gray-400 text-sm">{coSigner.email}</p>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center ${getSignatureStatusColor(coSigner.signature_status)}`}>
                          {getSignatureStatusIcon(coSigner.signature_status)}
                          <span className="ml-1">{coSigner.signature_status}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                        <div>
                          <label className="text-sm text-gray-400">Role</label>
                          <p className="text-white">{coSigner.role}</p>
                        </div>
                        <div>
                          <label className="text-sm text-gray-400">Percentage</label>
                          <p className="text-white">{coSigner.percentage}%</p>
                        </div>
                        <div>
                          <label className="text-sm text-gray-400">Phone</label>
                          <p className="text-white">{coSigner.phone || 'N/A'}</p>
                        </div>
                      </div>

                      {coSigner.invitation_sent && (
                        <div className="text-xs text-gray-400 mb-3">
                          Invitation sent: {new Date(coSigner.invitation_sent_at!).toLocaleDateString()}
                          {coSigner.invitation_expires_at && (
                            <span className="ml-4">
                              Expires: {new Date(coSigner.invitation_expires_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      )}

                      <div className="flex gap-2">
                        {coSigner.signature_status === 'pending' && (
                          <button
                            onClick={() => handleResendInvitation(coSigner.id)}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors"
                          >
                            <Send className="w-3 h-3 mr-1" />
                            Resend
                          </button>
                        )}
                        <button
                          onClick={() => setEditingCoSigner(coSigner)}
                          className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm transition-colors"
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteCoSigner(coSigner.id)}
                          className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors"
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-4">
                <button
                  onClick={() => window.open(`/split-sheet/${selectedSplitSheet.id}`, '_blank')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Split Sheet
                </button>
                <button
                  onClick={() => {
                    // Download split sheet PDF
                    console.log('Downloading split sheet PDF...');
                  }}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </button>
                <button
                  onClick={() => setSelectedSplitSheet(null)}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Invitation Modal */}
        {showInviteModal && selectedSplitSheet && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 max-w-md w-full">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Invite Co-Signer</h2>
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault();
                handleSendInvitation(selectedSplitSheet.id);
              }}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={invitationFormData.name}
                      onChange={(e) => setInvitationFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                      placeholder="Enter full name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      value={invitationFormData.email}
                      onChange={(e) => setInvitationFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                      placeholder="Enter email address"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={invitationFormData.phone}
                      onChange={(e) => setInvitationFormData(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                      placeholder="Enter phone number (optional)"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Role *
                    </label>
                    <input
                      type="text"
                      value={invitationFormData.role}
                      onChange={(e) => setInvitationFormData(prev => ({ ...prev, role: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                      placeholder="e.g., Songwriter, Producer, Publisher"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Percentage *
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={invitationFormData.percentage}
                      onChange={(e) => setInvitationFormData(prev => ({ ...prev, percentage: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                      placeholder="Enter percentage"
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-4 mt-6">
                  <button
                    type="submit"
                    disabled={sendingInvitation}
                    className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center justify-center"
                  >
                    {sendingInvitation ? (
                      <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Send className="w-4 h-4 mr-2" />
                    )}
                    {sendingInvitation ? 'Sending...' : 'Send Invitation'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Co-Signer Modal */}
        {editingCoSigner && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 max-w-md w-full">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Edit Co-Signer</h2>
                <button
                  onClick={() => setEditingCoSigner(null)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault();
                handleEditCoSigner(editingCoSigner.id, {
                  name: editingCoSigner.name,
                  email: editingCoSigner.email,
                  phone: editingCoSigner.phone,
                  role: editingCoSigner.role,
                  percentage: editingCoSigner.percentage
                });
              }}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={editingCoSigner.name}
                      onChange={(e) => setEditingCoSigner(prev => prev ? { ...prev, name: e.target.value } : null)}
                      className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={editingCoSigner.email}
                      onChange={(e) => setEditingCoSigner(prev => prev ? { ...prev, email: e.target.value } : null)}
                      className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={editingCoSigner.phone || ''}
                      onChange={(e) => setEditingCoSigner(prev => prev ? { ...prev, phone: e.target.value } : null)}
                      className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Role
                    </label>
                    <input
                      type="text"
                      value={editingCoSigner.role}
                      onChange={(e) => setEditingCoSigner(prev => prev ? { ...prev, role: e.target.value } : null)}
                      className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Percentage
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={editingCoSigner.percentage}
                      onChange={(e) => setEditingCoSigner(prev => prev ? { ...prev, percentage: parseFloat(e.target.value) || 0 } : null)}
                      className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="flex gap-4 mt-6">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingCoSigner(null)}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
