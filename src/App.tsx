import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useSearchParams, Navigate, useParams } from 'react-router-dom';
import { ScrollToTop } from "./components/ScrollToTop";
import { SearchBox } from './components/SearchBox';
import { ProducerLogin } from './components/ProducerLogin';
import { ClientLogin } from './components/ClientLogin';
import { AdminLogin } from './components/AdminLogin';
import { ProducerDashboard } from './components/ProducerDashboard';
import { TrackUploadForm } from './components/TrackUploadForm';
import { ClientSignupDialog } from './components/ClientSignupDialog';
import { ClientDashboard } from './components/ClientDashboard';
import AdminDashboard from './components/AdminDashboard';
import { ProducerInvitation } from './components/ProducerInvitation';
import { ArtistInvitation } from './components/ArtistInvitation';
import { CatalogPage } from './components/CatalogPage';
import { VocalsPage } from './components/VocalsPage';
import { SyncOnlyPage } from './components/SyncOnlyPage';
import { LicensePage } from './components/LicensePage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { PricingCarousel } from './components/PricingCarousel';
import { ClientsCarousel } from './components/ClientsCarousel';
import { VideoCarousel } from './components/VideoCarousel';
import { HeroSection } from './components/HeroSection';
import { PricingPage } from './components/PricingPage';
import { ResetPassword } from './components/ResetPassword';
import { LicenseAgreement } from './components/LicenseAgreement';
import { SyncProposalLicenseAgreement } from './components/SyncProposalLicenseAgreement';
import { TestUpload } from './components/TestUpload';
import { useUnifiedAuth } from './contexts/UnifiedAuthContext';
import { GoldAccessPage } from './components/GoldAccessPage';
import CustomSyncRequest from './components/CustomSyncRequest';
import { OpenSyncBriefs } from './components/OpenSyncBriefs';
import RefundPolicy from './components/RefundPolicy';
import PrivacyPolicy from './components/PrivacyPolicy';
import DisputeResolution from './components/DisputeResolution';
import { AboutPage } from './components/AboutPage';
import ContactPage from './components/ContactPage';
import { AnnouncementsPage } from './components/AnnouncementsPage';
import { ChatSystem } from './components/ChatSystem';
import { ProducerBankingPage } from './components/ProducerBankingPage';
import { AdminBankingPage } from './components/AdminBankingPage';
import { CheckoutSuccessPage } from './components/CheckoutSuccessPage';
import { SyncProposalSuccessPage } from './components/SyncProposalSuccessPage';
import { ProducerPayoutsPage } from './components/ProducerPayoutsPage';
import { ProducerWithdrawalsPage } from './components/ProducerWithdrawalsPage';
import { TrackPage } from './components/TrackPage';
import { WelcomePage } from './components/WelcomePage';
import { WhiteLabelPage } from './components/WhiteLabelPage';
import { WhiteLabelSuccessPage } from './components/WhiteLabelSuccessPage';
import { WhiteLabelPasswordSetup } from './components/WhiteLabelPasswordSetup';
import ProducerLandingPage from './components/ProducerLandingPage';
import ProducerApplicationForm from './components/ProducerApplicationForm';
import ArtistApplicationForm from './components/ArtistApplicationForm';
import RightsHolderApplicationForm from './components/RightsHolderApplicationForm';
import ArtistDashboard from './components/ArtistDashboard';
import ArtistLogin from './components/ArtistLogin';
import ApplicationsAdmin from './components/ApplicationsAdmin';
import ArtistApplicationStatus from './components/ArtistApplicationStatus';
import ProducerApplicationsAdmin from './components/ProducerApplicationsAdmin';
import AdminWhiteLabelClientsPage from './components/AdminWhiteLabelClientsPage';
import { AdvancedAnalyticsDashboard } from './components/AdvancedAnalyticsDashboard';
import WhiteLabelAdminPage from './components/WhiteLabelAdminPage';
import AdminServicesPage from './components/AdminServicesPage';
import ServicesPage from './components/ServicesPage';
import ServiceOnboardingPage from './components/ServiceOnboardingPage';
import PublicServiceOnboardingPage from './components/PublicServiceOnboardingPage';
import ClientBrandingSettings from './components/ClientBrandingSettings';
import { WhiteLabelClientProfile } from './components/WhiteLabelClientProfile';
import { supabase } from './lib/supabase';
import { SiteBrandingProvider } from './contexts/SiteBrandingContext';
import { WhiteLabelClientLogin } from './components/WhiteLabelClientLogin';
import WhiteLabelClientDashboard from './components/WhiteLabelClientDashboard';
import ProducerSyncSubmission from './components/ProducerSyncSubmission';
import CustomSyncRequestSubs from './components/customsyncrequestsubs';
import PaymentSuccessPage from './components/PaymentSuccessPage';
import { EmailVerificationPage } from './components/EmailVerificationPage';
import { AuthCallback } from './components/AuthCallback';
import { useSecurity } from './hooks/useSecurity';
import SecurityBlock from './components/SecurityBlock';
import ProducerResourcesPage from './components/ProducerResourcesPage';
import AdminResourceManager from './components/AdminResourceManager';
import { ProducerTracksPage } from './components/ProducerTracksPage';
import { TrackDurationAdminPage } from './pages/TrackDurationAdminPage';
import { WelcomePDFTestPage } from './pages/WelcomePDFTestPage';
import PitchPage from './components/PitchPage';
import PitchSuccessPage from './components/PitchSuccessPage';

