import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  RotateCw, 
  ChevronRight, 
  ArrowRight, 
  BarChart3, 
  Compass, 
  Bot, 
  X, 
  Loader2,
  CheckCircle2,
  Lightbulb
} from 'lucide-react';
import asksuvixBg from '../../assets/asksuvixbg.png';
import asksuvixWhiteBg from '../../assets/asksuvixwhitebg.png';
import officialLogo from '../../assets/officiallogo.png';
import { useAskSuvix } from '../../context/AskSuvixContext';
import { useTheme } from '../../hooks/useTheme';

interface SuggestionItem {
  id: string;
  text: string;
  category: 'Ask' | 'Analyze' | 'Discover';
  mockAnswer: {
    title: string;
    summary: string;
    metrics?: { label: string; value: string; change?: string }[];
    actionTips?: string[];
  };
}

const TAB_SUGGESTIONS: Record<'Ask' | 'Analyze' | 'Discover', SuggestionItem[][]> = {
  Ask: [
    [
      {
        id: 'ask-1',
        text: 'How is my content performing?',
        category: 'Ask',
        mockAnswer: {
          title: 'Content Performance Analysis',
          summary: 'Your overall engagement increased by +18.4% this week. Short-form Reels are driving 68% of new follower discoveries.',
          metrics: [
            { label: 'Avg. Retention', value: '42.6s', change: '+12%' },
            { label: 'Profile Views', value: '3,840', change: '+24%' },
            { label: 'Save Rate', value: '6.2%', change: '+5.1%' }
          ],
          actionTips: [
            'Post your next video on Wednesday around 6:30 PM for peak reach.',
            'Hook duration in first 3 seconds has increased retention by 1.8x.'
          ]
        }
      },
      {
        id: 'ask-2',
        text: 'Show brand opportunities for me',
        category: 'Ask',
        mockAnswer: {
          title: 'Curated Brand Opportunities',
          summary: 'We found 3 high-affinity brand campaigns matching your tech & design creator profile on SuviX.',
          metrics: [
            { label: 'Match Rate', value: '94%' },
            { label: 'Est. Budget', value: '$850 - $1,500' },
            { label: 'Active Deals', value: '3 Open' }
          ],
          actionTips: [
            '1 sponsor is actively looking for a dedicated Link in Bio integration.',
            'Connect your Instagram media kit to automatically submit proposals.'
          ]
        }
      },
      {
        id: 'ask-3',
        text: 'Suggest ideas to grow my audience',
        category: 'Ask',
        mockAnswer: {
          title: 'Audience Growth Strategies',
          summary: 'Leverage carousel break-downs of your latest UI workflows and collaborate with lifestyle creators.',
          metrics: [
            { label: 'Potential Reach', value: '+15.2K' },
            { label: 'Optimal Format', value: 'Reels + Bio Link' }
          ],
          actionTips: [
            'Add a free downloadable resource link to your SuviX Bio.',
            'Run a weekly community poll to boost algorithmic visibility.'
          ]
        }
      }
    ],
    [
      {
        id: 'ask-4',
        text: 'What is my highest earning channel?',
        category: 'Ask',
        mockAnswer: {
          title: 'Channel Revenue Breakdown',
          summary: 'Brand sponsorships generated 62% of your monthly gross, followed by Bio Link digital downloads at 26%.',
          metrics: [
            { label: 'Sponsorships', value: '$1,240' },
            { label: 'Bio Store', value: '$520' },
            { label: 'Ad Revenue', value: '$240' }
          ],
          actionTips: [
            'Feature your top-converting digital asset as a featured card in your bio.'
          ]
        }
      },
      {
        id: 'ask-5',
        text: 'Which hashtags are driving top reach?',
        category: 'Ask',
        mockAnswer: {
          title: 'Top Hashtag Performance',
          summary: '#BuildInPublic, #UIDesign, and #CreatorEconomy generated 4.8x more non-follower impressions.',
          actionTips: [
            'Combine 3 niche tags with 2 broad community tags for optimal discovery.'
          ]
        }
      },
      {
        id: 'ask-6',
        text: 'How can I optimize my Link in Bio?',
        category: 'Ask',
        mockAnswer: {
          title: 'Link in Bio Optimization',
          summary: 'Your top CTA card has a 24.3% click-through rate. Moving your portfolio to slot 1 will capture 30% more clicks.',
          actionTips: [
            'Enable the animated glowing border on your primary lead magnet link.'
          ]
        }
      }
    ]
  ],
  Analyze: [
    [
      {
        id: 'ana-1',
        text: 'Analyze my latest post & reel metrics',
        category: 'Analyze',
        mockAnswer: {
          title: 'Recent Media Engagement',
          summary: 'Your latest reel outperformed 85% of previous uploads in the first 24 hours.',
          metrics: [
            { label: 'Impressions', value: '14.2K' },
            { label: 'Shares', value: '312' },
            { label: 'Watch Time', value: '184 hrs' }
          ],
          actionTips: [
            'Repost the key takeaway as a text quote on your feed to recycle momentum.'
          ]
        }
      },
      {
        id: 'ana-2',
        text: 'Break down my audience demographics',
        category: 'Analyze',
        mockAnswer: {
          title: 'Audience Demographics',
          summary: 'Your primary audience is 21-34 years old (72%), concentrated in US, UK, and India.',
          metrics: [
            { label: 'Top Geo', value: 'US (41%)' },
            { label: 'Age Group', value: '24-34 (58%)' },
            { label: 'Active Hours', value: '5-9 PM EST' }
          ]
        }
      },
      {
        id: 'ana-3',
        text: 'Compare earnings with top creators',
        category: 'Analyze',
        mockAnswer: {
          title: 'Creator Benchmark Insights',
          summary: 'Your RPM is 18% higher than median creators in the Design & Tech category.',
          metrics: [
            { label: 'Your RPM', value: '$8.40' },
            { label: 'Niche Avg', value: '$7.10' }
          ]
        }
      }
    ],
    [
      {
        id: 'ana-4',
        text: 'Track my weekly follower conversion',
        category: 'Analyze',
        mockAnswer: {
          title: 'Follower Conversion Rate',
          summary: 'You converted 4.2% of profile visitors into followers this past week.',
          metrics: [
            { label: 'Visitors', value: '1,920' },
            { label: 'New Followers', value: '+81' }
          ]
        }
      },
      {
        id: 'ana-5',
        text: 'Evaluate my sponsor deal rates',
        category: 'Analyze',
        mockAnswer: {
          title: 'Sponsorship Rate Health',
          summary: 'Your average rate per sponsored reel is currently priced 15% below market ceiling for your engagement level.',
          actionTips: [
            'You can comfortably negotiate between $600-$900 for integrated video segments.'
          ]
        }
      },
      {
        id: 'ana-6',
        text: 'Analyze viewer retention drop-off',
        category: 'Analyze',
        mockAnswer: {
          title: 'Viewer Retention Curve',
          summary: 'Retention stays strong (88%) until second 18, where a brief dip occurs during transitions.',
          actionTips: [
            'Use faster b-roll cuts at the 15-second mark to maintain pace.'
          ]
        }
      }
    ]
  ],
  Discover: [
    [
      {
        id: 'disc-1',
        text: 'Discover trending audio & viral topics',
        category: 'Discover',
        mockAnswer: {
          title: 'Trending Creator Topics',
          summary: 'AI productivity tools, minimalist desk setups, and UI design breakdowns are trending +140% this week.',
          actionTips: [
            'Audio "Midnight Echo" is accelerating on short-form feeds (+320k uses).'
          ]
        }
      },
      {
        id: 'disc-2',
        text: 'Find highest paying brand sponsorships',
        category: 'Discover',
        mockAnswer: {
          title: 'High-Paying Niche Sponsorships',
          summary: 'SaaS design tools and creator hardware brands currently offer the highest average payouts per campaign.',
          actionTips: [
            'Browse the SuviX Brand Marketplace to apply with 1-click verified credentials.'
          ]
        }
      },
      {
        id: 'disc-3',
        text: 'Explore fast-growing creator niches',
        category: 'Discover',
        mockAnswer: {
          title: 'High Growth Niches',
          summary: 'Design engineering, solo founder vlogs, and AI workflow tutorials have the lowest saturation and highest CPMs.'
        }
      }
    ],
    [
      {
        id: 'disc-4',
        text: 'Discover top creator collaboration matches',
        category: 'Discover',
        mockAnswer: {
          title: 'Creator Matchmaking',
          summary: 'Found 4 creators in your city with complementary audiences (10k-50k followers) for cross-promotion.'
        }
      },
      {
        id: 'disc-5',
        text: 'Find viral video format templates',
        category: 'Discover',
        mockAnswer: {
          title: 'Trending Formats',
          summary: '"Before vs After workflow overhaul" formats are generating 3.4x average saves.'
        }
      },
      {
        id: 'disc-6',
        text: 'Explore affiliate products with high payout',
        category: 'Discover',
        mockAnswer: {
          title: 'Top Affiliate Opportunities',
          summary: 'Software subscriptions with 30% recurring monthly commissions are yielding top revenue for creators like you.'
        }
      }
    ]
  ]
};

