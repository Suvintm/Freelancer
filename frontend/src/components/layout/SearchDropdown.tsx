import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectUser } from '../../store/slices/authSlice';
import { useTheme } from '../../hooks/useTheme';
import { 
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

interface SearchDropdownProps {
  query: string;
  setQuery: (q: string) => void;
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

export const SearchDropdown = ({ query, setQuery, onClose }: SearchDropdownProps) => {
  const navigate = useNavigate();
  const { isDarkMode, toggleTheme } = useTheme();
  const user = useSelector(selectUser);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    const saved = localStorage.getItem('suvix_recent_searches');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return [];
  });
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        // Only close if we didn't click the input itself (the parent handles that)
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const saveRecentSearch = useCallback((searchText: string) => {
    if (!searchText.trim()) return;
    setRecentSearches(prev => {
      const updated = [
        searchText,
        ...prev.filter(s => s !== searchText)
      ].slice(0, 4);
      localStorage.setItem('suvix_recent_searches', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const clearRecentSearches = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRecentSearches([]);
    localStorage.removeItem('suvix_recent_searches');
  };

  const handleSelect = useCallback((item: SearchItem) => {
    saveRecentSearch(item.title);
    if (item.action) {
      item.action();
    } else if (item.url) {
      navigate(item.url);
      onClose();
    }
  }, [navigate, onClose, saveRecentSearch]);

  // Pure monochrome icon styling class
  const iconClass = "text-[16px]";

  // Black and white monochrome navigation items
  const navigationItems: SearchItem[] = [
    {
      id: 'nav-home',
      title: 'Home Feed',
      subtitle: 'Dashboard feed & stories',
      category: 'Navigation',
      icon: <MdHome className={iconClass} />,
      url: '/home'
    },
    {
      id: 'nav-explore',
      title: 'Explore Creators',
      subtitle: 'Discover trending content',
      category: 'Navigation',
      icon: <MdExplore className={iconClass} />,
      url: '/explore'
    },
    {
      id: 'nav-nearby',
      title: 'Nearby Creators Map',
      subtitle: 'Connect with local creators',
      category: 'Navigation',
      icon: <MdMap className={iconClass} />,
      url: '/nearby'
    },
    {
      id: 'nav-reels',
      title: 'Shorts & Reels',
      subtitle: 'Watch trending short videos',
      category: 'Navigation',
      icon: <MdVideoLibrary className={iconClass} />,
      url: '/reels'
    },
    {
      id: 'nav-jobs',
      title: 'Creator Gigs & Jobs',
      subtitle: 'Browse production jobs & gigs',
      category: 'Navigation',
      icon: <MdWork className={iconClass} />,
      url: '/jobs'
    },
    {
      id: 'nav-chats',
      title: 'Direct Messages & Chats',
      subtitle: 'Talk with brand managers & creators',
      category: 'Navigation',
      icon: <MdChat className={iconClass} />,
      url: '/chats'
    },
    {
      id: 'nav-notifications',
      title: 'Notifications Panel',
      subtitle: 'Check recent updates & alerts',
      category: 'Navigation',
      icon: <MdNotifications className={iconClass} />,
      url: '/notifications'
    },
    {
      id: 'nav-profile',
      title: 'Creator Profile Settings',
      subtitle: 'View and customize profile settings',
      category: 'Navigation',
      icon: <MdPerson className={iconClass} />,
      url: '/profile'
    },
    {
      id: 'nav-subscription',
      title: 'Upgrade & Subscriptions',
      subtitle: 'Compare plans & manage payments',
      category: 'Navigation',
      icon: <MdCreditCard className={iconClass} />,
      url: '/subscription'
    },
    {
      id: 'nav-settings',
      title: 'System Settings',
      subtitle: 'Manage passwords and configurations',
      category: 'Navigation',
      icon: <MdSettings className={iconClass} />,
      url: '/settings'
    },
    {
      id: 'nav-upload',
      title: 'Upload Content Portal',
      subtitle: 'Publish articles or video links',
      category: 'Navigation',
      icon: <MdCloudUpload className={iconClass} />,
      url: '/upload-portal'
    },
    {
      id: 'nav-youtube-dashboard',
      title: 'YouTube Dashboard',
      subtitle: 'Analyze metrics & performance',
      category: 'Navigation',
      icon: <MdDashboard className={iconClass} />,
      url: '/youtube-dashboard'
    }
  ];

  // Actions list
  const actionItems: SearchItem[] = [
    {
      id: 'action-theme',
      title: 'Toggle Color Theme',
      subtitle: `Switch dark/light (currently ${isDarkMode ? 'Dark' : 'Light'})`,
      category: 'Actions',
      icon: <MdDarkMode className={iconClass} />,
      shortcut: '/theme',
      action: () => {
        toggleTheme();
        onClose();
      }
    },
    {
      id: 'action-logout',
      title: 'Sign Out Session',
      subtitle: 'Exit your current session',
      category: 'Actions',
      icon: <MdExitToApp className={iconClass} />,
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
      subtitle: 'Sync brand accounts & credentials',
      category: 'Actions',
      icon: <MdOutlineLink className={iconClass} />,
      shortcut: '/connect',
      url: '/youtube-connect'
    }
  ];

  // Filter lists based on role/category
  const isClientCategory = ['social_promoter', 'direct_client'].includes(user?.primaryRole?.categorySlug || '');
  const isYtInfluencer = user?.primaryRole?.categorySlug === 'yt_influencer';

  const filteredNavItems = navigationItems.filter(item => {
    if (isClientCategory) {
      return item.url !== '/upload-portal' && item.url !== '/reels' && item.url !== '/youtube-dashboard';
    }
    if (!isYtInfluencer && item.url === '/youtube-dashboard') {
      return false;
    }
    return true;
  });

  const filteredActionItems = actionItems.filter(item => {
    if (isClientCategory) {
      return item.url !== '/youtube-connect';
    }
    return true;
  });

  // Map user's YouTube channels
  const youtubeChannels = user?.youtubeProfile || [];
  const channelItems: SearchItem[] = youtubeChannels.map((channel: { channel_id: string; channel_name: string; subscriber_count?: string | number }) => ({
    id: `channel-${channel.channel_id}`,
    title: channel.channel_name,
    subtitle: `YouTube Channel • ${Number(channel.subscriber_count || 0).toLocaleString()} Subs`,
    category: 'YouTube Channels',
    icon: <MdPlayArrow className={iconClass} />,
    url: `/channel/${channel.channel_id}`
  }));

  // Mock popular creators
  const popularCreators: SearchItem[] = [
    {
      id: 'creator-mrbeast',
      title: 'Jimmy Donaldson (MrBeast)',
      subtitle: 'Creator Spotlight • Entertainment • 250M+ Subs',
      category: 'Popular Creators',
      icon: <MdPerson className={iconClass} />,
      url: '/explore'
    },
    {
      id: 'creator-mkbhd',
      title: 'Marques Brownlee (MKBHD)',
      subtitle: 'Creator Spotlight • Tech Reviews • 18M+ Subs',
      category: 'Popular Creators',
      icon: <MdPerson className={iconClass} />,
      url: '/explore'
    },
    {
      id: 'creator-caseyneistat',
      title: 'Casey Neistat',
      subtitle: 'Creator Spotlight • Filmmaking & Vlogs • 12M+ Subs',
      category: 'Popular Creators',
      icon: <MdPerson className={iconClass} />,
      url: '/explore'
    }
  ];

  const allItems = [...filteredNavItems, ...filteredActionItems, ...channelItems, ...popularCreators];

  // Filtering based on query (display all items when query is empty, scrollable)
  const filteredItems = query.trim() === '' 
    ? allItems 
    : allItems.filter(item => {
        const searchText = `${item.title} ${item.subtitle} ${item.category} ${item.shortcut || ''}`.toLowerCase();
        return searchText.includes(query.toLowerCase());
      });

  // Handle keyboard events inside the input element
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredItems, selectedIndex, onClose, handleSelect]);

  // Group items by category
  const groupedItems = filteredItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, SearchItem[]>);

  const categoriesOrder: ('Navigation' | 'YouTube Channels' | 'Popular Creators' | 'Actions')[] = [
    'Navigation',
    'YouTube Channels',
    'Popular Creators',
    'Actions'
  ];

  const flatFilteredList: SearchItem[] = [];
  categoriesOrder.forEach(cat => {
    if (groupedItems[cat]) {
      flatFilteredList.push(...groupedItems[cat]);
    }
  });

  return (
    <div 
      ref={dropdownRef}
      className={`absolute top-full left-0 right-0 mt-2 z-[100] rounded-2xl border flex flex-col transition-all duration-200 animate-in fade-in slide-in-from-top-1 ${
        isDarkMode 
          ? 'bg-[#0d0d10] border-zinc-850 shadow-[0_8px_30px_rgba(0,0,0,0.45)] text-zinc-300' 
          : 'bg-white border-zinc-200/80 shadow-[0_8px_24px_rgba(0,0,0,0.06)] text-zinc-800'
      }`}
    >
      {/* Recent searches history */}
      {query.trim() === '' && recentSearches.length > 0 && (
        <div className={`px-4 py-3 border-b ${isDarkMode ? 'border-zinc-850/50' : 'border-zinc-100'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-zinc-400 dark:text-zinc-500">
              Recent Searches
            </span>
            <button 
              onClick={clearRecentSearches}
              className={`flex items-center gap-0.5 text-[10px] font-semibold cursor-pointer transition-colors ${
                isDarkMode ? 'text-zinc-500 hover:text-zinc-300' : 'text-zinc-400 hover:text-zinc-800'
              }`}
            >
              <MdDeleteOutline size={13} />
              Clear
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {recentSearches.map((search, idx) => (
              <button
                key={idx}
                onClick={(e) => {
                  e.stopPropagation();
                  setQuery(search);
                  setSelectedIndex(0);
                }}
                className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                  isDarkMode 
                    ? 'bg-zinc-900 border-zinc-850 hover:bg-zinc-850 text-zinc-300 hover:text-white' 
                    : 'bg-zinc-50 border-zinc-150 hover:bg-zinc-100 hover:shadow-sm text-zinc-600 hover:text-zinc-950'
                }`}
              >
                <MdHistory size={12} className="opacity-75" />
                <span>{search}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Grouped results list */}
      <div className="max-h-[320px] overflow-y-auto py-1">
        {flatFilteredList.length > 0 ? (
          categoriesOrder.map(category => {
            const items = groupedItems[category];
            if (!items || items.length === 0) return null;

            return (
              <div key={category} className="space-y-0.5">
                <div className="px-5 py-2 text-[9px] font-bold uppercase tracking-[0.15em] text-zinc-400/80 dark:text-zinc-500/80">
                  {category}
                </div>
                {items.map(item => {
                  const globalIdx = flatFilteredList.findIndex(x => x.id === item.id);
                  const isSelected = globalIdx === selectedIndex;

                  return (
                    <div
                      key={item.id}
                      onClick={() => handleSelect(item)}
                      onMouseEnter={() => setSelectedIndex(globalIdx)}
                      className={`flex items-center justify-between px-4 py-2 mx-1 rounded-xl cursor-pointer transition-all duration-150 ${
                        isSelected 
                          ? isDarkMode
                            ? 'bg-zinc-900 text-white scale-[1.01] shadow-sm'
                            : 'bg-zinc-100/90 text-zinc-950 scale-[1.01] shadow-[0_2px_8px_rgba(0,0,0,0.02)]'
                          : isDarkMode 
                            ? 'hover:bg-zinc-900/30 text-zinc-400 hover:text-white' 
                            : 'hover:bg-zinc-50 text-zinc-600 hover:text-zinc-950'
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        {/* Circular icon wrapper matching Google/Meta aesthetics */}
                        <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center transition-all ${
                          isSelected
                            ? isDarkMode ? 'bg-zinc-800 text-white' : 'bg-white text-zinc-950 shadow-sm'
                            : isDarkMode ? 'bg-zinc-900 text-zinc-100' : 'bg-zinc-100 text-zinc-955'
                        }`}>
                          {item.icon}
                        </div>
                        <div className="min-w-0">
                          <p className={`text-[13px] font-semibold leading-none ${
                            isSelected 
                              ? isDarkMode ? 'text-white' : 'text-zinc-950 font-bold'
                              : isDarkMode ? 'text-zinc-300' : 'text-zinc-800'
                          }`}>{item.title}</p>
                          <p className={`text-[10px] leading-tight mt-1.5 truncate ${
                            isSelected
                              ? isDarkMode ? 'text-zinc-400' : 'text-zinc-500'
                              : isDarkMode ? 'text-zinc-500' : 'text-zinc-400'
                          }`}>
                            {item.subtitle}
                          </p>
                        </div>
                      </div>

                      {/* Shortcut tags / keyboard hints */}
                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        {item.shortcut && (
                          <span className={`text-[8.5px] font-mono px-1.5 py-0.5 rounded font-bold border ${
                            isDarkMode 
                              ? 'bg-zinc-900 border-zinc-800 text-zinc-400' 
                              : 'bg-zinc-50 border-zinc-200 text-zinc-500'
                          }`}>
                            {item.shortcut}
                          </span>
                        )}
                        {isSelected && (
                          <MdKeyboardReturn size={10} className={`opacity-60 ${isDarkMode ? 'text-white' : 'text-zinc-950'}`} />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })
        ) : (
          <div className="py-6 px-4 text-center">
            <p className="text-xs font-bold text-zinc-500">No results found</p>
          </div>
        )}
      </div>

      {/* Keyboard guide footer */}
      <div className={`px-5 py-2 border-t text-[9.5px] font-semibold flex items-center justify-between select-none ${
        isDarkMode ? 'border-zinc-800/80 bg-zinc-900/10 text-zinc-500' : 'border-zinc-100 bg-zinc-50 text-zinc-500'
      }`}>
        <div className="flex items-center gap-2.5">
          <span>↑↓ to navigate</span>
          <span>↵ to select</span>
        </div>
        <span className="font-extrabold uppercase tracking-widest text-[8px] text-zinc-500 opacity-60">
          SuviX Search
        </span>
      </div>
    </div>
  );
};
