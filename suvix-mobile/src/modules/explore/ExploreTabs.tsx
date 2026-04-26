import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import * as Haptics from 'expo-haptics';
import Animated, { 
  useAnimatedStyle, 
  interpolateColor,
  useDerivedValue,
  withTiming
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

export type ExploreTabType = 'All' | 'Editors' | 'Promoters' | 'Rental' | 'Singers' | 'YT Videos';

interface ExploreTabsProps {
  activeTab: ExploreTabType;
  onTabChange: (tab: ExploreTabType) => void;
  activeColor: string;
  isDarkHeader?: boolean;
}

const TABS: ExploreTabType[] = ['All', 'Editors', 'Promoters', 'Rental', 'Singers', 'YT Videos'];

export const ExploreTabs = ({ activeTab, onTabChange, activeColor, isDarkHeader }: ExploreTabsProps) => {
  const { isDarkMode, theme } = useTheme();

  const handlePress = (tab: ExploreTabType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onTabChange(tab);
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <TouchableOpacity 
              key={tab} 
              onPress={() => handlePress(tab)}
              activeOpacity={0.85}
              style={[
                styles.tab,
                isActive && { backgroundColor: 'white', shadowOpacity: 0.1 }
              ]}
            >
              <Text style={[
                styles.tabText, 
                { color: isActive ? activeColor : (isDarkMode || isDarkHeader) ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)' },
                isActive && { fontWeight: '900' }
              ]}>
                {tab}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 10,
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0,
    shadowRadius: 4,
    elevation: 0,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  }
});
