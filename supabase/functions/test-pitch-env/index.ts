import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400',
  'Access-Control-Allow-Credentials': 'true',
}

serve(async (req) => {
  console.log('Test pitch env function called with method:', req.method)

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS preflight request')
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    })
  }

  try {
    // Check pitch environment variables
    const pitchMonthly = Deno.env.get('PITCH_MONTHLY_PRICE_ID')
    const pitchAnnual = Deno.env.get('PITCH_ANNUAL_PRICE_ID')
    const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')

    const envStatus = {
      pitchMonthly: pitchMonthly || 'NOT SET',
      pitchAnnual: pitchAnnual || 'NOT SET',
      stripeSecret: stripeSecret ? 'SET' : 'NOT SET',
      supabaseUrl: supabaseUrl ? 'SET' : 'NOT SET',
      timestamp: new Date().toISOString()
    }

    console.log('Environment variables status:', envStatus)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Pitch environment variables check',
        envStatus: envStatus
      }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Test pitch env function error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to check pitch environment variables' 
      }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
