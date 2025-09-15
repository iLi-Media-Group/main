import React, { useState, useEffect } from 'react';
import { X, MapPin, Music } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ProfilePhotoUpload } from './ProfilePhotoUpload';
import { ProducerUsageBadges } from './ProducerUsageBadges';
import { ProducerFollowButton } from './ProducerFollowButton';
import { PitchCheckmark } from './PitchCheckmark';

interface ProducerProfileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  producerId: string;
}

interface ProducerProfile {
  first_name: string | null;
  last_name: string | null;
  email: string;
  bio: string | null;
  avatar_path: string | null;
  show_location: boolean;
  city: string | null;
  state: string | null;
  company_name: string | null;
  producer_number: string | null;
  ipi_number: string | null;
  performing_rights_org: string | null;
  uses_loops?: boolean;
  uses_samples?: boolean;
  uses_splice?: boolean;
  stats?: {
    totalTracks: number;
  };
}

export function ProducerProfileDialog({ isOpen, onClose, producerId }: ProducerProfileDialogProps) {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProducerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && producerId) {
      fetchProducerProfile();
    }
  }, [isOpen, producerId]);

  const fetchProducerProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch profile data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select(`
          id,
          first_name,
          last_name,
          email,
          bio,
          avatar_path,
          show_location,
          city,
          state,
          company_name,
          producer_number,
          ipi_number,
          performing_rights_org,
          uses_loops,
          uses_samples,
          uses_splice
        `)
        .eq('id', producerId)
        .single();

      if (profileError) throw profileError;

      // Fetch track count
      const { count: trackCount, error: tracksError } = await supabase
        .from('tracks')
        .select('id', { count: 'exact' })
        .eq('track_producer_id', producerId)
        .is('deleted_at', null);

      if (tracksError) throw tracksError;

      // Set profile with stats
      setProfile({
        ...profileData,
        stats: {
          totalTracks: trackCount || 0
        }
      });
    } catch (err) {
      console.error('Error fetching producer profile:', err);
      setError('Failed to load producer profile');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-blue-900/90 backdrop-blur-md p-6 rounded-xl border border-purple-500/20 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Producer Profile</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {error ? (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-400 text-center">{error}</p>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
          </div>
        ) : profile && (
          <div className="space-y-6">
            <div className="flex items-center space-x-6">
              <div className="flex-shrink-0">
                <ProfilePhotoUpload
                  currentPhotoUrl={profile.avatar_path}
                  onPhotoUpdate={() => {}}
                  size="lg"
                  userId={producerId}
                />
              </div>
              
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-white flex items-center">
                  {profile.first_name} {profile.last_name}
                  <PitchCheckmark userId={producerId} />
                </h3>
                {profile.company_name && (
                  <p className="text-gray-400">{profile.company_name}</p>
                )}
                {profile.show_location && profile.city && profile.state && (
                  <p className="text-gray-400 flex items-center mt-2">
                    <MapPin className="w-4 h-4 mr-1" />
                    {profile.city}, {profile.state}
                  </p>
                )}
                {profile.producer_number && (
                  <p className="text-sm text-gray-500 mt-1">
                    Producer ID: {profile.producer_number}
                  </p>
                )}
              </div>
              
              <div className="flex-shrink-0">
                <ProducerFollowButton
                  producerId={producerId}
                  producerName={`${profile.first_name} ${profile.last_name}`.trim() || 'Producer'}
                />
              </div>
            </div>

            {profile.bio && (
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-gray-300 whitespace-pre-wrap">{profile.bio}</p>
              </div>
            )}

            {/* Production Tools Badges */}
            {(profile.uses_loops || profile.uses_samples || profile.uses_splice) && (
              <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg p-4 border border-blue-500/20">
                <h4 className="text-lg font-semibold text-white mb-3">Production Tools</h4>
                <ProducerUsageBadges 
                  usesLoops={profile.uses_loops || false}
                  usesSamples={profile.uses_samples || false}
                  usesSplice={profile.uses_splice || false}
                />
              </div>
            )}

            {/* Credit Information */}
            {(profile.ipi_number || profile.performing_rights_org) && (
              <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-lg p-4 border border-purple-500/20">
                <h4 className="text-lg font-semibold text-white mb-3 flex items-center">
                  <Music className="w-5 h-5 mr-2 text-purple-400" />
                  Credit Information
                </h4>
                <div className="space-y-2">
                  {profile.performing_rights_org && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-sm">PRO Affiliation:</span>
                      <span className="text-white font-medium">{profile.performing_rights_org}</span>
                    </div>
                  )}
                  {profile.ipi_number && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-sm">IPI Number:</span>
                      <span className="text-white font-mono text-sm">{profile.ipi_number}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div 
              className="bg-white/5 rounded-lg p-4 text-center max-w-xs mx-auto cursor-pointer hover:bg-white/10 hover:border-green-500/30 border border-transparent transition-all duration-200"
              onClick={() => {
                onClose();
                navigate(`/producer/${producerId}/tracks`);
              }}
              title="Click to view producer's track portfolio"
            >
              <Music className="w-6 h-6 text-purple-400 mx-auto mb-2 hover:text-green-300 transition-colors" />
              <p className="text-2xl font-bold text-white hover:text-green-100 transition-colors">{profile.stats?.totalTracks}</p>
              <p className="text-sm text-gray-400 hover:text-green-200 transition-colors">Tracks</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
