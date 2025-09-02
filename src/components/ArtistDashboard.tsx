import React from 'react';
import { ProducerDashboard } from './ProducerDashboard';
import { useSearchParams } from 'react-router-dom';

const ArtistDashboard: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Set dashboardType to artist if not already set
  React.useEffect(() => {
    if (searchParams.get('dashboardType') !== 'artist') {
      setSearchParams({ dashboardType: 'artist' });
    }
  }, [searchParams, setSearchParams]);

  return <ProducerDashboard />;
};

export default ArtistDashboard;
