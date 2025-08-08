import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_ANON_KEY")!
);

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  try {
    console.log('Search function called');
    
    const body = await req.json();
    console.log('Request body:', body);
    
    const { 
      query = '', 
      genres = [], 
      subgenres = [], 
      moods = [], 
      usageTypes = [],
      limit = 40 
    } = body;

    console.log('Parsed parameters:', { query, genres, subgenres, moods, usageTypes, limit });

    // Simple test query first
    const { data: testResults, error: testError } = await supabase
      .from("tracks")
      .select("*")
      .limit(5);

    console.log('Test query results:', testResults?.length || 0);
    if (testError) {
      console.error('Test query error:', testError);
      throw testError;
    }

    // For now, return a simple response
    return new Response(JSON.stringify({
      ok: true,
      results: testResults || [],
      meta: {
        count: testResults?.length || 0,
        popularSearches: [],
        recentSearches: []
      }
    }), {
      status: 200,
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });

  } catch (err) {
    console.error('Search function error:', err);
    return new Response(JSON.stringify({ 
      ok: false, 
      error: err.message || String(err),
      stack: err.stack
    }), {
      status: 500,
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }
});
