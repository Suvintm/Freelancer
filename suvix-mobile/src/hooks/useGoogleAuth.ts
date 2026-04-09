import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { useEffect, useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../store/useAuthStore';
import { api } from '../api/client';

export const useGoogleAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const setAuth = useAuthStore((state) => state.setAuth);
  const router = useRouter();

  // --- CONFIGURATION ---
  const webClientId = (process.env as any).EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '';
  const iosClientId = (process.env as any).EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '';

  useEffect(() => {
    if (webClientId) {
      GoogleSignin.configure({
        webClientId: webClientId,
        iosClientId: iosClientId,
        offlineAccess: false,
      });
    }
  }, [webClientId, iosClientId]);

  const handleBackendExchange = useCallback(async (idToken: string) => {
    if (!idToken) {
      Alert.alert('Auth Error', 'No ID Token received from Google.');
      return;
    }

    setIsLoading(true);
    try {
      // 1. Initial Check & Login
      const res = await api.post('/auth/google/mobile', { idToken });

      if (res.data.success) {
        if (res.data.isNewUser) {
          // CASE: New Social Account
          // Buffer the Google info locally until they finish Profile Finalization
          const { setTempSignupData } = useAuthStore.getState();
          setTempSignupData({
            googleIdToken: idToken,
            isSocialSignup: true,
            socialProfile: res.data.socialProfile
          });

          // Take them to the missing details screen
          router.push('/complete-profile');
        } else {
          // CASE: Existing user
          // Log in immediately as requested
          const { user, token, refreshToken } = res.data;
          await setAuth(user, token, refreshToken);
          router.replace('/(tabs)');
        }
      }
    } catch (error: any) {
      console.error('Google Auth Backend Error:', error.response?.data || error.message);
      Alert.alert('Login Failed', 'We couldn\'t verify your Google account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [router, setAuth]);

  const signIn = async () => {
    if (!webClientId) {
       Alert.alert('Configuration Error', 'Google Web Client ID is missing. Check your .env file.');
       return;
    }

    setIsLoading(true);
    try {
      // FORCE ACCOUNT PICKER: Sign out from the local SDK session 
      // This ensures Google shows the "Choose an Account" prompt every time.
      try {
        await GoogleSignin.signOut();
      } catch (e) {
        // Ignore errors if already signed out
      }

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

  return { signIn, isLoading, isDisabled: !webClientId };
};
