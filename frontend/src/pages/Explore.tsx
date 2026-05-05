import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutGrid, Users, Play, Camera, CheckCircle2, UserPlus, MoreHorizontal } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { useAuthStore } from '../store/useAuthStore';

// ── Sub-components ──────────────────────────────────────────────────────────

const SectionHeader = ({ title, actionText, onAction }: { title: string; actionText?: string; onAction?: () => void }) => (
  <div className="mb-4 flex items-center justify-between px-6 lg:px-0">
    <h2 className="text-xl lg:text-2xl font-bold text-white tracking-tight">{title}</h2>
    {actionText && (
      <button onClick={onAction} className="text-[11px] font-bold text-rose-500 hover:text-rose-400 transition-colors uppercase tracking-wider">
        {actionText}
      </button>
    )}
  </div>
);

export default function Explore() {
  const [activeTab, setActiveTab] = useState('All');
  const { isDarkMode } = useTheme();
  const { user } = useAuthStore();

  const TABS = [
    { id: 'All', icon: LayoutGrid, color: '#6366f1' },
    { id: 'Editors', icon: Users, color: '#a855f7' },
    { id: 'YT Videos', icon: Play, color: '#ef4444' },
    { id: 'Rental', icon: Camera, color: '#10b981' },
  ];

  const currentTab = TABS.find(t => t.id === activeTab) || TABS[0];

  return (
    <div className="relative flex flex-col min-h-full bg-[#000000] text-white font-sans selection:bg-rose-500/30">
      
      {/* 🌌 ELITE ATMOSPHERIC HEADER (Mobile: Dynamic Tab Glow | Desktop: Clean Sub-nav) */}
      <div className="sticky top-0 z-[60] lg:relative lg:z-10 lg:bg-black/80 lg:backdrop-blur-xl lg:border-b lg:border-white/5 lg:mb-4">
        
        {/* 🌈 Dynamic Atmospheric Overlay (Mobile Only - Sync with native app) */}
        <div className="absolute inset-0 h-[220px] lg:hidden pointer-events-none">
          {/* Main Gradient Smoke */}
          <div className="absolute inset-0 bg-gradient-to-b from-black via-black/90 to-transparent" />
          
          {/* Active Tab Glow */}
          <motion.div 
            key={activeTab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.25 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0"
            style={{ 
              backgroundColor: currentTab.color,
              maskImage: 'radial-gradient(circle at 50% 0%, black 0%, transparent 70%)',
              WebkitMaskImage: 'radial-gradient(circle at 50% 0%, black 0%, transparent 70%)'
            }}
          />
        </div>

        {/* Tab Bar */}
        <div className="relative z-20 flex items-center px-0 lg:px-10 pt-4 lg:pt-4 lg:pb-1">
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-2 px-6 lg:px-0">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-1.5 rounded-full px-2.5 py-1 lg:px-3.5 lg:py-1.5 text-[9px] lg:text-[10px] font-bold transition-all duration-300
                  ${activeTab === tab.id 
                    ? 'bg-white text-black shadow-[0_4px_20px_rgba(255,255,255,0.15)] scale-105' 
                    : 'bg-white/5 text-zinc-500 hover:bg-white/10 hover:text-white'
                  }
                `}
              >
                <tab.icon size={11} strokeWidth={2.5} />
                {tab.id.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Explore Hero Header */}
        <div className="relative z-20 mt-2 lg:mt-4 px-6 lg:px-10 mb-4">
          <h1 className="text-xl lg:text-2xl font-bold text-white tracking-tight">Explore SuviX</h1>
          <p className="text-[11px] lg:text-[13px] text-zinc-400 font-medium">Empowering your creative vision</p>
        </div>
      </div>

      {/* 🚀 MAIN CONTENT AREA */}
      <div className="relative z-10 flex-1 lg:mt-2 px-0 lg:px-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="pt-6 lg:pt-0"
          >
            {activeTab === 'All' && (
              <>
                {/* 👋 PERSONALIZED GREETING */}
                <div className="mb-10 px-6 lg:px-0">
                  <p className="text-[12px] font-bold uppercase tracking-[0.2em] text-zinc-600">Today's Recommendation For</p>
                  <h2 className="text-3xl lg:text-4xl font-bold text-white mt-1">
                    {user?.name?.split(' ')[0] || 'Suvin'}
                  </h2>
                </div>

                {/* 🎞️ TRENDING REELS */}
                <section className="mb-10">
                  <SectionHeader title="Trending Reels" actionText="Watch All" />
                  <div className="flex gap-3 overflow-x-auto px-6 lg:px-0 no-scrollbar pb-4 lg:grid lg:grid-cols-4 lg:gap-6">
                    {[
                      { id: 1, name: 'VFX_Alex', views: '145K', img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400' },
                      { id: 2, name: 'FilmPro', views: '82K', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400' },
                      { id: 3, name: 'LensLife', views: '210K', img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=400' },
                      { id: 4, name: 'Motion_Guru', views: '95K', img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400' },
                    ].map(reel => (
                      <div key={reel.id} className="relative aspect-[9/16] w-[130px] lg:w-full shrink-0 overflow-hidden rounded-[24px] border border-white/5 group shadow-xl">
                        <img src={reel.img} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                        <div className="absolute bottom-4 left-4">
                          <p className="text-xs lg:text-base font-bold text-white">{reel.name}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <div className="w-1 h-1 rounded-full bg-rose-500 animate-pulse" />
                            <p className="text-[9px] lg:text-[11px] font-semibold text-zinc-400">👁️ {reel.views}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* 📺 SUGGESTED FOR YOU */}
                <section className="mb-10">
                  <SectionHeader title="Suggested for You" actionText="See All" />
                  <div className="flex gap-4 overflow-x-auto px-6 lg:px-0 no-scrollbar pb-6 lg:grid lg:grid-cols-3 lg:gap-8">
                    {[
                      { id: 1, title: 'Directing Music Videos', author: 'Director X', views: '450K', time: '12:45', img: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=800' },
                      { id: 2, title: 'Cinematic Lighting 101', author: 'LightMaster', views: '220K', time: '08:15', img: 'https://images.unsplash.com/photo-1536240478700-b86d35fd733c?q=80&w=800' },
                      { id: 3, title: 'VFX Speed Art', author: 'FlowArt', views: '310K', time: '05:20', img: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=800' },
                    ].map(video => (
                      <div key={video.id} className="w-[240px] lg:w-full shrink-0 group">
                        <div className="relative aspect-video overflow-hidden rounded-[20px] border border-white/5 mb-3 shadow-lg">
                          <img src={video.img} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          <div className="absolute inset-0 bg-black/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                             <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-black">
                               <Play size={18} fill="currentColor" />
                             </div>
                          </div>
                          <div className="absolute bottom-3 right-3 rounded-lg bg-black/80 backdrop-blur-md px-2 py-0.5 text-[9px] font-bold text-white">{video.time}</div>
                        </div>
                        <div className="px-1">
                          <h3 className="text-[13px] lg:text-[15px] font-bold text-white line-clamp-1 leading-tight">{video.title}</h3>
                          <div className="flex items-center gap-2 mt-1.5">
                             <div className="w-5 h-5 rounded-full bg-zinc-800" />
                             <p className="text-[10px] lg:text-[12px] font-semibold text-zinc-500">{video.author} • {video.views}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* 👤 FEATURED CREATORS */}
                <section className="mb-10">
                  <SectionHeader title="Featured Creators" actionText="Discover All" />
                  <div className="flex gap-4 overflow-x-auto px-6 lg:px-0 no-scrollbar pb-6 lg:grid lg:grid-cols-3 lg:gap-8">
                    {[
                      { id: 1, name: 'Souvik Suman', handle: '@souviksuman_pro', reach: '3.7M', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400' },
                      { id: 2, name: 'Mayank Creative', handle: '@mayank_creative', reach: '1.5M', img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400' },
                      { id: 3, name: 'Rohan Pro', handle: '@rohan_vfx', reach: '800K', img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400' },
                    ].map(creator => (
                      <div key={creator.id} className={`w-[240px] lg:w-full shrink-0 rounded-[24px] border border-white/5 p-5 lg:p-6 backdrop-blur-xl relative overflow-hidden group transition-colors duration-300 ${isDarkMode ? 'bg-black' : 'bg-white shadow-xl'}`}>
                        <div className="absolute top-0 right-0 w-16 h-16 bg-rose-500/5 blur-3xl group-hover:bg-rose-500/10 transition-colors" />
                        
                        <div className="flex items-center gap-4 mb-5 relative z-10">
                          <div className="h-12 w-12 overflow-hidden rounded-xl border-2 border-rose-500 p-0.5">
                            <img src={creator.img} className="h-full w-full rounded-[10px] object-cover" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="text-sm lg:text-base font-bold text-white truncate">{creator.name}</p>
                              <CheckCircle2 size={12} className="text-rose-500 fill-rose-500/20" />
                            </div>
                            <p className="text-[11px] font-bold text-rose-500">{creator.handle}</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mb-5 px-1">
                          <div>
                            <p className="text-base font-bold text-white">{creator.reach}</p>
                            <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Reach</p>
                          </div>
                          <button className="p-2 rounded-xl bg-white/5 text-zinc-400 hover:text-white transition-colors">
                            <MoreHorizontal size={18} />
                          </button>
                        </div>

                        <div className="flex gap-2 relative z-10">
                          <button className="flex-[2] rounded-xl bg-white py-3 text-[11px] font-bold text-black hover:opacity-90 transition-all">Connect</button>
                          <button className="flex-1 rounded-xl bg-white/5 border border-white/10 py-3 flex items-center justify-center text-white hover:bg-white/10 transition-colors">
                            <UserPlus size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* 📸 PREMIUM GEAR RENTALS */}
                <section className="mb-20">
                  <SectionHeader title="Premium Gear Rentals" actionText="Browse Catalog" />
                  <div className="flex gap-4 overflow-x-auto px-6 lg:px-0 no-scrollbar pb-6 lg:grid lg:grid-cols-4 lg:gap-6">
                    {[
                      { id: 1, name: 'Sony FX3', price: '₹2500', cat: 'CAMERA', img: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=400' },
                      { id: 2, name: 'DJI RS3', price: '₹1200', cat: 'GIMBAL', img: 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?q=80&w=400' },
                      { id: 3, name: 'Aputure 600d', price: '₹1800', cat: 'LIGHT', img: 'https://images.unsplash.com/photo-1536240478700-b86d35fd733c?q=80&w=800' },
                      { id: 4, name: 'Zeiss 35mm', price: '₹1500', cat: 'LENS', img: 'https://images.unsplash.com/photo-1617005082133-548c4ea2e935?q=80&w=400' },
                    ].map(item => (
                      <div key={item.id} className="relative h-[160px] lg:h-[220px] w-[160px] lg:w-full shrink-0 overflow-hidden rounded-[24px] border border-white/5 shadow-xl group">
                        <img src={item.img} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
                        <div className="absolute top-4 right-4 rounded-lg bg-green-500 px-2 py-1 text-[9px] font-bold text-white shadow-lg">
                          {item.price}
                        </div>
                        <div className="absolute bottom-4 left-4">
                          <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">{item.cat}</p>
                          <p className="text-xs lg:text-sm font-bold text-white mt-0.5">{item.name}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
