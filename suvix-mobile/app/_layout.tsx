import { Stack, useRouter, useSegments } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '../src/store/useAuthStore';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Colors } from '../src/constants/Colors';
import { ThemeProvider } from '../src/context/ThemeContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

/**
 * PRODUCTION-GRADE NAVIGATION ROOT
 * Handled with Global Auth Guards and optimized Boot sequence.
 * This is the ONLY place where automatic redirects are handled.
 */
const queryClient = new QueryClient();

function InitialRoot() {
  const { isInitialized, isAuthenticated, user, checkAuth } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();
  const [isIntroFinished, setIsIntroFinished] = useState(false);

  // Initialize Auth State on boot
  useEffect(() => {
    checkAuth();
    
    // Give the animated intro in index.tsx time to play (2 seconds)
    const timer = setTimeout(() => {
      setIsIntroFinished(true);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [checkAuth]);

  /**
   * GLOBAL NAVIGATION GUARD (Auth Sync)
   * This effect watches the authentication state and handles all redirects.
   * It ensures standard behavior for Login, Logout, and Unauthorized access.
   */
  useEffect(() => {
    // Only redirect once initialized AND the intro animation time has passed
    if (!isInitialized || !isIntroFinished) return;

    const inAuthGroup = segments[0] === '(tabs)';
    const inLoginGroup = segments[0] === 'login' || segments[0] === 'signup';

    if (!isAuthenticated && (inAuthGroup || !segments[0])) {
      // LOGOUT/UNAUTHORIZED or at ROOT: Redirect back to login
      router.replace('/login');
    } else if (isAuthenticated && (inLoginGroup || !segments[0])) {
      // LOGIN SUCCESS or ROOT ACCESS: Redirect based on role
      const role = user?.role?.toLowerCase();
      
      if (role === 'pending') {
        router.replace('/role-selection');
      } else if (role === 'editor') {
        router.replace('/(tabs)/editor');
      } else if (role === 'client') {
        router.replace('/(tabs)/client');
      } else {
        // Fallback for unknown role or missing user data
        router.replace('/login');
      }
    }
  }, [isInitialized, isAuthenticated, user, segments, isIntroFinished]);

  // BOOT INDICATOR: Shown for a split-second while the engine starts
  if (!isInitialized) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.dark.primary, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="role-selection" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <InitialRoot />
        </QueryClientProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
