import { BrowserRouter as Routes, Route } from "react-router-dom";
import Homepage from "./pages/Homepage.jsx";
import ClientHome from "./pages/clientHome.jsx";
import EditorHome from "./pages/EditorHome.jsx";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Homepage />} />
      <Route path="/client-home" element={<ClientHome />} />
      <Route path="/editor-home" element={<EditorHome />} />
    </Routes>
  );
}

export default App;
