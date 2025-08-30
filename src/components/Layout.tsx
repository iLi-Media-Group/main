import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Music, Settings } from 'lucide-react';
import { useUnifiedAuth } from '../contexts/UnifiedAuthContext';
import { supabase } from '../lib/supabase';
import { Footer } from './Footer';
import AISearchBrain from './AISearchBrain';
import Navigation from './Navigation';

interface LayoutProps {
  children: React.ReactNode;
  onSignupClick?: () => void;
  hideHeader?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, onSignupClick, hideHeader = false }) => {
  const { user, signOut, profile } = useUnifiedAuth();
  const [logoUrl, setLogoUrl] = useState<string>('');
  const location = useLocation();

  useEffect(() => {
    const fetchLogo = async () => {
      try {
        // Fetch logo URL from site_settings table
        const { data, error } = await supabase
          .from('site_settings')
          .select('value')
          .eq('key', 'logo_url')
          .single();

        if (!error && data?.value) {
          setLogoUrl(data.value);
        } else {
          // Fallback to the logo in the storage bucket
          setLogoUrl('https://yciqkebqlajqbpwlujma.supabase.co/storage/v1/object/public/logos/logo-1754742894515');
        }
      } catch (error) {
        console.error('Error fetching logo from Supabase:', error);
        // Fallback to the logo in the storage bucket
        setLogoUrl('https://yciqkebqlajqbpwlujma.supabase.co/storage/v1/object/public/logos/logo-1754742894515');
      }
    };

    fetchLogo();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleCreateAccount = () => {
    if (onSignupClick) {
      onSignupClick();
    }
  };

  const accountType = profile?.account_type || '';
  const isAdmin = profile?.account_type === 'admin' || profile?.account_type === 'admin,producer';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex flex-col">
      
      {/* Full Header - Only show when hideHeader is false */}
      {!hideHeader && (
        <header className="py-6 px-4 sticky top-0 z-50">
        <nav className="container mx-auto flex justify-between items-center relative">
          <div className="flex items-center w-1/3">
            <Link to="/" className="flex items-center">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt="Logo"
                  className="h-16 sm:h-20 md:h-24 lg:h-28 w-auto object-contain drop-shadow-lg"
                  style={{ 
                    border: 'none', 
                    boxShadow: 'none', 
                    background: 'transparent', 
                    padding: 0, 
                    margin: 0,
                    mixBlendMode: 'normal',
                    filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))'
                  }}
                />
              ) : (
                <div className="h-16 sm:h-20 md:h-24 lg:h-28 w-auto flex items-center justify-center">
                  <Music className="w-full h-full text-blue-400" />
                </div>
              )}
              <div className="ml-4 hidden sm:block">
                <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white drop-shadow-lg">
                  MYBEATFI <span className="text-blue-400">SYNC</span>
                </h1>
              </div>
            </Link>
          </div>

          <div className="flex-1 flex justify-center">
            {/* Title moved to logo area for better responsive design */}
          </div>
          
          <div className="flex items-center justify-end w-1/3">
            {/* Login and Create Account for logged out users */}
            {!user && (
              <>
                <Link
                  to="/signup"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors mr-2"
                  style={{ minWidth: 120, textAlign: 'center' }}
                >
                  Create Account
                </Link>
                <div className="relative group mr-4">
                  <button className="flex items-center px-4 py-2 text-gray-300 hover:text-white transition-colors rounded focus:outline-none focus:ring-2 focus:ring-blue-400">
                      <Settings className="w-5 h-5 mr-2" />
                    Login
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                  </button>
                  <div className="absolute right-0 mt-2 w-48 rounded-lg bg-blue-900/90 backdrop-blur-sm border border-blue-500/20 shadow-xl z-[200] opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-200 pointer-events-none group-hover:pointer-events-auto group-focus-within:pointer-events-auto">
                    <div className="py-1">
                      <Link to="/login" className="flex items-center px-4 py-2 text-gray-300 hover:text-white hover:bg-blue-800/50">
                          <Settings className="w-4 h-4 mr-2" />Client Login
                      </Link>
                      <Link to="/producer/login" className="flex items-center px-4 py-2 text-gray-300 hover:text-white hover:bg-blue-800/50">
                          <Settings className="w-4 h-4 mr-2" />Producer Login
                      </Link>
                      <Link to="/white-label-login" className="flex items-center px-4 py-2 text-gray-300 hover:text-white hover:bg-blue-800/50">
                          <Settings className="w-4 h-4 mr-2" />White Label Client Login
                      </Link>
                      <Link to="/rights-holder/login" className="flex items-center px-4 py-2 text-gray-300 hover:text-white hover:bg-blue-800/50">
                          <Settings className="w-4 h-4 mr-2" />Record Label/Publisher
                      </Link>
                      <Link to="/artist/login" className="flex items-center px-4 py-2 text-gray-300 hover:text-white hover:bg-blue-800/50">
                          <Settings className="w-4 h-4 mr-2" />Artist Login
                      </Link>
                      </div>
                  </div>
                </div>
              </>
              )}
              
              {/* Navigation Component */}
              <Navigation
                user={user}
                accountType={accountType}
                isAdmin={isAdmin}
                onSignOut={handleSignOut}
                onCreateAccount={handleCreateAccount}
                logoUrl={logoUrl}
              />
          </div>
        </nav>
      </header>
      )}

      {/* Minimal Floating Header for Home Page */}
      {hideHeader && (
        <header className="fixed top-0 left-0 right-0 z-50 py-4 px-4">
          <nav className="container mx-auto flex justify-between items-center">
            {/* Logo and Site Name */}
            <Link to="/" className="flex items-center">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt="Logo"
                  className="h-12 sm:h-16 md:h-20 w-auto object-contain drop-shadow-lg"
                  style={{ 
                    border: 'none', 
                    boxShadow: 'none', 
                    background: 'transparent', 
                    padding: 0, 
                    margin: 0,
                    mixBlendMode: 'normal',
                    filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))'
                  }}
                />
              ) : (
                <div className="h-12 sm:h-16 md:h-20 w-auto flex items-center justify-center">
                  <Music className="w-full h-full text-blue-400" />
                </div>
              )}
              <div className="ml-3 sm:ml-4 hidden sm:block">
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-white drop-shadow-lg">
                  MYBEATFI <span className="text-blue-400">SYNC</span>
                </h1>
              </div>
            </Link>
            
            {/* Right side buttons */}
            <div className="flex items-center space-x-2">
              {/* Profile/Settings Gear Icon */}
              {user && (
                <Link
                  to="/profile"
                  className="text-white hover:text-blue-300 transition-all duration-300 p-2 bg-black/20 backdrop-blur-sm rounded-lg"
                  title="Profile Settings"
                >
                  <Settings className="w-6 h-6" />
                </Link>
              )}
              
              {/* Navigation Component */}
              <Navigation
                user={user}
                accountType={accountType}
                isAdmin={isAdmin}
                onSignOut={handleSignOut}
                onCreateAccount={handleCreateAccount}
                logoUrl={logoUrl}
              />
            </div>
          </nav>
        </header>
      )}

      <main className="flex-1">
        {children}
      </main>

      <Footer />
      
      {/* AI Search Brain - Only show on catalog page for users with AI Search access */}
      {location.pathname === '/catalog' && (
        <AISearchBrain 
          onSearchApply={(query) => {
            // Navigate to catalog with the search query
            window.location.href = `/catalog?q=${encodeURIComponent(query)}`;
          }} 
        />
      )}
    </div>
  );
};

export { Layout };
