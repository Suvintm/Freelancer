import * as Google from 'expo-auth-session/providers/google';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState, useMemo } from 'react';
import { Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../store/useAuthStore';
import api from '../services/api';

WebBrowser.maybeCompleteAuthSession();

// Google's Discovery Document
const discovery = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};

export const useGoogleAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const setAuth = useAuthStore((state) => state.setAuth);
  const router = useRouter();

  const nonce = useMemo(() => 'suvix_auth_' + Math.random().toString(36).substring(7), []);

  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: ((process.env as any)['EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID'] as string) || '',
    iosClientId: ((process.env as any)['EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID'] as string) || '',
    webClientId: ((process.env as any)['EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID'] as string) || '',
    redirectUri: ((process.env as any)['EXPO_PUBLIC_GOOGLE_REDIRECT_URL'] as string) || '',
    scopes: ['openid', 'profile', 'email'],
    responseType: 'id_token',
    extraParams: {
      nonce: nonce,
    },
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { params, authentication } = response;
      // Extract from params OR authentication object (depends on Android version/flow)
      const idToken = params.id_token || authentication?.idToken;
      
      if (idToken) {
        handleBackendExchange(idToken);
      } else {
        Alert.alert('Auth Error', 'Could not retrieve ID token from Google.');
      }
    }
  }, [response]);

  const handleBackendExchange = async (idToken: string) => {
    if (!idToken) {
      Alert.alert('Auth Error', 'No ID Token received from Google.');
      return;
    }

    setIsLoading(true);
    try {
      // Endpoint identified in backend research
      const res = await api.post('/auth/google/mobile', { idToken });

      if (res.data.success) {
        if (res.data.requiresRoleSelection) {
          // New user - needs to select role (matching web flow)
          // Store temp token and user for finalize call
          router.push({
            pathname: '/role-selection',
            params: { 
              token: res.data.token, 
              email: res.data.user.email,
              name: res.data.user.name 
            }
          });
        } else {
          // Existing user - login successful
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
  };

  const signIn = async () => {
    if (request) {
      promptAsync();
    } else {
      Alert.alert('Configuration Error', 'Google Login is not configured correctly. Check your Client IDs.');
    }
  };

  return { signIn, isLoading, isDisabled: !request };
};
