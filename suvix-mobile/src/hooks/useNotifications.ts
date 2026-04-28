import { useEffect, useRef, useState, useCallback } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '../api/client';
import { useAuthStore } from '../store/useAuthStore';
import { useAccountVault } from './useAccountVault';
import { getDeviceIdSync } from './useDeviceId';

/**
 * PRODUCTION-GRADE MULTI-ACCOUNT PUSH NOTIFICATIONS
 *
 * Handles:
 * 1. Permission request + push token registration per account
 * 2. Cross-account routing: if notification is for an INACTIVE account,
 *    shows an in-app banner instead of navigating blindly
 * 3. Deep-link routing based on notification data.type
 * 4. Re-registration when active account switches
 */

// ── In-app notification banner state (exported for UI to consume) ──────────
interface CrossAccountBanner {
  isVisible: boolean;
  title: string;
  body: string;
  targetAccountId: string;
  targetUsername: string;
  targetProfilePicture: string | null;
  onSwitch: () => void;
  onDismiss: () => void;
}

let _setBanner: ((b: CrossAccountBanner | null) => void) | null = null;

export function useCrossAccountBanner() {
  const [banner, setBanner] = useState<CrossAccountBanner | null>(null);
  useEffect(() => { _setBanner = setBanner; return () => { _setBanner = null; }; }, []);
  return banner;
}

// ── Configure foreground behaviour ─────────────────────────────────────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

async function getPushToken(): Promise<string | null> {
  if (!Device.isDevice) {
    console.log('⚠️ [PUSH] Push notifications require a physical device.');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('⚠️ [PUSH] Permission denied.');
    return null;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('suvix-default', {
      name: 'SuviX Notifications',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#8B5CF6',
      sound: 'default',
    });
    await Notifications.setNotificationChannelAsync('suvix-important', {
      name: 'Important Alerts',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 400, 200, 400],
      lightColor: '#EF4444',
      sound: 'default',
    });
  }

  try {
    const tokenData = await Notifications.getDevicePushTokenAsync();
    return tokenData.data as string;
  } catch (err: any) {
    console.warn('❌ [PUSH] Failed to get push token:', err.message);
    return null;
  }
}

/**
 * Registers the push token for a specific userId + device combo.
 * Called on initial login AND after every account switch.
 */
async function registerTokenForAccount(pushToken: string, userId: string): Promise<void> {
  try {
    const deviceId = getDeviceIdSync();
    await api.post('/notifications/tokens', {
      token: pushToken,
      platform: Platform.OS.toUpperCase(),
      device_id: deviceId,
      user_id: userId, // Backend maps this token to this specific user
    });
    console.log(`✅ [PUSH] Token registered for account ${userId}`);
  } catch (err: any) {
    console.warn(`⚠️ [PUSH] Token registration failed for ${userId}:`, err.message);
  }
}

export function useNotifications() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const { activeAccountId, getAllAccounts } = useAccountVault();

  const pushTokenRef = useRef<string | null>(null);
  const registeredForRef = useRef<string | null>(null); // Which userId we last registered token for
  const notificationListener = useRef<any>(null);
  const responseListener = useRef<any>(null);

  // ── Register push token whenever active account changes ────────────────────
  useEffect(() => {
    if (!isAuthenticated || !activeAccountId) return;
    // Skip if we already registered for this exact account
    if (registeredForRef.current === activeAccountId) return;

    const setup = async () => {
      const token = pushTokenRef.current ?? await getPushToken();
      if (!token) return;

      pushTokenRef.current = token;
      await registerTokenForAccount(token, activeAccountId);
      registeredForRef.current = activeAccountId;
    };

    setup();
  }, [isAuthenticated, activeAccountId]);

  // ── Foreground notification − Cross-account routing ───────────────────────
  useEffect(() => {
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      const data = notification.request.content.data as any;
      const notifAccountId: string | undefined = data?.account_id;

      console.log(`🔔 [PUSH] Notification received. For account: ${notifAccountId ?? 'current'}`);

      if (!notifAccountId || notifAccountId === activeAccountId) {
        // This notification is for the current account — show normally
        return;
      }

      // Notification is for a DIFFERENT (inactive) account — show an in-app banner
      const accounts = getAllAccounts();
      const targetAccount = accounts.find(a => a.userId === notifAccountId);
      if (!targetAccount) return;

      _setBanner?.({
        isVisible: true,
        title: notification.request.content.title ?? 'New notification',
        body: notification.request.content.body ?? '',
        targetAccountId: notifAccountId,
        targetUsername: targetAccount.username,
        targetProfilePicture: targetAccount.profilePicture,
        onSwitch: async () => {
          _setBanner?.(null);
          const result = await useAuthStore.getState().switchAccount(notifAccountId);
          if (result === 'success') {
            // Navigate to the relevant screen
            if (data?.screen) router.push(`/${data.screen}`);
          } else if (result === 'needs_reauth') {
            router.push({
              pathname: '/login',
              params: { mode: 'reauth', email: targetAccount.email },
            });
          }
        },
        onDismiss: () => _setBanner?.(null),
      });
    });

    // ── User taps a notification (app in background/killed) ───────────────────
    responseListener.current = Notifications.addNotificationResponseReceivedListener(async response => {
      const data = response.notification.request.content.data as any;
      const notifAccountId: string | undefined = data?.account_id;

      console.log(`👆 [PUSH] Notification tapped. For account: ${notifAccountId ?? 'current'}`);

      if (notifAccountId && notifAccountId !== activeAccountId) {
        // Need to switch before navigating
        await useAuthStore.getState().switchAccount(notifAccountId);
      }

      // Deep-link routing
      if (data?.screen) {
        setTimeout(() => router.push(`/${data.screen}`), 300);
      }
    });

    return () => {
      if (notificationListener.current) Notifications.removeNotificationSubscription(notificationListener.current);
      if (responseListener.current) Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, [isAuthenticated, activeAccountId]);
}

