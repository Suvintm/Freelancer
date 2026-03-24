import React, { useState, useEffect, useMemo } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import SplashScreen from "./components/SplashScreen.jsx";
import Homepage from "./pages/Homepage.jsx";
import ClientHome from "./pages/clientHome.jsx";
import EditorHome from "./pages/EditorHome.jsx";
import EditorProfilePage from "./pages/EditorProfilePage.jsx";
import EditorMyorderspage from "./pages/EditorMyorderspage.jsx";
import EditorProfileUpdate from "./pages/EditorProfileUpdate.jsx";
import ClientProfileUpdate from "./pages/ClientProfileUpdate.jsx";
import ReelUploadPage from "./pages/ReelUploadPage.jsx";
import PublicEditorProfile from "./pages/PublicEditorProfile.jsx";
import ReelsPage from "./pages/ReelsPage.jsx";
import ReelsExplore from "./pages/ReelsExplore.jsx";
import ReelsAnalytics from "./pages/ReelsAnalytics.jsx";
import NotificationsPage from "./pages/NotificationsPage.jsx";
import AllChatsPage from "./pages/AllChatsPage.jsx";
import Chatbox from "./components/ChatPage.jsx"; // This seems to be the actual chat component
import MobileBottomNav from "./components/MobileBottomNav.jsx";
import { useAppContext } from "./context/AppContext.jsx"; // Assuming this context exists

// Gig & Order Pages
import CreateGig from "./pages/CreateGig.jsx";
import MyGigs from "./pages/MyGigs.jsx";
import MyOrders from "./pages/MyOrders.jsx";

// Client Pages
import ClientOrders from "./pages/ClientOrders.jsx";
import ClientProfile from "./pages/ClientProfile.jsx";
import SavedEditors from "./pages/SavedEditors.jsx";
import ExplorePage from "./pages/ExplorePage.jsx";

// OAuth Pages
import OAuthSuccess from "./pages/OAuthSuccess.jsx";
import SelectRole from "./pages/SelectRole.jsx";

// Special Pages
import BannedPage from "./pages/BannedPage.jsx";
import MaintenancePage from "./pages/MaintenancePage.jsx";
import EditorAnalytics from "./pages/EditorAnalytics.jsx";
import ClientAnalytics from "./pages/ClientAnalytics.jsx";
import PaymentsPage from "./pages/PaymentsPage.jsx";
import PaymentSuccess from "./pages/PaymentSuccess.jsx";
import RequestPaymentSuccess from "./pages/RequestPaymentSuccess.jsx";
import KYCDetailsPage from "./pages/KYCDetailsPage.jsx";
import StoragePlans from "./pages/StoragePlans.jsx";
import DownloadPage from "./pages/DownloadPage.jsx";

// Subscription Pages
import SubscriptionPlansPage from "./pages/SubscriptionPlansPage.jsx";
import ProfileInsightsPage from "./pages/ProfileInsightsPage.jsx";
import SuvixScorePage from "./pages/SuvixScorePage.jsx";
import ClientKYCPage from "./pages/ClientKYCPage.jsx";

import LegalCenterPage from "./pages/LegalCenterPage.jsx";

import LocalEditorsNetworkPage from "./pages/LocalEditorsNetworkPage.jsx";
import LocationSettingsPage from "./pages/LocationSettingsPage.jsx";
import AchievementsPage from "./pages/AchievementsPage.jsx";
import FollowSuggestionsPage from "./pages/FollowSuggestionsPage.jsx";
import ForgotPasswordPage from "./pages/ForgotPasswordPage.jsx";
import ResetPasswordPage from "./pages/ResetPasswordPage.jsx";

// Open Briefs Pages
import OpenBriefsPage from "./pages/OpenBriefsPage.jsx";
import BriefDetailPage from "./pages/BriefDetailPage.jsx";
import CreateBriefPage from "./pages/CreateBriefPage.jsx";
import MyBriefsPage from "./pages/MyBriefsPage.jsx";
import ManageBriefPage from "./pages/ManageBriefPage.jsx";
import MyProposalsPage from "./pages/MyProposalsPage.jsx";

