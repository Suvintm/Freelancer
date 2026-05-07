import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, Dimensions, Animated, Easing } from 'react-native';
import { BlurView } from 'expo-blur';
import { Feather } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');
const DEFAULT_AVATAR = require('../../../assets/defualtprofile.png');

interface LogoutOverlayProps {
  user: {
    username: string;
    profilePicture?: string | null;
  } | null;
  isDark: boolean;
}

export const LogoutOverlay = ({ user, isDark }: LogoutOverlayProps) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 3000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      )
    ]).start();
  }, []);

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View 
      style={[
        StyleSheet.absoluteFill, 
        { opacity: fadeAnim, zIndex: 999999 }
      ]}
    >
      <BlurView 
        intensity={isDark ? 50 : 80} 
        tint={isDark ? 'dark' : 'light'} 
        style={StyleSheet.absoluteFill}
      >
        <View style={styles.container}>
          <Animated.View style={[styles.content, { transform: [{ scale: scaleAnim }] }]}>
            {/* Animated Ring */}
            <View style={styles.ringContainer}>
              <Animated.View 
                style={[
                  styles.loaderRing, 
                  { 
                    borderColor: isDark ? '#A78BFA' : '#6366F1',
                    transform: [{ rotate: rotation }] 
                  }
                ]} 
              />
              <View style={styles.avatarWrapper}>
                {user?.profilePicture ? (
                  <Image source={{ uri: user.profilePicture }} style={styles.avatar} />
                ) : (
                  <Image source={DEFAULT_AVATAR} style={styles.avatar} />
                )}
                <View style={[styles.statusIcon, { backgroundColor: '#EF4444' }]}>
                  <Feather name="log-out" size={12} color="white" />
                </View>
              </View>
            </View>

            <View style={styles.textContainer}>
              <Text style={[styles.title, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                Signing out
              </Text>
              <Text style={[styles.subtitle, { color: isDark ? '#A1A1AA' : '#71717A' }]}>
                @{user?.username || 'Account'}
              </Text>
            </View>

            <View style={styles.footer}>
              <Text style={[styles.footerText, { color: isDark ? '#52525B' : '#A1A1AA' }]}>
                Securing your session...
              </Text>
            </View>
          </Animated.View>
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
    width: width * 0.8,
  },
  ringContainer: {
    width: 140,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  loaderRing: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 2,
    borderStyle: 'dashed',
    opacity: 0.5,
  },
  avatarWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    padding: 3,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 47,
  },
  statusIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 3,
    borderColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 4,
  },
  footer: {
    marginTop: 60,
  },
  footerText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
