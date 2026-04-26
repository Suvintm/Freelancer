import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/useAuthStore';

const { width } = Dimensions.get('window');

interface Tab {
  name: string;
  title: string;
}

interface AnimatedTabBarProps {
  activeIndex: number;
  tabs: Tab[];
  onTabPress: (index: number) => void;
  hidden?: boolean;
}

/**
 * PRODUCTION-GRADE ANIMATED TAB BAR
 */
import * as Haptics from 'expo-haptics';

import Animated, { 
  useAnimatedStyle, 
  withTiming, 
  interpolate 
} from 'react-native-reanimated';
import { useUIStore } from '../store/useUIStore';

export const AnimatedTabBar = ({ activeIndex, tabs, onTabPress, hidden }: AnimatedTabBarProps) => {
  const { theme, isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();
  const { isTabBarVisible } = useUIStore();
  
  const TAB_BAR_HEIGHT = 60 + insets.bottom;

  // ── Animation ─────────────────────────────────────────────────────────────
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { 
          translateY: withTiming(isTabBarVisible ? 0 : TAB_BAR_HEIGHT + 20, {
            duration: 300,
          }) 
        }
      ],
      opacity: withTiming(isTabBarVisible ? 1 : 0, {
        duration: 250,
      }),
    };
  });

  if (hidden) return null;

  const VISIBLE_TABS = (tabs || []).filter(t => !['client', 'editor'].includes(t.name));

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
        const { user } = useAuthStore.getState();
        return (
          <View style={[
            styles.avatarBorder, 
            { borderColor: isFocused ? color : 'transparent' }
          ]}>
            <Image 
              source={{ uri: user?.profilePicture || 'https://cdn-icons-png.flaticon.com/512/149/149071.png' }} 
              style={styles.tabAvatar} 
            />
          </View>
        );
      default:
        return <Ionicons name="apps-outline" size={size} color={color} />;
    }
  };

  const getDisplayLabel = (name: string, title: string) => {
    if (name === 'index') return 'Home';
    return title || name;
  };

  return (
    <Animated.View style={[
      styles.container, 
      { 
        backgroundColor: theme.tabBar,
        height: TAB_BAR_HEIGHT,
        paddingBottom: insets.bottom 
      },
      animatedStyle
    ]}>
      <View style={styles.row}>
        {VISIBLE_TABS.map((tab, index) => {
          const isFocused = activeIndex === index;
          const isReels = tab.name === 'reels';
          const color = isFocused ? activeColor : inactiveColor;
          const label = getDisplayLabel(tab.name, tab.title);

          return (
            <TouchableOpacity
              key={tab.name}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onTabPress(index);
              }}
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
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    borderTopWidth: 0,
    elevation: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
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
  tabAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  avatarBorder: {
    padding: 1.5,
    borderRadius: 14,
    borderWidth: 1.5,
  },
});
