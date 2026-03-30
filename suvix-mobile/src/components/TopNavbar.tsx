import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/useAuthStore';
import { useTheme } from '../context/ThemeContext';
import { Colors } from '../constants/Colors';
import { useRouter } from 'expo-router';

/**
 * PRODUCTION-GRADE TOP NAVBAR (Web Sync)
 * Replicates the Logo, Refresh, and Profile integration from the web dashboard.
 */
export const TopNavbar = () => {
  const { user } = useAuthStore();
  const { isDarkMode, toggleTheme } = useTheme();
  const router = useRouter();

  const handleRefresh = () => {
    // Subtle visual indicator of refresh could be added here
    console.log('Refreshing content...');
  };

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? 'rgba(5, 5, 9, 0.95)' : 'rgba(255, 255, 255, 0.95)', borderBottomColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }]}>
      {/* LEFT: Sidebar Toggle */}
      <TouchableOpacity style={styles.iconButton} activeOpacity={0.7}>
        <Ionicons name="menu-outline" size={26} color={isDarkMode ? '#FFF' : '#000'} />
      </TouchableOpacity>

      {/* CENTER: Logo */}
      <TouchableOpacity 
        style={styles.logoContainer} 
        onPress={() => router.push('/(tabs)')}
        activeOpacity={0.8}
      >
        <Image 
          source={require('../../assets/logo.png')} 
          style={styles.logo} 
          resizeMode="contain" 
        />
        <Text style={[styles.brandText, { color: isDarkMode ? '#FFF' : '#000' }]}>SuviX</Text>
      </TouchableOpacity>

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
    height: Platform.OS === 'ios' ? 100 : 70,
    paddingTop: Platform.OS === 'ios' ? 40 : 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    zIndex: 50,
  },
  iconButton: {
    padding: 8,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    left: '50%',
    marginLeft: -40, // Offset for "SuviX" + Logo
    top: Platform.OS === 'ios' ? 52 : 22,
  },
  logo: {
    width: 28,
    height: 28,
    marginRight: 6,
  },
  brandText: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
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
