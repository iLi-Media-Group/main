import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }

  const { email, password } = body;
  if (!email || !password) {
    return new Response(JSON.stringify({ error: 'Missing email or password' }), { status: 400 });
  }

  const supabaseAdminKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  console.log("SUPABASE_URL:", supabaseUrl);
  console.log("SUPABASE_SERVICE_ROLE_KEY (first 6):", (supabaseAdminKey || '').slice(0, 6));
  if (!supabaseAdminKey || !supabaseUrl) {
    return new Response(JSON.stringify({ error: 'Missing Supabase env vars' }), { status: 500 });
  }

  const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.39.7');
  const supabase = createClient(supabaseUrl, supabaseAdminKey);

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  console.log('User creation result:', data, error);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  }

  return new Response(JSON.stringify({ user: data.user }), { status: 200 });
}); 