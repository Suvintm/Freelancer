import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import logo from '../../assets/lightlogo.png';

export interface OnboardingHeaderProps {
  currentStep?: number;
  totalSteps?: number;
  stepLabel?: string;
  onBack?: () => void;
  backTo?: string;
  showBack?: boolean;
}

export const OnboardingHeader: React.FC<OnboardingHeaderProps> = ({
  currentStep,
  totalSteps,
  stepLabel,
  onBack,
  backTo,
  showBack = true,
}) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (backTo) {
      navigate(backTo);
    } else {
      navigate(-1);
    }
  };

  return (
    <header className="w-full border-b border-zinc-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-40 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-18 flex items-center justify-between">
        {/* Left: Brand Logo */}
        <div
          onClick={() => navigate('/')}
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <img
            src={logo}
            alt="SuviX"
            className="h-7 sm:h-8 w-auto object-contain transition-transform group-hover:scale-105"
          />
        </div>

        {/* Center: Step Indicator */}
        {currentStep && (
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-800 border border-zinc-200">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-900 animate-pulse" />
              Step {currentStep} {totalSteps ? `of ${totalSteps}` : ''}
              {stepLabel ? ` • ${stepLabel}` : ''}
            </span>
          </div>
        )}

        {/* Right: Premium Pill-shaped Back Button */}
        {showBack ? (
          <div className="flex items-center">
            <button
              onClick={handleBack}
              type="button"
              className="group relative flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-zinc-200/90 bg-white/90 shadow-xs hover:border-zinc-300 hover:shadow-md transition-all duration-300 overflow-hidden cursor-pointer active:scale-95"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-zinc-100 to-zinc-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-zinc-100 group-hover:bg-zinc-900 flex items-center justify-center transition-colors duration-300">
                <ArrowLeft className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-zinc-700 group-hover:text-white transition-colors duration-300" />
              </div>
              <span className="relative text-xs sm:text-sm font-semibold text-zinc-800 tracking-tight">
                Back
              </span>
            </button>
          </div>
        ) : (
          <div className="w-16" />
        )}
      </div>
    </header>
  );
};
