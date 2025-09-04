import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Music, Download, Shield, Loader2, Tag, Clock, Hash, FileMusic, Layers, Mic, Star, User, DollarSign, ListMusic } from 'lucide-react';
import { useUnifiedAuth } from '../contexts/UnifiedAuthContext';
import { supabase } from '../lib/supabase';
import { Track } from '../types';
import { useSignedUrl } from '../hooks/useSignedUrl';
import { AudioPlayer } from './AudioPlayer';
import { ProducerProfileDialog } from './ProducerProfileDialog';
import { ProducerUsageBadges } from './ProducerUsageBadges';
import { TrackClearanceBadges } from './TrackClearanceBadges';
import { formatDuration } from '../utils/dateUtils';

interface TrackCardProps {
  track: Track;
  onSelect: (track: Track) => void;
  searchCategory?: 'exact' | 'partial' | 'other';
}

// Component to handle track images using public URLs
function TrackImage({ track }: { track: Track }) {
  // Pick your fallback depending on context
  const FALLBACK =
    "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop";

  // Stable cache key - since Track interface doesn't have updated_at, use a hash of the image path
  // This ensures the cache key only changes when the image path actually changes
  const cacheKey = track.image ? track.image.length : 0;

  const publicUrl = track.image?.startsWith("https://")
    ? track.image
    : `https://yciqkebqlajqbpwlujma.supabase.co/storage/v1/object/public/track-images/${track.image}?v=${cacheKey}`;

  const [src, setSrc] = useState(publicUrl);

  // Reset src whenever the track or cacheKey changes
  useEffect(() => {
    setSrc(publicUrl);
  }, [publicUrl]);

  return (
    <img
      src={src}
      alt={track.title}
      className="w-full h-full object-cover transform transition-transform duration-500 group-hover:scale-110"
      onError={() => {
        if (src !== FALLBACK) {
          setSrc(FALLBACK);
        }
      }}
    />
  );
}

