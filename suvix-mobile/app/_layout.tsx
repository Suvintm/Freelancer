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
  const { isInitialized, isAuthenticated, token, user, checkAuth, fetchUser } = useAuthStore();
  const { fetchClientDashboard, fetchEditorDashboard } = useDashboardStore();
  const segments = useSegments();
  const router = useRouter();
  const [isIntroFinished, setIsIntroFinished] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Initialize Auth State & Pre-fetch Data on boot
  useEffect(() => {
    let isMounted = true;

    async function bootstrap() {
      try {
        console.log('🚀 [BOOT] Starting bootstrap sequence...');
        // 1. Initial Local Auth Check (Token sync)
        await checkAuth();
        
        // 2. Fetch fresh user data if we have a token
        const currentToken = useAuthStore.getState().token;
        if (currentToken) {
          console.log('🗝️ [BOOT] Token found, pre-fetching profile...');
          await fetchUser();
          
          // 3. Pre-fetch relevant dashboard data for zero-latency loading
          const currentUser = useAuthStore.getState().user;
          if (currentUser && isMounted) {
            console.log(`📊 [BOOT] User identified as ${currentUser.role}. Fetching dashboard...`);
            if (currentUser.role === 'editor') {
              await fetchEditorDashboard().catch(() => {});
            } else {
              await fetchClientDashboard().catch(() => {});
            }
          }
        } else {
          console.log('👤 [BOOT] No local token found. Proceeding as Guest.');
        }
      } catch (e) {
        console.error('❌ [BOOT] Critical failure during bootstrap:', e);
      } finally {
        if (isMounted) {
          setDataLoaded(true);
          console.log('✅ [BOOT] Bootstrap complete.');
        }
      }
    }
    
    bootstrap();

    // FAIL-SAFE: If the API is dead or hanging, we MUST show the app 
    // after 5 seconds no matter what.
    const failSafeTimer = setTimeout(() => {
      if (!useAuthStore.getState().isInitialized || !dataLoaded) {
        console.warn('⚠️ [BOOT] Bootstrap took too long. Triggering Fail-Safe...');
        setDataLoaded(true);
      }
    }, 5000);
    
    // Give the advanced animated intro in index.tsx time to play (2.3 seconds)
    const timer = setTimeout(() => {
      if (isMounted) {
        setIsIntroFinished(true);
        console.log('🎬 [BOOT] Intro animation finished.');
      }
    }, 2300);
    
    return () => {
      isMounted = false;
      clearTimeout(timer);
      clearTimeout(failSafeTimer);
    };
  }, [checkAuth, fetchUser, fetchClientDashboard, fetchEditorDashboard]);

  // Logic Effect: Hide native splash immediately when initialized to show our animation
  useEffect(() => {
    if (isInitialized) {
      console.log('🖼️ [BOOT] Hiding native splash. Switching to SuviX Animation.');
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [isInitialized]);

  /**
   * GLOBAL NAVIGATION GUARD (Auth Sync)
   * This effect watches the authentication state and handles all redirects.
   */
  useEffect(() => {
    // Only fire when EVERYTHING is ready
    if (!isInitialized || !isIntroFinished || !dataLoaded) return;

    console.log('🚦 [BOOT] Navigation Guard Fired. Segments:', segments);

    const inAuthGroup = segments[0] === '(tabs)';
    const inLoginGroup = segments[0] === 'login' || segments[0] === 'signup';

    if (!isAuthenticated) {
      if (inAuthGroup || !segments[0] || segments[0] === 'index') {
        console.log('🔓 [GUARD] Unauthorized. Redirecting to /login');
        router.replace('/login');
      }
    } else {
      // Authenticated branch
      const role = user?.role?.toLowerCase();
      console.log(`🔒 [GUARD] Authenticated. User Role: ${role || 'UNKNOWN'}`);

      if (inLoginGroup || !segments[0] || segments[0] === 'index') {
        if (role === 'pending') {
          router.replace('/role-selection');
        } else if (role === 'editor') {
          router.replace('/(tabs)/editor');
        } else if (role === 'client') {
          router.replace('/(tabs)/client');
        } else {
          // If role is missing (API error?), fallback to login to re-auth
          console.warn('⚠️ [GUARD] Missing user role. Forcing re-auth.');
          router.replace('/login');
        }
      }
    }
  }, [isInitialized, isAuthenticated, user, segments, isIntroFinished, dataLoaded, router]);

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
