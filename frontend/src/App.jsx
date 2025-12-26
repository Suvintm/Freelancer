import { Routes, Route } from "react-router-dom";
import Homepage from "./pages/Homepage.jsx";
import ClientHome from "./pages/clientHome.jsx";
import EditorHome from "./pages/EditorHome.jsx";
import ChatPage from "./pages/chatpage.jsx";
import EditorProfilePage from "./pages/EditorProfilePage.jsx";
import EditorMyorderspage from "./pages/EditorMyorderspage.jsx";
import EditorProfileUpdate from "./pages/EditorProfileUpdate.jsx";
import AddPortfolio from "./pages/addportfolio.jsx";
import PublicEditorProfile from "./pages/PublicEditorProfile.jsx";
import ReelsPage from "./pages/ReelsPage.jsx";
import ReelsAnalytics from "./pages/ReelsAnalytics.jsx";
import NotificationsPage from "./pages/NotificationsPage.jsx";
import ChatsPage from "./pages/AllChatsPage.jsx";
import Chatbox from "./components/ChatPage.jsx";

// Gig & Order Pages
import CreateGig from "./pages/CreateGig.jsx";
import MyGigs from "./pages/MyGigs.jsx";
import MyOrders from "./pages/MyOrders.jsx";

// Client Pages
import ClientOrders from "./pages/ClientOrders.jsx";
import ClientMessages from "./pages/ClientMessages.jsx";
import ClientProfile from "./pages/ClientProfile.jsx";
import SavedEditors from "./pages/SavedEditors.jsx";
import ExploreEditorsPage from "./pages/ExploreEditorsPage.jsx";

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

import { TermsAndConditions, PrivacyPolicy, ContentProtectionPolicy, EditorCodeOfConduct } from "./pages/LegalPages";

import ProtectedRoute from "./components/ProtectedRoute.jsx";

import "react-toastify/dist/ReactToastify.css";
import { ToastContainer } from "react-toastify";

