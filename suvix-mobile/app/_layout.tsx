import 'react-native-gesture-handler';
import { Stack, useRouter, useSegments } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '../src/store/useAuthStore';
import { useAccountVault } from '../src/hooks/useAccountVault';
import { useEffect, useState, useRef } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { ThemeProvider, useTheme } from '../src/context/ThemeContext';
import { AccountSwitchOverlay } from '../src/components/shared/AccountSwitchOverlay';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { getDeviceId } from '../src/hooks/useDeviceId';
import { CrossAccountBanner } from '../src/components/shared/CrossAccountBanner';

import { useDashboardStore } from '../src/store/useDashboardStore';
import { useCategoryStore } from '../src/store/useCategoryStore';
import { Image } from 'react-native';
import { preloadHomeAssets } from '../src/constants/homePreload';
import { useNotifications } from '../src/hooks/useNotifications';
import { useSocketStore } from '../src/store/useSocketStore';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync().catch(() => {});

/**
 * PRODUCTION-GRADE NAVIGATION ROOT
 * Handled with Global Auth Guards and optimized Boot sequence.
 * This is the ONLY place where automatic redirects are handled.
 */
const queryClient = new QueryClient();

function InitialRoot() {
  const { 
    isInitialized, 
    isAuthenticated, 
    user, 
    checkAuth, 
    fetchUser, 
    isLoadingUser, 
    isBootstrapComplete,
    setIsBootstrapComplete,
    isIntroFinished,
    dataLoaded,
    switchingToAccount
  } = useAuthStore();
  const { isDarkMode } = useTheme();
  const { fetchClientDashboard, fetchEditorDashboard } = useDashboardStore();

  // ── PRODUCTION: Register device for push notifications when authenticated ──
  useNotifications();
  const segments = useSegments();
  const router = useRouter();

  const bootstrapStarted = useRef(false);
  // Initialize Auth State & Pre-fetch Data on boot
  useEffect(() => {
    if (bootstrapStarted.current) return;
    bootstrapStarted.current = true;

    let isMounted = true;

    async function bootstrap() {
      try {
        console.log('🚀 [BOOT] Starting bootstrap sequence...');
        // 0. Initialize permanent Device ID (must be first — needed for all auth requests)
        await getDeviceId();

        // 1. Initial Local Auth Check (Token sync)
        console.log('🔐 [BOOT] Re-hydrating secure session...');
        await checkAuth();

        // 2. Double-check token sync after hydration
        const currentToken = useAuthStore.getState().token;
        if (!currentToken) {
           // One final attempt to pull active account if store sync was slow
           const activeTokens = await useAccountVault.getState().getActiveTokens();
           if (activeTokens) {
             useAuthStore.getState().setTokens(activeTokens.accessToken, activeTokens.refreshToken);
             console.log('⚡ [BOOT] Hot-swapped missing tokens from vault.');
           }
        }
        
        // 3. Fetch fresh user data if we have a qualified session
        const token = useAuthStore.getState().token;
        if (token) {
          console.log('🗝️ [BOOT] Active session found, pre-fetching profile...');
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
          setIsBootstrapComplete(true);
          console.log('✅ [BOOT] Bootstrap complete.');
        }
      }
    }
    
    bootstrap();

    // 🎬 REMOVED: The hardcoded timer is gone. 
    // isIntroFinished will now be set by the AnimatedSplashScreen component
    // via a callback when it's actually done and data is ready.
    
    return () => {
      isMounted = false;
    };
  }, [checkAuth, fetchUser, fetchClientDashboard, fetchEditorDashboard]); 

  // Session Sync & WebSocket Logic
  useEffect(() => {
    const { connect, disconnect } = useSocketStore.getState();

    if (isAuthenticated && user && dataLoaded) {
      // Establish Real-Time Connection
      connect();

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
    } else if (!isAuthenticated) {
      // Disconnect socket to prevent ghost sessions
      disconnect();
    }
  }, [isAuthenticated, user, fetchEditorDashboard, fetchClientDashboard, dataLoaded]);

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
    // Only fire when EVERYTHING is ready (Data + Intro Animation)
    if (!isInitialized || !isIntroFinished || !isBootstrapComplete) return;

    // Hardened Handoff: 400ms ensures the Native UI is fully settled before the dashboard mount hit
    const handoffTimer = setTimeout(() => {
      if (isNavigating.current) return;

      const currentSegment = segments[0];
      const inAuthGroup = 
        currentSegment === '(tabs)' || 
        currentSegment === 'notifications' || 
        currentSegment === 'creators' || 
        currentSegment === 'create-post' ||
        currentSegment === 'gallery' ||
        currentSegment === 'reels' ||
        currentSegment === 'story' ||
        currentSegment === 'settings' ||
        currentSegment === 'sessions';
      const inOnboarding =
        currentSegment === 'role-selection' ||
        currentSegment === 'subcategory-selection' ||
        currentSegment === 'youtube-connect' ||
        currentSegment === 'complete-profile';
      const inPublicGroup =
        currentSegment === 'welcome' ||
        currentSegment === 'login' ||
        currentSegment === 'signup' ||
        currentSegment === 'banned' ||
        currentSegment === 'forgot-password';

      // Anything that isn't public or onboarding is considered an 'Auth-Only' area.
      // 🚩 CRITICAL: If segment is undefined or 'index', we are at the app root and MUST redirect.
      const isAtRoot = !currentSegment || currentSegment === 'index';
      const isRestrictedArea = inPublicGroup || inOnboarding || isAtRoot;

      console.log(`🚦 [GUARD] Segment: ${currentSegment} | Auth: ${isAuthenticated} | User: ${!!user} | Loading: ${isLoadingUser}`);

      // 🚨 CRITICAL: [SECURITY] BAN GUARD
      if (user?.isBanned || (user as any)?.is_banned) {
        if (currentSegment !== 'banned') {
          console.warn('🚫 [GUARD] User is banned. Redirecting to /banned screen.');
          isNavigating.current = true;
          router.replace('/banned');
          setTimeout(() => { isNavigating.current = false; }, 1000);
        }
        return;
      }

      // 1. RE-HYDRATION GUARD
      if (isAuthenticated && !user && isLoadingUser) {
        console.log('⏳ [GUARD] Waiting for user profile hydration...');
        return;
      }

      if (isAuthenticated && !user && dataLoaded && !isLoadingUser) {
        console.log('⚠️ [GUARD] Hydration failed or unreachable. Retrying fetch...');
        fetchUser();
        return;
      }

      // 2. UNAUTHENTICATED
      // Guests are allowed to visit Public areas (Welcome/Login) AND Onboarding areas (Category selection)
      if (!isAuthenticated || (!user && dataLoaded)) {
        if (!currentSegment || currentSegment === 'index' || (!inPublicGroup && !inOnboarding)) {
          console.log('🔓 [GUARD] Redirecting guest to /welcome');
          isNavigating.current = true;
          router.replace('/welcome');
          setTimeout(() => { isNavigating.current = false; }, 1000);
          return;
        }
        return;
      }

      // 3. AUTHENTICATED & ONBOARDING LOGIC
      const { isOnboarded } = user || {};
      const isAddingAccount = useAuthStore.getState().isAddingAccount;
      const isMissingSocialData = !isOnboarded && (!user?.username || !user?.name);

      if (isOnboarded && !isAddingAccount) {
        // If the user is fully onboarded and not in "Add Account" mode, 
        // they should be redirected back to the dashboard if they try to visit login/welcome.
        if (isRestrictedArea && currentSegment !== 'banned') {
          console.log('🚀 [GUARD] Taking onboarded user to home dashboard...');
          isNavigating.current = true;
          router.replace('/(tabs)');
          setTimeout(() => { isNavigating.current = false; }, 1200);
        }
      } else if (isOnboarded && isAddingAccount && currentSegment === '(tabs)') {
        // ✨ AUTO-CLEANUP: If the user is on onboarded but isAddingAccount is still true 
        // while they are in the tabs (e.g., they clicked back to get home), reset the flag.
        console.log('🧹 [GUARD] Resetting isAddingAccount mode (User returned home)');
        useAuthStore.getState().setIsAddingAccount(false);
      } else if (!isOnboarded) {
        // PRODUCTION-GRADE: Decide where to send un-onboarded user
        if (!inOnboarding) {
          if (isMissingSocialData) {
            console.log('👤 [GUARD] Missing Social Data. Taking user to complete-profile...');
            isNavigating.current = true;
            router.replace('/complete-profile');
            setTimeout(() => { isNavigating.current = false; }, 1200);
          } else {
            console.log('📝 [GUARD] Taking user to role-selection...');
            isNavigating.current = true;
            router.replace('/role-selection');
            setTimeout(() => { isNavigating.current = false; }, 1200);
          }
        }
      }
    }, 450);

    return () => clearTimeout(handoffTimer);
  }, [isInitialized, isAuthenticated, user, segments, isIntroFinished, dataLoaded, router, isLoadingUser, fetchUser]);

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="welcome" />
        <Stack.Screen name="login" />
        <Stack.Screen name="signup" />
        <Stack.Screen name="role-selection" />
        <Stack.Screen name="subcategory-selection" />
        <Stack.Screen name="youtube-connect" />
        <Stack.Screen name="create-post" />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="sessions" />
        <Stack.Screen name="(tabs)" />
      </Stack>

      {/* 🔮 PREMIUM ACCOUNT SWITCH OVERLAY */}
      {switchingToAccount && (
        <AccountSwitchOverlay 
          account={switchingToAccount} 
          isDark={isDarkMode} 
        />
      )}
    </>
  );
}

function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <InitialRoot />
          {/* 🔔 Cross-account notification banner — floats above all screens */}
          <ThemeAwareBanner />
        </QueryClientProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

/** Thin wrapper to access theme inside RootLayout */
function ThemeAwareBanner() {
  const { isDarkMode } = useTheme();
  return <CrossAccountBanner isDark={isDarkMode} />;
}

export default RootLayout;