// Job Portal Pages
import JobDetailsPage from "./pages/JobDetailsPage.jsx";
import PostJobPage from "./pages/PostJobPage.jsx";
import MyJobsPage from "./pages/MyJobsPage.jsx";
import JobApplicantsPage from "./pages/JobApplicantsPage.jsx";
import MyApplicationsPage from "./pages/MyApplicationsPage.jsx";
import JobsPage from "./pages/JobsPage.jsx";
import AdDetailsPage from "./pages/AdDetailsPage.jsx";
import EditorWallet from "./pages/EditorWallet.jsx";
import AdvertisePage from "./pages/AdvertisePage.jsx";
import AdvertiseNewPage from "./pages/Advertisenewpage.jsx";
import StoriesPage from "./pages/StoriesPage.jsx";
import ConnectionsPage from "./pages/ConnectionsPage.jsx";
import AIWorkspacePage from "./components/AIWorkspace/AIWorkspacePage.jsx";

import { TermsAndConditions, PrivacyPolicy, ContentProtectionPolicy, EditorCodeOfConduct } from "./pages/LegalPages";

import ProtectedRoute from "./components/ProtectedRoute.jsx";
import RestrictedAccess from "./components/RestrictedAccess.jsx";

import "react-toastify/dist/ReactToastify.css";
import { ToastContainer } from "react-toastify";

// ── TAB SWITCHER COMPONENT ──────────────────────────────────────────
const TabSwitcher = () => {
  const { user } = useAppContext();
  const location = useLocation();
  const [mountedTabs, setMountedTabs] = useState(new Set());

  // Define tabs configuration
  const tabs = useMemo(() => [
    { id: "home", path: user?.role === "client" ? "/client-home" : "/editor-home", component: user?.role === "client" ? ClientHome : EditorHome },
    { id: "explore", path: "/explore", component: ExplorePage },
    { id: "nearby", path: "/editors-near-you", component: LocalEditorsNetworkPage },
    { id: "reels", path: "/reels", component: ReelsPage },
    { id: "jobs", path: "/jobs", component: JobsPage },
    { id: "chats", path: "/chats", component: AllChatsPage },
    { id: "profile", path: user?.role === "client" ? "/client-profile" : "/editor-profile", component: user?.role === "client" ? ClientProfile : EditorProfilePage },
  ], [user?.role]);

  // Current active tab ID - modified to handle sub-routes (like /explore/reelsfeed)
  const activeTabId = tabs.find(t => 
    location.pathname === t.path || (t.id === "explore" && location.pathname.startsWith("/explore"))
  )?.id;

  // Track which tabs have been visited (Lazy Load)
  useEffect(() => {
    if (activeTabId) {
      setMountedTabs(prev => new Set([...prev, activeTabId]));
    }
  }, [activeTabId]);

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#FAFAFA] dark:bg-[#09090B]">
      {tabs.map((tab) => {
        const isMounted = mountedTabs.has(tab.id);
        const isActive = activeTabId === tab.id;

        if (!isMounted) return null;

        return (
          <motion.div
            key={tab.id}
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: isActive ? 1 : 0,
              pointerEvents: isActive ? "auto" : "none",
              visibility: isActive ? "visible" : "hidden"
            }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 w-full h-full bg-[#FAFAFA] dark:bg-[#09090B] overflow-hidden z-10"
            style={{ 
              display: isActive ? "block" : "none" // Force display none for non-active to save GPU
            }}
          >
            <tab.component isActive={isActive} />
          </motion.div>
        );
      })}
    </div>
  );
};

