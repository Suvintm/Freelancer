import React from 'react';
import { Check } from 'lucide-react';

interface Milestone {
  id: string;
  title: string;
  completed: boolean;
}

export const CreatorJourneyWidget: React.FC = () => {
  const progressPercent = 72;
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  const milestones: Milestone[] = [
    { id: '1', title: 'Complete your profile', completed: true },
    { id: '2', title: 'Connect a social account', completed: true },
    { id: '3', title: 'Post 5 pieces of content', completed: true },
    { id: '4', title: 'Reach 1K followers', completed: false },
    { id: '5', title: 'Enable monetization', completed: false },
  ];

  return (
    <div className="w-full bg-white dark:bg-[#121215] rounded-2xl p-3.5 sm:p-4 border border-zinc-200/80 dark:border-zinc-800 shadow-xs transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs sm:text-[13px] font-bold text-zinc-900 dark:text-white tracking-tight leading-none">
          Creator Journey
        </h3>
        <span className="px-2.5 py-0.5 rounded-full bg-black dark:bg-white text-white dark:text-black text-[10px] font-black shadow-xs">
          Level 2
        </span>
      </div>

      {/* Progress Dial & Description */}
      <div className="flex items-center gap-3.5 mb-3.5">
        {/* SVG Circular Ring Gauge */}
        <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 50 50">
            {/* Background Track */}
            <circle
              cx="25"
              cy="25"
              r={radius}
              stroke="currentColor"
              strokeWidth="4"
              fill="transparent"
              className="text-zinc-100 dark:text-zinc-800"
            />
            {/* Animated Progress Ring */}
            <circle
              cx="25"
              cy="25"
              r={radius}
              stroke="currentColor"
              strokeWidth="4"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="text-black dark:text-white transition-all duration-1000 ease-out"
            />
          </svg>
          <span className="absolute text-[11px] font-black text-zinc-900 dark:text-white">
            {progressPercent}%
          </span>
        </div>

        {/* Text Next to Dial */}
        <div className="flex flex-col leading-tight">
          <h4 className="text-xs font-bold text-zinc-900 dark:text-white">
            Keep going!
          </h4>
          <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5 leading-snug font-medium">
            Complete more milestones to unlock new features.
          </p>
        </div>
      </div>

      {/* Milestones Checklist */}
      <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
        {milestones.map((m) => (
          <div key={m.id} className="flex items-center justify-between text-[11px]">
            <span className="font-medium text-zinc-700 dark:text-zinc-300">
              {m.title}
            </span>

            {/* Checkmark or Empty Circle */}
            {m.completed ? (
              <div className="w-4 h-4 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center shrink-0 shadow-2xs">
                <Check size={9} strokeWidth={4} />
              </div>
            ) : (
              <div className="w-4 h-4 rounded-full border-[1.5px] border-zinc-300 dark:border-zinc-700 shrink-0" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
