import React from 'react';
import { Eye, MousePointerClick, TrendingUp, BarChart3 } from 'lucide-react';

interface ProfileStatsProps {
  views: number;
  clicks: number;
  ctr: string;
}

export const ProfileStats: React.FC<ProfileStatsProps> = ({
  views = 0,
  clicks = 0,
  ctr = '0%',
}) => {
  const stats = [
    { label: 'Total Views', value: views.toLocaleString(), icon: Eye, change: '+14.2%', color: 'text-indigo-400' },
    { label: 'Link Clicks', value: clicks.toLocaleString(), icon: MousePointerClick, change: '+9.8%', color: 'text-emerald-400' },
    { label: 'Click Rate', value: ctr, icon: TrendingUp, change: '+2.4%', color: 'text-amber-400' },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 select-none">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            className="p-4 rounded-2xl bg-surface/60 border border-border-main/70 shadow-sm flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-text-muted mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider">{stat.label}</span>
              <Icon size={14} className={stat.color} />
            </div>

            <div className="flex items-baseline justify-between">
              <span className="text-xl font-bold text-text-main tracking-tight">{stat.value}</span>
              <span className="text-[10px] font-bold text-emerald-500 font-mono">{stat.change}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ProfileStats;
