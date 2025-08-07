import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Music, Search, Filter } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { TrackCard } from './TrackCard';
import { Track } from '../types';
import { parseArrayField } from '../lib/utils';

interface ProducerTracksPageProps {
  // This component will be used as a route component
}

export function ProducerTracksPage() {
  const { producerId } = useParams<{ producerId: string }>();
  const navigate = useNavigate();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [producer, setProducer] = useState<{
    firstName: string;
    lastName: string;
    email: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedMood, setSelectedMood] = useState('');

  useEffect(() => {
    if (producerId) {
      fetchProducerTracks();
      fetchProducerInfo();
    }
  }, [producerId]);

  const fetchProducerInfo = async () => {
    if (!producerId) return;

    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('first_name, last_name, email')
        .eq('id', producerId)
        .single();

      if (profileError) throw profileError;

      setProducer({
        firstName: profileData.first_name || '',
        lastName: profileData.last_name || '',
        email: profileData.email
      });
    } catch (err) {
      console.error('Error fetching producer info:', err);
    }
  };

  const fetchProducerTracks = async () => {
    if (!producerId) return;

    try {
      setLoading(true);
      setError(null);

      const { data: tracksData, error: tracksError } = await supabase
        .from('tracks')
        .select(`
          id,
          title,
          genres,
          moods,
          media_usage,
          bpm,
          audio_url,
          image_url,
          created_at,
          has_vocals,
          vocals_usage_type,
          is_sync_only,
          stems_url,
          split_sheet_url,
          mp3_url,
          trackouts_url,
          track_producer_id,
          producer:profiles!track_producer_id (
            id,
            first_name,
            last_name,
            email
          )
        `)
        .eq('track_producer_id', producerId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (tracksError) throw tracksError;

      const formattedTracks = tracksData.map(track => ({
        id: track.id,
        title: track.title || 'Untitled',
        artist: track.producer?.[0]?.first_name || 
                track.producer?.[0]?.email?.split('@')[0] || 
                'Unknown Artist',
        genres: parseArrayField(track.genres),
        subGenres: parseArrayField(track.sub_genres),
        moods: parseArrayField(track.moods),
        mediaUsage: parseArrayField(track.media_usage),
        bpm: track.bpm,
        key: track.key,
        audioUrl: track.audio_url,
        imageUrl: track.image_url,
        createdAt: track.created_at,
        hasVocals: track.has_vocals || false,
        isSyncOnly: track.is_sync_only || false,
        producerId: track.track_producer_id || '',
        producer: track.producer?.[0] ? {
          id: track.producer[0].id,
          firstName: track.producer[0].first_name || '',
          lastName: track.producer[0].last_name || '',
          email: track.producer[0].email || '',
        } : undefined,
        fileFormats: {
          stereoMp3: { format: ['MP3'], url: track.mp3_url || '' },
          stems: { format: ['WAV'], url: track.stems_url || '' },
          trackouts: { format: ['WAV'], url: track.trackouts_url || '' }
        },
        pricing: {
          stereoMp3: 0,
          stems: 0,
          stemsWithVocals: 0
        },
        leaseAgreementUrl: ''
      }));

      setTracks(formattedTracks);
    } catch (err) {
      console.error('Error fetching producer tracks:', err);
      setError('Failed to load tracks');
    } finally {
      setLoading(false);
    }
  };

  const filteredTracks = tracks.filter(track => {
    const matchesSearch = track.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         track.artist.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGenre = !selectedGenre || track.genres.includes(selectedGenre);
    const matchesMood = !selectedMood || track.moods.includes(selectedMood);
    
    return matchesSearch && matchesGenre && matchesMood;
  });

  const allGenres = Array.from(new Set(tracks.flatMap(track => track.genres)));
  const allMoods = Array.from(new Set(tracks.flatMap(track => track.moods)));

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center text-gray-300 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back
            </button>
            <div>
              <h1 className="text-3xl font-bold text-white">
                {producer ? `${producer.firstName} ${producer.lastName}` : 'Producer'} Tracks
              </h1>
              <p className="text-gray-400 mt-1">
                {filteredTracks.length} track{filteredTracks.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search tracks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/10 border border-purple-500/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            
            <select
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value)}
              className="px-4 py-2 bg-white/10 border border-purple-500/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">All Genres</option>
              {allGenres.map(genre => (
                <option key={genre} value={genre}>{genre}</option>
              ))}
            </select>

            <select
              value={selectedMood}
              onChange={(e) => setSelectedMood(e.target.value)}
              className="px-4 py-2 bg-white/10 border border-purple-500/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">All Moods</option>
              {allMoods.map(mood => (
                <option key={mood} value={mood}>{mood}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Tracks Grid */}
        {filteredTracks.length === 0 ? (
          <div className="text-center py-12">
            <Music className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">
              {searchTerm || selectedGenre || selectedMood 
                ? 'No tracks match your filters'
                : 'No tracks found for this producer'
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {filteredTracks.map((track) => (
              <TrackCard
                key={track.id}
                track={track}
                onSelect={() => {}}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
