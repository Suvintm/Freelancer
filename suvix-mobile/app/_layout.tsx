import { Stack, useRouter } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '../src/store/useAuthStore';
import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Colors } from '../src/constants/Colors';
import { ThemeProvider, useTheme } from '../src/context/ThemeContext';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Maintain the native splash screen while we initialize
SplashScreen.preventAutoHideAsync().catch(() => {
  /* ignore error */
});

const queryClient = new QueryClient();

function InitialRoot() {
  const { isInitialized, isAuthenticated, checkAuth } = useAuthStore();
  const { theme } = useTheme();
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // We don't hide immediately on mount anymore to prevent the white screen.
  // Instead, we wait for the auth state to be initialized below.

  // --- GLOBAL NAVIGATION GUARD ---
  useEffect(() => {
    if (!isInitialized) return;

    // Once we are initialized, hide the native placeholder (white screen)
    SplashScreen.hideAsync().catch(() => {});

    // If we are authenticated but at the root, move to the correct tab dashboard
    if (isAuthenticated) {
      // router.replace('/(tabs)');
    }
  }, [isInitialized, isAuthenticated]);

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
      {/* 
          Note: We don't explicitly name the (tabs) screens here 
          to let Expo Router's automatic discovery handle the nested _layouts 
      */}
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
