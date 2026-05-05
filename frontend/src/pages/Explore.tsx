import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutGrid, Users, Play, Camera, CheckCircle2, UserPlus, MoreHorizontal } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { useAuthStore } from '../store/useAuthStore';

// ── Sub-components ──────────────────────────────────────────────────────────

const SectionHeader = ({ title, actionText, onAction }: { title: string; actionText?: string; onAction?: () => void }) => (
  <div className="mb-4 flex items-center justify-between px-6 lg:px-0">
    <h2 className="text-xl lg:text-2xl font-bold text-text-main">{title}</h2>
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
    <div className={`relative flex flex-col min-h-full transition-colors duration-500 ${isDarkMode ? 'bg-page text-white' : 'bg-white text-black'}`}>
      
      {/* 🌌 ELITE ATMOSPHERIC HEADER (Mobile: Native Sync | Desktop: Dashboard Style) */}
      <div className="sticky top-0 z-[60] lg:relative lg:z-10 lg:bg-container/80 lg:backdrop-blur-xl lg:border-b lg:border-border-main lg:mb-8 lg:-mx-6 lg:px-6">
        {/* Waterfall Gradient (Mobile Only) */}
        <div className="absolute inset-0 h-[180px] lg:hidden pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0A] via-[#0A0A0A]/80 to-transparent" />
          <motion.div 
            animate={{ backgroundColor: currentTab.color }}
            className="absolute inset-0 opacity-15"
          />
        </div>

        {/* Tab Bar */}
        <div className="relative z-20 flex items-center px-6 lg:px-0 pt-4 lg:pt-4 lg:pb-2">
          <div className="flex gap-2 overflow-x-auto no-scrollbar py-2">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 rounded-full px-5 py-2.5 text-[11px] font-bold transition-all duration-300
                  ${activeTab === tab.id 
                    ? 'bg-white text-black shadow-[0_8px_20px_rgba(255,255,255,0.15)] scale-105' 
                    : 'bg-white/5 text-zinc-500 hover:bg-white/10'
                  }
                `}
              >
                <tab.icon size={13} strokeWidth={2.5} />
                {tab.id.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Explore Hero (Sync with app) */}
        <div className="relative z-20 mt-4 lg:mt-6 px-6 lg:px-0 mb-4">
          <h1 className="text-2xl lg:text-3xl font-bold text-text-main">Explore SuviX</h1>
          <p className="text-[12px] lg:text-[14px] text-text-muted font-medium">Empowering your creative vision</p>
        </div>
      </div>

      {/* 🚀 MAIN CONTENT AREA */}
      <div className="relative z-10 flex-1 lg:mt-10">
        <AnimatePresence mode="wait">
          {activeTab === 'All' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="pt-6 lg:pt-0"
            >
              {/* 👋 PERSONALIZED GREETING (Native App Style) */}
              <div className="mb-10 px-6 lg:px-0">
                <p className="text-[12px] font-bold uppercase tracking-widest text-zinc-500">Today's Recommendation For</p>
                <h2 className="text-3xl lg:text-4xl font-bold text-text-main mt-1">
                  {user?.name?.split(' ')[0] || 'Suvin'}
                </h2>
              </div>

              {/* 🎞️ TRENDING REELS (Cinematic Strip) */}
              <section className="mb-12">
                <SectionHeader title="Trending Reels" actionText="Watch All" />
                <div className="flex gap-4 overflow-x-auto px-6 lg:px-0 no-scrollbar pb-4 lg:grid lg:grid-cols-3 lg:gap-8">
                  {[
                    { id: 1, name: 'VFX_Alex', views: '145K', img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400' },
                    { id: 2, name: 'FilmPro', views: '82K', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400' },
                    { id: 3, name: 'LensLife', views: '210K', img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=400' },
                  ].map(reel => (
                    <div key={reel.id} className="relative h-[280px] lg:h-[400px] w-[180px] lg:w-full shrink-0 overflow-hidden rounded-[32px] border border-white/10 group shadow-2xl">
                      <img src={reel.img} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                      <div className="absolute bottom-6 left-6">
                        <p className="text-sm lg:text-lg font-bold text-white">{reel.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                          <p className="text-[10px] lg:text-[12px] font-semibold text-white/60 tracking-wider">👁️ {reel.views}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* 📺 SUGGESTED FOR YOU (Double Row Matrix) */}
              <section className="mb-12">
                <SectionHeader title="Suggested for You" actionText="See All" />
                <div className="flex gap-5 overflow-x-auto px-6 lg:px-0 no-scrollbar pb-6 lg:grid lg:grid-cols-2 lg:gap-10">
                  {[
                    { id: 1, title: 'Directing Music Videos', author: 'Director X', views: '450K', time: '12:45', img: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=800' },
                    { id: 2, title: 'Cinematic Lighting 101', author: 'LightMaster', views: '220K', time: '08:15', img: 'https://images.unsplash.com/photo-1536240478700-b86d35fd733c?q=80&w=800' },
                  ].map(video => (
                    <div key={video.id} className="w-[280px] lg:w-full shrink-0 group">
                      <div className="relative aspect-[16/10] overflow-hidden rounded-[28px] border border-white/10 mb-4 shadow-xl">
                        <img src={video.img} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        
                        {/* Play Overlay */}
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                           <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center text-black">
                             <Play size={24} fill="currentColor" />
                           </div>
                        </div>

                        <div className="absolute bottom-4 right-4 rounded-xl bg-black/80 backdrop-blur-md px-2.5 py-1 text-[10px] font-bold text-white">{video.time}</div>
                      </div>
                      <div className="px-1">
                        <h3 className="text-[15px] lg:text-lg font-bold text-text-main line-clamp-1 leading-tight">{video.title}</h3>
                        <div className="flex items-center gap-2 mt-2">
                           <div className="w-6 h-6 rounded-full bg-border-secondary" />
                           <p className="text-[11px] lg:text-[13px] font-semibold text-text-muted">{video.author} • {video.views} views</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* 👤 FEATURED CREATORS (Master Identity Pods) */}
              <section className="mb-12">
                <SectionHeader title="Featured Creators" actionText="Discover All" />
                <div className="flex gap-5 overflow-x-auto px-6 lg:px-0 no-scrollbar pb-6 lg:grid lg:grid-cols-3 lg:gap-8">
                  {[
                    { id: 1, name: 'Souvik Suman', handle: '@souviksuman_pro', reach: '3.7M Reach', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400' },
                    { id: 2, name: 'Mayank Creative', handle: '@mayank_creative', reach: '1.5M Reach', img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400' },
                  ].map(creator => (
                    <div key={creator.id} className="w-[280px] lg:w-full shrink-0 rounded-[32px] bg-container border border-border-main p-6 lg:p-8 backdrop-blur-xl relative overflow-hidden group">
                      {/* Brand Glow */}
                      <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 blur-3xl group-hover:bg-rose-500/10 transition-colors" />
                      
                      <div className="flex items-center gap-5 mb-6 relative z-10">
                        <div className="h-16 w-16 overflow-hidden rounded-2xl border-2 border-rose-500 p-0.5">
                          <img src={creator.img} className="h-full w-full rounded-[14px] object-cover" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-base lg:text-lg font-bold text-text-main truncate">{creator.name}</p>
                            <CheckCircle2 size={14} className="text-rose-500 fill-rose-500/20" />
                          </div>
                          <p className="text-[12px] font-bold text-rose-500 tracking-wide">{creator.handle}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mb-6 px-1">
                        <div>
                          <p className="text-lg font-bold text-text-main">{creator.reach}</p>
                          <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Monthly Growth</p>
                        </div>
                        <button className="p-3 rounded-2xl bg-border-secondary text-text-muted hover:text-text-main transition-colors">
                          <MoreHorizontal size={20} />
                        </button>
                      </div>

                      <div className="flex gap-3 relative z-10">
                        <button className="flex-[2] rounded-2xl bg-text-main py-4 text-[12px] font-bold text-container hover:opacity-90 transition-all">Connect</button>
                        <button className="flex-1 rounded-2xl bg-border-secondary border border-border-main py-4 flex items-center justify-center text-text-main hover:bg-border-main transition-colors">
                          <UserPlus size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* 📸 PREMIUM GEAR RENTALS (Industrial Pods) */}
              <section className="mb-20">
                <SectionHeader title="Premium Gear Rentals" actionText="Browse Catalog" />
                <div className="flex gap-5 overflow-x-auto px-6 lg:px-0 no-scrollbar pb-6 lg:grid lg:grid-cols-3 lg:gap-8">
                  {[
                    { id: 1, name: 'Sony FX3 Cinema', price: '₹2500/day', cat: 'CAMERA', img: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=400' },
                    { id: 2, name: 'DJI Ronin RS3', price: '₹1200/day', cat: 'GIMBAL', img: 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?q=80&w=400' },
                  ].map(item => (
                    <div key={item.id} className="relative h-[220px] lg:h-[300px] w-[220px] lg:w-full shrink-0 overflow-hidden rounded-[32px] border border-white/5 shadow-2xl group">
                      <img src={item.img} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
                      <div className="absolute top-5 right-5 rounded-xl bg-green-500 px-3 py-1.5 text-[10px] font-bold text-white shadow-lg">
                        {item.price}
                      </div>
                      <div className="absolute bottom-6 left-6">
                        <p className="text-[10px] lg:text-[11px] font-bold text-white/50 uppercase tracking-widest">{item.cat}</p>
                        <p className="text-base lg:text-xl font-bold text-white mt-1">{item.name}</p>
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
