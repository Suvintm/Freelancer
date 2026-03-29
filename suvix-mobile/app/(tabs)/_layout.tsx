import React from 'react';
import { Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { AnimatedTabBar } from '../../src/components/AnimatedTabBar';
import { TopNavbar } from '../../src/components/TopNavbar';
import { useTheme } from '../../src/context/ThemeContext';

/**
 * PRODUCTION-GRADE TABS LAYOUT (Web Sync)
 * Integrates the Top and Bottom Navigation Bars globally.
 */
export default function TabsLayout() {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* 🚀 TOP NAVBAR - Global Across All Tabs */}
      <TopNavbar />

      <Tabs
        tabBar={(props) => <AnimatedTabBar {...props} />}
        screenOptions={{
          headerShown: false,
        }}
      >
        {/* 1. Dynamic Dashboard (Home) */}
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
          }}
        />

        {/* 2. Search & Discover */}
        <Tabs.Screen
          name="explore"
          options={{
            title: 'Explore',
          }}
        />

        {/* 3. Real-Time Nearby Creators */}
        <Tabs.Screen
          name="nearby"
          options={{
            title: 'Nearby',
          }}
        />

        {/* 4. Cinematic Short-Form Video (Center) */}
        <Tabs.Screen
          name="reels"
          options={{
            title: 'Reels',
          }}
        />

        {/* 5. Professional Project Board */}
        <Tabs.Screen
          name="jobs"
          options={{
            title: 'Jobs',
          }}
        />

        {/* 6. Instant Messaging */}
        <Tabs.Screen
          name="chats"
          options={{
            title: 'Chats',
          }}
        />

        {/* 7. Identity & Settings */}
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
          }}
        />

        {/* 8. Internal Dashboards (Hidden from Tab Bar) */}
        <Tabs.Screen
          name="client"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="editor"
          options={{
            href: null,
          }}
        />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
