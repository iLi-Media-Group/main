import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

function getNextMonday7pmUtc(now: Date = new Date()): string {
  // Compute next Monday 19:00 in America/New_York, then convert to UTC ISO string
  const nowEt = new Date(
    now.toLocaleString("en-US", { timeZone: "America/New_York" })
  );
  const day = nowEt.getDay(); // 0 Sun ... 1 Mon
  const daysUntilNextMonday = (8 - day) % 7 || 7; // at least next Monday
  const nextMonday = new Date(nowEt);
  nextMonday.setDate(nowEt.getDate() + daysUntilNextMonday);
  nextMonday.setHours(19, 0, 0, 0); // 7pm ET
  // Convert that ET time back to UTC by constructing with the ET components and TZ conversion
  const nextMondayEtString = nextMonday.toLocaleString("en-US", { timeZone: "America/New_York" });
  const nextMondayEt = new Date(nextMondayEtString);
  return new Date(nextMondayEt.getTime() + (now.getTime() - nowEt.getTime())).toISOString();
}

serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' } });
    }

    const { user_id, email, first_name } = await req.json();
    if (!user_id || !email) {
      return new Response("user_id and email are required", { status: 400 });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const nextSendAt = getNextMonday7pmUtc();

    const { error } = await supabase.from('client_welcome_drip_subscriptions').upsert({
      user_id,
      email,
      first_name,
      current_week: 0,
      next_send_at: nextSendAt,
      completed: false,
    }, { onConflict: 'user_id' });

    if (error) {
      console.error('schedule drip upsert error:', error);
      return new Response("Failed to schedule drip", { status: 500 });
    }

    return new Response(JSON.stringify({ next_send_at: nextSendAt }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('schedule drip error:', err);
    return new Response("Error", { status: 500 });
  }
});


