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

// OAuth Pages
import OAuthSuccess from "./pages/OAuthSuccess.jsx";
import SelectRole from "./pages/SelectRole.jsx";

import ProtectedRoute from "./components/ProtectedRoute.jsx";

import "react-toastify/dist/ReactToastify.css";
import { ToastContainer } from "react-toastify";

function App() {
  return (
    <>
      <ToastContainer />
      <Routes>
        {/* Public Route */}
        <Route path="/" element={<Homepage />} />

        {/* OAuth Routes (Public) */}
        <Route path="/oauth-success" element={<OAuthSuccess />} />
        <Route path="/select-role" element={<SelectRole />} />

        {/* Client Routes */}
        <Route
          path="/client-home"
          element={
            <ProtectedRoute allowedRoles={["client"]}>
              <ClientHome />
            </ProtectedRoute>
          }
        />

        {/* Editor Routes */}
        <Route
          path="/editor-home"
          element={
            <ProtectedRoute allowedRoles={["editor"]}>
              <EditorHome />
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
          path="/editor/:userId"
          element={
            <ProtectedRoute>
              <PublicEditorProfile />
            </ProtectedRoute>
          }
        />

        {/* Chat (accessible by any logged-in user) */}
        <Route
          path="/chat/:orderId"
          element={
            <ProtectedRoute>
              <ChatPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
}

export default App;
