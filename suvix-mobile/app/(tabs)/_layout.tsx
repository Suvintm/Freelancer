import React, { useRef, useState, useCallback, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PagerView from 'react-native-pager-view';
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const insets = useSafeAreaInsets();

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
    // Default to 'editor' (Provider) if no role found
    const categoryId = user?.categoryId as CategoryId | undefined;
    const roleGroupId = categoryId && CATEGORIES[categoryId] 
      ? CATEGORIES[categoryId].roleGroupId 
      : (user?.role === 'client' ? 'CLIENT' : 'PROVIDER');
    
    return ALL_TABS.filter(tab => {
      if (tab.providerOnly && roleGroupId !== 'PROVIDER') return false;
      return true;
    });
  }, [user]);

  const reelsIndex = useMemo(() => filteredTabs.findIndex(t => t.name === 'reels'), [filteredTabs]);
  const isReelsActive = false; // Disabled immersive mode for removed reels feed

  const onPageSelected = useCallback((e: any) => {
    setActiveIndex(e.nativeEvent.position);
  }, []);

  const goToPage = useCallback((index: number) => {
    pagerRef.current?.setPage(index);
    setActiveIndex(index);
  }, []);

  // Helper to render the correct screen component
  const renderScreen = (name: string) => {
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

      <View style={[
        styles.navbarOverlay,
        { display: isReelsActive ? 'none' : 'flex' }
      ]}>
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
        {filteredTabs.map((tab) => (
          <View key={tab.name} style={styles.page}>
            {renderScreen(tab.name)}
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
