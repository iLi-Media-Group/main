import React, { useState, useEffect } from 'react';
import { Play, Search, ArrowRight, Music, Video, Mic } from 'lucide-react';

interface HeroSectionProps {
  onSearch?: (filters: any) => void;
}

export function HeroSection({ onSearch }: HeroSectionProps) {
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [isVideoError, setIsVideoError] = useState(false);

  // Video options - you can easily swap these
  const videoOptions = [
    {
      url: 'https://player.vimeo.com/external/434045526.sd.mp4?s=c27eecc69a27dbc4ff2b87d38afc35f1a9e7c02d&profile_id=164&oauth2_token_id=57447761',
      fallback: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=1920&q=80'
    },
    {
      url: 'https://player.vimeo.com/external/434045526.sd.mp4?s=c27eecc69a27dbc4ff2b87d38afc35f1a9e7c02d&profile_id=164&oauth2_token_id=57447761',
      fallback: 'https://images.unsplash.com/photo-1598653222000-6b7b7a552625?auto=format&fit=crop&w=1920&q=80'
    }
  ];

  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);

  useEffect(() => {
    // Cycle through videos every 10 seconds
    const interval = setInterval(() => {
      setCurrentVideoIndex((prev) => (prev + 1) % videoOptions.length);
    }, 10000);

    return () => clearInterval(interval);
  }, [videoOptions.length]);

  const handleVideoLoad = () => {
    setIsVideoLoaded(true);
  };

  const handleVideoError = () => {
    setIsVideoError(true);
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Video */}
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
            style={{ opacity: isVideoLoaded ? 1 : 0 }}
          >
            <source src={videoOptions[currentVideoIndex].url} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        ) : (
          <div 
            className="w-full h-full bg-cover bg-center"
            style={{
              backgroundImage: `url(${videoOptions[currentVideoIndex].fallback})`
            }}
          />
        )}
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/70"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-6xl mx-auto">
        {/* Animated Icons */}
        <div className="flex justify-center mb-8 space-x-8">
          <div className="group">
            <div className="w-16 h-16 bg-blue-500/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-blue-500/30 group-hover:border-blue-400/60 transition-all duration-300 group-hover:scale-110">
              <Music className="w-8 h-8 text-blue-400 group-hover:text-blue-300 transition-colors" />
            </div>
            <p className="text-sm text-gray-300 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">Music</p>
          </div>
          
          <div className="group">
            <div className="w-16 h-16 bg-purple-500/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-purple-500/30 group-hover:border-purple-400/60 transition-all duration-300 group-hover:scale-110">
              <Video className="w-8 h-8 text-purple-400 group-hover:text-purple-300 transition-colors" />
            </div>
            <p className="text-sm text-gray-300 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">Film</p>
          </div>
          
          <div className="group">
            <div className="w-16 h-16 bg-green-500/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-green-500/30 group-hover:border-green-400/60 transition-all duration-300 group-hover:scale-110">
              <Mic className="w-8 h-8 text-green-400 group-hover:text-green-300 transition-colors" />
            </div>
            <p className="text-sm text-gray-300 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">Podcasts</p>
          </div>
        </div>

        {/* Main Heading */}
        <h1 className="text-5xl md:text-7xl font-bold mb-6 text-white leading-tight">
          <span className="block">License Music for</span>
          <span className="block bg-gradient-to-r from-blue-400 via-purple-400 to-green-400 bg-clip-text text-transparent">
            Your Media Productions
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
          One-Stop Licensing. Simple, Clear Rights. No Hidden Fees.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
          <button className="group bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-2xl shadow-lg flex items-center">
            <Play className="w-5 h-5 mr-2 group-hover:animate-pulse" />
            Start Licensing
            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </button>
          
          <button className="group bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-300 border border-white/20 hover:border-white/40 backdrop-blur-sm flex items-center">
            <Search className="w-5 h-5 mr-2" />
            Browse Catalog
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="text-center group">
            <div className="text-3xl md:text-4xl font-bold text-blue-400 mb-2 group-hover:scale-110 transition-transform">
              10K+
            </div>
            <div className="text-gray-300">Tracks Available</div>
          </div>
          
          <div className="text-center group">
            <div className="text-3xl md:text-4xl font-bold text-purple-400 mb-2 group-hover:scale-110 transition-transform">
              500+
            </div>
            <div className="text-gray-300">Producers</div>
          </div>
          
          <div className="text-center group">
            <div className="text-3xl md:text-4xl font-bold text-green-400 mb-2 group-hover:scale-110 transition-transform">
              24/7
            </div>
            <div className="text-gray-300">Support</div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-white/50 rounded-full mt-2 animate-pulse"></div>
        </div>
      </div>

      {/* Floating Elements */}
      <div className="absolute top-20 left-10 w-4 h-4 bg-blue-400/30 rounded-full animate-pulse"></div>
      <div className="absolute top-40 right-20 w-6 h-6 bg-purple-400/30 rounded-full animate-pulse delay-1000"></div>
      <div className="absolute bottom-40 left-20 w-3 h-3 bg-green-400/30 rounded-full animate-pulse delay-2000"></div>
    </section>
  );
}
