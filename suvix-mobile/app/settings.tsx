/**
 * settings.tsx — Account & Security Settings
 *
 * Production-grade settings screen featuring:
 * - Multi-account management section
 * - "Log Out All Devices" (nuclear option) with confirmation
 * - Active sessions viewer
 * - Security preferences (linked from authController)
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  Platform,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAuthStore } from '../src/store/useAuthStore';
import { useAccountVault } from '../src/hooks/useAccountVault';
import { useTheme } from '../src/context/ThemeContext';
import { api } from '../src/api/client';
import { ProcessingOverlay } from '../src/components/shared/ProcessingOverlay';

export default function SettingsScreen() {
  const router = useRouter();
  const { theme, isDarkMode } = useTheme();
  const { user, logout } = useAuthStore();
  const vault = useAccountVault();
  const accounts = vault.getAllAccounts();

  const [isLoggingOutAll, setIsLoggingOutAll] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showSwitchOverlay, setShowSwitchOverlay] = useState(false);
  const [switchingToName, setSwitchingToName] = useState('');

  const bg = isDarkMode ? '#0A0A0A' : '#F4F4F5';
  const cardBg = isDarkMode ? '#141414' : '#FFFFFF';
  const textColor = isDarkMode ? '#F9FAFB' : '#111827';
  const subColor = isDarkMode ? '#9CA3AF' : '#6B7280';
  const divider = isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const dangerColor = '#EF4444';

  // ─── Handlers ───────────────────────────────────────────────────────────────
  const handleLogout = () => {
    const activeUsername = user?.username || vault.accounts[vault.activeAccountId || '']?.username || 'this account';
    Alert.alert(
      'Log Out',
      `Log out of @${activeUsername}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            setIsLoggingOut(true);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            await logout();
            setIsLoggingOut(false);
          },
        },
      ]
    );
  };

  const handleLogoutAll = () => {
    Alert.alert(
      '🚨 Log Out of All Devices',
      'This will immediately terminate every active session on every device — including devices you do not currently have access to.\n\nUse this if your account may have been compromised.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out Everywhere',
          style: 'destructive',
          onPress: async () => {
            setIsLoggingOutAll(true);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            try {
              const response = await api.post('/auth/logout-all');
              console.log(`[SECURITY] Revoked ${response.data.sessionsRevoked} sessions.`);
            } catch { /* server error — still clear locally */ }

            // Wipe ALL vault data
            await vault.clearAll();
            useAuthStore.setState({
              token: null,
              refreshToken: null,
              user: null,
              isAuthenticated: false,
            });
            setIsLoggingOutAll(false);
          },
        },
      ]
    );
  };

  const [isSwitching, setIsSwitching] = useState<string | null>(null);

  const handleSwitch = async (targetUserId: string) => {
    if (targetUserId === vault.activeAccountId || isSwitching) return;
    
    setIsSwitching(targetUserId);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      // 🚀 ATOMIC SWITCH: 
      // This handles vault swap, profile fetch, and global state lock.
      // The _layout.tsx will automatically show the switch overlay via useAuthStore.
      // The _layout.tsx will also force a Stack re-mount once the switch completes (via key={user.id}).
      const result = await useAuthStore.getState().switchAccount(targetUserId);
      
      if (result === 'needs_reauth') {
        const targetAcc = useAccountVault.getState().accounts[targetUserId];
        router.push({ 
          pathname: '/login', 
          params: { mode: 'reauth', email: targetAcc?.email } 
        });
      }

      // Cleanup local guard — the component itself might unmount due to RootKeyedStack
      setIsSwitching(null);
    } catch (err) {
      setIsSwitching(null);
      console.error('Account Switch Error:', err);
      Alert.alert('Switch Error', 'An unexpected error occurred during account switch.');
    }
  };

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
      <ProcessingOverlay 
        isVisible={showSwitchOverlay} 
        message={`Switching to @${switchingToName}...`} 
      />
      <ProcessingOverlay isVisible={isLoggingOut} message="Logging out..." />
      <ProcessingOverlay isVisible={isLoggingOutAll} message="Revoking all sessions..." />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: divider }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textColor }]}>Settings</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>

        {/* ── Active Account Card ── */}
        <View style={[styles.profileCard, { backgroundColor: cardBg }]}>
          <View style={styles.profileRow}>
            {user?.profilePicture ? (
              <Image source={{ uri: user.profilePicture }} style={styles.profileAvatar} />
            ) : (
              <View style={[styles.profileAvatarPlaceholder, { backgroundColor: '#8B5CF620' }]}>
                <Text style={styles.profileAvatarInitial}>
                  {(user?.name || user?.username || 'U')[0].toUpperCase()}
                </Text>
              </View>
            )}
            <View style={styles.profileInfo}>
              <Text style={[styles.profileName, { color: textColor }]}>{user?.name || '—'}</Text>
              <Text style={[styles.profileUsername, { color: subColor }]}>@{user?.username || '—'}</Text>
              <Text style={[styles.profileEmail, { color: subColor }]}>{user?.email || '—'}</Text>
            </View>
          </View>
        </View>

        {/* ── Accounts Section ── */}
        <SectionHeader title="ACCOUNTS" color={subColor} />
        <View style={[styles.card, { backgroundColor: cardBg }]}>

          {/* All stored accounts */}
          {accounts.map((account, index) => (
            <View key={account.userId}>
              <View style={styles.accountRow}>
                {account.profilePicture ? (
                  <Image source={{ uri: account.profilePicture }} style={styles.accountAvatar} />
                ) : (
                  <View style={[styles.accountAvatarPlaceholder, { backgroundColor: isDarkMode ? '#27272a' : '#e4e4e7' }]}>
                    <Text style={{ fontSize: 14, fontWeight: '800', color: textColor }}>
                      {(account.displayName || account.username || '?')[0].toUpperCase()}
                    </Text>
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={[styles.accountName, { color: textColor }]}>{account.displayName}</Text>
                  <Text style={[styles.accountUsername, { color: subColor }]}>@{account.username}</Text>
                </View>
                {account.userId === vault.activeAccountId ? (
                  <View style={styles.activePill}>
                    <Ionicons name="checkmark-circle" size={12} color="#8B5CF6" style={{ marginRight: 4 }} />
                    <Text style={styles.activePillText}>Active</Text>
                  </View>
                ) : (
                  <TouchableOpacity 
                    style={[styles.switchBtn, { backgroundColor: isDarkMode ? '#27272a' : '#f4f4f5' }]}
                    onPress={() => handleSwitch(account.userId)}
                    disabled={!!isSwitching}
                  >
                    {isSwitching === account.userId ? (
                      <ActivityIndicator size="small" color="#8B5CF6" />
                    ) : (
                      <Text style={[styles.switchBtnText, { color: textColor }]}>
                        {account.isRememberedOnly ? 'Login' : 'Switch'}
                      </Text>
                    )}
                  </TouchableOpacity>
                )}
              </View>
              {index < accounts.length - 1 && (
                <View style={[styles.rowDivider, { backgroundColor: divider }]} />
              )}
            </View>
          ))}

          <View style={[styles.rowDivider, { backgroundColor: divider }]} />

          {/* Add Account */}
          <SettingsRow
            icon="add-circle-outline"
            iconColor="#8B5CF6"
            label="Add Account"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              Alert.alert(
                'Add Account',
                'Would you like to log into an existing account or create a new one?',
                [
                  {
                    text: 'Log Into Existing Account',
                    onPress: () => {
                      useAuthStore.getState().setIsAddingAccount(true);
                      router.push({ pathname: '/login', params: { mode: 'add' } });
                    },
                  },
                  {
                    text: 'Create New Account',
                    onPress: () => {
                      useAuthStore.getState().setIsAddingAccount(true);
                      router.push('/role-selection');
                    },
                  },
                  {
                    text: 'Cancel',
                    style: 'cancel',
                  },
                ],
                { cancelable: true }
              );
            }}
            textColor={textColor}
            subColor={subColor}
          />
        </View>

        <SectionHeader title="SECURITY" color={subColor} />
        <View style={[styles.card, { backgroundColor: cardBg }]}>
          <SettingsRow
            icon="key-outline"
            iconColor="#10B981"
            label="Active Sessions"
            sublabel="View & revoke device sessions"
            onPress={() => router.push('/sessions')}
            textColor={textColor}
            subColor={subColor}
          />
          <View style={[styles.rowDivider, { backgroundColor: divider }]} />
          <SettingsRow
            icon="lock-closed-outline"
            iconColor="#F59E0B"
            label="Change Password"
            onPress={() => router.push('/forgot-password')}
            textColor={textColor}
            subColor={subColor}
          />
        </View>

        {/* ── Danger Zone ── */}
        <SectionHeader title="DANGER ZONE" color={dangerColor} />
        <View style={[styles.card, { backgroundColor: cardBg }]}>
          {/* Log Out This Account */}
          <TouchableOpacity style={styles.dangerRow} onPress={handleLogout} disabled={isLoggingOut}>
            <View style={[styles.iconWrap, { backgroundColor: '#EF444415' }]}>
              <Ionicons name="log-out-outline" size={18} color={dangerColor} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.dangerLabel, { color: dangerColor }]}>
                Log Out{accounts.length > 1 ? ' This Account' : ''}
              </Text>
              {accounts.length > 1 && (
                <Text style={[styles.dangerSub, { color: subColor }]}>
                  @{user?.username} · stays on other {accounts.length - 1} account{accounts.length > 2 ? 's' : ''}
                </Text>
              )}
            </View>
            {isLoggingOut && <ActivityIndicator size="small" color={dangerColor} />}
          </TouchableOpacity>

          <View style={[styles.rowDivider, { backgroundColor: divider }]} />

          {/* 🚨 Nuclear Option */}
          <TouchableOpacity
            style={styles.dangerRow}
            onPress={handleLogoutAll}
            disabled={isLoggingOutAll}
          >
            <View style={[styles.iconWrap, { backgroundColor: '#EF444415' }]}>
              <MaterialCommunityIcons name="shield-remove-outline" size={18} color={dangerColor} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.dangerLabel, { color: dangerColor }]}>Log Out of All Devices</Text>
              <Text style={[styles.dangerSub, { color: subColor }]}>
                Revokes every session instantly. Use if compromised.
              </Text>
            </View>
            {isLoggingOutAll && <ActivityIndicator size="small" color={dangerColor} />}
          </TouchableOpacity>
        </View>

        <Text style={[styles.version, { color: subColor }]}>SuviX v1.0 · Session vault v1</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Sub-Components ──────────────────────────────────────────────────────────
