/**
 * AccountCard.tsx — Premium account card for the switcher UI
 */
import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { AccountIdentity } from '../../hooks/useAccountVault';

interface AccountCardProps {
  account: AccountIdentity;
  isActive: boolean;
  isDark: boolean;
  onPress: () => void;
  onLongPress: () => void;
  onLogout: () => void;
}

const ROLE_BADGE: Record<string, { label: string; color: string; icon: string }> = {
  creator:    { label: 'Creator',  color: '#8B5CF6', icon: 'star' },
  editor:     { label: 'Creator',  color: '#8B5CF6', icon: 'star' },
  suvix_user: { label: 'Member',   color: '#3B82F6', icon: 'account' },
  admin:      { label: 'Admin',    color: '#EF4444', icon: 'shield' },
};

export const AccountCard = ({ account, isActive, isDark, onPress, onLongPress, onLogout }: AccountCardProps) => {
  const badge = ROLE_BADGE[account.accountType] ?? ROLE_BADGE['suvix_user'];
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => Animated.spring(scaleAnim, { toValue: 0.96, useNativeDriver: true, speed: 50 }).start();
  const handlePressOut = () => Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 50 }).start();

  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
      delayLongPress={500}
    >
      <Animated.View style={[
        styles.card,
        {
          backgroundColor: isDark
            ? isActive ? 'rgba(139,92,246,0.12)' : 'rgba(255,255,255,0.04)'
            : isActive ? 'rgba(139,92,246,0.08)' : 'rgba(0,0,0,0.02)',
          borderColor: isActive
            ? 'rgba(139,92,246,0.5)'
            : isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
        },
        { transform: [{ scale: scaleAnim }] }
      ]}>
        {/* Avatar with active ring */}
        <View style={styles.avatarWrapper}>
          <View style={[
            styles.avatarRing,
            { borderColor: isActive ? '#8B5CF6' : 'transparent' }
          ]}>
            {account.profilePicture ? (
              <Image source={{ uri: account.profilePicture }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: isDark ? '#2D2D2D' : '#E5E7EB' }]}>
                <Text style={[styles.avatarInitial, { color: isDark ? '#FFF' : '#374151' }]}>
                  {(account.displayName || account.username || '?')[0].toUpperCase()}
                </Text>
              </View>
            )}
          </View>
          {isActive && (
            <View style={[styles.activeRingIndicator, { backgroundColor: 'white', borderRadius: 12, padding: 1 }]}>
              <Ionicons name="checkmark-circle" size={20} color="#0095F6" />
            </View>
          )}
        </View>

        {/* Identity Info */}
        <View style={styles.info}>
          <Text style={[styles.displayName, { color: isDark ? '#F9FAFB' : '#111827' }]} numberOfLines={1}>
            {account.displayName || account.username}
          </Text>
          <Text style={[styles.username, { color: isDark ? '#9CA3AF' : '#6B7280' }]} numberOfLines={1}>
            @{account.username}
          </Text>

          {/* Badge */}
          <View style={[styles.badge, { backgroundColor: `${badge.color}18` }]}>
            <MaterialCommunityIcons name={badge.icon as any} size={10} color={badge.color} />
            <Text style={[styles.badgeText, { color: badge.color }]}>{badge.label}</Text>
          </View>
        </View>

        {/* Right side: state indicator + Logout Button */}
        <View style={styles.right}>
          {account.isRememberedOnly ? (
            <View style={styles.rememberedBadge}>
              <Ionicons name="log-in-outline" size={12} color="#F59E0B" />
              <Text style={styles.rememberedText}>Tap to log in</Text>
            </View>
          ) : isActive ? (
            <View style={[styles.activePill, { backgroundColor: '#8B5CF620' }]}>
              <Text style={styles.activePillText}>Active</Text>
            </View>
          ) : (
            <View style={[styles.switchBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
              <Text style={[styles.switchBtnText, { color: isDark ? '#FFF' : '#000' }]}>Switch</Text>
            </View>
          )}

          {/* Explicit Logout/Remove Button under the status */}
          <TouchableOpacity 
            onPress={(e) => {
              e.stopPropagation();
              onLogout();
            }}
            style={styles.logoutAction}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="log-out-outline" size={16} color="#EF4444" />
            <Text style={styles.logoutActionText}>Log out</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 8,
  },
  avatarWrapper: { position: 'relative', marginRight: 12 },
  avatarRing: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    padding: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: { fontSize: 18, fontWeight: '800' },
  activeRingIndicator: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: 'white',
    borderRadius: 9,
  },
  info: { flex: 1 },
  displayName: { fontSize: 15, fontWeight: '700', marginBottom: 1 },
  username: { fontSize: 12, fontWeight: '500', marginBottom: 5 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 20,
    gap: 3,
  },
  badgeText: { fontSize: 10, fontWeight: '700' },
  right: { alignItems: 'flex-end', justifyContent: 'center' },
  activePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  activePillText: { fontSize: 11, fontWeight: '700', color: '#8B5CF6' },
  rememberedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  rememberedText: { fontSize: 11, fontWeight: '600', color: '#F59E0B' },
  switchBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  switchBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
  logoutAction: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 4,
    opacity: 0.8,
  },
  logoutActionText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#EF4444',
  },
});
