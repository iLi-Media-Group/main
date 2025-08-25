import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, Music, Upload, LayoutDashboard, LogIn, LogOut, UserPlus, Library, CreditCard, Shield, UserCog, Mic, FileText, Briefcase, Mail, Info, Bell, MessageSquare, DollarSign, Wallet, Settings, Guitar, Building2, Download } from 'lucide-react';
import { useUnifiedAuth } from '../contexts/UnifiedAuthContext';
import { supabase } from '../lib/supabase';
import { Footer } from './Footer';
import AISearchBrain from './AISearchBrain';


interface LayoutProps {
  children: React.ReactNode;
  onSignupClick?: () => void;
  hideHeader?: boolean;
}

export function Layout({ children, onSignupClick, hideHeader = false }: LayoutProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [artistApplicationStatus, setArtistApplicationStatus] = useState<string | null>(null);
  const { user, accountType, signOut } = useUnifiedAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = user?.email && ['knockriobeats@gmail.com', 'info@mybeatfi.io', 'derykbanks@yahoo.com', 'knockriobeats2@gmail.com'].includes(user.email);

  // Check artist application status
  useEffect(() => {
    const checkArtistApplicationStatus = async () => {
      if (accountType === 'artist_band' && user?.email) {
        try {
          const { data, error } = await supabase
            .from('artist_applications')
            .select('status')
            .eq('email', user.email)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          if (!error && data) {
            setArtistApplicationStatus(data.status);
          }
        } catch (error) {
          console.error('Error checking artist application status:', error);
        }
      }
    };

    checkArtistApplicationStatus();
  }, [accountType, user?.email]);

  useEffect(() => {
    const fetchLogo = async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'logo_url')
        .single();

      if (!error && data) {
        setLogoUrl(data.value);
      }
    };

    fetchLogo();
  }, []);

  const handleSignOut = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      setIsMenuOpen(false);
      await signOut();
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleCreateAccount = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onSignupClick) {
      onSignupClick();
      setIsMenuOpen(false);
    }
  };

  // Check if artist is approved
  const isArtistApproved = () => {
    return accountType === 'artist_band' && artistApplicationStatus === 'approved';
  };

  // Check if artist application is pending
  const isArtistPending = () => {
    return accountType === 'artist_band' && artistApplicationStatus && artistApplicationStatus !== 'approved';
  };

  const getDashboardLink = () => {
    // Prevent artists from accessing dashboard if not approved
    if (accountType === 'artist_band' && !isArtistApproved()) {
      return '/artist-application-status';
    }
    
    if (accountType === 'white_label') {
      return '/white-label-dashboard';
    }
    if (accountType === 'rights_holder') {
      return '/rights-holder/dashboard';
    }
    if (accountType === 'client') {
      return '/dashboard';
    }
    if (accountType === 'producer') {
      return '/producer/dashboard';
    }
    if (accountType === 'artist_band') {
      return '/artist/dashboard';
    }
    if (accountType === 'admin,producer') {
      return '/producer/dashboard';
    }
    return '/dashboard';
  };

  const getDashboardIcon = () => {
    if (accountType === 'white_label') {
      return <UserCog className="w-4 h-4 mr-2" />;
    }
    if (accountType === 'rights_holder') {
      return <Building2 className="w-4 h-4 mr-2" />;
    }
    if (accountType === 'client') {
      return <LayoutDashboard className="w-4 h-4 mr-2" />;
    }
    if (accountType === 'producer') {
      return <LayoutDashboard className="w-4 h-4 mr-2" />;
    }
    if (accountType === 'artist_band') {
      return <Music className="w-4 h-4 mr-2" />;
    }
    if (accountType === 'admin,producer') {
      return <LayoutDashboard className="w-4 h-4 mr-2" />;
    }
    return <LayoutDashboard className="w-4 h-4 mr-2" />;
  };

  const getDashboardLabel = () => {
    // Show application status for pending artists
    if (isArtistPending()) {
      return 'Application Status';
    }
    
    if (accountType === 'white_label') {
      return 'White Label Dashboard';
    }
    if (accountType === 'rights_holder') {
      return 'Rights Holder Dashboard';
    }
    if (accountType === 'client') {
      return 'Dashboard';
    }
    if (accountType === 'producer') {
      return 'Producer Dashboard';
    }
    if (accountType === 'artist_band') {
      return 'Artist Dashboard';
    }
    if (accountType === 'admin,producer') {
      return 'Producer Dashboard';
    }
    return 'Dashboard';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex flex-col">
      
      {/* Full Header */}
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
                    <LogIn className="w-5 h-5 mr-2" />
                    Login
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                  </button>
                  <div className="absolute right-0 mt-2 w-48 rounded-lg bg-blue-900/90 backdrop-blur-sm border border-blue-500/20 shadow-xl z-[200] opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-200 pointer-events-none group-hover:pointer-events-auto group-focus-within:pointer-events-auto">
                    <div className="py-1">
                      <Link to="/login" className="flex items-center px-4 py-2 text-gray-300 hover:text-white hover:bg-blue-800/50">
                        <LogIn className="w-4 h-4 mr-2" />Client Login
                      </Link>
                      <Link to="/producer/login" className="flex items-center px-4 py-2 text-gray-300 hover:text-white hover:bg-blue-800/50">
                        <LogIn className="w-4 h-4 mr-2" />Producer Login
                      </Link>
                      <Link to="/white-label-login" className="flex items-center px-4 py-2 text-gray-300 hover:text-white hover:bg-blue-800/50">
                        <LogIn className="w-4 h-4 mr-2" />White Label Client Login
                      </Link>
                      <Link to="/rights-holder/login" className="flex items-center px-4 py-2 text-gray-300 hover:text-white hover:bg-blue-800/50">
                        <Building2 className="w-4 h-4 mr-2" />Record Label/Publisher
                      </Link>
                    </div>
                  </div>
                </div>
              </>
            )}
            {/* Music menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-300 hover:text-white transition-all duration-300 p-2"
            >
              {isMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Guitar className={`w-6 h-6 ${isMenuOpen ? 'animate-bounce' : 'hover:animate-bounce'}`} />
              )}
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-lg bg-blue-900/90 backdrop-blur-sm border border-blue-500/20 shadow-xl z-[100] top-full overflow-y-auto max-h-[80vh]">
                <div className="py-1">
                  {/* Common menu items for all users */}
                  <Link to="/catalog" className="flex items-center px-4 py-2 text-gray-300 hover:text-white hover:bg-blue-800/50" onClick={() => setIsMenuOpen(false)}>
                    <Library className="w-4 h-4 mr-2" />Browse Catalog
                  </Link>
                  <Link to="/vocals" className="flex items-center px-4 py-2 text-gray-300 hover:text-white hover:bg-blue-800/50" onClick={() => setIsMenuOpen(false)}>
                    <Mic className="w-4 h-4 mr-2" />Full Tracks with Vocals
                  </Link>
                  <Link to="/sync-only" className="flex items-center px-4 py-2 text-gray-300 hover:text-white hover:bg-blue-800/50" onClick={() => setIsMenuOpen(false)}>
                    <Music className="w-4 h-4 mr-2" />Sync Only Tracks
                  </Link>
                  {/* Business verification for clients only (not rights holders) */}
                  {user && (accountType === 'client' || accountType === 'white_label') && (
                    <Link to="/business-verification" className="flex items-center px-4 py-2 text-gray-300 hover:text-white hover:bg-blue-800/50" onClick={() => setIsMenuOpen(false)}>
                      <Building2 className="w-4 h-4 mr-2" />Business Verification
                    </Link>
                  )}
                  {/* Removed Open Sync Briefs and Custom Sync Request from main menu */}
                  {/* Admin-specific menu items */}
                  {isAdmin && (
                    <>
                      {/* <Link to="/open-sync-briefs" ... /> */}
                      {/* <Link to="/custom-sync-request" ... /> */}
                    </>
                  )}
                  {/* Common menu items continued */}
                  <Link to="/pricing" className="flex items-center px-4 py-2 text-gray-300 hover:text-white hover:bg-blue-800/50" onClick={() => setIsMenuOpen(false)}>
                    <CreditCard className="w-4 h-4 mr-2" />Pricing Plans
                  </Link>
                  <Link to="/sync-licensing-course" className="flex items-center px-4 py-2 text-gray-300 hover:text-white hover:bg-blue-800/50" onClick={() => setIsMenuOpen(false)}>
                    <FileText className="w-4 h-4 mr-2" />Sync Licensing Course
                  </Link>
                  <Link to="/services" className="flex items-center px-4 py-2 text-purple-400 hover:text-white hover:bg-blue-800/50 font-semibold" onClick={() => setIsMenuOpen(false)}>
                    <Settings className="w-4 h-4 mr-2" />Services Directory
                  </Link>
                  {(accountType === 'producer' || accountType === 'admin,producer' || isAdmin) && (
                    <Link to="/producer/resources" className="flex items-center px-4 py-2 text-gray-300 hover:text-white hover:bg-blue-800/50" onClick={() => setIsMenuOpen(false)}>
                      <FileText className="w-4 h-4 mr-2" />Producer Resources
                    </Link>
                  )}
                  <div className="border-t border-blue-500/20 my-1"></div>
                  <Link to="/about" className="flex items-center px-4 py-2 text-gray-300 hover:text-white hover:bg-blue-800/50" onClick={() => setIsMenuOpen(false)}>
                    <Info className="w-4 h-4 mr-2" />About Us
                  </Link>
                  <Link to="/contact" className="flex items-center px-4 py-2 text-gray-300 hover:text-white hover:bg-blue-800/50" onClick={() => setIsMenuOpen(false)}>
                    <Mail className="w-4 h-4 mr-2" />Contact Us
                  </Link>
                  <Link to="/announcements" className="flex items-center px-4 py-2 text-gray-300 hover:text-white hover:bg-blue-800/50" onClick={() => setIsMenuOpen(false)}>
                    <Bell className="w-4 h-4 mr-2" />Announcements
                  </Link>
                  {/* Producer and Admin specific items */}
                  {(accountType === 'producer' || isAdmin) && (
                    <Link to="/chat" className="flex items-center px-4 py-2 text-gray-300 hover:text-white hover:bg-blue-800/50" onClick={() => setIsMenuOpen(false)}>
                      <MessageSquare className="w-4 h-4 mr-2" />Internal Chat
                    </Link>
                  )}
                  {/* Admin specific items */}
                  {isAdmin && (
                    <>
                      <Link to="/admin/invite-producer" className="flex items-center px-4 py-2 text-gray-300 hover:text-white hover:bg-blue-800/50" onClick={() => setIsMenuOpen(false)}>
                        <UserCog className="w-4 h-4 mr-2" />Invite Producer
                      </Link>
                      <Link to="/admin/banking" className="flex items-center px-4 py-2 text-gray-300 hover:text-white hover:bg-blue-800/50" onClick={() => setIsMenuOpen(false)}>
                        <DollarSign className="w-4 h-4 mr-2" />Producer Payments
                      </Link>
                    </>
                  )}
                  {/* Producer specific items */}
                  {accountType === 'producer' && (
                    <>
                      <Link to="/producer/banking" className="flex items-center px-4 py-2 text-gray-300 hover:text-white hover:bg-blue-800/50" onClick={() => setIsMenuOpen(false)}>
                        <DollarSign className="w-4 h-4 mr-2" />Earnings & Payments
                      </Link>
                      <Link to="/producer/upload" className="flex items-center px-4 py-2 text-gray-300 hover:text-white hover:bg-blue-800/50" onClick={() => setIsMenuOpen(false)}>
                        <Upload className="w-4 h-4 mr-2" />Upload Track
                      </Link>
                      <Link to="/producer/file-releases" className="flex items-center px-4 py-2 text-gray-300 hover:text-white hover:bg-blue-800/50" onClick={() => setIsMenuOpen(false)}>
                        <Download className="w-4 h-4 mr-2" />File Release Manager
                      </Link>
                    </>
                  )}
                  {/* Dashboard links */}
                  {user && (
                    <>
                      {/* Debug info - remove after testing */}
                      {console.log('🔍 Navigation Debug - user:', user?.email, 'accountType:', accountType)}
                      
                      {/* Rights Holder Dashboard - ONLY for rights_holder account type */}
                      {accountType === 'rights_holder' && (
                        <Link to="/rights-holder/dashboard" className="flex items-center px-4 py-2 text-gray-300 hover:text-white hover:bg-blue-800/50 border border-transparent hover:border-blue-500/40 transition-colors" onClick={() => setIsMenuOpen(false)}>
                          <Building2 className="w-4 h-4 mr-2" />
                          Rights Holder Dashboard
                        </Link>
                      )}

                      {/* Client Dashboard - ONLY for client account type */}
                      {accountType === 'client' && (
                        <Link to="/dashboard" className="flex items-center px-4 py-2 text-gray-300 hover:text-white hover:bg-blue-800/50 border border-transparent hover:border-blue-500/40 transition-colors" onClick={() => setIsMenuOpen(false)}>
                          <LayoutDashboard className="w-4 h-4 mr-2" />
                          Dashboard
                        </Link>
                      )}

                      {/* Producer Dashboard - ONLY for producer account type */}
                      {accountType === 'producer' && (
                        <Link to="/producer/dashboard" className="flex items-center px-4 py-2 text-gray-300 hover:text-white hover:bg-blue-800/50 border border-transparent hover:border-blue-500/40 transition-colors" onClick={() => setIsMenuOpen(false)}>
                          <Music className="w-4 h-4 mr-2" />
                          Producer Dashboard
                        </Link>
                      )}

                      {/* Admin + Producer Dashboard - ONLY for admin,producer account type */}
                      {accountType === 'admin,producer' && (
                        <>
                          <Link to="/admin" className="flex items-center px-4 py-2 text-gray-300 hover:text-white hover:bg-blue-800/50 border border-transparent hover:border-blue-500/40 transition-colors" onClick={() => setIsMenuOpen(false)}>
                            <Shield className="w-4 h-4 mr-2" />
                            Admin Dashboard
                          </Link>
                          <Link to="/producer/dashboard" className="flex items-center px-4 py-2 text-gray-300 hover:text-white hover:bg-blue-800/50 border border-transparent hover:border-blue-500/40 transition-colors" onClick={() => setIsMenuOpen(false)}>
                            <Music className="w-4 h-4 mr-2" />
                            Producer Dashboard
                          </Link>
                        </>
                      )}

                      {/* White Label Dashboard - ONLY for white_label account type */}
                      {accountType === 'white_label' && (
                        <Link to="/white-label-dashboard" className="flex items-center px-4 py-2 text-gray-300 hover:text-white hover:bg-blue-800/50 border border-transparent hover:border-blue-500/40 transition-colors" onClick={() => setIsMenuOpen(false)}>
                          <UserCog className="w-4 h-4 mr-2" />
                          White Label Dashboard
                        </Link>
                      )}
                  </>
                )}
                  {/* Authentication links */}
                  {user ? (
                    <button type="button" onClick={handleSignOut} className="w-full flex items-center px-4 py-2 text-gray-300 hover:text-white hover:bg-blue-800/50">
                      <LogOut className="w-4 h-4 mr-2" />Sign Out
                    </button>
                  ) : (
                    <>
                      <button type="button" onClick={handleCreateAccount} className="flex items-center px-4 py-2 text-gray-300 hover:text-white hover:bg-blue-800/50">
                        <UserPlus className="w-4 h-4 mr-2" />Create Account
                      </button>
                      <Link to="/login" className="flex items-center px-4 py-2 text-gray-300 hover:text-white hover:bg-blue-800/50" onClick={() => setIsMenuOpen(false)}>
                        <LogIn className="w-4 h-4 mr-2" />Client Login
                      </Link>
                      <Link to="/producer/login" className="flex items-center px-4 py-2 text-gray-300 hover:text-white hover:bg-blue-800/50" onClick={() => setIsMenuOpen(false)}>
                        <LogIn className="w-4 h-4 mr-2" />Producer Login
                      </Link>
                      <Link to="/white-label-login" className="flex items-center px-4 py-2 text-gray-300 hover:text-white hover:bg-blue-800/50" onClick={() => setIsMenuOpen(false)}>
                        <LogIn className="w-4 h-4 mr-2" />White Label Client Login
                      </Link>
                    </>
                  )}
                </div>
              </div>
            )}
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
              
              {/* Music Menu Button */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-white hover:text-blue-300 transition-all duration-300 p-2 bg-black/20 backdrop-blur-sm rounded-lg"
              >
                {isMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Guitar className={`w-6 h-6 ${isMenuOpen ? 'animate-bounce' : 'hover:animate-bounce'}`} />
                )}
              </button>
            </div>

            {/* Menu Dropdown */}
            {isMenuOpen && (
              <div className="absolute right-4 mt-2 w-48 rounded-lg bg-blue-900/90 backdrop-blur-sm border border-blue-500/20 shadow-xl z-[100] top-full overflow-y-auto max-h-[80vh]">
                <div className="py-1">
                  {/* Common menu items for all users */}
                  <Link to="/catalog" className="flex items-center px-4 py-2 text-gray-300 hover:text-white hover:bg-blue-800/50" onClick={() => setIsMenuOpen(false)}>
                    <Library className="w-4 h-4 mr-2" />Browse Catalog
                  </Link>
                  <Link to="/vocals" className="flex items-center px-4 py-2 text-gray-300 hover:text-white hover:bg-blue-800/50" onClick={() => setIsMenuOpen(false)}>
                    <Mic className="w-4 h-4 mr-2" />Full Tracks with Vocals
                  </Link>
                  <Link to="/sync-only" className="flex items-center px-4 py-2 text-gray-300 hover:text-white hover:bg-blue-800/50" onClick={() => setIsMenuOpen(false)}>
                    <Music className="w-4 h-4 mr-2" />Sync Only Tracks
                  </Link>
                  {/* Common menu items continued */}
                  <Link to="/pricing" className="flex items-center px-4 py-2 text-gray-300 hover:text-white hover:bg-blue-800/50" onClick={() => setIsMenuOpen(false)}>
                    <CreditCard className="w-4 h-4 mr-2" />Pricing Plans
                  </Link>
                  <Link to="/sync-licensing-course" className="flex items-center px-4 py-2 text-gray-300 hover:text-white hover:bg-blue-800/50" onClick={() => setIsMenuOpen(false)}>
                    <FileText className="w-4 h-4 mr-2" />Sync Licensing Course
                  </Link>
                  {(accountType === 'producer' || accountType === 'admin,producer' || isAdmin) && (
                    <Link to="/producer/resources" className="flex items-center px-4 py-2 text-gray-300 hover:text-white hover:bg-blue-800/50" onClick={() => setIsMenuOpen(false)}>
                      <FileText className="w-4 h-4 mr-2" />Producer Resources
                    </Link>
                  )}
                  <Link to="/services" className="flex items-center px-4 py-2 text-purple-400 hover:text-white hover:bg-blue-800/50 font-semibold" onClick={() => setIsMenuOpen(false)}>
                    <Settings className="w-4 h-4 mr-2" />Services Directory
                  </Link>
                  <div className="border-t border-blue-500/20 my-1"></div>
                  <Link to="/about" className="flex items-center px-4 py-2 text-gray-300 hover:text-white hover:bg-blue-800/50" onClick={() => setIsMenuOpen(false)}>
                    <Info className="w-4 h-4 mr-2" />About Us
                  </Link>
                  <Link to="/contact" className="flex items-center px-4 py-2 text-gray-300 hover:text-white hover:bg-blue-800/50" onClick={() => setIsMenuOpen(false)}>
                    <Mail className="w-4 h-4 mr-2" />Contact Us
                  </Link>
                  <Link to="/announcements" className="flex items-center px-4 py-2 text-gray-300 hover:text-white hover:bg-blue-800/50" onClick={() => setIsMenuOpen(false)}>
                    <Bell className="w-4 h-4 mr-2" />Announcements
                  </Link>
                  {/* Producer and Admin specific items */}
                  {(accountType === 'producer' || isAdmin) && (
                    <Link to="/chat" className="flex items-center px-4 py-2 text-gray-300 hover:text-white hover:bg-blue-800/50" onClick={() => setIsMenuOpen(false)}>
                      <MessageSquare className="w-4 h-4 mr-2" />Internal Chat
                    </Link>
                  )}
                  {/* Admin specific items */}
                  {isAdmin && (
                    <>
                      <Link to="/admin/invite-producer" className="flex items-center px-4 py-2 text-gray-300 hover:text-white hover:bg-blue-800/50" onClick={() => setIsMenuOpen(false)}>
                        <UserCog className="w-4 h-4 mr-2" />Invite Producer
                      </Link>
                      <Link to="/admin/banking" className="flex items-center px-4 py-2 text-gray-300 hover:text-white hover:bg-blue-800/50" onClick={() => setIsMenuOpen(false)}>
                        <DollarSign className="w-4 h-4 mr-2" />Producer Payments
                      </Link>
                    </>
                  )}
                  {/* Producer specific items */}
                  {accountType === 'producer' && (
                    <>
                      <Link to="/producer/banking" className="flex items-center px-4 py-2 text-gray-300 hover:text-white hover:bg-blue-800/50" onClick={() => setIsMenuOpen(false)}>
                        <DollarSign className="w-4 h-4 mr-2" />Earnings & Payments
                      </Link>
                      <Link to="/producer/upload" className="flex items-center px-4 py-2 text-gray-300 hover:text-white hover:bg-blue-800/50" onClick={() => setIsMenuOpen(false)}>
                        <Upload className="w-4 h-4 mr-2" />Upload Track
                      </Link>
                    </>
                  )}
                  {/* Dashboard links */}
                  {user && (
                    <>
                      <Link to={getDashboardLink()} className="flex items-center px-4 py-2 text-gray-300 hover:text-white hover:bg-blue-800/50 border border-transparent hover:border-blue-500/40 transition-colors" onClick={() => setIsMenuOpen(false)}>
                        {getDashboardIcon()}
                        {getDashboardLabel()}
                      </Link>

                  </>
                )}
                  {/* Authentication links */}
                  {user ? (
                    <button type="button" onClick={handleSignOut} className="w-full flex items-center px-4 py-2 text-gray-300 hover:text-white hover:bg-blue-800/50">
                      <LogOut className="w-4 h-4 mr-2" />Sign Out
                    </button>
                  ) : (
                    <>
                      <button type="button" onClick={handleCreateAccount} className="flex items-center px-4 py-2 text-gray-300 hover:text-white hover:bg-blue-800/50">
                        <UserPlus className="w-4 h-4 mr-2" />Create Account
                      </button>
                      <Link to="/login" className="flex items-center px-4 py-2 text-gray-300 hover:text-white hover:bg-blue-800/50" onClick={() => setIsMenuOpen(false)}>
                        <LogIn className="w-4 h-4 mr-2" />Client Login
                      </Link>
                      <Link to="/producer/login" className="flex items-center px-4 py-2 text-gray-300 hover:text-white hover:bg-blue-800/50" onClick={() => setIsMenuOpen(false)}>
                        <LogIn className="w-4 h-4 mr-2" />Producer Login
                      </Link>
                      <Link to="/artist/login" className="flex items-center px-4 py-2 text-gray-300 hover:text-white hover:bg-blue-800/50" onClick={() => setIsMenuOpen(false)}>
                        <Music className="w-4 h-4 mr-2" />Artist/Band Login
                      </Link>
                      <Link to="/white-label-login" className="flex items-center px-4 py-2 text-gray-300 hover:text-white hover:bg-blue-800/50" onClick={() => setIsMenuOpen(false)}>
                        <LogIn className="w-4 h-4 mr-2" />White Label Client Login
                      </Link>
                      <Link to="/rights-holder/login" className="flex items-center px-4 py-2 text-gray-300 hover:text-white hover:bg-blue-800/50" onClick={() => setIsMenuOpen(false)}>
                        <Building2 className="w-4 h-4 mr-2" />Record Label/Publisher
                      </Link>
                    </>
                  )}
                </div>
              </div>
            )}
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
            navigate(`/catalog?q=${encodeURIComponent(query)}`);
          }} 
        />
      )}
    </div>
  );
}