function App() {
  const [showSplash, setShowSplash] = useState(false);
  const { user, geoBlocked } = useAppContext();

  useEffect(() => {
    const SPLASH_COOLDOWN = 30 * 60 * 1000; // 30 minutes
    const RE_ENTRY_THRESHOLD = 10 * 1000; // 10 seconds (Testing)

    const triggerSplash = () => {
      setShowSplash(true);
      localStorage.setItem('lastSplashTime', Date.now().toString());
      setTimeout(() => setShowSplash(false), 3500);
    };

    // 1. Initial Load Logic
    const now = Date.now();
    const lastSessionSplash = sessionStorage.getItem('splashShown');
    const lastGlobalSplash = localStorage.getItem('lastSplashTime');

    if (!lastSessionSplash || !lastGlobalSplash || (now - parseInt(lastGlobalSplash) > SPLASH_COOLDOWN)) {
      triggerSplash();
      sessionStorage.setItem('splashShown', 'true');
    }

    // 2. Visibility Change Logic (Re-entry after 2 mins)
    const handleVisibilityChange = () => {
      const currentTime = Date.now();
      if (document.hidden) {
        localStorage.setItem('lastHiddenTime', currentTime.toString());
      } else {
        const lastHidden = localStorage.getItem('lastHiddenTime');
        if (lastHidden && (currentTime - parseInt(lastHidden) > RE_ENTRY_THRESHOLD)) {
          triggerSplash();
        }
        // Reset hidden time once retrieved/checked
        localStorage.removeItem('lastHiddenTime');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <>
      {geoBlocked && <RestrictedAccess type={geoBlocked} />}
      <AnimatePresence>
        {/* {showSplash && <SplashScreen key="splash" />} */}
      </AnimatePresence>
      <ToastContainer />


      <Routes>
        {/* Public & Legal Routes */}
        <Route path="/legal-center" element={<LegalCenterPage />} />
        <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/content-protection-policy" element={<ContentProtectionPolicy />} />
        <Route path="/editor-code-of-conduct" element={<EditorCodeOfConduct />} />
        <Route path="/" element={<Homepage />} />
        <Route path="/oauth-success" element={<OAuthSuccess />} />
        <Route path="/select-role" element={<SelectRole />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
        <Route path="/banned" element={<BannedPage />} />
        <Route path="/maintenance" element={<MaintenancePage />} />
        <Route path="/request-payment-success" element={<RequestPaymentSuccess />} />

        {/* ============ TAB CATCHER ============ */}
        {/* All these paths share a single persistent TabSwitcher instance to prevent re-mounting delays */}
        <Route element={<ProtectedRoute><TabSwitcher /></ProtectedRoute>}>
          <Route path="/client-home" element={null} />
          <Route path="/editor-home" element={null} />
          <Route path="/explore" element={null} />
          <Route path="/explore/:tab" element={null} />
          <Route path="/editors-near-you" element={null} />
          <Route path="/reels" element={null} />
          <Route path="/jobs" element={null} />
          <Route path="/chats" element={null} />
          <Route path="/client-profile" element={null} />
          <Route path="/editor-profile" element={null} />
        </Route>

        {/* ============ PROTECTED NON-TAB ROUTES ============ */}
        <Route path="/advertise" element={<ProtectedRoute allowedRoles={["editor", "client"]}><AdvertisePage /></ProtectedRoute>} />
        <Route path="/advertise/new" element={<ProtectedRoute allowedRoles={["editor", "client"]}><AdvertiseNewPage /></ProtectedRoute>} />
        <Route path="/download/:id" element={<ProtectedRoute allowedRoles={["client", "editor"]}><DownloadPage /></ProtectedRoute>} />
        <Route path="/chat/:orderId" element={<ProtectedRoute allowedRoles={["client", "editor"]}><Chatbox /></ProtectedRoute>} />
        <Route path="/jobs/:id" element={<ProtectedRoute allowedRoles={["editor", "client"]}><JobDetailsPage /></ProtectedRoute>} />
        <Route path="/my-applications" element={<ProtectedRoute allowedRoles={["editor"]}><MyApplicationsPage /></ProtectedRoute>} />
        <Route path="/public-profile/:userId" element={<ProtectedRoute><PublicEditorProfile /></ProtectedRoute>} />
        <Route path="/editor/:userId" element={<ProtectedRoute><PublicEditorProfile /></ProtectedRoute>} />
        <Route path="/post-job" element={<ProtectedRoute allowedRoles={["client"]}><PostJobPage /></ProtectedRoute>} />
        <Route path="/my-jobs" element={<ProtectedRoute allowedRoles={["client"]}><MyJobsPage /></ProtectedRoute>} />
        <Route path="/my-jobs/:id/applicants" element={<ProtectedRoute allowedRoles={["client"]}><JobApplicantsPage /></ProtectedRoute>} />
        <Route path="/client-analytics" element={<ProtectedRoute allowedRoles={["client"]}><ClientAnalytics /></ProtectedRoute>} />
        <Route path="/client-kyc" element={<ProtectedRoute allowedRoles={["client"]}><ClientKYCPage /></ProtectedRoute>} />
        <Route path="/editor-analytics" element={<ProtectedRoute allowedRoles={["editor"]}><EditorAnalytics /></ProtectedRoute>} />
        <Route path="/editor-profile-update" element={<ProtectedRoute allowedRoles={["editor"]}><EditorProfileUpdate /></ProtectedRoute>} />
        <Route path="/client/profile-update" element={<ProtectedRoute allowedRoles={["client"]}><ClientProfileUpdate /></ProtectedRoute>} />
        <Route path="/upload-reel" element={<ProtectedRoute allowedRoles={["editor", "client"]}><ReelUploadPage /></ProtectedRoute>} />
        <Route path="/kyc-details" element={<ProtectedRoute allowedRoles={["editor"]}><KYCDetailsPage /></ProtectedRoute>} />
        <Route path="/location-settings" element={<ProtectedRoute allowedRoles={["editor"]}><LocationSettingsPage /></ProtectedRoute>} />
        <Route path="/suvix-score" element={<ProtectedRoute allowedRoles={["editor"]}><SuvixScorePage /></ProtectedRoute>} />
        <Route path="/achievements" element={<ProtectedRoute allowedRoles={["editor"]}><AchievementsPage /></ProtectedRoute>} />
        <Route path="/create-gig" element={<ProtectedRoute allowedRoles={["editor"]}><CreateGig /></ProtectedRoute>} />
        <Route path="/my-gigs" element={<ProtectedRoute allowedRoles={["editor"]}><MyGigs /></ProtectedRoute>} />
        <Route path="/my-orders" element={<ProtectedRoute allowedRoles={["editor"]}><MyOrders /></ProtectedRoute>} />
        <Route path="/client-orders" element={<ProtectedRoute allowedRoles={["client"]}><ClientOrders /></ProtectedRoute>} />
        <Route path="/saved-editors" element={<ProtectedRoute allowedRoles={["client"]}><SavedEditors /></ProtectedRoute>} />
        <Route path="/follow-suggestions" element={<ProtectedRoute allowedRoles={["client", "editor"]}><FollowSuggestionsPage /></ProtectedRoute>} />
        <Route path="/create-brief" element={<ProtectedRoute allowedRoles={["client"]}><CreateBriefPage /></ProtectedRoute>} />
        <Route path="/my-briefs" element={<ProtectedRoute allowedRoles={["client"]}><MyBriefsPage /></ProtectedRoute>} />
        <Route path="/manage-brief/:id" element={<ProtectedRoute allowedRoles={["client"]}><ManageBriefPage /></ProtectedRoute>} />
        <Route path="/briefs" element={<ProtectedRoute allowedRoles={["editor"]}><OpenBriefsPage /></ProtectedRoute>} />
        <Route path="/brief/:id" element={<ProtectedRoute allowedRoles={["editor", "client"]}><BriefDetailPage /></ProtectedRoute>} />
        <Route path="/my-proposals" element={<ProtectedRoute allowedRoles={["editor"]}><MyProposalsPage /></ProtectedRoute>} />
        <Route path="/ad-details/:id" element={<AdDetailsPage />} />
        <Route path="/reels-analytics" element={<ProtectedRoute><ReelsAnalytics /></ProtectedRoute>} />
        <Route path="/reels-explore" element={<Navigate to="/explore/reelsfeed" replace />} />
        <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
        <Route path="/payment-success" element={<ProtectedRoute><PaymentSuccess /></ProtectedRoute>} />
        <Route path="/payments" element={<ProtectedRoute><PaymentsPage /></ProtectedRoute>} />
        <Route path="/subscription/plans" element={<ProtectedRoute><SubscriptionPlansPage /></ProtectedRoute>} />
        <Route path="/profile-insights" element={<ProtectedRoute><ProfileInsightsPage /></ProtectedRoute>} />
        <Route path="/storage-plans" element={<ProtectedRoute><StoragePlans /></ProtectedRoute>} />
        <Route path="/editor-wallet" element={<ProtectedRoute allowedRoles={["editor"]}><EditorWallet /></ProtectedRoute>} />
        <Route path="/stories/:userId" element={<StoriesPage />} />
        <Route path="/connections/:userId" element={<ProtectedRoute><ConnectionsPage /></ProtectedRoute>} />
        
        {/* ============ AI WORKSPACE ============ */}
        <Route path="/ai-workspace" element={<ProtectedRoute allowedRoles={["client"]}><AIWorkspacePage /></ProtectedRoute>} />
        <Route path="/ai-workspace/:sessionId" element={<ProtectedRoute allowedRoles={["client"]}><AIWorkspacePage /></ProtectedRoute>} />

        {/* ============ REDIRECTS ============ */}
        <Route path="/client-messages" element={<Navigate to="/chats" replace />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to={user ? (user.role === 'client' ? '/client-home' : '/editor-home') : '/'} replace />} />
      </Routes>

      {/* Mobile Bottom Navigation - Only visible on mobile devices */}
      <MobileBottomNav />
    </>
  );
}
export default App;
