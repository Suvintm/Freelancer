import React from 'react';
import { useAuthStore } from '../../../store/useAuthStore';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { formatCount } from '../../../utils/formatters';

const DEFAULT_AVATAR = require('../../../../assets/defualtprofile.png');

export default function DefaultProfile() {
  const { theme } = useTheme();
  const { user } = useAuthStore();

  if (!user) return null;

  const displayName = user.name || 'SuviX User';
  const username = user.username ? `@${user.username}` : '@suvix_member';
  const roleText = user.primaryRole?.category || user.role || 'Member';
  const bioText = `Building with SuviX as ${roleText}.`;

  return (
    <View style={[styles.container, { backgroundColor: theme.primary }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <LinearGradient
          colors={['#101828', '#1d2939', '#344054']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.banner}
        />

        <View style={[styles.profileWrap, { backgroundColor: theme.primary, borderBottomColor: theme.border }]}>
          <View style={styles.profileRow}>
            <View style={styles.avatarContainer}>
              <Image
                source={user.profilePicture ? { uri: user.profilePicture } : DEFAULT_AVATAR}
                style={styles.avatar}
              />
            </View>

            <View style={styles.headerStats}>
              <View style={styles.miniStatsRow}>
                <View style={styles.miniStat}>
                  <Text style={[styles.miniStatValue, { color: theme.text }]}>{formatCount(user.followers)}</Text>
                  <Text style={[styles.miniStatLabel, { color: theme.textSecondary }]}>Followers</Text>
                </View>
                <View style={styles.miniStat}>
                  <Text style={[styles.miniStatValue, { color: theme.text }]}>{formatCount(user.following)}</Text>
                  <Text style={[styles.miniStatLabel, { color: theme.textSecondary }]}>Following</Text>
                </View>
                <View style={styles.miniStat}>
                  <Text style={[styles.miniStatValue, { color: theme.text }]}>0</Text>
                  <Text style={[styles.miniStatLabel, { color: theme.textSecondary }]}>Posts</Text>
                </View>
              </View>

              <View style={styles.actionRow}>
                <TouchableOpacity
                  activeOpacity={0.9}
                  style={[styles.actionBtn, { backgroundColor: theme.secondary, borderColor: theme.border }]}
                >
                  <Text style={[styles.actionText, { color: theme.text }]}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.9}
                  style={[styles.actionBtn, { backgroundColor: theme.secondary, borderColor: theme.border }]}
                >
                  <Text style={[styles.actionText, { color: theme.text }]}>Share</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={styles.infoBlock}>
            <Text style={[styles.name, { color: theme.text }]}>{displayName}</Text>
            <Text style={[styles.username, { color: theme.textSecondary }]}>{username}</Text>
            <Text style={[styles.bio, { color: theme.textSecondary }]}>{bioText}</Text>
          </View>
        </View>

        <View style={[styles.sectionHeader, { borderTopColor: theme.border, borderBottomColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>POSTS</Text>
          <Text style={[styles.sectionTitleMuted, { color: theme.textSecondary }]}>REELS</Text>
          <Text style={[styles.sectionTitleMuted, { color: theme.textSecondary }]}>TAGGED</Text>
        </View>

        <View style={styles.grid}>
          <View style={[styles.gridItem, { backgroundColor: theme.secondary }]} />
          <View style={[styles.gridItem, { backgroundColor: theme.secondary }]} />
          <View style={[styles.gridItem, { backgroundColor: theme.secondary }]} />
          <View style={[styles.gridItem, { backgroundColor: theme.secondary }]} />
          <View style={[styles.gridItem, { backgroundColor: theme.secondary }]} />
          <View style={[styles.gridItem, { backgroundColor: theme.secondary }]} />
        </View>
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
  },
  avatar: {
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 3,
    borderColor: '#ffffff',
    backgroundColor: '#0f172a',
    marginTop: -37,
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
  miniStatValue: {
    fontSize: 16,
    fontWeight: '800',
  },
  miniStatLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
    opacity: 0.7,
  },
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
  sectionHeader: {
    marginTop: 6,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.7,
  },
  sectionTitleMuted: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.7,
  },
  grid: {
    marginTop: 2,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 1,
  },
  gridItem: {
    width: '33.15%',
    aspectRatio: 1,
    borderRadius: 0,
  },
});
