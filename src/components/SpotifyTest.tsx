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
      if (!import.meta.env.VITE_SPOTIFY_CLIENT_ID || !import.meta.env.VITE_SPOTIFY_CLIENT_SECRET) {
        setTestResult('❌ Spotify credentials not configured\nPlease add VITE_SPOTIFY_CLIENT_ID and VITE_SPOTIFY_CLIENT_SECRET to your .env file');
        return;
      }

      setTestResult(prev => prev + '✅ Spotify credentials found\n');

      // Test 2: Try direct API call first
      setTestResult(prev => prev + '🔄 Testing direct API call...\n');
      
      const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
      const clientSecret = import.meta.env.VITE_SPOTIFY_CLIENT_SECRET;

      // Create the authorization header
      const authHeader = 'Basic ' + btoa(clientId + ':' + clientSecret);

      try {
        const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': authHeader
          },
          body: 'grant_type=client_credentials'
        });

        if (!tokenResponse.ok) {
          throw new Error(`Token request failed: ${tokenResponse.status} - ${tokenResponse.statusText}`);
        }

        const tokenData = await tokenResponse.json();
        setTestResult(prev => prev + '✅ Token request successful\n');

        // Test 3: Search for a track
        setTestResult(prev => prev + '🔍 Testing track search...\n');
        
        const searchResponse = await fetch(
          'https://api.spotify.com/v1/search?q=Bohemian%20Rhapsody%20artist:Queen&type=track&limit=1&market=US',
          {
            headers: {
              'Authorization': `Bearer ${tokenData.access_token}`
            }
          }
        );

        if (!searchResponse.ok) {
          throw new Error(`Search request failed: ${searchResponse.status} - ${searchResponse.statusText}`);
        }

        const searchData = await searchResponse.json();
        const track = searchData.tracks?.items[0];
        
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

      } catch (fetchError) {
        // If direct API call fails, try with CORS proxy
        setTestResult(prev => prev + '⚠️ Direct API call failed, trying CORS proxy...\n');
        
        const corsProxyUrl = 'https://cors-anywhere.herokuapp.com/';
        const tokenResponse = await fetch(corsProxyUrl + 'https://accounts.spotify.com/api/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': authHeader,
            'Origin': window.location.origin
          },
          body: 'grant_type=client_credentials'
        });

        if (!tokenResponse.ok) {
          throw new Error(`CORS proxy token request failed: ${tokenResponse.status}`);
        }

        const tokenData = await tokenResponse.json();
        setTestResult(prev => prev + '✅ CORS proxy token request successful\n');

        // Search with CORS proxy
        const searchResponse = await fetch(
          corsProxyUrl + 'https://api.spotify.com/v1/search?q=Bohemian%20Rhapsody%20artist:Queen&type=track&limit=1&market=US',
          {
            headers: {
              'Authorization': `Bearer ${tokenData.access_token}`,
              'Origin': window.location.origin
            }
          }
        );

        if (!searchResponse.ok) {
          throw new Error(`CORS proxy search failed: ${searchResponse.status}`);
        }

        const searchData = await searchResponse.json();
        const track = searchData.tracks?.items[0];
        
        if (track) {
          setTestResult(prev => prev + `✅ CORS proxy search successful\n📊 Track found: ${track.name} by ${track.artists[0]?.name}\n`);
          
          if (track.preview_url) {
            setTestResult(prev => prev + `🎵 Preview URL available: ${track.preview_url}\n`);
          } else {
            setTestResult(prev => prev + '⚠️ No preview URL available for this track\n');
          }
        } else {
          setTestResult(prev => prev + '⚠️ No tracks found in search\n');
        }

        setTestResult(prev => prev + '🎉 Spotify API integration test completed successfully (via CORS proxy)!');
      }

    } catch (error) {
      console.error('Spotify API test error:', error);
      setTestResult(prev => prev + `❌ Spotify API test failed: ${error.message}\n`);
      
      // Provide helpful debugging info
      if (error.message.includes('Failed to fetch')) {
        setTestResult(prev => prev + '\n💡 This is a CORS issue in development. The Spotify API should work in production.\n');
        setTestResult(prev => prev + '🌐 Try testing on your live site instead.\n');
      }
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