function App() {
  return (
    <>
      <ToastContainer />
      <Routes>
        {/* Legal Routes */}
        <Route path="/legal-center" element={<LegalCenterPage />} />
        <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/content-protection-policy" element={<ContentProtectionPolicy />} />
        <Route path="/editor-code-of-conduct" element={<EditorCodeOfConduct />} />

        {/* Public Route */}
        <Route path="/" element={<Homepage />} />

        {/* OAuth Routes (Public) */}
        <Route path="/oauth-success" element={<OAuthSuccess />} />
        <Route path="/select-role" element={<SelectRole />} />

        {/* Password Reset Routes (Public) */}
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

        {/* Banned & Maintenance Pages (Public) */}
        <Route path="/banned" element={<BannedPage />} />
        <Route path="/maintenance" element={<MaintenancePage />} />
        <Route path="/request-payment-success" element={<RequestPaymentSuccess />} />

        {/* Download Page (Protected) */}
        <Route
          path="/download/:id"
          element={
            <ProtectedRoute allowedRoles={["client", "editor"]}>
              <DownloadPage />
            </ProtectedRoute>
          }
        />

        {/* ============ CLIENT ROUTES ============ */}
        <Route
          path="/client-home"
          element={
            <ProtectedRoute allowedRoles={["client"]}>
              <ClientHome />
            </ProtectedRoute>
          }
        />
        <Route
          path="/client-analytics"
          element={
            <ProtectedRoute allowedRoles={["client"]}>
              <ClientAnalytics />
            </ProtectedRoute>
          }
        />
        <Route
          path="/client-kyc"
          element={
            <ProtectedRoute allowedRoles={["client"]}>
              <ClientKYCPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/client-orders"
          element={
            <ProtectedRoute allowedRoles={["client"]}>
              <ClientOrders />
            </ProtectedRoute>
          }
        />
        <Route
          path="/client-messages"
          element={
            <ProtectedRoute allowedRoles={["client"]}>
              <ClientMessages />
            </ProtectedRoute>
          }
        />
        <Route
          path="/client-profile"
          element={
            <ProtectedRoute allowedRoles={["client"]}>
              <ClientProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/saved-editors"
          element={
            <ProtectedRoute allowedRoles={["client"]}>
              <SavedEditors />
            </ProtectedRoute>
          }
        />
        <Route
          path="/explore-editors"
          element={
            <ProtectedRoute allowedRoles={["client"]}>
              <ExploreEditorsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/editors-near-you"
          element={
            <ProtectedRoute allowedRoles={["client", "editor"]}>
              <LocalEditorsNetworkPage />
            </ProtectedRoute>
          }
        />

        {/* Client - Open Briefs Routes */}
        <Route
          path="/create-brief"
          element={
            <ProtectedRoute allowedRoles={["client"]}>
              <CreateBriefPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-briefs"
          element={
            <ProtectedRoute allowedRoles={["client"]}>
              <MyBriefsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/manage-brief/:id"
          element={
            <ProtectedRoute allowedRoles={["client"]}>
              <ManageBriefPage />
            </ProtectedRoute>
          }
        />

        {/* ============ EDITOR ROUTES ============ */}
        {/* Editor - Open Briefs Routes */}
        <Route
          path="/briefs"
          element={
            <ProtectedRoute allowedRoles={["editor"]}>
              <OpenBriefsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/brief/:id"
          element={
            <ProtectedRoute allowedRoles={["editor", "client"]}>
              <BriefDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-proposals"
          element={
            <ProtectedRoute allowedRoles={["editor"]}>
              <MyProposalsPage />
            </ProtectedRoute>
          }
        />

        {/* Job Portal Routes */}
        <Route
          path="/jobs/:id"
          element={
            <ProtectedRoute allowedRoles={["editor", "client"]}>
              <JobDetailsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/post-job"
          element={
            <ProtectedRoute allowedRoles={["client"]}>
              <PostJobPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-jobs"
          element={
            <ProtectedRoute allowedRoles={["client"]}>
              <MyJobsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-jobs/:id/applicants"
          element={
            <ProtectedRoute allowedRoles={["client"]}>
              <JobApplicantsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-applications"
          element={
            <ProtectedRoute allowedRoles={["editor"]}>
              <MyApplicationsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/editor-home"
          element={
            <ProtectedRoute allowedRoles={["editor"]}>
              <EditorHome />
            </ProtectedRoute>
          }
        />
        <Route
          path="/editor-analytics"
          element={
            <ProtectedRoute allowedRoles={["editor"]}>
              <EditorAnalytics />
            </ProtectedRoute>
          }
        />
        <Route
          path="/storage-plans"
          element={
            <ProtectedRoute allowedRoles={["editor"]}>
              <StoragePlans />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reels-analytics"
          element={
            <ProtectedRoute allowedRoles={["editor"]}>
              <ReelsAnalytics />
            </ProtectedRoute>
          }
        />
        <Route
          path="/editor-my-orders"
          element={
            <ProtectedRoute allowedRoles={["editor"]}>
              <EditorMyorderspage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/editor-profile"
          element={
            <ProtectedRoute allowedRoles={["editor"]}>
              <EditorProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/add-portfolio"
          element={
            <ProtectedRoute allowedRoles={["editor"]}>
              <AddPortfolio />
            </ProtectedRoute>
          }
        />
        <Route
          path="/editor-profile-update"
          element={
            <ProtectedRoute allowedRoles={["editor"]}>
              <EditorProfileUpdate />
            </ProtectedRoute>
          }
        />
        <Route
          path="/kyc-details"
          element={
            <ProtectedRoute allowedRoles={["editor"]}>
              <KYCDetailsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/location-settings"
          element={
            <ProtectedRoute allowedRoles={["editor"]}>
              <LocationSettingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/suvix-score"
          element={
            <ProtectedRoute allowedRoles={["editor"]}>
              <SuvixScorePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/achievements"
          element={
            <ProtectedRoute allowedRoles={["editor"]}>
              <AchievementsPage />
            </ProtectedRoute>
          }
        />

        {/* Gig Routes (Editor) */}
        <Route
          path="/create-gig"
          element={
            <ProtectedRoute allowedRoles={["editor"]}>
              <CreateGig />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-gigs"
          element={
            <ProtectedRoute allowedRoles={["editor"]}>
              <MyGigs />
            </ProtectedRoute>
          }
        />

        {/* My Orders (Editor) */}
        <Route
          path="/my-orders"
          element={
            <ProtectedRoute allowedRoles={["editor"]}>
              <MyOrders />
            </ProtectedRoute>
          }
        />

        {/* ============ SHARED ROUTES ============ */}
        {/* Public Profile */}
        <Route
          path="/public-profile/:userId"
          element={
            <ProtectedRoute>
              <PublicEditorProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/editor/:userId"
          element={
            <ProtectedRoute>
              <PublicEditorProfile />
            </ProtectedRoute>
          }
        />

        {/* Reels (accessible by any logged-in user) */}
        <Route
          path="/reels"
          element={
            <ProtectedRoute>
              <ReelsPage />
            </ProtectedRoute>
          }
        />

        {/* Notifications */}
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <NotificationsPage />
            </ProtectedRoute>
          }
        />

        {/* Chat (accessible by any logged-in user) */}
        <Route
          path="/chats"
          element={
            <ProtectedRoute>
              <ChatsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/chat/:orderId"
          element={
            <ProtectedRoute>
              <Chatbox />
            </ProtectedRoute>
          }
        />

        {/* Payment Success Page */}
        <Route
          path="/payment-success"
          element={
            <ProtectedRoute>
              <PaymentSuccess />
            </ProtectedRoute>
          }
        />

        {/* Payments (accessible by any logged-in user) */}
        <Route
          path="/payments"
          element={
            <ProtectedRoute>
              <PaymentsPage />
            </ProtectedRoute>
          }
        />

        {/* Subscription Plans (accessible by any logged-in user) */}
        <Route
          path="/subscription/plans"
          element={
            <ProtectedRoute>
              <SubscriptionPlansPage />
            </ProtectedRoute>
          }
        />

        {/* Profile Insights (accessible by any logged-in user) */}
        <Route
          path="/profile-insights"
          element={
            <ProtectedRoute>
              <ProfileInsightsPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
}

export default App;

