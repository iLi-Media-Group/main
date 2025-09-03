import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Music, Download, Shield, Loader2, Tag, Clock, Hash, FileMusic, Layers, Mic, Star, User, DollarSign, ListMusic, Plus } from 'lucide-react';
import { useUnifiedAuth } from '../contexts/UnifiedAuthContext';
import { supabase } from '../lib/supabase';
import { Track } from '../types';
import { useSignedUrl } from '../hooks/useSignedUrl';
import { AudioPlayer } from './AudioPlayer';
import { TrackClearanceBadges } from './TrackClearanceBadges';
import { AddToPlaylistModal } from './AddToPlaylistModal';

// Component to handle signed URL generation for track audio
function TrackAudioPlayer({ track }: { track: Track }) {
  const { signedUrl, loading, error } = useSignedUrl('track-audio', track.audioUrl);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-16 bg-white/5 rounded-lg">
        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !signedUrl) {
    return (
      <div className="flex items-center justify-center h-16 bg-red-500/10 rounded-lg">
        <p className="text-red-400 text-sm">Audio unavailable</p>
      </div>
    );
  }

  return (
    <AudioPlayer
      src={signedUrl}
      title={track.title}
      size="md"
      audioId={`track-${track.id}`}
    />
  );
}

// Component to handle signed URL generation for track images
function TrackImage({ track }: { track: Track }) {
  // If it's already a public URL (like Unsplash), use it directly
  if (track.image && track.image.startsWith('https://')) {
    return (
      <img
        src={track.image}
        alt={track.title}
        className="w-full h-full object-cover"
      />
    );
  }

  // For file paths, use signed URL
  const { signedUrl, loading, error } = useSignedUrl('track-images', track.image);

  if (loading) {
    return (
      <div className="w-full h-full bg-white/5 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !signedUrl) {
    return (
      <img
        src="https://images.pexels.com/photos/1626481/pexels-photo-1626481.jpeg"
        alt={track.title}
        className="w-full h-full object-cover"
      />
    );
  }

  return (
    <img
      src={signedUrl}
      alt={track.title}
      className="w-full h-full object-cover"
    />
  );
}
import { LicenseDialog } from './LicenseDialog';
import { ProducerProfileDialog } from './ProducerProfileDialog';
import { SyncProposalDialog } from './SyncProposalDialog';
import { createCheckoutSession } from '../lib/stripe';
import { PRODUCTS } from '../stripe-config';
import { formatGenresForDisplay, formatMoodsForDisplay } from '../utils/genreUtils';

interface UserStats {
  membershipType: 'Single Track' | 'Gold Access' | 'Platinum Access' | 'Ultimate Access';
  remainingLicenses: number;
}

export function TrackPage() {
  const { trackId } = useParams();
  const { user, membershipPlan, refreshMembership, accountType } = useUnifiedAuth();
  const navigate = useNavigate();
  const [track, setTrack] = useState<Track | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLicenseDialog, setShowLicenseDialog] = useState(false);
  const [showProposalDialog, setShowProposalDialog] = useState(false);
  const [showProducerProfile, setShowProducerProfile] = useState(false);
  const [userStats, setUserStats] = useState<UserStats>({
    membershipType: 'Single Track',
    remainingLicenses: 0
  });
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [cleanVersion, setCleanVersion] = useState<Track | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddToPlaylistModal, setShowAddToPlaylistModal] = useState(false);

  // Fetch clean version if this is an explicit track
  useEffect(() => {
    if (track && track.explicit_lyrics && track.id) {
      supabase
        .from('tracks')
        .select('*')
        .eq('clean_version_of', track.id)
        .limit(1)
        .then(({ data }) => {
          if (data && data.length > 0) setCleanVersion(data[0]);
        });
    }
  }, [track]);

  useEffect(() => {
    if (!trackId) {
      navigate('/catalog');
      return;
    }

    if (user) {
      // Refresh membership info first to ensure we have the latest data
      refreshMembership().then(() => {
        fetchTrackData();
      });
    } else {
      fetchTrackData();
    }
  }, [trackId, user, membershipPlan]);

  const getRelationshipTypeLabel = (type: string) => {
    const labels = {
      'related': 'Related',
      'radio_version': 'Radio Version',
      'instrumental': 'Instrumental',
      'vocal_version': 'Vocal Version',
      'chorus_only': 'Chorus Only',
      'clean_version': 'Clean Version',
      'explicit_version': 'Explicit Version'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const fetchTrackData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch track details
      const { data: trackData, error: trackError } = await supabase
        .from('tracks')
        .select(`
          *,
          producer:profiles(
            id,
            first_name,
            last_name,
            email,
            avatar_path
          )
        `)
        .eq('id', trackId)
        .single();

      if (trackError) throw trackError;

      // Fetch related tracks
      const { data: relatedTracksData, error: relatedTracksError } = await supabase
        .from('related_tracks')
        .select(`
          id,
          track_id,
          related_track_id,
          relationship_type,
          created_at,
          related_track:tracks!related_tracks_related_track_id_fkey (
            id,
            title,
            artist,
            duration,
            bpm,
            key,
            genres,
            moods,
            has_vocals,
            is_sync_only,
            explicit_lyrics
          )
        `)
        .eq('track_id', trackId);

      console.log('Related tracks query result:', { relatedTracksData, relatedTracksError, trackId });

      if (relatedTracksError) {
        console.error('Error fetching related tracks:', relatedTracksError);
      }

      if (trackError) throw trackError;
      
      if (trackData) {
        // Convert comma-separated strings to arrays
        const genres = trackData.genres ? trackData.genres.split(',').map((g: string) => g.trim()) : [];
        const moods = trackData.moods ? trackData.moods.split(',').map((m: string) => m.trim()) : [];
        const subGenres = trackData.sub_genres ? trackData.sub_genres.split(',').map((g: string) => g.trim()) : [];

        // Map the database fields to the Track interface
        const mappedTrack: Track = {
          id: trackData.id,
          title: trackData.title,
          genres: genres,
          subGenres: subGenres,
          artist: trackData.producer ? `${trackData.producer.first_name} ${trackData.producer.last_name}`.trim() : 'Unknown Artist',
          audioUrl: trackData.audio_url || '',
          image: trackData.image_url || 'https://images.pexels.com/photos/1626481/pexels-photo-1626481.jpeg',
          bpm: trackData.bpm || 0,
          key: trackData.key || '',
          duration: trackData.duration || '',
          moods: moods,
          hasVocals: trackData.has_vocals || false,
          isSyncOnly: trackData.is_sync_only || false,
          isOneStop: trackData.is_one_stop || false,
          hasStingEnding: trackData.has_sting_ending || false,
          mp3Url: trackData.mp3_url,
          trackoutsUrl: trackData.trackouts_url,
          splitSheetUrl: trackData.split_sheet_url,
          producerId: trackData.track_producer_id, // Add track_producer_id to the mapped track
          producer: trackData.producer ? {
            id: trackData.producer.id,
            firstName: trackData.producer.first_name || '',
            lastName: trackData.producer.last_name || '',
            email: trackData.producer.email,
            avatarPath: trackData.producer.avatar_path
          } : undefined,
          fileFormats: { 
            stereoMp3: { format: [], url: '' }, 
            stems: { format: [], url: '' }, 
            stemsWithVocals: { format: [], url: '' } 
          },
          pricing: { 
            stereoMp3: 0, 
            stems: 0, 
            stemsWithVocals: 0 
          },
          leaseAgreementUrl: '',
          explicit_lyrics: trackData.explicit_lyrics || false,
          // Sample clearance fields
          containsLoops: trackData.contains_loops || false,
          containsSamples: trackData.contains_samples || false,
          containsSpliceLoops: trackData.contains_splice_loops || false,
          samplesCleared: trackData.samples_cleared || false,
          sampleClearanceNotes: trackData.sample_clearance_notes || null,
          // Related tracks
          relatedTracks: (relatedTracksData || []).map(rt => ({
            id: rt.id,
            trackId: rt.track_id,
            relatedTrackId: rt.related_track_id,
            relationshipType: rt.relationship_type,
            relatedTrack: rt.related_track,
            createdAt: rt.created_at
          }))
        };
        
        setTrack(mappedTrack);
      }

      // If user is logged in, fetch additional data
      if (user) {
        // Check favorite status
        const { data: favoriteData } = await supabase
          .from('favorites')
          .select('id')
          .eq('user_id', user.id)
          .eq('track_id', trackId)
          .maybeSingle();

        setIsFavorite(!!favoriteData);

        // Calculate remaining licenses for Gold Access
        let remainingLicenses = 0;
        if (membershipPlan === 'Gold Access') {
          const startOfMonth = new Date();
          startOfMonth.setDate(1);
          startOfMonth.setHours(0, 0, 0, 0);

          const { count } = await supabase
            .from('sales')
            .select('id', { count: 'exact' })
            .eq('buyer_id', user.id)
            .gte('created_at', startOfMonth.toISOString());

          remainingLicenses = 10 - (count || 0);
        }

        setUserStats({
          membershipType: membershipPlan || 'Single Track',
          remainingLicenses
        });
      }

    } catch (error) {
      console.error('Error fetching track data:', error);
      setError('Failed to load track details');
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async () => {
    if (!user || favoriteLoading || !track) return;

    try {
      setFavoriteLoading(true);

      if (isFavorite) {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('track_id', track.id);

        if (error) throw error;
        setIsFavorite(false);
      } else {
        const { error } = await supabase
          .from('favorites')
          .insert({
            user_id: user.id,
            track_id: track.id
          });

        if (error) throw error;
        setIsFavorite(true);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    } finally {
      setFavoriteLoading(false);
    }
  };

  const handleActionClick = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Check if user is a producer and prevent licensing
    if (accountType && (accountType === 'producer' || accountType === 'admin,producer')) {
      alert('Producers cannot license tracks. Please use a client account to license tracks.');
      return;
    }

    if (!track) return;

    // For sync-only tracks (with or without vocals), show the proposal dialog
    if (track.isSyncOnly) {
      setShowProposalDialog(true);
      return;
    }
    
    // For tracks with vocals but not sync-only, show the license dialog
    if (track.hasVocals && !track.isSyncOnly) {
      setShowLicenseDialog(true);
      return;
    }
    
    // For regular tracks (no vocals, not sync-only), show the license dialog
    setShowLicenseDialog(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (error || !track) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto bg-white/5 backdrop-blur-sm rounded-xl border border-red-500/20 p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Track Not Found</h2>
          <p className="text-gray-300 mb-6">{error || "We couldn't find the track you're looking for."}</p>
          <button
            onClick={() => navigate('/catalog')}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Browse Catalog
          </button>
        </div>
      </div>
    );
  }

  // Determine button type based on track properties
  const isSyncOnlyTrack = track.isSyncOnly;
  const hasVocalsOnly = track.hasVocals && !track.isSyncOnly;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-purple-500/20 p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Left Column - Image */}
            <div className="md:col-span-1">
              <div className="relative aspect-square rounded-lg overflow-hidden">
                <TrackImage track={track} />
                {user && (
                  <button
                    onClick={toggleFavorite}
                    disabled={favoriteLoading}
                    className="absolute top-4 right-4 p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
                    aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    <Star 
                      className={`w-5 h-5 transition-colors ${
                        isFavorite ? 'text-yellow-400 fill-current' : 'text-white'
                      }`}
                    />
                  </button>
                )}
              </div>
            </div>

            {/* Middle Column - Track Details */}
            <div className="md:col-span-2">
              <h1 className="text-3xl font-bold text-white mb-2">{track.title}</h1>
              {/* Clean version link */}
              {track.explicit_lyrics && cleanVersion && (
                <div className="mb-4">
                  <span className="text-red-400 font-semibold mr-2">Explicit</span>
                  <span className="text-gray-300">A clean version is available: </span>
                  <a
                    href={`/track/${cleanVersion.id}`}
                    className="text-green-400 underline hover:text-green-300"
                  >
                    {cleanVersion.title}
                  </a>
                </div>
              )}
              
              {track.producer && (
                <button
                  onClick={() => setShowProducerProfile(true)}
                  className="text-blue-400 hover:text-blue-300 transition-colors flex items-center mb-4"
                >
                  <User className="w-4 h-4 mr-2" />
                  <span>
                    {track.producer.firstName} {track.producer.lastName}
                  </span>
                </button>
              )}

              <div className="mb-6">
                {/* Audio Player with debug warning if audioUrl is missing or incorrect */}
                {(!track.audioUrl || !track.audioUrl.endsWith('audio.mp3')) && (
                  <div className="mb-2 p-2 bg-yellow-900/80 text-yellow-200 rounded text-xs">
                    Warning: Audio file path is missing or does not match expected pattern. Please check upload logic and database.
                  </div>
                )}
                <TrackAudioPlayer track={track} />
              </div>

              {/* Related Tracks Section */}
              {track.relatedTracks && track.relatedTracks.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                    <Music className="w-5 h-5 text-blue-400" />
                    Related Tracks
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {track.relatedTracks.map((relatedTrack) => (
                      <div
                        key={relatedTrack.id}
                        className="p-3 bg-gray-800/50 rounded-lg border border-gray-600 hover:border-blue-500/50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <a
                              href={`/track/${relatedTrack.relatedTrack?.id}`}
                              className="text-white font-medium hover:text-blue-400 transition-colors block"
                            >
                              {relatedTrack.relatedTrack?.title}
                            </a>
                            <p className="text-gray-400 text-sm">{relatedTrack.relatedTrack?.artist}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-xs">
                                {getRelationshipTypeLabel(relatedTrack.relationshipType)}
                              </span>
                              <span className="text-gray-400 text-sm">{relatedTrack.relatedTrack?.duration}</span>
                              <span className="text-gray-400 text-sm">{relatedTrack.relatedTrack?.bpm} BPM</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="space-y-3">
                  <div className="flex items-center text-gray-300">
                    <Tag className="w-5 h-5 mr-2 text-blue-400" />
                    <span>Genres: {formatGenresForDisplay(track.genres)}</span>
                  </div>
                  
                  <div className="flex items-center text-gray-300">
                    <Hash className="w-5 h-5 mr-2 text-blue-400" />
                    <span>BPM: {track.bpm}</span>
                  </div>
                  
                  {track.key && (
                    <div className="flex items-center text-gray-300">
                      <Music className="w-5 h-5 mr-2 text-blue-400" />
                      <span>Key: {track.key}</span>
                    </div>
                  )}
                  
                  {track.duration && (
                    <div className="flex items-center text-gray-300">
                      <Clock className="w-5 h-5 mr-2 text-blue-400" />
                      <span>Duration: {formatDuration(track.duration)}</span>
                    </div>
                  )}
                  
                  {/* Track Clearance Badges */}
                  <TrackClearanceBadges 
                    containsLoops={track.containsLoops || false}
                    containsSamples={track.containsSamples || false}
                    containsSpliceLoops={track.containsSpliceLoops || false}
                    samplesCleared={track.samplesCleared || false}
                    className="mt-4"
                  />

                  {/* Sample Clearance Information */}
                  {(track.containsLoops || track.containsSamples || track.containsSpliceLoops) && (
                    <div className="mt-4 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                      <div className="flex items-start">
                        <div className="flex-shrink-0 mt-0.5">
                          <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                        </div>
                        <div className="ml-3">
                          <h4 className="text-sm font-medium text-blue-300 mb-2">
                            Sample Clearance Information
                          </h4>
                          <div className="space-y-1 text-sm text-blue-200/90">
                            {track.containsLoops && (
                              <div className="flex items-center">
                                <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
                                Contains loops
                              </div>
                            )}
                            {track.containsSamples && (
                              <div className="flex items-center">
                                <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
                                Contains samples {track.samplesCleared && <span className="text-green-400 ml-1">(Cleared)</span>}
                              </div>
                            )}
                            {track.containsSpliceLoops && (
                              <div className="flex items-center">
                                <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
                                Contains Splice loops
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Sample Clearance Notes */}
                  {track.sampleClearanceNotes && (
                    <div className="mt-4 p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                      <div className="flex items-start">
                        <div className="flex-shrink-0 mt-0.5">
                          <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                        </div>
                        <div className="ml-3">
                          <h4 className="text-sm font-medium text-yellow-300 mb-1">
                            Sample Clearance Notes
                          </h4>
                          <p className="text-sm text-yellow-200/90 whitespace-pre-wrap">
                            {track.sampleClearanceNotes}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Work for Hire Contracts */}
                  {track.workForHireContracts && track.workForHireContracts.length > 0 && (
                    <div className="mt-4 p-3 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
                      <div className="flex items-start">
                        <div className="flex-shrink-0 mt-0.5">
                          <div className="w-2 h-2 bg-indigo-400 rounded-full"></div>
                        </div>
                        <div className="ml-3">
                          <h4 className="text-sm font-medium text-indigo-300 mb-2">
                            Work for Hire Contracts Available
                          </h4>
                          <div className="space-y-1">
                            {track.workForHireContracts.map((contract, index) => (
                              <div key={index} className="flex items-center text-sm text-indigo-200/90">
                                <FileText className="w-4 h-4 mr-2" />
                                <span>Work for Hire Contract {index + 1}</span>
                              </div>
                            ))}
                          </div>
                          <p className="text-xs text-indigo-200/70 mt-2">
                            These contracts will be available for download after licensing this track.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  {track.hasVocals && (
                    <div className="flex items-center text-gray-300">
                      <Mic className="w-5 h-5 mr-2 text-purple-400" />
                      <span>Full Track with Vocals</span>
                    </div>
                  )}
                  
                  {track.isSyncOnly && (
                    <div className="flex items-center text-gray-300">
                      <Music className="w-5 h-5 mr-2 text-purple-400" />
                      <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded-full text-xs">
                        Sync Only
                      </span>
                    </div>
                  )}
                  
                  {/* MP3 Only Indicator */}
                  {track.audioUrl && !track.trackoutsUrl && !track.stemsUrl && (
                    <div className="flex items-center text-gray-300">
                      <FileMusic className="w-5 h-5 mr-2 text-yellow-400" />
                      <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded-full text-xs">
                        MP3 Only
                      </span>
                    </div>
                  )}
                  
                  {/* MP3 + Trackouts Indicator */}
                  {track.audioUrl && (track.trackoutsUrl || track.stemsUrl) && (
                    <div className="flex items-center text-gray-300">
                      <FileMusic className="w-5 h-5 mr-2 text-green-400" />
                      <span>MP3 + Trackouts Available</span>
                    </div>
                  )}
                  
                  {/* Trackouts Only Indicator */}
                  {!track.audioUrl && (track.trackoutsUrl || track.stemsUrl) && (
                    <div className="flex items-center text-gray-300">
                      <Layers className="w-5 h-5 mr-2 text-blue-400" />
                      <span>Trackouts Available</span>
                    </div>
                  )}
                  
                  {track.explicit_lyrics && (
                    <div className="flex items-center text-red-400">
                      <span className="font-bold mr-1">E</span>
                      <span>Explicit Lyrics</span>
                    </div>
                  )}
                  {track.hasStingEnding && (
                    <div className="flex items-center text-gray-300">
                      <Music className="w-5 h-5 mr-2 text-blue-400" />
                      <span>Includes Sting Ending</span>
                    </div>
                  )}
                  
                  {track.isOneStop && (
                    <div className="flex items-center text-gray-300">
                      <Shield className="w-5 h-5 mr-2 text-green-400" />
                      <span>One-Stop Licensing</span>
                    </div>
                  )}
                </div>
              </div>

              {track.moods && track.moods.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-white mb-3">Moods</h3>
                  <div className="flex flex-wrap gap-2">
                    {formatMoodsForDisplay(track.moods).split(', ').map((mood) => (
                      <span 
                        key={mood}
                        className="px-3 py-1 bg-white/10 rounded-full text-sm text-gray-300"
                      >
                        {mood}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-4">
                <button
                  onClick={handleActionClick}
                  disabled={checkoutLoading}
                  className={`py-3 px-6 rounded-lg text-white font-semibold transition-colors flex items-center ${
                    isSyncOnlyTrack 
                      ? 'bg-purple-600 hover:bg-purple-700' 
                      : 'bg-blue-600 hover:bg-blue-700'
                  } disabled:opacity-50`}
                >
                  {checkoutLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <DollarSign className="w-5 h-5 mr-2" />
                      {isSyncOnlyTrack ? 'Submit Proposal' : (
                        hasVocalsOnly ? 'License Track' : (
                          membershipPlan === 'Single Track' 
                            ? 'Purchase License ($9.99)' 
                            : 'License This Track'
                        )
                      )}
                    </>
                  )}
                </button>

                {user && (
                  <button
                    onClick={() => setShowAddToPlaylistModal(true)}
                    className="py-3 px-6 rounded-lg text-white font-semibold transition-colors flex items-center bg-purple-600 hover:bg-purple-700"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Add to Playlist
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Related Tracks Section - Could be added in the future */}
      </div>

      {/* Dialogs */}
      {track && (
        <>
          <LicenseDialog
            isOpen={showLicenseDialog}
            onClose={() => setShowLicenseDialog(false)}
            track={track}
            membershipType={membershipPlan || 'Single Track'}
            remainingLicenses={userStats.remainingLicenses}
            onLicenseCreated={fetchTrackData}
          />

          <SyncProposalDialog
            isOpen={showProposalDialog}
            onClose={() => setShowProposalDialog(false)}
            track={track}
          />

          {track.producer && (
            <ProducerProfileDialog
              isOpen={showProducerProfile}
              onClose={() => setShowProducerProfile(false)}
              producerId={track.producer.id}
            />
          )}

          <AddToPlaylistModal
            isOpen={showAddToPlaylistModal}
            onClose={() => setShowAddToPlaylistModal(false)}
            trackId={track.id}
            trackTitle={track.title}
            accountType={accountType}
          />
        </>
      )}
    </div>
  );
}
