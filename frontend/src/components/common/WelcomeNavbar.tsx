import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Layers,
  Sparkles,
  Video,
  Building2,
  CreditCard,
  BookOpen,
  Globe,
  ChevronDown,
  ArrowRight,
  Menu,
  X,
  Check,
  Zap,
  BarChart3,
  Users,
  Briefcase,
  PlaySquare,
  HelpCircle,
} from 'lucide-react';
import blackLogo from '../../assets/blackbglogo.png';

interface DropdownItem {
  title: string;
  desc: string;
  icon: React.ElementType;
  href: string;
  badge?: string;
}

const PRODUCTS_ITEMS: DropdownItem[] = [
  {
    title: 'Link-in-Bio Studio',
    desc: 'Custom high-conversion biolinks with rich media & analytics',
    icon: Layers,
    href: '/login',
    badge: 'v2.0',
  },
  {
    title: 'Creator Workspace',
    desc: 'Unified collaboration hub for video editors and creators',
    icon: Video,
    href: '/login',
  },
  {
    title: 'AI Scriptwriter & Tools',
    desc: 'AI-assisted scripting, title optimization, and tags',
    icon: Sparkles,
    href: '/creator-tools',
  },
  {
    title: 'Media Vault',
    desc: 'Cloud storage and 4K footage sharing with zero compression',
    icon: Zap,
    href: '/login',
  },
];

const SOLUTIONS_ITEMS: DropdownItem[] = [
  {
    title: 'For YouTube Creators',
    desc: 'Grow channel revenue, streamline workflows, and find top editors',
    icon: PlaySquare,
    href: '/role-selection',
  },
  {
    title: 'For Video Editors',
    desc: 'Get discovered by top YouTubers and land high-paying gigs',
    icon: Briefcase,
    href: '/role-selection',
  },
  {
    title: 'For Brands & Agencies',
    desc: 'Direct creator sponsorship deals and verified deliverables',
    icon: Building2,
    href: '/role-selection',
    badge: 'Enterprise',
  },
  {
    title: 'Audience Analytics',
    desc: 'Real-time multi-platform insights & demographic heatmaps',
    icon: BarChart3,
    href: '/login',
  },
];

const RESOURCES_ITEMS: DropdownItem[] = [
  {
    title: 'Creator Community',
    desc: 'Connect, network, and collaborate with 50K+ creators',
    icon: Users,
    href: '/community',
  },
  {
    title: 'Pricing & Plans',
    desc: 'Compare transparent tier pricing for Creators, Editors & Brands',
    icon: CreditCard,
    href: '/subscription',
  },
  {
    title: 'Creator Guides',
    desc: 'Master YouTube algorithm, monetization, and editing tips',
    icon: BookOpen,
    href: '/about',
  },
  {
    title: 'Help & Support',
    desc: '24/7 dedicated support and onboarding assistance',
    icon: HelpCircle,
    href: '/about',
  },
];

