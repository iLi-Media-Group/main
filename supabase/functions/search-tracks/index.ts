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
    
    // Simple search - just get all tracks
    const { data: results, error: searchError } = await supabase
      .from("tracks")
      .select("*")
      .limit(10);
    
    if (searchError) {
      console.error('Search error:', searchError);
      throw searchError;
    }

    console.log('Search results count:', results?.length || 0);

    // Add simple relevance scores
    const scoredResults = (results || []).map(track => ({
      ...track,
      relevance: Math.floor(Math.random() * 10) // Random score for now
    }));

    return new Response(JSON.stringify({
      ok: true,
      results: scoredResults,
      meta: {
        count: scoredResults.length,
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
      error: err.message || String(err)
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
