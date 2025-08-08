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
  const expanded = new Set(normalized);
  
  // Get synonyms for each term
  for (const term of normalized) {
    const { data: synonyms } = await supabase
      .from("search_synonyms")
      .select("term, synonyms")
      .or(`term.ilike.%${term}%,synonyms.cs.{${term}}`);
    
    if (synonyms) {
      for (const row of synonyms) {
        expanded.add(row.term.toLowerCase());
        row.synonyms.forEach((s: string) => expanded.add(s.toLowerCase()));
      }
    }
  }
  
  return Array.from(expanded);
}

// Helper function to calculate relevance score with fuzzy matching
function calculateRelevanceScore(track: any, searchTerms: string[]): number {
  let score = 0;
  const titleLower = track.title?.toLowerCase() || '';
  const artistLower = track.artist?.toLowerCase() || '';
  const genresLower = track.genres?.toLowerCase() || '';
  
  for (const term of searchTerms) {
    const termLower = term.toLowerCase();
    
    // Exact matches (highest priority)
    if (titleLower === termLower) score += 10;
    if (artistLower === termLower) score += 8;
    if (genresLower === termLower) score += 6;
    
    // Partial matches (medium priority)
    if (titleLower.includes(termLower)) score += 5;
    if (artistLower.includes(termLower)) score += 4;
    if (genresLower.includes(termLower)) score += 3;
    
    // Fuzzy matches (lower priority) - using simple similarity
    const titleSimilarity = calculateSimilarity(titleLower, termLower);
    const artistSimilarity = calculateSimilarity(artistLower, termLower);
    
    if (titleSimilarity > 0.3) score += titleSimilarity * 2;
    if (artistSimilarity > 0.3) score += artistSimilarity * 1.5;
  }
  
  return score;
}

// Simple similarity calculation (trigram-like)
function calculateSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) return 0;
  
  const words1 = str1.split(/\s+/);
  const words2 = str2.split(/\s+/);
  
  let matches = 0;
  for (const word1 of words1) {
    for (const word2 of words2) {
      if (word1.includes(word2) || word2.includes(word1)) {
        matches++;
      }
    }
  }
  
  return matches / Math.max(words1.length, words2.length);
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

    // Parse search terms
    const searchTerms = query.toLowerCase().split(/\s+/).map(t => t.trim()).filter(Boolean);
    
    // Expand terms with synonyms
    const expandedTerms = await expandWithSynonyms(searchTerms);
    const allSearchTerms = [...new Set([...searchTerms, ...expandedTerms])];
    
    console.log('Original terms:', searchTerms);
    console.log('Expanded terms:', expandedTerms);
    console.log('All search terms:', allSearchTerms);

    // Build search query with fuzzy matching
    let searchQuery = supabase.from("tracks").select("*");
    
    if (allSearchTerms.length > 0) {
      // Create conditions for exact, partial, and fuzzy matching
      const conditions = [];
      
      for (const term of allSearchTerms) {
        // Exact matches
        conditions.push(`title.ilike.${term}`);
        conditions.push(`artist.ilike.${term}`);
        conditions.push(`genres.ilike.${term}`);
        
        // Partial matches
        conditions.push(`title.ilike.%${term}%`);
        conditions.push(`artist.ilike.%${term}%`);
        conditions.push(`genres.ilike.%${term}%`);
      }
      
      searchQuery = searchQuery.or(conditions.join(','));
    }

    // Execute search
    const { data: results, error: searchError } = await searchQuery.limit(limit * 2); // Get more results for better ranking
    
    if (searchError) {
      console.error('Search error:', searchError);
      throw searchError;
    }

    console.log('Raw search results count:', results?.length || 0);

    // Calculate relevance scores with fuzzy matching
    const scoredResults = (results || []).map(track => ({
      ...track,
      relevance: calculateRelevanceScore(track, allSearchTerms)
    }));

    // Sort by relevance score (highest first)
    scoredResults.sort((a, b) => b.relevance - a.relevance);

    // Take top results
    const finalResults = scoredResults.slice(0, limit);

    console.log('Final results count:', finalResults.length);
    console.log('Top relevance scores:', finalResults.slice(0, 3).map(r => ({ title: r.title, score: r.relevance })));

    return new Response(JSON.stringify({
      ok: true,
      results: finalResults,
      meta: {
        count: finalResults.length,
        popularSearches: [],
        recentSearches: [],
        searchInfo: {
          originalTerms: searchTerms,
          expandedTerms: expandedTerms,
          totalTerms: allSearchTerms.length
        }
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
