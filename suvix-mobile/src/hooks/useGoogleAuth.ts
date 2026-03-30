import * as AuthSession from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../store/useAuthStore';
import api from '../services/api';

WebBrowser.maybeCompleteAuthSession();

export const useGoogleAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const setAuth = useAuthStore((state) => state.setAuth);
  const router = useRouter();

  // --- CRITICAL: PREVENT Hard Crash if Env Vars are missing ---
  // If these are undefined in production, the hook will throw a fatal error.
  // We use fallback strings and a 'configLoaded' flag to keep the app alive.
  const androidClientId = (process.env as any).EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || '';
  const iosClientId = (process.env as any).EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '';
  const webClientId = (process.env as any).EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '';
  

  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId,
    iosClientId,
    webClientId,
    redirectUri: AuthSession.makeRedirectUri({
      scheme: 'in.suvix.mobile', // Updated to match your new package name
      path: 'oauth2redirect',
    }),
    scopes: ['openid', 'profile', 'email'],
    responseType: 'id_token',
  });

  const handleBackendExchange = useCallback(async (idToken: string) => {
    if (!idToken) {
      Alert.alert('Auth Error', 'No ID Token received from Google.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.post('/auth/google/mobile', { idToken });

      if (res.data.success) {
        if (res.data.requiresRoleSelection) {
          router.push({
            pathname: '/role-selection',
            params: { 
              token: res.data.token, 
              name: res.data.user.name 
            }
          });
        } else {
          const { user, token } = res.data;
          await setAuth(user, token);
          router.replace('/');
        }
      }
    } catch (error: any) {
      console.error('Google Auth Backend Error:', error.response?.data || error.message);
      Alert.alert('Login Failed', 'We couldn\'t verify your Google account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [router, setAuth]);

  useEffect(() => {
    if (response?.type === 'success') {
      const { params, authentication } = response;
      const idToken = params.id_token || authentication?.idToken;
      
      if (idToken) {
        handleBackendExchange(idToken);
      } else {
        Alert.alert('Auth Error', 'Could not retrieve ID token from Google.');
      }
    }
  }, [response, handleBackendExchange]);

  const signIn = async () => {
    if (!androidClientId || !webClientId) {
      console.error('MISSING_CLIENT_IDS', { android: androidClientId, web: webClientId });
      Alert.alert('Configuration Error', 'Google Client IDs are missing in .env. Please check your production build configuration.');
      return;
    }

    if (request) {
      try {
        await promptAsync();
      } catch (e) {
        console.error('Google Prompt Error:', e);
        Alert.alert('Login Error', 'Failed to open Google login. Please try again.');
      }
    } else {
      Alert.alert('Initialization Error', 'Google Login is still initializing. Please wait a moment.');
    }
  };

  return { signIn, isLoading, isDisabled: !request };
};
