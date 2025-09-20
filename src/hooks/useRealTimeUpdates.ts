import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useUnifiedAuth } from '../contexts/UnifiedAuthContext';

interface RealTimeConfig {
  tables: string[];
  filters?: Record<string, any>;
  onUpdate?: (payload: any) => void;
  onInsert?: (payload: any) => void;
  onDelete?: (payload: any) => void;
}

export function useRealTimeUpdates(config: RealTimeConfig) {
  const { user } = useUnifiedAuth();
  const channelRef = useRef<any>(null);

  const setupSubscription = useCallback(() => {
    if (!user?.id || !config.tables.length) return;

    // Clean up existing subscription
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    // Create new channel
    const channel = supabase.channel(`realtime-${user.id}-${Date.now()}`);

    // Add subscriptions for each table
    config.tables.forEach(table => {
      const filter = config.filters?.[table] || {};
      
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table,
          ...filter
        },
        (payload) => {
          console.log(`Real-time update for ${table}:`, payload);
          
          switch (payload.eventType) {
            case 'INSERT':
              config.onInsert?.(payload);
              break;
            case 'UPDATE':
              config.onUpdate?.(payload);
              break;
            case 'DELETE':
              config.onDelete?.(payload);
              break;
          }
        }
      );
    });

    // Subscribe to channel
    channel.subscribe((status) => {
      console.log(`Real-time subscription status: ${status}`);
    });

    channelRef.current = channel;
  }, [user?.id, config]);

  useEffect(() => {
    setupSubscription();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [setupSubscription]);

  return {
    channel: channelRef.current,
    reconnect: setupSubscription
  };
}

// Specific hooks for common use cases
export function useTracksRealTime(onUpdate: (payload: any) => void) {
  const { user } = useUnifiedAuth();
  
  return useRealTimeUpdates({
    tables: ['tracks'],
    filters: {
      tracks: user?.id ? { filter: `track_producer_id=eq.${user.id}` } : {}
    },
    onUpdate,
    onInsert: onUpdate,
    onDelete: onUpdate
  });
}

export function useSalesRealTime(onUpdate: (payload: any) => void) {
  const { user } = useUnifiedAuth();
  
  return useRealTimeUpdates({
    tables: ['sales'],
    filters: {
      sales: user?.id ? { filter: `buyer_id=eq.${user.id}` } : {}
    },
    onUpdate,
    onInsert: onUpdate,
    onDelete: onUpdate
  });
}

export function useSyncProposalsRealTime(onUpdate: (payload: any) => void) {
  const { user } = useUnifiedAuth();
  
  return useRealTimeUpdates({
    tables: ['sync_proposals'],
    filters: {
      sync_proposals: user?.id ? { filter: `client_id=eq.${user.id}` } : {}
    },
    onUpdate,
    onInsert: onUpdate,
    onDelete: onUpdate
  });
}

export function useCustomSyncRequestsRealTime(onUpdate: (payload: any) => void) {
  const { user } = useUnifiedAuth();
  
  return useRealTimeUpdates({
    tables: ['custom_sync_requests'],
    filters: {
      custom_sync_requests: user?.id ? { filter: `client_id=eq.${user.id}` } : {}
    },
    onUpdate,
    onInsert: onUpdate,
    onDelete: onUpdate
  });
}

export function useProducerProposalsRealTime(onUpdate: (payload: any) => void) {
  const { user } = useUnifiedAuth();
  
  return useRealTimeUpdates({
    tables: ['sync_proposals'],
    filters: {
      sync_proposals: user?.id ? { filter: `proposal_producer_id=eq.${user.id}` } : {}
    },
    onUpdate,
    onInsert: onUpdate,
    onDelete: onUpdate
  });
}

export function useProducerCustomSyncRealTime(onUpdate: (payload: any) => void) {
  const { user } = useUnifiedAuth();
  
  return useRealTimeUpdates({
    tables: ['custom_sync_requests'],
    filters: {
      custom_sync_requests: user?.id ? { filter: `selected_producer_id=eq.${user.id}` } : {}
    },
    onUpdate,
    onInsert: onUpdate,
    onDelete: onUpdate
  });
}

export function useProfileRealTime(onUpdate: (payload: any) => void) {
  const { user } = useUnifiedAuth();
  
  return useRealTimeUpdates({
    tables: ['profiles'],
    filters: {
      profiles: user?.id ? { filter: `id=eq.${user.id}` } : {}
    },
    onUpdate,
    onInsert: onUpdate,
    onDelete: onUpdate
  });
}

export function useProducerBalancesRealTime(onUpdate: (payload: any) => void) {
  const { user } = useUnifiedAuth();
  
  return useRealTimeUpdates({
    tables: ['producer_balances'],
    filters: {
      producer_balances: user?.id ? { filter: `balance_producer_id=eq.${user.id}` } : {}
    },
    onUpdate,
    onInsert: onUpdate,
    onDelete: onUpdate
  });
}

export function useAdminRealTime(onUpdate: (payload: any) => void) {
  return useRealTimeUpdates({
    tables: ['profiles', 'sales', 'sync_proposals', 'custom_sync_requests', 'tracks', 'white_label_clients'],
    onUpdate,
    onInsert: onUpdate,
    onDelete: onUpdate
  });
}
