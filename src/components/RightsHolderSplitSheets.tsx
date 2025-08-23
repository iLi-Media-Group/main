import React, { useState, useEffect } from 'react';
import { useUnifiedAuth } from '../contexts/UnifiedAuthContext';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { formatGenresForDisplay } from '../utils/genreUtils';
import { 
  FileText, 
  Users, 
  Mail, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Download, 
  Send,
  Eye,
  Building2,
  Percent,
  Calendar,
  Search,
  Filter,
  RefreshCw
} from 'lucide-react';

interface SplitSheet {
  id: string;
  track_id: string;
  rights_holder_id: string;
  status: 'pending_signatures' | 'completed' | 'expired';
  created_at: string;
  updated_at: string;
  track: {
    title: string;
    artist: string;
    genres: string[];
  };
  participants: SplitSheetParticipant[];
  co_signers: CoSigner[];
}

interface SplitSheetParticipant {
  id: string;
  split_sheet_id: string;
  name: string;
  role: 'writer' | 'producer' | 'publisher' | 'performer';
  percentage: number;
  email: string;
  pro: string;
  publisher: string;
  signed: boolean;
  signed_at?: string;
}

interface CoSigner {
  id: string;
  split_sheet_id: string;
  name: string;
  email: string;
  role: string;
  invited: boolean;
  invited_at?: string;
  signed: boolean;
  signed_at?: string;
}

