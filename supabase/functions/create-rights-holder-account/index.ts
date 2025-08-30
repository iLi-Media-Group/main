import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { 
      email, 
      password_hash, 
      company_name, 
      contact_first_name, 
      contact_last_name, 
      rights_holder_type, 
      phone, 
      website, 
      additional_info, 
      rights_holder_number 
    } = await req.json();

    // Validate required fields
    if (!email || !password_hash || !company_name || !rights_holder_type) {
      throw new Error('Missing required fields: email, password_hash, company_name, or rights_holder_type');
    }

    // Create Supabase client with service role
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Check if user already exists
    const { data: existingUser } = await supabaseClient.auth.admin.listUsers();
    const userExists = existingUser.users.some(user => user.email === email);

    if (userExists) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'User already exists',
          email 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

    // For now, we'll create a temporary password and send it to the user
    // In a production environment, you might want to implement a more secure password recovery system
    const tempPassword = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    // Create the auth user
    const { data: userData, error: userError } = await supabaseClient.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        account_type: 'rights_holder',
        rights_holder_type: rights_holder_type,
        company_name: company_name
      }
    });

    if (userError) {
      throw new Error(`Failed to create user: ${userError.message}`);
    }

    if (!userData.user) {
      throw new Error('No user data returned');
    }

    // Create profile record
    const { error: profileError } = await supabaseClient
      .from('profiles')
      .insert({
        id: userData.user.id,
        email: email,
        first_name: contact_first_name,
        last_name: contact_last_name,
        account_type: 'rights_holder',
        verification_status: 'verified',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (profileError) {
      console.error('Profile creation error:', profileError);
      // Don't fail the entire process if profile creation fails
    }

    // Create rights holder record
    const { error: rightsHolderError } = await supabaseClient
      .from('rights_holders')
      .insert({
        id: userData.user.id,
        email: email,
        rights_holder_type: rights_holder_type,
        company_name: company_name,
        legal_entity_name: company_name, // Use company name as fallback
        phone: phone || null,
        website: website || null,
        verification_status: 'verified',
        is_active: true,
        terms_accepted: true,
        terms_accepted_at: new Date().toISOString(),
        rights_authority_declaration_accepted: true,
        rights_authority_declaration_accepted_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (rightsHolderError) {
      console.error('Rights holder creation error:', rightsHolderError);
      // Don't fail the entire process if rights holder creation fails
    }

    // Create rights holder profile record
    const { error: rightsHolderProfileError } = await supabaseClient
      .from('rights_holder_profiles')
      .insert({
        rights_holder_id: userData.user.id,
        contact_person_name: `${contact_first_name} ${contact_last_name}`,
        contact_person_email: email,
        contact_person_phone: phone || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (rightsHolderProfileError) {
      console.error('Rights holder profile creation error:', rightsHolderProfileError);
      // Don't fail the entire process if profile creation fails
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Rights holder account created successfully',
        user_id: userData.user.id,
        email: email,
        rights_holder_number: rights_holder_number
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Create rights holder account error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
