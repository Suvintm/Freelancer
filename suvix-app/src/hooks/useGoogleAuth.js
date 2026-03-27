import * as Google from 'expo-auth-session/providers/google';
import * as AuthSession from 'expo-auth-session';
/** v1.0.3 - Total Redirect Control **/
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { useAuthStore } from '../context/useAuthStore';
import { API_URL } from '../config/api';
import { Alert, Platform } from 'react-native';

WebBrowser.maybeCompleteAuthSession();

// Google's Discovery Document (Required for generic useAuthRequest)
const discovery = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};

export const useGoogleAuth = (onSuccess, onRoleSelectionRequired) => {
  const [isLoading, setIsLoading] = useState(false);
  const { setAuth } = useAuthStore();

  const clientId = useMemo(() => {
    if (Platform.OS === 'android') return process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
    if (Platform.OS === 'ios') return process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
    return process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  }, []);

  const nonce = useMemo(() => 'suvix_auth_' + Math.random().toString(36).substring(7), []);

  const authRequestConfig = useMemo(() => ({
    clientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    scopes: ['openid', 'profile', 'email'],
    redirectUri: 'https://auth.expo.io/@suvin1515/suvix-app',
    responseType: 'id_token',
    usePKCE: false,
    extraParams: {
      nonce: nonce,
    },
  }), [nonce]);

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    authRequestConfig,
    discovery
  );

  useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;
      handleBackendExchange(authentication.idToken);
    }
  }, [response]);

  const handleBackendExchange = async (idToken) => {
    setIsLoading(true);
    try {
      const res = await axios.post(`${API_URL}/auth/oauth/google/mobile`, { idToken });

      if (res.data.success) {
        if (res.data.requiresRoleSelection) {
          // New user - needs to select role (matching web flow)
          onRoleSelectionRequired(res.data.token, res.data.user);
        } else {
          // Existing user - login successful
          await setAuth(res.data.user, res.data.token);
          onSuccess();
        }
      }
    } catch (error) {
      console.error('Google Auth Backend Error:', error.response?.data || error.message);
      Alert.alert('Login Failed', 'We couldn\'t verify your Google account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async () => {
    if (request) {
      console.log('--- SIGN-IN TRIGGERED ---');
      promptAsync();
    } else {
        Alert.alert('Configuration Error', 'Google Login is not configured correctly.');
    }
  };

  return { signIn, isLoading, isDisabled: !request };
};
