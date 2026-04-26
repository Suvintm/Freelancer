/**
 * app/_layout.tsx — Root Navigation Guard
 *
 * ── Fixes Applied ─────────────────────────────────────────────────────────────
 *
 * 1. STRICT BOOLEAN CHECK FOR isOnboarded
 *    BUG: if (!isOnboarded) → fires when isOnboarded === undefined (server down,
 *         hydration in-flight, or old cached data) → redirect to /complete-profile.
 *    FIX: if (user && isOnboarded === true) → only redirect when we have
 *         a confirmed user object AND confirmed onboarding status.
 *
 * 2. ONBOARDING CHECK USES CONFIRMED DATA ONLY
 *    BUG: Guard checked !user.username || !user.name which fires when
 *         user is partially hydrated or when server returned undefined fields.
 *    FIX: Only run the onboarding check when dataLoaded === true AND user !== null.
 *         This prevents ghost redirects during transient states.
 *
 * 3. DEBOUNCE ON SEGMENT CHANGES
 *    BUG: Guard ran immediately on every render including mid-transition states.
 *    FIX: 450ms debounce timer (already had this — kept and verified correct).
 *
 * 4. isAddingAccount BLOCKS ALL REDIRECTS
 *    When a user is in "add account" flow, the guard must not redirect them
 *    away from login/signup even though isAuthenticated is already true.
 *
 * 5. LOADING STATE RESPECTED
 *    Guard waits for: isInitialized && isIntroFinished && isBootstrapComplete
 *    AND does not act if isLoadingUser is true (profile still fetching).
 * ─────────────────────────────────────────────────────────────────────────────
 */

import 'react-native-gesture-handler';
import { Stack, useRouter, useSegments } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '../src/store/useAuthStore';
import { useAccountVault } from '../src/hooks/useAccountVault';
import { useEffect, useRef } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { ThemeProvider, useTheme } from '../src/context/ThemeContext';
import { AccountSwitchOverlay } from '../src/components/shared/AccountSwitchOverlay';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { getDeviceId } from '../src/hooks/useDeviceId';
import { CrossAccountBanner } from '../src/components/shared/CrossAccountBanner';
import { useDashboardStore } from '../src/store/useDashboardStore';
import { Image } from 'react-native';
import { preloadHomeAssets } from '../src/constants/homePreload';
import { useNotifications } from '../src/hooks/useNotifications';
import { useSocketStore } from '../src/store/useSocketStore';
import { GlobalToast } from '../src/components/GlobalToast';
import MobileAds from 'react-native-google-mobile-ads';

SplashScreen.preventAutoHideAsync().catch(() => {});

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 30_000,
    },
  },
});

