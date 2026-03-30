import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Text, Image, Animated, Easing, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../src/store/useAuthStore';
import { Colors } from '../src/constants/Colors';

/**
 * PREMIUM ANIMATED SPLASH SCREEN (SuviX Intro)
 * This screen provides a cinematic introduction experience, 
 * smoothly scaling and fading in the SuviX logo and tagline.
 */
export default function Index() {
  const { isInitialized, isAuthenticated, user } = useAuthStore();
  const router = useRouter();

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const taglineAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // --- STEP 1: START THE CINEMATIC INTRO ---
    Animated.sequence([
      // 1. Fade & Scale the Logo
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
          easing: Easing.out(Easing.back(1)),
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
          easing: Easing.out(Easing.back(1)),
        }),
      ]),
      // 2. Fade in the Tagline
      Animated.timing(taglineAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, scaleAnim, taglineAnim]);

  return (
    <View style={styles.container}>
      {/* Animated Logo Container */}
      <Animated.View 
        style={[
          styles.logoContainer, 
          { 
            opacity: fadeAnim, 
            transform: [{ scale: scaleAnim }] 
          }
        ]}
      >
        <Image 
          source={require('../assets/logo.png')} 
          style={styles.logo} 
          resizeMode="contain" 
        />
        <Text style={styles.brandTitle}>SuviX</Text>
      </Animated.View>

      {/* Animated Tagline */}
      <Animated.View style={[styles.taglineWrapper, { opacity: taglineAnim }]}>
        <Text style={styles.tagline}>Professional Video Editing</Text>
        <Text style={styles.taglineSub}>at your fingertips</Text>
      </Animated.View>

      {/* Subtle Bottom Loader */}
      <View style={styles.footer}>
        <ActivityIndicator size="small" color={Colors.accent} style={{ marginBottom: 10 }} />
        <Text style={styles.loadingText}>Initializing Experience...</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.dark.primary,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 15,
  },
  brandTitle: {
    color: Colors.white,
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  taglineWrapper: {
    alignItems: 'center',
  },
  tagline: {
    color: Colors.accent,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  taglineSub: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    fontWeight: '500',
    marginTop: 4,
  },
  footer: {
    position: 'absolute',
    bottom: 60,
    alignItems: 'center',
  },
  loadingText: {
    color: Colors.dark.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
});
