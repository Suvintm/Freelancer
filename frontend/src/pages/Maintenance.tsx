import LottieComponent from 'lottie-react';
import maintenanceAnimation from '../assets/lottie/maintenance.json';
import { useTheme } from '../hooks/useTheme';

// Handle ESM/CJS interop for lottie-react
const Lottie = (LottieComponent as any)?.default || LottieComponent;

export default function Maintenance() {
  const { isDarkMode } = useTheme();

  return (
    <div className={`relative flex h-screen w-full items-center justify-center overflow-hidden ${isDarkMode ? 'bg-[#0A0A0A]' : 'bg-white'}`}>
      <div className="w-full max-w-[500px] aspect-square p-8">
        <Lottie 
          animationData={maintenanceAnimation} 
          loop={true} 
          style={{ width: '100%', height: '100%' }}
        />
      </div>
    </div>
  );
}
