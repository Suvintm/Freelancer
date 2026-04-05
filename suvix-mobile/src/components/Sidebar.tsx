import React, { useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Dimensions, 
  TouchableWithoutFeedback,
  Platform,
  Image
} from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withSpring,
} from 'react-native-reanimated';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/useAuthStore';
import { useTheme } from '../context/ThemeContext';
import { Colors } from '../constants/Colors';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');
const SIDEBAR_WIDTH = width * 0.75;

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * PRODUCTION-GRADE ANIMATED SIDEBAR
 * - Uses Reanimated for 60fps sliding & opacity transitions.
 * - Profile header with role badge.
 * - Navigation links inspired by premium dashboards.
 * - Fixed Logout button at bottom.
 */
export const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const { user, logout } = useAuthStore();
  const { isDarkMode, theme } = useTheme();
  const router = useRouter();
  
  const translateX = useSharedValue(-SIDEBAR_WIDTH);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (isOpen) {
      translateX.value = withSpring(0, { damping: 20, stiffness: 90 });
      opacity.value = withTiming(1, { duration: 300 });
    } else {
      translateX.value = withTiming(-SIDEBAR_WIDTH, { duration: 300 });
      opacity.value = withTiming(0, { duration: 300 });
    }
  }, [isOpen, translateX, opacity, SIDEBAR_WIDTH]);

  const animatedSidebarStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const animatedBackdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    pointerEvents: isOpen ? 'auto' : 'none',
  }));

  const handleNavigate = (path: string) => {
    onClose();
    // Allow animation to finish before navigation if needed
    setTimeout(() => {
      router.push(path as any);
    }, 100);
  };

  const palette = isDarkMode ? Colors.dark : Colors.light;

  return (
    <>
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, animatedBackdropStyle]}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.flex1} />
        </TouchableWithoutFeedback>
      </Animated.View>

      {/* Sidebar Content */}
      <Animated.View style={[
        styles.sidebar, 
        { backgroundColor: palette.secondary, borderColor: palette.border },
        animatedSidebarStyle
      ]}>
        
        {/* Header / Profile */}
        <View style={[styles.header, { borderBottomColor: palette.border }]}>
          <View style={styles.profileRow}>
             <Image 
                source={{ uri: user?.profilePicture || 'https://cdn-icons-png.flaticon.com/512/149/149071.png' }} 
                style={[styles.avatar, { borderColor: Colors.accent }]} 
              />
             <View style={styles.profileInfo}>
                <Text style={[styles.userName, { color: palette.text }]}>{user?.name || 'User'}</Text>
                <View style={[styles.roleBadge, { backgroundColor: isDarkMode ? 'rgba(34, 197, 94, 0.2)' : 'rgba(34, 197, 94, 0.1)' }]}>
                  <Text style={styles.roleText}>{user?.role?.toUpperCase() || 'CLIENT'}</Text>
                </View>
             </View>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color={palette.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Navigation Items */}
        <View style={styles.navContainer}>
          <SidebarItem 
            icon="grid-outline" 
            label="Dashboard" 
            onPress={() => handleNavigate('/(tabs)')} 
            color={palette.text}
          />
          <SidebarItem 
            icon="person-outline" 
            label="My Profile" 
            onPress={() => handleNavigate('/(tabs)/profile')} 
            color={palette.text}
          />
          <SidebarItem 
            icon="briefcase-outline" 
            label="My Projects" 
            onPress={() => handleNavigate('/(tabs)/jobs')} 
            color={palette.text}
          />
          <SidebarItem 
            icon="chatbubbles-outline" 
            label="Messages" 
            onPress={() => handleNavigate('/(tabs)/chats')} 
            color={palette.text}
          />
          <SidebarItem 
            icon="settings-outline" 
            label="Settings" 
            onPress={() => {}} 
            color={palette.text}
          />
        </View>

        {/* Footer with Logout */}
        <View style={[styles.footer, { borderTopColor: palette.border }]}>
          <TouchableOpacity 
            onPress={logout} 
            style={[styles.logoutBtn, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}
          >
            <Feather name="log-out" size={18} color={Colors.error} />
            <Text style={styles.logoutText}>Logout Session</Text>
          </TouchableOpacity>
          <Text style={[styles.versionText, { color: palette.textSecondary }]}>v1.0.0 Production Build</Text>
        </View>

      </Animated.View>
    </>
  );
};

const SidebarItem = ({ icon, label, onPress, color }: any) => (
  <TouchableOpacity style={styles.navItem} onPress={onPress} activeOpacity={0.6}>
    <View style={styles.navIconWrapper}>
      <Ionicons name={icon} size={22} color={color} />
    </View>
    <Text style={[styles.navLabel, { color }]}>{label}</Text>
    <Feather name="chevron-right" size={14} color="rgba(128, 128, 128, 0.4)" />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  flex1: { flex: 1 },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    zIndex: 100,
  },
  sidebar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: SIDEBAR_WIDTH,
    zIndex: 101,
    borderRightWidth: 1,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
  },
  header: {
    padding: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    marginBottom: 10,
  },
  profileRow: {
    gap: 12,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 20,
    borderWidth: 2,
  },
  profileInfo: {
    marginTop: 12,
  },
  userName: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  roleText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.accent,
    letterSpacing: 0.5,
  },
  closeBtn: {
    padding: 4,
  },
  navContainer: {
    flex: 1,
    padding: 16,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 14,
    marginBottom: 4,
  },
  navIconWrapper: {
    width: 32,
    alignItems: 'center',
  },
  navLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 12,
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
    borderRadius: 16,
    gap: 10,
  },
  logoutText: {
    color: Colors.error,
    fontSize: 15,
    fontWeight: '700',
  },
  versionText: {
    textAlign: 'center',
    fontSize: 11,
    opacity: 0.5,
  }
});
