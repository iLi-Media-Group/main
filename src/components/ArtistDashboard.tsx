import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const ArtistDashboard: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect artists to the producer dashboard since they use the same system
    // But we'll pass a flag to indicate it's an artist dashboard
    navigate('/producer/dashboard?dashboardType=artist', { replace: true });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto mb-4"></div>
        <p className="text-white text-lg">Redirecting to Artist Dashboard...</p>
      </div>
    </div>
  );
};

export default ArtistDashboard;
