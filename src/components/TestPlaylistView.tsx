import React from 'react';
import { useParams } from 'react-router-dom';

export function TestPlaylistView() {
  const { slug } = useParams<{ slug: string }>();
  
  return (
    <div className="min-h-screen bg-blue-900 flex items-center justify-center">
      <div className="text-white text-2xl">
        Playlist Route Working! Slug: {slug}
      </div>
    </div>
  );
}