import { CustomSyncUploadPage } from './components/CustomSyncUploadPage';
import { ProducerFileReleaseManager } from './components/ProducerFileReleaseManager';
import { BusinessVerificationForm } from './components/BusinessVerificationForm';
import { PlaylistManager } from './components/PlaylistManager';
import { PlaylistManagerWrapper } from './components/PlaylistManagerWrapper';
import { PlaylistView } from './components/PlaylistView';
import { TestPlaylistView } from './components/TestPlaylistView';
import { PlaylistAnalytics } from './components/PlaylistAnalytics';
import { FavoritedPlaylistsPage } from './components/FavoritedPlaylistsPage';
import { FollowingPage } from './components/FollowingPage';
import { TestPlaylistRoute } from './components/TestPlaylistRoute';
// Removed refresh prevention imports to fix tab switching issue

// Rights Holders System Imports
import { RightsHolderSignup } from './components/RightsHolderSignup';
import { RightsHolderLogin } from './components/RightsHolderLogin';
import { RightsHolderDashboard } from './components/RightsHolderDashboard';
import { RightsHolderProtectedRoute } from './components/RightsHolderProtectedRoute';
import { AgentDashboard } from './components/AgentDashboard';
import { AgentRevenueReport } from './components/AgentRevenueReport';
import { AgentBanking } from './components/AgentBanking';
import { RightsHolderUploadForm } from './components/RightsHolderUploadForm';
import { RightsHolderSplitSheets } from './components/RightsHolderSplitSheets';
import { TermsAndConditions } from './components/TermsAndConditions';
import ApplicationTypeSelector from './components/ApplicationTypeSelector';
import { RightsHolderAnalytics } from './components/RightsHolderAnalytics';
import { RightsHolderRecordings } from './components/RightsHolderRecordings';
import SyncLicensingCourse from './components/SyncLicensingCourse';
         import { RightsHolderESignatures } from './components/RightsHolderESignatures';
         import { RightsHolderLicensing } from './components/RightsHolderLicensing';
         import { RightsHolderBankingPage } from './components/RightsHolderBankingPage';
         import { RightsHolderRosterPage } from './components/RightsHolderRosterPage';
import { RosterFinancialReporting } from './components/RosterFinancialReporting';
import { RightsHolderResourcesPage } from './components/RightsHolderResourcesPage';
import { RightsVerificationAdmin } from './components/RightsVerificationAdmin';
import { RightsHolderTest } from './components/RightsHolderTest';
import { RightsHolderAwaitingApproval } from './components/RightsHolderAwaitingApproval';
import { SyncProposalDialog } from './components/SyncProposalDialog';
import { RightsHolderSyncProposalDialog } from './components/RightsHolderSyncProposalDialog';
import { SyncProposalsPage } from './components/SyncProposalsPage';
import { CustomSyncRequestDetail } from './components/CustomSyncRequestDetail';
import { CustomSyncRequestsPage } from './components/CustomSyncRequestsPage';
import { ProfilePage } from './components/ProfilePage';
import RightsHolderSyncSubmission from './components/RightsHolderSyncSubmission';
import RightsHolderCustomSyncSubs from './components/RightsHolderCustomSyncSubs';
import RightsHolderTerms from './components/RightsHolderTerms';
import ProducerTerms from './components/ProducerTerms';
import { WelcomeEmailTest } from './components/WelcomeEmailTest';
import DripEmailPreview from './components/DripEmailPreview';

