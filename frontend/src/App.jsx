import { Routes, Route } from "react-router-dom";
import Homepage from "./pages/Homepage.jsx";
import ClientHome from "./pages/clientHome.jsx";
import EditorHome from "./pages/EditorHome.jsx";
import EditorMyorderspage from "./pages/EditorMyorderspage.jsx"; // import your MyOrders page

function App() {
  return (
    <Routes>
      <Route path="/" element={<Homepage />} />
      <Route path="/client-home" element={<ClientHome />} />
      <Route path="/editor-home" element={<EditorHome />} />
      <Route path="/editor-my-orders" element={<EditorMyorderspage />} />
    </Routes>
  );
}

export default App;
