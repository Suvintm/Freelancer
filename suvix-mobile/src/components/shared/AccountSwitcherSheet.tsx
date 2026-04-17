/**
 * AccountSwitcherSheet.tsx — Instagram-style account switcher bottom sheet
 *
 * Features:
 * - Shows all logged-in accounts with avatar, username, account type
 * - One-tap account switch with proactive token refresh
 * - "Add Account" button that logs in a new account without touching current session
 * - "Remove Account" on long press with confirmation
 * - "Log out all devices" (nuclear option)
 * - Premium dark/light glassmorphism design
 */
import React, { useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  Platform,
  ScrollView,
} from 'react-native';
import BottomSheet, {
  BottomSheetView,
  BottomSheetBackdrop,
} from '@gorhom/bottom-sheet';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAuthStore } from '../../store/useAuthStore';
import { useAccountVault } from '../../hooks/useAccountVault';
import { AccountCard } from './AccountCard';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface AccountSwitcherSheetProps {
  sheetRef: React.RefObject<BottomSheet>;
  isDark: boolean;
}

export const AccountSwitcherSheet = ({ sheetRef, isDark }: AccountSwitcherSheetProps) => {
  const router = useRouter();
  const { user, logout, fetchUser } = useAuthStore();
  const { getAllAccounts, activeAccountId, switchTo, removeAccount } = useAccountVault();

  const accounts = getAllAccounts();
  const isSwitching = useRef(false);

  const bg = isDark ? '#0F0F0F' : '#FFFFFF';
  const handleBg = isDark ? '#3F3F46' : '#D4D4D8';
  const textColor = isDark ? '#F9FAFB' : '#111827';
  const subColor = isDark ? '#6B7280' : '#9CA3AF';
  const divider = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';

  // ─── Backdrop (tap outside to dismiss) ──────────────────────────────────────
  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
        pressBehavior="close"
      />
    ),
    []
  );

  const close = () => sheetRef.current?.close();

  // ─── Switch Account ──────────────────────────────────────────────────────────
  const handleSwitch = async (userId: string) => {
    if (isSwitching.current || userId === activeAccountId) {
      close();
      return;
    }

    isSwitching.current = true;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const result = await switchTo(userId);

    if (result === 'success') {
      // 🚀 ATOMIC SWITCH: This handles the whole vault swap + profile fetch + state lock
      const switchResult = await useAuthStore.getState().switchAccount(userId);
      
      if (switchResult === 'success') {
        close();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        // Landing the user on the profile page of their new identity as requested
        router.replace('/(tabs)/profile');
      } else {
        Alert.alert('Switch Failed', 'Could not sync the new account profile. Please try again.');
      }
    } else if (result === 'needs_reauth') {
      close();
      // Navigate to login in add-account mode, pre-filled for this account
      const account = getAllAccounts().find(a => a.userId === userId);
      setTimeout(() => {
        router.push({
          pathname: '/login',
          params: { mode: 'reauth', userId, email: account?.email ?? '' }
        });
      }, 300);
    } else {
      Alert.alert('Switch Failed', 'Could not switch to this account. Please try again.');
    }

    isSwitching.current = false;
  };

  // ─── Remove Account ──────────────────────────────────────────────────────────
  const handleRemove = (userId: string) => {
    const account = accounts.find(a => a.userId === userId);
    if (!account) return;

    Alert.alert(
      'Remove Account',
      `Remove @${account.username} from this device?\n\nYou can add it again anytime.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            if (userId === activeAccountId) {
              // Removing active account — let logout handle it
              await logout();
              close();
            } else {
              // Removing an inactive account — just remove from vault
              try {
                await removeAccount(userId);
                // Call server to revoke this specific session
                // (best effort — don't block if it fails)
                const { api } = require('../../api/client');
              } catch { /* fail silently */ }
            }
          },
        },
      ]
    );
  };

  // ─── Add Account ─────────────────────────────────────────────────────────────
  const handleAddAccount = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    Alert.alert(
      'Add Account',
      'Would you like to log into an existing account or create a new one?',
      [
        {
          text: 'Log Into Existing Account',
          onPress: () => {
            useAuthStore.getState().setIsAddingAccount(true);
            close();
            setTimeout(() => {
              router.push({ pathname: '/login', params: { mode: 'add' } });
            }, 300);
          },
        },
        {
          text: 'Create New Account',
          onPress: () => {
            useAuthStore.getState().setIsAddingAccount(true);
            close();
            setTimeout(() => {
              // Skip welcome slides and go straight to role selection
              router.push('/role-selection');
            }, 300);
          },
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  };

  // ─── Logout All ──────────────────────────────────────────────────────────────
  const handleLogoutAll = () => {
    Alert.alert(
      '🚨 Log Out Everywhere',
      'This will immediately log you out of ALL devices and accounts. You will need to enter your password again on all devices.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out All Devices',
          style: 'destructive',
          onPress: async () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            close();
            try {
              const { api } = require('../../api/client');
              await api.post('/auth/logout-all');
            } catch { /* fail silently, logout handles local cleanup */ }
            // Wipe everything locally
            const vault = useAccountVault.getState();
            await vault.clearAll();
            useAuthStore.setState({
              token: null,
              refreshToken: null,
              user: null,
              isAuthenticated: false,
            });
          },
        },
      ]
    );
  };

  return (
    <BottomSheet
      ref={sheetRef}
      index={-1}
      snapPoints={['50%', '75%']}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: bg }}
      handleIndicatorStyle={{ backgroundColor: handleBg, width: 36 }}
      style={styles.sheet}
    >
      <BottomSheetView style={styles.content}>
        {/* ── Header ── */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: textColor }]}>Manage Accounts</Text>
          <TouchableOpacity onPress={close} style={styles.closeBtn}>
            <Ionicons name="close" size={20} color={subColor} />
          </TouchableOpacity>
        </View>

        <Text style={[styles.subtitle, { color: subColor }]}>
          Logged in as @{user?.username}
        </Text>

        {/* ── Account List ── */}
        <ScrollView
          style={styles.list}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 8 }}
        >
          {accounts.map((account) => (
            <AccountCard
              key={account.userId}
              account={account}
              isActive={account.userId === activeAccountId}
              isDark={isDark}
              onPress={() => handleSwitch(account.userId)}
              onLongPress={() => handleRemove(account.userId)}
              onLogout={() => handleRemove(account.userId)}
            />
          ))}

          {/* ── Add Account Button (Integrated in list) ── */}
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: isDark ? 'rgba(139,92,246,0.1)' : 'rgba(139,92,246,0.05)' }]}
            onPress={handleAddAccount}
            activeOpacity={0.8}
          >
            <View style={styles.addIconWrap}>
              <Ionicons name="add" size={20} color="#8B5CF6" />
            </View>
            <Text style={[styles.addBtnText, { color: textColor }]}>Add SuviX account</Text>
            <Ionicons name="chevron-forward" size={16} color={subColor} />
          </TouchableOpacity>
        </ScrollView>

        {/* ── Footer Actions ── */}
        <View style={[styles.footer, { borderTopColor: divider }]}>
          <TouchableOpacity 
            style={[styles.accountsCenterBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}
            onPress={() => { close(); setTimeout(() => router.push('/settings'), 300); }}
          >
            <Text style={[styles.accountsCenterText, { color: textColor }]}>Go to Accounts Center</Text>
          </TouchableOpacity>

          {/* ── Logout All (Secondary Footer) ── */}
          {accounts.length > 1 && (
            <TouchableOpacity
              style={styles.logoutAllBtn}
              onPress={handleLogoutAll}
              activeOpacity={0.8}
            >
              <Text style={styles.logoutAllText}>Log out all devices</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={{ height: Platform.OS === 'ios' ? 24 : 16 }} />
      </BottomSheetView>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 24,
  },
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 4 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
    paddingTop: 4,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: { fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(128,128,128,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  subtitle: { fontSize: 13, fontWeight: '600', marginBottom: 16, opacity: 0.6 },
  list: { maxHeight: SCREEN_HEIGHT * 0.45 },
  footer: {
    paddingTop: 16,
    borderTopWidth: 1,
    marginTop: 8,
  },
  accountsCenterBtn: {
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  accountsCenterText: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginBottom: 10,
    gap: 12,
  },
  addIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(139,92,246,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBtnText: { flex: 1, fontSize: 15, fontWeight: '700' },
  logoutAllBtn: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  logoutAllText: { fontSize: 13, fontWeight: '700', color: '#EF4444' },
});
