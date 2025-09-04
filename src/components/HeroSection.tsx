import React, { useState, useEffect } from 'react';
import { Play, Search, ArrowRight, Music, Video, Mic, Building2, UserPlus, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { VideoBackground } from './VideoBackground';

interface HeroSectionProps {
  onSearch?: (filters: any) => void;
}

export function HeroSection({ onSearch }: HeroSectionProps) {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Video */}
      <VideoBackground 
        videoUrl=""
        fallbackImage="https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=1920&q=80"
        page="hero"
      />

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
          <button 
            onClick={() => navigate('/pricing')}
            className="group bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-500 ease-out transform hover:scale-105 hover:shadow-2xl shadow-lg flex items-center"
          >
            <Play className="w-5 h-5 mr-2 transition-transform duration-300 group-hover:scale-110" />
            Create Free Client Account
            <ArrowRight className="w-5 h-5 ml-2 transition-transform duration-300 ease-out group-hover:translate-x-1" />
          </button>
          
          <button 
            onClick={() => navigate('/catalog')}
            className="group bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-500 ease-out border border-white/20 hover:border-white/40 backdrop-blur-sm flex items-center"
          >
            <Search className="w-5 h-5 mr-2 transition-transform duration-300 group-hover:scale-110" />
            Browse Catalog
          </button>
        </div>

        {/* Rights Holders Section */}
        <div className="border-t border-white/20 pt-8">
          <p className="text-gray-400 mb-4">Are you a Record Label, Publisher, Producer, or Artist?</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <button 
              onClick={() => navigate('/rights-holder/signup')}
              className="group bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 ease-out transform hover:scale-105 hover:shadow-xl shadow-lg flex items-center"
            >
              <Building2 className="w-4 h-4 mr-2" />
              Join as Record Label/Publisher
              <ArrowRight className="w-4 h-4 ml-2 transition-transform duration-300 ease-out group-hover:translate-x-1" />
            </button>
            
            <button 
              onClick={() => navigate('/producer-application')}
              className="group bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 ease-out transform hover:scale-105 hover:shadow-xl shadow-lg flex items-center"
            >
              <Music className="w-4 h-4 mr-2" />
              Join as Producer
              <ArrowRight className="w-4 h-4 ml-2 transition-transform duration-300 ease-out group-hover:translate-x-1" />
            </button>
            
            <button 
              onClick={() => navigate('/artist-application')}
              className="group bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 ease-out transform hover:scale-105 hover:shadow-xl shadow-lg flex items-center"
            >
              <Users className="w-4 h-4 mr-2" />
              Join as Artist
              <ArrowRight className="w-4 h-4 ml-2 transition-transform duration-300 ease-out group-hover:translate-x-1" />
            </button>
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
