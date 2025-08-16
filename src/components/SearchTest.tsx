import React, { useState } from 'react';
import { useSearchAPI } from '../hooks/useSearchAPI';

export default function SearchTest() {
  const { search, loading, error, lastResults } = useSearchAPI();
  const [query, setQuery] = useState('jazzy energetic guitar');

  const handleTestSearch = async () => {
    try {
      await search({ query });
      console.log('Search successful:', lastResults);
    } catch (err) {
      console.error('Search failed:', err);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Search API Test</h2>
      
      <div className="mb-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full p-2 border rounded"
          placeholder="Enter search query..."
        />
      </div>
      
      <button
        onClick={handleTestSearch}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
      >
        {loading ? 'Searching...' : 'Test Search'}
      </button>

      {error && (
        <div className="mt-4 p-4 bg-red-100 border border-red-400 rounded">
          <strong>Error:</strong> {error}
        </div>
      )}

      {lastResults && (
        <div className="mt-6">
          <h3 className="text-xl font-semibold mb-4">
            Results ({lastResults.meta.count} tracks found)
          </h3>
          
          <div className="grid gap-4">
            {lastResults.results.map((track) => (
              <div key={track.id} className="p-4 border rounded">
                <h4 className="font-semibold">{track.title}</h4>
                <p className="text-gray-600">{track.artist}</p>
                <p className="text-sm text-gray-500">
                  Genres: {track.genres?.join(', ') || 'N/A'}
                </p>
                <p className="text-sm text-gray-500">
                  BPM: {track.bpm || 'N/A'}
                </p>
                {track.relevance !== undefined && (
                  <p className="text-sm text-blue-600">
                    Relevance Score: {track.relevance}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
