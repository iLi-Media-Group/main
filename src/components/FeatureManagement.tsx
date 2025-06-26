import React, { useState, useEffect } from 'react';
import { Brain, Users, ToggleLeft, ToggleRight, Save, Loader2, CheckCircle, AlertCircle, DollarSign, Crown, BarChart3 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface WhiteLabelClient {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  company_name: string | null;
  created_at: string;
}

interface FeatureStatus {
  ai_recommendations: boolean;
  producer_applications: boolean;
  deep_media_search: boolean;
  advanced_analytics: boolean;
}

export function FeatureManagement() {
  const { user } = useAuth();
  const [clients, setClients] = useState<WhiteLabelClient[]>([]);
  const [featureStatuses, setFeatureStatuses] = useState<Record<string, FeatureStatus>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchWhiteLabelClients();
    }
  }, [user]);

  const fetchWhiteLabelClients = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch white label clients (users with white_label account type)
      const { data: clientData, error: clientError } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name, company_name, created_at')
        .eq('account_type', 'white_label')
        .order('created_at', { ascending: false });

      if (clientError) throw clientError;

      setClients(clientData || []);

      // Fetch feature statuses for each client
      const statuses: Record<string, FeatureStatus> = {};
      
      for (const client of clientData || []) {
        const { data: featureData, error: featureError } = await supabase
          .from('white_label_features')
          .select('feature_name, is_enabled')
          .eq('client_id', client.id);

        if (featureError) {
          console.error(`Error fetching features for client ${client.id}:`, featureError);
          continue;
        }

        statuses[client.id] = {
          ai_recommendations: featureData?.find(f => f.feature_name === 'ai_recommendations')?.is_enabled || false,
          producer_applications: featureData?.find(f => f.feature_name === 'producer_applications')?.is_enabled || false,
          deep_media_search: featureData?.find(f => f.feature_name === 'deep_media_search')?.is_enabled || false,
          advanced_analytics: featureData?.find(f => f.feature_name === 'advanced_analytics')?.is_enabled || false
        };
      }

      setFeatureStatuses(statuses);

    } catch (err) {
      console.error('Error fetching white label clients:', err);
      setError('Failed to load white label clients');
    } finally {
      setLoading(false);
    }
  };

  const formatFeatureName = (featureName: keyof FeatureStatus) => {
    return featureName.replace(/_/g, ' ');
  };

  const toggleFeature = async (clientId: string, featureName: keyof FeatureStatus) => {
    try {
      setSaving(prev => ({ ...prev, [clientId]: true }));
      setError(null);
      setSuccess(null);

      const newStatus = !featureStatuses[clientId]?.[featureName];
      
      // Update the local state immediately for better UX
      setFeatureStatuses(prev => ({
        ...prev,
        [clientId]: {
          ...prev[clientId],
          [featureName]: newStatus
        }
      }));

      // Call the database function to update the feature status
      const { error } = await supabase.rpc('update_feature_status', {
        target_client_id: clientId,
        feature_name: featureName,
        is_enabled: newStatus
      });

      if (error) throw error;

      setSuccess(`Feature ${formatFeatureName(featureName)} ${newStatus ? 'enabled' : 'disabled'} successfully`);

    } catch (err) {
      console.error('Error toggling feature:', err);
      setError('Failed to update feature status');
      
      // Revert the local state change on error
      setFeatureStatuses(prev => ({
        ...prev,
        [clientId]: {
          ...prev[clientId],
          [featureName]: !prev[clientId]?.[featureName]
        }
      }));
    } finally {
      setSaving(prev => ({ ...prev, [clientId]: false }));
    }
  };

  const getFeatureIcon = (featureName: keyof FeatureStatus) => {
    switch (featureName) {
      case 'ai_recommendations':
        return Brain;
      case 'producer_applications':
        return Users;
      case 'deep_media_search':
        return DollarSign;
      case 'advanced_analytics':
        return BarChart3;
      default:
        return Crown;
    }
  };

  const getFeatureDisplayName = (featureName: keyof FeatureStatus) => {
    switch (featureName) {
      case 'ai_recommendations':
        return 'AI Recommendations';
      case 'producer_applications':
        return 'Producer Applications';
      case 'deep_media_search':
        return 'Deep Media Search';
      case 'advanced_analytics':
        return 'Advanced Analytics';
    }
  };

  const getFeatureDescription = (featureName: keyof FeatureStatus) => {
    switch (featureName) {
      case 'ai_recommendations':
        return 'AI-powered search and recommendation system';
      case 'producer_applications':
        return 'Let producers apply to join your library';
      case 'deep_media_search':
        return 'Advanced media type tagging and filtering';
      case 'advanced_analytics':
        return 'Comprehensive analytics and reporting dashboard';
      default:
        return 'Premium feature for white label clients';
    }
  };

  const getFeaturePlan = (featureName: keyof FeatureStatus) => {
    switch (featureName) {
      case 'ai_recommendations':
        return 'Pro Plan';
      case 'producer_applications':
        return 'Pro Plan';
      case 'deep_media_search':
        return 'Enterprise Plan';
      case 'advanced_analytics':
        return 'Enterprise Plan';
      default:
        return 'Custom';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">White Label Feature Management</h2>
          <p className="text-gray-400">Control paid features for your white label clients</p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-400">
          <Crown className="w-4 h-4" />
          <span>Premium Features</span>
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <span className="text-red-400">{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center space-x-2">
          <CheckCircle className="w-5 h-5 text-green-400" />
          <span className="text-green-400">{success}</span>
        </div>
      )}

      {/* Feature Overview */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {(['ai_recommendations', 'producer_applications', 'deep_media_search', 'advanced_analytics'] as const).map((feature) => {
          const Icon = getFeatureIcon(feature);
          const enabledCount = Object.values(featureStatuses).filter(status => status?.[feature]).length;
          const totalCount = Object.keys(featureStatuses).length;
          
          return (
            <div key={feature} className="bg-white/5 backdrop-blur-sm rounded-xl border border-blue-500/20 p-4">
              <div className="flex items-center justify-between mb-3">
                <Icon className="w-6 h-6 text-blue-400" />
                <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">
                  {getFeaturePlan(feature)}
                </span>
              </div>
              <h3 className="font-semibold text-white mb-1">{getFeatureDisplayName(feature)}</h3>
              <p className="text-sm text-gray-400 mb-3">{getFeatureDescription(feature)}</p>
              <div className="text-sm text-gray-300">
                {enabledCount} of {totalCount} clients enabled
              </div>
            </div>
          );
        })}
      </div>

      {/* Client List */}
      {clients.length === 0 ? (
        <div className="text-center py-12 bg-white/5 backdrop-blur-sm rounded-xl border border-blue-500/20">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No White Label Clients</h3>
          <p className="text-gray-400">White label clients will appear here once they sign up</p>
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-white mb-4">Client Feature Settings</h3>
          
          {clients.map((client) => (
            <div
              key={client.id}
              className="bg-white/5 backdrop-blur-sm rounded-xl border border-blue-500/20 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-lg font-semibold text-white">
                    {client.company_name || client.first_name || client.email}
                  </h4>
                  <p className="text-sm text-gray-400">{client.email}</p>
                  <p className="text-xs text-gray-500">
                    Joined: {new Date(client.created_at).toLocaleDateString()}
                  </p>
                </div>
                {saving[client.id] && (
                  <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
                )}
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {(['ai_recommendations', 'producer_applications', 'deep_media_search', 'advanced_analytics'] as const).map((feature) => {
                  const Icon = getFeatureIcon(feature);
                  const isEnabled = featureStatuses[client.id]?.[feature] || false;
                  
                  return (
                    <div key={feature} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Icon className="w-5 h-5 text-blue-400" />
                        <div>
                          <div className="text-sm font-medium text-white">{getFeatureDisplayName(feature)}</div>
                          <div className="text-xs text-gray-400">{getFeaturePlan(feature)}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleFeature(client.id, feature)}
                        disabled={saving[client.id]}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 ${
                          isEnabled ? 'bg-blue-600' : 'bg-gray-600'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            isEnabled ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 