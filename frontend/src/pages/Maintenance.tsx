import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LottieComponent from 'lottie-react';
import maintenanceAnimation from '../assets/lottie/maintenance.json';
import { useTheme } from '../hooks/useTheme';

// Handle ESM/CJS interop for lottie-react
const Lottie = (LottieComponent as unknown as { default: typeof LottieComponent })?.default || LottieComponent;

export default function Maintenance() {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const [isRechecking, setIsRechecking] = useState(false);

  // Auto-recovery: If server is UP (200 OK), redirect back to Home automatically
  useEffect(() => {
    let isMounted = true;

    const checkServerRecovery = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5051/api';
        let baseUrl = apiUrl;
        if (apiUrl.startsWith('http://') || apiUrl.startsWith('https://')) {
          try {
            baseUrl = new URL(apiUrl).origin;
          } catch {
            // fallback
          }
        }
        const res = await fetch(`${baseUrl}/api/health`, { signal: AbortSignal.timeout(5000) });
        if (res.ok && isMounted) {
          navigate('/', { replace: true });
        }
      } catch {
        // Still down, stay on maintenance
      }
    };

    checkServerRecovery();
    const interval = setInterval(checkServerRecovery, 5000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [navigate]);

  const handleManualRetry = async () => {
    setIsRechecking(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5051/api';
      let baseUrl = apiUrl;
      if (apiUrl.startsWith('http://') || apiUrl.startsWith('https://')) {
        try {
          baseUrl = new URL(apiUrl).origin;
        } catch {
          // fallback
        }
      }
      const res = await fetch(`${baseUrl}/api/health`, { signal: AbortSignal.timeout(5000) });
      if (res.ok) {
        navigate('/', { replace: true });
      } else {
        alert('Server is still performing maintenance. Please retry in a few seconds.');
      }
    } catch {
      alert('Unable to reach server yet. Please check back shortly.');
    } finally {
      setIsRechecking(false);
    }
  };

  return (
    <div className={`relative flex flex-col h-screen w-full items-center justify-center overflow-hidden ${isDarkMode ? 'bg-[#0A0A0A]' : 'bg-white'}`}>
      <div className="w-full max-w-[450px] aspect-square p-6">
        <Lottie 
          animationData={maintenanceAnimation} 
          loop={true} 
          style={{ width: '100%', height: '100%' }}
        />
      </div>

      <div className="text-center mt-2 px-4 z-10">
        <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          System Maintenance & Upgrades
        </h2>
        <p className="text-sm text-gray-400 mt-2 max-w-md">
          We are deploying high-speed infrastructure upgrades. The system will resume automatically.
        </p>

        <div className="mt-6 flex gap-3 justify-center">
          <button
            onClick={handleManualRetry}
            disabled={isRechecking}
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-all shadow-lg hover:shadow-blue-500/20 disabled:opacity-50"
          >
            {isRechecking ? 'Checking Status...' : 'Check Status & Resume'}
          </button>
          
          <button
            onClick={() => navigate('/', { replace: true })}
            className="px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-all"
          >
            Go to Home
          </button>
        </div>
      </div>
    </div>
  );
}
