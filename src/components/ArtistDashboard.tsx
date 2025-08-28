import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Plus, Music } from 'lucide-react';
import { PlaylistManager } from './PlaylistManager';

const ArtistDashboard: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Artist Dashboard</h1>
            <p className="text-xl text-gray-300 mt-2">
              Welcome to your artist dashboard
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <Link
              to="/producer/dashboard?dashboardType=artist"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              View Producer Dashboard
            </Link>
          </div>
        </div>

        {/* Playlists Section */}
        <div className="mb-8 bg-white/5 backdrop-blur-sm rounded-xl border border-purple-500/20 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Artist Playlists</h2>
            <Link
              to="/artist/playlists"
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Manage Playlists
            </Link>
          </div>
          <PlaylistManager accountType="artist_band" title="Artist Playlists" />
        </div>

        {/* Additional sections can be added here */}
        <div className="text-center py-8">
          <p className="text-gray-400">
            More artist-specific features coming soon...
          </p>
        </div>
      </div>
    </div>
  );
};

export default ArtistDashboard;