export const AskSuvixCard: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [activeTab, setActiveTab] = useState<'Ask' | 'Analyze' | 'Discover'>('Ask');
  const { openAskSuvix } = useAskSuvix();
  const { isDarkMode } = useTheme();
  const [query, setQuery] = useState('');
  const [suggestionSetIdx, setSuggestionSetIdx] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeResponse, setActiveResponse] = useState<SuggestionItem['mockAnswer'] | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  const [currentPromptTitle, setCurrentPromptTitle] = useState('');

  const currentSuggestionSets = TAB_SUGGESTIONS[activeTab] || TAB_SUGGESTIONS.Ask;
  const currentSuggestions = currentSuggestionSets[suggestionSetIdx % currentSuggestionSets.length];

  const handleRefreshSuggestions = () => {
    setIsRefreshing(true);
    setSuggestionSetIdx((prev) => prev + 1);
    setTimeout(() => setIsRefreshing(false), 350);
  };

  const handleSelectSuggestion = (item: SuggestionItem) => {
    setCurrentPromptTitle(item.text);
    openAskSuvix(item.text);
  };

  const handleCustomSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = query.trim();
    if (trimmed) {
      openAskSuvix(trimmed);
      setQuery('');
    } else {
      openAskSuvix(currentSuggestions[0]?.text || 'Show my content performance');
    }
  };

  return (
    <div 
      className={`relative w-full rounded-[22px] sm:rounded-[24px] overflow-hidden select-none transition-all duration-300 ${
        isDarkMode 
          ? 'bg-[#090A0F] border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.36)] text-white' 
          : 'bg-[#F8F9FD] border border-zinc-200/80 shadow-[0_6px_24px_rgba(0,0,0,0.08)] text-zinc-900'
      } ${className}`}
    >
      {/* 1. Authentic Glow Background Asset (Dark: asksuvixbg.png | Light: asksuvixwhitebg.png) */}
      <img
        src={isDarkMode ? asksuvixBg : asksuvixWhiteBg}
        alt="Ask SuviX Background"
        className={`absolute inset-0 w-full h-full object-cover object-bottom pointer-events-none transition-opacity duration-300 ${
          isDarkMode ? 'opacity-90' : 'opacity-95'
        }`}
      />

      {/* Subtle Black Overlay on background image in both Dark & Light modes */}
      <div 
        aria-hidden="true" 
        className={`absolute inset-0 pointer-events-none transition-all duration-300 ${
          isDarkMode 
            ? 'bg-gradient-to-b from-black/80 via-black/40 to-transparent' 
            : 'bg-black/15 bg-gradient-to-b from-black/25 via-black/10 to-transparent'
        }`} 
      />

      {/* 2. Main Card Content */}
      <div className="relative z-10 p-3.5 sm:p-4 flex flex-col gap-3">
        
        {/* ── Top Header Row ────────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Circular Official SuviX Logo */}
            <div className={`w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-full overflow-hidden flex items-center justify-center shrink-0 shadow-md ${
              isDarkMode ? 'border border-white/15 bg-white' : 'border border-black/10 bg-white'
            }`}>
              <img 
                src={officialLogo} 
                alt="SuviX" 
                className="w-full h-full object-cover" 
              />
            </div>

            {/* Title & Tagline */}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 leading-none">
                <h3 className={`text-[14px] sm:text-[15px] font-semibold tracking-tight leading-none ${
                  isDarkMode ? 'text-white' : 'text-zinc-950'
                }`}>
                  Ask SuviX
                </h3>
                <span className="px-1.5 py-0.5 rounded-[4.5px] bg-[#8B5CF6] text-white text-[8px] sm:text-[8.5px] font-semibold uppercase tracking-wider leading-none shadow-xs">
                  BETA
                </span>
              </div>
              <p className={`text-[9.5px] sm:text-[10px] font-normal leading-tight mt-1 truncate ${
                isDarkMode ? 'text-zinc-400' : 'text-zinc-500'
              }`}>
                Your data. Your insights. Your growth.
              </p>
            </div>
          </div>

          {/* Glowing 4-Point Star / Sparkle Header Icon */}
          <div className={`shrink-0 pr-0.5 ${
            isDarkMode ? 'text-white/90 drop-shadow-[0_0_8px_rgba(255,255,255,0.85)]' : 'text-purple-600 drop-shadow-[0_0_6px_rgba(147,51,234,0.35)]'
          }`}>
            <svg 
              className="w-4 h-4 sm:w-4.5 sm:h-4.5 animate-pulse" 
              viewBox="0 0 24 24" 
              fill="currentColor"
            >
              <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
            </svg>
          </div>
        </div>

        {/* ── Tab Switcher: [Ask] [Analyze] [Discover] ──────────────── */}
        <div className="grid grid-cols-3 gap-1.5 pt-0.5">
          {/* 1. Ask Tab */}
          <button
            type="button"
            onClick={() => setActiveTab('Ask')}
            className={`py-1.5 px-2 rounded-full text-[10.5px] sm:text-[11px] flex items-center justify-center gap-1.5 font-medium transition-all cursor-pointer ${
              activeTab === 'Ask'
                ? isDarkMode ? 'bg-white text-zinc-950 shadow-sm' : 'bg-zinc-950 text-white shadow-sm'
                : isDarkMode 
                  ? 'bg-white/10 hover:bg-white/15 text-zinc-300 hover:text-white border border-white/5' 
                  : 'bg-black/5 hover:bg-black/10 text-zinc-600 hover:text-zinc-950 border border-black/5'
            }`}
          >
            <Bot size={12} strokeWidth={2} />
            <span>Ask</span>
          </button>

          {/* 2. Analyze Tab */}
          <button
            type="button"
            onClick={() => setActiveTab('Analyze')}
            className={`py-1.5 px-2 rounded-full text-[10.5px] sm:text-[11px] flex items-center justify-center gap-1.5 font-medium transition-all cursor-pointer ${
              activeTab === 'Analyze'
                ? isDarkMode ? 'bg-white text-zinc-950 shadow-sm' : 'bg-zinc-950 text-white shadow-sm'
                : isDarkMode 
                  ? 'bg-white/10 hover:bg-white/15 text-zinc-300 hover:text-white border border-white/5' 
                  : 'bg-black/5 hover:bg-black/10 text-zinc-600 hover:text-zinc-950 border border-black/5'
            }`}
          >
            <BarChart3 size={12} strokeWidth={2} />
            <span>Analyze</span>
          </button>

          {/* 3. Discover Tab */}
          <button
            type="button"
            onClick={() => setActiveTab('Discover')}
            className={`py-1.5 px-2 rounded-full text-[10.5px] sm:text-[11px] flex items-center justify-center gap-1.5 font-medium transition-all cursor-pointer ${
              activeTab === 'Discover'
                ? isDarkMode ? 'bg-white text-zinc-950 shadow-sm' : 'bg-zinc-950 text-white shadow-sm'
                : isDarkMode 
                  ? 'bg-white/10 hover:bg-white/15 text-zinc-300 hover:text-white border border-white/5' 
                  : 'bg-black/5 hover:bg-black/10 text-zinc-600 hover:text-zinc-950 border border-black/5'
            }`}
          >
            <Compass size={12} strokeWidth={2} />
            <span>Discover</span>
          </button>
        </div>

        {/* ── Search / Prompt Input Box ────────────────────────────── */}
        <form 
          onSubmit={handleCustomSubmit}
          className={`relative w-full rounded-[16px] sm:rounded-[18px] transition-all p-1 pl-3 sm:pl-3.5 flex items-center gap-2 backdrop-blur-md shadow-inner ${
            isDarkMode 
              ? 'bg-[#12141C]/90 border border-white/15 hover:border-white/25 focus-within:border-purple-400/80 text-white' 
              : 'bg-white/90 border border-black/10 hover:border-black/20 focus-within:border-purple-600/80 text-zinc-900 shadow-xs'
          }`}
        >
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              activeTab === 'Analyze'
                ? 'Analyze engagement, earnings, views...'
                : activeTab === 'Discover'
                ? 'Discover topics, trending audio, brands...'
                : 'Ask anything about your content, opportunities...'
            }
            className={`w-full text-[10.5px] sm:text-[11px] bg-transparent outline-none leading-tight py-1 font-normal ${
              isDarkMode 
                ? 'text-white placeholder:text-zinc-500' 
                : 'text-zinc-900 placeholder:text-zinc-400'
            }`}
          />

          {/* Submit Arrow Button */}
          <button
            type="submit"
            disabled={!query.trim()}
            className={`w-7 h-7 sm:w-7.5 sm:h-7.5 rounded-full flex items-center justify-center shrink-0 transition-all cursor-pointer font-medium ${
              query.trim()
                ? isDarkMode ? 'bg-white text-black shadow-md hover:scale-105 active:scale-95' : 'bg-zinc-950 text-white shadow-md hover:scale-105 active:scale-95'
                : isDarkMode ? 'bg-white/80 text-zinc-800 hover:bg-white' : 'bg-black/10 text-zinc-700 hover:bg-black/15'
            }`}
            aria-label="Submit Prompt"
          >
            <ChevronRight size={15} strokeWidth={2.5} />
          </button>
        </form>

        {/* ── Open Button (Dynamic based on theme, font-semibold) ──────────── */}
        <button
          type="button"
          onClick={() => {
            if (query.trim()) {
              handleCustomSubmit();
            } else {
              handleSelectSuggestion(currentSuggestions[0]);
            }
          }}
          className={`w-full py-2 px-3 rounded-xl sm:rounded-2xl font-semibold text-[11.5px] sm:text-xs tracking-tight shadow-sm hover:shadow transition-all duration-200 flex items-center justify-center gap-1.5 active:scale-[0.99] cursor-pointer ${
            isDarkMode 
              ? 'bg-white hover:bg-zinc-100 text-black' 
              : 'bg-zinc-950 hover:bg-zinc-900 text-white'
          }`}
        >
          <span>Open</span>
          <ArrowRight size={13} strokeWidth={2} />
        </button>

        {/* ── "Try asking" Prompts Section ─────────────────────────── */}
        <div className="space-y-1.5 pt-0.5">
          {/* Header Row with Refresh Button */}
          <div className="flex items-center justify-between px-0.5 select-none">
            <span className={`text-[10.5px] sm:text-[11px] font-medium ${
              isDarkMode ? 'text-zinc-400' : 'text-zinc-500'
            }`}>
              Try asking
            </span>
            <button
              type="button"
              onClick={handleRefreshSuggestions}
              className={`p-1 rounded-md transition-all cursor-pointer ${
                isDarkMode 
                  ? 'text-zinc-400 hover:text-white hover:bg-white/10' 
                  : 'text-zinc-500 hover:text-black hover:bg-black/5'
              }`}
              title="Refresh suggestions"
              aria-label="Refresh suggestions"
            >
              <RotateCw 
                size={12} 
                className={`transition-transform duration-300 ${isRefreshing ? 'rotate-180 text-purple-400' : ''}`} 
              />
            </button>
          </div>

          {/* 3 Prompts List */}
          <div className="flex flex-col gap-1.5">
            <AnimatePresence mode="wait">
              <motion.div
                key={`${activeTab}-${suggestionSetIdx}`}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-1.5"
              >
                {currentSuggestions.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectSuggestion(item)}
                    className={`w-full px-3 py-2 rounded-xl transition-all duration-200 flex items-center justify-between group cursor-pointer text-left active:scale-[0.99] ${
                      isDarkMode 
                        ? 'bg-white/[0.07] hover:bg-white/[0.13] border border-white/5 hover:border-white/15 text-zinc-200 group-hover:text-white shadow-2xs' 
                        : 'bg-white/80 hover:bg-white border border-black/5 hover:border-black/10 text-zinc-700 group-hover:text-zinc-950 shadow-xs'
                    }`}
                  >
                    <span className="text-[10.5px] sm:text-[11px] font-normal truncate pr-2">
                      {item.text}
                    </span>
                    <ArrowRight 
                      size={12} 
                      className={`transition-all shrink-0 ${
                        isDarkMode 
                          ? 'text-zinc-400 group-hover:text-white group-hover:translate-x-0.5' 
                          : 'text-zinc-400 group-hover:text-black group-hover:translate-x-0.5'
                      }`} 
                    />
                  </button>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* ── Footer Branding ───────────────────────────────────────── */}
        <div className="pt-1 flex items-center justify-center select-none">
          <div className={`flex items-center gap-1 text-[9.5px] sm:text-[10px] font-medium tracking-wide drop-shadow-sm ${
            isDarkMode ? 'text-zinc-300/85' : 'text-zinc-600'
          }`}>
            <span>Powered by SuviX AI</span>
            <Sparkles size={9} className="text-purple-400 fill-purple-400/30" />
          </div>
        </div>

      </div>

      {/* ── Interactive AI Response Drawer / Modal ─────────────────── */}
      <AnimatePresence>
        {(isThinking || activeResponse) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.22 }}
            className={`absolute inset-0 z-30 backdrop-blur-xl p-4 flex flex-col justify-between overflow-y-auto scrollbar-hide transition-colors duration-200 ${
              isDarkMode 
                ? 'bg-[#0B0C12]/95 text-white' 
                : 'bg-white/95 text-zinc-900 border border-black/10'
            }`}
          >
            {/* Modal Header */}
            <div className={`flex items-start justify-between gap-2 border-b pb-2.5 ${
              isDarkMode ? 'border-white/10' : 'border-black/10'
            }`}>
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                  <Sparkles size={12} />
                </div>
                <h4 className={`text-[11.5px] font-semibold truncate ${
                  isDarkMode ? 'text-white' : 'text-zinc-950'
                }`}>
                  {currentPromptTitle || 'SuviX AI Insights'}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActiveResponse(null);
                  setIsThinking(false);
                }}
                className={`w-6 h-6 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                  isDarkMode ? 'bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white' : 'bg-black/5 hover:bg-black/10 text-zinc-600 hover:text-zinc-950'
                }`}
                title="Close"
              >
                <X size={13} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="py-3 space-y-3 flex-1">
              {isThinking ? (
                <div className="flex flex-col items-center justify-center h-32 gap-2.5 text-center">
                  <Loader2 size={24} className="text-purple-400 animate-spin" />
                  <p className={`text-[11px] font-medium ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>
                    Analyzing your creator metrics...
                  </p>
                  <p className={`text-[9.5px] font-normal ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
                    Synthesizing recommendations & growth signals
                  </p>
                </div>
              ) : activeResponse ? (
                <div className="space-y-2.5">
                  <p className={`text-[11px] leading-relaxed font-normal ${isDarkMode ? 'text-zinc-300' : 'text-zinc-600'}`}>
                    {activeResponse.summary}
                  </p>

                  {/* Metrics Pills if available */}
                  {activeResponse.metrics && activeResponse.metrics.length > 0 && (
                    <div className="grid grid-cols-2 xs:grid-cols-3 gap-1.5 pt-1">
                      {activeResponse.metrics.map((m, idx) => (
                        <div key={idx} className={`p-2 rounded-xl border flex flex-col ${
                          isDarkMode ? 'bg-white/5 border-white/10' : 'bg-zinc-50 border-zinc-200 shadow-2xs'
                        }`}>
                          <span className={`text-[8.5px] font-normal uppercase ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>{m.label}</span>
                          <span className={`text-[12px] font-semibold mt-0.5 ${isDarkMode ? 'text-white' : 'text-zinc-950'}`}>{m.value}</span>
                          {m.change && (
                            <span className={`text-[8px] font-medium ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>{m.change}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Action Tips */}
                  {activeResponse.actionTips && activeResponse.actionTips.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[9.5px] font-semibold text-purple-400 uppercase tracking-wider flex items-center gap-1">
                        <Lightbulb size={11} /> Actionable Steps
                      </span>
                      {activeResponse.actionTips.map((tip, idx) => (
                        <div key={idx} className={`flex items-start gap-1.5 text-[10px] leading-tight font-normal ${
                          isDarkMode ? 'text-zinc-300' : 'text-zinc-700'
                        }`}>
                          <CheckCircle2 size={11} className={`${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'} shrink-0 mt-0.5`} />
                          <span>{tip}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            {/* Modal Bottom Close Action */}
            <div className={`pt-2 border-t flex items-center justify-between ${
              isDarkMode ? 'border-white/10' : 'border-black/10'
            }`}>
              <span className={`text-[9px] font-normal ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>SuviX Intelligence v2</span>
              <button
                type="button"
                onClick={() => {
                  setActiveResponse(null);
                  setIsThinking(false);
                }}
                className={`px-3 py-1 rounded-full font-medium text-[10.5px] transition-colors cursor-pointer ${
                  isDarkMode ? 'bg-white text-black hover:bg-zinc-200' : 'bg-zinc-950 text-white hover:bg-zinc-900'
                }`}
              >
                Done
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
