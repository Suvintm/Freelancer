import React, { useRef, useState, useCallback, useMemo, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PagerView from 'react-native-pager-view';
import { useSegments } from 'expo-router';
import { useTheme } from '../../src/context/ThemeContext';
import { AnimatedTabBar } from '../../src/components/AnimatedTabBar';
import { TopNavbar } from '../../src/components/TopNavbar';
import { Sidebar } from '../../src/components/Sidebar';
import { AccountSwitcherSheet } from '../../src/components/shared/AccountSwitcherSheet';
import BottomSheet from '@gorhom/bottom-sheet';
import { useAuthStore } from '../../src/store/useAuthStore';
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
  const { theme, isDarkMode } = useTheme();
  const { user } = useAuthStore();
  const pagerRef = useRef<PagerView>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const activeIndexRef = useRef(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const segments = useSegments() as string[];

  // ── Account Switcher ───────────────────────────────────────────────────────
  const switcherSheetRef = useRef<BottomSheet>(null);
  const openSwitcher = useCallback(() => {
    switcherSheetRef.current?.expand();
  }, []);

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
  }, [user, ALL_TABS]);

  const isReelsActive = false; // Disabled immersive mode for removed reels feed

  // 3. Route Sync: Listen for segment changes and sync PagerView
  useEffect(() => {
    if (segments[0] !== '(tabs)') return;

    // Important: do not force 'index' when second segment is missing.
    // This avoids snapping back to Home after local tab presses.
    const targetTab = segments[1];
    if (!targetTab) return;

    const targetIndex = filteredTabs.findIndex((t) => t.name === targetTab);
    if (targetIndex === -1) return;

    if (targetIndex !== activeIndexRef.current) {
      pagerRef.current?.setPageWithoutAnimation(targetIndex);
      setActiveIndex(targetIndex);
      activeIndexRef.current = targetIndex;
    }
  }, [segments, filteredTabs]);

  const onPageSelected = useCallback((e: any) => {
    const newIdx = e.nativeEvent.position;
    setActiveIndex(newIdx);
    activeIndexRef.current = newIdx;
  }, []);

  const goToPage = useCallback((index: number) => {
    if (index === activeIndexRef.current) return;

    pagerRef.current?.setPageWithoutAnimation(index);
    setActiveIndex(index);
    activeIndexRef.current = index;
  }, []);

  // Helper to render the correct screen component
  const renderScreen = (name: string, index: number) => {
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
        <TopNavbar 
          onMenuPress={() => setIsSidebarOpen(true)} 
          onProfilePress={openSwitcher}
        />
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

      {/* 👥 Global Account Switcher */}
      <AccountSwitcherSheet
        sheetRef={switcherSheetRef}
        isDark={isDarkMode}
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
