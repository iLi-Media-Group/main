import React, { useState, useEffect } from 'react';
import { User, Music, Layers, Zap, Save, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { ProducerUsageBadges } from './ProducerUsageBadges';

interface Producer {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  uses_loops: boolean;
  uses_samples: boolean;
  uses_splice: boolean;
}

interface ProducerBadgeManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProducerBadgeManager({ isOpen, onClose }: ProducerBadgeManagerProps) {
  const [producers, setProducers] = useState<Producer[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchProducers();
    }
  }, [isOpen]);

  const fetchProducers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, uses_loops, uses_samples, uses_splice')
        .eq('account_type', 'producer')
        .order('first_name', { ascending: true });

      if (error) throw error;
      setProducers(data || []);
    } catch (err) {
      console.error('Error fetching producers:', err);
      setError('Failed to load producers');
    } finally {
      setLoading(false);
    }
  };

  const updateProducerBadges = async (producerId: string, badges: {
    uses_loops: boolean;
    uses_samples: boolean;
    uses_splice: boolean;
  }) => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from('profiles')
        .update(badges)
        .eq('id', producerId);

      if (error) throw error;

      // Update local state
      setProducers(prev => prev.map(producer => 
        producer.id === producerId 
          ? { ...producer, ...badges }
          : producer
      ));

      setSuccess('Producer badges updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error updating producer badges:', err);
      setError('Failed to update producer badges');
      setTimeout(() => setError(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-blue-900/90 backdrop-blur-md p-6 rounded-xl border border-purple-500/20 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Producer Badge Manager</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg mb-4">
            <p className="text-red-400 text-center">{error}</p>
          </div>
        )}

        {success && (
          <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg mb-4">
            <p className="text-green-400 text-center">{success}</p>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {producers.map((producer) => (
              <ProducerBadgeCard
                key={producer.id}
                producer={producer}
                onUpdate={updateProducerBadges}
                saving={saving}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface ProducerBadgeCardProps {
  producer: Producer;
  onUpdate: (producerId: string, badges: {
    uses_loops: boolean;
    uses_samples: boolean;
    uses_splice: boolean;
  }) => Promise<void>;
  saving: boolean;
}

function ProducerBadgeCard({ producer, onUpdate, saving }: ProducerBadgeCardProps) {
  const [badges, setBadges] = useState({
    uses_loops: producer.uses_loops,
    uses_samples: producer.uses_samples,
    uses_splice: producer.uses_splice
  });

  const handleBadgeToggle = async (badgeType: keyof typeof badges) => {
    const newBadges = {
      ...badges,
      [badgeType]: !badges[badgeType]
    };
    setBadges(newBadges);
    await onUpdate(producer.id, newBadges);
  };

  return (
    <div className="bg-blue-950/40 rounded-lg border border-blue-700/30 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-600/20 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-blue-300" />
          </div>
          <div>
            <h3 className="text-white font-medium">
              {producer.first_name} {producer.last_name}
            </h3>
            <p className="text-gray-400 text-sm">{producer.email}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h4 className="text-sm font-medium text-gray-300 mb-3">Current Badges</h4>
          <ProducerUsageBadges 
            usesLoops={badges.uses_loops}
            usesSamples={badges.uses_samples}
            usesSplice={badges.uses_splice}
          />
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-300 mb-3">Manage Badges</h4>
          <div className="space-y-2">
            <label className="flex items-center space-x-2 text-gray-300">
              <input
                type="checkbox"
                checked={badges.uses_loops}
                onChange={() => handleBadgeToggle('uses_loops')}
                disabled={saving}
                className="w-4 h-4 text-blue-600 bg-blue-950/60 border-blue-700 rounded focus:ring-blue-500 focus:ring-2"
              />
              <Music className="w-4 h-4 text-blue-400" />
              <span>Uses Loops</span>
            </label>

            <label className="flex items-center space-x-2 text-gray-300">
              <input
                type="checkbox"
                checked={badges.uses_samples}
                onChange={() => handleBadgeToggle('uses_samples')}
                disabled={saving}
                className="w-4 h-4 text-purple-600 bg-blue-950/60 border-blue-700 rounded focus:ring-purple-500 focus:ring-2"
              />
              <Layers className="w-4 h-4 text-purple-400" />
              <span>Uses Samples</span>
            </label>

            <label className="flex items-center space-x-2 text-gray-300">
              <input
                type="checkbox"
                checked={badges.uses_splice}
                onChange={() => handleBadgeToggle('uses_splice')}
                disabled={saving}
                className="w-4 h-4 text-orange-600 bg-blue-950/60 border-blue-700 rounded focus:ring-orange-500 focus:ring-2"
              />
              <Zap className="w-4 h-4 text-orange-400" />
              <span>Uses Splice</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
