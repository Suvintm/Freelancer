import React, { useState } from 'react';
import { Youtube, Camera, Settings, Plus, CheckCircle2, BarChart3, Briefcase, Users2, Edit3, Lock, PlaySquare, LayoutGrid } from 'lucide-react';
import SILVER_BTN from '../../../assets/playbuttons/silverbtn.png';
import GOLD_BTN from '../../../assets/playbuttons/goldenbtn.png';
import DIAMOND_BTN from '../../../assets/playbuttons/diamondbtn.png';

/**
 * YTCreatorMain
 * Rebuilding from scratch.
 * Phase 1: Top Banner (Desktop Only)
 */
export const YTCreatorMain = () => {
  const [activeTab, setActiveTab] = useState('yt_posts');

  const TABS = [
    { id: 'yt_posts', label: 'YT Posts', icon: Youtube },
    { id: 'posts',    label: 'Posts',    icon: LayoutGrid },
    { id: 'reels',    label: 'Reels',    icon: PlaySquare },
  ];

  return (
    <>
      {/* 1. Desktop Profile View (Laptop/Desktop Only) */}
      <div className="hidden lg:flex w-full flex-col min-h-full pb-20">
      {/* 1. Top Banner - COMPRESSED */}
      <div className="hidden lg:block relative w-full aspect-[21/5] xl:aspect-[21/4] rounded-t-[32px] overflow-hidden">
        {/* Dynamic Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#FF0000] via-[#990000] to-black" />
        
        {/* Subtle Noise/Texture */}
        <div 
          className="absolute inset-0 opacity-[0.05]" 
          style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }}
        />

        {/* Floating YouTube Icon */}
        <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
          <Youtube size={80} strokeWidth={1} className="text-white" />
        </div>

        {/* Stats on Banner - TIGHTER */}
        <div className="absolute bottom-6 right-10 flex items-center gap-8">
          <div className="text-center space-y-0">
            <p className="text-xl xl:text-2xl font-black text-white tracking-tighter leading-none">1.2M</p>
            <p className="text-[9px] font-bold text-white/50 uppercase tracking-widest mt-1">Followers</p>
          </div>
          <div className="w-px h-6 bg-white/10" />
          <div className="text-center space-y-0">
            <p className="text-xl xl:text-2xl font-black text-white tracking-tighter leading-none">450</p>
            <p className="text-[9px] font-bold text-white/50 uppercase tracking-widest mt-1">Following</p>
          </div>
          <div className="w-px h-6 bg-white/10" />
          <div className="text-center space-y-0">
            <p className="text-xl xl:text-2xl font-black text-white tracking-tighter leading-none">84</p>
            <p className="text-[9px] font-bold text-white/50 uppercase tracking-widest mt-1">Posts</p>
          </div>
        </div>
      </div>

      <div className="px-8 relative z-10">
        <div className="flex flex-col gap-4">
          <div className="flex items-end justify-between w-full">
            {/* Profile Avatar - SHRUNK & TIGHTER OVERLAP */}
            <div className="relative group -mt-14">
              <div className="w-28 h-28 xl:w-32 xl:h-32 rounded-full border-[5px] border-[#09090B] bg-[#09090B] overflow-hidden shadow-xl ring-1 ring-white/5">
                <img 
                  src="https://images.unsplash.com/photo-1524666041070-9d87656c25bb?auto=format&fit=crop&q=80&w=400" 
                  alt="Profile"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              </div>
              
              {/* Camera Edit Badge - SMALLER */}
              <button className="absolute bottom-0 right-0 w-8 h-8 bg-[#FF3040] rounded-full border-[3px] border-[#09090B] flex items-center justify-center shadow-lg hover:bg-red-600 transition-all active:scale-90">
                <Camera size={14} className="text-white" />
              </button>
            </div>

            {/* Right Column: Actions & Toolbox - COMPACT */}
            <div className="flex flex-col items-end gap-2 mt-3">
              <div className="flex items-center gap-2">
                <button className="h-9 px-5 rounded-xl bg-border-secondary border border-border-main text-text-main text-[12px] font-bold hover:bg-border-main transition-all flex items-center gap-2 active:scale-95">
                  <Settings size={14} />
                  <span>Settings</span>
                </button>
                <button className="h-9 px-5 rounded-xl bg-[#FF3040] text-white text-[12px] font-bold hover:bg-red-600 transition-all flex items-center gap-2 shadow-md active:scale-95">
                  <Plus size={16} strokeWidth={2.5} />
                  <span>Add Story</span>
                </button>
              </div>

              {/* Toolbox Row - SHRUNK */}
              <div className="flex items-center gap-1.5 w-full">
                {[
                  { label: 'Analytics', icon: BarChart3, color: 'text-red-500', bg: 'bg-red-500/5' },
                  { label: 'Deals',     icon: Briefcase, color: 'text-blue-500', bg: 'bg-blue-500/5' },
                  { label: 'Collab',    icon: Users2,    color: 'text-emerald-500', bg: 'bg-emerald-500/5' },
                ].map((tool) => (
                  <button
                    key={tool.label}
                    className={`flex-1 h-10 flex flex-col items-center justify-center gap-0.5 px-3 rounded-lg ${tool.bg} border border-border-main/30 hover:border-border-main transition-colors`}
                  >
                    <tool.icon size={12} className={tool.color} />
                    <span className="text-[8px] font-black text-text-muted uppercase tracking-tighter opacity-70">{tool.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Identity Block - COMPACT */}
          <div className="space-y-0 ml-1">
             <div className="flex items-center gap-1.5">
                <h1 className="text-lg lg:text-xl font-bold text-text-main leading-tight">SuviX Creator</h1>
                <div className="w-4 h-4 bg-[#FF3040] rounded-full flex items-center justify-center shadow-md">
                   <svg viewBox="0 0 24 24" className="w-2.5 h-2.5 text-white fill-none stroke-current" strokeWidth={5} strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                   </svg>
                </div>
             </div>
             <p className="text-xs font-medium text-text-muted opacity-80">@suvix.official</p>
          </div>

          {/* Bio - EXTREMELY TIGHT */}
          <div className="mt-1 flex items-start gap-2.5 max-w-xl">
            <div className="flex-1">
              <p className="text-[13px] text-text-muted leading-relaxed font-medium opacity-90">
                Join our elite network of professional video editors and blow up your brand with high-fidelity visuals. Scaling creativity through technology. 🚀
              </p>
            </div>
            <button className="text-text-muted/50 hover:text-text-main transition-colors mt-0.5">
              <Edit3 size={13} />
            </button>
          </div>

          {/* Bottom Grid: Milestones & Latest Videos (30/70) - TIGHTER GAP */}
          <div className="mt-5 grid grid-cols-1 lg:grid-cols-[1.2fr_2.8fr] gap-10">
            {/* Left Column: Milestones (Smaller & Circular) */}
            <div className="overflow-hidden">
              <h3 className="text-[9px] font-black text-text-muted uppercase tracking-[0.2em] mb-3 opacity-50">YT Creator Milestones</h3>
              <div className="flex gap-5 overflow-x-auto pb-4 scrollbar-hide overscroll-x-contain touch-pan-x">
                {[
                  { label: 'Silver',  img: SILVER_BTN,  unlocked: true },
                  { label: 'Gold',    img: GOLD_BTN,    unlocked: true },
                  { label: 'Diamond', img: DIAMOND_BTN, unlocked: false },
                ].map((m, i) => (
                  <div key={i} className="flex-shrink-0 flex flex-col items-center gap-2">
                    <div className="relative group">
                      {/* Circular Container for Play Button */}
                      <div className={`w-16 h-16 lg:w-20 lg:h-20 rounded-full border border-border-main bg-border-secondary/50 flex items-center justify-center overflow-hidden transition-all duration-300 group-hover:border-red-500/30 ${!m.unlocked ? 'opacity-40 grayscale' : ''}`}>
                        <img 
                          src={m.img} 
                          alt={m.label} 
                          className="w-10 h-10 lg:w-12 lg:h-12 object-contain transition-transform duration-300 group-hover:scale-110"
                        />
                      </div>
                      
                      {!m.unlocked && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-6 h-6 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center border border-white/10 shadow-sm">
                            <Lock size={10} className="text-white/60" />
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="text-center">
                      <p className={`text-[10px] font-black ${m.unlocked ? 'text-text-main opacity-90' : 'text-text-muted opacity-50'} uppercase tracking-tighter`}>{m.label}</p>
                      <p className={`text-[8px] font-bold mt-0.5 tracking-tighter uppercase ${m.unlocked ? 'text-red-500' : 'text-text-muted opacity-30'}`}>
                        {m.unlocked ? 'UNLOCKED' : 'LOCKED'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: Latest Videos Carousel (Wider) */}
            <div className="overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[9px] font-black text-text-muted uppercase tracking-[0.2em] opacity-50">Latest Content</h3>
                <button className="text-[9px] font-black text-red-500 uppercase tracking-widest hover:underline">View All</button>
              </div>
              
              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide overscroll-x-contain touch-pan-x">
                {[
                  { id: 1, title: 'Building the Future of AI', views: '1.2M views', time: '2 days ago', thumb: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&q=80&w=400' },
                  { id: 2, title: 'Web Development 2026', views: '850K views', time: '5 days ago', thumb: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=400' },
                  { id: 3, title: 'Creator Economy 101', views: '45K views', time: '1 week ago', thumb: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=400' },
                  { id: 4, title: 'Next.js Mastery', views: '120K views', time: '3 days ago', thumb: 'https://images.unsplash.com/photo-1587620962725-abab7fe55159?auto=format&fit=crop&q=80&w=400' },
                ].map((video) => (
                  <div key={video.id} className="flex-shrink-0 w-52 group cursor-pointer">
                    <div className="relative aspect-video rounded-xl overflow-hidden mb-2 bg-border-secondary border border-white/5">
                      <img 
                        src={video.thumb} 
                        alt={video.title} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />
                      <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/80 backdrop-blur-md text-[9px] font-bold text-white">12:45</div>
                    </div>
                    <h4 className="text-[12px] font-bold text-text-main leading-tight line-clamp-1 group-hover:text-red-500 transition-colors">{video.title}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-bold text-text-muted">{video.views}</span>
                      <span className="w-1 h-1 rounded-full bg-text-muted/30" />
                      <span className="text-[10px] font-bold text-text-muted">{video.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 4. Content Tabs - EXTREMELY TIGHT TOP MARGIN */}
          <div className="mt-2 border-b border-border-main/50">
            <div className="flex items-center gap-10">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative pb-4 flex items-center gap-2.5 transition-all duration-300 ${activeTab === tab.id ? 'text-red-500' : 'text-text-muted hover:text-text-main'}`}
                >
                  <tab.icon size={18} className={activeTab === tab.id ? 'text-red-500' : 'text-text-muted'} />
                  <span className="text-[13px] font-black uppercase tracking-widest">{tab.label}</span>
                  {activeTab === tab.id && (
                    <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-red-500 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content Area */}
          <div className="py-6">
            {/* Reels Tab - Vertical Grid (Instagram Style) */}
            {activeTab === 'reels' && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {[
                  { id: 1, views: '1.2M', thumb: 'https://images.unsplash.com/photo-1539351014930-411832b99201?auto=format&fit=crop&q=80&w=400' },
                  { id: 2, views: '850K', thumb: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=400' },
                  { id: 3, views: '450K', thumb: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=400' },
                  { id: 4, views: '2.1M', thumb: 'https://images.unsplash.com/photo-1503023345030-a79b93e25e86?auto=format&fit=crop&q=80&w=400' },
                  { id: 5, views: '120K', thumb: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&q=80&w=400' },
                ].map((reel) => (
                  <div key={reel.id} className="group relative aspect-[9/16] rounded-xl overflow-hidden cursor-pointer bg-border-secondary border border-white/5">
                    <img src={reel.thumb} alt="Reel" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute bottom-3 left-3 flex items-center gap-1.5 text-white">
                      <PlaySquare size={14} className="fill-white" />
                      <span className="text-[11px] font-black">{reel.views}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Posts Tab - Square Grid (Instagram Style) */}
            {activeTab === 'posts' && (
              <div className="grid grid-cols-3 gap-1 lg:gap-2">
                {[
                  { id: 1, type: 'image', thumb: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&q=80&w=600' },
                  { id: 2, type: 'reel',  thumb: 'https://images.unsplash.com/photo-1539351014930-411832b99201?auto=format&fit=crop&q=80&w=600' },
                  { id: 3, type: 'image', thumb: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&q=80&w=600' },
                  { id: 4, type: 'image', thumb: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=600' },
                  { id: 5, type: 'reel',  thumb: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=600' },
                  { id: 6, type: 'image', thumb: 'https://images.unsplash.com/photo-1536240478700-b869070f9279?auto=format&fit=crop&q=80&w=600' },
                ].map((post) => (
                  <div key={post.id} className="group relative aspect-square cursor-pointer overflow-hidden bg-border-secondary">
                    <img src={post.thumb} alt="Post" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="flex items-center gap-4 text-white font-bold">
                        {post.type === 'reel' ? (
                          <div className="flex items-center gap-1.5"><PlaySquare size={18} fill="white" /><span>85K</span></div>
                        ) : (
                          <div className="flex items-center gap-1.5"><LayoutGrid size={18} fill="white" /><span>12K</span></div>
                        )}
                      </div>
                    </div>
                    {/* Multi-type indicator (Reel icon in corner) */}
                    {post.type === 'reel' && (
                      <div className="absolute top-2 right-2 text-white drop-shadow-lg">
                        <PlaySquare size={16} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* YT Posts Feed (Previously implemented) */}
            {activeTab === 'yt_posts' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { id: 1, title: 'How to Scale Your YouTube Channel to 1M Subscribers', views: '1.2M', date: '2 days ago', duration: '12:45', thumb: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&q=80&w=800' },
                  { id: 2, title: 'Mastering Cinematic B-Roll: A Complete Guide', views: '850K', date: '5 days ago', duration: '08:20', thumb: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&q=80&w=800' },
                  { id: 3, title: 'The Future of AI in Video Editing (2026)', views: '450K', date: '1 week ago', duration: '15:10', thumb: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=800' },
                  { id: 4, title: 'Inside My $50,000 Studio Setup', views: '2.1M', date: '2 weeks ago', duration: '22:30', thumb: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80&w=800' },
                  { id: 5, title: 'Why I Switched to Sony for Professional Work', views: '120K', date: '3 weeks ago', duration: '10:05', thumb: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=800' },
                  { id: 6, title: 'Editing Workflow: 0 to 100 Real Quick', views: '330K', date: '1 month ago', duration: '18:50', thumb: 'https://images.unsplash.com/photo-1536240478700-b869070f9279?auto=format&fit=crop&q=80&w=800' },
                ].map((post) => (
                  <div key={post.id} className="group cursor-pointer">
                    {/* Video Thumbnail Container */}
                    <div className="relative aspect-video rounded-2xl overflow-hidden bg-border-secondary border border-white/5 mb-3">
                      <img 
                        src={post.thumb} 
                        alt={post.title} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      {/* Glass Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      
                      {/* Play Icon on Hover */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 scale-75 group-hover:scale-100">
                        <div className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center shadow-2xl shadow-red-500/50">
                          <div className="w-0 h-0 border-t-[6px] border-t-transparent border-l-[10px] border-l-white border-b-[6px] border-b-transparent ml-1" />
                        </div>
                      </div>

                      {/* Duration Badge */}
                      <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/80 backdrop-blur-md border border-white/10 text-[10px] font-bold text-white tracking-tight">
                        {post.duration}
                      </div>
                    </div>

                    {/* Meta Info */}
                    <div className="px-1">
                      <h3 className="text-[14px] font-bold text-text-main leading-snug line-clamp-2 group-hover:text-red-500 transition-colors">
                        {post.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[11px] font-bold text-text-muted">{post.views} views</span>
                        <span className="w-1 h-1 rounded-full bg-text-muted/30" />
                        <span className="text-[11px] font-bold text-text-muted">{post.date}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          </div>
        </div>
      </div>

      {/* 2. Mobile Profile View (Empty Placeholder for now) */}
      <div className="lg:hidden w-full min-h-screen">
        {/* Mobile profile components will be built here */}
      </div>
    </>
  );
};
