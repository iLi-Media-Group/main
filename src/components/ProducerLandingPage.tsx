import React from 'react';
import { Link } from 'react-router-dom';
import { Music } from 'lucide-react';

const ProducerLandingPage = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section with Studio Background */}
      <div 
        className="relative bg-cover bg-center bg-no-repeat min-h-screen flex items-center"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.7)), url('https://images.unsplash.com/photo-1598653222000-6b7b7a552625?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80')`
        }}
      >
        {/* Header */}
        <header className="absolute top-0 left-0 right-0 z-10">
          <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
            {/* Logo Container - fills header height and flexes with screen size */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center">
                <div className="h-12 sm:h-14 md:h-16 lg:h-20 w-auto overflow-hidden rounded-lg border border-blue-500/20 bg-white/10 backdrop-blur-sm p-2 transition-all hover:bg-white/20 hover:border-blue-400/40 shadow-lg">
                  {/* You can replace this with an actual logo image */}
                  <div className="h-full w-auto flex items-center justify-center">
                    <Music className="w-full h-full text-blue-400" />
                  </div>
                  {/* Alternative: Use an actual logo image
                  <img 
                    src="/path-to-your-logo.png" 
                    alt="MyBeatFi Sync" 
                    className="h-full w-auto object-contain"
                  />
                  */}
                </div>
                <div className="ml-3 hidden sm:block">
                  <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-white">
                    MyBeatFi <span className="text-blue-400">Sync</span>
                  </h1>
                </div>
              </Link>
            </div>
            
            <Link
              to="/producer-application"
              className="bg-blue-600 text-white px-4 sm:px-5 py-2 sm:py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium text-sm sm:text-base shadow-lg hover:shadow-xl"
            >
              Apply Now
            </Link>
          </div>
        </header>

        {/* Hero Content */}
        <div className="max-w-7xl mx-auto px-4 text-center text-white relative z-10">
          <h2 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Get Your Music Licensed
            <span className="block text-blue-400">Worldwide</span>
          </h2>
          <p className="text-xl md:text-2xl text-gray-200 mb-8 max-w-3xl mx-auto leading-relaxed">
            Join a global roster of sync-ready producers. Fair payouts. Transparent reporting. No hassle.
          </p>
          <Link
            to="/producer-application"
            className="inline-block bg-blue-600 text-white px-10 py-4 rounded-lg hover:bg-blue-700 transition-all duration-200 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            Start Your Application
          </Link>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white rounded-full mt-2 animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="bg-blue-900">
        <div className="max-w-7xl mx-auto px-4 py-20">
          {/* Features Grid */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-20">
            <div className="bg-blue-950/80 p-8 shadow-lg rounded-xl border border-blue-800 hover:shadow-xl transition-shadow duration-300 text-blue-100">
              <h3 className="text-2xl font-bold mb-4 text-white">Why Join MyBeatFi Sync?</h3>
              <ul className="space-y-3">
                <li className="flex items-center">
                  <span className="text-green-400 mr-3 text-xl">✅</span>
                  Get paid for every sync license sold
                </li>
                <li className="flex items-center">
                  <span className="text-green-400 mr-3 text-xl">✅</span>
                  Automated payouts (Stripe + USDC Crypto)
                </li>
                <li className="flex items-center">
                  <span className="text-green-400 mr-3 text-xl">✅</span>
                  Detailed monthly reporting
                </li>
                <li className="flex items-center">
                  <span className="text-green-400 mr-3 text-xl">✅</span>
                  AI-driven metadata boosts your discoverability
                </li>
                <li className="flex items-center">
                  <span className="text-green-400 mr-3 text-xl">✅</span>
                  Exposure to global brands, agencies, and creators
                </li>
              </ul>
            </div>
            <div className="bg-blue-950/80 p-8 shadow-lg rounded-xl border border-blue-800 hover:shadow-xl transition-shadow duration-300 text-blue-100">
              <h3 className="text-2xl font-bold mb-4 text-white">How It Works</h3>
              <ol className="space-y-3">
                <li className="flex items-start">
                  <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">1</span>
                  Submit your producer application
                </li>
                <li className="flex items-start">
                  <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">2</span>
                  Our team reviews your profile and music
                </li>
                <li className="flex items-start">
                  <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">3</span>
                  If approved, you get onboarded to the platform
                </li>
                <li className="flex items-start">
                  <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">4</span>
                  Start uploading tracks and earning from syncs
                </li>
              </ol>
            </div>
          </section>

          {/* Requirements Section */}
          <section className="bg-gradient-to-r from-blue-800 to-blue-900 p-12 rounded-2xl mb-20 text-blue-100">
            <h3 className="text-3xl font-bold mb-8 text-center text-white">Requirements</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ul className="space-y-3">
                <li className="flex items-center">
                  <span className="text-green-400 mr-3 text-xl">✅</span>
                  Must own 100% of the copyright for all music submitted
                </li>
                <li className="flex items-center">
                  <span className="text-green-400 mr-3 text-xl">✅</span>
                  No unlicensed Splice samples or third-party loops
                </li>
                <li className="flex items-center">
                  <span className="text-green-400 mr-3 text-xl">✅</span>
                  Sync-quality production and mixing
                </li>
              </ul>
              <ul className="space-y-3">
                <li className="flex items-center">
                  <span className="text-green-400 mr-3 text-xl">✅</span>
                  One-stop clearance (no complex rights issues)
                </li>
                <li className="flex items-center">
                  <span className="text-green-400 mr-3 text-xl">✅</span>
                  Preferred: Able to deliver stems upon request
                </li>
                <li className="flex items-center">
                  <span className="text-green-400 mr-3 text-xl">✅</span>
                  Professional quality audio files
                </li>
              </ul>
            </div>
          </section>

          {/* CTA Section */}
          <section className="text-center bg-blue-950/80 p-12 rounded-2xl shadow-lg border border-blue-800">
            <h3 className="text-3xl font-bold mb-4 text-white">Ready to Apply?</h3>
            <p className="mb-8 text-blue-100 text-lg max-w-2xl mx-auto">
              Click below to start your application and join our growing sync roster. 
              Turn your passion for music into a sustainable income stream.
            </p>
            <Link
              to="/producer-application"
              className="inline-block bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 transition-all duration-200 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              Start Application
            </Link>
          </section>
        </div>
      </main>

      <footer className="bg-blue-950 text-white text-center py-8">
        <div className="max-w-7xl mx-auto px-4">
          <p className="text-blue-200">
            &copy; {new Date().getFullYear()} MyBeatFi Sync. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default ProducerLandingPage;
