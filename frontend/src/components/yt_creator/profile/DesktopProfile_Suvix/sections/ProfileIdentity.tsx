/* eslint-disable @typescript-eslint/no-explicit-any */
 
import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { updateUser } from '../../../../../store/slices/authSlice';
import { api } from '../../../../../api/client';
import { Edit3, Plus, Loader2 } from 'lucide-react';

const VerifiedBadge = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" fill="none">
    <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" fill="#FF3040" />
    <path d="m9 12 2 2 4-4" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const ProfileIdentity = ({ user }: { user: any }) => {
  const dispatch = useDispatch();
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioText, setBioText] = useState(user?.bio || '');
  const [isSavingBio, setIsSavingBio] = useState(false);

  const youtubeProfiles = user?.youtubeProfile || [];
  const primaryChannel = youtubeProfiles.find((p: any) => p.channel_name) || youtubeProfiles[0] || {};
    
  const displayName = user?.name || primaryChannel.channel_name || 'YouTube Creator';
  const username = user?.username ? `@${user.username}` : '@creator';

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

  return (
    <div className="flex flex-col gap-4 min-w-0 max-w-[60%]">
      {/* Avatar & Identity Row */}
      <div className="-mt-16 relative flex items-end gap-5">
        <div className="relative shrink-0 w-[120px] h-[120px] z-10">
          <div className="w-full h-full rounded-full border-4 border-white bg-card overflow-hidden shadow-sm">
            <img 
              src={user?.profilePicture || 'https://images.unsplash.com/photo-1524666041070-9d87656c25bb?auto=format&fit=crop&q=80&w=400'} 
              alt="Profile"
              className="w-full h-full object-cover"
            />
          </div>
          {/* Circular Plus Badge */}
          <button className="absolute bottom-2 right-0 w-8 h-8 rounded-full bg-zinc-800 dark:bg-white border-[3px] border-card flex items-center justify-center text-white dark:text-zinc-800 shadow-sm hover:scale-105 transition-transform z-30">
            <Plus size={18} strokeWidth={4} />
          </button>
        </div>

        {/* Identity Info next to Avatar */}
        <div className="flex flex-col gap-0.5 pb-2">
          <div className="flex items-center gap-1.5">
            <h1 className="text-2xl font-bold text-text-main leading-none tracking-tight">
              {displayName}
            </h1>
            <VerifiedBadge />
          </div>
          <p className="text-sm font-normal text-text-muted">
            {username}
          </p>
        </div>
      </div>

      {/* Bio */}
      <div className="w-full mt-2">
        {isEditingBio ? (
          <div className="flex flex-col gap-3 p-4 rounded-2xl bg-container border border-border-main">
            <div className="relative">
              <textarea
                value={bioText}
                onChange={(e) => setBioText(e.target.value)}
                maxLength={150}
                rows={3}
                disabled={isSavingBio}
                className="w-full text-sm text-text-main bg-page border border-border-main rounded-xl p-3 pb-8 focus:outline-none focus:border-text-muted focus:ring-0 transition-colors resize-none"
                placeholder="Tell the community about yourself..."
              />
              <span className={`absolute bottom-3 right-3 text-[10px] font-bold ${bioText.length >= 150 ? 'text-[#FF3040]' : 'text-text-muted'}`}>
                {bioText.length}/150
              </span>
            </div>
            <div className="flex justify-end gap-2">
              <button 
                onClick={() => setIsEditingBio(false)}
                disabled={isSavingBio}
                className="px-4 py-2 rounded-xl border border-border-main text-xs font-bold text-text-main hover:bg-page transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveBio}
                disabled={isSavingBio || bioText.trim() === user?.bio}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#FF3040] text-white text-xs font-bold hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {isSavingBio && <Loader2 size={14} className="animate-spin" />}
                {isSavingBio ? 'Saving...' : 'Save Bio'}
              </button>
            </div>
          </div>
        ) : !user?.bio ? (
          <div 
            onClick={() => { setBioText(''); setIsEditingBio(true); }}
            className="flex flex-col items-center justify-center p-5 rounded-2xl border border-dashed border-border-main bg-container cursor-pointer hover:border-text-muted transition-all group"
          >
            <div className="flex items-center gap-2 text-text-muted group-hover:text-text-main transition-colors">
              <Plus size={16} strokeWidth={2.5} />
              <span className="text-xs font-bold uppercase tracking-widest">Add your bio</span>
            </div>
            <p className="text-[11px] text-text-muted mt-1 opacity-70">Tell the community about yourself</p>
          </div>
        ) : (
          <div className="relative group bg-container p-4 rounded-2xl border border-border-main/50">
            <p className="text-sm text-text-main font-medium whitespace-pre-wrap leading-relaxed pr-8">
              {user.bio}
            </p>
            <button 
              onClick={() => { setBioText(user.bio || ''); setIsEditingBio(true); }}
              className="absolute top-3 right-3 p-1.5 rounded-lg bg-card border border-border-main text-text-muted hover:text-text-main opacity-0 group-hover:opacity-100 transition-all shadow-sm"
            >
              <Edit3 size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Linked Channels */}
      <div className="flex flex-col gap-2 mt-2">
        <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
          Linked Channels ({youtubeProfiles.length})
        </span>
        
        <div className="flex items-center no-scrollbar py-1 pl-1 w-full">
          {youtubeProfiles.length > 0 ? (
            youtubeProfiles.map((channel: any, i: number) => (
              <div 
                key={i} 
                className={`w-10 h-10 rounded-full border-[3px] border-card bg-page overflow-hidden shadow-sm shrink-0 relative ${i > 0 ? '-ml-4' : ''}`}
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
            <span className="text-xs font-medium text-text-muted italic mr-3">No channels</span>
          )}

          {/* Restored Default ... Slice */}
          {youtubeProfiles.length > 0 && (
            <div 
              className={`w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center shadow-sm shrink-0 relative -ml-4 z-0 border-[3px] border-card`}
            >
              <span className="text-zinc-800 dark:text-zinc-200 text-[16px] leading-none mb-2 font-black">...</span>
            </div>
          )}

          {/* Circular Plus Button inside the component */}
          <button className="w-9 h-9 rounded-full bg-black flex items-center justify-center text-white hover:opacity-80 transition-opacity shrink-0 ml-3 shadow-sm border border-card">
            <Plus size={14} strokeWidth={3} />
          </button>
        </div>
      </div>

    </div>
  );
};
