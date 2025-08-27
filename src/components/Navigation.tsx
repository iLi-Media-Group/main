import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Guitar, 
  X, 
  Library, 
  Mic, 
  Music, 
  CreditCard, 
  FileText, 
  Settings, 
  Info, 
  Mail, 
  Bell, 
  MessageSquare, 
  UserCog, 
  DollarSign, 
  Layout, 
  Building2, 
  LogIn, 
  LogOut, 
  UserPlus,
  BookOpen,
  Users
} from 'lucide-react';

interface NavigationProps {
  user: any;
  accountType: string;
  isAdmin: boolean;
  onSignOut: () => void;
  onCreateAccount: () => void;
  logoUrl?: string;
}

const Navigation: React.FC<NavigationProps> = ({ 
  user, 
  accountType, 
  isAdmin, 
  onSignOut, 
  onCreateAccount, 
  logoUrl 
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const getDashboardLink = () => {
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

  const getDashboardLabel = () => {
    if (accountType === 'white_label') {
      return 'White Label Client Dashboard';
    }
    if (accountType === 'rights_holder') {
      return 'Record Label/Publisher Dashboard';
    }
    if (accountType === 'client') {
      return 'Client Dashboard';
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

  const renderCommonMenuItems = () => (
    <>
      <Link to="/catalog" className="flex items-center px-4 py-2 text-gray-300 hover:text-white hover:bg-blue-800/50" onClick={() => setIsMenuOpen(false)}>
        <Library className="w-4 h-4 mr-2" />Browse Catalog
      </Link>
      <Link to="/vocals" className="flex items-center px-4 py-2 text-gray-300 hover:text-white hover:bg-blue-800/50" onClick={() => setIsMenuOpen(false)}>
        <Mic className="w-4 h-4 mr-2" />Vocal Tracks
      </Link>
      <Link to="/sync-only" className="flex items-center px-4 py-2 text-gray-300 hover:text-white hover:bg-blue-800/50" onClick={() => setIsMenuOpen(false)}>
        <Music className="w-4 h-4 mr-2" />Sync Only Tracks
      </Link>
      <Link to="/pricing" className="flex items-center px-4 py-2 text-gray-300 hover:text-white hover:bg-blue-800/50" onClick={() => setIsMenuOpen(false)}>
        <CreditCard className="w-4 h-4 mr-2" />Pricing Plans
      </Link>
      <Link to="/sync-licensing-course" className="flex items-center px-4 py-2 text-gray-300 hover:text-white hover:bg-blue-800/50" onClick={() => setIsMenuOpen(false)}>
        <FileText className="w-4 h-4 mr-2" />Sync Licensing Course
      </Link>
      {user && (
        <Link to="/services" className="flex items-center px-4 py-2 text-gray-300 hover:text-white hover:bg-blue-800/50" onClick={() => setIsMenuOpen(false)}>
          <Settings className="w-4 h-4 mr-2" />Services Directory
        </Link>
      )}
      <Link to="/producer-resources" className="flex items-center px-4 py-2 text-gray-300 hover:text-white hover:bg-blue-800/50" onClick={() => setIsMenuOpen(false)}>
        <BookOpen className="w-4 h-4 mr-2" />Producer Resources
      </Link>
      <Link to="/about" className="flex items-center px-4 py-2 text-gray-300 hover:text-white hover:bg-blue-800/50" onClick={() => setIsMenuOpen(false)}>
        <Info className="w-4 h-4 mr-2" />About Us
      </Link>
      <Link to="/contact" className="flex items-center px-4 py-2 text-gray-300 hover:text-white hover:bg-blue-800/50" onClick={() => setIsMenuOpen(false)}>
        <Mail className="w-4 h-4 mr-2" />Contact Us
      </Link>
      <Link to="/announcements" className="flex items-center px-4 py-2 text-gray-300 hover:text-white hover:bg-blue-800/50" onClick={() => setIsMenuOpen(false)}>
        <Bell className="w-4 h-4 mr-2" />Announcements
      </Link>
    </>
  );

  const renderLoggedOutMenu = () => (
    <>
      {renderCommonMenuItems()}
      <div className="border-t border-blue-500/20 my-1"></div>
      <button 
        type="button" 
        onClick={() => {
          onCreateAccount();
          setIsMenuOpen(false);
        }} 
        className="w-full flex items-center px-4 py-2 text-gray-300 hover:text-white hover:bg-blue-800/50"
      >
        <UserPlus className="w-4 h-4 mr-2" />Create Account
      </button>
      <Link to="/login" className="flex items-center px-4 py-2 text-gray-300 hover:text-white hover:bg-blue-800/50" onClick={() => setIsMenuOpen(false)}>
        <LogIn className="w-4 h-4 mr-2" />Client Login
      </Link>
      <Link to="/producer/login" className="flex items-center px-4 py-2 text-gray-300 hover:text-white hover:bg-blue-800/50" onClick={() => setIsMenuOpen(false)}>
        <LogIn className="w-4 h-4 mr-2" />Producer Login
      </Link>
      <Link to="/artist/login" className="flex items-center px-4 py-2 text-gray-300 hover:text-white hover:bg-blue-800/50" onClick={() => setIsMenuOpen(false)}>
        <Music className="w-4 h-4 mr-2" />Artist Band Login
      </Link>
      <Link to="/white-label-login" className="flex items-center px-4 py-2 text-gray-300 hover:text-white hover:bg-blue-800/50" onClick={() => setIsMenuOpen(false)}>
        <LogIn className="w-4 h-4 mr-2" />White Label Client Login
      </Link>
      <Link to="/rights-holder/login" className="flex items-center px-4 py-2 text-gray-300 hover:text-white hover:bg-blue-800/50" onClick={() => setIsMenuOpen(false)}>
        <Building2 className="w-4 h-4 mr-2" />Record Label/Publisher Login
      </Link>
    </>
  );

  const renderClientMenu = () => (
    <>
      {renderCommonMenuItems()}
      <div className="border-t border-blue-500/20 my-1"></div>
      <Link to={getDashboardLink()} className="flex items-center px-4 py-2 text-gray-300 hover:text-white hover:bg-blue-800/50" onClick={() => setIsMenuOpen(false)}>
        <Layout className="w-4 h-4 mr-2" />{getDashboardLabel()}
      </Link>
      <button type="button" onClick={onSignOut} className="w-full flex items-center px-4 py-2 text-gray-300 hover:text-white hover:bg-blue-800/50">
        <LogOut className="w-4 h-4 mr-2" />Sign Out
      </button>
    </>
  );

  const renderProducerMenu = () => (
    <>
      {renderCommonMenuItems()}
      <div className="border-t border-blue-500/20 my-1"></div>
      <Link to="/chat" className="flex items-center px-4 py-2 text-gray-300 hover:text-white hover:bg-blue-800/50" onClick={() => setIsMenuOpen(false)}>
        <MessageSquare className="w-4 h-4 mr-2" />Internal Chat
      </Link>
      <Link to={getDashboardLink()} className="flex items-center px-4 py-2 text-gray-300 hover:text-white hover:bg-blue-800/50" onClick={() => setIsMenuOpen(false)}>
        <Layout className="w-4 h-4 mr-2" />{getDashboardLabel()}
      </Link>
      <button type="button" onClick={onSignOut} className="w-full flex items-center px-4 py-2 text-gray-300 hover:text-white hover:bg-blue-800/50">
        <LogOut className="w-4 h-4 mr-2" />Sign Out
      </button>
    </>
  );

  const renderProducerAdminMenu = () => (
    <>
      {renderCommonMenuItems()}
      <div className="border-t border-blue-500/20 my-1"></div>
      <Link to="/chat" className="flex items-center px-4 py-2 text-gray-300 hover:text-white hover:bg-blue-800/50" onClick={() => setIsMenuOpen(false)}>
        <MessageSquare className="w-4 h-4 mr-2" />Internal Chat
      </Link>
      <Link to="/admin/banking" className="flex items-center px-4 py-2 text-gray-300 hover:text-white hover:bg-blue-800/50" onClick={() => setIsMenuOpen(false)}>
        <DollarSign className="w-4 h-4 mr-2" />Producer Payments
      </Link>
      <Link to={getDashboardLink()} className="flex items-center px-4 py-2 text-gray-300 hover:text-white hover:bg-blue-800/50" onClick={() => setIsMenuOpen(false)}>
        <Layout className="w-4 h-4 mr-2" />{getDashboardLabel()}
      </Link>
      <Link to="/admin" className="flex items-center px-4 py-2 text-gray-300 hover:text-white hover:bg-blue-800/50" onClick={() => setIsMenuOpen(false)}>
        <UserCog className="w-4 h-4 mr-2" />Admin Dashboard
      </Link>
      <button type="button" onClick={onSignOut} className="w-full flex items-center px-4 py-2 text-gray-300 hover:text-white hover:bg-blue-800/50">
        <LogOut className="w-4 h-4 mr-2" />Sign Out
      </button>
    </>
  );

  const renderArtistMenu = () => (
    <>
      {renderCommonMenuItems()}
      <div className="border-t border-blue-500/20 my-1"></div>
      <Link to="/chat" className="flex items-center px-4 py-2 text-gray-300 hover:text-white hover:bg-blue-800/50" onClick={() => setIsMenuOpen(false)}>
        <MessageSquare className="w-4 h-4 mr-2" />Internal Chat
      </Link>
      <Link to={getDashboardLink()} className="flex items-center px-4 py-2 text-gray-300 hover:text-white hover:bg-blue-800/50" onClick={() => setIsMenuOpen(false)}>
        <Music className="w-4 h-4 mr-2" />{getDashboardLabel()}
      </Link>
      <button type="button" onClick={onSignOut} className="w-full flex items-center px-4 py-2 text-gray-300 hover:text-white hover:bg-blue-800/50">
        <LogOut className="w-4 h-4 mr-2" />Sign Out
      </button>
    </>
  );

  const renderWhiteLabelMenu = () => (
    <>
      {renderCommonMenuItems()}
      <div className="border-t border-blue-500/20 my-1"></div>
      <Link to={getDashboardLink()} className="flex items-center px-4 py-2 text-gray-300 hover:text-white hover:bg-blue-800/50" onClick={() => setIsMenuOpen(false)}>
        <UserCog className="w-4 h-4 mr-2" />{getDashboardLabel()}
      </Link>
      <button type="button" onClick={onSignOut} className="w-full flex items-center px-4 py-2 text-gray-300 hover:text-white hover:bg-blue-800/50">
        <LogOut className="w-4 h-4 mr-2" />Sign Out
      </button>
    </>
  );

  const renderRightsHolderMenu = () => (
    <>
      {renderCommonMenuItems()}
      <div className="border-t border-blue-500/20 my-1"></div>
      <Link to="/chat" className="flex items-center px-4 py-2 text-gray-300 hover:text-white hover:bg-blue-800/50" onClick={() => setIsMenuOpen(false)}>
        <MessageSquare className="w-4 h-4 mr-2" />Internal Chat
      </Link>
                     <Link to="/rights-holder/banking" className="flex items-center px-4 py-2 text-gray-300 hover:text-white hover:bg-blue-800/50" onClick={() => setIsMenuOpen(false)}>
                 <DollarSign className="w-4 h-4 mr-2" />Rights Holder Banking
               </Link>
               <Link to="/rights-holder/roster" className="flex items-center px-4 py-2 text-gray-300 hover:text-white hover:bg-blue-800/50" onClick={() => setIsMenuOpen(false)}>
                 <Users className="w-4 h-4 mr-2" />Roster Management
               </Link>
      <Link to={getDashboardLink()} className="flex items-center px-4 py-2 text-gray-300 hover:text-white hover:bg-blue-800/50" onClick={() => setIsMenuOpen(false)}>
        <Building2 className="w-4 h-4 mr-2" />{getDashboardLabel()}
      </Link>
      <button type="button" onClick={onSignOut} className="w-full flex items-center px-4 py-2 text-gray-300 hover:text-white hover:bg-blue-800/50">
        <LogOut className="w-4 h-4 mr-2" />Sign Out
      </button>
    </>
  );

  const renderMenuContent = () => {
    if (!user) {
      return renderLoggedOutMenu();
    }

    switch (accountType) {
      case 'client':
        return renderClientMenu();
      case 'producer':
        return renderProducerMenu();
      case 'admin,producer':
        return renderProducerAdminMenu();
      case 'artist_band':
        return renderArtistMenu();
      case 'white_label':
        return renderWhiteLabelMenu();
      case 'rights_holder':
        return renderRightsHolderMenu();
      default:
        return renderClientMenu();
    }
  };

  return (
    <div className="relative">
      {/* Guitar Icon Button */}
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

      {/* Menu Dropdown - Fixed positioning to overlay the page */}
      {isMenuOpen && (
        <div className="fixed top-16 right-4 w-64 rounded-lg bg-blue-900/95 backdrop-blur-sm border border-blue-500/20 shadow-2xl z-[9999] max-h-[calc(100vh-8rem)] overflow-y-auto">
          <div className="py-2">
            {renderMenuContent()}
          </div>
        </div>
      )}
    </div>
  );
};

export default Navigation;