export function RightsHolderSplitSheets() {
  const { user } = useUnifiedAuth();
  const [splitSheets, setSplitSheets] = useState<SplitSheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSplitSheet, setSelectedSplitSheet] = useState<SplitSheet | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sendingReminder, setSendingReminder] = useState<string | null>(null);

  // Fetch split sheets on component mount
  useEffect(() => {
    if (user) {
      fetchSplitSheets();
    }
  }, [user]);

  const fetchSplitSheets = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      // Fetch tracks that have split sheet information
      const { data: tracksData, error: tracksError } = await supabase
        .from('tracks')
        .select(`
          id,
          title,
          artist,
          genres,
          split_sheet_url,
          created_at,
          updated_at
        `)
        .eq('track_producer_id', user.id)
        .not('split_sheet_url', 'is', null)
        .order('created_at', { ascending: false });

      if (tracksError) {
        console.error('Error fetching tracks with split sheets:', tracksError);
        setError('Failed to load split sheets');
        return;
      }

      // Transform tracks data to match SplitSheet interface
      const transformedSplitSheets: SplitSheet[] = (tracksData || []).map(track => ({
        id: track.id,
        track_id: track.id,
        rights_holder_id: user.id,
        status: 'completed' as const, // Default status since we don't have this in tracks table
        created_at: track.created_at,
        updated_at: track.updated_at,
        track: {
          title: track.title,
          artist: track.artist,
          genres: Array.isArray(track.genres) ? track.genres : []
        },
        participants: [], // We don't have participants data in tracks table
        co_signers: [] // We don't have co-signers data in tracks table
      }));

      setSplitSheets(transformedSplitSheets);
    } catch (error) {
      console.error('Error in fetchSplitSheets:', error);
      setError('Failed to load split sheets');
    } finally {
      setLoading(false);
    }
  };

  const sendReminder = async (coSignerId: string, email: string, name: string) => {
    setSendingReminder(coSignerId);
    
    try {
      // Update the co-signer record to mark reminder sent
      const { error: updateError } = await supabase
        .from('co_signers')
        .update({ 
          invited: true,
          invited_at: new Date().toISOString()
        })
        .eq('id', coSignerId);

      if (updateError) throw updateError;

      // TODO: Implement actual email sending logic
      // For now, we'll just show a success message
      alert(`Reminder sent to ${name} at ${email}`);
      
      // Refresh the data
      fetchSplitSheets();
    } catch (err) {
      console.error('Error sending reminder:', err);
      alert('Failed to send reminder');
    } finally {
      setSendingReminder(null);
    }
  };

  const downloadSplitSheet = async (splitSheet: SplitSheet) => {
    try {
      // Generate split sheet document
      const documentContent = generateSplitSheetDocument(splitSheet);
      
      // Create and download the file
      const blob = new Blob([documentContent], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `split-sheet-${splitSheet.track.title}-${splitSheet.id}.txt`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error downloading split sheet:', err);
      alert('Failed to download split sheet');
    }
  };

  const generateSplitSheetDocument = (splitSheet: SplitSheet): string => {
    const participants = splitSheet.participants || [];
    const coSigners = splitSheet.co_signers || [];
    
    let document = `SPLIT SHEET\n`;
    document += `================================\n\n`;
    document += `Track: ${splitSheet.track.title}\n`;
    document += `Artist: ${splitSheet.track.artist}\n`;
    document += `Genre: ${Array.isArray(splitSheet.track.genres) ? splitSheet.track.genres.join(', ') : 'N/A'}\n`;
    document += `Date: ${new Date(splitSheet.created_at).toLocaleDateString()}\n\n`;
    
    document += `PARTICIPANTS:\n`;
    document += `================================\n`;
    participants.forEach((participant, index) => {
      document += `${index + 1}. ${participant.name}\n`;
      document += `   Role: ${participant.role}\n`;
      document += `   Percentage: ${participant.percentage}%\n`;
      document += `   Email: ${participant.email}\n`;
      document += `   PRO: ${participant.pro}\n`;
      document += `   Publisher: ${participant.publisher}\n`;
      document += `   Signed: ${participant.signed ? 'Yes' : 'No'}\n`;
      if (participant.signed_at) {
        document += `   Signed Date: ${new Date(participant.signed_at).toLocaleDateString()}\n`;
      }
      document += `\n`;
    });
    
    if (coSigners.length > 0) {
      document += `CO-SIGNERS:\n`;
      document += `================================\n`;
      coSigners.forEach((coSigner, index) => {
        document += `${index + 1}. ${coSigner.name}\n`;
        document += `   Role: ${coSigner.role}\n`;
        document += `   Email: ${coSigner.email}\n`;
        document += `   Invited: ${coSigner.invited ? 'Yes' : 'No'}\n`;
        document += `   Signed: ${coSigner.signed ? 'Yes' : 'No'}\n`;
        if (coSigner.signed_at) {
          document += `   Signed Date: ${new Date(coSigner.signed_at).toLocaleDateString()}\n`;
        }
        document += `\n`;
      });
    }
    
    document += `STATUS: ${splitSheet.status.toUpperCase()}\n`;
    document += `================================\n`;
    
    return document;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-400 bg-green-400/20';
      case 'pending_signatures':
        return 'text-yellow-400 bg-yellow-400/20';
      case 'expired':
        return 'text-red-400 bg-red-400/20';
      default:
        return 'text-gray-400 bg-gray-400/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'pending_signatures':
        return <Clock className="w-4 h-4" />;
      case 'expired':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const filteredSplitSheets = splitSheets.filter(splitSheet => {
    const matchesSearch = splitSheet.track.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         splitSheet.track.artist.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || splitSheet.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getSignatureProgress = (splitSheet: SplitSheet) => {
    const participants = splitSheet.participants || [];
    const coSigners = splitSheet.co_signers || [];
    const totalSignatures = participants.length + coSigners.length;
    const signedCount = participants.filter(p => p.signed).length + coSigners.filter(c => c.signed).length;
    return totalSignatures > 0 ? Math.round((signedCount / totalSignatures) * 100) : 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-blue-900/90 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-300">Loading split sheets...</p>
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
            <FileText className="w-8 h-8 text-blue-400 mr-2" />
            <h1 className="text-3xl font-bold text-white">Split Sheet Management</h1>
          </div>
          <p className="text-gray-300">
            Manage your split sheets and track co-signer signatures
          </p>
        </div>

        {/* Filters and Search */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 mb-6 border border-white/20">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by track title or artist..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-2">
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
              className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:border-blue-500/50 transition-colors cursor-pointer"
              onClick={() => setSelectedSplitSheet(splitSheet)}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-1">
                    {splitSheet.track.title}
                  </h3>
                  <p className="text-gray-400 text-sm">
                    {splitSheet.track.artist}
                  </p>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-medium flex items-center ${getStatusColor(splitSheet.status)}`}>
                  {getStatusIcon(splitSheet.status)}
                  <span className="ml-1">{splitSheet.status.replace('_', ' ')}</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-300 mb-1">
                  <span>Signatures</span>
                  <span>{getSignatureProgress(splitSheet)}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${getSignatureProgress(splitSheet)}%` }}
                  ></div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-lg font-semibold text-white">
                    {splitSheet.participants?.length || 0}
                  </div>
                  <div className="text-xs text-gray-400">Participants</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-white">
                    {splitSheet.co_signers?.length || 0}
                  </div>
                  <div className="text-xs text-gray-400">Co-signers</div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    downloadSplitSheet(splitSheet);
                  }}
                  className="flex-1 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors flex items-center justify-center text-sm"
                >
                  <Download className="w-4 h-4 mr-1" />
                  Download
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedSplitSheet(splitSheet);
                  }}
                  className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center text-sm"
                >
                  <Eye className="w-4 h-4 mr-1" />
                  View Details
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
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Split Sheets Found</h3>
            <p className="text-gray-400 mb-4">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'Upload your first track to create a split sheet'
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
                  ✕
                </button>
              </div>

              {/* Track Info */}
              <div className="bg-gray-800/30 rounded-lg p-4 mb-6">
                <h3 className="text-lg font-semibold text-white mb-2">Track Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm text-gray-400">Title</label>
                    <p className="text-white">{selectedSplitSheet.track.title}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Artist</label>
                    <p className="text-white">{selectedSplitSheet.track.artist}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Genre</label>
                    <p className="text-white">{formatGenresForDisplay(selectedSplitSheet.track.genres)}</p>
                  </div>
                </div>
              </div>

              {/* Participants */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-4">Participants</h3>
                <div className="space-y-3">
                  {selectedSplitSheet.participants?.map((participant) => (
                    <div key={participant.id} className="bg-gray-800/30 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h4 className="font-semibold text-white">{participant.name}</h4>
                            <span className="text-sm text-gray-400">({participant.role})</span>
                            <span className="text-sm text-blue-400">{participant.percentage}%</span>
                          </div>
                          <div className="text-sm text-gray-400 mt-1">
                            {participant.email} • PRO: {participant.pro} • Publisher: {participant.publisher}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {participant.signed ? (
                            <div className="flex items-center text-green-400">
                              <CheckCircle className="w-4 h-4 mr-1" />
                              <span className="text-sm">Signed</span>
                            </div>
                          ) : (
                            <div className="flex items-center text-yellow-400">
                              <Clock className="w-4 h-4 mr-1" />
                              <span className="text-sm">Pending</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Co-signers */}
              {selectedSplitSheet.co_signers && selectedSplitSheet.co_signers.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Co-signers</h3>
                  <div className="space-y-3">
                    {selectedSplitSheet.co_signers.map((coSigner) => (
                      <div key={coSigner.id} className="bg-gray-800/30 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <h4 className="font-semibold text-white">{coSigner.name}</h4>
                              <span className="text-sm text-gray-400">({coSigner.role})</span>
                            </div>
                            <div className="text-sm text-gray-400 mt-1">
                              {coSigner.email}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {coSigner.signed ? (
                              <div className="flex items-center text-green-400">
                                <CheckCircle className="w-4 h-4 mr-1" />
                                <span className="text-sm">Signed</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <div className="flex items-center text-yellow-400">
                                  <Clock className="w-4 h-4 mr-1" />
                                  <span className="text-sm">Pending</span>
                                </div>
                                {!coSigner.invited && (
                                  <button
                                    onClick={() => sendReminder(coSigner.id, coSigner.email, coSigner.name)}
                                    disabled={sendingReminder === coSigner.id}
                                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors flex items-center"
                                  >
                                    {sendingReminder === coSigner.id ? (
                                      <RefreshCw className="w-3 h-3 animate-spin mr-1" />
                                    ) : (
                                      <Send className="w-3 h-3 mr-1" />
                                    )}
                                    Send Reminder
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-4">
                <button
                  onClick={() => downloadSplitSheet(selectedSplitSheet)}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Split Sheet
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
      </div>
    </div>
  );
}
