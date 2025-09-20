import React from 'react';
import { useLocation } from 'react-router-dom';

export function TestPlaylistRoute() {
  const location = useLocation();
  const slug = location.pathname.replace('/test-playlist/', '');
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-4">Test Playlist Route</h1>
        <p className="text-2xl text-gray-300">Slug: {slug}</p>
        <p className="text-gray-400 mt-4">If you can see this, the route is working!</p>
      </div>
    </div>
  );
}
