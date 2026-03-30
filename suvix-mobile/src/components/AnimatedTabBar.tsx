import React, { useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, Dimensions, Platform } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');
const TAB_BAR_HEIGHT = Platform.OS === 'ios' ? 88 : 70;

/**
 * PRODUCTION-GRADE ANIMATED TAB BAR (Web Sync)
 * Replicates the 7-tab layout and Center-Floating Reels design from the web frontend.
 */
export const AnimatedTabBar = ({ state, descriptors, navigation }: BottomTabBarProps) => {
  const { theme, isDarkMode } = useTheme();
  
  // Shared value for the sliding cursor/indicator
  const translateX = useSharedValue(0);

  // STRICT FILTER: Only show the 7 primary SuviX tabs from the web app
  const visibleRoutes = state.routes.filter(route => 
    !['client', 'editor'].includes(route.name)
  );
  
  const TAB_COUNT = visibleRoutes.length;
  const TAB_WIDTH = width / TAB_COUNT;

  useEffect(() => {
    // Find the current index within the VISIBLE subset to position the indicator
    const visibleIndex = visibleRoutes.findIndex(route => route.name === state.routes[state.index].name);
    if (visibleIndex !== -1) {
      translateX.value = withSpring(visibleIndex * TAB_WIDTH, {
          damping: 20,
          stiffness: 150
      });
    }
  }, [state.index, state.routes, TAB_WIDTH, visibleRoutes, translateX]);

  const animatedIndicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    backgroundColor: '#10B981', // Emerald-500 from Web
  }));

  return (
    <View style={[styles.container, { backgroundColor: theme.tabBar, borderTopColor: theme.border }]}>
      {/* Dynamic Sliding Indicator */}
      <Animated.View style={[styles.indicator, animatedIndicatorStyle, { width: TAB_WIDTH }]} />

      <View style={styles.content}>
        {visibleRoutes.map((route) => {
          // Find the actual index in the top-level state for focusing/navigation
          const actualIndex = state.routes.findIndex(r => r.key === route.key);
          const isFocused = state.index === actualIndex;
          const { options } = descriptors[route.key];
          const label = options.title !== undefined ? options.title : route.name;

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

          const getIcon = () => {
            const color = isFocused ? '#10B981' : (isDarkMode ? '#FFF' : '#000');
            const size = 22;

            switch (route.name) {
              case 'index':
                return <Ionicons name={isFocused ? "home" : "home-outline"} size={size} color={color} />;
              case 'explore':
                return <Ionicons name={isFocused ? "search" : "search-outline"} size={size} color={color} />;
              case 'nearby':
                return <Ionicons name={isFocused ? "location" : "location-outline"} size={size} color={color} />;
              case 'reels':
                return (
                  <View style={styles.reelsContainer}>
                    <Ionicons name="play" size={26} color="#FFF" />
                  </View>
                );
              case 'jobs':
                return <Ionicons name={isFocused ? "briefcase" : "briefcase-outline"} size={size} color={color} />;
              case 'chats':
                return <Ionicons name={isFocused ? "chatbubbles" : "chatbubbles-outline"} size={size} color={color} />;
              case 'profile':
                return <Ionicons name={isFocused ? "person" : "person-outline"} size={size} color={color} />;
              default:
                return <Ionicons name="apps-outline" size={size} color={color} />;
            }
          };

          const isReels = route.name === 'reels';

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              style={styles.tabItem}
              activeOpacity={0.8}
            >
              <View style={isFocused ? styles.activeIcon : {}}>
                {getIcon()}
              </View>
              
              {!isReels && isFocused && (
                <Animated.Text style={[styles.label, { color: '#10B981' }]}>
                   {label === 'index' ? 'Home' : label}
                </Animated.Text>
              )}
              
              {isReels && (
                <Animated.Text style={[styles.label, { color: isFocused ? '#10B981' : (isDarkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)') }]}>
                   Reels
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
    zIndex: 10,
  },
  reelsContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -30,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  label: {
    fontSize: 9,
    fontWeight: '900',
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  activeIcon: {
    transform: [{ scale: 1.05 }],
  }
});
