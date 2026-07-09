import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { updateUser } from '../../../../../store/slices/authSlice';
import { api } from '../../../../../api/client';
import { Edit3, Plus, Loader2, Globe, BarChart3, Briefcase, Users2 } from 'lucide-react';

const VerifiedBadge = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" fill="none">
    <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" fill="#FF3040" />
    <path d="m9 12 2 2 4-4" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const MobileIdentity = ({ user }: { user: any }) => {
  const dispatch = useDispatch();
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioText, setBioText] = useState(user?.bio || '');
  const [isSavingBio, setIsSavingBio] = useState(false);

  const youtubeProfiles = user?.youtubeProfile || [];
  const primaryChannel = youtubeProfiles.find((p: any) => p.channel_name) || youtubeProfiles[0] || {};
  const displayName = user?.name || primaryChannel.channel_name || 'YouTube Creator';
  const category = primaryChannel.category || 'TECHNOLOGY';
  const location = user?.country || 'INDIA';

  const handleSaveBio = async () => {
    setIsSavingBio(true);
    try {
      const response = await api.patch('/user/me', { bio: bioText });
      if (response.data?.success) {
        dispatch(updateUser({ bio: response.data.user.bio }));
        setIsEditingBio(false);
      }
    } catch (err) {
      console.error('Failed to save bio:', err);
    } finally {
      setIsSavingBio(false);
    }
  };

  const [isBioExpanded, setIsBioExpanded] = useState(false);

  return (
    <div className="flex flex-col gap-3 mt-1 relative z-10">
      
      {/* Top Row: Avatar & Identity Details */}
      <div className="flex gap-3">
        {/* Avatar Wrapper */}
        <div className="relative shrink-0 w-[84px] h-[84px] -mt-10 z-20 self-start">
          {/* Avatar Image */}
          <div className="w-[84px] h-[84px] rounded-full border-[3px] border-card bg-container overflow-hidden shadow-sm relative">
            <img 
              src={user?.profilePicture || 'https://images.unsplash.com/photo-1524666041070-9d87656c25bb?auto=format&fit=crop&q=80&w=400'} 
              alt="Profile"
              className="w-full h-full object-cover"
            />
          </div>
          {/* Circular Plus Badge */}
          <button className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-zinc-800 dark:bg-white border-[3px] border-card flex items-center justify-center text-white dark:text-zinc-800 shadow-sm hover:scale-105 transition-transform z-30">
            <Plus size={16} strokeWidth={4} />
          </button>
        </div>

        {/* Identity Details (Next to Avatar) */}
        <div className="flex flex-col gap-0.5 pb-1 justify-center mt-2 flex-1 min-w-0">
          <div className="flex items-center gap-1.5 w-full">
            <h1 className="text-base font-bold text-text-main leading-none tracking-tight truncate max-w-[140px]">
              {displayName}
            </h1>
            <VerifiedBadge />
          </div>
          <p className="text-[11px] font-normal text-text-muted mt-0.5 truncate max-w-[160px]">
            {user?.username 
              ? (user.username.startsWith('@') ? user.username : `@${user.username}`) 
              : `@${displayName.toLowerCase().replace(/\s+/g, '')}`}
          </p>
          
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            <span className="px-2 py-0.5 rounded-md border border-border-main text-[8px] font-bold text-text-muted uppercase tracking-widest bg-page">
              {category}
            </span>
            <div className="flex items-center gap-1 text-text-muted ml-1">
              <Globe size={10} />
              <span className="text-[8px] font-bold uppercase tracking-widest">{location}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Middle Row: Bio & Action Buttons */}
      <div className="flex justify-between items-start mt-1 gap-2">
        
        {/* Bio (Left Side) */}
        <div className="w-[60%]">
          {isEditingBio ? (
            <div className="flex flex-col gap-2 p-2 rounded-xl bg-container border border-border-main">
              <div className="relative">
                <textarea
                  value={bioText}
                  onChange={(e) => setBioText(e.target.value)}
                  maxLength={150}
                  rows={4}
                  disabled={isSavingBio}
                  className="w-full text-[11px] text-text-main bg-page border border-border-main rounded-lg p-2 pb-6 focus:outline-none focus:border-text-muted focus:ring-0 transition-colors resize-none"
                  placeholder="Tell the community about yourself..."
                />
                <span className={`absolute bottom-2 right-2 text-[9px] font-bold ${bioText.length >= 150 ? 'text-[#FF3040]' : 'text-text-muted'}`}>
                  {bioText.length}/150
                </span>
              </div>
              <div className="flex justify-end gap-1.5">
                <button 
                  onClick={() => setIsEditingBio(false)}
                  disabled={isSavingBio}
                  className="px-2 py-1 rounded-lg border border-border-main text-[10px] font-bold text-text-main hover:bg-page transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveBio}
                  disabled={isSavingBio || bioText.trim() === user?.bio}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#FF3040] text-white text-[10px] font-bold hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  {isSavingBio && <Loader2 size={10} className="animate-spin" />}
                  {isSavingBio ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          ) : !user?.bio ? (
            <div 
              onClick={() => { setBioText(''); setIsEditingBio(true); }}
              className="flex items-center gap-1.5 cursor-pointer active:opacity-70 transition-all py-1"
            >
              <Plus size={12} className="text-text-muted" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Add bio</span>
            </div>
          ) : (
            <div className="relative group w-full pr-4">
              <p className={`text-[11px] text-text-main font-medium whitespace-pre-wrap leading-relaxed ${!isBioExpanded ? 'line-clamp-3' : ''}`}>
                {user.bio}
              </p>
              {user.bio && user.bio.length > 70 && (
                <button 
                  onClick={(e) => { e.stopPropagation(); setIsBioExpanded(!isBioExpanded); }}
                  className="text-[10px] font-bold text-[#FF3040] hover:opacity-80 mt-0.5"
                >
                  {isBioExpanded ? 'less' : '... more'}
                </button>
              )}
              <button 
                onClick={() => { setBioText(user.bio || ''); setIsEditingBio(true); }}
                className="absolute top-0 right-0 p-1 rounded-lg bg-card border border-border-main text-text-muted active:text-text-main opacity-100 transition-all shadow-sm"
              >
                <Edit3 size={10} />
              </button>
            </div>
          )}
        </div>

        {/* Action Buttons (Right Side) */}
        <div className="w-[40%] flex flex-col gap-2">
          <button className="w-full h-8 rounded-lg border border-border-main text-text-main text-[10px] font-bold hover:bg-page transition-colors flex items-center justify-center gap-1.5">
            <span className="opacity-70">⚙️</span> Settings
          </button>
          <button className="w-full h-8 rounded-lg bg-black text-white text-[10px] font-bold hover:opacity-80 transition-opacity flex items-center justify-center gap-1.5 shadow-sm">
            <Plus size={12} strokeWidth={3} />
            Add Story
          </button>
        </div>

      </div>

      {/* Middle Split: Linked Channels & Future Component */}
      <div className="flex justify-between items-end mt-4 gap-2 w-full">
        
        {/* Linked Channels Facepile (Left Half) */}
        <div className="w-1/2 flex flex-col gap-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
            Linked Channels ({youtubeProfiles.length})
          </span>
          
          <div className="flex items-center overflow-x-auto no-scrollbar py-1 pl-1 w-full">
            {youtubeProfiles.length > 0 ? (
              youtubeProfiles.map((channel: any, i: number) => (
                <div 
                  key={i} 
                  className={`w-9 h-9 rounded-full border-2 border-card bg-page overflow-hidden shadow-sm shrink-0 relative ${i > 0 ? '-ml-3' : ''}`}
                  style={{ zIndex: 100 - i }}
                >
                  <img 
                    src={channel.thumbnail_url || channel.profile_image_url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80'} 
                    alt="Channel" 
                    className="w-full h-full object-cover"
                  />
                </div>
              ))
            ) : (
              <span className="text-[10px] font-medium text-text-muted italic mr-2">No channels</span>
            )}

            {/* Restored Default ... Slice */}
            {youtubeProfiles.length > 0 && (
              <div 
                className={`w-9 h-9 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center shadow-sm shrink-0 relative -ml-3 z-0`}
              >
                <span className="text-zinc-800 dark:text-zinc-200 text-[14px] leading-none mb-2 font-black">...</span>
              </div>
            )}

            {/* Circular Plus Button inside the component */}
            <button className="w-8 h-8 rounded-full bg-black flex items-center justify-center text-white hover:opacity-80 transition-opacity shrink-0 ml-2 shadow-sm">
              <Plus size={12} strokeWidth={3} />
            </button>
          </div>
        </div>

        {/* Right Half (Toolboxes / Quick Links) */}
        <div className="w-1/2 flex items-center justify-end gap-2 pb-0.5 pr-1">
          <button className="w-9 h-9 flex items-center justify-center bg-black rounded-full hover:opacity-80 transition-opacity shadow-sm">
            <BarChart3 size={16} strokeWidth={2.5} className="text-white" />
          </button>
          <button className="w-9 h-9 flex items-center justify-center bg-black rounded-full hover:opacity-80 transition-opacity shadow-sm">
            <Briefcase size={16} strokeWidth={2.5} className="text-white" />
          </button>
          <button className="w-9 h-9 flex items-center justify-center bg-black rounded-full hover:opacity-80 transition-opacity shadow-sm">
            <Users2 size={16} strokeWidth={2.5} className="text-white" />
          </button>
        </div>

      </div>

    </div>
  );
};
