import React from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator, Dimensions } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';

const { width, height } = Dimensions.get('window');
const DEFAULT_AVATAR = require('../../../assets/defualtprofile.png');

interface AccountSwitchOverlayProps {
  account: {
    username: string;
    profilePicture?: string | null;
    displayName?: string;
  };
  isDark: boolean;
}

export const AccountSwitchOverlay = ({ account, isDark }: AccountSwitchOverlayProps) => {
  return (
    <Animated.View 
      entering={FadeIn.duration(400)} 
      exiting={FadeOut.duration(300)} 
      style={StyleSheet.absoluteFill}
    >
      <BlurView intensity={isDark ? 40 : 60} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill}>
        <View style={styles.container}>
          <View style={styles.content}>
            {/* Avatar with Glow */}
            <View style={styles.avatarContainer}>
              <View style={[styles.avatarGlow, { backgroundColor: isDark ? '#8B5CF6' : '#6366f1', opacity: isDark ? 0.3 : 0.15 }]} />
              {account.profilePicture ? (
                <Image source={{ uri: account.profilePicture }} style={styles.avatar} />
              ) : (
                <Image source={DEFAULT_AVATAR} style={styles.avatar} />
              )}
            </View>

            {/* Switching Text */}
            <Text style={[styles.switchingText, { color: isDark ? '#FFFFFF' : '#000000' }]}>
              Switching to
            </Text>
            <Text style={[styles.usernameText, { color: isDark ? '#A78BFA' : '#4F46E5' }]}>
              @{account.username}
            </Text>

            {/* Premium Loader */}
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color={isDark ? '#8B5CF6' : '#4F46E5'} />
            </View>
          </View>
        </View>
      </BlurView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    padding: 30,
    borderRadius: 32,
  },
  avatarContainer: {
    marginBottom: 24,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarGlow: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  switchingText: {
    fontSize: 16,
    fontWeight: '600',
    opacity: 0.8,
    marginBottom: 4,
  },
  usernameText: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  loaderContainer: {
    marginTop: 40,
  },
});
