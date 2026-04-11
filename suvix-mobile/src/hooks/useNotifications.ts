import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { api } from '../api/client';
import { useAuthStore } from '../store/useAuthStore';

/**
 * PRODUCTION-GRADE PUSH NOTIFICATION SETUP
 * 
 * This hook handles the full push notification lifecycle:
 * 1. Requests OS permission from the user.
 * 2. Retrieves the unique Expo/FCM Push Token for this device.
 * 3. Registers the token with our backend so the server can
 *    target this specific device for push alerts.
 * 4. Sets up foreground notification handlers for in-app alerts.
 * 
 * Must be called ONCE at the root of the authenticated app tree.
 */

// ── Configure how notifications appear when the app is IN the foreground ─────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,   // Show the banner even when app is open
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

async function registerForPushNotificationsAsync(): Promise<string | null> {
  // Push notifications only work on real physical devices
  if (!Device.isDevice) {
    console.log('⚠️ [PUSH] Push notifications require a physical device (not emulator).');
    return null;
  }

  // Request permissions (Android 13+ requires this, iOS always does)
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    console.log('🔔 [PUSH] Requesting notification permissions...');
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('⚠️ [PUSH] Permission denied for push notifications.');
    return null;
  }

  // Android requires a notification channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('suvix-default', {
      name: 'SuviX Notifications',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#6C63FF',
      sound: 'default',
    });
    await Notifications.setNotificationChannelAsync('suvix-important', {
      name: 'Important Alerts',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 400, 200, 400],
      lightColor: '#FF6584',
      sound: 'default',
    });
  }

  // Get the Native FCM Device Token — this is what the Firebase backend needs
  try {
    const tokenData = await Notifications.getDevicePushTokenAsync();
    console.log('✅ [PUSH] Native FCM Token obtained:', String(tokenData.data).substring(0, 20) + '...');
    return tokenData.data as string;
  } catch (err: any) {
    console.warn('❌ [PUSH] Failed to get native push token:', err.message);
    return null;
  }
}

export function useNotifications() {
  const { isAuthenticated, token: authToken } = useAuthStore();
  const registrationAttempted = useRef(false);
  const notificationListener = useRef<any>(null);
  const responseListener = useRef<any>(null);

  useEffect(() => {
    // Only register when the user is authenticated
    if (!isAuthenticated || registrationAttempted.current) return;
    registrationAttempted.current = true;

    const setupPushNotifications = async () => {
      const pushToken = await registerForPushNotificationsAsync();

      if (pushToken && authToken) {
        try {
          await api.post('/notifications/tokens', {
            token: pushToken,
            platform: Platform.OS,
          });
          console.log('✅ [PUSH] Token registered with SuviX server.');
        } catch (err: any) {
          console.warn('⚠️ [PUSH] Failed to register token with server:', err.message);
        }
      }
    };

    setupPushNotifications();

    // ── Listen for notifications received while app is open ──────────────────
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('🔔 [PUSH] Notification received in foreground:', notification.request.content.title);
    });

    // ── Listen for when user taps a notification ─────────────────────────────
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      console.log('👆 [PUSH] Notification tapped. Metadata:', data);
      // TODO: Add deep-link routing here based on data.type
      // e.g., if (data.type === 'SYNC_COMPLETE') router.push('/profile')
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, [isAuthenticated, authToken]);
}
