import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';
import { motion } from 'framer-motion';
import { 
  Youtube, UploadCloud, DollarSign, MessageSquare, 
  BrainCircuit, User, ArrowRight, Sparkles, ChevronRight,
  TrendingUp, BarChart3, Settings, Search, Compass,
  LayoutTemplate, Briefcase, Users, Zap
} from 'lucide-react';
import LottieComponent from 'lottie-react';
import toolsHeroAnimation from '../assets/lottie/tools_hero.json';

// Handle ESM/CJS interop for lottie-react
const Lottie = (LottieComponent as unknown as { default: typeof LottieComponent })?.default || LottieComponent;

const TOOLS = [
  {
    id: 'youtube-dashboard',
    title: 'YouTube Workspace',
    description: 'Manage your connected YouTube channels, analyze views, and track growth metrics in real-time.',
    icon: Youtube,
    color: 'text-rose-500',
    bgColor: 'bg-rose-500/10',
    borderColor: 'border-rose-500/20',
    path: '/youtube-dashboard',
    badge: 'Live',
    category: 'Management'
  },
  {
    id: 'upload-portal',
    title: 'Content Upload Portal',
    description: 'Securely upload your raw footage, assets, and deliverables directly to your active workspaces.',
    icon: UploadCloud,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20',
    path: '/upload-portal',
    category: 'Content'
  },
  {
    id: 'subscriptions',
    title: 'Monetization Hub',
    description: 'Track your earnings, manage subscription tiers, and setup new revenue streams effortlessly.',
    icon: DollarSign,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/20',
    path: '/subscription',
    category: 'Monetization'
  },
  {
    id: 'communication',
    title: 'Communication Hub',
    description: 'Collaborate with your team, sponsors, and other creators seamlessly in dedicated channels.',
    icon: MessageSquare,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/20',
    path: '/communication-hub',
    category: 'Network'
  },
  {
    id: 'creator-profile',
    title: 'Creator Identity',
    description: 'Customize your public profile, showcase your portfolio, and highlight your achievements.',
    icon: User,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/20',
    path: '/profile',
    category: 'Identity'
  },
  {
    id: 'ai-analytics',
    title: 'AI Insights Engine',
    description: 'Harness the power of AI to analyze trends, optimize tags, and predict video performance.',
    icon: BrainCircuit,
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-500/10',
    borderColor: 'border-indigo-500/20',
    path: '#',
    badge: 'Beta',
    category: 'Analytics'
  },
  {
    id: 'sponsorships',
    title: 'Brand Deals & Collabs',
    description: 'Manage active sponsorships, negotiate rates, and sign contracts all in one place.',
    icon: Briefcase,
    color: 'text-teal-500',
    bgColor: 'bg-teal-500/10',
    borderColor: 'border-teal-500/20',
    path: '#',
    category: 'Network'
  },
  {
    id: 'media-kit',
    title: 'Dynamic Media Kit',
    description: 'Generate an auto-updating media kit that syncs with your live analytics to share with brands.',
    icon: LayoutTemplate,
    color: 'text-pink-500',
    bgColor: 'bg-pink-500/10',
    borderColor: 'border-pink-500/20',
    path: '#',
    badge: 'New',
    category: 'Identity'
  },
  {
    id: 'audience',
    title: 'Audience CRM',
    description: 'Deep dive into your demographics, segment your top fans, and build community loyalty.',
    icon: Users,
    color: 'text-cyan-500',
    bgColor: 'bg-cyan-500/10',
    borderColor: 'border-cyan-500/20',
    path: '#',
    category: 'Analytics'
  }
];

