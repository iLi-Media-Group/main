const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Helper function to expand search terms with synonyms
async function expandSearchTerms(searchTerms) {
  const expandedTerms = new Set();
  
  for (const term of searchTerms) {
    const lowerTerm = term.toLowerCase().trim();
    expandedTerms.add(lowerTerm);
    
    // Get synonyms from database
    const result = await pool.query(
      'SELECT synonyms FROM search_synonyms WHERE term = $1',
      [lowerTerm]
    );
    
    if (result.rows.length > 0) {
      result.rows[0].synonyms.forEach(synonym => {
        expandedTerms.add(synonym.toLowerCase());
      });
    }
    
    // Check if this term is a synonym of any main term
    const reverseResult = await pool.query(
      'SELECT term, synonyms FROM search_synonyms WHERE $1 = ANY(synonyms)',
      [lowerTerm]
    );
    
    if (reverseResult.rows.length > 0) {
      reverseResult.rows.forEach(row => {
        expandedTerms.add(row.term.toLowerCase());
        row.synonyms.forEach(synonym => {
          expandedTerms.add(synonym.toLowerCase());
        });
      });
    }
  }
  
  return Array.from(expandedTerms);
}

// Helper function to build search query
function buildSearchQuery(expandedTerms, limit = 20) {
  const terms = expandedTerms.map(term => `'${term}'`).join(',');
  
  return `
    SELECT 
      t.id,
      t.title,
      t.artist,
      t.genres_arr,
      t.sub_genres_arr,
      t.moods_arr,
      t.instruments_arr,
      t.media_usage_arr,
      t.bpm,
      t.duration,
      t.audio_url,
      t.image_url,
      t.has_sting_ending,
      t.is_one_stop,
      t.mp3_url,
      t.trackouts_url,
      t.stems_url,
      t.has_vocals,
      t.is_sync_only,
      t.track_producer_id,
      p.first_name,
      p.last_name,
      p.email,
      p.avatar_path,
      -- Calculate relevance score
      (
        CASE WHEN t.genres_arr && ARRAY[${terms}] THEN 3 ELSE 0 END +
        CASE WHEN t.sub_genres_arr && ARRAY[${terms}] THEN 2 ELSE 0 END +
        CASE WHEN t.moods_arr && ARRAY[${terms}] THEN 2 ELSE 0 END +
        CASE WHEN t.instruments_arr && ARRAY[${terms}] THEN 1 ELSE 0 END +
        CASE WHEN t.media_usage_arr && ARRAY[${terms}] THEN 3 ELSE 0 END +
        CASE WHEN t.title ILIKE ANY(ARRAY[${expandedTerms.map(t => `'%${t}%'`).join(',')}]) THEN 2 ELSE 0 END +
        CASE WHEN t.artist ILIKE ANY(ARRAY[${expandedTerms.map(t => `'%${t}%'`).join(',')}]) THEN 1 ELSE 0 END
      ) as relevance_score
    FROM tracks t
    LEFT JOIN profiles p ON t.track_producer_id = p.id
    WHERE t.deleted_at IS NULL 
      AND t.is_sync_only = false
      AND (
        t.genres_arr && ARRAY[${terms}] OR
        t.sub_genres_arr && ARRAY[${terms}] OR
        t.moods_arr && ARRAY[${terms}] OR
        t.instruments_arr && ARRAY[${terms}] OR
        t.media_usage_arr && ARRAY[${terms}] OR
        t.title ILIKE ANY(ARRAY[${expandedTerms.map(t => `'%${t}%'`).join(',')}]) OR
        t.artist ILIKE ANY(ARRAY[${expandedTerms.map(t => `'%${t}%'`).join(',')}])
      )
    ORDER BY relevance_score DESC, t.created_at DESC
    LIMIT ${limit}
  `;
}

// Helper function to get popular searches
async function getPopularSearches(limit = 10) {
  const result = await pool.query(`
    SELECT query, COUNT(*) as search_count
    FROM search_queries
    WHERE created_at >= NOW() - INTERVAL '30 days'
    GROUP BY query
    ORDER BY search_count DESC
    LIMIT $1
  `, [limit]);
  
  return result.rows;
}

// Helper function to get recent searches
async function getRecentSearches(limit = 10) {
  const result = await pool.query(`
    SELECT query, created_at
    FROM search_queries
    ORDER BY created_at DESC
    LIMIT $1
  `, [limit]);
  
  return result.rows;
}

// Main search endpoint
app.post('/api/search', async (req, res) => {
  try {
    const { query, userId, limit = 20 } = req.body;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Query is required and must be a string' });
    }
    
    // Log the search query
    await pool.query(
      'INSERT INTO search_queries (user_id, query) VALUES ($1, $2)',
      [userId || null, query]
    );
    
    // Parse search terms
    const searchTerms = query.toLowerCase().split(/\s+/).filter(term => term.length > 0);
    
    if (searchTerms.length === 0) {
      return res.json({
        tracks: [],
        popularSearches: await getPopularSearches(),
        recentSearches: await getRecentSearches(),
        searchStats: { totalResults: 0, searchTerms: [] }
      });
    }
    
    // Expand search terms with synonyms
    const expandedTerms = await expandSearchTerms(searchTerms);
    
    // Build and execute search query
    const searchQuery = buildSearchQuery(expandedTerms, limit);
    const result = await pool.query(searchQuery);
    
    // Format tracks
    const tracks = result.rows.map(row => ({
      id: row.id,
      title: row.title || 'Untitled',
      artist: row.first_name || row.email?.split('@')[0] || 'Unknown Artist',
      genres: row.genres_arr || [],
      subGenres: row.sub_genres_arr || [],
      moods: row.moods_arr || [],
      instruments: row.instruments_arr || [],
      mediaUsage: row.media_usage_arr || [],
      duration: row.duration || '3:30',
      bpm: row.bpm,
      audioUrl: row.audio_url,
      image: row.image_url || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop',
      hasStingEnding: row.has_sting_ending,
      isOneStop: row.is_one_stop,
      mp3Url: row.mp3_url,
      trackoutsUrl: row.trackouts_url,
      stemsUrl: row.stems_url,
      hasVocals: row.has_vocals || false,
      isSyncOnly: row.is_sync_only || false,
      producerId: row.track_producer_id || '',
      producer: row.track_producer_id ? {
        id: row.track_producer_id,
        firstName: row.first_name || '',
        lastName: row.last_name || '',
        email: row.email || '',
        avatarPath: row.avatar_path
      } : undefined,
      relevanceScore: row.relevance_score || 0
    }));
    
    // Get popular and recent searches
    const [popularSearches, recentSearches] = await Promise.all([
      getPopularSearches(),
      getRecentSearches()
    ]);
    
    res.json({
      tracks,
      popularSearches,
      recentSearches,
      searchStats: {
        totalResults: tracks.length,
        searchTerms: searchTerms,
        expandedTerms: expandedTerms,
        query: query
      }
    });
    
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`Search API server running on port ${PORT}`);
});

module.exports = app;
