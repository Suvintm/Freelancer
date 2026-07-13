import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Check, Shield } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import logo from '../../assets/darklogo.png';
import LottieComponent from "lottie-react";
import { api } from '../../api/client';
import { queryClient } from '../../queries/queryClient';
import { CURRENT_USER_QUERY_KEY } from '../../queries/useCurrentUser';

// Handle ESM/CJS interop for lottie-react
const Lottie = (LottieComponent as unknown as { default: typeof LottieComponent })?.default || LottieComponent;
import placeholderAnimation from "../../assets/lottie/preferences.json";

const LANGUAGES = ['English', 'Spanish', 'French', 'German', 'Hindi', 'Chinese', 'Japanese', 'Korean'];
const LOCATIONS = ['North America', 'Europe', 'Asia', 'South America', 'Africa', 'Oceania'];
const INTERESTS = ['Tech', 'Travel', 'Food', 'Fitness', 'Fashion', 'Music', 'Gaming', 'Education', 'Vlogs', 'Cinematography'];
const VIBES = ['Professional', 'Casual', 'Creative', 'Energetic', 'Minimalist'];

export default function Preferences() {
  const navigate = useNavigate();

  const [language, setLanguage] = useState('');
  const [location, setLocation] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [vibe, setVibe] = useState('');

  const toggleInterest = (tag: string) => {
    setSelectedInterests(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const [isLoading, setIsLoading] = useState(false);

  const handleContinue = async () => {
    try {
      setIsLoading(true);
      await api.put('/user/me/preferences', {
        language,
        region: location,
        vibe,
        interests: selectedInterests
      });
      // Force user refresh to pick up the new preferences_completed state
      await queryClient.invalidateQueries({ queryKey: CURRENT_USER_QUERY_KEY });
      navigate('/home');
    } catch (error) {
      console.error("Failed to save preferences:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Simple validation: User must select language, location, and at least one vibe.
  const isFormValid = language && location && vibe;

  return (
    <div className="flex h-screen w-full bg-black font-sans overflow-hidden relative text-white">
      {/* Visual Side (Left) - Desktop Only */}
      <div className="hidden lg:flex flex-col lg:w-[40%] p-8 bg-zinc-950 overflow-hidden relative border-r border-zinc-900 items-center justify-center text-center">
        
        {/* Lottie Animation Container */}
        <div className="z-20 w-72 h-72 mb-8">
          <Lottie animationData={placeholderAnimation} loop={true} />
        </div>
        
        <h2 className="z-20 text-2xl font-bold text-white max-w-sm leading-snug drop-shadow-lg">
          We are processing your feed based on your preference option
        </h2>

        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-zinc-950 to-transparent z-10" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-zinc-950 to-transparent z-10" />
      </div>

      {/* Mobile Background */}
      <div className="lg:hidden absolute inset-0 z-0 bg-black">
        <div className="absolute inset-x-0 bottom-0 h-[60%] bg-black z-10" />
        <div className="absolute inset-x-0 bottom-[60%] h-48 bg-gradient-to-t from-black to-transparent z-10" />
      </div>

      {/* Content Side (Right) */}
      <div 
        className="flex-1 lg:flex-none lg:w-[60%] flex flex-col h-full overflow-hidden z-20"
        style={{
          backgroundImage: 'radial-gradient(circle at 50% 50%, #0e0e11 0%, #000000 100%)'
        }}
      >
        {/* Header */}
        <div className="sticky top-0 z-50 bg-black/40 backdrop-blur-xl border-b border-zinc-900/80">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between px-6 py-6 md:px-12 lg:px-16 lg:py-8">
            <div className="space-y-3">
              <img src={logo} alt="SuviX" className="h-8 md:h-9 lg:h-10 w-auto opacity-95" />
              <div className="space-y-1">
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-white leading-tight tracking-tight">
                  Personalize your <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-200 via-zinc-400 to-zinc-600">experience.</span>
                </h1>
                <p className="text-zinc-400 text-xs md:text-sm max-w-lg leading-relaxed font-medium">
                  Help us understand your taste so we can recommend the perfect content.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Form Area */}
        <div className="flex-1 overflow-y-auto px-6 md:px-12 lg:px-16 pb-32 scroll-smooth custom-scrollbar">
          <div className="max-w-3xl mx-auto py-8 space-y-10">
            
            {/* Language & Location */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Primary Language</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full bg-zinc-900/50 border border-zinc-800 text-white text-sm rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/30 transition-all cursor-pointer appearance-none"
                >
                  <option value="" disabled>Select language...</option>
                  {LANGUAGES.map(lang => (
                    <option key={lang} value={lang}>{lang}</option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-3">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Region / Location</label>
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-zinc-900/50 border border-zinc-800 text-white text-sm rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/30 transition-all cursor-pointer appearance-none"
                >
                  <option value="" disabled>Select region...</option>
                  {LOCATIONS.map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Vibe Selection */}
            <div className="space-y-4">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">What's your vibe?</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {VIBES.map(v => {
                  const isSelected = vibe === v;
                  return (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setVibe(v)}
                      className={`relative flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                        isSelected 
                          ? 'bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.15)]' 
                          : 'bg-zinc-900/40 border-zinc-800 text-zinc-300 hover:border-zinc-600 hover:bg-zinc-800/50'
                      }`}
                    >
                      {v}
                      {isSelected && <Check size={16} strokeWidth={3} className="text-black" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Interests / Tags */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Content Interests</label>
                <span className="text-[10px] text-zinc-600 font-bold uppercase bg-zinc-900 px-2 py-1 rounded-md">Optional</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {INTERESTS.map(tag => {
                  const isSelected = selectedInterests.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleInterest(tag)}
                      className={`px-4 py-2 rounded-full text-xs font-semibold border transition-all ${
                        isSelected
                          ? 'bg-zinc-200 text-black border-zinc-200 shadow-md'
                          : 'bg-zinc-900/30 border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200'
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Privacy Note */}
            <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-2xl p-5 flex items-start gap-4 mt-8">
              <div className="bg-zinc-800/50 p-2 rounded-full">
                <Shield size={20} className="text-zinc-400" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-zinc-200">Why we need this info</h4>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  We use your language, region, and style preferences to fine-tune our recommendation engine. We never sell your personal data to third parties. All preferences are strictly used to improve your feed.
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* Bottom Action Bar */}
        <div className="absolute bottom-0 left-0 right-0 py-5 px-6 lg:px-12 bg-zinc-950/90 backdrop-blur-3xl border-t border-zinc-900 shadow-[0_-10px_40px_rgba(0,0,0,0.8)] z-50">
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            
            <div className="flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-start">
              {isFormValid ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-semibold text-zinc-400">Ready to complete setup</span>
                </motion.div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
                  <span className="text-xs font-semibold text-zinc-500">Select language, location, and vibe to continue</span>
                </div>
              )}
            </div>

            <Button
              onClick={handleContinue}
              disabled={!isFormValid || isLoading}
              className={`w-full sm:w-auto h-13 px-8 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all group ${
                isFormValid 
                  ? 'bg-white text-black hover:opacity-90 active:scale-[0.98] shadow-2xl shadow-white/10 cursor-pointer'
                  : 'bg-zinc-900/50 text-zinc-600 border border-zinc-800 cursor-not-allowed'
              }`}
            >
              {isLoading ? "Saving..." : "Finish Setup"}
              {isFormValid && !isLoading && (
                <ArrowRight size={18} strokeWidth={2.5} className="transition-transform group-hover:translate-x-1 duration-200" />
              )}
            </Button>

          </div>
        </div>
      </div>
    </div>
  );
}
