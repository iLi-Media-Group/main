import React, { useState } from 'react';
import { spotifyAPI } from '../lib/spotify';

export function SpotifyTest() {
  const [testResult, setTestResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testSpotifyAPI = async () => {
    setLoading(true);
    setTestResult('Testing Spotify API...\n');

    try {
      // Test 1: Check credentials
      if (!process.env.REACT_APP_SPOTIFY_CLIENT_ID || !process.env.REACT_APP_SPOTIFY_CLIENT_SECRET) {
        setTestResult('❌ Spotify credentials not configured\nPlease add REACT_APP_SPOTIFY_CLIENT_ID and REACT_APP_SPOTIFY_CLIENT_SECRET to your .env file');
        return;
      }

      setTestResult(prev => prev + '✅ Spotify credentials found\n');

      // Test 2: Get access token
      setTestResult(prev => prev + '🔄 Testing token request...\n');
      const token = await spotifyAPI['getAccessToken']();
      setTestResult(prev => prev + '✅ Token request successful\n');

      // Test 3: Search for a track
      setTestResult(prev => prev + '🔍 Testing track search...\n');
      const track = await spotifyAPI.searchTrack('Bohemian Rhapsody', 'Queen');
      
      if (track) {
        setTestResult(prev => prev + `✅ Track search successful\n📊 Track found: ${track.name} by ${track.artists[0]?.name}\n`);
        
        if (track.preview_url) {
          setTestResult(prev => prev + `🎵 Preview URL available: ${track.preview_url}\n`);
        } else {
          setTestResult(prev => prev + '⚠️ No preview URL available for this track\n');
        }
      } else {
        setTestResult(prev => prev + '⚠️ No tracks found in search\n');
      }

      setTestResult(prev => prev + '🎉 Spotify API integration test completed successfully!');

    } catch (error) {
      setTestResult(prev => prev + `❌ Spotify API test failed: ${error}\n`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-800 rounded-lg">
      <h2 className="text-xl font-bold mb-4 text-white">Spotify API Test</h2>
      
      <button
        onClick={testSpotifyAPI}
        disabled={loading}
        className="mb-4 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded transition-colors"
      >
        {loading ? 'Testing...' : 'Test Spotify API'}
      </button>

      {testResult && (
        <div className="bg-gray-900 p-4 rounded text-sm font-mono text-green-400 whitespace-pre-wrap">
          {testResult}
        </div>
      )}
    </div>
  );
} 