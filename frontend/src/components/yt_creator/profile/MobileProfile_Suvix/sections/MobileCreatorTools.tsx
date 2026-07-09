import React from 'react';
import { Settings, Plus, BarChart3, Briefcase, Users2, Lock } from 'lucide-react';
import SILVER_BTN from '../../../../../assets/playbuttons/silverbtn.png';
import GOLD_BTN from '../../../../../assets/playbuttons/goldenbtn.png';
import DIAMOND_BTN from '../../../../../assets/playbuttons/diamondbtn.png';

export const MobileCreatorTools = ({ user }: { user: any }) => {
  const youtubeProfiles = user?.youtubeProfile || [];
  
  const milestones = [
    { label: 'Silver', count: 100000, img: SILVER_BTN },
    { label: 'Gold', count: 1000000, img: GOLD_BTN },
    { label: 'Diamond', count: 10000000, img: DIAMOND_BTN },
  ];

  return (
    <div className="flex flex-col gap-5 mt-6 border-t border-border-main pt-6">
      
      {/* YT Creator Milestones */}
      <div className="flex flex-col gap-4">
        <h3 className="text-[10px] font-black text-text-muted uppercase tracking-widest">
          YT Creator Milestones
        </h3>
        
        <div className="flex gap-4 justify-between px-2">
          {milestones.map((m, i) => {
            const unlockedChannels = youtubeProfiles.filter((p: any) => (p.subscriber_count || 0) >= m.count).length;
            const isUnlocked = unlockedChannels > 0;
            
            return (
              <div key={i} className="flex flex-col items-center gap-2">
                <div className="relative group">
                  <div className={`w-14 h-14 rounded-full border flex items-center justify-center overflow-hidden transition-all duration-300 ${isUnlocked ? 'bg-card border-border-main shadow-sm' : 'bg-page border-border-main border-dashed'}`}>
                    <img 
                      src={m.img} 
                      alt={m.label} 
                      className={`w-8 h-8 object-contain ${!isUnlocked ? 'opacity-30 grayscale' : ''}`}
                    />
                  </div>
                  
                  {!isUnlocked && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-5 h-5 rounded-full bg-black/80 flex items-center justify-center shadow-md">
                        <Lock size={10} className="text-white" />
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-center gap-0.5">
                  <span className={`text-[10px] font-black uppercase tracking-widest ${isUnlocked ? 'text-text-main' : 'text-text-muted'}`}>
                    {m.label}
                  </span>
                  <span className="text-[8px] font-bold text-text-muted uppercase tracking-widest">
                    {unlockedChannels} / 1 Unlocked
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
