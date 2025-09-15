import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useUnifiedAuth } from '../contexts/UnifiedAuthContext';
import { X, Send, Mail, FileText, Clock, User, Play, Music } from 'lucide-react';

interface Track {
  id: string;
  title: string;
  genre: string;
  mood: string;
  bpm: number;
  duration: number;
  track_url: string;
  producer_name: string;
  artist_name: string;
}

interface SendPlaylistEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  playlist: {
    id: string;
    playlist_name: string;
    submission_email: string;
    submission_instructions: string;
    tracks_included: string[];
    opportunity_title: string;
    client_name: string;
  };
  onEmailSent: () => void;
}

export function SendPlaylistEmailModal({
  isOpen,
  onClose,
  playlist,
  onEmailSent
}: SendPlaylistEmailModalProps) {
  const { user } = useUnifiedAuth();
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  // Initialize email content when modal opens
  useEffect(() => {
    if (isOpen && playlist) {
      setEmailSubject(`Music Submission: ${playlist.playlist_name}`);
      setEmailBody(generateEmailBody());
      fetchTracks();
    }
  }, [isOpen, playlist]);

  const fetchTracks = async () => {
    try {
      setLoading(true);

      const { data: tracksData, error } = await supabase
        .from('tracks')
        .select(`
          id,
          title,
          genre,
          mood,
          bpm,
          duration,
          track_url,
          track_producer_id,
          roster_entity_id,
          profiles!tracks_track_producer_id_fkey (
            display_name
          )
        `)
        .in('id', playlist.tracks_included);

      if (error) {
        console.error('Error fetching tracks:', error);
        return;
      }

      // Transform tracks data
      const transformedTracks = (tracksData || []).map(track => ({
        id: track.id,
        title: track.title,
        genre: track.genre,
        mood: track.mood,
        bpm: track.bpm,
        duration: track.duration,
        track_url: track.track_url,
        producer_name: track.profiles?.display_name || 'Unknown',
        artist_name: track.profiles?.display_name || 'Unknown'
      }));

      setTracks(transformedTracks);
    } catch (error) {
      console.error('Error fetching tracks:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateEmailBody = () => {
    return `Dear ${playlist.client_name},

Thank you for your interest in our music catalog. We're excited to present this curated selection of tracks for your project: "${playlist.opportunity_title}".

${playlist.submission_instructions ? `\nSubmission Instructions:\n${playlist.submission_instructions}\n` : ''}

Please find the playlist details below:

Playlist: ${playlist.playlist_name}
Number of tracks: ${playlist.tracks_included.length}

Track List:
${playlist.tracks_included.map((trackId, index) => {
  const track = tracks.find(t => t.id === trackId);
  if (!track) return `${index + 1}. Track ID: ${trackId}`;
  return `${index + 1}. "${track.title}" - ${track.producer_name} (${track.genre}, ${track.mood}, ${track.bpm} BPM)`;
}).join('\n')}

${playlist.submission_instructions ? `\nPlease follow the submission instructions provided above.` : ''}

If you're interested in any of these tracks or need additional information, please don't hesitate to contact us. We're here to help you find the perfect music for your project.

Best regards,
MyBeatFi Team

---
This email was sent via MyBeatFi Pitch Service
For support, contact: support@mybeatfi.io`;
  };

  const handleSendEmail = async () => {
    if (!emailSubject.trim() || !emailBody.trim()) {
      alert('Please provide both subject and body for the email.');
      return;
    }

    try {
      setSending(true);

      // Call the email sending function
      const { error } = await supabase.functions.invoke('send-pitch-email', {
        body: {
          to: playlist.submission_email,
          subject: emailSubject,
          body: emailBody,
          playlist_id: playlist.id,
          tracks: tracks.map(track => ({
            id: track.id,
            title: track.title,
            producer_name: track.producer_name,
            track_url: track.track_url
          }))
        }
      });

      if (error) {
        console.error('Error sending email:', error);
        alert('Error sending email. Please try again.');
        return;
      }

      // Update playlist status
      await supabase
        .from('pitch_playlists')
        .update({
          submission_status: 'sent',
          sent_at: new Date().toISOString()
        })
        .eq('id', playlist.id);

      onEmailSent();
      onClose();
    } catch (error) {
      console.error('Error sending email:', error);
      alert('Error sending email. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Send Playlist Email</h2>
            <p className="text-gray-600 mt-1">
              {playlist.playlist_name} • {playlist.client_name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex h-[calc(90vh-120px)]">
          {/* Left Panel - Email Content */}
          <div className="w-1/2 p-6 border-r border-gray-200 flex flex-col">
            <div className="space-y-4 flex-1">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  To
                </label>
                <div className="flex items-center px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
                  <Mail className="w-4 h-4 text-gray-400 mr-2" />
                  <span className="text-gray-600">{playlist.submission_email}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Body
                </label>
                <textarea
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  rows={15}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 space-y-3">
              <button
                onClick={handleSendEmail}
                disabled={sending || !emailSubject.trim() || !emailBody.trim()}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                {sending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Email
                  </>
                )}
              </button>
              <button
                onClick={onClose}
                className="w-full bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>

          {/* Right Panel - Playlist Preview */}
          <div className="w-1/2 p-6 flex flex-col">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Playlist Preview
              </h3>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <Music className="w-5 h-5 text-blue-600 mr-2" />
                  <span className="font-medium text-blue-900">{playlist.playlist_name}</span>
                </div>
                <p className="text-sm text-blue-700">
                  {playlist.tracks_included.length} tracks for {playlist.client_name}
                </p>
              </div>
            </div>

            {/* Track List */}
            <div className="flex-1 overflow-y-auto">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Tracks in Playlist</h4>
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="space-y-2">
                  {tracks.map((track, index) => (
                    <div key={track.id} className="p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h5 className="text-sm font-medium text-gray-900 truncate">
                              {track.title}
                            </h5>
                            <div className="flex items-center space-x-3 text-xs text-gray-500 mt-1">
                              <span className="flex items-center">
                                <User className="w-3 h-3 mr-1" />
                                {track.producer_name}
                              </span>
                              <span>{track.genre}</span>
                              <span>{track.mood}</span>
                              <span>{track.bpm} BPM</span>
                              <span className="flex items-center">
                                <Clock className="w-3 h-3 mr-1" />
                                {formatDuration(track.duration)}
                              </span>
                            </div>
                          </div>
                        </div>
                        {track.track_url && (
                          <button
                            onClick={() => window.open(track.track_url, '_blank')}
                            className="text-blue-600 hover:text-blue-800 transition-colors"
                          >
                            <Play className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submission Instructions */}
            {playlist.submission_instructions && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center mb-2">
                  <FileText className="w-4 h-4 text-yellow-600 mr-2" />
                  <span className="text-sm font-medium text-yellow-800">Submission Instructions</span>
                </div>
                <p className="text-sm text-yellow-700">
                  {playlist.submission_instructions}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
