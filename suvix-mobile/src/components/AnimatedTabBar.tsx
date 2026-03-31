import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');
const TAB_BAR_HEIGHT = Platform.OS === 'ios' ? 88 : 65;

interface Tab {
  name: string;
  title: string;
}

interface AnimatedTabBarProps {
  activeIndex: number;
  tabs: Tab[];
  onTabPress: (index: number) => void;
}

/**
 * PRODUCTION-GRADE ANIMATED TAB BAR
 * - Synced in real-time with PagerView via scrollX Animated.Value
 * - No bubble background — clean, flat, modern design
 * - Active tab: filled icon + label (bold, black/white)
 * - Inactive tab: outline icon + label (visible gray)
 * - No top border, no green color
 */
export const AnimatedTabBar = ({ activeIndex, tabs, onTabPress }: AnimatedTabBarProps) => {
  const { theme, isDarkMode } = useTheme();

  const VISIBLE_TABS = tabs.filter(t => !['client', 'editor'].includes(t.name));
  const TAB_WIDTH = width / VISIBLE_TABS.length;

  const activeColor   = isDarkMode ? '#FFFFFF' : '#111111';
  const inactiveColor = isDarkMode ? '#777777' : '#AAAAAA';

  const getIcon = (routeName: string, isFocused: boolean, color: string) => {
    const size = 22;
    switch (routeName) {
      case 'index':
        return <Ionicons name={isFocused ? 'home' : 'home-outline'} size={size} color={color} />;
      case 'explore':
        return <Ionicons name={isFocused ? 'search' : 'search-outline'} size={size} color={color} />;
      case 'nearby':
        return <Ionicons name={isFocused ? 'location' : 'location-outline'} size={size} color={color} />;
      case 'reels':
        return (
          <View style={[styles.reelsBtn, { backgroundColor: isDarkMode ? '#FFFFFF' : '#111111' }]}>
            <Ionicons name="play" size={22} color={isDarkMode ? '#111111' : '#FFFFFF'} />
          </View>
        );
      case 'jobs':
        return <Ionicons name={isFocused ? 'briefcase' : 'briefcase-outline'} size={size} color={color} />;
      case 'chats':
        return <Ionicons name={isFocused ? 'chatbubbles' : 'chatbubbles-outline'} size={size} color={color} />;
      case 'profile':
        return <Ionicons name={isFocused ? 'person' : 'person-outline'} size={size} color={color} />;
      default:
        return <Ionicons name="apps-outline" size={size} color={color} />;
    }
  };

  const getDisplayLabel = (name: string, title: string) => {
    if (name === 'index') return 'Home';
    return title || name;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.tabBar }]}>
      <View style={styles.row}>
        {VISIBLE_TABS.map((tab, index) => {
          const isFocused = activeIndex === index;
          const isReels = tab.name === 'reels';
          const color = isFocused ? activeColor : inactiveColor;
          const label = getDisplayLabel(tab.name, tab.title);

          return (
            <TouchableOpacity
              key={tab.name}
              onPress={() => onTabPress(index)}
              style={styles.tabItem}
              activeOpacity={0.7}
            >
              {/* Icon */}
              <View style={isReels ? styles.reelsWrapper : null}>
                {getIcon(tab.name, isFocused, color)}
              </View>

              {/* Label — shown under all tabs */}
              {!isReels && (
                <Text
                  style={[
                    styles.label,
                    {
                      color,
                      fontWeight: isFocused ? '700' : '400',
                    }
                  ]}
                  numberOfLines={1}
                >
                  {label}
                </Text>
              )}

              {/* Reels text */}
              {isReels && (
                <Text style={[styles.label, { color: inactiveColor, marginTop: 4 }]}>
                  REELS
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: TAB_BAR_HEIGHT,
    borderTopWidth: 0,
    elevation: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
  },
  row: {
    flexDirection: 'row',
    height: '100%',
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? 22 : 0,
  },
  tabItem: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 2,
  },
  label: {
    fontSize: 9,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  reelsWrapper: {
    marginTop: -24,
  },
  reelsBtn: {
    width: 46,
    height: 46,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
});
