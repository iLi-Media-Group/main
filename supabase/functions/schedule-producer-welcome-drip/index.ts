import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { user_id, email, first_name, account_type = 'producer' } = await req.json();
    
    console.log('Producer welcome drip request received:', { user_id, email, first_name, account_type });
    
    if (!user_id || !email) {
      console.error('User ID and email are required');
      return new Response("User ID and email are required", { 
        status: 400,
        headers: corsHeaders
      });
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Calculate next send time (Monday at 7pm)
    const now = new Date();
    const nextMonday = new Date(now);
    nextMonday.setDate(now.getDate() + (8 - now.getDay()) % 7); // Next Monday
    nextMonday.setHours(19, 0, 0, 0); // 7pm

    // If today is Monday and it's before 7pm, send today
    if (now.getDay() === 1 && now.getHours() < 19) {
      nextMonday.setDate(now.getDate());
    }

    console.log('Scheduling producer welcome drip for:', nextMonday);

    // Insert into producer_welcome_drip_subscriptions table
    const { data, error } = await supabase
      .from('producer_welcome_drip_subscriptions')
      .insert({
        user_id,
        email,
        first_name,
        account_type,
        current_week: 0,
        next_send_at: nextMonday.toISOString(),
        completed: false
      });

    if (error) {
      console.error('Error inserting producer drip subscription:', error);
      return new Response(`Error scheduling producer drip: ${error.message}`, { 
        status: 500,
        headers: corsHeaders
      });
    }

    console.log('Producer welcome drip scheduled successfully:', data);
    return new Response("Producer welcome drip scheduled!", { 
      status: 200,
      headers: corsHeaders
    });

  } catch (err) {
    console.error("Edge function error:", err);
    return new Response(`Error scheduling producer drip: ${err.message}`, { 
      status: 500,
      headers: corsHeaders
    });
  }
});
