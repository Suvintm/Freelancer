import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutGrid, Users, Play, Camera, TrendingUp, Mic, CheckCircle2, UserPlus, ArrowRight } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

// Sub-components for the "All" Tab
const SectionHeader = ({ title, actionText, onAction }: { title: string; actionText?: string; onAction?: () => void }) => (
  <div className="mb-3 flex items-center justify-between px-6 md:px-8">
    <h2 className="text-lg font-black tracking-tight text-white">{title}</h2>
    {actionText && (
      <button onClick={onAction} className="text-[10px] font-bold text-red-500 hover:text-red-400 transition-colors uppercase tracking-widest">
        {actionText}
      </button>
    )}
  </div>
);

export default function Explore() {
  const [activeTab, setActiveTab] = useState('All');
  const { isDarkMode } = useTheme();

  const TABS = [
    { id: 'All', icon: LayoutGrid, color: '#4f46e5' },
    { id: 'Editors', icon: Users, color: '#7c3aed' },
    { id: 'YT Videos', icon: Play, color: '#ef4444' },
    { id: 'Rental', icon: Camera, color: '#10b981' },
  ];

  const currentTab = TABS.find(t => t.id === activeTab) || TABS[0];

  return (
    <div className={`relative flex flex-col transition-colors duration-500 ${isDarkMode ? 'bg-[#0A0A0A] text-white' : 'bg-white text-black'}`}>
      
      {/* 🌌 STICKY ATMOSPHERIC HUB */}
      <div className="sticky top-0 z-50 h-[80px] overflow-hidden">
        <motion.div 
          animate={{ backgroundColor: currentTab.color }}
          className="absolute inset-0 opacity-15"
          style={{ 
            maskImage: 'linear-gradient(to bottom, black 0%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, black 0%, transparent 100%)' 
          }}
        />
        <div className="relative z-10 flex h-full items-center px-6 md:px-8">
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 rounded-full px-5 py-2 text-[10px] font-bold transition-all duration-300 ${
                  activeTab === tab.id 
                    ? 'bg-white text-black shadow-lg scale-105' 
                    : 'bg-white/5 text-zinc-400 hover:bg-white/10'
                }`}
              >
                <tab.icon size={12} />
                {tab.id.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 🚀 MAIN CONTENT AREA */}
      <div className="relative z-10 flex-1">
        <AnimatePresence mode="wait">
          {activeTab === 'All' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="py-6"
            >
              {/* 👋 IDENTITY HEADER (Compressed) */}
              <div className="mb-8 px-6 md:px-8">
                <h1 className="text-2xl font-black tracking-tighter text-white">Explore SuviX</h1>
                <p className="text-[10px] text-zinc-500 font-medium tracking-tight">Empowering your creative vision</p>
                
                <div className="mt-6">
                  <p className="text-[8px] font-black uppercase tracking-[0.2em] text-zinc-600">Today's Recommendation For</p>
                  <p className="text-xl font-black text-white mt-0.5">Suvin</p>
                </div>
              </div>

              {/* 🎞️ TRENDING REELS (Compact) */}
              <section className="mb-10">
                <SectionHeader title="Trending Reels" actionText="Watch All" />
                <div className="flex gap-4 overflow-x-auto px-6 md:px-8 no-scrollbar pb-2">
                  {[
                    { id: 1, name: 'VFX_Alex', views: '145K', img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400' },
                    { id: 2, name: 'FilmPro', views: '82K', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400' },
                    { id: 3, name: 'LensLife', views: '210K', img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=400' },
                    { id: 4, name: 'Motion_Guru', views: '95K', img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400' },
                    { id: 5, name: 'ColorX', views: '120K', img: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=400' },
                  ].map(reel => (
                    <div key={reel.id} className="relative h-[240px] w-[160px] shrink-0 overflow-hidden rounded-[24px] border border-white/10 group">
                      <img src={reel.img} className="h-full w-full object-cover transition-transform group-hover:scale-110" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                      <div className="absolute bottom-4 left-4">
                        <p className="text-[11px] font-black text-white">{reel.name}</p>
                        <p className="text-[9px] font-bold text-zinc-500 mt-0.5">👁️ {reel.views}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* 📺 SUGGESTED FOR YOU (Compact) */}
              <section className="mb-10">
                <SectionHeader title="Suggested for You" actionText="See All" />
                <div className="flex gap-4 overflow-x-auto px-6 md:px-8 no-scrollbar pb-2">
                  {[
                    { id: 1, title: 'Directing Music Videos', author: 'Director X', views: '450K', time: '12:45', img: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=800' },
                    { id: 2, title: 'Cinematic Lighting 101', author: 'LightMaster', views: '220K', time: '08:15', img: 'https://images.unsplash.com/photo-1536240478700-b86d35fd733c?q=80&w=800' },
                    { id: 3, title: 'VFX Speed Art', author: 'FlowArt', views: '310K', time: '05:20', img: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=800' },
                  ].map(video => (
                    <div key={video.id} className="w-[260px] shrink-0 group">
                      <div className="relative aspect-video overflow-hidden rounded-2xl border border-white/5 mb-2">
                        <img src={video.img} className="h-full w-full object-cover group-hover:scale-105 transition-transform" />
                        <div className="absolute bottom-2 right-2 rounded-md bg-black/80 px-1.5 py-0.5 text-[8px] font-black">{video.time}</div>
                      </div>
                      <h3 className="text-[11px] font-black text-white line-clamp-1">{video.title}</h3>
                      <p className="text-[9px] font-bold text-zinc-600 mt-0.5">{video.author} • {video.views}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* 👤 FEATURED CREATORS (Compact) */}
              <section className="mb-10">
                <SectionHeader title="Featured Creators" actionText="Discover All" />
                <div className="flex gap-4 overflow-x-auto px-6 md:px-8 no-scrollbar pb-2">
                  {[
                    { id: 1, name: 'Souvik Suman', handle: '@souviksuman_pro', reach: '3.7M Reach', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400' },
                    { id: 2, name: 'Mayank', handle: '@mayank_creative', reach: '1.5M Reach', img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400' },
                    { id: 3, name: 'Rohan', handle: '@rohan_vfx', reach: '800K Reach', img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400' },
                  ].map(creator => (
                    <div key={creator.id} className="w-[240px] shrink-0 rounded-[24px] bg-white/5 border border-white/5 p-4 backdrop-blur-xl">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="h-12 w-12 overflow-hidden rounded-xl border border-red-500">
                          <img src={creator.img} className="h-full w-full object-cover" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1">
                            <p className="text-[11px] font-black text-white">{creator.name}</p>
                            <CheckCircle2 size={10} className="text-red-500 fill-red-500/20" />
                          </div>
                          <p className="text-[9px] font-bold text-red-500">{creator.handle}</p>
                          <p className="text-[8px] font-bold text-zinc-500 mt-0.5">{creator.reach}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button className="flex-1 rounded-lg bg-red-600 py-2 text-[10px] font-black text-white hover:bg-red-500 transition-colors">Subscribe</button>
                        <button className="h-8 w-8 flex items-center justify-center rounded-lg bg-white/5 text-zinc-400 hover:text-white transition-colors">
                          <UserPlus size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* 📸 PREMIUM GEAR RENTALS (Compact) */}
              <section className="mb-10">
                <SectionHeader title="Premium Gear Rentals" actionText="Browse Catalog" />
                <div className="flex gap-4 overflow-x-auto px-6 md:px-8 no-scrollbar pb-2">
                  {[
                    { id: 1, name: 'Sony FX3', price: '₹2500/day', cat: 'CAMERA', img: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=400' },
                    { id: 2, name: 'DJI Gimbal', price: '₹1200/day', cat: 'GIMBAL', img: 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?q=80&w=400' },
                    { id: 3, name: 'Aputure 600D', price: '₹1800/day', cat: 'LIGHT', img: 'https://images.unsplash.com/photo-1536240478700-b86d35fd733c?q=80&w=400' },
                  ].map(item => (
                    <div key={item.id} className="relative h-[200px] w-[200px] shrink-0 overflow-hidden rounded-[24px] border border-white/5">
                      <img src={item.img} className="h-full w-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                      <div className="absolute top-3 right-3 rounded-md bg-green-500/80 backdrop-blur-md px-1.5 py-0.5 text-[8px] font-black text-white">
                        {item.price}
                      </div>
                      <div className="absolute bottom-4 left-4">
                        <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">{item.cat}</p>
                        <p className="text-sm font-black text-white mt-0.5">{item.name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
