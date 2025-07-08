const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://mybeatfi.io',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

import { serve } from 'https://deno.land/std@0.203.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const { email, password, display_name, first_name, last_name, ...otherFields } = await req.json()

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // 1. Create the Auth user
  const { data: user, error: userError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  })

  if (userError || !user?.user?.id) {
    return new Response(JSON.stringify({ error: userError?.message || 'Failed to create user' }), { status: 400, headers: corsHeaders })
  }

  const userId = user.user.id

  // 2. Insert into white_label_clients
  const { error: insertError } = await supabaseAdmin
    .from('white_label_clients')
    .insert([{
      owner_id: userId,
      email,
      display_name,
      first_name,
      last_name,
      ...otherFields
    }])

  if (insertError) {
    return new Response(JSON.stringify({ error: insertError.message }), { status: 400, headers: corsHeaders })
  }

  // 3. Send magic link (invite) email
  const { error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email)
  if (inviteError) {
    return new Response(JSON.stringify({ error: inviteError.message }), { status: 400, headers: corsHeaders })
  }

  return new Response(JSON.stringify({ success: true, userId }), { status: 200, headers: corsHeaders })
}) 