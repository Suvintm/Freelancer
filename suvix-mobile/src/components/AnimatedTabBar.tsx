import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Dimensions, 
  Image, 
  Modal, 
  TouchableWithoutFeedback 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/useAuthStore';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';

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

import Animated, { 
  useAnimatedStyle, 
  withTiming 
} from 'react-native-reanimated';
import { useUIStore } from '../store/useUIStore';

export const AnimatedTabBar = ({ activeIndex, tabs, onTabPress, hidden }: AnimatedTabBarProps) => {
  const { theme, isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isTabBarVisible } = useUIStore();
  const [isUploadSheetOpen, setIsUploadSheetOpen] = useState(false);
  
  const TAB_BAR_HEIGHT = 64;
  const BOTTOM_OFFSET = 24 + insets.bottom / 2; // Positions beautifully floating above the home indicators

  // ── Animation: Sliding/Fading tab bar on scroll ─────────────────────────────
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { 
          translateY: withTiming(isTabBarVisible ? 0 : TAB_BAR_HEIGHT + BOTTOM_OFFSET + 20, {
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

  const activeColor   = '#FFFFFF';
  const inactiveColor = '#888888';

  const getIcon = (routeName: string, isFocused: boolean, color: string) => {
    const size = isFocused ? 20 : 22;
    switch (routeName) {
      case 'index':
        return <Ionicons name={isFocused ? 'home' : 'home-outline'} size={size} color={color} />;
      case 'explore':
        return <Ionicons name={isFocused ? 'search' : 'search-outline'} size={size} color={color} />;
      case 'upload':
        return <Ionicons name={isFocused ? 'add-circle' : 'add-circle-outline'} size={size} color={color} />;
      case 'nearby':
        return <Ionicons name={isFocused ? 'location' : 'location-outline'} size={size} color={color} />;
      case 'reels':
        return <Ionicons name={isFocused ? 'play-circle' : 'play-circle-outline'} size={size} color={color} />;
      case 'jobs':
        return <Ionicons name={isFocused ? 'briefcase' : 'briefcase-outline'} size={size} color={color} />;
      case 'chats':
        return <Ionicons name={isFocused ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline'} size={size} color={color} />;
      case 'profile':
        const { user } = useAuthStore.getState();
        return (
          <View style={[
            styles.avatarBorder, 
            { borderColor: isFocused ? '#FFFFFF' : 'transparent' }
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
    <>
      <Animated.View style={[
        styles.container, 
        { 
          bottom: BOTTOM_OFFSET,
          backgroundColor: '#000000', // 🌟 Always solid black!
          borderColor: 'rgba(255,255,255,0.18)',
          shadowColor: '#000000',
        },
        animatedStyle
      ]}>
        <View style={styles.row}>
          {VISIBLE_TABS.map((tab, index) => {
            const isFocused = activeIndex === index;
            const color = isFocused ? activeColor : inactiveColor;
            const label = getDisplayLabel(tab.name, tab.title);

            return (
              <TouchableOpacity
                key={tab.name}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  if (tab.name === 'upload') {
                    setIsUploadSheetOpen(true);
                  } else {
                    onTabPress(index);
                  }
                }}
                style={[
                  styles.tabItem,
                  isFocused && tab.name !== 'upload' && { 
                    backgroundColor: '#2A2A2A', // 🌟 Always dark grey capsule!
                    flexGrow: 1.5,
                    paddingHorizontal: 12,
                  }
                ]}
                activeOpacity={0.8}
              >
                {/* Icon */}
                {getIcon(tab.name, isFocused, color)}

                {/* Label - Rendered horizontally next to icon only if focused */}
                {isFocused && tab.name !== 'upload' && (
                  <Text
                    style={[
                      styles.label,
                      { color: activeColor }
                    ]}
                    numberOfLines={1}
                  >
                    {label}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </Animated.View>

      {/* 🌟 CUSTOM ELEVATED UPLOAD BOTTOM SHEET MODAL */}
      <Modal
        visible={isUploadSheetOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsUploadSheetOpen(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIsUploadSheetOpen(false)}>
          <View style={styles.modalBackdrop}>
            <TouchableWithoutFeedback>
              <View style={[styles.bottomSheet, { paddingBottom: insets.bottom + 24 }]}>
                {/* Drag Handle Indicator */}
                <View style={styles.dragHandle} />

                {/* Title Section */}
                <View style={styles.sheetHeader}>
                  <Text style={styles.sheetTitle}>Create Content</Text>
                  <TouchableOpacity 
                    onPress={() => setIsUploadSheetOpen(false)}
                    style={styles.closeButton}
                  >
                    <Ionicons name="close" size={20} color="#888" />
                  </TouchableOpacity>
                </View>

                {/* Option 1: Upload Post / Reel */}
                <TouchableOpacity 
                  onPress={() => {
                    setIsUploadSheetOpen(false);
                    router.push('/create-post');
                  }}
                  style={styles.optionButton}
                >
                  <View style={[styles.iconContainer, { backgroundColor: '#3b82f6' }]}>
                    <Ionicons name="image" size={20} color="#FFF" />
                  </View>
                  <View style={styles.optionTextContainer}>
                    <Text style={styles.optionTitle}>Upload Post / Reel</Text>
                    <Text style={styles.optionSubtitle}>Share images or short-form videos</Text>
                  </View>
                </TouchableOpacity>

                {/* Option 2: Sync YouTube Videos */}
                <TouchableOpacity 
                  onPress={() => {
                    setIsUploadSheetOpen(false);
                    router.push('/youtube-connect');
                  }}
                  style={[styles.optionButton, { marginTop: 8 }]}
                >
                  <View style={[styles.iconContainer, { backgroundColor: '#ef4444' }]}>
                    <Ionicons name="play-circle" size={20} color="#FFF" />
                  </View>
                  <View style={styles.optionTextContainer}>
                    <Text style={styles.optionTitle}>Upload YT Videos</Text>
                    <Text style={styles.optionSubtitle}>Link or sync your YouTube videos</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    elevation: 12,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  tabItem: {
    height: 46,
    width: 46,
    borderRadius: 23,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 8,
    letterSpacing: 0.2,
  },
  tabAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  avatarBorder: {
    padding: 1,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  // Modal Bottom Sheet Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: '#0d0d10',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: '#1f1f2e',
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  dragHandle: {
    width: 40,
    height: 5,
    backgroundColor: '#2A2A2A',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: 0.3,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1C1C1E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121215',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1c1c1e',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionTextContainer: {
    marginLeft: 14,
    flex: 1,
  },
  optionTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#FFF',
  },
  optionSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
});
