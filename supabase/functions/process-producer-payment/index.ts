import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const {
      withdrawalId,
      action, // 'approve' or 'reject'
      adminId,
      notes
    } = await req.json();

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get withdrawal details
    const { data: withdrawal, error: withdrawalError } = await supabaseClient
      .from('producer_withdrawals')
      .select(`
        id,
        withdrawal_producer_id,
        amount,
        status,
        payment_method_id,
        producer:profiles!withdrawal_producer_id (
          email,
          first_name,
          last_name
        )
      `)
      .eq('id', withdrawalId)
      .single();

    if (withdrawalError) throw withdrawalError;
    if (!withdrawal) throw new Error('Withdrawal not found');
    if (withdrawal.status !== 'pending') throw new Error('Withdrawal is not in pending status');

    // Check if admin is authorized
    const { data: adminData, error: adminError } = await supabaseClient
      .from('profiles')
      .select('email')
      .eq('id', adminId)
      .single();

    if (adminError) throw adminError;
    if (!['knockriobeats@gmail.com', 'info@mybeatfi.io', 'derykbanks@yahoo.com'].includes(adminData.email)) {
      throw new Error('Unauthorized access');
    }

    if (action === 'approve') {
      // Update withdrawal status
      const { error: updateError } = await supabaseClient
        .from('producer_withdrawals')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', withdrawalId);

      if (updateError) throw updateError;

      // Update transaction status
      const { error: transactionError } = await supabaseClient
        .from('producer_transactions')
        .update({ status: 'completed' })
        .eq('transaction_producer_id', withdrawal.withdrawal_producer_id)
        .eq('type', 'withdrawal')
        .eq('amount', -withdrawal.amount)
        .eq('status', 'pending');

      if (transactionError) throw transactionError;

      // Removed unsupported email notification code
    } else if (action === 'reject') {
      // Update withdrawal status
      const { error: updateError } = await supabaseClient
        .from('producer_withdrawals')
        .update({
          status: 'rejected',
          completed_at: new Date().toISOString()
        })
        .eq('id', withdrawalId);

      if (updateError) throw updateError;

      // Update transaction status
      const { error: transactionError } = await supabaseClient
        .from('producer_transactions')
        .update({ 
          status: 'rejected',
          description: `${withdrawal.description} (Rejected: ${notes || 'No reason provided'})`
        })
        .eq('transaction_producer_id', withdrawal.withdrawal_producer_id)
        .eq('type', 'withdrawal')
        .eq('amount', -withdrawal.amount)
        .eq('status', 'pending');

      if (transactionError) throw transactionError;

      // Return funds to producer balance
      const { data: balanceData, error: balanceError } = await supabaseClient
        .from('producer_balances')
        .select('available_balance')
        .eq('balance_producer_id', withdrawal.withdrawal_producer_id)
        .single();

      if (balanceError) throw balanceError;

      const { error: updateBalanceError } = await supabaseClient
        .from('producer_balances')
        .update({
          available_balance: balanceData.available_balance + withdrawal.amount
        })
        .eq('balance_producer_id', withdrawal.withdrawal_producer_id);

      if (updateBalanceError) throw updateBalanceError;

      // Removed unsupported email notification code
    } else {
      throw new Error('Invalid action');
    }

    return new Response(
      JSON.stringify({ message: `Withdrawal ${action === 'approve' ? 'approved' : 'rejected'} successfully` }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});