export function TrackCard({ track, onSelect, searchCategory }: TrackCardProps) {
  const { user, accountType } = useUnifiedAuth();
  const navigate = useNavigate();
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showProducerProfile, setShowProducerProfile] = useState(false);
  const [producerUsage, setProducerUsage] = useState<{
    uses_loops?: boolean;
    uses_samples?: boolean;
    uses_splice?: boolean;
  } | null>(null);
  const isSyncOnly = track.isSyncOnly;

  // Get signed URL for audio
  const { signedUrl: audioSignedUrl, loading: audioLoading, error: audioError } = useSignedUrl('track-audio', track.audioUrl);

  useEffect(() => {
    if (user && track?.id) {
      checkFavoriteStatus();
    }
  }, [user, track?.id]);

  useEffect(() => {
    if (track?.producer?.id) {
      fetchProducerUsage();
    }
  }, [track?.producer?.id]);

  const fetchProducerUsage = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('uses_loops, uses_samples, uses_splice')
        .eq('id', track.producer?.id)
        .single();

      if (error) throw error;
      setProducerUsage(data);
    } catch (error) {
      console.error('Error fetching producer usage:', error);
    }
  };

  const checkFavoriteStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', user?.id)
        .eq('track_id', track.id)
        .maybeSingle();

      if (error) throw error;
      setIsFavorite(!!data);
    } catch (error) {
      console.error('Error checking favorite status:', error);
    }
  };

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user || loading) return;

    try {
      setLoading(true);

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
      setLoading(false);
    }
  };



  const handleProducerClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (track.producer?.id) {
      setShowProducerProfile(true);
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate(`/track/${track.id}`);
  };

  // Get border color based on search category
  const getBorderColor = () => {
    switch (searchCategory) {
      case 'exact':
        return 'border-green-500/40 hover:border-green-500/60';
      case 'partial':
        return 'border-yellow-500/40 hover:border-yellow-500/60';
      case 'other':
        return 'border-red-500/40 hover:border-red-500/60';
      default:
        return 'border-blue-500/20 hover:border-blue-500/40';
    }
  };

  return (
    <>
      <div 
        className={`group relative bg-white/5 backdrop-blur-sm rounded-lg border overflow-hidden transition-all duration-300 hover:shadow-lg cursor-pointer ${getBorderColor()}`}
        onClick={handleCardClick}
      >
        {/* Image Section */}
        <div className="relative aspect-square overflow-hidden">
          <TrackImage track={track} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-60 transition-opacity duration-300" />
          
          {/* Favorite Button */}
          {user && (
            <button
              onClick={toggleFavorite}
              disabled={loading}
              className="absolute top-2 right-2 p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors z-20 cursor-pointer"
              aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Star 
                className={`w-4 h-4 transition-colors ${
                  isFavorite ? 'text-yellow-400 fill-current' : 'text-white'
                }`}
              />
            </button>
          )}

          {/* Audio Player */}
          <div 
            className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity z-10"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <div className="p-3 rounded-full bg-blue-600/90 hover:bg-blue-600 transform transition-transform duration-300 hover:scale-110">
              <AudioPlayer
                src={audioSignedUrl || ''}
                title={track.title}
                size="sm"
                audioId={`track-${track.id}`}
              />
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-3 space-y-2">
          <div>
            <h3 className="text-sm font-bold text-white mb-0.5 truncate">{track.title}</h3>
          </div>

          {/* Track Details */}
          <div className="flex items-center justify-between text-xs text-gray-400">
            <div className="flex items-center">
              <Clock className="w-3 h-3 mr-1" />
              {formatDuration(track.duration)}
            </div>
            <div className="flex items-center">
              <Hash className="w-3 h-3 mr-1" />
              {track.bpm} BPM
            </div>
          </div>

          {/* Features */}
          <div className="flex flex-wrap gap-1.5 text-xs">
            {/* Sync Only Badge */}
            {isSyncOnly && (
              <div className="flex items-center text-purple-400 bg-purple-500/20 px-2 py-0.5 rounded-full">
                <Music className="w-3 h-3 mr-0.5" />
                <span>Sync Only</span>
              </div>
            )}
            
            {/* Vocals Badge */}
            {track.hasVocals && !isSyncOnly && (
              <div className="flex items-center text-purple-400">
                <Mic className="w-3 h-3 mr-0.5" />
                <span>Vocals</span>
              </div>
            )}
            
            {/* Explicit Lyrics Badge */}
            {track.explicit_lyrics && (
              <div className="flex items-center text-red-400 bg-red-500/20 px-2 py-0.5 rounded-full">
                <span className="font-bold mr-1">E</span>
                <span>Explicit</span>
              </div>
            )}
            
            {/* MP3 Only Badge - Show when MP3 exists but no trackouts/stems */}
            {track.audioUrl && !track.trackoutsUrl && !track.stemsUrl && (
              <div className="flex items-center text-yellow-400 bg-yellow-500/20 px-2 py-0.5 rounded-full">
                <FileMusic className="w-3 h-3 mr-0.5" />
                <span>MP3 Only</span>
              </div>
            )}
            

            
            {/* MP3 Badge - Show when MP3 exists and trackouts also exist */}
            {track.audioUrl && (track.trackoutsUrl || track.stemsUrl) && (
              <div className="flex items-center text-green-400">
                <FileMusic className="w-3 h-3 mr-0.5" />
                <span>MP3</span>
              </div>
            )}
            
            {/* Trackouts/Stems Badge */}
            {track.trackoutsUrl && (
              <div className="flex items-center text-blue-400">
                <Layers className="w-3 h-3 mr-0.5" />
                <span>Trackouts</span>
              </div>
            )}
            
            {/* Sting Ending Badge */}
            {track.hasStingEnding && (
              <div className="flex items-center text-orange-400">
                <Music className="w-3 h-3 mr-0.5" />
                <span>Sting Ending</span>
              </div>
            )}
          </div>

          {/* Track Clearance Badges */}
          <TrackClearanceBadges 
            containsLoops={track.containsLoops || false}
            containsSamples={track.containsSamples || false}
            containsSpliceLoops={track.containsSpliceLoops || false}
            samplesCleared={track.samplesCleared || false}
            className="text-xs"
          />

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                
                // Check if user is a producer and prevent licensing
                if (accountType && (accountType === 'producer' || accountType === 'admin,producer')) {
                  alert('Producers cannot license tracks. Please use a client account to license tracks.');
                  return;
                }
                
                navigate(`/track/${track.id}`);
              }}
              className={`py-1.5 px-3 rounded text-xs font-medium transition-all duration-300 ${
                isSyncOnly 
                  ? 'bg-purple-600 hover:bg-purple-700 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {isSyncOnly ? 'Submit Proposal' : 'License Track'}
            </button>
            
            {/* Producer Name in Bottom Right */}
            {track.producer && (
              <button
                onClick={handleProducerClick}
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors flex items-center"
              >
                <User className="w-3 h-3 mr-1" />
                {track.producer.firstName} {track.producer.lastName}
              </button>
            )}
          </div>

          {/* Producer Usage Badges */}
          {producerUsage && (producerUsage.uses_loops || producerUsage.uses_samples || producerUsage.uses_splice) && (
            <div className="pt-1">
              <ProducerUsageBadges 
                usesLoops={producerUsage.uses_loops || false}
                usesSamples={producerUsage.uses_samples || false}
                usesSplice={producerUsage.uses_splice || false}
                className="text-xs"
              />
            </div>
          )}
        </div>
      </div>

      {showProducerProfile && track.producer?.id && (
        <ProducerProfileDialog
          isOpen={showProducerProfile}
          onClose={() => setShowProducerProfile(false)}
          producerId={track.producer.id}
        />
      )}
    </>
  );
}