const LANGUAGES = [
  { code: 'en', label: 'English (US)', flag: '🇺🇸' },
  { code: 'hi', label: 'हिन्दी (Hindi)', flag: '🇮🇳' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
];

export const WelcomeNavbar: React.FC = () => {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState(LANGUAGES[0]);
  const [isLangOpen, setIsLangOpen] = useState(false);

  const langRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setIsLangOpen(false);
      }
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDropdownHover = (name: string) => {
    setActiveDropdown(name);
  };

  const handleDropdownLeave = () => {
    setActiveDropdown(null);
  };

  return (
    <header
      ref={navRef}
      className="fixed top-0 left-0 right-0 z-50 w-full bg-white transition-all select-none"
    >
      <div className="w-full max-w-full mx-auto px-4 sm:px-8 md:px-10 lg:px-10 xl:px-14 h-15 sm:h-18 flex items-center justify-between">
        {/* ── 1. LOGO ────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 lg:gap-4">
          <Link to="/" className="flex items-center gap-2 shrink-0 group">
            <img
              src={blackLogo}
              alt="SuviX"
              className="h-15 sm:h-20 md:h-20 w-auto object-contain transition-transform group-hover:scale-105"
            />
          </Link>

          {/* ── 2. DESKTOP NAVIGATION ITEMS ──────────────────────── */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
            {/* Products Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => handleDropdownHover('products')}
              onMouseLeave={handleDropdownLeave}
            >
              <button
                type="button"
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[13px] font-bold tracking-tight transition-colors cursor-pointer ${
                  activeDropdown === 'products'
                    ? 'text-black bg-zinc-100'
                    : 'text-zinc-900 hover:text-black hover:bg-zinc-50'
                }`}
              >
                <Layers className="w-4 h-4 text-zinc-700" />
                <span>Products</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-zinc-500 transition-transform duration-200 ${
                    activeDropdown === 'products' ? 'rotate-180' : ''
                  }`}
                />
              </button>

              <AnimatePresence>
                {activeDropdown === 'products' && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full left-0 mt-1 w-80 bg-white rounded-2xl p-3 shadow-2xl border border-zinc-200/90 grid gap-1.5 z-50"
                  >
                    {PRODUCTS_ITEMS.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.title}
                          to={item.href}
                          className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-zinc-50 transition-all group"
                        >
                          <div className="p-2 rounded-lg bg-zinc-100 group-hover:bg-zinc-900 group-hover:text-white transition-colors text-zinc-900 shrink-0 mt-0.5">
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-zinc-900 group-hover:text-black">
                                {item.title}
                              </span>
                              {item.badge && (
                                <span className="px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider bg-sky-100 text-sky-700 rounded-md">
                                  {item.badge}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] font-medium text-zinc-500 line-clamp-1 mt-0.5 leading-snug">
                              {item.desc}
                            </p>
                          </div>
                        </Link>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Solutions Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => handleDropdownHover('solutions')}
              onMouseLeave={handleDropdownLeave}
            >
              <button
                type="button"
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[13px] font-bold tracking-tight transition-colors cursor-pointer ${
                  activeDropdown === 'solutions'
                    ? 'text-black bg-zinc-100'
                    : 'text-zinc-900 hover:text-black hover:bg-zinc-50'
                }`}
              >
                <Sparkles className="w-4 h-4 text-zinc-700" />
                <span>Solutions</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-zinc-500 transition-transform duration-200 ${
                    activeDropdown === 'solutions' ? 'rotate-180' : ''
                  }`}
                />
              </button>

              <AnimatePresence>
                {activeDropdown === 'solutions' && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full left-0 mt-1 w-84 bg-white rounded-2xl p-3 shadow-2xl border border-zinc-200/90 grid gap-1.5 z-50"
                  >
                    {SOLUTIONS_ITEMS.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.title}
                          to={item.href}
                          className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-zinc-50 transition-all group"
                        >
                          <div className="p-2 rounded-lg bg-zinc-100 group-hover:bg-zinc-900 group-hover:text-white transition-colors text-zinc-900 shrink-0 mt-0.5">
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-zinc-900 group-hover:text-black">
                                {item.title}
                              </span>
                              {item.badge && (
                                <span className="px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider bg-purple-100 text-purple-700 rounded-md">
                                  {item.badge}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] font-medium text-zinc-500 line-clamp-1 mt-0.5 leading-snug">
                              {item.desc}
                            </p>
                          </div>
                        </Link>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Direct: For Creators */}
            <Link
              to="/role-selection"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[13px] font-bold text-zinc-900 hover:text-black hover:bg-zinc-50 tracking-tight transition-colors"
            >
              <Video className="w-4 h-4 text-zinc-700" />
              <span>For Creators</span>
            </Link>

            {/* Direct: For Business */}
            <Link
              to="/role-selection"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[13px] font-bold text-zinc-900 hover:text-black hover:bg-zinc-50 tracking-tight transition-colors"
            >
              <Building2 className="w-4 h-4 text-zinc-700" />
              <span>For Business</span>
            </Link>

            {/* Direct: Pricing */}
            <a
              href="#pricing"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[13px] font-bold text-zinc-900 hover:text-black hover:bg-zinc-50 tracking-tight transition-colors cursor-pointer"
            >
              <CreditCard className="w-4 h-4 text-zinc-700" />
              <span>Pricing</span>
            </a>

            {/* Resources Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => handleDropdownHover('resources')}
              onMouseLeave={handleDropdownLeave}
            >
              <button
                type="button"
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[13px] font-bold tracking-tight transition-colors cursor-pointer ${
                  activeDropdown === 'resources'
                    ? 'text-black bg-zinc-100'
                    : 'text-zinc-900 hover:text-black hover:bg-zinc-50'
                }`}
              >
                <BookOpen className="w-4 h-4 text-zinc-700" />
                <span>Resources</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-zinc-500 transition-transform duration-200 ${
                    activeDropdown === 'resources' ? 'rotate-180' : ''
                  }`}
                />
              </button>

              <AnimatePresence>
                {activeDropdown === 'resources' && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full left-0 mt-1 w-80 bg-white rounded-2xl p-3 shadow-2xl border border-zinc-200/90 grid gap-1.5 z-50"
                  >
                    {RESOURCES_ITEMS.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.title}
                          to={item.href}
                          className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-zinc-50 transition-all group"
                        >
                          <div className="p-2 rounded-lg bg-zinc-100 group-hover:bg-zinc-900 group-hover:text-white transition-colors text-zinc-900 shrink-0 mt-0.5">
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-zinc-900 group-hover:text-black">
                              {item.title}
                            </span>
                            <p className="text-[11px] font-medium text-zinc-500 line-clamp-1 mt-0.5 leading-snug">
                              {item.desc}
                            </p>
                          </div>
                        </Link>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </nav>
        </div>

        {/* ── 3. RIGHT SIDE: LANGUAGE SELECTOR & ACTIONS ── */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Language Selector Dropdown (Visible on both mobile & desktop) */}
          <div ref={langRef} className="relative">
            <button
              type="button"
              onClick={() => setIsLangOpen(!isLangOpen)}
              className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold text-zinc-800 hover:text-black hover:bg-zinc-100 transition-colors cursor-pointer border border-zinc-200/90 bg-white shadow-2xs"
              title="Select Language"
            >
              <Globe className="w-3.5 h-3.5 text-zinc-700" />
              <span className="hidden md:inline">{selectedLang.flag}</span>
              <span className="font-semibold text-zinc-900">{selectedLang.code.toUpperCase()}</span>
              <ChevronDown className="w-3 h-3 text-zinc-500" />
            </button>

            <AnimatePresence>
              {isLangOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 5 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 5 }}
                  transition={{ duration: 0.12 }}
                  className="absolute right-0 mt-2 w-44 bg-white rounded-xl p-1.5 shadow-2xl border border-zinc-200/90 z-50"
                >
                  <div className="px-2 py-1 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                    Select Language
                  </div>
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => {
                        setSelectedLang(lang);
                        setIsLangOpen(false);
                      }}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold text-zinc-800 hover:bg-zinc-100 hover:text-black transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <span>{lang.flag}</span>
                        <span>{lang.label}</span>
                      </span>
                      {selectedLang.code === lang.code && (
                        <Check className="w-3.5 h-3.5 text-emerald-600 font-bold" />
                      )}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Desktop Only: Sign In & Create Account */}
          <div className="hidden sm:flex items-center gap-3">
            <Link
              to="/login"
              className="px-3.5 py-2 rounded-xl text-xs sm:text-[13px] font-bold text-zinc-900 hover:text-black hover:bg-zinc-100 transition-all tracking-tight"
            >
              Sign In
            </Link>

            <Link
              to="/role-selection"
              className="flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 bg-black hover:bg-zinc-800 text-white rounded-xl text-xs sm:text-[13px] font-bold tracking-tight shadow-md hover:shadow-lg active:scale-95 transition-all group shrink-0"
            >
              <span>Create Account</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {/* Mobile Hamburger Button */}
          <div className="flex sm:hidden items-center">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="w-8.5 h-8.5 rounded-lg border border-zinc-200/90 bg-zinc-50 hover:bg-zinc-100 flex items-center justify-center text-zinc-900 transition-colors shadow-2xs cursor-pointer"
              aria-label="Toggle Navigation Menu"
            >
              {isMobileMenuOpen ? <X className="w-4.5 h-4.5" /> : <Menu className="w-4.5 h-4.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* ── 5. MOBILE EXPANDED MENU DRAWER ──────────────────────── */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="sm:hidden border-t border-zinc-200/90 bg-white px-4 pt-3 pb-6 shadow-xl space-y-4 overflow-hidden"
          >
            <div className="space-y-1">
              <div className="px-2 py-1 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                Menu
              </div>
              <Link
                to="/creator-tools"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-bold text-zinc-900 hover:bg-zinc-100"
              >
                <Layers className="w-4 h-4 text-zinc-700" />
                <span>Products & Tools</span>
              </Link>
              <Link
                to="/role-selection"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-bold text-zinc-900 hover:bg-zinc-100"
              >
                <Video className="w-4 h-4 text-zinc-700" />
                <span>For Creators</span>
              </Link>
              <Link
                to="/role-selection"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-bold text-zinc-900 hover:bg-zinc-100"
              >
                <Building2 className="w-4 h-4 text-zinc-700" />
                <span>For Business</span>
              </Link>
              <a
                href="#pricing"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-bold text-zinc-900 hover:bg-zinc-100 cursor-pointer"
              >
                <CreditCard className="w-4 h-4 text-zinc-700" />
                <span>Pricing Plans</span>
              </a>
              <Link
                to="/community"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-bold text-zinc-900 hover:bg-zinc-100"
              >
                <BookOpen className="w-4 h-4 text-zinc-700" />
                <span>Resources & Community</span>
              </Link>
            </div>

            {/* Mobile Auth CTAs */}
            <div className="pt-2 border-t border-zinc-100 space-y-2">
              <Link
                to="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full flex items-center justify-center py-2.5 rounded-xl border border-zinc-300 font-bold text-sm text-zinc-900 hover:bg-zinc-50"
              >
                Sign In
              </Link>
              <Link
                to="/role-selection"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-black text-white font-bold text-sm shadow-md"
              >
                <span>Create Free Account</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