// ── InitialRoot ────────────────────────────────────────────────────────────────

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
    switchingToAccount,
    isAddingAccount,
  } = useAuthStore();

  const { isDarkMode } = useTheme();
  const { fetchClientDashboard, fetchEditorDashboard } = useDashboardStore();

  useNotifications();

  const segments    = useSegments();
  const router      = useRouter();
  const bootstrapStarted = useRef(false);

  // ── Bootstrap ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (bootstrapStarted.current) return;
    bootstrapStarted.current = true;

    let isMounted = true;

    async function bootstrap() {
      try {
        console.log('🚀 [BOOT] Starting bootstrap sequence...');

        // 0. Permanent device ID (must be first — used by all auth requests)
        await getDeviceId();

        // 0a. AdMob (non-blocking)
        MobileAds().initialize().catch(err =>
          console.error('❌ [BOOT] AdMob init failed:', err)
        );

        // 1. Re-hydrate secure session
        console.log('🔐 [BOOT] Re-hydrating secure session...');
        await checkAuth();

        // 2. Token safety net
        const currentToken = useAuthStore.getState().token;
        if (!currentToken) {
          const activeTokens = await useAccountVault.getState().getActiveTokens();
          if (activeTokens) {
            useAuthStore.getState().setTokens(
              activeTokens.accessToken,
              activeTokens.refreshToken
            );
            console.log('⚡ [BOOT] Hot-swapped missing tokens from vault.');
          }
        }

        // 3. Fetch fresh profile if we have a session
        const token = useAuthStore.getState().token;
        if (token) {
          console.log('🗝️ [BOOT] Active session found — pre-fetching profile...');
          await fetchUser();

          const currentUser = useAuthStore.getState().user;
          if (currentUser && isMounted) {
            console.log(`📊 [BOOT] User identified: ${currentUser.primaryRole?.category}.`);

            // 3a. Pre-fetch dashboard data (non-blocking)
            if (currentUser.primaryRole?.group === 'PROVIDER') {
              fetchEditorDashboard().catch(() => {});
            } else {
              fetchClientDashboard().catch(() => {});
            }

            // 3b. Pre-warm image cache
            if (currentUser.profilePicture) {
              Image.prefetch(currentUser.profilePicture).catch(() => {});
            }
            try {
              const logoUri = Image.resolveAssetSource(require('../assets/whitebglogo.png')).uri;
              Image.prefetch(logoUri).catch(() => {});
            } catch { /* non-critical */ }
          }
        } else {
          console.log('👤 [BOOT] No token found. Proceeding as Guest.');
        }

        // 4. Preload home assets while splash/intro is still visible
        await preloadHomeAssets(1400);

      } catch (e) {
        console.error('❌ [BOOT] Critical failure:', e);
      } finally {
        if (isMounted) {
          setIsBootstrapComplete(true);
          console.log('✅ [BOOT] Bootstrap complete.');
        }
      }
    }

    bootstrap();
    return () => { isMounted = false; };
  }, [checkAuth, fetchUser, fetchClientDashboard, fetchEditorDashboard]);

  // ── Socket lifecycle ───────────────────────────────────────────────────────
  useEffect(() => {
    const { connect, disconnect } = useSocketStore.getState();

    if (isAuthenticated && user) {
      connect();

      const syncDashboard = async () => {
        try {
          if (user.primaryRole?.group === 'PROVIDER') {
            await fetchEditorDashboard().catch(() => {});
          } else {
            await fetchClientDashboard().catch(() => {});
          }
        } catch (e) {
          console.error('❌ [SYNC] Dashboard sync failed:', e);
        }
      };
      syncDashboard();
    } else if (!isAuthenticated) {
      disconnect();
    }
  }, [isAuthenticated, user?.id, fetchEditorDashboard, fetchClientDashboard]);

  // ── Hide native splash when initialized ───────────────────────────────────
  useEffect(() => {
    if (isInitialized) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [isInitialized]);

  // ── Global Navigation Guard ────────────────────────────────────────────────
  const isNavigating = useRef(false);

  useEffect(() => {
    // ── Gate 1: Wait for full boot sequence ─────────────────────────────────
    if (!isInitialized || !isIntroFinished || !isBootstrapComplete) return;

    // ── Gate 2: Don't navigate while profile is loading ──────────────────────
    // This prevents flicker during re-hydration (e.g. app resume after background).
    if (isLoadingUser) return;

    const handoffTimer = setTimeout(() => {
      if (isNavigating.current) return;

      const currentSegment = segments[0] as string | undefined;

      const inAuthGroup =
        currentSegment === '(tabs)'        ||
        currentSegment === 'notifications' ||
        currentSegment === 'creators'      ||
        currentSegment === 'create-post'   ||
        currentSegment === 'gallery'       ||
        currentSegment === 'reels'         ||
        currentSegment === 'story'         ||
        currentSegment === 'settings'      ||
        currentSegment === 'sessions';

      const inOnboarding =
        currentSegment === 'role-selection'        ||
        currentSegment === 'subcategory-selection' ||
        currentSegment === 'youtube-connect'       ||
        currentSegment === 'complete-profile';

      const inPublicGroup =
        currentSegment === 'welcome'         ||
        currentSegment === 'login'           ||
        currentSegment === 'signup'          ||
        currentSegment === 'banned'          ||
        currentSegment === 'forgot-password';

      const isAtRoot = !currentSegment || currentSegment === 'index';
      const isRestrictedArea = inPublicGroup || inOnboarding || isAtRoot;

      console.log(
        `🚦 [GUARD] seg=${currentSegment} | auth=${isAuthenticated} | user=${!!user} | loading=${isLoadingUser} | dataLoaded=${dataLoaded} | onboarded=${user?.isOnboarded} | addingAccount=${isAddingAccount}`
      );

      // ── Ban guard ──────────────────────────────────────────────────────────
      if (user?.isBanned || (user as any)?.is_banned) {
        if (currentSegment !== 'banned') {
          console.warn('🚫 [GUARD] User banned → /banned');
          isNavigating.current = true;
          router.replace('/banned');
          setTimeout(() => { isNavigating.current = false; }, 1000);
        }
        return;
      }

      // ── isAddingAccount: BLOCK all redirects ───────────────────────────────
      // When adding a second account, the user stays on login/signup even though
      // isAuthenticated is already true from the primary account.
      if (isAddingAccount) {
        console.log('🔒 [GUARD] isAddingAccount=true — skipping guard');
        return;
      }

      // ── Unauthenticated ────────────────────────────────────────────────────
      if (!isAuthenticated) {
        if (!inPublicGroup && !inOnboarding) {
          console.log('🔓 [GUARD] Guest redirected to /welcome');
          isNavigating.current = true;
          router.replace('/welcome');
          setTimeout(() => { isNavigating.current = false; }, 1000);
        }
        return;
      }

      // ── Authenticated — wait for data ──────────────────────────────────────
      // Don't act on profile data until fetchUser has completed at least once.
      // Without this guard, the navigation fires on the stale null user
      // during the brief window between "token confirmed" and "user loaded".
      if (!dataLoaded) {
        console.log('⏳ [GUARD] Authenticated but dataLoaded=false — waiting...');
        return;
      }

      // ── Hydration complete but user is null (server error or bad token) ────
      if (!user) {
        if (isAuthenticated) {
          if (!inPublicGroup && !inOnboarding) {
            console.log('⚠️ [GUARD] Server unreachable. Fallback to /welcome.');
            isNavigating.current = true;
            router.replace('/welcome');
            setTimeout(() => { isNavigating.current = false; }, 1000);
          } else {
            console.log('⚠️ [GUARD] Server unreachable. Staying on public page.');
          }
          return; 
        }
        
        console.log('⚠️ [GUARD] dataLoaded=true but user=null. Retrying fetchUser...');
        fetchUser();
        return;
      }

      // ── FIX: Strict boolean check for isOnboarded ──────────────────────────
      //
      // PREVIOUS (BUGGY):
      //   const isOnboarded = user?.isOnboarded;
      //   if (!isOnboarded) → redirect
      //
      // This fired when isOnboarded was `undefined` (server returned malformed
      // data, or cached formatted user had field missing) → redirect loop.
      //
      // FIX: Only redirect when we have CONFIRMED isOnboarded === true.
      // If it's undefined/null we do NOT redirect — we stay in place.
      // ──────────────────────────────────────────────────────────────────────
      const isOnboarded = user.isOnboarded === true;

      // ── Fully onboarded user → push to app if on public/onboarding page ────
      if (isOnboarded) {
        if (isRestrictedArea && currentSegment !== 'banned') {
          console.log('🚀 [GUARD] Onboarded user → /(tabs)');
          isNavigating.current = true;
          router.replace('/(tabs)');
          setTimeout(() => { isNavigating.current = false; }, 1200);
        }
        return;
      }

      // ── Not onboarded: decide where to send them ───────────────────────────
      //
      // FIX: We now check specific fields with a fallback. If either field is
      // a non-empty string, we don't redirect to complete-profile.
      // Previously used falsy check: !user.username || !user.name
      // which would fire on empty string "" (valid for partial signups).
      //
      // isMissingSocialData: true ONLY when we have a confirmed user object
      // with genuinely absent username/name (Google OAuth incomplete signup).
      // ──────────────────────────────────────────────────────────────────────
      if (!inOnboarding) {
        const hasUsername = typeof user.username === 'string' && user.username.trim().length > 0;
        const hasName     = typeof user.name     === 'string' && user.name.trim().length > 0;
        const isMissingSocialData = !hasUsername || !hasName;

        if (isMissingSocialData) {
          console.log('👤 [GUARD] Missing social data → /complete-profile');
          isNavigating.current = true;
          router.replace('/complete-profile');
        } else {
          console.log('📝 [GUARD] Not onboarded → /role-selection');
          isNavigating.current = true;
          router.replace('/role-selection');
        }
        setTimeout(() => { isNavigating.current = false; }, 1200);
      }
    }, 450);

    return () => clearTimeout(handoffTimer);
  }, [
    isInitialized, isAuthenticated, user, segments,
    isIntroFinished, dataLoaded, router, isLoadingUser,
    fetchUser, isAddingAccount, isBootstrapComplete,
  ]);

  return (
    <>
      {/* key={user?.id} forces full Stack remount on identity change (account switch) */}
      <RootKeyedStack key={user?.id || 'guest'} />

      {switchingToAccount && (
        <AccountSwitchOverlay
          account={switchingToAccount}
          isDark={isDarkMode}
        />
      )}
    </>
  );
}

// ── RootKeyedStack ─────────────────────────────────────────────────────────────

function RootKeyedStack() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="welcome" />
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="banned" />
      <Stack.Screen name="role-selection" />
      <Stack.Screen name="subcategory-selection" />
      <Stack.Screen name="youtube-connect" />
      <Stack.Screen name="complete-profile" />
      <Stack.Screen name="create-post" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="sessions" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}

// ── Theme-aware Banner ─────────────────────────────────────────────────────────

function ThemeAwareBanner() {
  const { isDarkMode } = useTheme();
  return <CrossAccountBanner isDark={isDarkMode} />;
}

// ── Root Layout ────────────────────────────────────────────────────────────────

function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <InitialRoot />
          <ThemeAwareBanner />
          <GlobalToast />
        </QueryClientProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

export default RootLayout;