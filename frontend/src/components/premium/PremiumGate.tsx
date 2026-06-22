import React from 'react';
import { useSubscription } from '../../hooks/useSubscription';
import { Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PremiumGateProps {
  feature: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  blurFallback?: boolean;
}

export const PremiumGate: React.FC<PremiumGateProps> = ({ 
  feature, 
  children, 
  fallback,
  blurFallback = true 
}) => {
  const { hasFeature } = useSubscription();
  const navigate = useNavigate();

  if (hasFeature(feature)) {
    return <>{children}</>;
  }

  if (fallback && !blurFallback) {
    return <>{fallback}</>;
  }

  return (
    <div className="relative group overflow-hidden rounded-xl">
      {/* Blurred background content */}
      <div className={`filter ${blurFallback ? 'blur-sm opacity-50' : ''} pointer-events-none transition-all duration-300 select-none`}>
        {children}
      </div>
      
      {/* Overlay */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px] transition-all duration-300">
        <div className="bg-nav/90 border border-border-main p-6 rounded-2xl shadow-2xl flex flex-col items-center text-center max-w-[280px] transform transition-transform group-hover:scale-105">
          <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center mb-3">
            <Lock className="text-yellow-500 w-6 h-6" />
          </div>
          <h3 className="text-text-main font-bold text-sm mb-1">Premium Feature</h3>
          <p className="text-text-muted text-xs mb-4">
            Upgrade your plan to unlock this feature and supercharge your experience.
          </p>
          <button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              navigate('/subscription');
            }}
            className="w-full py-2 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black font-bold text-xs rounded-lg transition-all"
          >
            Upgrade Now
          </button>
        </div>
      </div>
    </div>
  );
};
