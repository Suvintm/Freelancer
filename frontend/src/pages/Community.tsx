import { useState } from 'react';
import { useTheme } from '../hooks/useTheme';
import { Users, Plus, Search, SlidersHorizontal, Bell } from 'lucide-react';
import { useSelector } from 'react-redux';
import { selectUser } from '../store/slices/authSlice';
import defaultProfile from '../assets/defaultprofile.png';
import CreateCommunityModal from '../components/community/CreateCommunityModal';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { useNavigate } from 'react-router-dom';
import { VerifiedBadge } from '../components/ui/VerifiedBadge';

const BUBBLE_COMMUNITIES = [
  { id: 1, name: 'Web Devs', img: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=150', delay: '0s' },
  { id: 2, name: 'Design Hub', img: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=150', delay: '0.5s' },
  { id: 3, name: 'AI Geniuses', img: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=150', delay: '1.2s' },
  { id: 4, name: 'Startups', img: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&q=80&w=150', delay: '1.8s' },
  { id: 5, name: 'Fitness', img: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&q=80&w=150', delay: '0.7s' },
  { id: 6, name: 'Tech Talk', img: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&q=80&w=150', delay: '1.5s' },
  { id: 7, name: 'Travel Bugs', img: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&q=80&w=150', delay: '0.3s' },
  { id: 8, name: 'Music fans', img: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=150', delay: '0.9s' },
];

const Community = () => {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const user = useSelector(selectUser);
  const roleStr = (user?.role || '').toLowerCase();
  const categoryStr = (user?.primaryRole?.category || '').toLowerCase();
  const categorySlugStr = (user?.primaryRole?.categorySlug || '').toLowerCase();

  const isCreator =
    roleStr === 'creator' ||
    roleStr === 'yt_influencer' ||
    categoryStr === 'creator' ||
    categoryStr === 'youtube creator' ||
    categoryStr === 'yt_influencer' ||
    categorySlugStr === 'creator' ||
    categorySlugStr === 'yt_influencer' ||
    !!user?.creatorProfile;
  const [activeTab, setActiveTab] = useState('Discover');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const { data: communitiesResponse, refetch } = useQuery({
    queryKey: ['my_communities'],
    queryFn: async () => {
      const res = await api.get('/communities/me');
      return res.data;
    },
    enabled: !!user,
  });

  const myCommunities = communitiesResponse?.communities || [];
  const youtubeChannels = user?.youtubeProfile || [];
  
  // We want exactly two avatars to peek out behind the main icon
  const peekAvatars = [];
  if (youtubeChannels.length >= 2) {
    peekAvatars.push(youtubeChannels[0]?.thumbnail_url);
    peekAvatars.push(youtubeChannels[1]?.thumbnail_url);
  } else if (youtubeChannels.length === 1) {
    peekAvatars.push(youtubeChannels[0]?.thumbnail_url);
    peekAvatars.push(user?.profilePicture || defaultProfile);
  } else {
    peekAvatars.push(user?.profilePicture || defaultProfile);
    peekAvatars.push(defaultProfile);
  }

  return (
    <div className={`flex flex-col w-full min-h-screen pb-20 lg:pb-0 ${
      isDarkMode ? 'bg-black text-white' : 'bg-white text-zinc-950'
    }`}>
      
      {/* ── HEADER ── */}
      <div className={`sticky top-0 z-30 w-full px-4 sm:px-8 pt-5 pb-3 flex flex-col gap-4 border-b ${
        isDarkMode ? 'bg-black/80 border-white/10 backdrop-blur-xl' : 'bg-white/80 border-black/5 backdrop-blur-xl'
      }`}>
        <div className="flex items-center justify-between">
          <h1 className="font-display text-2xl font-bold tracking-tight">Communities</h1>
          <div className="flex items-center gap-2 sm:gap-3">
            {isCreator && (
              <button 
                onClick={() => setIsCreateModalOpen(true)}
                className={`hidden sm:flex px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-lg active:scale-[0.98] items-center gap-2 mr-2 ${
                  isDarkMode 
                    ? 'bg-white text-black hover:bg-zinc-200 shadow-white/10' 
                    : 'bg-black text-white hover:bg-zinc-800 shadow-black/10'
                }`}
              >
                <Plus className="w-4 h-4" />
                Create
              </button>
            )}
            
            {/* Mobile Create Button (Icon only) */}
            {isCreator && (
              <button 
                onClick={() => setIsCreateModalOpen(true)}
                className={`sm:hidden p-2 rounded-full transition-colors ${
                  isDarkMode 
                    ? 'bg-white text-black hover:bg-zinc-200' 
                    : 'bg-black text-white hover:bg-zinc-800'
                }`}
              >
                <Plus className="w-5 h-5" />
              </button>
            )}

            <button className={`p-2 sm:p-2.5 rounded-full transition-colors ${
              isDarkMode ? 'hover:bg-white/10' : 'hover:bg-black/5'
            }`}>
              <Search className="w-5 h-5" />
            </button>
            <button className={`p-2 sm:p-2.5 rounded-full transition-colors ${
              isDarkMode ? 'hover:bg-white/10' : 'hover:bg-black/5'
            }`}>
              <Bell className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Bottom Row: Tabs & Filters */}
        <div className="flex items-center justify-between gap-3 overflow-x-auto scrollbar-hide pb-1">
          <div className="flex items-center gap-1.5">
            {['Discover', 'Joined', 'My Hubs'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 sm:px-4 sm:py-1.5 rounded-full text-xs sm:text-[13px] font-bold transition-all whitespace-nowrap ${
                  activeTab === tab
                    ? (isDarkMode ? 'bg-white text-black' : 'bg-black text-white')
                    : (isDarkMode ? 'bg-transparent text-zinc-400 hover:bg-zinc-900' : 'bg-transparent text-zinc-500 hover:bg-zinc-100')
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <button className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold shrink-0 transition-colors ${
            isDarkMode ? 'text-zinc-400 hover:text-white hover:bg-zinc-900' : 'text-zinc-500 hover:text-black hover:bg-zinc-100'
          }`}>
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Filters
          </button>
        </div>
      </div>

      {/* ── CONTENT AREA (Empty States) ── */}
      <div className={`flex-1 flex flex-col p-4 sm:p-8 ${myCommunities.length === 0 ? 'items-center justify-center' : ''}`}>
        
        {myCommunities.length > 0 ? (
          /* ── MY COMMUNITIES UI ── */
          <div className="w-full animate-in fade-in duration-500 pt-2">
            <div className="flex flex-col w-full max-w-3xl mx-auto">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {myCommunities.map((community: any, index: number) => (
                <div 
                  key={community.id} 
                  onClick={() => navigate(`/community/${community.id}`)}
                  className={`group relative flex items-center gap-4 py-4 px-2 sm:px-4 cursor-pointer transition-colors ${
                    isDarkMode ? 'hover:bg-white/5' : 'hover:bg-black/5'
                  } ${index !== myCommunities.length - 1 ? (isDarkMode ? 'border-b border-white/5' : 'border-b border-black/5') : ''}`}
                >
                  {/* Thumbnail */}
                  <div className="relative shrink-0">
                    <img 
                      src={community.thumbnail || defaultProfile} 
                      alt={community.name} 
                      className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover bg-zinc-200" 
                    />
                    {/* Optional online/activity indicator could go here */}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1 min-w-0 pr-4">
                        <h3 className="font-bold text-base sm:text-lg truncate">{community.name}</h3>
                        {community.ytProfileId && (
                          <VerifiedBadge isVerified={true} role="yt_influencer" className="w-4 h-4 shrink-0" />
                        )}
                      </div>
                      {/* Fake timestamp for now, but looks authentic */}
                      <span className={`text-xs whitespace-nowrap shrink-0 font-medium ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
                        Just now
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <p className={`text-sm truncate pr-4 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
                        {community.description || `Welcome to ${community.name}!`}
                      </p>
                      
                      {/* Unread badge example */}
                      <div className="shrink-0 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-[10px] font-bold text-white">
                        1
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : isCreator ? (
          /* ── CREATOR UI (Empty State) ── */
          <div className="flex flex-col items-center max-w-lg text-center p-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="relative z-0 mb-8 sm:mb-10 group cursor-pointer mt-4">
              
              {/* Peeking Channel Avatars */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                {/* Left peeking avatar */}
                <div className="absolute -z-20 transition-transform duration-500 group-hover:-translate-y-16 group-hover:-translate-x-14 -translate-y-10 sm:-translate-y-12 -translate-x-6 sm:-translate-x-8 -rotate-12">
                  <img 
                    src={peekAvatars[1]} 
                    alt="Channel 2" 
                    className={`w-[60px] h-[60px] sm:w-[64px] sm:h-[64px] rounded-full object-cover border-[3px] shadow-sm ${
                      isDarkMode ? 'border-black bg-zinc-900' : 'border-white bg-zinc-100'
                    }`}
                  />
                  <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center shadow-md border-2 ${
                    isDarkMode ? 'bg-white text-black border-black' : 'bg-black text-white border-white'
                  }`}>
                    <Plus className="w-3 h-3" strokeWidth={4} />
                  </div>
                </div>
                {/* Right peeking avatar (Primary) */}
                <img 
                  src={peekAvatars[0]} 
                  alt="Channel 1" 
                  className={`absolute w-[64px] h-[64px] sm:w-[68px] sm:h-[68px] rounded-full object-cover -z-10 transition-transform duration-500 group-hover:-translate-y-20 group-hover:translate-x-14 -translate-y-12 sm:-translate-y-14 translate-x-6 sm:translate-x-8 rotate-12 border-[3px] shadow-md ${
                    isDarkMode ? 'border-black' : 'border-white'
                  }`}
                />
              </div>

              {/* Main Community Icon */}
              <div className={`relative z-10 w-20 h-20 rounded-[28px] flex items-center justify-center shadow-xl transition-transform group-hover:scale-[1.02] duration-300 ${
                isDarkMode ? 'bg-zinc-900 border border-white/10' : 'bg-zinc-50 border border-black/10'
              }`}>
                <Users className={`w-8 h-8 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`} />
              </div>
              <div className={`absolute z-20 -bottom-1.5 -right-1.5 w-7 h-7 rounded-full flex items-center justify-center shadow-xl ${
                isDarkMode ? 'bg-white text-black' : 'bg-black text-white'
              }`}>
                <Plus className="w-4 h-4" strokeWidth={3} />
              </div>
            </div>
            
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight mb-3">
              Build Your Hub
            </h2>
            
            <p className={`text-sm sm:text-base mb-8 leading-relaxed max-w-sm sm:max-w-md ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
              Create your first community for your YouTube channel to boost engagement, interact directly with your audience, and accelerate your growth.
            </p>

            <button 
              onClick={() => setIsCreateModalOpen(true)}
              className={`w-full max-w-[280px] sm:max-w-[300px] py-3.5 px-5 rounded-xl text-sm font-bold shadow-xl transition-all active:scale-[0.98] hover:shadow-2xl flex items-center justify-center gap-2 ${
              isDarkMode 
                ? 'bg-white text-black hover:bg-zinc-200 shadow-white/10' 
                : 'bg-black text-white hover:bg-zinc-800 shadow-black/10'
            }`}>
              <Plus className="w-4 h-4" />
              Create Community
            </button>
          </div>
        ) : (
          /* ── NORMAL USER UI ── */
          <div className="flex flex-col w-full max-w-xl animate-in fade-in slide-in-from-bottom-4 duration-700 pt-6 sm:pt-0">
            
            <div className="text-center mb-8">
              <div className={`w-14 h-14 rounded-[20px] flex items-center justify-center mx-auto mb-4 shadow-sm ${
                isDarkMode ? 'bg-zinc-900 border border-white/5' : 'bg-zinc-50 border border-black/5'
              }`}>
                <Users className={`w-6 h-6 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`} />
              </div>
              <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight mb-2">
                Discover Communities
              </h2>
              <p className={`text-xs sm:text-sm px-2 sm:px-0 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
                You haven't joined any communities yet. Explore and connect with your favorite creators!
              </p>
            </div>

            <div className="w-full">
              <p className={`text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-center mb-6 sm:mb-8 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
                Suggested for you
              </p>
              
              <style>{`
                @keyframes floatBubble {
                  0%, 100% { transform: translateY(0); }
                  50% { transform: translateY(-12px); }
                }
              `}</style>
              
              <div className="flex flex-wrap justify-center gap-x-6 gap-y-8 sm:gap-x-10 sm:gap-y-10 max-w-2xl mx-auto">
                {BUBBLE_COMMUNITIES.map((community) => (
                  <div 
                    key={community.id}
                    className="flex flex-col items-center group w-[88px] sm:w-[100px]"
                    style={{ 
                      animation: 'floatBubble 4s ease-in-out infinite',
                      animationDelay: community.delay 
                    }}
                  >
                    <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full p-1 sm:p-1.5 border-[3px] shadow-lg mb-3 overflow-hidden cursor-pointer transition-transform duration-300 group-hover:scale-110 ${
                      isDarkMode ? 'border-zinc-800 hover:border-white bg-zinc-900' : 'border-zinc-200 hover:border-black bg-white'
                    }`}>
                      <img src={community.img} alt={community.name} className="w-full h-full object-cover rounded-full" />
                    </div>
                    
                    <h3 className="font-bold text-[11px] sm:text-xs text-center truncate w-full mb-2">
                      {community.name}
                    </h3>

                    <button className={`px-4 py-1.5 sm:px-5 sm:py-1.5 rounded-full text-[10px] sm:text-[11px] font-bold transition-transform active:scale-95 shadow-md flex items-center justify-center gap-1.5 ${
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

          </div>
        )}
      </div>

      <CreateCommunityModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        onSuccess={(community) => {
          console.log('Created!', community);
          refetch(); // Refetch the communities list
        }}
      />
    </div>
  );
};

export default Community;
