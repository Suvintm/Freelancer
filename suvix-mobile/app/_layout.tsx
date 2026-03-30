import { Stack, useRouter, useSegments } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '../src/store/useAuthStore';
import { useEffect, useState } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { ThemeProvider } from '../src/context/ThemeContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { useDashboardStore } from '../src/store/useDashboardStore';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync().catch(() => {});

/**
 * PRODUCTION-GRADE NAVIGATION ROOT
 * Handled with Global Auth Guards and optimized Boot sequence.
 * This is the ONLY place where automatic redirects are handled.
 */
const queryClient = new QueryClient();

function InitialRoot() {
  const { isInitialized, isAuthenticated, user, checkAuth, fetchUser } = useAuthStore();
  const { fetchClientDashboard, fetchEditorDashboard } = useDashboardStore();
  const segments = useSegments();
  const router = useRouter();
  const [isIntroFinished, setIsIntroFinished] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Initialize Auth State & Pre-fetch Data on boot
  useEffect(() => {
    async function bootstrap() {
      try {
        // 1. Initial Local Auth Check
        await checkAuth();
        
        // 2. Background Data Sync (JioHotstar Strategy)
        // We do this in parallel if authenticated
        const currentUser = useAuthStore.getState().user;
        if (currentUser) {
          const profileFetch = fetchUser();
          const dashboardFetch = currentUser.role === 'editor' 
            ? fetchEditorDashboard() 
            : fetchClientDashboard();
            
          await Promise.all([profileFetch, dashboardFetch]);
        }
      } catch (e) {
        console.warn('Bootstrap Error:', e);
      } finally {
        setDataLoaded(true);
      }
    }
    
    bootstrap();
    
    // Give the advanced animated intro in index.tsx time to play (2.3 seconds)
    const timer = setTimeout(() => {
      setIsIntroFinished(true);
    }, 2300);
    
    return () => clearTimeout(timer);
  }, [checkAuth, fetchUser, fetchClientDashboard, fetchEditorDashboard]);

  // Logic Effect: Hide native splash immediately when initialized to show our animation
  useEffect(() => {
    if (isInitialized) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [isInitialized]);

  /**
   * GLOBAL NAVIGATION GUARD (Auth Sync)
   * This effect watches the authentication state and handles all redirects.
   * It ensures standard behavior for Login, Logout, and Unauthorized access.
   */
  useEffect(() => {
    if (!isInitialized || !isIntroFinished || !dataLoaded) return;

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
  }, [isInitialized, isAuthenticated, user, segments, isIntroFinished, router]);

  // BOOT INDICATOR: Shown for a split-second while the engine starts
  // Render the stack immediately - index.tsx will handle the initial splash
  return (
    <Stack screenOptions={{ headerShown: false }}>
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
