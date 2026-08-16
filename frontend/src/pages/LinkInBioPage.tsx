import React, { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { selectUser } from '../store/slices/authSlice';
import { useTheme } from '../hooks/useTheme';
import defaultProfile from '../assets/defaultprofile.png';
import { templateRegistry } from './link-in-bio/templates.tsx';
import type { TemplateKey, ResolvedTheme, LinkBlock } from './link-in-bio/templates.tsx';
import { 
  Link as LinkIcon, Eye, Globe, Share2, TrendingUp, BarChart3, 
  Youtube, Instagram, Sparkles, Check, ArrowRight, ExternalLink, Edit2
} from 'lucide-react';

export default function LinkInBioPage() {
  const user = useSelector(selectUser);
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();

  // State Management for Saved Configuration
  const [isCreated, setIsCreated] = useState(false);
  const [displayName, setDisplayName] = useState(user?.name || 'Your Name');
  const [bio, setBio] = useState('Professional Creator · Welcome to my hub! 🚀');
  const [templateKey, setTemplateKey] = useState<TemplateKey>('minimal-v1');
  const [themeSettings, setThemeSettings] = useState<ResolvedTheme>({
    primaryColor: '#ffffff',
    secondaryColor: '#6366f1',
    backgroundColor: '#09090b',
    textColor: '#09090b',
    fontFamily: 'Inter',
    borderRadius: 12,
    spacing: 12,
    shadowIntensity: 1,
    backgroundType: 'gradient',
    backgroundValue: 'linear-gradient(to bottom right, #4facfe 0%, #00f2fe 100%)'
  });
  const [links, setLinks] = useState<LinkBlock[]>([]);
  const [copied, setCopied] = useState(false);

  // Load existing configuration from localStorage
  useEffect(() => {
    const savedConfig = localStorage.getItem(`suvix_link_in_bio_config_${user?.id}`);
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        setIsCreated(parsed.isCreated || false);
        setDisplayName(parsed.displayName || user?.name || 'Your Name');
        setBio(parsed.bio || '');
        if (parsed.templateKey) setTemplateKey(parsed.templateKey);
        if (parsed.themeSettings) {
          setThemeSettings({
            ...themeSettings,
            ...parsed.themeSettings
          });
        }
        setLinks(parsed.links || []);
      } catch (e) {
        console.error('Failed to parse link-in-bio config', e);
      }
    }
  }, [user]);

  // Simulated Analytics Data
  const analyticsData = {
    views: 1482,
    clicks: 694,
    ctr: '46.8%',
    chart: [
      { day: 'Mon', views: 120, clicks: 55 },
      { day: 'Tue', views: 180, clicks: 82 },
      { day: 'Wed', views: 160, clicks: 75 },
      { day: 'Thu', views: 220, clicks: 104 },
      { day: 'Fri', views: 240, clicks: 112 },
      { day: 'Sat', views: 310, clicks: 145 },
      { day: 'Sun', views: 252, clicks: 121 }
    ]
  };

  const handleCopyLink = () => {
    const publicUrl = `${window.location.origin}/${user?.username || 'user'}`;
    navigator.clipboard.writeText(publicUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleViewLive = () => {
    window.open(`/${user?.username || 'user'}`, '_blank');
  };

  // Dynamic CSS variables and backdrop styling for mockup
  const inlineCssVars = useMemo(() => {
    const fontMapping = (font: string) => {
      switch (font) {
        case 'Playfair Display': return '"Playfair Display", serif';
        case 'JetBrains Mono': return '"JetBrains Mono", monospace';
        case 'Poppins': return '"Poppins", sans-serif';
        default: return '"Inter", sans-serif';
      }
    };

    return {
      '--pp-primary': themeSettings.primaryColor,
      '--pp-secondary': themeSettings.secondaryColor,
      '--pp-bg': themeSettings.backgroundType === 'solid' ? themeSettings.backgroundColor : 'transparent',
      '--pp-text': themeSettings.textColor,
      '--pp-font': fontMapping(themeSettings.fontFamily),
      '--pp-radius': `${themeSettings.borderRadius}px`,
      '--pp-spacing': `${themeSettings.spacing}px`
    } as React.CSSProperties;
  }, [themeSettings]);

  const mockupBackgroundStyle = useMemo(() => {
    const style: React.CSSProperties = {};
    if (themeSettings.backgroundType === 'solid') {
      style.backgroundColor = themeSettings.backgroundColor;
    } else if (themeSettings.backgroundType === 'gradient') {
      style.backgroundImage = themeSettings.backgroundValue;
    } else if (themeSettings.backgroundType === 'image') {
      style.backgroundImage = `url(${themeSettings.backgroundValue})`;
      style.backgroundSize = 'cover';
      style.backgroundPosition = 'center';
    }
    return style;
  }, [themeSettings]);

  const SelectedTemplateComponent = templateRegistry[templateKey] || templateRegistry['minimal-v1'];

  return (
    <div className="w-full h-full flex flex-col gap-6 select-none p-6 max-w-6xl mx-auto overflow-hidden">
      
      {/* ── Header Area ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border-main/50 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-main">
            Link in Bio Hub
          </h1>
          <p className="text-xs text-text-muted mt-1 font-semibold">
            Manage your personal creator bio-link and view landing analytics.
          </p>
        </div>
        
        {isCreated && (
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button 
              onClick={handleCopyLink}
              className={`
                flex-1 sm:flex-none h-10 px-4 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-all active:scale-[0.98] border cursor-pointer
                ${isDarkMode 
                  ? 'bg-zinc-900 border-zinc-800 text-zinc-100 hover:bg-zinc-800' 
                  : 'bg-white border-zinc-200 text-zinc-800 hover:bg-zinc-50 shadow-sm'}
              `}
            >
              {copied ? <Check size={14} className="text-emerald-500" /> : <Share2 size={14} />}
              {copied ? 'Link Copied!' : 'Copy Link'}
            </button>
            <button 
              onClick={handleViewLive}
              className={`
                flex-1 sm:flex-none h-10 px-4 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-all active:scale-[0.98] cursor-pointer
                ${isDarkMode ? 'bg-white text-black hover:bg-zinc-200' : 'bg-zinc-950 text-white hover:bg-zinc-900'}
              `}
            >
              <ExternalLink size={14} />
              View Live
            </button>
          </div>
        )}
      </div>

      {/* ── Render State Checks ── */}
      {!isCreated ? (
        /* ── EMPTY / ONBOARDING STATE ── */
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center overflow-hidden min-h-0 py-6">
          <div className="lg:col-span-7 h-full overflow-y-auto pr-2 scrollbar-hide space-y-6 py-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 text-[10px] font-semibold uppercase tracking-wider">
              <Sparkles size={11} />
              <span>Free Feature</span>
            </div>
            
            <div className="space-y-3">
              <h2 className="text-3xl font-bold tracking-tight leading-tight text-text-main">
                Design your public creator profile (Link in Bio)
              </h2>
              <p className="text-sm leading-relaxed text-text-muted">
                Consolidate your social channels, personal website, custom blogs, and latest content into one beautifully customized, shareable landing page that captures leads, subscribers, and sponsors.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-zinc-950/40 border-border-main/60' : 'bg-zinc-50 border-zinc-200/80'} space-y-2`}>
                <h4 className="text-xs font-bold text-text-main">🎨 Customizable Themes</h4>
                <p className="text-[11px] text-text-muted leading-relaxed font-semibold">Choose from preset premium themes, matching your profile aesthetic perfectly.</p>
              </div>
              <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-zinc-950/40 border-border-main/60' : 'bg-zinc-50 border-zinc-200/80'} space-y-2`}>
                <h4 className="text-xs font-bold text-text-main">📈 Fast Analytics</h4>
                <p className="text-[11px] text-text-muted leading-relaxed font-semibold">Track page views, click-through rates, and block analytics in real-time.</p>
              </div>
            </div>

            <button
              onClick={() => navigate(`/link-in-bio/design/${user?.id || 'default'}`)}
              className={`
                w-full sm:w-auto h-12 px-8 rounded-xl flex items-center justify-center gap-2 text-xs font-semibold tracking-wide transition-all active:scale-[0.97] cursor-pointer shadow-lg shadow-indigo-500/10
                bg-indigo-600 text-white hover:bg-indigo-500 hover:shadow-indigo-500/20
              `}
            >
              <span>Design Your Link in Bio</span>
              <ArrowRight size={14} />
            </button>
          </div>

          <div className="lg:col-span-5 flex flex-col items-center justify-center">
            {/* Blank Placeholder Phone Mockup */}
            <div 
              className={`
                w-[280px] h-[520px] rounded-[40px] border-[8px] border-zinc-900 dark:border-zinc-800 
                overflow-hidden relative shadow-2xl flex flex-col bg-zinc-100 dark:bg-zinc-950/80 items-center justify-center text-center p-6
              `}
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-5 bg-zinc-900 dark:bg-zinc-800 rounded-b-2xl z-50" />
              
              <div className="flex flex-col items-center gap-4">
                <div className={`w-16 h-16 rounded-full border-4 border-dashed border-zinc-300 dark:border-zinc-700 flex items-center justify-center`}>
                  <LinkIcon size={24} className="text-zinc-400" />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-text-main mb-1">Your Page Preview</h5>
                  <p className="text-[10px] text-text-muted max-w-[180px] leading-relaxed font-semibold">Start designing to see a live visualization of your public page.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ── CREATED / LIVE DASHBOARD STATE ── */
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 overflow-hidden min-h-0">
          
          {/* Left Column: Analytics & Quick Edit Control */}
          <div className="lg:col-span-7 h-full overflow-y-auto pr-2 scrollbar-hide space-y-6 py-2">
            
            {/* Stat Cards */}
            <div className="grid grid-cols-3 gap-4">
              <div className={`p-4 rounded-[24px] border ${isDarkMode ? 'bg-zinc-950 border-border-main' : 'bg-white border-zinc-200 shadow-sm'} text-center`}>
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Page Views</p>
                <p className="text-xl font-bold text-text-main mt-1">{analyticsData.views}</p>
                <span className="text-[9px] font-bold text-emerald-500 mt-0.5 block">+12.4%</span>
              </div>
              <div className={`p-4 rounded-[24px] border ${isDarkMode ? 'bg-zinc-950 border-border-main' : 'bg-white border-zinc-200 shadow-sm'} text-center`}>
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Clicks</p>
                <p className="text-xl font-bold text-text-main mt-1">{analyticsData.clicks}</p>
                <span className="text-[9px] font-bold text-emerald-500 mt-0.5 block">+8.2%</span>
              </div>
              <div className={`p-4 rounded-[24px] border ${isDarkMode ? 'bg-zinc-950 border-border-main' : 'bg-white border-zinc-200 shadow-sm'} text-center`}>
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">CTR</p>
                <p className="text-xl font-bold text-text-main mt-1">{analyticsData.ctr}</p>
                <span className="text-[9px] font-bold text-emerald-500 mt-0.5 block">Good</span>
              </div>
            </div>

            {/* Custom SVG Trend Chart */}
            <div className={`p-6 rounded-[28px] border ${isDarkMode ? 'bg-black border-border-main' : 'bg-white border-zinc-200 shadow-sm'} space-y-4`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-text-muted uppercase tracking-wider">
                  <TrendingUp size={12} />
                  <span>Performance Trend</span>
                </div>
                <div className="flex items-center gap-3 text-[10px] font-semibold text-text-muted">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-violet-500" /> Views</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-emerald-500" /> Clicks</span>
                </div>
              </div>

              <div className="relative w-full h-[140px] mt-2">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <line x1="0" y1="20" x2="100" y2="20" stroke={isDarkMode ? '#27272a' : '#f4f4f5'} strokeWidth="0.5" />
                  <line x1="0" y1="50" x2="100" y2="50" stroke={isDarkMode ? '#27272a' : '#f4f4f5'} strokeWidth="0.5" />
                  <line x1="0" y1="80" x2="100" y2="80" stroke={isDarkMode ? '#27272a' : '#f4f4f5'} strokeWidth="0.5" />
                  <path
                    d="M 0 90 L 0 78 L 16.6 66 L 33.3 70 L 50 58 L 66.6 54 L 83.3 40 L 100 52 L 100 90 Z"
                    fill="url(#v-grad)"
                    opacity="0.15"
                  />
                  <path
                    d="M 0 78 L 16.6 66 L 33.3 70 L 50 58 L 66.6 54 L 83.3 40 L 100 52"
                    fill="none"
                    stroke="#8b5cf6"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  <path
                    d="M 0 90 L 0 85 L 16.6 79 L 33.3 81 L 50 75 L 66.6 73 L 83.3 66 L 100 71 L 100 90 Z"
                    fill="url(#c-grad)"
                    opacity="0.15"
                  />
                  <path
                    d="M 0 85 L 16.6 79 L 33.3 81 L 50 75 L 66.6 73 L 83.3 66 L 100 71"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <defs>
                    <linearGradient id="v-grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8b5cf6" />
                      <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id="c-grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>

              <div className="flex justify-between text-[9px] font-bold text-text-muted px-1">
                {analyticsData.chart.map(item => (
                  <span key={item.day}>{item.day}</span>
                ))}
              </div>
            </div>

            {/* Quick Edit Design Call-to-action */}
            <div className={`p-6 rounded-[28px] border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
              isDarkMode ? 'bg-zinc-950 border-border-main' : 'bg-zinc-50 border-zinc-200'
            }`}>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-text-main">Want to edit your landing page?</h4>
                <p className="text-[11px] text-text-muted leading-relaxed font-semibold">Update display settings, add links, or change preset layouts.</p>
              </div>
              <button
                onClick={() => navigate(`/link-in-bio/design/${user?.id || 'default'}`)}
                className={`
                  w-full sm:w-auto h-10 px-6 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-all active:scale-[0.98] cursor-pointer
                  ${isDarkMode ? 'bg-zinc-900 border border-zinc-800 text-white hover:bg-zinc-800' : 'bg-white border border-zinc-200 text-zinc-900 hover:bg-zinc-100'}
                `}
              >
                <Edit2 size={13} />
                Edit Profile Design
              </button>
            </div>

          </div>

          {/* Right Column: Mini Phone Preview */}
          <div className="lg:col-span-5 h-full flex flex-col items-center justify-center">
            <div className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3 select-none flex items-center gap-1.5">
              <Eye size={12} />
              <span>Current Bio Page Preview</span>
            </div>
            
            {/* Phone Mockup Frame */}
            <div 
              className="w-[280px] h-[540px] rounded-[40px] border-[8px] border-zinc-900 dark:border-zinc-800 overflow-hidden relative shadow-2xl flex flex-col transition-all duration-300"
              style={mockupBackgroundStyle}
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-5 bg-zinc-900 dark:bg-zinc-800 rounded-b-2xl z-50 flex items-center justify-center">
                <div className="w-10 h-1 bg-black/40 rounded-full mb-1" />
              </div>

              {/* Injected CSS Variables wrapper */}
              <div style={inlineCssVars} className="w-full h-full flex flex-col overflow-y-auto scrollbar-hide pt-10">
                <SelectedTemplateComponent
                  profile={{
                    displayName,
                    bio,
                    profileImageUrl: user?.profilePicture || null,
                    username: user?.username || 'username',
                    isVerified: user?.is_verified
                  }}
                  blocks={links}
                  theme={themeSettings}
                />

                <div className="mt-auto pb-4 flex items-center justify-center gap-1 opacity-60 select-none text-text-main">
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                  </svg>
                  <span className="text-[8px] font-bold uppercase tracking-wider">SuviX</span>
                </div>
              </div>

            </div>
          </div>

        </div>
      )}

    </div>
  );
}
