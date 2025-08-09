import React, { useState, useEffect } from 'react';

interface VideoBackgroundProps {
  videoUrl: string;
  fallbackImage: string;
  alt?: string;
}

export function VideoBackground({ videoUrl, fallbackImage, alt = "Background video" }: VideoBackgroundProps) {
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [isVideoError, setIsVideoError] = useState(false);

  const handleVideoLoad = () => {
    setIsVideoLoaded(true);
  };

  const handleVideoError = () => {
    setIsVideoError(true);
  };

  return (
    <div className="absolute inset-0 w-full h-full">
      {!isVideoError ? (
        <video
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover"
          onLoadedData={handleVideoLoad}
          onError={handleVideoError}
          style={{ 
            opacity: isVideoLoaded ? 1 : 0, 
            transition: 'opacity 1.5s ease-in-out' 
          }}
        >
          <source src={videoUrl} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      ) : (
        <div 
          className="w-full h-full bg-cover bg-center"
          style={{
            backgroundImage: `url(${fallbackImage})`
          }}
        />
      )}
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/70"></div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40"></div>
    </div>
  );
}
