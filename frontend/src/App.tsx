import { Routes, Route, Navigate } from 'react-router-dom';
import Welcome from './pages/Welcome';
import Login from './pages/Login';
import Signup from './pages/Signup';
import RoleSelection from './pages/RoleSelection';
import Home from './pages/Home';
import { AppLayout } from './components/layout/AppLayout';

function App() {
  return (
    <main className="min-h-screen bg-black font-sans antialiased text-white">
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/role-selection" element={<RoleSelection />} />
        
        {/* Authenticated Routes wrapped in AppLayout */}
        <Route 
          path="/home" 
          element={
            <AppLayout>
              <Home />
            </AppLayout>
          } 
        />

        {/* Catch-all redirect to welcome or home depending on auth (placeholder) */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </main>
  );
}

export default App;
