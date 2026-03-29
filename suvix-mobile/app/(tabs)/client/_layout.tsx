import React from 'react';
import { Tabs } from 'expo-router';
import { AnimatedTabBar } from '../../../src/components/AnimatedTabBar';

/**
 * CLIENT TABS LAYOUT
 * Identical 7-tab structure as Editor, matching the web app.
 */
export default function ClientTabLayout() {
  return (
    <Tabs
      tabBar={(props) => <AnimatedTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        animation: 'fade',
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="explore" options={{ title: 'Explore' }} />
      <Tabs.Screen name="nearby" options={{ title: 'Nearby' }} />
      <Tabs.Screen name="reels" options={{ title: 'Reels' }} />
      <Tabs.Screen name="jobs" options={{ title: 'Jobs' }} />
      <Tabs.Screen name="chats" options={{ title: 'Chats' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
