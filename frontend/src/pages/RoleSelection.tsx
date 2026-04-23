import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Info,
  Check,
  ArrowRight
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { AuthBackground } from '../components/auth/AuthBackground';
import logo from '../assets/whitebglogo.png';

// Import assets
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

const CATEGORIES = [
  { id: 'direct_client', name: 'Normal User', thumb: clientThumb, overlay: null },
  { id: 'yt_influencer', name: 'YouTube Creator', thumb: youtubeThumb, overlay: youtubeIcon },
  { id: 'fitness_expert', name: 'Fitness Pro', thumb: fitnessThumb, overlay: fitnessIcon },
  { id: 'singer', name: 'Singer', thumb: singerThumb, overlay: singerIcon },
  { id: 'dancer', name: 'Dancer', thumb: dancerThumb, overlay: dancerIcon },
  { id: 'social_promoter', name: 'Ads & Promo', thumb: promotionsThumb, overlay: adsIcon },
  { id: 'video_editor', name: 'Video Editor', thumb: editorThumb, overlay: editingIcon },
  { id: 'rent_service', name: 'Rent Service', thumb: rentalsThumb, overlay: rentalIcon },
  { id: 'photographer', name: 'Photographer', thumb: photographerThumb, overlay: null },
  { id: 'videographer', name: 'Videographer', thumb: videographerThumb, overlay: null },
  { id: 'musician', name: 'Musician', thumb: musicianThumb, overlay: null },
  { id: 'actor', name: 'Actor', thumb: actorThumb, overlay: null },
];

export default function RoleSelection() {
  const [selected, setSelected] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleContinue = () => {
    if (selected) {
      navigate('/signup', { state: { categoryId: selected } });
    }
  };

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

        <div className="flex-1 overflow-y-auto px-6 lg:px-20 pb-40 scroll-smooth">
          <div className="max-w-5xl mx-auto py-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
              {CATEGORIES.map((item) => {
                const isSelected = selected === item.id;
                const isSpecialClient = item.id === 'direct_client';
                
                return (
                  <motion.div
                    key={item.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelected(item.id)}
                    className={`relative group cursor-pointer aspect-[1/1.05] rounded-[24px] overflow-hidden border-[2.5px] transition-all ${
                      isSelected 
                        ? 'border-blue-500 ring-4 ring-blue-500/20' 
                        : 'border-zinc-800 hover:border-zinc-700'
                    } ${isSpecialClient ? 'border-dashed' : ''}`}
                  >
                    {/* Background Image */}
                    <img 
                      src={item.thumb} 
                      alt={item.name} 
                      className="absolute inset-0 w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all duration-500" 
                    />

                    {/* Info Icon - Top Right */}
                    <button 
                      className="absolute top-3 right-3 z-20 bg-black/50 backdrop-blur-md w-8 h-8 rounded-full flex items-center justify-center border border-white/20 hover:bg-white/20 transition-colors"
                      onClick={(e) => { e.stopPropagation(); /* Show info modal */ }}
                    >
                      <Info size={16} />
                    </button>

                    {/* Absolute Icon Overlay */}
                    {item.overlay && (
                      <img 
                        src={item.overlay} 
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
          </div>
        </div>

        {/* Fixed Bottom Action Bar */}
        <div className="absolute inset-x-0 bottom-0 z-50 p-6 lg:p-10 bg-gradient-to-t from-black via-black/90 to-transparent pointer-events-none">
          <div className="max-w-4xl mx-auto flex justify-center pointer-events-auto">
            <Button 
              size="lg" 
              disabled={!selected}
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
    </div>
  );
}