function SectionHeader({ title, color }: { title: string; color: string }) {
  return (
    <Text style={[styles.sectionHeader, { color }]}>{title}</Text>
  );
}

function SettingsRow({
  icon, iconColor, label, sublabel, onPress, textColor, subColor
}: {
  icon: string; iconColor: string; label: string; sublabel?: string;
  onPress: () => void; textColor: string; subColor: string;
}) {
  return (
    <TouchableOpacity style={styles.settingsRow} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.iconWrap, { backgroundColor: `${iconColor}18` }]}>
        <Ionicons name={icon as any} size={18} color={iconColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.settingsLabel, { color: textColor }]}>{label}</Text>
        {sublabel && <Text style={[styles.settingsSub, { color: subColor }]}>{sublabel}</Text>}
      </View>
      <Ionicons name="chevron-forward" size={16} color={subColor} />
    </TouchableOpacity>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 6 },
  headerTitle: { fontSize: 17, fontWeight: '800', letterSpacing: -0.3 },

  profileCard: {
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  profileAvatar: { width: 56, height: 56, borderRadius: 28, borderWidth: 2, borderColor: '#8B5CF6' },
  profileAvatarPlaceholder: {
    width: 56, height: 56, borderRadius: 28,
    justifyContent: 'center', alignItems: 'center',
  },
  profileAvatarInitial: { fontSize: 22, fontWeight: '800', color: '#8B5CF6' },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 16, fontWeight: '800' },
  profileUsername: { fontSize: 13, fontWeight: '600', marginTop: 1 },
  profileEmail: { fontSize: 11, fontWeight: '500', marginTop: 2 },

  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 24,
    marginBottom: 8,
    marginHorizontal: 20,
  },
  card: {
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  rowDivider: { height: StyleSheet.hairlineWidth, marginHorizontal: 16 },

  accountRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  accountAvatar: { width: 40, height: 40, borderRadius: 20, borderWidth: 1.5, borderColor: '#8B5CF680' },
  accountAvatarPlaceholder: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
  },
  accountName: { fontSize: 14, fontWeight: '700' },
  accountUsername: { fontSize: 12, fontWeight: '500', marginTop: 1 },
  activePill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#8B5CF620', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  activePillText: { fontSize: 11, fontWeight: '700', color: '#8B5CF6' },
  switchBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 10, justifyContent: 'center' },
  switchBtnText: { fontSize: 12, fontWeight: '800' },
  rememberedPill: { backgroundColor: '#F59E0B20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  rememberedPillText: { fontSize: 11, fontWeight: '700', color: '#F59E0B' },

  settingsRow: {
    flexDirection: 'row', alignItems: 'center',
    padding: 14, gap: 12,
  },
  iconWrap: { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  settingsLabel: { fontSize: 15, fontWeight: '600' },
  settingsSub: { fontSize: 12, fontWeight: '500', marginTop: 1 },

  dangerRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  dangerLabel: { fontSize: 15, fontWeight: '700' },
  dangerSub: { fontSize: 12, fontWeight: '500', marginTop: 1 },

  version: { textAlign: 'center', fontSize: 11, fontWeight: '500', marginTop: 32 },
});
