import React from 'react';
import { useAuthStore } from '../../../store/useAuthStore';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { useRefreshManager } from '../../../hooks/useRefreshManager';
import { Colors } from '../../../constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { formatCount } from '../../../utils/formatters';

import { ProfileContentTabs } from '../../shared/profiles/ProfileContentTabs';
import { useRouter } from 'expo-router';
import { Image as ExpoImage } from 'expo-image';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { ProfileSkeleton, ProfileSkeletonContent } from '../../shared/skeletons/ProfileSkeleton';

const DEFAULT_AVATAR = require('../../../../assets/defualtprofile.png');

export default function DefaultProfile() {
  const { theme } = useTheme();
  const { user, isRefreshing, setIsRefreshing, isLoadingUser, fetchUser } = useAuthStore();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const onRefresh = React.useCallback(async () => {
    setIsRefreshing(true);
    try {
      await useAuthStore.getState().fetchUser();
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchUser, setIsRefreshing]);

  const handleRefresh = useRefreshManager(onRefresh);

  if (isLoadingUser && !user) return <ProfileSkeleton />;
  if (!user) return null;

  const displayName = user.name || 'SuviX User';
  const username = user.username ? `@${user.username}` : '@suvix_member';
  const roleText = user.primaryRole?.category || user.role || 'Member';
  const bioText = `Building with SuviX as ${roleText}.`;

  const headerOffset = insets.top + 50;


  return (
    <View style={[styles.container, { backgroundColor: theme.primary }]}>
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={[styles.content, { paddingTop: headerOffset }]}
        refreshControl={
          <RefreshControl 
            refreshing={isRefreshing} 
            onRefresh={handleRefresh} 
            tintColor={theme.isDarkMode ? theme.accent : '#FF3040'} 
            colors={[theme.isDarkMode ? theme.accent : '#FF3040']} 
            progressViewOffset={80}
            progressBackgroundColor={theme.secondary}
          />
        }
      >
        {isRefreshing ? (
          <ProfileSkeletonContent />
        ) : (
          <>
        <LinearGradient
          colors={['#101828', '#1d2939', '#344054']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.banner}
        />

        <View style={[styles.profileWrap, { backgroundColor: theme.primary, borderBottomColor: theme.border }]}>
          <View style={styles.profileRow}>
            {/* ...Avatar Code... */}
            <TouchableOpacity 
              style={styles.avatarContainer} 
              onPress={() => router.push('/story/create')}
              activeOpacity={0.9}
            >
              <ExpoImage
                source={user.profilePicture ? { uri: user.profilePicture } : DEFAULT_AVATAR}
                style={[styles.avatar, { borderColor: theme.primary }]}
                contentFit="cover"
                transition={200}
              />
              
              {/* ➕ PROFESSIONAL STORY PLUS BADGE (SuviX Red) */}
              <View style={[styles.storyPlusBadge, { borderColor: theme.primary }]}>
                <MaterialCommunityIcons name="plus" size={14} color="#FFFFFF" />
              </View>
            </TouchableOpacity>

            <View style={styles.headerStats}>
              <View style={styles.miniStatsRow}>
                <View style={styles.miniStat}>
                  <Text style={[styles.miniStatValue, { color: '#FFFFFF' }]}>{formatCount(user.followers)}</Text>
                  <Text style={[styles.miniStatLabel, { color: theme.textSecondary }]}>Followers</Text>
                </View>
                <View style={styles.miniStat}>
                  <Text style={[styles.miniStatValue, { color: '#FFFFFF' }]}>{formatCount(user.following)}</Text>
                  <Text style={[styles.miniStatLabel, { color: theme.textSecondary }]}>Following</Text>
                </View>
                <View style={styles.miniStat}>
                  <Text style={[styles.miniStatValue, { color: '#FFFFFF' }]}>PRO</Text>
                  <Text style={[styles.miniStatLabel, { color: theme.textSecondary }]}>Member</Text>
                </View>
              </View>

              <View style={styles.actionRow}>
                <TouchableOpacity
                  activeOpacity={0.9}
                  style={[styles.actionBtn, { backgroundColor: theme.secondary, borderColor: theme.border }]}
                >
                  <Text style={[styles.actionText, { color: theme.text }]}>Settings</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => router.push('/story/create')}
                  style={[styles.actionBtn, { backgroundColor: '#FF3040', borderColor: '#FF3040' }]}
                >
                  <Text style={[styles.actionText, { color: '#FFFFFF' }]}>Add Story</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={styles.infoBlock}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={[styles.name, { color: theme.text }]}>{displayName}</Text>
               <TouchableOpacity 
                  onPress={() => router.push('/settings')}
                  style={{ padding: 8, marginLeft: 4 }}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons name="cog-outline" size={20} color={theme.textSecondary} />
                </TouchableOpacity>
            </View>
            <Text style={[styles.username, { color: theme.textSecondary }]}>{username}</Text>
            <Text style={[styles.bio, { color: theme.textSecondary }]}>{bioText}</Text>
          </View>
        </View>

        {/* 📱 CENTRALIZED MEDIA ENGINE */}
        <ProfileContentTabs 
          userId={user.id} 
          theme={theme} 
          onRepairSuccess={() => {}}
        />
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingTop: 10,
    paddingBottom: 20,
  },
  banner: {
    height: 78,
    width: '100%',
  },
  profileWrap: {
    marginTop: -28,
    paddingHorizontal: 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  avatarContainer: {
    position: 'relative',
    zIndex: 10,
    elevation: 10,
  },
  avatar: {
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 3,
    backgroundColor: '#0f172a',
    marginTop: -37,
  },
  storyPlusBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#FF3040',
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 30,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  headerStats: {
    flex: 1,
    paddingTop: 10,
  },
  miniStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  miniStat: {
    alignItems: 'center',
  },
  miniStatValue: { fontSize: 18, fontWeight: '900', letterSpacing: -0.5 },
  miniStatLabel: { fontSize: 10, fontWeight: '700', marginTop: 3, textTransform: 'uppercase', opacity: 0.6, letterSpacing: 0.8 },
  infoBlock: {
    marginTop: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: '800',
  },
  username: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: '600',
  },
  bio: {
    marginTop: 5,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '500',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 6,
    alignItems: 'center',
  },
  actionText: {
    fontSize: 11,
    fontWeight: '700',
  },
  emptyText: {
    marginTop: 10,
    fontSize: 13,
    fontWeight: '600',
    opacity: 0.8,
  },
});
