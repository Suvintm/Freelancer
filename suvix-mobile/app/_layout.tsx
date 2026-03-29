import { Stack, useRouter } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '../src/store/useAuthStore';
import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Colors } from '../src/constants/Colors';
import { ThemeProvider, useTheme } from '../src/context/ThemeContext';

const queryClient = new QueryClient();

function InitialRoot() {
  const { isInitialized, isAuthenticated, checkAuth } = useAuthStore();
  const { theme } = useTheme();
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  // --- GLOBAL AUTH GUARD ---
  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.replace('/');
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
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <InitialRoot />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
