import React from 'react';
import { Tabs } from 'expo-router';
import { AnimatedTabBar } from '../../../src/components/AnimatedTabBar';

/**
 * EDITOR TABS LAYOUT
 * Uses the custom AnimatedTabBar to replicate the web experience.
 * Configured with the exact 7 items: Home, Explore, Nearby, Reels, Jobs, Chats, Profile.
 */
export default function EditorTabLayout() {
  return (
    <Tabs
      tabBar={(props) => <AnimatedTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        animation: 'fade',
      }}
    >
      <Tabs.Screen 
        name="index" 
        options={{ title: 'Home' }} 
      />
      <Tabs.Screen 
        name="explore" 
        options={{ title: 'Explore' }} 
      />
      <Tabs.Screen 
        name="nearby" 
        options={{ title: 'Nearby' }} 
      />
      <Tabs.Screen 
        name="reels" 
        options={{ title: 'Reels' }} 
      />
      <Tabs.Screen 
        name="jobs" 
        options={{ title: 'Jobs' }} 
      />
      <Tabs.Screen 
        name="chats" 
        options={{ title: 'Chats' }} 
      />
      <Tabs.Screen 
        name="profile" 
        options={{ title: 'Profile' }} 
      />
    </Tabs>
  );
}
