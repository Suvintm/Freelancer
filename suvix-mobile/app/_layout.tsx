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
    dataLoaded,        // ✅ Now properly defined in the store
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

        // 0a. AdMob
        await MobileAds().initialize().catch(err =>
          console.error('❌ [BOOT] AdMob init failed:', err)
        );

        // 1. Re-hydrate secure session
        console.log('🔐 [BOOT] Re-hydrating secure session...');
        await checkAuth();

        // 2. Token safety net — handles edge case where store sync lags
        const currentToken = useAuthStore.getState().token;
        if (!currentToken) {
          const activeTokens = await useAccountVault.getState().getActiveTokens();
          if (activeTokens) {
            useAuthStore.getState().setTokens(activeTokens.accessToken, activeTokens.refreshToken);
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

            // 3a. Pre-fetch dashboard data
            if (currentUser.primaryRole?.group === 'PROVIDER') {
              await fetchEditorDashboard().catch(() => {});
            } else {
              await fetchClientDashboard().catch(() => {});
            }

            // 3b. Pre-warm image cache
            if (currentUser.profilePicture) {
              Image.prefetch(currentUser.profilePicture).catch(() => {});
            }
            const logoUri = Image.resolveAssetSource(require('../assets/whitebglogo.png')).uri;
            Image.prefetch(logoUri).catch(() => {});
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
    // Wait until everything is ready before making any navigation decisions
    if (!isInitialized || !isIntroFinished || !isBootstrapComplete) return;

    const handoffTimer = setTimeout(() => {
      if (isNavigating.current) return;

      const currentSegment = segments[0] as string | undefined;

      const inAuthGroup =
        currentSegment === '(tabs)'       ||
        currentSegment === 'notifications'||
        currentSegment === 'creators'     ||
        currentSegment === 'create-post'  ||
        currentSegment === 'gallery'      ||
        currentSegment === 'reels'        ||
        currentSegment === 'story'        ||
        currentSegment === 'settings'     ||
        currentSegment === 'sessions';

      const inOnboarding =
        currentSegment === 'role-selection'       ||
        currentSegment === 'subcategory-selection'||
        currentSegment === 'youtube-connect'      ||
        currentSegment === 'complete-profile';

      const inPublicGroup =
        currentSegment === 'welcome'        ||
        currentSegment === 'login'          ||
        currentSegment === 'signup'         ||
        currentSegment === 'banned'         ||
        currentSegment === 'forgot-password';

      const isAtRoot       = !currentSegment || currentSegment === 'index';
      const isRestrictedArea = inPublicGroup || inOnboarding || isAtRoot;

      console.log(
        `🚦 [GUARD] seg=${currentSegment} | auth=${isAuthenticated} | user=${!!user} | loading=${isLoadingUser} | dataLoaded=${dataLoaded} | addingAccount=${isAddingAccount}`
      );

      // ── 0. Ban guard ────────────────────────────────────────────────────────
      if (user?.isBanned || (user as any)?.is_banned) {
        if (currentSegment !== 'banned') {
          console.warn('🚫 [GUARD] User banned → /banned');
          isNavigating.current = true;
          router.replace('/banned');
          setTimeout(() => { isNavigating.current = false; }, 1000);
        }
        return;
      }

      // ── 1. Wait for profile hydration to complete ───────────────────────────
      if (isAuthenticated && !user && isLoadingUser) {
        console.log('⏳ [GUARD] Waiting for user profile...');
        return;
      }

      // ── 2. Hydration failed — retry once ───────────────────────────────────
      if (isAuthenticated && !user && dataLoaded && !isLoadingUser) {
        console.log('⚠️ [GUARD] Hydration returned no user. Retrying fetchUser...');
        fetchUser();
        return;
      }

      // ── 3. Unauthenticated ─────────────────────────────────────────────────
      // ✅ Allow users who are in "add account" mode to stay on public pages.
      if (!isAuthenticated || (!user && dataLoaded)) {
        if (!inPublicGroup && !inOnboarding) {
          console.log('🔓 [GUARD] Guest redirected to /welcome');
          isNavigating.current = true;
          router.replace('/welcome');
          setTimeout(() => { isNavigating.current = false; }, 1000);
        }
        return;
      }

      // ── 4. Authenticated ───────────────────────────────────────────────────
      const isOnboarded = user?.isOnboarded;

      // ✅ KEY: isAddingAccount blocks the redirect. User stays on login/signup.
      if (isOnboarded && !isAddingAccount) {
        if (isRestrictedArea && currentSegment !== 'banned') {
          console.log('🚀 [GUARD] Onboarded user → /(tabs)');
          isNavigating.current = true;
          router.replace('/(tabs)');
          setTimeout(() => { isNavigating.current = false; }, 1200);
        }
        return;
      }

      // ── 5. Not yet onboarded ───────────────────────────────────────────────
      if (!isOnboarded && !isAddingAccount) {
        if (!inOnboarding) {
          const isMissingSocialData = !user?.username || !user?.name;
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
      {/* Key on user.id forces a full Stack re-mount on identity change */}
      <RootKeyedStack key={user?.id || 'guest'} />

      {/* Premium account switch overlay */}
      {switchingToAccount && (
        <AccountSwitchOverlay account={switchingToAccount} isDark={isDarkMode} />
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

// ── RootLayout ─────────────────────────────────────────────────────────────────

function ThemeAwareBanner() {
  const { isDarkMode } = useTheme();
  return <CrossAccountBanner isDark={isDarkMode} />;
}

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