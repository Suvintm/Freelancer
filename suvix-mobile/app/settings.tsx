import React, { useState, useEffect, useRef } from 'react';
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
  TextInput,
  StatusBar,
  Animated,
  Dimensions
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../src/store/useAuthStore';
import { useAccountVault } from '../src/hooks/useAccountVault';
import { useTheme } from '../src/context/ThemeContext';
import { api } from '../src/api/client';
import { ProcessingOverlay } from '../src/components/shared/ProcessingOverlay';
import { Colors } from '../src/constants/Colors';

const { width } = Dimensions.get('window');

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme, isDarkMode } = useTheme();
  const { user, logout } = useAuthStore();
  const vault = useAccountVault();
  const accounts = vault.getAllAccounts();

  const [isLoggingOutAll, setIsLoggingOutAll] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSwitching, setIsSwitching] = useState<string | null>(null);

  // ── Animation ─────────────────────────────────────────────────────────────
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 20, friction: 8, useNativeDriver: true })
    ]).start();
  }, []);

  const palette = isDarkMode ? Colors.dark : Colors.light;
  const bg = isDarkMode ? '#050505' : '#F8FAFC';
  const cardBg = isDarkMode ? '#111111' : '#FFFFFF';
  const border = isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleLogout = () => {
    Alert.alert('Sign Out', `Sign out of @${user?.username}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          setIsLoggingOut(true);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          await logout();
          setIsLoggingOut(false);
        },
      },
    ]);
  };

  const handleSwitch = async (targetUserId: string) => {
    if (targetUserId === vault.activeAccountId || isSwitching) return;
    setIsSwitching(targetUserId);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const result = await useAuthStore.getState().switchAccount(targetUserId);
      setIsSwitching(null);
      if (result === 'success') {
        router.replace('/(tabs)/profile');
      } else if (result === 'needs_reauth') {
        const account = accounts.find(a => a.userId === targetUserId);
        router.push({
          pathname: '/login',
          params: { mode: 'reauth', userId: targetUserId, email: account?.email ?? '' },
        });
      } else {
        Alert.alert('Switch Error', 'Could not switch accounts.');
      }
    } catch (err) {
      setIsSwitching(null);
      Alert.alert('Switch Error', 'Could not switch accounts.');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} translucent backgroundColor="transparent" />
      <ProcessingOverlay isVisible={isLoggingOut} message="Signing out..." />
      <ProcessingOverlay isVisible={isLoggingOutAll} message="Securing account..." />

      {/* 🏙️ STICKY GLASS CONTROL HEADER */}
      <BlurView intensity={isDarkMode ? 80 : 100} tint={isDarkMode ? 'dark' : 'light'} style={[styles.blurHeader, { paddingTop: insets.top }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: palette.secondary }]}>
            <Ionicons name="chevron-back" size={20} color={palette.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: palette.text }]}>Control Center</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.searchContainer}>
          <View style={[styles.searchBar, { backgroundColor: palette.secondary, borderColor: border }]}>
            <Feather name="search" size={16} color={palette.textSecondary} style={{ marginRight: 10 }} />
            <TextInput
              placeholder="Search preferences..."
              placeholderTextColor={palette.textSecondary}
              style={[styles.searchInput, { color: palette.text }]}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>
      </BlurView>

      <ScrollView 
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 130 }]} 
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          
          {/* 🆔 ACTIVE IDENTITY Hub */}
          <View style={[styles.profileCard, { backgroundColor: cardBg, borderColor: border }]}>
            <LinearGradient
              colors={isDarkMode ? ['rgba(139, 92, 246, 0.1)', 'transparent'] : ['rgba(139, 92, 246, 0.05)', 'transparent']}
              style={styles.cardGlow}
            />
            <View style={styles.profileRow}>
              {user?.profilePicture ? (
                <Image source={{ uri: user.profilePicture }} style={[styles.profileAvatar, { borderColor: palette.accent }]} />
              ) : (
                <View style={[styles.profileAvatarPlaceholder, { backgroundColor: `${palette.accent}20` }]}>
                  <Text style={[styles.profileAvatarInitial, { color: palette.accent }]}>
                    {(user?.name || 'U')[0].toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={styles.profileInfo}>
                <Text style={[styles.profileName, { color: palette.text }]}>{user?.name || 'Pro User'}</Text>
                <Text style={[styles.profileEmail, { color: palette.textSecondary }]}>@{user?.username}</Text>
                <View style={[styles.proBadge, { backgroundColor: `${palette.accent}15` }]}>
                    <Ionicons name="shield-checkmark" size={10} color={palette.accent} />
                    <Text style={[styles.proText, { color: palette.accent }]}>VERIFIED {user?.primaryRole?.categoryName?.toUpperCase()}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* 👥 ACCOUNTS HUB */}
          <SettingsSection title="WORKSPACE ACCOUNTS">
             <View style={[styles.groupCard, { backgroundColor: cardBg, borderColor: border }]}>
                {accounts.map((account, index) => (
                  <View key={account.userId}>
                    <TouchableOpacity 
                      style={styles.accountRow}
                      onPress={() => handleSwitch(account.userId)}
                      activeOpacity={0.7}
                    >
                      {account.profilePicture ? (
                        <Image source={{ uri: account.profilePicture }} style={styles.accAvatar} />
                      ) : (
                        <View style={[styles.accAvatarPlaceholder, { backgroundColor: palette.secondary }]}>
                           <Text style={{ color: palette.text, fontWeight: '800' }}>{account.username[0].toUpperCase()}</Text>
                        </View>
                      )}
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.accName, { color: palette.text }]}>{account.displayName}</Text>
                        <Text style={[styles.accSub, { color: palette.textSecondary }]}>@{account.username}</Text>
                      </View>
                      {account.userId === vault.activeAccountId ? (
                        <Ionicons name="checkmark-circle" size={20} color={palette.accent} />
                      ) : (
                        <Feather name="refresh-cw" size={16} color={palette.textSecondary} />
                      )}
                    </TouchableOpacity>
                    {index < accounts.length - 1 && <View style={[styles.divider, { backgroundColor: border }]} />}
                  </View>
                ))}
                <View style={[styles.divider, { backgroundColor: border }]} />
                <SettingsItem 
                    icon="person-add-outline" 
                    label="Add Work Account" 
                    color="#8B5CF6" 
                    onPress={() => router.push('/login')} 
                    palette={palette}
                />
             </View>
          </SettingsSection>

          {/* 🔒 SECURITY COMMANDS */}
          <SettingsSection title="SECURITY & PRIVACY">
             <View style={[styles.groupCard, { backgroundColor: cardBg, borderColor: border }]}>
                <SettingsItem 
                    icon="key-outline" 
                    label="Active Sessions" 
                    color="#10B981" 
                    onPress={() => router.push('/sessions')} 
                    palette={palette}
                    sublabel="Manage devices logged into SuviX"
                />
                <View style={[styles.divider, { backgroundColor: border }]} />
                <SettingsItem 
                    icon="lock-closed-outline" 
                    label="Change Access Key" 
                    color="#F59E0B" 
                    onPress={() => router.push('/forgot-password')} 
                    palette={palette}
                />
                <View style={[styles.divider, { backgroundColor: border }]} />
                <SettingsItem 
                    icon="eye-off-outline" 
                    label="Privacy Mode" 
                    color="#6366F1" 
                    onPress={() => {}} 
                    palette={palette}
                    hasSwitch
                />
             </View>
          </SettingsSection>

          {/* 🚨 NUCLEAR ZONE */}
          <SettingsSection title="SYSTEM ACTIONS">
             <View style={[styles.groupCard, { backgroundColor: cardBg, borderColor: border }]}>
                <SettingsItem 
                    icon="log-out-outline" 
                    label="Sign Out" 
                    color="#EF4444" 
                    onPress={handleLogout} 
                    palette={palette}
                    isDanger
                />
                <View style={[styles.divider, { backgroundColor: border }]} />
                <SettingsItem 
                    icon="shield-off-outline" 
                    label="Nuclear Logout" 
                    color="#EF4444" 
                    onPress={() => {}} 
                    palette={palette}
                    isDanger
                    sublabel="Revoke all sessions globally"
                />
             </View>
          </SettingsSection>

          <View style={styles.footer}>
            <Text style={[styles.versionText, { color: palette.textSecondary }]}>SuviX Workspace Core v1.4.2</Text>
            <Text style={[styles.versionText, { color: palette.textSecondary, marginTop: 4 }]}>Industrial Grade Enterprise Security Enabled</Text>
          </View>

          <View style={{ height: 100 }} />
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const SettingsSection = ({ title, children }: any) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {children}
  </View>
);

const SettingsItem = ({ icon, label, sublabel, color, onPress, palette, isDanger, hasSwitch }: any) => {
    const [enabled, setEnabled] = useState(false);
    return (
        <TouchableOpacity style={styles.itemRow} onPress={onPress} activeOpacity={0.7}>
            <View style={[styles.itemIcon, { backgroundColor: `${color}15` }]}>
                <Ionicons name={icon} size={18} color={color} />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={[styles.itemLabel, { color: isDanger ? '#EF4444' : palette.text }]}>{label}</Text>
                {sublabel && <Text style={[styles.itemSub, { color: palette.textSecondary }]}>{sublabel}</Text>}
            </View>
            {hasSwitch ? (
                <View style={[styles.switch, { backgroundColor: enabled ? palette.accent : palette.secondary }]}>
                    <TouchableOpacity onPress={() => { setEnabled(!enabled); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }} style={[styles.switchKnob, { marginLeft: enabled ? 18 : 2 }]} />
                </View>
            ) : (
                <Feather name="chevron-right" size={14} color={palette.textSecondary} />
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  blurHeader: {
    position: 'absolute',
    top: 0,
    width: '100%',
    zIndex: 100,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150,150,150,0.1)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    height: 60,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  scrollContent: { 
    paddingHorizontal: 20,
  },
  profileCard: {
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 24,
    overflow: 'hidden',
  },
  cardGlow: {
    ...StyleSheet.absoluteFillObject,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  profileAvatar: {
    width: 64,
    height: 64,
    borderRadius: 22,
    borderWidth: 2,
  },
  profileAvatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileAvatarInitial: {
    fontSize: 24,
    fontWeight: '900',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  profileEmail: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
    opacity: 0.7,
  },
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  proText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginLeft: 12,
    marginBottom: 10,
    opacity: 0.5,
    color: '#808080'
  },
  groupCard: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 16,
  },
  itemIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
  itemSub: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  divider: {
    height: 1,
    marginHorizontal: 16,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  accAvatar: {
    width: 36,
    height: 36,
    borderRadius: 12,
  },
  accAvatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  accName: {
    fontSize: 14,
    fontWeight: '800',
  },
  accSub: {
    fontSize: 11,
    fontWeight: '500',
  },
  switch: {
    width: 42,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
  },
  switchKnob: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFF',
  },
  footer: {
    alignItems: 'center',
    marginTop: 20,
  },
  versionText: {
    fontSize: 10,
    fontWeight: '700',
    opacity: 0.4,
    letterSpacing: 0.5,
  }
});
