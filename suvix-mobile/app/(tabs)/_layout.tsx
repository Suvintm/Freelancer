import React, { useRef, useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import PagerView from 'react-native-pager-view';
import { useTheme } from '../../src/context/ThemeContext';
import { AnimatedTabBar } from '../../src/components/AnimatedTabBar';
import { TopNavbar } from '../../src/components/TopNavbar';
import { Sidebar } from '../../src/components/Sidebar';

// Screens
import HomeScreen from './index';
import ExploreScreen from './explore';
import NearbyScreen from './nearby';
import ReelsScreen from './reels';
import JobsScreen from './jobs';
import ChatsScreen from './chats';
import ProfileScreen from './profile';

/**
 * PRODUCTION-GRADE SWIPE TAB LAYOUT
 * Supports a premium animated sidebar and 60fps swipeable tabs.
 */

// Tab configuration — order MUST match PagerView page order
const TABS = [
  { name: 'index',   title: 'Home'    },
  { name: 'explore', title: 'Explore' },
  { name: 'nearby',  title: 'Nearby'  },
  { name: 'reels',   title: 'Reels'   }, // index 3 — swipe disabled
  { name: 'jobs',    title: 'Jobs'    },
  { name: 'chats',   title: 'Chats'   },
  { name: 'profile', title: 'Profile' },
];

const REELS_INDEX = 3;

export default function TabsLayout() {
  const { theme } = useTheme();
  const pagerRef = useRef<PagerView>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Called when a page fully settles after swipe or tap
  const onPageSelected = useCallback((e: any) => {
    setActiveIndex(e.nativeEvent.position);
  }, []);

  // Tab bar tap → jump to that page instantly
  const goToPage = useCallback((index: number) => {
    pagerRef.current?.setPage(index);
    setActiveIndex(index);
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Sidebar Overlay */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />

      {/* Top Navbar */}
      <TopNavbar onMenuPress={() => setIsSidebarOpen(true)} />

      {/* Native Swipe Pager — runs on native thread for 60fps */}
      <PagerView
        ref={pagerRef}
        style={styles.pager}
        initialPage={0}
        scrollEnabled={activeIndex !== REELS_INDEX}
        onPageSelected={onPageSelected}
        offscreenPageLimit={2}
        overdrag={false}
      >
        {/* Each child is one page — order must match TABS array above */}
        <View key="0" style={styles.page}><HomeScreen /></View>
        <View key="1" style={styles.page}><ExploreScreen /></View>
        <View key="2" style={styles.page}><NearbyScreen /></View>
        <View key="3" style={styles.page}><ReelsScreen /></View>
        <View key="4" style={styles.page}><JobsScreen /></View>
        <View key="5" style={styles.page}><ChatsScreen /></View>
        <View key="6" style={styles.page}><ProfileScreen /></View>
      </PagerView>

      {/* Bottom Tab Bar */}
      <AnimatedTabBar
        activeIndex={activeIndex}
        tabs={TABS}
        onTabPress={goToPage}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  pager:     { flex: 1 },
  page:      { flex: 1 },
});
