import React from 'react';
import { Settings, Plus, BarChart3, Briefcase, Users2, Lock } from 'lucide-react';
import SILVER_BTN from '../../../../../assets/playbuttons/silverbtn.png';
import GOLD_BTN from '../../../../../assets/playbuttons/goldenbtn.png';
import DIAMOND_BTN from '../../../../../assets/playbuttons/diamondbtn.png';

interface CreatorToolsProps {
  user: any;
}

export const CreatorTools = ({ user }: CreatorToolsProps) => {
  const youtubeProfiles = user?.youtubeProfile || [];
  
  const milestones = [
    { label: 'Silver', count: 100000, img: SILVER_BTN },
    { label: 'Gold', count: 1000000, img: GOLD_BTN },
    { label: 'Diamond', count: 10000000, img: DIAMOND_BTN },
  ];

  return (
    <div className="flex flex-col items-end gap-5 mt-6 shrink-0">
      
      {/* Primary Actions */}
      <div className="flex items-center gap-3">
        <button className="h-10 px-5 rounded-full bg-page border border-border-main text-text-main text-xs font-bold hover:bg-container transition-colors flex items-center gap-2">
          <Settings size={14} />
          <span>Settings</span>
        </button>
        <button className="h-10 px-5 rounded-full bg-[#FF3040] text-white text-xs font-bold hover:bg-red-600 transition-colors flex items-center gap-2 shadow-sm">
          <Plus size={16} strokeWidth={2.5} />
          <span>Add Story</span>
        </button>
      </div>

      {/* Toolboxes - Solid pill style */}
      <div className="flex items-center bg-page border border-border-main rounded-full p-1 gap-1">
        {[
          { label: 'Analytics', icon: BarChart3 },
          { label: 'Deals',     icon: Briefcase },
          { label: 'Collab',    icon: Users2 },
        ].map((tool) => (
          <button
            key={tool.label}
            className="flex items-center gap-1.5 h-8 px-4 rounded-full hover:bg-card hover:shadow-sm text-text-muted hover:text-text-main transition-all"
          >
            <tool.icon size={12} />
            <span className="text-[10px] font-bold uppercase tracking-widest">{tool.label}</span>
          </button>
        ))}
      </div>

      {/* Milestones Play Buttons */}
      <div className="flex gap-4 justify-end mt-2">
        {milestones.map((m, i) => {
          const unlockedChannels = youtubeProfiles.filter((p: any) => (p.subscriber_count || 0) >= m.count).length;
          const isUnlocked = unlockedChannels > 0;
          
          return (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <div className="relative group">
                <div className={`w-12 h-12 rounded-full border flex items-center justify-center overflow-hidden transition-all duration-300 ${isUnlocked ? 'bg-card border-border-main shadow-sm group-hover:border-red-500' : 'bg-page border-border-main border-dashed'}`}>
                  <img 
                    src={m.img} 
                    alt={m.label} 
                    className={`w-7 h-7 object-contain ${!isUnlocked ? 'opacity-30 grayscale' : ''}`}
                  />
                </div>
                
                {!isUnlocked && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-5 h-5 rounded-full bg-text-main flex items-center justify-center shadow-md">
                      <Lock size={10} className="text-white" />
                    </div>
                  </div>
                )}
              </div>
              <span className={`text-[9px] font-black uppercase tracking-widest ${isUnlocked ? 'text-text-main' : 'text-text-muted'}`}>{m.label}</span>
            </div>
          );
        })}
      </div>

    </div>
  );
};
