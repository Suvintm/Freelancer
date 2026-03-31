import React from 'react';
import { View, StyleSheet, Image, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/useAuthStore';
import { useTheme } from '../context/ThemeContext';
import { Colors } from '../constants/Colors';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Modern rounded hamburger menu icon */
const RoundedMenuIcon = ({ color }: { color: string }) => (
  <View style={{ gap: 5, width: 22, justifyContent: 'center' }}>
    <View style={{ width: 22, height: 2.5, borderRadius: 99, backgroundColor: color }} />
    <View style={{ width: 15, height: 2.5, borderRadius: 99, backgroundColor: color }} />
    <View style={{ width: 22, height: 2.5, borderRadius: 99, backgroundColor: color }} />
  </View>
);

interface TopNavbarProps {
  onMenuPress: () => void;
}

export const TopNavbar = ({ onMenuPress }: TopNavbarProps) => {
  const { user } = useAuthStore();
  const { isDarkMode, toggleTheme } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleRefresh = () => {
    // Subtle visual indicator of refresh could be added here
    console.log('Refreshing content...');
  };

  return (
    <View style={[
      styles.container, 
      { 
        backgroundColor: isDarkMode ? 'rgba(5, 5, 9, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        paddingTop: Math.max(insets.top, 10),
        height: Math.max(insets.top, 20) + 50
      }
    ]}>
      {/* LEFT: Modern Rounded Menu Icon */}
      <TouchableOpacity 
        style={styles.iconButton} 
        onPress={onMenuPress}
        activeOpacity={0.7}
      >
        <RoundedMenuIcon color={isDarkMode ? '#FFF' : '#000'} />
      </TouchableOpacity>

      {/* CENTER: Branded Logo (includes name, no separate text needed) */}
      <View 
        style={[
          styles.logoContainer, 
          { paddingTop: Math.max(insets.top, 10) }
        ]} 
        pointerEvents="none"
      >
        {isDarkMode ? (
          <Image 
            source={require('../../assets/darklogo.png')} 
            style={styles.logoDark} 
            resizeMode="contain" 
          />
        ) : (
          <Image 
            source={require('../../assets/lightlogo.png')} 
            style={styles.logoLight} 
            resizeMode="contain" 
          />
        )}
      </View>

      {/* RIGHT: Actions */}
      <View style={styles.rightSection}>
        {/* Refresh Button */}
        <TouchableOpacity style={styles.actionButton} onPress={handleRefresh} activeOpacity={0.7}>
          <Ionicons name="refresh-outline" size={22} color={isDarkMode ? '#888' : '#666'} />
        </TouchableOpacity>

        {/* Theme Toggle */}
        <TouchableOpacity style={styles.actionButton} onPress={toggleTheme} activeOpacity={0.7}>
          <Ionicons 
            name={isDarkMode ? "sunny-outline" : "moon-outline"} 
            size={22} 
            color={isDarkMode ? Colors.accent : '#666'} 
          />
        </TouchableOpacity>

        {/* Profile Pic */}
        <TouchableOpacity 
          style={styles.profileButton} 
          onPress={() => router.push('/(tabs)/profile')}
          activeOpacity={0.7}
        >
          <Image 
            source={{ uri: user?.profilePicture || 'https://cdn-icons-png.flaticon.com/512/149/149071.png' }} 
            style={[styles.profilePic, { borderColor: '#10B981' }]} 
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    zIndex: 50,
  },
  iconButton: {
    padding: 8,
  },
  logoContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: -1, // Ensure buttons stay on top
  },
  // Dark mode logo
  logoDark: {
    width: 130,
    height: 38,
  },
  // Light mode logo
  logoLight: {
    width: 130,
    height: 38,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginRight: 2,
  },
  profileButton: {
    marginLeft: 6,
  },
  profilePic: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
  },
});
