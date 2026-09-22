import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit3, Video, Radio, Film } from 'lucide-react';

export const QuickActionsWidget: React.FC = () => {
  const navigate = useNavigate();

  const actions = [
    {
      id: 'post',
      label: 'Create Post',
      icon: Edit3,
      action: () => navigate('/create'),
    },
    {
      id: 'video',
      label: 'Upload Video',
      icon: Video,
      action: () => navigate('/upload-portal'),
    },
    {
      id: 'live',
      label: 'Go Live',
      icon: Radio,
      action: () => navigate('/create'),
    },
    {
      id: 'reel',
      label: 'Create Reel',
      icon: Film,
      action: () => navigate('/create'),
    },
  ];

  return (
    <div className="w-full bg-white dark:bg-[#121215] rounded-2xl p-3.5 sm:p-4 border border-zinc-200/80 dark:border-zinc-800 shadow-xs transition-colors">
      <h3 className="text-xs sm:text-[13px] font-bold text-zinc-900 dark:text-white tracking-tight mb-2.5 leading-none">
        Quick Actions
      </h3>

      <div className="grid grid-cols-2 gap-2">
        {actions.map((act) => {
          const Icon = act.icon;
          return (
            <button
              key={act.id}
              type="button"
              onClick={act.action}
              className="flex items-center gap-2 p-2 sm:p-2.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-850 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all cursor-pointer text-left group shadow-2xs"
            >
              <Icon 
                size={14} 
                strokeWidth={2}
                className="text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors shrink-0" 
              />
              <span className="text-[11px] font-bold text-zinc-800 dark:text-zinc-200 leading-tight truncate">
                {act.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
