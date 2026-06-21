import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectUser } from '../../store/slices/authSlice';
import { useTheme } from '../../hooks/useTheme';
import { 
  MdSearch, 
  MdHome, 
  MdExplore, 
  MdMap, 
  MdVideoLibrary, 
  MdWork, 
  MdChat, 
  MdNotifications, 
  MdPerson, 
  MdCreditCard, 
  MdSettings, 
  MdCloudUpload, 
  MdDashboard, 
  MdDarkMode, 
  MdExitToApp, 
  MdKeyboardReturn, 
  MdHistory, 
  MdDeleteOutline,
  MdPlayArrow,
  MdOutlineLink
} from 'react-icons/md';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SearchItem {
  id: string;
  title: string;
  subtitle: string;
  category: 'Navigation' | 'Actions' | 'YouTube Channels' | 'Popular Creators';
  icon: React.ReactNode;
  shortcut?: string;
  action?: () => void;
  url?: string;
}

export const CommandPalette = ({ isOpen, onClose }: CommandPaletteProps) => {
  const navigate = useNavigate();
  const { isDarkMode, toggleTheme } = useTheme();
  const user = useSelector(selectUser);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('suvix_recent_searches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse recent searches', e);
      }
    }
  }, [isOpen]);

  // Autofocus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const saveRecentSearch = (searchText: string) => {
    if (!searchText.trim()) return;
    const updated = [
      searchText,
      ...recentSearches.filter(s => s !== searchText)
    ].slice(0, 5); // Keep last 5 searches
    setRecentSearches(updated);
    localStorage.setItem('suvix_recent_searches', JSON.stringify(updated));
  };

  const clearRecentSearches = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRecentSearches([]);
    localStorage.removeItem('suvix_recent_searches');
  };

  // Define static navigation list
  const navigationItems: SearchItem[] = [
    {
      id: 'nav-home',
      title: 'Home Feed',
      subtitle: 'Go to your main dashboard feed and stories',
      category: 'Navigation',
      icon: <MdHome className="text-xl text-[#1a73e8]" />,
      url: '/home'
    },
    {
      id: 'nav-explore',
      title: 'Explore Creators',
      subtitle: 'Discover trending creator content and profiles',
      category: 'Navigation',
      icon: <MdExplore className="text-xl text-[#ea4335]" />,
      url: '/explore'
    },
    {
      id: 'nav-nearby',
      title: 'Nearby Creators Map',
      subtitle: 'Find and connect with local creators in your region',
      category: 'Navigation',
      icon: <MdMap className="text-xl text-[#34a853]" />,
      url: '/nearby'
    },
    {
      id: 'nav-reels',
      title: 'Shorts & Reels',
      subtitle: 'Watch trending short-form content',
      category: 'Navigation',
      icon: <MdVideoLibrary className="text-xl text-[#fbbc05]" />,
      url: '/reels'
    },
    {
      id: 'nav-jobs',
      title: 'Creator Gigs & Jobs',
      subtitle: 'Browse and apply to production jobs, video gigs, and collaborations',
      category: 'Navigation',
      icon: <MdWork className="text-xl text-[#ab47bc]" />,
      url: '/jobs'
    },
    {
      id: 'nav-chats',
      title: 'Direct Messages & Chats',
      subtitle: 'Talk with creators, brand managers, and partners',
      category: 'Navigation',
      icon: <MdChat className="text-xl text-[#00acc1]" />,
      url: '/chats'
    },
    {
      id: 'nav-notifications',
      title: 'Notifications Panel',
      subtitle: 'Check recent likes, comments, and job updates',
      category: 'Navigation',
      icon: <MdNotifications className="text-xl text-[#ff7043]" />,
      url: '/notifications'
    },
    {
      id: 'nav-profile',
      title: 'Creator Profile Settings',
      subtitle: 'View your public profile card and customize fields',
      category: 'Navigation',
      icon: <MdPerson className="text-xl text-[#5c6bc0]" />,
      url: '/profile'
    },
    {
      id: 'nav-subscription',
      title: 'Upgrade & Subscriptions',
      subtitle: 'Compare plans (Creator, Pro, Elite) and manage payments',
      category: 'Navigation',
      icon: <MdCreditCard className="text-xl text-[#e91e63]" />,
      url: '/subscription'
    },
    {
      id: 'nav-settings',
      title: 'System Settings',
      subtitle: 'Manage configurations, passwords, and layout details',
      category: 'Navigation',
      icon: <MdSettings className="text-xl text-[#78909c]" />,
      url: '/settings'
    },
    {
      id: 'nav-upload',
      title: 'Upload Content Portal',
      subtitle: 'Publish articles, videos, or new listings',
      category: 'Navigation',
      icon: <MdCloudUpload className="text-xl text-[#26a69a]" />,
      url: '/upload-portal'
    },
    {
      id: 'nav-youtube-dashboard',
      title: 'YouTube Dashboard',
      subtitle: 'Analyze video performance and audience metrics',
      category: 'Navigation',
      icon: <MdDashboard className="text-xl text-[#ff0000]" />,
      url: '/youtube-dashboard'
    }
  ];

  // Define static quick actions list
  const actionItems: SearchItem[] = [
    {
      id: 'action-theme',
      title: 'Toggle Color Theme',
      subtitle: `Switch between dark and light mode (currently ${isDarkMode ? 'Dark' : 'Light'})`,
      category: 'Actions',
      icon: <MdDarkMode className="text-xl text-teal-500" />,
      shortcut: '/theme',
      action: () => {
        toggleTheme();
        onClose();
      }
    },
    {
      id: 'action-logout',
      title: 'Sign Out Session',
      subtitle: 'Exit your current active session securely',
      category: 'Actions',
      icon: <MdExitToApp className="text-xl text-rose-500" />,
      shortcut: '/logout',
      action: () => {
        localStorage.clear();
        navigate('/login');
        onClose();
      }
    },
    {
      id: 'action-connect',
      title: 'Connect YouTube Channel',
      subtitle: 'Sync new YouTube brand accounts and analytics',
      category: 'Actions',
      icon: <MdOutlineLink className="text-xl text-amber-600" />,
      shortcut: '/connect',
      url: '/youtube-connect'
    }
  ];

  // Map user's YouTube channels
  const youtubeChannels = user?.youtubeProfile || [];
  const channelItems: SearchItem[] = youtubeChannels.map((channel: any) => ({
    id: `channel-${channel.channel_id}`,
    title: channel.channel_name,
    subtitle: `Connected YouTube Channel • ${Number(channel.subscriber_count || 0).toLocaleString()} Subscribers`,
    category: 'YouTube Channels',
    icon: <MdPlayArrow className="text-xl text-red-600" />,
    url: `/channel/${channel.channel_id}`
  }));

  // Define mock popular creators for spotlight searching
  const popularCreators: SearchItem[] = [
    {
      id: 'creator-mrbeast',
      title: 'Jimmy Donaldson (MrBeast)',
      subtitle: 'Creator Spotlight • Entertainment • 250M+ Subscribers',
      category: 'Popular Creators',
      icon: <MdPerson className="text-xl text-[#1a73e8]" />,
      url: '/explore'
    },
    {
      id: 'creator-mkbhd',
      title: 'Marques Brownlee (MKBHD)',
      subtitle: 'Creator Spotlight • Technology & Hardware Reviews • 18M+ Subscribers',
      category: 'Popular Creators',
      icon: <MdPerson className="text-xl text-[#ea4335]" />,
      url: '/explore'
    },
    {
      id: 'creator-caseyneistat',
      title: 'Casey Neistat',
      subtitle: 'Creator Spotlight • Filmmaking & Storytelling • 12M+ Subscribers',
      category: 'Popular Creators',
      icon: <MdPerson className="text-xl text-[#fbbc05]" />,
      url: '/explore'
    }
  ];

  // Combine everything
  const allItems = [...navigationItems, ...actionItems, ...channelItems, ...popularCreators];

  // Filtering based on query
  const filteredItems = query.trim() === '' 
    ? allItems.slice(0, 8) // Show top items when empty
    : allItems.filter(item => {
        const searchText = `${item.title} ${item.subtitle} ${item.category} ${item.shortcut || ''}`.toLowerCase();
        return searchText.includes(query.toLowerCase());
      });

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filteredItems.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredItems.length) % filteredItems.length);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          handleSelect(filteredItems[selectedIndex]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, filteredItems, selectedIndex]);

  const handleSelect = (item: SearchItem) => {
    saveRecentSearch(item.title);
    if (item.action) {
      item.action();
    } else if (item.url) {
      navigate(item.url);
      onClose();
    }
  };

  if (!isOpen) return null;

  // Group items by category to display headers
  const groupedItems = filteredItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, SearchItem[]>);

  // Flat array of filtered items to keep track of global indexes
  const flatFilteredList: SearchItem[] = [];
  const categoriesOrder: ('Navigation' | 'YouTube Channels' | 'Popular Creators' | 'Actions')[] = [
    'Navigation',
    'YouTube Channels',
    'Popular Creators',
    'Actions'
  ];

  categoriesOrder.forEach(cat => {
    if (groupedItems[cat]) {
      flatFilteredList.push(...groupedItems[cat]);
    }
  });

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-start justify-center pt-[10vh] px-4 transition-all duration-300">
      <div 
        ref={containerRef}
        className={`w-full max-w-xl rounded-2xl border shadow-2xl flex flex-col overflow-hidden transition-all transform duration-300 scale-100 ${
          isDarkMode 
            ? 'bg-[#0f0f12] border-zinc-800 text-white' 
            : 'bg-white border-zinc-200 text-zinc-900'
        }`}
      >
        {/* Header Search Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border-main/50 relative">
          <MdSearch className={`text-2xl ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command, page name, or search query..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            className="w-full bg-transparent border-0 focus:outline-none focus:ring-0 text-[14.5px] placeholder-zinc-500"
          />
          <button 
            onClick={onClose}
            className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors ${
              isDarkMode 
                ? 'border-zinc-800 hover:border-zinc-700 bg-zinc-900/60 text-zinc-400' 
                : 'border-zinc-200 hover:border-zinc-300 bg-zinc-50 text-zinc-500'
            }`}
          >
            ESC
          </button>
        </div>

        {/* Dynamic content area */}
        <div className="max-h-[380px] overflow-y-auto scrollbar-hide py-2">
          
          {/* Recent searches history (Only if query is empty) */}
          {query.trim() === '' && recentSearches.length > 0 && (
            <div className="px-4 py-2 mb-2">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-500">
                  Recent Searches
                </span>
                <button 
                  onClick={clearRecentSearches}
                  className="flex items-center gap-1 text-[10px] font-bold text-rose-500 hover:underline cursor-pointer"
                >
                  <MdDeleteOutline size={12} />
                  Clear History
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {recentSearches.map((search, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setQuery(search);
                      setSelectedIndex(0);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                      isDarkMode 
                        ? 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-zinc-300 hover:text-white' 
                        : 'bg-zinc-50 border-zinc-200 hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900'
                    }`}
                  >
                    <MdHistory size={12} className="text-zinc-500" />
                    <span>{search}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Grouped results list */}
          {flatFilteredList.length > 0 ? (
            categoriesOrder.map(category => {
              const items = groupedItems[category];
              if (!items || items.length === 0) return null;

              return (
                <div key={category} className="space-y-0.5">
                  {/* Category Header */}
                  <div className="px-4 py-1.5 text-[9.5px] font-extrabold uppercase tracking-widest text-zinc-500/80">
                    {category}
                  </div>
                  
                  {/* Category Items */}
                  {items.map(item => {
                    const globalIdx = flatFilteredList.findIndex(x => x.id === item.id);
                    const isSelected = globalIdx === selectedIndex;

                    return (
                      <div
                        key={item.id}
                        onClick={() => handleSelect(item)}
                        onMouseEnter={() => setSelectedIndex(globalIdx)}
                        className={`flex items-center justify-between px-4 py-2.5 mx-2 rounded-xl cursor-pointer transition-all duration-150 ${
                          isSelected 
                            ? isDarkMode
                              ? 'bg-zinc-800/80 text-white translate-x-1'
                              : 'bg-zinc-100 text-zinc-950 translate-x-1'
                            : 'hover:bg-zinc-900/10 dark:hover:bg-zinc-950/20'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`p-1.5 rounded-lg shrink-0 ${
                            isDarkMode ? 'bg-zinc-900 text-white' : 'bg-zinc-50 text-zinc-700'
                          }`}>
                            {item.icon}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[13px] font-bold leading-tight">{item.title}</p>
                            <p className={`text-[10.5px] leading-tight mt-0.5 truncate ${
                              isDarkMode ? 'text-zinc-400' : 'text-zinc-500'
                            }`}>
                              {item.subtitle}
                            </p>
                          </div>
                        </div>

                        {/* Optional indicator tags */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {item.shortcut && (
                            <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded uppercase tracking-wider font-bold ${
                              isDarkMode ? 'bg-zinc-900 text-teal-400 border border-zinc-800' : 'bg-teal-50 text-teal-600 border border-teal-100'
                            }`}>
                              {item.shortcut}
                            </span>
                          )}
                          {isSelected && (
                            <div className="flex items-center gap-1 text-[10px] font-bold text-zinc-400">
                              <span>Enter</span>
                              <MdKeyboardReturn size={11} className="animate-pulse" />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })
          ) : (
            <div className="py-8 px-4 text-center">
              <p className="text-sm font-bold text-zinc-500">No results found for "{query}"</p>
              <p className="text-xs text-zinc-500 mt-1">Try searching for pages like "subscription", "jobs", or "theme".</p>
            </div>
          )}
        </div>

        {/* Keyboard hints footer */}
        <div className={`px-4 py-2 border-t text-[10px] font-semibold flex items-center justify-between select-none ${
          isDarkMode ? 'border-zinc-800/60 bg-zinc-900/20 text-zinc-500' : 'border-zinc-100 bg-zinc-50 text-zinc-500'
        }`}>
          <div className="flex items-center gap-3">
            <span>↑↓ to navigate</span>
            <span>↵ to select</span>
            <span>esc to close</span>
          </div>
          <span className="font-extrabold uppercase tracking-widest text-[9px] text-[#7c42f8]/80 animate-pulse">
            SuviX Spotlight ⚡
          </span>
        </div>
      </div>
    </div>
  );
};