const App = () => {
  console.log('🚀 App component loaded');
  const [searchParams] = useSearchParams();
  const [isSignupOpen, setIsSignupOpen] = useState(false);
  const { user, accountType } = useUnifiedAuth();
  const navigate = useNavigate();
  
  // Refresh prevention system removed to fix tab switching issue
  
  // Security hook for the entire application
  const {
    securityViolations,
    isBlocked,
    clearViolations,
    logSecurityViolation,
  } = useSecurity({
    enableRateLimiting: true,
    enableInputValidation: true,
    enableXSSProtection: true,
  });
  
  // Check if we have email and redirect params that should trigger opening the signup dialog
  useEffect(() => {
    const email = searchParams.get('email');
    const redirect = searchParams.get('redirect');
    
    if (email && redirect === 'pricing' && !user) {
      setIsSignupOpen(true);
    }
  }, [searchParams, user]);

  // Security monitoring - log suspicious activities
  useEffect(() => {
    // Monitor for rapid navigation changes (potential bot activity)
    let navigationCount = 0;
    const handleNavigation = () => {
      navigationCount++;
      if (navigationCount > 10) {
        logSecurityViolation('Suspicious navigation pattern detected');
      }
    };

    window.addEventListener('popstate', handleNavigation);
    return () => window.removeEventListener('popstate', handleNavigation);
  }, [logSecurityViolation]);

  // Security: Block access if user is blocked
  if (isBlocked) {
    return (
      <SecurityBlock
        violations={securityViolations}
        onClearViolations={clearViolations}
        isBlocked={isBlocked}
      />
    );
  }

  const LayoutWrapper = ({ children }: { children: React.ReactNode }) => (
    <Layout onSignupClick={() => setIsSignupOpen(true)}>
      {children}
    </Layout>
  );

  const HomeLayoutWrapper = ({ children }: { children: React.ReactNode }) => (
    <Layout onSignupClick={() => setIsSignupOpen(true)} hideHeader={true}>
      {children}
    </Layout>
  );

  const ProducerLandingWrapper = ({ children }: { children: React.ReactNode }) => (
    <Layout onSignupClick={() => setIsSignupOpen(true)} hideHeader={true}>
      {children}
    </Layout>
  );

  const handleSearch = (filters: { query?: string; genres?: string[]; moods?: string[]; minBpm?: number; maxBpm?: number }) => {
    const params = new URLSearchParams();
    if (filters.query) params.set('q', filters.query);
    if (filters.genres?.length) params.set('genres', filters.genres.join(','));
    if (filters.moods?.length) params.set('moods', filters.moods.join(','));
    if (filters.minBpm) params.set('minBpm', filters.minBpm.toString());
    if (filters.maxBpm) params.set('maxBpm', filters.maxBpm.toString());

    navigate(`/catalog?${params.toString()}`);
  };

  function BrandingRouteWrapper() {
    const { user } = useUnifiedAuth();
    const [allowed, setAllowed] = useState<'loading' | 'yes' | 'no'>('loading');

    useEffect(() => {
      if (!user) {
        setAllowed('no');
        return;
      }
      supabase
        .from('white_label_clients')
        .select('id')
        .eq('owner_id', user.id)
        .single()
        .then(({ data }) => {
          setAllowed(data ? 'yes' : 'no');
        });
    }, [user]);

    if (allowed === 'loading') return <div className="p-8 text-center text-gray-400">Loading...</div>;
    if (allowed === 'no') return <Navigate to="/" />;
    return <ClientBrandingSettings />;
  }

  function WhiteLabelProfileWrapper() {
    const { accountType, needsPasswordSetup } = useUnifiedAuth();

    if (accountType === 'white_label' && needsPasswordSetup) {
      return <Navigate to="/white-label-password-setup" />;
    }

    return <WhiteLabelClientProfile />;
  }



  return (
    <SiteBrandingProvider>
      <ScrollToTop />
        <Routes>
        <Route path="/" element={
          <HomeLayoutWrapper>
            <HeroSection onSearch={handleSearch} onSignupClick={() => setIsSignupOpen(true)} />

            <section className="py-12 bg-black/20">
              <div className="container mx-auto px-4">
                <SearchBox onSearch={handleSearch} />
              </div>
            </section>

            <section className="py-20">
              <div className="container mx-auto px-4">
                <h2 className="text-3xl font-bold text-center mb-12">Perfect for Your Media</h2>
                <div className="max-w-5xl mx-auto">
                  <VideoCarousel />
                </div>
              </div>
            </section>

            <section className="py-20 bg-black/40">
              <div className="container mx-auto px-4">
                <h2 className="text-3xl font-bold text-center mb-12">Choose Your Plan</h2>
                <PricingCarousel />
              </div>
            </section>

            <section className="py-20">
              <div className="container mx-auto px-4">
                <h2 className="text-3xl font-bold text-center mb-12">Where Our Music is Featured</h2>
                <ClientsCarousel />
              </div>
            </section>
          </HomeLayoutWrapper>
        } />

        <Route path="/catalog" element={<LayoutWrapper><CatalogPage /></LayoutWrapper>} />
        <Route path="/vocals" element={<LayoutWrapper><VocalsPage /></LayoutWrapper>} />
        <Route path="/sync-only" element={<LayoutWrapper><SyncOnlyPage /></LayoutWrapper>} />
        <Route path="/pricing" element={<LayoutWrapper><PricingPage /></LayoutWrapper>} />
        <Route path="/reset-password" element={<LayoutWrapper><ResetPassword /></LayoutWrapper>} />
        <Route path="/test-upload" element={<LayoutWrapper><TestUpload /></LayoutWrapper>} />
        <Route path="/test-welcome-email" element={<WelcomeEmailTest />} />
        <Route path="/test-welcome-pdf" element={<WelcomePDFTestPage />} />
        <Route path="/drip-email-preview" element={<DripEmailPreview />} />

        <Route path="/upgrade" element={<LayoutWrapper><PricingPage /></LayoutWrapper>} />
        <Route path="/refund-policy" element={<LayoutWrapper><RefundPolicy /></LayoutWrapper>} />
        <Route path="/privacy" element={<LayoutWrapper><PrivacyPolicy /></LayoutWrapper>} />
        <Route path="/terms" element={<LayoutWrapper><TermsAndConditions /></LayoutWrapper>} />
        <Route path="/dispute-resolution" element={<LayoutWrapper><DisputeResolution /></LayoutWrapper>} />
        <Route path="/about" element={<LayoutWrapper><AboutPage /></LayoutWrapper>} />
<Route path="/contact" element={<LayoutWrapper><ContactPage /></LayoutWrapper>} />
        <Route path="/sync-licensing-course" element={<LayoutWrapper><SyncLicensingCourse /></LayoutWrapper>} />
        <Route path="/application-type-selector" element={<LayoutWrapper><ApplicationTypeSelector /></LayoutWrapper>} />
        <Route path="/announcements" element={<LayoutWrapper><AnnouncementsPage /></LayoutWrapper>} />
        <Route path="/checkout/success" element={<LayoutWrapper><CheckoutSuccessPage /></LayoutWrapper>} />
        <Route path="/sync-proposal/success" element={<LayoutWrapper><SyncProposalSuccessPage /></LayoutWrapper>} />
        <Route path="/pitch" element={<LayoutWrapper><PitchPage /></LayoutWrapper>} />
        <Route path="/pitch/success" element={<LayoutWrapper><PitchSuccessPage /></LayoutWrapper>} />
        <Route path="/welcome" element={<LayoutWrapper><WelcomePage /></LayoutWrapper>} />
        <Route path="/track/:trackId" element={<LayoutWrapper><TrackPage /></LayoutWrapper>} />
        <Route path="/test-playlist/*" element={<LayoutWrapper><PlaylistView /></LayoutWrapper>} />
        <Route path="/test-simple" element={<LayoutWrapper><div className="min-h-screen bg-red-900 flex items-center justify-center"><div className="text-white text-2xl">Simple Route Working!</div></div></LayoutWrapper>} />
        <Route path="/music-playlist/:slug" element={<LayoutWrapper><TestPlaylistRoute /></LayoutWrapper>} />
        <Route path="/producer/:producerId/tracks" element={<LayoutWrapper><ProducerTracksPage /></LayoutWrapper>} />
        <Route path="/white-label" element={<LayoutWrapper><WhiteLabelPage /></LayoutWrapper>} />
        <Route path="/white-label/success" element={<LayoutWrapper><WhiteLabelSuccessPage /></LayoutWrapper>} />
                 <Route path="/producers" element={<ProducerLandingWrapper><ProducerLandingPage /></ProducerLandingWrapper>} />
        <Route path="/producer-application" element={<LayoutWrapper><ProducerApplicationForm /></LayoutWrapper>} />
<Route path="/artist-application" element={<LayoutWrapper><ArtistApplicationForm /></LayoutWrapper>} />
<Route path="/rights-holder-application" element={<LayoutWrapper><RightsHolderApplicationForm /></LayoutWrapper>} />
        <Route path="/producer-applications-admin" element={
          <ProtectedRoute requiresAdmin>
            <LayoutWrapper>
              <ProducerApplicationsAdmin />
            </LayoutWrapper>
          </ProtectedRoute>
        } />
        
        <Route path="/applications-admin" element={
          <ProtectedRoute requiresAdmin>
            <LayoutWrapper>
              <ApplicationsAdmin />
            </LayoutWrapper>
          </ProtectedRoute>
        } />
        <Route path="/artist-application-status" element={
          <ProtectedRoute>
            <LayoutWrapper>
              <ArtistApplicationStatus />
            </LayoutWrapper>
          </ProtectedRoute>
        } />
        <Route path="/admin/white-label-clients" element={
          <ProtectedRoute requiresAdmin>
            <AdminWhiteLabelClientsPage />
          </ProtectedRoute>
        } />
        

        <Route path="/chat" element={
          <ProtectedRoute>
            <LayoutWrapper>
              <ChatSystem />
            </LayoutWrapper>
          </ProtectedRoute>
        } />



        <Route path="/custom-sync-request-subs" element={
          <ProtectedRoute>
            <LayoutWrapper>
              <CustomSyncRequestSubs />
            </LayoutWrapper>
          </ProtectedRoute>
        } />

        <Route path="/open-sync-briefs" element={
          <ProtectedRoute>
            <LayoutWrapper>
              <OpenSyncBriefs />
            </LayoutWrapper>
          </ProtectedRoute>
        } />

        <Route path="/license/:trackId" element={
          <ProtectedRoute requiresClient>
            <LayoutWrapper>
              <LicensePage />
            </LayoutWrapper>
          </ProtectedRoute>
        } />

        <Route path="/license-agreement/:licenseId" element={
          <ProtectedRoute>
            <LayoutWrapper>
              <LicenseAgreement />
            </LayoutWrapper>
          </ProtectedRoute>
        } />

        <Route path="/sync-proposal-license-agreement/:proposalId" element={
          <ProtectedRoute>
            <LayoutWrapper>
              <SyncProposalLicenseAgreement />
            </LayoutWrapper>
          </ProtectedRoute>
        } />

        <Route path="/login" element={
          <LayoutWrapper>
            <ClientLogin />
          </LayoutWrapper>
        } />

        <Route path="/signup" element={
          <LayoutWrapper>
            <ClientSignupDialog isOpen={true} onClose={() => navigate('/')} />
          </LayoutWrapper>
        } />
        
        <Route path="/producer/login" element={
          <LayoutWrapper>
            <ProducerLogin />
          </LayoutWrapper>
        } />
        
        <Route path="/artist/login" element={
          <LayoutWrapper>
            <ArtistLogin />
          </LayoutWrapper>
        } />
        
        <Route path="/producer/dashboard" element={
          <ProtectedRoute requiresProducer>
            <LayoutWrapper>
              <ProducerDashboard />
            </LayoutWrapper>
          </ProtectedRoute>
        } />
        
        <Route path="/artist/dashboard" element={
          <ProtectedRoute requiresArtist>
            <LayoutWrapper>
              <ArtistDashboard />
            </LayoutWrapper>
          </ProtectedRoute>
        } />
        
        <Route path="/producer/upload" element={
          <ProtectedRoute requiresProducer>
            <LayoutWrapper>
              <TrackUploadForm />
            </LayoutWrapper>
          </ProtectedRoute>
        } />

        <Route path="/producer/custom-sync-upload" element={
          <ProtectedRoute requiresProducer>
            <CustomSyncUploadPage />
          </ProtectedRoute>
        } />

        <Route path="/producer/banking" element={
          <ProtectedRoute requiresProducer>
            <LayoutWrapper>
              <ProducerBankingPage />
            </LayoutWrapper>
          </ProtectedRoute>
        } />

        <Route path="/producer/payouts" element={
          <ProtectedRoute requiresProducer>
            <LayoutWrapper>
              <ProducerPayoutsPage />
            </LayoutWrapper>
          </ProtectedRoute>
        } />

        <Route path="/producer/withdrawals" element={
          <ProtectedRoute requiresProducer>
            <LayoutWrapper>
              <ProducerWithdrawalsPage />
            </LayoutWrapper>
          </ProtectedRoute>
        } />

        <Route path="/producer/resources" element={
          <ProtectedRoute>
            <LayoutWrapper>
              <ProducerResourcesPage />
            </LayoutWrapper>
          </ProtectedRoute>
        } />

        <Route path="/producer/file-releases" element={
          <ProtectedRoute requiresProducer>
            <LayoutWrapper>
              <ProducerFileReleaseManager />
            </LayoutWrapper>
          </ProtectedRoute>
        } />
        <Route path="/producer/playlists" element={
          <ProtectedRoute requiresProducer>
            <LayoutWrapper>
              <PlaylistManagerWrapper />
            </LayoutWrapper>
          </ProtectedRoute>
        } />
        <Route path="/client/playlists" element={
          <ProtectedRoute requiresClient>
            <LayoutWrapper>
              <PlaylistManager accountType="client" />
            </LayoutWrapper>
          </ProtectedRoute>
        } />
        <Route path="/artist/playlists" element={
          <ProtectedRoute requiresArtist>
            <LayoutWrapper>
              <PlaylistManager accountType="artist_band" />
            </LayoutWrapper>
          </ProtectedRoute>
        } />
        <Route path="/record-label/playlists" element={
          <ProtectedRoute requiresRecordLabel>
            <LayoutWrapper>
              <PlaylistManager accountType="rights_holder" />
            </LayoutWrapper>
          </ProtectedRoute>
        } />
                <Route path="/producer/playlists/:playlistId/analytics" element={
          <ProtectedRoute requiresProducer>
            <LayoutWrapper>
              <PlaylistAnalytics />
            </LayoutWrapper>
          </ProtectedRoute>
        } />
        <Route path="/favorited-playlists" element={
          <ProtectedRoute>
            <LayoutWrapper>
              <FavoritedPlaylistsPage />
            </LayoutWrapper>
          </ProtectedRoute>
        } />

        <Route path="/following" element={
          <ProtectedRoute>
            <LayoutWrapper>
              <FollowingPage />
            </LayoutWrapper>
          </ProtectedRoute>
        } />

        <Route path="/business-verification" element={
          <ProtectedRoute>
            <LayoutWrapper>
              <BusinessVerificationForm />
            </LayoutWrapper>
          </ProtectedRoute>
        } />

        <Route path="/admin/resources" element={
          <ProtectedRoute requiresAdmin>
            <LayoutWrapper>
              <AdminResourceManager />
            </LayoutWrapper>
          </ProtectedRoute>
        } />

        <Route path="/dashboard" element={
          <ProtectedRoute>
            <LayoutWrapper>
              <ClientDashboard />
            </LayoutWrapper>
          </ProtectedRoute>
        } />

        <Route path="/agent/dashboard" element={
          <ProtectedRoute requiresAgent>
            <LayoutWrapper>
              <AgentDashboard />
            </LayoutWrapper>
          </ProtectedRoute>
        } />

        <Route path="/agent/revenue-report" element={
          <ProtectedRoute requiresAgent>
            <LayoutWrapper>
              <AgentRevenueReport />
            </LayoutWrapper>
          </ProtectedRoute>
        } />

        <Route path="/agent/banking" element={
          <ProtectedRoute requiresAgent>
            <LayoutWrapper>
              <AgentBanking />
            </LayoutWrapper>
          </ProtectedRoute>
        } />

        <Route path="/white-label-dashboard" element={
          <ProtectedRoute>
            <LayoutWrapper>
              <WhiteLabelClientDashboard />
            </LayoutWrapper>
          </ProtectedRoute>
        } />

        <Route path="/admin/login" element={
          <LayoutWrapper>
            <AdminLogin />
          </LayoutWrapper>
        } />

        <Route path="/admin" element={
          <ProtectedRoute requiresAdmin>
            <LayoutWrapper>
              <AdminDashboard />
            </LayoutWrapper>
          </ProtectedRoute>
        } />

        <Route path="/admin/invite-producer" element={
          <ProtectedRoute requiresAdmin>
            <LayoutWrapper>
              <ProducerInvitation />
            </LayoutWrapper>
          </ProtectedRoute>
        } />

        <Route path="/admin/invite-artist" element={
          <ProtectedRoute requiresAdmin>
            <LayoutWrapper>
              <ArtistInvitation />
            </LayoutWrapper>
          </ProtectedRoute>
        } />

        <Route path="/admin/banking" element={
          <ProtectedRoute requiresAdmin>
            <LayoutWrapper>
              <AdminBankingPage />
            </LayoutWrapper>
          </ProtectedRoute>
        } />
        <Route path="/admin/producer-applications" element={
          <ProtectedRoute requiresAdmin>
            <LayoutWrapper>
              <ProducerApplicationsAdmin />
            </LayoutWrapper>
          </ProtectedRoute>
        } />

        <Route path="/admin/track-durations" element={
          <ProtectedRoute requiresAdmin>
            <TrackDurationAdminPage />
          </ProtectedRoute>
        } />

        <Route path="/advanced-analytics" element={
          <ProtectedRoute requiresAdmin>
            <LayoutWrapper>
              <AdvancedAnalyticsDashboard />
            </LayoutWrapper>
          </ProtectedRoute>
        } />

        <Route path="/admin/white-label" element={
          <ProtectedRoute requiresAdmin>
            <WhiteLabelAdminPage />
          </ProtectedRoute>
        } />

        <Route path="/admin/services" element={
          <ProtectedRoute requiresAdmin>
            <AdminServicesPage />
          </ProtectedRoute>
        } />

        <Route path="/services" element={
          <ProtectedRoute requiresAdmin>
            <LayoutWrapper>
              <ServicesPage />
            </LayoutWrapper>
          </ProtectedRoute>
        } />

        <Route path="/service-onboarding/:token" element={<ServiceOnboardingPage />} />
        <Route path="/service-onboarding-public" element={<PublicServiceOnboardingPage />} />

        <Route path="/branding" element={<BrandingRouteWrapper />} />

        <Route path="/white-label-login" element={<WhiteLabelClientLogin />} />

        <Route path="/white-label-password-setup" element={
          <ProtectedRoute>
            <WhiteLabelPasswordSetup />
          </ProtectedRoute>
        } />

        <Route path="/white-label-profile" element={
          <ProtectedRoute>
            <WhiteLabelProfileWrapper />
          </ProtectedRoute>
        } />

        <Route path="/white-label-dashboard" element={
          <ProtectedRoute>
            <WhiteLabelClientDashboard />
          </ProtectedRoute>
        } />

        <Route path="/producer-sync-submission" element={<LayoutWrapper><ProducerSyncSubmission /></LayoutWrapper>} />

        <Route path="/payment-success" element={<PaymentSuccessPage />} />

        {/* Email verification routes */}
        <Route path="/auth/verify-email" element={<EmailVerificationPage />} />
        <Route path="/auth/callback" element={<AuthCallback />} />

        {/* Rights Holders System Routes */}
        <Route path="/rights-holder/signup" element={<RightsHolderSignup />} />
        <Route path="/rights-holder/login" element={<RightsHolderLogin />} />
        <Route path="/rights-holder/dashboard" element={
          <RightsHolderProtectedRoute>
            <LayoutWrapper>
              <RightsHolderDashboard />
            </LayoutWrapper>
          </RightsHolderProtectedRoute>
        } />
        <Route path="/rights-holder/upload" element={
          <RightsHolderProtectedRoute>
            <LayoutWrapper>
              <TrackUploadForm />
            </LayoutWrapper>
          </RightsHolderProtectedRoute>
        } />
        <Route path="/rights-holder/split-sheets" element={
          <RightsHolderProtectedRoute>
            <LayoutWrapper>
              <RightsHolderSplitSheets />
            </LayoutWrapper>
          </RightsHolderProtectedRoute>
        } />
        <Route path="/rights-holder/analytics" element={
          <RightsHolderProtectedRoute>
            <LayoutWrapper>
              <RightsHolderAnalytics />
            </LayoutWrapper>
          </RightsHolderProtectedRoute>
        } />
        <Route path="/rights-holder/recordings" element={
          <RightsHolderProtectedRoute>
            <LayoutWrapper>
              <RightsHolderRecordings />
            </LayoutWrapper>
          </RightsHolderProtectedRoute>
        } />
        <Route path="/rights-holder/e-signatures" element={
          <RightsHolderProtectedRoute>
            <LayoutWrapper>
              <RightsHolderESignatures />
            </LayoutWrapper>
          </RightsHolderProtectedRoute>
        } />
        <Route path="/rights-holder/licensing" element={
          <RightsHolderProtectedRoute>
            <LayoutWrapper>
              <RightsHolderLicensing />
            </LayoutWrapper>
          </RightsHolderProtectedRoute>
        } />
                 <Route path="/rights-holder/banking" element={
           <RightsHolderProtectedRoute>
             <LayoutWrapper>
               <RightsHolderBankingPage />
             </LayoutWrapper>
           </RightsHolderProtectedRoute>
         } />
         <Route path="/rights-holder/roster" element={
           <RightsHolderProtectedRoute>
             <LayoutWrapper>
               <RightsHolderRosterPage />
             </LayoutWrapper>
           </RightsHolderProtectedRoute>
         } />
         <Route path="/rights-holder/financial-reporting" element={
           <RightsHolderProtectedRoute>
             <LayoutWrapper>
               <RosterFinancialReporting />
             </LayoutWrapper>
           </RightsHolderProtectedRoute>
         } />
        <Route path="/admin/rights-verification" element={
          <ProtectedRoute requiresAdmin>
            <RightsVerificationAdmin />
          </ProtectedRoute>
        } />
        <Route path="/rights-holder/test" element={<RightsHolderTest />} />
        <Route path="/rights-holder/awaiting-approval" element={<RightsHolderAwaitingApproval />} />
        <Route path="/rights-holder/terms" element={<RightsHolderTerms />} />
        <Route path="/producer/terms" element={<ProducerTerms />} />

        {/* Rights Holder Sync Proposals */}
              <Route path="/sync-proposal/:id" element={
        <RightsHolderProtectedRoute>
          <LayoutWrapper>
            <RightsHolderSyncProposalDialog />
          </LayoutWrapper>
        </RightsHolderProtectedRoute>
      } />
        <Route path="/sync-proposals" element={
          <RightsHolderProtectedRoute>
            <LayoutWrapper>
              <SyncProposalsPage />
            </LayoutWrapper>
          </RightsHolderProtectedRoute>
        } />
        
        {/* Rights Holder Custom Sync Requests */}
              <Route path="/custom-sync-request" element={
          <RightsHolderProtectedRoute>
            <LayoutWrapper>
              <RightsHolderSyncSubmission />
            </LayoutWrapper>
          </RightsHolderProtectedRoute>
        } />
        <Route path="/custom-sync-request/:id" element={
          <RightsHolderProtectedRoute>
            <LayoutWrapper>
              <CustomSyncRequestDetail />
            </LayoutWrapper>
          </RightsHolderProtectedRoute>
        } />
        <Route path="/custom-sync-requests" element={
          <RightsHolderProtectedRoute>
            <LayoutWrapper>
              <CustomSyncRequestsPage />
            </LayoutWrapper>
          </RightsHolderProtectedRoute>
        } />
        <Route path="/rights-holder/custom-sync-subs" element={
          <RightsHolderProtectedRoute>
            <LayoutWrapper>
              <RightsHolderCustomSyncSubs />
            </LayoutWrapper>
          </RightsHolderProtectedRoute>
        } />

        {/* Client Custom Sync Request */}
        <Route path="/client/custom-sync-request" element={
          <ProtectedRoute requiresClient>
            <LayoutWrapper>
              <CustomSyncRequest />
            </LayoutWrapper>
          </ProtectedRoute>
        } />

        {/* Agent Custom Sync Request */}
        <Route path="/agent/custom-sync-request" element={
          <ProtectedRoute requiresAgent>
            <LayoutWrapper>
              <CustomSyncRequest />
            </LayoutWrapper>
          </ProtectedRoute>
        } />
        <Route path="/agent/custom-sync-requests" element={
          <ProtectedRoute requiresAgent>
            <LayoutWrapper>
              <CustomSyncRequestsPage />
            </LayoutWrapper>
          </ProtectedRoute>
        } />
        <Route path="/agent/custom-sync-request-subs" element={
          <ProtectedRoute requiresAgent>
            <LayoutWrapper>
              <CustomSyncRequestSubs />
            </LayoutWrapper>
          </ProtectedRoute>
        } />

        {/* Profile Route */}
        <Route path="/profile" element={
          <LayoutWrapper>
            <ProfilePage />
          </LayoutWrapper>
        } />

        <Route path="*" element={
          <LayoutWrapper>
            <div className="min-h-screen flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-4xl font-bold text-white mb-4">404</h1>
                <p className="text-gray-400">Page not found</p>
              </div>
            </div>
          </LayoutWrapper>
        } />
      </Routes>

      <ClientSignupDialog
        isOpen={isSignupOpen}
        onClose={() => setIsSignupOpen(false)}
      />
    </SiteBrandingProvider>
  );
};

export default App;
