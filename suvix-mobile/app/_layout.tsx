import 'react-native-gesture-handler';
import { Stack, useRouter, useSegments } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '../src/store/useAuthStore';
import { useEffect, useState, useRef } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { ThemeProvider } from '../src/context/ThemeContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { useDashboardStore } from '../src/store/useDashboardStore';
import { useCategoryStore } from '../src/store/useCategoryStore';
import { Image } from 'react-native';
import { preloadHomeAssets } from '../src/constants/homePreload';

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

  const bootstrapStarted = useRef(false);
  const dataLoadedRef = useRef(false);
  // Initialize Auth State & Pre-fetch Data on boot
  useEffect(() => {
    if (bootstrapStarted.current) return;
    bootstrapStarted.current = true;

    let isMounted = true;

    async function bootstrap() {
      try {
        console.log('🚀 [BOOT] Starting bootstrap sequence...');
        // 1. Initial Local Auth Check (Token sync)
        await checkAuth();

        // 2. Pre-fetch Dynamic Roles/Categories for Onboarding
        useCategoryStore.getState().fetchCategories().catch(() => {});
        
        // 3. Fetch fresh user data if we have a token
        const currentToken = useAuthStore.getState().token;
        if (currentToken) {
          console.log('🗝️ [BOOT] Token found, pre-fetching profile...');
          await fetchUser();
          
          const currentUser = useAuthStore.getState().user;
          if (currentUser && isMounted) {
            console.log(`📊 [BOOT] User identified: ${currentUser.primaryRole?.category}.`);
            
            // 3a. Pre-fetch primary dashboard data
            if (currentUser.primaryRole?.group === 'PROVIDER') {
              await fetchEditorDashboard().catch(() => {});
            } else {
              await fetchClientDashboard().catch(() => {});
            }

            // 3b. PRO-TECH: Pre-warm Image Cache (Zero Flicker Landing)
            if (currentUser.profilePicture) {
              Image.prefetch(currentUser.profilePicture).catch(() => {});
            }
            // Pre-fetch a few common assets to prevent grey flickers
            const LOGO_URI = Image.resolveAssetSource(require('../assets/whitebglogo.png')).uri;
            Image.prefetch(LOGO_URI).catch(() => {});
          }
        } else {
          console.log('👤 [BOOT] No local token found. Proceeding as Guest.');
        }
        // 4. Preload home assets while splash/intro is still visible.
        await preloadHomeAssets(1400);
      } catch (e) {
        console.error('❌ [BOOT] Critical failure during bootstrap:', e);
      } finally {
        if (isMounted) {
          dataLoadedRef.current = true;
          setDataLoaded(true);
          console.log('✅ [BOOT] Bootstrap complete.');
        }
      }
    }
    
    bootstrap();

    const timer = setTimeout(() => {
      if (isMounted) {
        setIsIntroFinished(true);
        console.log('🎬 [BOOT] Intro animation finished.');
      }
    }, 2300);

    const failSafeTimer = setTimeout(() => {
      if (isMounted && !dataLoadedRef.current) {
        console.warn('⚠️ [BOOT] Bootstrap timeout. Forcing app start.');
        dataLoadedRef.current = true;
        setDataLoaded(true);
      }
    }, 4000); // Tightened to 4s for production feel
    
    return () => {
      isMounted = false;
      clearTimeout(timer);
      clearTimeout(failSafeTimer);
    };
  }, [checkAuth, fetchUser, fetchClientDashboard, fetchEditorDashboard]); 

  // Session Sync Logic: Re-fetch dashboard data when user logs in manually
  useEffect(() => {
    if (isAuthenticated && user && dataLoaded) {
      // If we are authenticated but the dashboard stats are missing, fetch them
      const syncDashboard = async () => {
        try {
          if (user.primaryRole?.group === 'PROVIDER') {
            await fetchEditorDashboard().catch(() => {});
          } else {
            await fetchClientDashboard().catch(() => {});
          }
        } catch (e) {
          console.error('❌ [SYNC] Failed to sync dashboard after login:', e);
        }
      };
      
      syncDashboard();
    }
  }, [isAuthenticated, user?.role, fetchEditorDashboard, fetchClientDashboard, dataLoaded]);

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
  const isNavigating = useRef(false);

  useEffect(() => {
    // Only fire when EVERYTHING is ready
    if (!isInitialized || !isIntroFinished || !dataLoaded) return;

    // Hardened Handoff: 400ms ensures the Native UI is fully settled before the dashboard mount hit
    const handoffTimer = setTimeout(() => {
      if (isNavigating.current) return;

      const currentSegment = segments[0];
      const inAuthGroup = currentSegment === '(tabs)';
      const inOnboarding =
        currentSegment === 'role-selection' ||
        currentSegment === 'subcategory-selection' ||
        currentSegment === 'youtube-connect';
      const inPublicGroup =
        currentSegment === 'welcome' ||
        currentSegment === 'login' ||
        currentSegment === 'signup';

      console.log(`🚦 [GUARD] Auth: ${isAuthenticated} | Seg: ${currentSegment} | Onboarded: ${user?.isOnboarded}`);

      // 1. UNAUTHENTICATED
      if (!isAuthenticated || (!user && dataLoaded)) {
        if (!currentSegment || currentSegment === 'index') {
          console.log('🔓 [GUARD] Redirecting guest from intro to /welcome');
          isNavigating.current = true;
          router.replace('/welcome');
          setTimeout(() => { isNavigating.current = false; }, 1000);
          return;
        }

        if (!inPublicGroup && !inOnboarding) {
          console.log('🔓 [GUARD] Redirecting to /welcome');
          isNavigating.current = true;
          router.replace('/welcome');
          setTimeout(() => { isNavigating.current = false; }, 1000);
        }
        return;
      }

      // 2. AUTHENTICATED
      const isOnboarded = user?.isOnboarded;
      if (isOnboarded) {
        if (!inAuthGroup) {
          console.log('🚀 [GUARD] Taking user to home dashboard...');
          isNavigating.current = true;
          router.replace('/(tabs)');
          setTimeout(() => { isNavigating.current = false; }, 1200);
        }
      } else {
        if (!inOnboarding) {
          console.log('📝 [GUARD] Taking user to onboarding...');
          isNavigating.current = true;
          router.replace('/role-selection');
          setTimeout(() => { isNavigating.current = false; }, 1200);
        }
      }
    }, 450); // Hardened Production Delay

    return () => clearTimeout(handoffTimer);
  }, [isInitialized, isAuthenticated, user, segments, isIntroFinished, dataLoaded, router]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="welcome" />
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="role-selection" />
      <Stack.Screen name="subcategory-selection" />
      <Stack.Screen name="youtube-connect" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}

function RootLayout() {
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

export default RootLayout;
