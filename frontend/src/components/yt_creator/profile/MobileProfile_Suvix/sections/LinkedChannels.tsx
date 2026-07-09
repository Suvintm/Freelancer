import React from 'react';
import { Plus, Trash2, CheckCircle2, Eye, Users, ChevronRight, Youtube } from 'lucide-react';

const formatCount = (num?: number | string) => {
  if (!num) return '0';
  const n = Number(num);
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toString();
};

export const LinkedChannels = ({ user }: { user: any }) => {
  const youtubeProfiles = user?.youtubeProfile || [];
  
  if (youtubeProfiles.length === 0) return null;

  return (
    <div className="flex flex-col gap-4 mt-6">
      
      <div className="flex items-center justify-between px-1">
        <h2 className="text-sm font-black text-text-main">
          Linked Channels ({youtubeProfiles.length})
        </h2>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border-main text-[10px] font-bold text-text-main hover:bg-page transition-colors">
          <Plus size={12} />
          Add Another
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {youtubeProfiles.map((channel: any, index: number) => {
          const isPrimary = index === 0;
          return (
            <div key={channel.channelId || index} className="flex flex-col bg-container border border-border-main rounded-2xl overflow-hidden shadow-sm relative group p-4 gap-4">
              
              <div className="flex items-start gap-3">
                {/* Channel Avatar */}
                <div className="w-12 h-12 rounded-full border border-border-main bg-page shrink-0 overflow-hidden mt-1">
                  <img src={channel.thumbnail_url || channel.profile_image_url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80'} alt="Channel" className="w-full h-full object-cover" />
                </div>

                {/* Info */}
                <div className="flex flex-col flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-[13px] font-bold text-text-main truncate max-w-[150px]">{channel.channel_name || 'YouTube Channel'}</h3>
                    {isPrimary && (
                      <span className="px-1.5 py-0.5 bg-[#FF3040] text-white text-[8px] font-black rounded uppercase tracking-wider">Primary</span>
                    )}
                    <Youtube size={12} className="text-zinc-400" />
                  </div>
                  
                  <div className="flex items-center gap-3 mt-1.5 text-text-muted">
                    <div className="flex items-center gap-1 text-[#FF3040]">
                      <Users size={12} />
                      <span className="text-[11px] font-bold">{formatCount(channel.subscriber_count)}</span>
                    </div>
                    <div className="flex items-center gap-1 text-text-muted">
                      <Eye size={12} />
                      <span className="text-[11px] font-bold">{formatCount(channel.view_count)}</span>
                    </div>
                  </div>

                  <span className="text-[9px] font-black text-[#FF3040] uppercase tracking-widest mt-2 block">
                    {channel.category || 'TECHNOLOGY'}
                  </span>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-border-main/50">
                <div className="flex items-center gap-3 text-text-muted">
                  <button className="text-[#FF3040] hover:opacity-80 transition-opacity">
                    <CheckCircle2 size={14} />
                  </button>
                  <button className="hover:text-text-main transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
                
                <button className="flex items-center gap-1 text-[10px] font-bold text-[#FF3040] hover:opacity-80 transition-opacity">
                  Analytics
                  <ChevronRight size={12} />
                </button>
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
};
