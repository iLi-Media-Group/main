// Client-side example for MyBeatFi Search API

class MyBeatFiSearch {
  constructor(apiUrl, userId = null) {
    this.apiUrl = apiUrl;
    this.userId = userId;
  }

  // Search for tracks with natural language processing
  async searchTracks(query, limit = 20) {
    try {
      const response = await fetch(`${this.apiUrl}/api/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          userId: this.userId,
          limit
        })
      });

      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Search error:', error);
      throw error;
    }
  }

  // Health check
  async healthCheck() {
    try {
      const response = await fetch(`${this.apiUrl}/api/health`);
      return await response.json();
    } catch (error) {
      console.error('Health check failed:', error);
      throw error;
    }
  }

  // Display search results
  displayResults(results) {
    console.log('Search Results:', {
      totalResults: results.searchStats.totalResults,
      searchTerms: results.searchStats.searchTerms,
      expandedTerms: results.searchStats.expandedTerms
    });

    // Display tracks
    results.tracks.forEach((track, index) => {
      console.log(`${index + 1}. ${track.title} by ${track.artist}`);
      console.log(`   Genres: ${track.genres.join(', ')}`);
      console.log(`   Moods: ${track.moods.join(', ')}`);
      console.log(`   Instruments: ${track.instruments.join(', ')}`);
      console.log(`   Media Usage: ${track.mediaUsage.join(', ')}`);
      console.log(`   Relevance Score: ${track.relevanceScore}`);
      console.log('---');
    });

    // Display popular searches
    if (results.popularSearches.length > 0) {
      console.log('Popular Searches:');
      results.popularSearches.forEach(search => {
        console.log(`  - "${search.query}" (${search.search_count} searches)`);
      });
    }

    // Display recent searches
    if (results.recentSearches.length > 0) {
      console.log('Recent Searches:');
      results.recentSearches.forEach(search => {
        console.log(`  - "${search.query}" (${new Date(search.created_at).toLocaleString()})`);
      });
    }
  }
}

// Usage examples
async function exampleUsage() {
  const search = new MyBeatFiSearch('http://localhost:3001', 'user-123');

  // Health check
  try {
    const health = await search.healthCheck();
    console.log('API Health:', health);
  } catch (error) {
    console.error('API is not available');
    return;
  }

  // Example searches
  const searches = [
    'jazzy energetic guitar for tv commercials',
    'peaceful piano for meditation apps',
    'dramatic orchestral for movie trailers',
    'funky bass for restaurant background',
    'uplifting pop for social media'
  ];

  for (const query of searches) {
    console.log(`\n🔍 Searching for: "${query}"`);
    console.log('='.repeat(50));
    
    try {
      const results = await search.searchTracks(query);
      search.displayResults(results);
    } catch (error) {
      console.error(`Search failed for "${query}":`, error.message);
    }
    
    // Wait a bit between searches
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

// React/Vue integration example
function createSearchHook(apiUrl, userId) {
  return {
    async search(query, limit = 20) {
      const search = new MyBeatFiSearch(apiUrl, userId);
      return await search.searchTracks(query, limit);
    },

    async getHealth() {
      const search = new MyBeatFiSearch(apiUrl, userId);
      return await search.healthCheck();
    }
  };
}

// Example React hook usage
/*
import { useState, useEffect } from 'react';

function useMyBeatFiSearch(apiUrl, userId) {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const search = async (query) => {
    setLoading(true);
    setError(null);
    
    try {
      const searchHook = createSearchHook(apiUrl, userId);
      const results = await searchHook.search(query);
      setResults(results);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { search, results, loading, error };
}

// In your component:
function SearchComponent() {
  const { search, results, loading, error } = useMyBeatFiSearch(
    'http://localhost:3001',
    'user-123'
  );

  const handleSearch = (query) => {
    search(query);
  };

  return (
    <div>
      <input 
        type="text" 
        placeholder="Search for tracks..."
        onChange={(e) => handleSearch(e.target.value)}
      />
      
      {loading && <div>Searching...</div>}
      {error && <div>Error: {error}</div>}
      
      {results && (
        <div>
          <h3>Found {results.tracks.length} tracks</h3>
          {results.tracks.map(track => (
            <div key={track.id}>
              <h4>{track.title} by {track.artist}</h4>
              <p>Relevance: {track.relevanceScore}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
*/

// Run example if this file is executed directly
if (typeof window === 'undefined') {
  // Node.js environment
  exampleUsage().catch(console.error);
}
