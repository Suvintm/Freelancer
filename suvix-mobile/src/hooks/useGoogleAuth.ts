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

  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: (process.env as any).EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    iosClientId: (process.env as any).EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    webClientId: (process.env as any).EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    redirectUri: (process.env as any).EXPO_PUBLIC_GOOGLE_REDIRECT_URL,
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
    if (request) {
      promptAsync();
    } else {
      Alert.alert('Configuration Error', 'Google Login is not configured correctly. Check your Client IDs.');
    }
  };

  return { signIn, isLoading, isDisabled: !request };
};
