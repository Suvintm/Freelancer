import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { useEffect, useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import { useAuthStore } from '../store/useAuthStore';
import { api } from '../api/client';

export const useGoogleAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const setAuth = useAuthStore((state) => state.setAuth);
  const router = useRouter();

  // 🛡️ [RESILIENCE] Detect Client IDs from Expo Constants (Reliable for Production APK)
  const extra = Constants.expoConfig?.extra || {};
  const webClientId = extra.googleWebClientId || '';
  const iosClientId = extra.googleIosClientId || '';

  useEffect(() => {
    if (webClientId) {
      GoogleSignin.configure({
        webClientId,
        iosClientId,
        offlineAccess: false,
      });
      console.log('✅ [Google-Auth] Configured with webClientId:', webClientId.substring(0, 10) + '...');
    } else {
      console.warn('⚠️ [Google-Auth] webClientId is MISSING. Login will be disabled.');
    }
  }, [webClientId, iosClientId]);

  /**
   * PRODUCTION PATTERN: Shared handler for all Google auth responses.
   * Handles new users, existing users, and the "forgot-I-had-an-account" auto-login case.
   */
  const handleAuthResponse = useCallback(async (data: any, idToken: string) => {
    if (data.isNewUser) {
      // Buffer Google identity + mark as social signup
      const { setTempSignupData, tempSignupData } = useAuthStore.getState();
      setTempSignupData({
        ...tempSignupData,
        googleIdToken: idToken,
        isSocialSignup: true,
        socialProfile: data.socialProfile,
      });

      // ROLE-FIRST PATTERN:
      // If user clicked Google from login page (no role yet) → role-selection first
      // If user clicked Google from signup page (role already selected) → complete-profile
      const currentStore = useAuthStore.getState();
      if (currentStore.tempSignupData?.categoryId) {
        router.push('/complete-profile');
      } else {
        router.push('/role-selection');
      }
    } else {
      // Existing user — setAuth and let the _layout.tsx guard route them
      // to the correct dashboard based on their role
      const { user, token, refreshToken } = data;
      await setAuth(user, token, refreshToken);

      if (data.alreadyLoggedIn) {
        Alert.alert(
          '👋 Welcome Back!',
          `You already have a SuviX account as a ${user?.primaryRole?.category || 'member'}. We've logged you in.`
        );
      }
      // No manual router.replace here — the _layout.tsx auth guard
      // automatically routes to /(tabs) when isAuthenticated + user is set.
    }
  }, [router, setAuth]);

  const handleBackendExchange = useCallback(async (idToken: string) => {
    if (!idToken) {
      Alert.alert('Auth Error', 'No ID Token received from Google.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.post('/auth/google/mobile', { idToken });
      if (res.data.success) {
        await handleAuthResponse(res.data, idToken);
      }
    } catch (error: any) {
      console.error('Google Auth Backend Error:', error.response?.data || error.message);
      Alert.alert('Login Failed', "We couldn't verify your Google account. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [handleAuthResponse]);

  const signIn = async () => {
    if (!webClientId) {
      Alert.alert('Configuration Error', 'Google Web Client ID is missing. Check your .env file.');
      return;
    }

    setIsLoading(true);
    try {
      // Force "Choose an Account" picker every time
      try { await GoogleSignin.signOut(); } catch (e) { /* ignore */ }

      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const idToken = userInfo.data?.idToken;

      if (idToken) {
        await handleBackendExchange(idToken);
      } else {
        throw new Error('No idToken found in native response');
      }
    } catch (error: any) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log('User cancelled the login flow');
      } else if (error.code === statusCodes.IN_PROGRESS) {
        console.log('Login already in progress');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        Alert.alert('Play Services', 'Google Play Services are not available or outdated.');
      } else {
        console.error('Native Google Sign-In Error:', error);
        Alert.alert('Login Error', 'An unexpected error occurred during Google Sign-In.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return { signIn, isLoading, isDisabled: !webClientId, handleAuthResponse };
};
