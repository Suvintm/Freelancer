import React, { useState } from 'react';
import { useTheme } from '../hooks/useTheme';
import { Users, Plus, Globe, Gamepad2, Code, Search, SlidersHorizontal, Bell } from 'lucide-react';
import { useSelector } from 'react-redux';
import { selectUser } from '../store/slices/authSlice';

const MOCK_COMMUNITIES = [
  { id: 1, name: 'Tech Innovators', members: '12.4K', icon: Code, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { id: 2, name: 'Gaming Legends', members: '8.2K', icon: Gamepad2, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  { id: 3, name: 'Global Explorers', members: '45.1K', icon: Globe, color: 'text-emerald-500', bg: 'bg-emerald-500/10' }
];

const Community = () => {
  const { isDarkMode } = useTheme();
  const user = useSelector(selectUser);
  const isCreator = user?.primaryRole?.category === 'yt_influencer';
  const [activeTab, setActiveTab] = useState('Discover');

  return (
    <div className={`flex flex-col w-full min-h-screen pb-20 lg:pb-0 ${
      isDarkMode ? 'bg-black text-white' : 'bg-white text-zinc-950'
    }`}>
      
      {/* ── PROFESSIONAL HEADER ── */}
      <div className={`sticky top-0 z-30 w-full px-4 sm:px-8 pt-6 pb-4 flex flex-col gap-5 border-b ${
        isDarkMode ? 'bg-black/80 border-white/10 backdrop-blur-xl' : 'bg-white/80 border-black/5 backdrop-blur-xl'
      }`}>
        {/* Top Row: Title & Actions */}
        <div className="flex items-center justify-between">
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight">
            Communities
          </h1>
          <div className="flex items-center gap-3">
            <button className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
              isDarkMode ? 'bg-zinc-900 hover:bg-zinc-800' : 'bg-zinc-100 hover:bg-zinc-200'
            }`}>
              <Search size={18} />
            </button>
            <button className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
              isDarkMode ? 'bg-zinc-900 hover:bg-zinc-800' : 'bg-zinc-100 hover:bg-zinc-200'
            }`}>
              <Bell size={18} />
            </button>
          </div>
        </div>

        {/* Bottom Row: Tabs & Filters */}
        <div className="flex items-center justify-between gap-4 overflow-x-auto scrollbar-hide pb-1">
          <div className="flex items-center gap-2">
            {['Discover', 'Joined', 'My Hubs'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap ${
                  activeTab === tab
                    ? (isDarkMode ? 'bg-white text-black' : 'bg-black text-white')
                    : (isDarkMode ? 'bg-transparent text-zinc-400 hover:bg-zinc-900' : 'bg-transparent text-zinc-500 hover:bg-zinc-100')
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <button className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold shrink-0 transition-colors ${
            isDarkMode ? 'text-zinc-400 hover:text-white hover:bg-zinc-900' : 'text-zinc-500 hover:text-black hover:bg-zinc-100'
          }`}>
            <SlidersHorizontal size={14} />
            Filters
          </button>
        </div>
      </div>

      {/* ── CONTENT AREA (Empty States) ── */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8">
        {isCreator ? (
          /* ── CREATOR UI ── */
          <div className="flex flex-col items-center max-w-lg text-center p-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="relative mb-8 group cursor-pointer">
              <div className={`w-24 h-24 rounded-[32px] flex items-center justify-center shadow-lg transition-transform group-hover:scale-105 duration-300 ${
                isDarkMode ? 'bg-zinc-900 border border-white/10' : 'bg-zinc-50 border border-black/10'
              }`}>
                <Users size={40} className={isDarkMode ? 'text-white' : 'text-zinc-900'} />
              </div>
              <div className={`absolute -bottom-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center shadow-md ${
                isDarkMode ? 'bg-white text-black' : 'bg-black text-white'
              }`}>
                <Plus size={18} strokeWidth={3} />
              </div>
            </div>
            
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Build Your Hub
            </h2>
            
            <p className={`text-base sm:text-lg mb-10 leading-relaxed max-w-md ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
              Create your first community for your YouTube channel to boost engagement, interact directly with your audience, and accelerate your growth.
            </p>

            <button className={`w-full max-w-sm py-4 px-6 rounded-2xl text-base font-bold shadow-xl transition-all active:scale-[0.98] hover:shadow-2xl flex items-center justify-center gap-2 ${
              isDarkMode 
                ? 'bg-white text-black hover:bg-zinc-200 shadow-white/10' 
                : 'bg-black text-white hover:bg-zinc-800 shadow-black/10'
            }`}>
              <Plus size={18} />
              Create Community
            </button>
          </div>
        ) : (
          /* ── NORMAL USER UI ── */
          <div className="flex flex-col w-full max-w-xl animate-in fade-in slide-in-from-bottom-4 duration-700 pt-8 lg:pt-0">
            
            <div className="text-center mb-10">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-sm ${
                isDarkMode ? 'bg-zinc-900 border border-white/5' : 'bg-zinc-50 border border-black/5'
              }`}>
                <Users size={28} className={isDarkMode ? 'text-zinc-400' : 'text-zinc-500'} />
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight mb-3">
                Discover Communities
              </h2>
              <p className={`text-sm sm:text-base ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
                You haven't joined any communities yet. Explore and connect with your favorite creators!
              </p>
            </div>

            <div className="space-y-3">
              <p className={`text-xs font-bold uppercase tracking-widest pl-2 mb-4 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
                Suggested for you
              </p>
              
              {MOCK_COMMUNITIES.map((community) => (
                <div 
                  key={community.id}
                  className={`flex items-center gap-4 p-4 rounded-[24px] border transition-all hover:scale-[1.01] ${
                    isDarkMode 
                      ? 'bg-zinc-950/50 border-white/5 hover:border-white/10' 
                      : 'bg-white border-zinc-100 hover:border-zinc-200 hover:shadow-sm'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${community.bg} ${community.color}`}>
                    <community.icon size={20} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-base truncate">{community.name}</h3>
                    <p className={`text-xs font-medium mt-0.5 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-500'}`}>
                      {community.members} Members
                    </p>
                  </div>

                  <button className={`px-5 py-2 rounded-xl text-sm font-bold transition-transform active:scale-95 flex items-center gap-1.5 ${
                    isDarkMode 
                      ? 'bg-white text-black hover:bg-zinc-200' 
                      : 'bg-black text-white hover:bg-zinc-800'
                  }`}>
                    Join
                  </button>
                </div>
              ))}
            </div>

          </div>
        )}
      </div>

    </div>
  );
};

export default Community;
