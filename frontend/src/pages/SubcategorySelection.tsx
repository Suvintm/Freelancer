import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  ChevronLeft, 
  CheckCircle2, 
  TrendingUp,
  Loader2,
  ArrowRight
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { AuthBackground } from '../components/auth/AuthBackground';
import { useAuthStore } from '../store/useAuthStore';
import { useCategoryStore } from '../store/useCategoryStore';
import logo from '../assets/whitebglogo.png';

// Import assets for icons (matching RoleSelection)
import youtubeIcon from '../assets/categories/youtubeicon.png';
import fitnessIcon from '../assets/categories/fitnessicon.png';
import danceIcon from '../assets/categories/danceicon.png';
import singerIcon from '../assets/categories/singericon.png';
import adsIcon from '../assets/categories/ads.png';
import editingIcon from '../assets/categories/editing.png';
import rentalIcon from '../assets/categories/rental.png';

export default function SubcategorySelection() {
  const navigate = useNavigate();
  const { tempSignupData, setTempSignupData } = useAuthStore();
  const { categories, isLoading } = useCategoryStore();
  
  const [selectedSubs, setSelectedSubs] = useState<string[]>(tempSignupData?.roleSubCategoryIds || []);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFinishing, setIsFinishing] = useState(false);

  const categoryId = tempSignupData?.categoryId;
  const category = useMemo(() => categories.find(c => c.id === categoryId), [categories, categoryId]);

  useEffect(() => {
    if (!categoryId) {
      navigate('/role-selection');
    }
  }, [categoryId, navigate]);

  const filteredSubs = useMemo(() => {
    if (!category?.subCategories) return [];
    return category.subCategories.filter(sub => 
      sub.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [category, searchQuery]);

  const toggleSub = (id: string) => {
    setSelectedSubs(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleFinish = () => {
    if (selectedSubs.length === 0) return;
    setIsFinishing(true);
    setTempSignupData({ roleSubCategoryIds: selectedSubs });
    setTimeout(() => {
      navigate('/signup');
    }, 500);
  };

  const getOverlayIcon = (slug?: string) => {
    switch(slug) {
      case 'yt_influencer': return youtubeIcon;
      case 'fitness_expert': return fitnessIcon;
      case 'dancer': return danceIcon;
      case 'singer': return singerIcon;
      case 'social_promoter': return adsIcon;
      case 'video_editor': return editingIcon;
      case 'rent_service': return rentalIcon;
      default: return null;
    }
  };

  if (isLoading || !category) {
    return (
      <div className="h-screen w-full bg-black flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-white animate-spin" />
      </div>
    );
  }

  const overlayIcon = getOverlayIcon(category.slug);

  return (
    <div className="flex h-screen w-full bg-black font-sans overflow-hidden relative text-white">
      {/* Desktop Left Panel */}
      <div className="hidden lg:flex lg:w-[40%] p-8 bg-zinc-950 overflow-hidden relative border-r border-zinc-900">
        <AuthBackground />
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black to-transparent z-10" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black to-transparent z-10" />
      </div>

      {/* Mobile Background */}
      <div className="lg:hidden absolute inset-0 z-0 bg-black">
        <AuthBackground />
        <div className="absolute inset-x-0 bottom-0 h-[60%] bg-black z-10" />
        <div className="absolute inset-x-0 bottom-[60%] h-48 bg-gradient-to-t from-black to-transparent z-10" />
      </div>

      <div className="flex-1 lg:flex-none lg:w-[60%] flex flex-col h-full overflow-hidden bg-transparent lg:bg-black z-20">
        
        {/* Header */}
        <header className="flex-none p-6 lg:p-10 flex items-center justify-between">
          <button 
            onClick={() => navigate('/role-selection')}
            className="group flex items-center gap-2 bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-xl border border-white/10 transition-all"
          >
            <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            <span className="font-semibold text-[10px] uppercase tracking-wider">Back</span>
          </button>
          <img src={logo} alt="SuviX" className="h-8 lg:h-10 w-auto brightness-0 invert" />
          <div className="w-20" />
        </header>

        <div className="flex-1 overflow-y-auto px-6 lg:px-20 pb-40 custom-scrollbar">
          <div className="max-w-4xl mx-auto">
            {/* Hero Section */}
            <div className="text-center mb-12">
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/5 border border-white/10 mb-6 relative overflow-hidden"
              >
                {overlayIcon ? (
                  <img src={overlayIcon} alt="" className="w-8 h-8 object-contain z-10" />
                ) : (
                  <CheckCircle2 size={24} className="text-white/20" />
                )}
              </motion.div>
              
              <h1 className="text-2xl lg:text-3xl font-semibold tracking-tight mb-3">
                How do you <span className="text-zinc-500">specialize?</span>
              </h1>
              <p className="text-zinc-400 text-sm max-w-xl mx-auto leading-relaxed">
                Selecting accurate niches helps SuviX match you with the highest-paying brands in your industry.
              </p>
            </div>

            {/* Search Bar */}
            <div className="relative max-w-xl mx-auto mb-10">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <Search size={16} className="text-zinc-500" />
              </div>
              <input 
                type="text" 
                placeholder="Search specific niches..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-11 bg-white/5 border border-white/5 rounded-xl pl-12 pr-6 text-sm font-medium placeholder:text-zinc-600 focus:border-white/20 focus:outline-none transition-all focus:bg-white/10"
              />
            </div>

            {/* Tags Cloud */}
            <div className="flex flex-wrap justify-center gap-3 mb-16">
              <AnimatePresence mode="popLayout">
                {filteredSubs.map((sub) => {
                  const isSelected = selectedSubs.includes(sub.id);
                  return (
                     <motion.button
                      key={sub.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      onClick={() => toggleSub(sub.id)}
                      className={`group relative flex items-center gap-2 px-4 py-2 rounded-xl border transition-all duration-300 ${
                        isSelected 
                          ? 'bg-white text-black border-white shadow-xl shadow-white/5' 
                          : 'bg-zinc-900/50 text-zinc-500 border-white/5 hover:border-white/10'
                      }`}
                    >
                      <span className="font-semibold text-[11px] uppercase tracking-tight">
                        {sub.name}
                      </span>
                      {isSelected && (
                        <CheckCircle2 size={12} fill="black" className="text-white" />
                      )}
                    </motion.button>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* Industry Insights Card */}
             <div className="max-w-xl mx-auto">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex items-start gap-4 backdrop-blur-xl">
                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <TrendingUp className="text-white" size={18} />
                </div>
                <div>
                  <h3 className="text-[10px] font-semibold mb-1 uppercase tracking-wider text-zinc-500">Market Insight</h3>
                  <p className="text-[13px] text-zinc-400 leading-relaxed">
                    Profiles with precise niche targeting receive <span className="text-white font-semibold">85% more</span> exclusive matching opportunities and higher engagement rates.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Fixed Action Bar */}
        <div className="absolute inset-x-0 bottom-0 z-50 p-6 lg:p-12 bg-gradient-to-t from-black via-black/95 to-transparent pointer-events-none">
          <div className="max-w-4xl mx-auto flex justify-center pointer-events-auto">
             <Button 
              size="lg" 
              disabled={selectedSubs.length === 0 || isFinishing}
              onClick={handleFinish}
              className={`w-full lg:w-72 h-12 rounded-xl font-semibold text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
                selectedSubs.length > 0 
                  ? 'bg-white text-black hover:scale-[1.01] active:scale-[0.98] shadow-xl shadow-white/5' 
                  : 'bg-zinc-900 text-zinc-600 cursor-not-allowed opacity-50'
              }`}
            >
              {isFinishing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Finalizing...
                </>
              ) : (
                <>
                  Confirm {selectedSubs.length > 0 ? `${selectedSubs.length} Niche(s)` : 'Selection'}
                  <ArrowRight size={18} strokeWidth={2.5} />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
