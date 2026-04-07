import React, { useRef, useState, useCallback, useMemo, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PagerView from 'react-native-pager-view';
import { useSegments, useRouter } from 'expo-router';
import { useTheme } from '../../src/context/ThemeContext';
import { AnimatedTabBar } from '../../src/components/AnimatedTabBar';
import { TopNavbar } from '../../src/components/TopNavbar';
import { Sidebar } from '../../src/components/Sidebar';
import { useAuthStore } from '../../src/store/useAuthStore';
import { CATEGORIES } from '../../src/constants/categories';
import { CategoryId } from '../../src/types/category';

// Screens
import HomeScreen from './index';
import ExploreScreen from './explore';
import NearbyScreen from './nearby';
import ReelsScreen from './reels';
import JobsScreen from './jobs';
import ChatsScreen from './chats';
import ProfileScreen from './profile';

/**
 * PRODUCTION-GRADE DYNAMIC SWIPE TAB LAYOUT
 * Automatically adjusts features based on User Category (Influencer, Promoter, Renter, etc.)
 */

export default function TabsLayout() {
  const { theme } = useTheme();
  const { user } = useAuthStore();
  const pagerRef = useRef<PagerView>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [renderedPages, setRenderedPages] = useState<Set<number>>(new Set([0]));
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const segments = useSegments() as string[];

  // 1. Define Universal Tab Base
  const ALL_TABS = useMemo(() => [
    { name: 'index',   title: 'Home'    },
    { name: 'explore', title: 'Explore' },
    { name: 'nearby',  title: 'Nearby'  },
    { name: 'reels',   title: 'Reels'   },
    { name: 'jobs',    title: 'Jobs', providerOnly: true }, // Only for Providers
    { name: 'chats',   title: 'Chats'   },
    { name: 'profile', title: 'Profile' },
  ], []);

  // 2. Filter Tabs based on User Category/Role
  const filteredTabs = useMemo(() => {
    const roleGroupId = user?.primaryRole?.group || 'PROVIDER';
    
    return ALL_TABS.filter(tab => {
      if (tab.providerOnly && roleGroupId !== 'PROVIDER') return false;
      return true;
    });
  }, [user]);

  const isReelsActive = false; // Disabled immersive mode for removed reels feed

  // 3. Route Sync: Listen for segment changes and sync PagerView
  useEffect(() => {
    // Expected Segments: ['(tabs)', 'nearby'] or similar
    let targetIndex = -1;
    if (segments.length >= 2 && segments[0] === '(tabs)') {
      const targetTab = segments[1];
      targetIndex = filteredTabs.findIndex(t => t.name === targetTab);
    } else if (segments.length === 1 && segments[0] === '(tabs)') {
      targetIndex = filteredTabs.findIndex(t => t.name === 'index');
    }

    if (targetIndex !== -1) {
      if (targetIndex !== activeIndex) {
        pagerRef.current?.setPage(targetIndex);
        setActiveIndex(targetIndex);
      }
      // Add to lazy set
      if (!renderedPages.has(targetIndex)) {
        setRenderedPages(prev => new Set([...Array.from(prev), targetIndex]));
      }
    }
  }, [segments, filteredTabs, renderedPages]);

  const onPageSelected = useCallback((e: any) => {
    const newIdx = e.nativeEvent.position;
    setActiveIndex(newIdx);
    if (!renderedPages.has(newIdx)) {
      setRenderedPages(prev => new Set([...Array.from(prev), newIdx]));
    }
  }, [renderedPages]);

  const goToPage = useCallback((index: number) => {
    pagerRef.current?.setPage(index);
    setActiveIndex(index);
    if (!renderedPages.has(index)) {
      setRenderedPages(prev => new Set([...Array.from(prev), index]));
    }
  }, [renderedPages]);

  // Helper to render the correct screen component
  const renderScreen = (name: string, index: number) => {
    // Zero-Latency Optimization: Only build the component if it has been visited
    if (!renderedPages.has(index)) {
      return (
        <View style={{ flex: 1, backgroundColor: theme.primary, justifyContent: 'center', alignItems: 'center' }}>
          {/* Extremely light placeholder to avoid bridge traffic */}
        </View>
      );
    }

    switch (name) {
      case 'index':   return <HomeScreen />;
      case 'explore': return <ExploreScreen />;
      case 'nearby':  return <NearbyScreen />;
      case 'reels':   return <ReelsScreen />;
      case 'jobs':    return <JobsScreen />;
      case 'chats':   return <ChatsScreen />;
      case 'profile': return <ProfileScreen />;
      default:        return <HomeScreen />;
    }
  };

  return (
    <View style={[
      styles.container, 
      { 
        backgroundColor: theme.background,
        paddingBottom: isReelsActive ? 0 : insets.bottom
      }
    ]}>
      {!isReelsActive && (
        <Sidebar 
          isOpen={isSidebarOpen} 
          onClose={() => setIsSidebarOpen(false)} 
        />
      )}

      <View 
        style={[
          styles.navbarOverlay,
          { display: isReelsActive ? 'none' : 'flex' }
        ]}
        pointerEvents="box-none"
      >
        <TopNavbar onMenuPress={() => setIsSidebarOpen(true)} />
      </View>

      <PagerView
        ref={pagerRef}
        style={styles.pager}
        initialPage={0}
        scrollEnabled={false}
        onPageSelected={onPageSelected}
        offscreenPageLimit={1}
        overdrag={false}
      >
        {filteredTabs.map((tab, idx) => (
          <View key={tab.name} style={styles.page}>
            {renderScreen(tab.name, idx)}
          </View>
        ))}
      </PagerView>

      <AnimatedTabBar
        activeIndex={activeIndex}
        tabs={filteredTabs}
        onTabPress={goToPage}
        hidden={isReelsActive}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  pager:     { flex: 1 },
  page:      { flex: 1 },
  navbarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
});
