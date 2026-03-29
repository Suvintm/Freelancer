import React, { useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, Dimensions, Platform } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');
const TAB_BAR_HEIGHT = Platform.OS === 'ios' ? 88 : 70;
const TAB_COUNT = 7;
const TAB_WIDTH = width / TAB_COUNT;

/**
 * PREMIUM ANIMATED TAB BAR
 * Standard React Navigation bottom tab bar replaced with a custom
 * animated version that replicates the SuviX Web App aesthetic.
 */
export const AnimatedTabBar = ({ state, descriptors, navigation }: BottomTabBarProps) => {
  const { theme, isDarkMode } = useTheme();
  
  // Shared value for the sliding cursor/indicator
  const translateX = useSharedValue(0);

  useEffect(() => {
    // Update indicator position whenever the active route index changes
    translateX.value = withSpring(state.index * TAB_WIDTH, {
        damping: 20,
        stiffness: 150
    });
  }, [state.index, translateX]);

  const animatedIndicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    backgroundColor: theme.text,
  }));

  return (
    <View style={[styles.container, { backgroundColor: theme.tabBar, borderTopColor: theme.border }]}>
      {/* Sliding Underline Indicator */}
      <Animated.View style={[styles.indicator, animatedIndicatorStyle, { width: TAB_WIDTH }]} />

      <View style={styles.content}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          // Icon Mapping based on Web App
          const getIcon = () => {
            const color = isFocused ? theme.text : theme.textSecondary;
            const size = 24;

            switch (route.name) {
              case 'index':
                return <Ionicons name={isFocused ? "home" : "home-outline"} size={size} color={color} />;
              case 'explore':
                return <Ionicons name={isFocused ? "search" : "search-outline"} size={size} color={color} />;
              case 'nearby':
                return <Ionicons name={isFocused ? "location" : "location-outline"} size={size} color={color} />;
              case 'reels':
                // SPECIAL CENTER REELS ICON (Floating Look)
                return (
                  <View style={[styles.reelsContainer, { backgroundColor: isDarkMode ? '#111' : '#EEE' }]}>
                    <MaterialCommunityIcons name="movie-play" size={30} color={isFocused ? theme.accent : theme.text} />
                  </View>
                );
              case 'jobs':
                return <Ionicons name={isFocused ? "briefcase" : "briefcase-outline"} size={size} color={color} />;
              case 'chats':
                return <Ionicons name={isFocused ? "chatbubbles" : "chatbubbles-outline"} size={size} color={color} />;
              case 'profile':
                return <Ionicons name={isFocused ? "person" : "person-outline"} size={size} color={color} />;
              default:
                return null;
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              style={styles.tabItem}
              activeOpacity={0.7}
            >
              <Animated.View style={isFocused ? styles.activeIcon : {}}>
                {getIcon()}
              </Animated.View>
              
              {isFocused && route.name !== 'reels' && (
                <Animated.Text style={[styles.label, { color: theme.text }]}>
                  {route.name === 'index' ? 'Home' : route.name.charAt(0).toUpperCase() + route.name.slice(1)}
                </Animated.Text>
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
    borderTopWidth: 1,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  content: {
    flexDirection: 'row',
    height: '100%',
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? 20 : 0,
  },
  tabItem: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  indicator: {
    position: 'absolute',
    top: 0,
    height: 3,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
  },
  reelsContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -25, // Pop effect
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
    marginTop: 4,
    textTransform: 'capitalize',
  },
  activeIcon: {
    transform: [{ scale: 1.1 }],
  }
});
