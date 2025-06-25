import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

Deno.serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204 });
    }

    console.log('Testing database connection...');

    // Test 1: Check if we can read from stripe_subscriptions
    const { data: subscriptions, error: readError } = await supabase
      .from('stripe_subscriptions')
      .select('*')
      .limit(5);

    if (readError) {
      console.error('Read error:', readError);
      return new Response(JSON.stringify({ error: 'Read failed', details: readError }), { status: 500 });
    }

    console.log('Read successful, found', subscriptions?.length, 'subscriptions');

    // Test 2: Check table structure
    const { data: columns, error: columnError } = await supabase
      .rpc('get_table_columns', { table_name: 'stripe_subscriptions' })
      .single();

    if (columnError) {
      console.log('Could not get column info, trying direct query...');
      
      // Try a simple insert test
      const { error: insertError } = await supabase
        .from('stripe_subscriptions')
        .upsert({
          customer_id: 'test_customer_debug',
          subscription_id: 'sub_test_debug',
          price_id: 'price_test_debug',
          status: 'active',
          current_period_start: Math.floor(Date.now() / 1000),
          current_period_end: Math.floor(Date.now() / 1000) + 86400
        }, {
          onConflict: 'customer_id'
        });

      if (insertError) {
        console.error('Insert error:', insertError);
        return new Response(JSON.stringify({ 
          error: 'Insert failed', 
          details: insertError,
          readData: subscriptions 
        }), { status: 500 });
      }

      // Clean up test data
      await supabase
        .from('stripe_subscriptions')
        .delete()
        .eq('customer_id', 'test_customer_debug');

      return new Response(JSON.stringify({ 
        message: 'Database connection and insert test successful',
        readData: subscriptions 
      }));
    }

    return new Response(JSON.stringify({ 
      message: 'Database connection successful',
      columns,
      readData: subscriptions 
    }));

  } catch (error: any) {
    console.error('Error in test function:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}); 