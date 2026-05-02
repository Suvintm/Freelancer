import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Info,
  Check,
  ArrowRight,
  Loader2,
  X
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { AuthBackground } from '../components/auth/AuthBackground';
import { useAuthStore } from '../store/useAuthStore';
import { useCategoryStore } from '../store/useCategoryStore';
import logo from '../assets/whitebglogo.png';

// Import assets for high-fidelity thumbnails
import youtubeThumb from '../assets/categories/youtube.jpg';
import youtubeIcon from '../assets/categories/youtubeicon.png';
import clientThumb from '../assets/categories/client.jpg';
import fitnessThumb from '../assets/categories/fitness.jpg';
import fitnessIcon from '../assets/categories/fitnessicon.png';
import dancerThumb from '../assets/categories/dancer.jpg';
import dancerIcon from '../assets/categories/danceicon.png';
import singerThumb from '../assets/categories/singer.jpg';
import singerIcon from '../assets/categories/singericon.png';
import promotionsThumb from '../assets/categories/promotions.jpg';
import adsIcon from '../assets/categories/ads.png';
import editorThumb from '../assets/categories/editor.jpg';
import editingIcon from '../assets/categories/editing.png';
import rentalsThumb from '../assets/categories/rentals.jpg';
import rentalIcon from '../assets/categories/rental.png';
import photographerThumb from '../assets/categories/photographer.jpg';
import videographerThumb from '../assets/categories/videographer.jpg';
import musicianThumb from '../assets/categories/musician.jpg';
import actorThumb from '../assets/categories/actor.jpg';

const CATEGORY_ORDER = [
  'direct_client',    // Normal User
  'yt_influencer',    // YouTube
  'fitness_expert',   // Gym / Fitness Pro
  'singer',           // Singer
  'dancer',           // Dance
  'social_promoter',  // Ads & Promotions
  'video_editor',
  'rent_service',
  'photographer',
  'videographer',
  'musician',
  'actor'
];

