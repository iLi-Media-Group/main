import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_ANON_KEY")!
);

// Helper function to expand search terms with synonyms
async function expandWithSynonyms(terms: string[]): Promise<string[]> {
  if (!terms || terms.length === 0) return [];
  
  const normalized = terms.map(t => t.trim().toLowerCase()).filter(Boolean);
  
  const { data: synonyms } = await supabase
    .from("search_synonyms")
    .select("term, synonyms");
  
  const expanded = new Set(normalized);
  
  if (synonyms) {
    for (const row of synonyms) {
      if (normalized.includes(row.term.toLowerCase())) {
        expanded.add(row.term.toLowerCase());
        row.synonyms.forEach((s: string) => expanded.add(s.toLowerCase()));
      }
      // Also check if any of our terms are in the synonyms
      for (const term of normalized) {
        if (row.synonyms.includes(term)) {
          expanded.add(row.term.toLowerCase());
          row.synonyms.forEach((s: string) => expanded.add(s.toLowerCase()));
        }
      }
    }
  }
  
  return Array.from(expanded);
}

// Helper function to build relevance score
function calculateRelevance(track: any, searchTerms: string[], expandedGenres: string[], expandedMoods: string[], expandedUsage: string[]): number {
  let score = 0;
  
  // Title match (highest weight)
  const titleLower = track.title?.toLowerCase() || '';
  searchTerms.forEach(term => {
    if (titleLower.includes(term)) score += 3;
  });
  
  // Genre matches
  if (track.genres_arr && expandedGenres.length) {
    const genreMatches = track.genres_arr.filter((g: string) => 
      expandedGenres.includes(g.toLowerCase())
    ).length;
    score += genreMatches * 2;
  }
  
  // Mood matches
  if (track.moods_arr && expandedMoods.length) {
    const moodMatches = track.moods_arr.filter((m: string) => 
      expandedMoods.includes(m.toLowerCase())
    ).length;
    score += moodMatches * 2;
  }
  
  // Usage type matches
  if (track.media_usage_arr && expandedUsage.length) {
    const usageMatches = track.media_usage_arr.filter((u: string) => 
      expandedUsage.includes(u.toLowerCase())
    ).length;
    score += usageMatches * 1;
  }
  
  // Artist match
  const artistLower = track.artist?.toLowerCase() || '';
  searchTerms.forEach(term => {
    if (artistLower.includes(term)) score += 1;
  });
  
  return score;
}

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
    const { 
      query = '', 
      genres = [], 
      subgenres = [], 
      moods = [], 
      usageTypes = [],
      limit = 40 
    } = await req.json();

    // Parse and normalize search terms
    const searchTerms = query.toLowerCase().split(/\s+/).map(t => t.trim()).filter(Boolean);
    const genreTerms = genres.map(s => String(s).trim()).filter(Boolean);
    const subgenreTerms = subgenres.map(s => String(s).trim()).filter(Boolean);
    const moodTerms = moods.map(s => String(s).trim()).filter(Boolean);
    const usageTerms = usageTypes.map(s => String(s).trim()).filter(Boolean);

    // Expand terms with synonyms
    const [expandedGenres, expandedSubgenres, expandedMoods, expandedUsage] = await Promise.all([
      expandWithSynonyms(genreTerms),
      expandWithSynonyms(subgenreTerms),
      expandWithSynonyms(moodTerms),
      expandWithSynonyms(usageTerms),
    ]);

    // Build search conditions
    let searchQuery = supabase.from("tracks").select("*");
    
    // AND-first logic: require all provided criteria to match
    const andConditions = [];
    
    if (expandedGenres.length > 0) {
      andConditions.push(`genres_arr.ov.{${expandedGenres.join(',')}}`);
    }
    
    if (expandedSubgenres.length > 0) {
      andConditions.push(`sub_genres_arr.ov.{${expandedSubgenres.join(',')}}`);
    }
    
    if (expandedMoods.length > 0) {
      andConditions.push(`moods_arr.ov.{${expandedMoods.join(',')}}`);
    }
    
    if (expandedUsage.length > 0) {
      andConditions.push(`media_usage_arr.ov.{${expandedUsage.join(',')}}`);
    }
    
    // Text search conditions
    if (searchTerms.length > 0) {
      const textConditions = searchTerms.map(term => 
        `or(title.ilike.%${term}%,artist.ilike.%${term}%)`
      ).join(',');
      andConditions.push(`(${textConditions})`);
    }

    // Apply AND conditions
    if (andConditions.length > 0) {
      searchQuery = searchQuery.or(andConditions.join(','));
    }

    // Execute strict search
    let { data: strictResults, error: strictError } = await searchQuery.limit(limit);
    
    if (strictError) throw strictError;

    // If not enough results, run OR fallback
    const MIN_RESULTS = 20;
    if ((strictResults || []).length < MIN_RESULTS) {
      const orConditions = [];
      
      // Build OR conditions for each category
      if (expandedGenres.length > 0) {
        orConditions.push(`genres_arr.ov.{${expandedGenres.join(',')}}`);
      }
      
      if (expandedSubgenres.length > 0) {
        orConditions.push(`sub_genres_arr.ov.{${expandedSubgenres.join(',')}}`);
      }
      
      if (expandedMoods.length > 0) {
        orConditions.push(`moods_arr.ov.{${expandedMoods.join(',')}}`);
      }
      
      if (expandedUsage.length > 0) {
        orConditions.push(`media_usage_arr.ov.{${expandedUsage.join(',')}}`);
      }
      
      if (searchTerms.length > 0) {
        const textConditions = searchTerms.map(term => 
          `or(title.ilike.%${term}%,artist.ilike.%${term}%)`
        ).join(',');
        orConditions.push(`(${textConditions})`);
      }

      if (orConditions.length > 0) {
        const { data: orResults, error: orError } = await supabase
          .from("tracks")
          .select("*")
          .or(orConditions.join(','))
          .limit(limit);
          
        if (orError) throw orError;
        
        // Merge results, keeping strict results first
        const strictIds = new Set(strictResults?.map(r => r.id) || []);
        const additionalResults = orResults?.filter(r => !strictIds.has(r.id)) || [];
        strictResults = [...(strictResults || []), ...additionalResults].slice(0, limit);
      }
    }

    // Calculate relevance scores
    const scoredResults = (strictResults || []).map(track => ({
      ...track,
      relevance: calculateRelevance(track, searchTerms, expandedGenres, expandedMoods, expandedUsage)
    }));

    // Sort by relevance score
    scoredResults.sort((a, b) => b.relevance - a.relevance);

    // Log search query
    await supabase.from("search_queries").insert({
      user_id: null, // Anonymous search
      query: query,
      genres: expandedGenres.length > 0 ? expandedGenres : null,
      subgenres: expandedSubgenres.length > 0 ? expandedSubgenres : null,
      moods: expandedMoods.length > 0 ? expandedMoods : null,
      media_usage_types: expandedUsage.length > 0 ? expandedUsage : null
    });

    // Get popular and recent searches
    const { data: popularSearches } = await supabase
      .from("search_queries")
      .select("query, count")
      .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .group("query")
      .order("count", { ascending: false })
      .limit(10);

    const { data: recentSearches } = await supabase
      .from("search_queries")
      .select("query")
      .order("created_at", { ascending: false })
      .limit(10);

    return new Response(JSON.stringify({
      ok: true,
      results: scoredResults,
      meta: {
        count: scoredResults.length,
        popularSearches: popularSearches || [],
        recentSearches: (recentSearches || []).map(r => r.query)
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
    console.error('Search error:', err);
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
