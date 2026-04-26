import React, { useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Dimensions, 
  TouchableWithoutFeedback,
  Platform,
  Image,
  ScrollView
} from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withSpring,
  withDelay,
  Easing
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/useAuthStore';
import { useTheme } from '../context/ThemeContext';
import { Colors } from '../constants/Colors';
import { useRouter, useSegments } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');
const SIDEBAR_WIDTH = width * 0.82;

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const { user, logout } = useAuthStore();
  const { isDarkMode, theme } = useTheme();
  const router = useRouter();
  const segments = useSegments();
  
  const translateX = useSharedValue(-SIDEBAR_WIDTH);
  const backdropOpacity = useSharedValue(0);
  const itemOpacity = useSharedValue(0);
  const itemTranslateX = useSharedValue(-20);

  useEffect(() => {
    if (isOpen) {
      translateX.value = withSpring(0, { damping: 20, stiffness: 100 });
      backdropOpacity.value = withTiming(1, { duration: 400 });
      itemOpacity.value = withDelay(200, withTiming(1, { duration: 500 }));
      itemTranslateX.value = withDelay(200, withSpring(0));
    } else {
      translateX.value = withTiming(-SIDEBAR_WIDTH, { duration: 300 });
      backdropOpacity.value = withTiming(0, { duration: 300 });
      itemOpacity.value = withTiming(0, { duration: 200 });
      itemTranslateX.value = withTiming(-20, { duration: 200 });
    }
  }, [isOpen]);

  const animatedSidebarStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const animatedBackdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const handleNavigate = (path: string) => {
    onClose();
    setTimeout(() => {
      router.push(path as any);
    }, 200);
  };

  const palette = isDarkMode ? Colors.dark : Colors.light;

  const NAV_SECTIONS = [
    {
      label: 'GENERAL',
      items: [
        { icon: 'grid-outline', label: 'Dashboard', path: '/(tabs)' },
        { icon: 'compass-outline', label: 'Discovery', path: '/(tabs)/explore' },
        { icon: 'film-outline', label: 'Reels Feed', path: '/(tabs)/reels' },
      ]
    },
    {
      label: 'MANAGEMENT',
      items: [
        { icon: 'briefcase-outline', label: 'My Projects', path: '/(tabs)/jobs' },
        { icon: 'chatbubbles-outline', label: 'Messages', path: '/(tabs)/chats' },
        { icon: 'wallet-outline', label: 'Payments', path: '/settings' },
      ]
    },
    {
      label: 'SYSTEM',
      items: [
        { icon: 'settings-outline', label: 'Settings', path: '/settings' },
        { icon: 'shield-checkmark-outline', label: 'Security', path: '/settings' },
        { icon: 'help-circle-outline', label: 'Help & Support', path: '/settings' },
      ]
    }
  ];

  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 1000 }]} pointerEvents={isOpen ? 'auto' : 'none'}>
      {/* 🌑 ADAPTIVE BACKDROP */}
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={[styles.backdrop, animatedBackdropStyle]} />
      </TouchableWithoutFeedback>

      {/* 💎 ELITE PANE */}
      <Animated.View style={[styles.sidebar, animatedSidebarStyle, { borderRightWidth: 1, borderRightColor: palette.border }]}>
        <BlurView 
          intensity={isDarkMode ? 80 : 100} 
          tint={isDarkMode ? 'dark' : 'light'} 
          style={StyleSheet.absoluteFill} 
        />
        
        <View style={[styles.flex1, { paddingTop: Platform.OS === 'ios' ? 50 : 20 }]}>
          {/* 👤 PRO PERSONA HEADER */}
          <View style={styles.header}>
            <LinearGradient
              colors={isDarkMode ? ['rgba(139, 92, 246, 0.15)', 'transparent'] : ['rgba(139, 92, 246, 0.05)', 'transparent']}
              style={styles.headerGlow}
            />
            <View style={styles.profileMain}>
               <View style={styles.avatarWrapper}>
                  <Image 
                    source={{ uri: user?.profilePicture || 'https://cdn-icons-png.flaticon.com/512/149/149071.png' }} 
                    style={[styles.avatar, { borderColor: palette.accent }]} 
                  />
                  <View style={[styles.statusIndicator, { backgroundColor: '#22c55e' }]} />
               </View>
               <View style={styles.profileText}>
                  <Text style={[styles.userName, { color: palette.text }]} numberOfLines={1}>
                    {user?.name || 'User Persona'}
                  </Text>
                  <View style={styles.roleRow}>
                    <Ionicons name="sparkles" size={12} color={palette.accent} />
                    <Text style={[styles.roleText, { color: palette.accent }]}>
                      {user?.primaryRole?.categoryName?.toUpperCase() || 'ELITE MEMBER'}
                    </Text>
                  </View>
               </View>
            </View>
          </View>

          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
            {NAV_SECTIONS.map((section, sIdx) => (
              <View key={section.label} style={styles.section}>
                <Text style={[styles.sectionLabel, { color: palette.textSecondary }]}>{section.label}</Text>
                {section.items.map((item, iIdx) => (
                  <SidebarItem 
                    key={item.label}
                    icon={item.icon} 
                    label={item.label} 
                    onPress={() => handleNavigate(item.path)} 
                    color={palette.text}
                    index={sIdx * 3 + iIdx}
                    isOpen={isOpen}
                    active={segments.includes(item.label.toLowerCase())}
                  />
                ))}
              </View>
            ))}
          </ScrollView>

          {/* 🔘 SYSTEM ACTIONS FOOTER */}
          <View style={[styles.footer, { borderTopColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
            <TouchableOpacity 
              onPress={logout} 
              style={[styles.logoutBtn, { backgroundColor: isDarkMode ? 'rgba(239, 68, 68, 0.1)' : '#FEF2F2' }]}
            >
              <Feather name="log-out" size={18} color="#EF4444" />
              <Text style={styles.logoutText}>End Session</Text>
            </TouchableOpacity>
            <View style={styles.versionRow}>
              <Text style={[styles.versionText, { color: palette.textSecondary }]}>SuviX Workspace v1.2</Text>
              <View style={styles.dot} />
              <Text style={[styles.versionText, { color: palette.textSecondary }]}>Enterprise</Text>
            </View>
          </View>
        </View>
      </Animated.View>
    </View>
  );
};

const SidebarItem = ({ icon, label, onPress, color, index, isOpen, active }: any) => {
  const opacity = useSharedValue(0);
  const translateX = useSharedValue(-15);

  useEffect(() => {
    if (isOpen) {
      opacity.value = withDelay(150 + index * 40, withTiming(1, { duration: 400 }));
      translateX.value = withDelay(150 + index * 40, withSpring(0, { damping: 15 }));
    } else {
      opacity.value = withTiming(0, { duration: 200 });
      translateX.value = withTiming(-15, { duration: 200 });
    }
  }, [isOpen]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <TouchableOpacity 
        style={[styles.navItem, active && styles.activeNavItem]} 
        onPress={onPress} 
        activeOpacity={0.7}
      >
        <View style={styles.navIconWrapper}>
          <Ionicons name={icon} size={20} color={active ? Colors.accent : color} />
        </View>
        <Text style={[styles.navLabel, { color: active ? Colors.accent : color, fontWeight: active ? '800' : '600' }]}>
          {label}
        </Text>
        {active && <View style={styles.activeIndicator} />}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  flex1: { flex: 1 },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  sidebar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: SIDEBAR_WIDTH,
    zIndex: 101,
    overflow: 'hidden',
  },
  header: {
    padding: 24,
    paddingTop: 32,
    position: 'relative',
  },
  headerGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 150,
  },
  profileMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 22,
    borderWidth: 2,
  },
  statusIndicator: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#000',
  },
  profileText: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  roleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  roleText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  scroll: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginLeft: 12,
    marginBottom: 12,
    opacity: 0.5,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginBottom: 2,
  },
  activeNavItem: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
  },
  navIconWrapper: {
    width: 32,
    alignItems: 'center',
  },
  navLabel: {
    flex: 1,
    fontSize: 15,
    marginLeft: 12,
  },
  activeIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.accent,
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
    gap: 16,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 18,
    gap: 10,
  },
  logoutText: {
    color: '#EF4444',
    fontSize: 15,
    fontWeight: '800',
  },
  versionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(150,150,150,0.3)',
  },
  versionText: {
    fontSize: 11,
    fontWeight: '600',
    opacity: 0.4,
  }
});