export default function RoleSelection() {
  const [selected, setSelected] = useState<string | null>(null);
  const [infoCategory, setInfoCategory] = useState<any | null>(null);
  const navigate = useNavigate();
  
  const { categories, isLoading, fetchCategories } = useCategoryStore();
  const { setTempSignupData } = useAuthStore();

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleContinue = () => {
    if (!selected) return;

    const selectedCat = categories.find(c => c.id === selected);
    if (!selectedCat) return;

    setTempSignupData({ categoryId: selected, categorySlug: selectedCat.slug });

    if (selectedCat.slug === 'direct_client') {
      navigate('/signup');
    } else if (selectedCat.slug === 'yt_influencer') {
      navigate('/youtube-connect');
    } else {
      navigate('/subcategory-selection');
    }
  };

  const getCategoryAssets = (slug: string) => {
    switch(slug) {
      case 'yt_influencer': return { thumb: youtubeThumb, overlay: youtubeIcon };
      case 'direct_client': return { thumb: clientThumb, overlay: null };
      case 'fitness_expert': return { thumb: fitnessThumb, overlay: fitnessIcon };
      case 'dancer': return { thumb: dancerThumb, overlay: dancerIcon };
      case 'singer': return { thumb: singerThumb, overlay: singerIcon };
      case 'social_promoter': return { thumb: promotionsThumb, overlay: adsIcon };
      case 'video_editor': return { thumb: editorThumb, overlay: editingIcon };
      case 'rent_service': return { thumb: rentalsThumb, overlay: rentalIcon };
      case 'photographer': return { thumb: photographerThumb, overlay: null };
      case 'videographer': return { thumb: videographerThumb, overlay: null };
      case 'musician': return { thumb: musicianThumb, overlay: null };
      case 'actor': return { thumb: actorThumb, overlay: null };
      default: return { thumb: editorThumb, overlay: null };
    }
  };

  const sortedCategories = CATEGORY_ORDER.map(slug => categories.find(c => c.slug === slug)).filter(Boolean);
  const remainingCategories = categories.filter(c => !CATEGORY_ORDER.includes(c.slug));
  const finalDisplayCategories = [...sortedCategories, ...remainingCategories] as any[];

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

      {/* Main Content Layer */}
      <div className="flex-1 lg:flex-none lg:w-[60%] flex flex-col h-full overflow-hidden bg-transparent lg:bg-black z-20">
        
        {/* Sticky Header Section */}
        <div className="sticky top-0 z-50 bg-gradient-to-b from-black via-black/95 to-transparent pb-6 lg:pb-10">
          <div className="flex justify-center items-center p-6 lg:p-10 mb-2">
            <img src={logo} alt="SuviX" className="h-10 lg:h-12 w-auto brightness-0 invert" />
          </div>
          <div className="text-center px-6">
            <h1 className="text-2xl lg:text-5xl font-black text-white tracking-tight mb-2">
              Choose Your Path
            </h1>
            <p className="text-zinc-400 text-[10px] lg:text-base max-w-2xl mx-auto italic leading-tight">
              Wisely choose your category by checking the info of each category on the respective category info icon
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 lg:px-20 pb-40 scroll-smooth custom-scrollbar">
          <div className="max-w-5xl mx-auto py-4">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-12 h-12 text-white animate-spin mb-4" />
                <p className="text-zinc-500 font-bold tracking-widest uppercase text-xs">Loading Roles...</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
                {finalDisplayCategories.map((item) => {
                  const isSelected = selected === item.id;
                  const assets = getCategoryAssets(item.slug);
                  
                  return (
                    <motion.div
                      key={item.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelected(item.id)}
                      className={`relative group cursor-pointer aspect-[1/1.05] rounded-[24px] overflow-hidden border-[2.5px] transition-all duration-300 ${
                        isSelected 
                          ? 'border-blue-500 ring-4 ring-blue-500/20' 
                          : 'border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      {/* Background Image */}
                      <img 
                        src={assets.thumb} 
                        alt={item.name} 
                        className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 ${
                          isSelected ? 'grayscale-0' : 'grayscale-[0.2] group-hover:grayscale-0'
                        }`} 
                      />

                      {/* Info Icon - Top Right */}
                      <button 
                        className="absolute top-3 right-3 z-20 bg-black/50 backdrop-blur-md w-8 h-8 rounded-full flex items-center justify-center border border-white/20 hover:bg-white/20 transition-colors"
                        onClick={(e) => { e.stopPropagation(); setInfoCategory(item); }}
                      >
                        <Info size={16} />
                      </button>

                      {/* Absolute Icon Overlay */}
                      {assets.overlay && (
                        <img 
                          src={assets.overlay} 
                          alt="" 
                          className="absolute -bottom-2 -left-4 w-32 h-32 object-contain z-10 pointer-events-none drop-shadow-2xl" 
                        />
                      )}

                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent z-0" />

                      {/* Label */}
                      <div className="absolute bottom-0 left-0 right-0 p-4 lg:p-5 flex items-center justify-between z-20">
                        <span className="text-xs lg:text-base font-black tracking-tight text-white drop-shadow-md">
                          {item.name}
                        </span>
                        {isSelected && (
                          <div className="bg-blue-500 p-1 rounded-full shadow-lg">
                            <Check size={12} strokeWidth={4} className="text-black" />
                          </div>
                        )}
                      </div>

                      {/* Selection State Glow */}
                      {isSelected && (
                        <div className="absolute inset-0 bg-blue-500/10 pointer-events-none" />
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Fixed Bottom Action Bar */}
        <div className="absolute inset-x-0 bottom-0 z-50 p-6 lg:p-10 bg-gradient-to-t from-black via-black/90 to-transparent pointer-events-none">
          <div className="max-w-4xl mx-auto flex justify-center pointer-events-auto">
            <Button 
              size="lg" 
              disabled={!selected || isLoading}
              onClick={handleContinue}
              className={`w-full lg:w-80 h-14 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-2 shadow-2xl ${
                selected 
                  ? 'bg-white text-black hover:bg-zinc-200 translate-y-0 opacity-100' 
                  : 'bg-zinc-800 text-zinc-500 cursor-not-allowed translate-y-4 opacity-50'
              }`}
            >
              Continue
              <ArrowRight size={20} strokeWidth={3} />
            </Button>
          </div>
        </div>
      </div>

      {/* Info Modal Overlay */}
      <AnimatePresence>
        {infoCategory && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setInfoCategory(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-zinc-950 border border-white/10 rounded-[32px] p-8 lg:p-10 shadow-2xl overflow-hidden"
            >
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-black text-white">{infoCategory.name}</h2>
                <button 
                  onClick={() => setInfoCategory(null)}
                  className="bg-white/5 p-2 rounded-full hover:bg-white/10 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <p className="text-zinc-400 text-sm lg:text-base leading-relaxed mb-8">
                {infoCategory.description || infoCategory.info || "Discover opportunities tailored for your professional growth."}
              </p>

              <Button 
                onClick={() => setInfoCategory(null)}
                className="w-full h-12 bg-white text-black font-bold rounded-xl"
              >
                Got it
              </Button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

