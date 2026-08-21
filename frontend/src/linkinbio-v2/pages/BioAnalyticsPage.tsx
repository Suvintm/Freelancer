import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  TrendingUp, 
  MousePointerClick, 
  Eye, 
  Users, 
  Download, 
  Smartphone, 
  Monitor, 
  Tablet, 
  Mail
} from 'lucide-react';

type TimeRange = '7d' | '30d' | '90d' | 'all';

interface MetricCardProps {
  label: string;
  value: string;
  delta: string;
  isPositive: boolean;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  delta,
  isPositive,
  icon: Icon,
  iconBg,
  iconColor,
}) => (
  <div className="p-4 rounded-2xl bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 shadow-xs">
    <div className="flex items-center justify-between">
      <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">
        {label}
      </span>
      <div className={`p-2 rounded-xl ${iconBg} ${iconColor}`}>
        <Icon className="w-4 h-4" />
      </div>
    </div>
    <div className="mt-3 flex items-baseline justify-between">
      <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
        {value}
      </span>
      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
        isPositive 
          ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400' 
          : 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400'
      }`}>
        {delta}
      </span>
    </div>
  </div>
);

export const BioAnalyticsPage: React.FC = () => {
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');

  // Production Mock Analytics Data
  const MOCK_TOP_LINKS = [
    { id: '1', title: 'Watch My Japan Trip Vlog (4K)', type: 'video-embed', clicks: 420, ctr: 43.1 },
    { id: '2', title: 'Cyber Streetwear Hoodie Drop', type: 'product-grid', clicks: 285, ctr: 29.2 },
    { id: '3', title: 'Follow on Instagram (@alexmorgan)', type: 'social-bar', clicks: 160, ctr: 16.4 },
    { id: '4', title: 'Join Filmmaking Discord Community', type: 'link-button', clicks: 110, ctr: 11.3 },
  ];

  const MOCK_SUBSCRIBERS = [
    { email: 'sarah.k@designhub.io', date: '2 hours ago', source: 'Email Newsletter Block' },
    { email: 'dev.marcus@gmail.com', date: 'Yesterday', source: 'Preset Pack Drop' },
    { email: 'elena_vlogs@yahoo.com', date: '3 days ago', source: 'Email Newsletter Block' },
    { email: 'creator.jake@outlook.com', date: '5 days ago', source: 'Email Newsletter Block' },
  ];

  const handleExportCsv = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + ["Email,Date,Source", ...MOCK_SUBSCRIBERS.map(s => `"${s.email}","${s.date}","${s.source}"`)].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "suvix_bio_subscribers.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full min-h-screen bg-slate-50 dark:bg-black text-slate-900 dark:text-zinc-100 font-sans select-none pb-16">
      
      {/* ── TOP HEADER BAR ── */}
      <header className="w-full bg-white dark:bg-[#111114] border-b border-slate-200 dark:border-zinc-800 px-4 sm:px-8 py-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          
          {/* Back Navigation & Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/link-in-bio')}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div>
              <h1 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                Link in Bio Analytics
              </h1>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Performance insights, click-through rates, and subscriber leads.
              </p>
            </div>
          </div>

          {/* Time Range Selector & CSV Export */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            {/* Time Filter Pills */}
            <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-semibold">
              {(['7d', '30d', '90d', 'all'] as TimeRange[]).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer uppercase text-[11px] ${
                    timeRange === range
                      ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-xs font-bold'
                      : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {range === 'all' ? 'All' : range}
                </button>
              ))}
            </div>

            {/* Export CSV CTA */}
            <button
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Leads</span>
            </button>
          </div>

        </div>
      </header>

      {/* ── MAIN CONTENT CONTAINER ── */}
      <main className="max-w-6xl mx-auto px-4 sm:px-8 pt-6 space-y-6">
        
        {/* ── 1. METRICS OVERVIEW CARDS (4 GRIDS) ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label="Total Profile Views"
            value="3,370"
            delta="+18.4%"
            isPositive={true}
            icon={Eye}
            iconBg="bg-sky-500/10"
            iconColor="text-sky-500"
          />

          <MetricCard
            label="Total Link Clicks"
            value="975"
            delta="+24.1%"
            isPositive={true}
            icon={MousePointerClick}
            iconBg="bg-emerald-500/10"
            iconColor="text-emerald-500"
          />

          <MetricCard
            label="Click-Through Rate (CTR)"
            value="28.9%"
            delta="+3.2%"
            isPositive={true}
            icon={TrendingUp}
            iconBg="bg-purple-500/10"
            iconColor="text-purple-500"
          />

          <MetricCard
            label="Email Subscribers"
            value="142"
            delta="+12 new"
            isPositive={true}
            icon={Users}
            iconBg="bg-amber-500/10"
            iconColor="text-amber-500"
          />
        </div>

        {/* ── 2. TRAFFIC OVER TIME CHART ── */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Daily Views vs Clicks
              </h3>
              <p className="text-xs text-slate-400 dark:text-zinc-500">
                Comparison of page impressions and interactive engagements over the last {timeRange}.
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                <span className="text-slate-600 dark:text-zinc-300">Views</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-slate-600 dark:text-zinc-300">Clicks</span>
              </div>
            </div>
          </div>

          {/* Simple High-FPS SVG Visual Bar Chart */}
          <div className="h-44 w-full flex items-end justify-between gap-2 pt-6 pb-2 px-1">
            {[45, 62, 58, 80, 72, 95, 110, 88, 120, 135, 128, 142, 160, 150].map((v, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group">
                <div className="w-full flex items-end justify-center gap-1">
                  {/* Views bar */}
                  <div 
                    style={{ height: `${(v / 160) * 100}%` }}
                    className="w-full max-w-[12px] bg-sky-500/80 group-hover:bg-sky-500 rounded-t-md transition-all"
                  />
                  {/* Clicks bar */}
                  <div 
                    style={{ height: `${((v * 0.3) / 160) * 100}%` }}
                    className="w-full max-w-[12px] bg-emerald-500/80 group-hover:bg-emerald-500 rounded-t-md transition-all"
                  />
                </div>
                <span className="text-[9px] font-mono text-slate-400 dark:text-zinc-500 hidden sm:block">
                  {i + 1}d
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── 3. 2-COLUMN SPLIT: Top Links & Audience Breakdown ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Sub-Column (7 cols): Top Performing Links */}
          <div className="lg:col-span-7 p-5 rounded-2xl bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
              Top Performing Links & Blocks
            </h3>
            <p className="text-xs text-slate-400 dark:text-zinc-500 mb-4">
              Ranked by total click count and engagement percentage.
            </p>

            <div className="space-y-3">
              {MOCK_TOP_LINKS.map((link, idx) => (
                <div 
                  key={link.id}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200/80 dark:border-zinc-800 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs font-mono font-bold text-slate-400 dark:text-zinc-600 w-4">
                      #{idx + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {link.title}
                      </p>
                      <span className="text-[10px] font-mono uppercase text-slate-400 dark:text-zinc-500">
                        {link.type.replace('-', ' ')}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {link.clicks} clicks
                    </span>
                    <p className="text-[10.5px] font-semibold text-emerald-600 dark:text-emerald-400">
                      {link.ctr}% CTR
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Sub-Column (5 cols): Device & Referrer Breakdown */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Device Demographics */}
            <div className="p-5 rounded-2xl bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
                Device Demographics
              </h3>

              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                    <span className="flex items-center gap-1.5">
                      <Smartphone className="w-3.5 h-3.5 text-sky-500" />
                      <span>Mobile</span>
                    </span>
                    <span>78%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
                    <div className="h-full bg-sky-500 rounded-full" style={{ width: '78%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                    <span className="flex items-center gap-1.5">
                      <Monitor className="w-3.5 h-3.5 text-purple-500" />
                      <span>Desktop</span>
                    </span>
                    <span>18%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
                    <div className="h-full bg-purple-500 rounded-full" style={{ width: '18%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                    <span className="flex items-center gap-1.5">
                      <Tablet className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Tablet</span>
                    </span>
                    <span>4%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: '4%' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Top Traffic Referrers */}
            <div className="p-5 rounded-2xl bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
                Top Traffic Referrers
              </h3>

              <div className="space-y-2 text-xs">
                {[
                  { name: 'Instagram', percent: '44%' },
                  { name: 'YouTube', percent: '28%' },
                  { name: 'TikTok', percent: '16%' },
                  { name: 'Direct / QR', percent: '8%' },
                  { name: 'WhatsApp', percent: '4%' },
                ].map((ref, idx) => (
                  <div key={idx} className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-zinc-800/60 last:border-none">
                    <span className="font-semibold text-slate-700 dark:text-zinc-300">
                      {ref.name}
                    </span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      {ref.percent}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

        {/* ── 4. EMAIL NEWSLETTER SUBSCRIBERS TABLE ── */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500">
                <Mail className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Captured Email Leads ({MOCK_SUBSCRIBERS.length})
              </h3>
            </div>

            <button
              onClick={handleExportCsv}
              className="text-xs font-semibold text-sky-500 hover:text-sky-600 transition-colors cursor-pointer"
            >
              Download Full CSV
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-zinc-800 text-slate-400 dark:text-zinc-500 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-3">Subscriber Email</th>
                  <th className="py-2.5 px-3">Source Block</th>
                  <th className="py-2.5 px-3 text-right">Captured</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
                {MOCK_SUBSCRIBERS.map((sub, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/30">
                    <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">
                      {sub.email}
                    </td>
                    <td className="py-3 px-3 text-slate-500 dark:text-zinc-400">
                      {sub.source}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-400 dark:text-zinc-500">
                      {sub.date}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
};

export default BioAnalyticsPage;
