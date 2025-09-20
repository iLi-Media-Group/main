import { supabase } from './supabase';

export const fetchProducerEarnings = async (month: string, producerId: string) => {
  try {
    // Use regular client - RPC function should have proper RLS policies
    const { data, error } = await supabase.rpc(
      'calculate_producer_earnings',
      {
        month_input: month,
        producer_id_input: producerId
      }
    );

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching earnings:', error);
    throw new Error('Failed to fetch earnings data');
  }
};

// Usage example:
// const earnings = await fetchProducerEarnings('2023-12', 'producer-uuid-here');