export default function CreatorTools() {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const categories = ['All', ...Array.from(new Set(TOOLS.map(t => t.category)))];

  const filteredTools = TOOLS.filter(tool => {
    const matchesSearch = tool.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          tool.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'All' || tool.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className={`w-full min-h-full flex flex-col space-y-6 pb-20 px-4 pt-4 md:px-8 ${
      isDarkMode ? 'bg-black text-white' : 'bg-white text-black'
    }`}>
      {/* ─── Hero Banner Redesigned ─── */}
      <div className="relative w-full overflow-hidden pb-8 md:pb-12 flex flex-col md:flex-row items-center gap-10 bg-transparent">
        
        {/* Left Side: Lottie Animation */}
        <div className="w-full md:w-1/2 flex items-center justify-center min-h-[300px]">
          <div className="w-full max-w-[400px]">
            <Lottie 
              animationData={toolsHeroAnimation} 
              loop={true} 
              style={{ width: '100%', height: '100%' }} 
            />
          </div>
        </div>

        {/* Right Side: Content & Search */}
        <div className="w-full md:w-1/2 flex flex-col justify-center">
          
          <h1 className="text-4xl animate  md:text-5xl font-extrabold tracking-tight mb-  mt-5 font-sans">
            Suvix Creator <br />
            <span className={isDarkMode ? 'text-zinc-300' : 'text-zinc-600'}>Tools & Services</span>
          </h1>
          
          <p className={`text-base md:text-lg leading-relaxed font-sans mb-8 ${
            isDarkMode ? 'text-zinc-400' : 'text-zinc-500'
          }`}>
            Your ultimate toolkit to manage, grow, and monetize your content. 
            Access powerful integrations and leverage AI to scale your creative empire.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full">
            <div className={`relative flex-1 w-full rounded-full border-[1.5px] transition-all overflow-hidden ${
              isDarkMode ? 'bg-zinc-900 border-zinc-700 focus-within:border-white' : 'bg-zinc-50 border-zinc-300 focus-within:border-black focus-within:bg-white'
            }`}>
              <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${
                isDarkMode ? 'text-zinc-400' : 'text-zinc-500'
              }`} />
              <input 
                type="text" 
                placeholder="Search tools, services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full bg-transparent border-none outline-none pl-12 pr-4 py-3.5 text-sm font-sans font-medium ${
                  isDarkMode ? 'text-white placeholder:text-zinc-500' : 'text-black placeholder:text-zinc-400'
                }`}
              />
            </div>
            
            <button className={`shrink-0 px-6 py-3.5 rounded-full font-bold font-sans text-sm tracking-wide transition-all active:scale-[0.98] flex items-center gap-2 ${
              isDarkMode 
                ? 'bg-white text-black hover:bg-zinc-200' 
                : 'bg-black text-white hover:bg-zinc-800'
            }`}>
              <span>Explore Features</span>
              <Compass size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* ─── Premium Filters ─── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-hide pt-2">
        <div className={`flex items-center gap-1.5 p-1.5 rounded-2xl border transition-colors ${
          isDarkMode ? 'bg-[#0a0a0a] border-white/10' : 'bg-zinc-50 border-black/5'
        }`}>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all whitespace-nowrap ${
                activeCategory === category
                  ? (isDarkMode 
                      ? 'bg-zinc-800 text-white shadow-md' 
                      : 'bg-white text-black shadow-sm border border-black/5'
                    )
                  : (isDarkMode
                      ? 'bg-transparent text-zinc-500 hover:text-zinc-300'
                      : 'bg-transparent text-zinc-500 hover:text-zinc-800'
                    )
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Sleek Tools Grid ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredTools.map((tool, index) => (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04, ease: "easeOut" }}
            key={tool.id}
            onClick={() => tool.path !== '#' && navigate(tool.path)}
            className={`group relative p-6 sm:p-7 rounded-[28px] border transition-all duration-500 cursor-pointer overflow-hidden backdrop-blur-md ${
              isDarkMode 
                ? 'bg-zinc-900/40 border-white/5 hover:border-white/15 hover:bg-zinc-900/80 hover:shadow-2xl hover:shadow-white/5' 
                : 'bg-white/60 border-black/5 hover:border-black/10 hover:bg-white hover:shadow-xl hover:shadow-black/5'
            }`}
          >
            {/* Ambient Background Glow */}
            <div className={`absolute -top-24 -right-24 w-48 h-48 rounded-full blur-[60px] opacity-0 group-hover:opacity-30 transition-opacity duration-700 pointer-events-none ${tool.bgColor}`} />
            
            <div className="relative z-10 flex flex-col h-full">
              <div className="flex justify-between items-start mb-6">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105 duration-300 border ${tool.bgColor} ${tool.borderColor} ${tool.color} ${isDarkMode ? 'shadow-[0_0_15px_rgba(0,0,0,0.5)]' : 'shadow-sm'}`}>
                  <tool.icon size={26} strokeWidth={2} />
                </div>
                
                {tool.badge && (
                  <span className={`text-[10px] font-extrabold uppercase tracking-widest px-3 py-1.5 rounded-full border ${
                    tool.badge === 'Live'
                      ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                      : tool.badge === 'New'
                      ? 'bg-pink-500/10 text-pink-500 border-pink-500/20'
                      : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                  }`}>
                    {tool.badge}
                  </span>
                )}
              </div>

              <div className="flex-1 mt-2">
                <h3 className={`text-xl font-extrabold tracking-tight mb-2.5 transition-colors ${isDarkMode ? 'text-white group-hover:text-zinc-100' : 'text-zinc-900 group-hover:text-black'}`}>
                  {tool.title}
                </h3>
                <p className={`text-[13.5px] leading-relaxed font-medium transition-colors ${isDarkMode ? 'text-zinc-400 group-hover:text-zinc-300' : 'text-zinc-500 group-hover:text-zinc-700'}`}>
                  {tool.description}
                </p>
              </div>

              <div className="mt-8 flex items-center justify-between pt-5 border-t border-dashed border-black/10 dark:border-white/10">
                <span className={`text-[11px] font-bold uppercase tracking-widest ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
                  {tool.category}
                </span>
                
                <div className={`flex items-center justify-center w-9 h-9 rounded-full transition-all duration-300 transform group-hover:translate-x-1 ${
                  isDarkMode 
                    ? 'bg-zinc-800 text-zinc-400 group-hover:bg-white group-hover:text-black' 
                    : 'bg-zinc-100 text-zinc-500 group-hover:bg-black group-hover:text-white'
                }`}>
                  <ChevronRight size={16} strokeWidth={2.5} />
                </div>
              </div>
            </div>
          </motion.div>
        ))}

        {filteredTools.length === 0 && (
          <div className={`col-span-full py-24 flex flex-col items-center justify-center text-center border-2 border-dashed rounded-[32px] ${
            isDarkMode ? 'border-zinc-800 bg-[#050505]' : 'border-zinc-200 bg-zinc-50'
          }`}>
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-5 ${
              isDarkMode ? 'bg-zinc-900 text-zinc-600' : 'bg-zinc-100 text-zinc-400'
            }`}>
              <Search size={28} strokeWidth={1.5} />
            </div>
            <h3 className={`text-xl font-extrabold mb-2 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>No tools found</h3>
            <p className={`text-sm font-medium ${isDarkMode ? 'text-zinc-500' : 'text-zinc-500'}`}>We couldn't find anything matching "{searchQuery}"</p>
          </div>
        )}
      </div>
      
      {/* ─── Ultra-Premium Enterprise CTA ─── */}
      <div className={`mt-10 p-8 md:p-12 rounded-[32px] flex flex-col md:flex-row items-center justify-between gap-8 overflow-hidden relative shadow-2xl ${
        isDarkMode ? 'bg-[#050505] border border-white/10' : 'bg-black border border-black text-white'
      }`}>
        {/* Massive Mesh Gradient Background */}
        <div className="absolute inset-0 opacity-40 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/40 via-purple-500/20 to-transparent pointer-events-none mix-blend-screen" />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-rose-500/20 blur-[80px] rounded-full pointer-events-none" />
        
        <div className="relative z-10 flex items-center gap-6 max-w-xl">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0 border border-white/20">
            <Sparkles size={28} className="text-white fill-white/20" />
          </div>
          <div>
            <h3 className="text-2xl font-extrabold text-white tracking-tight mb-2">Unlock Enterprise Tools</h3>
            <p className="text-[14px] text-zinc-300 font-medium leading-relaxed">
              Scale your creative business with custom APIs, advanced agency management, and dedicated partnership support.
            </p>
          </div>
        </div>
        <button className="relative z-10 shrink-0 px-8 py-4 bg-white text-black hover:bg-zinc-100 rounded-2xl font-extrabold text-[13px] uppercase tracking-wider transition-all active:scale-[0.98] shadow-xl shadow-white/10">
          Contact Sales
        </button>
      </div>

    </div>
  );
}
