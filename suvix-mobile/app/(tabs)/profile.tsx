import React from 'react';
import { useAuthStore } from '../../src/store/useAuthStore';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '../../src/context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';

export default function ProfileIndex() {
  const { theme } = useTheme();
  const { user, isLoadingUser, isAuthenticated } = useAuthStore();

  if (isLoadingUser || (isAuthenticated && !user)) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.primary }]}>
        <ActivityIndicator size="large" color={theme.text} />
        <Text style={[styles.loadingText, { color: theme.text }]}>Loading Profile...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.primary }]}>
        <Text style={[styles.errorText, { color: theme.textSecondary }]}>Please login to access profile.</Text>
      </View>
    );
  }

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
            <Image
              source={{
                uri: user.profilePicture || 'https://cdn-icons-png.flaticon.com/512/149/149071.png',
              }}
              style={styles.avatar}
            />

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: theme.text }]}>0</Text>
                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Posts</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: theme.text }]}>0</Text>
                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Followers</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: theme.text }]}>0</Text>
                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Following</Text>
              </View>
            </View>
          </View>

          <View style={styles.infoBlock}>
            <Text style={[styles.name, { color: theme.text }]}>{displayName}</Text>
            <Text style={[styles.username, { color: theme.textSecondary }]}>{username}</Text>
            <Text style={[styles.bio, { color: theme.textSecondary }]}>{bioText}</Text>
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity
              activeOpacity={0.9}
              style={[styles.actionBtn, { backgroundColor: theme.secondary, borderColor: theme.border }]}
            >
              <Text style={[styles.actionText, { color: theme.text }]}>Edit Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.9}
              style={[styles.actionBtn, { backgroundColor: theme.secondary, borderColor: theme.border }]}
            >
              <Text style={[styles.actionText, { color: theme.text }]}>Share Profile</Text>
            </TouchableOpacity>
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
    paddingTop: 80,
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 14,
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
    alignItems: 'flex-end',
  },
  avatar: {
    width: 92,
    height: 92,
    borderRadius: 46,
    borderWidth: 3,
    borderColor: '#ffffff',
    backgroundColor: '#0f172a',
    marginTop: -37,
  },
  statsRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginLeft: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '800',
  },
  statLabel: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: '600',
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
    marginTop: 12,
    justifyContent: 'space-between',
  },
  actionBtn: {
    width: '49%',
    borderWidth: 1,
    borderRadius: 9,
    paddingVertical: 8,
    alignItems: 'center',
  },
  actionText: {
    fontSize: 12,
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
