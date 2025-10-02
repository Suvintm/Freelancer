import { Routes, Route } from "react-router-dom";
import Homepage from "./pages/Homepage.jsx";
import ClientHome from "./pages/clientHome.jsx";
import EditorHome from "./pages/EditorHome.jsx";
import ChatPage from "./pages/chatpage.jsx";
import EditorProfilePage from "./pages/EditorProfilePage.jsx";
import EditorMyorderspage from "./pages/EditorMyorderspage.jsx"; // import your MyOrders page
import EditorProfileUpdate from "./pages/EditorProfileUpdate.jsx";

import "react-toastify/dist/ReactToastify.css";
import { ToastContainer } from "react-toastify";


function App() {
  return (
    <>
      <ToastContainer />
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/client-home" element={<ClientHome />} />
        <Route path="/editor-home" element={<EditorHome />} />
        <Route path="/editor-my-orders" element={<EditorMyorderspage />} />
        <Route path="/chat/:orderId" element={<ChatPage />} />
        <Route path="/editor-profile" element={<EditorProfilePage />} />
        <Route path="/editor-profile-update" element={<EditorProfileUpdate />} />
      </Routes>
    </>
  );
}

export default App;
