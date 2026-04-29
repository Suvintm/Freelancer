import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useProfilePosts } from '../../../hooks/useProfilePosts';
import { useProfileReels } from '../../../hooks/useProfileReels';
import { ContentGrid } from '../content/ContentGrid';
import { api } from '../../../api/client';
import { GALLERY_MOCKS } from '../../../constants/galleryMocks';

function formatCount(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return String(n ?? 0);
}

interface ProfileContentTabsProps {
  userId: string;
  theme: any;
  extraTabs?: string[];
  renderCustomTab?: (tab: string) => React.ReactNode;
  onRepairSuccess?: () => void;
  onStaleMediaDetected?: (isStale: boolean) => void;
}

type TabId = 'POSTS' | 'REELS' | string;

export const ProfileContentTabs: React.FC<ProfileContentTabsProps> = ({
  userId,
  theme,
  extraTabs = [],
  renderCustomTab,
  onRepairSuccess,
  onStaleMediaDetected,
}) => {
  const router = useRouter();
  const allTabs: TabId[] = [...extraTabs, 'POSTS', 'REELS', 'COMMUNITIES'];
  const [activeTab, setActiveTab] = useState<TabId>(allTabs[0]);

  const { data: postData, isLoading: loadingPosts, refetch: refetchPosts } = useProfilePosts(userId);
  const { data: reelData, isLoading: loadingReels, refetch: refetchReels } = useProfileReels(userId);

  const posts = postData?.pages.flatMap((p: any) => p.items) ?? [];
  const reels = reelData?.pages.flatMap((p: any) => p.items) ?? [];

  const hasStaleMedia = posts.some((p: any) => !p.thumbnail?.url) || reels.some((r: any) => !r.media?.thumbnailUrl);

  useEffect(() => { onStaleMediaDetected?.(hasStaleMedia); }, [hasStaleMedia]);

  const gridData = useCallback((): any[] => {
    const postsEmpty = !loadingPosts && posts.length === 0;
    const reelsEmpty = !loadingReels && reels.length === 0;

    if (activeTab === 'POSTS') {
      const source = postsEmpty
        ? GALLERY_MOCKS.map(m => ({
            id: m.id, type: 'POSTS' as const, isMock: true,
            thumbnail: m.media.urls.feed ?? m.media.urls.thumb,
            blurhash: m.media.blurhash,
            isProcessing: false,
          }))
        : posts.map((p: any) => {
            const mediaObj = p.media;
            const url = mediaObj?.urls?.thumb || mediaObj?.urls?.feed || p.thumbnail?.url || '';
            const isReady = mediaObj?.status === 'READY' || !!url;
            return {
              id: p.id, type: 'POSTS' as const,
              thumbnail: url,
              blurhash: p.thumbnail?.blurhash || mediaObj?.blurhash,
              isProcessing: !isReady,
            };
          });
      return source;
    }

    if (activeTab === 'REELS') {
      const source = reelsEmpty
        ? GALLERY_MOCKS.filter(m => m.type === 'VIDEO').map(m => ({
            id: m.id, type: 'REELS' as const, isMock: true,
            thumbnail: m.media.urls.thumb,
            blurhash: m.media.blurhash,
            views: '1.2K',
            isProcessing: false,
          }))
        : reels.map((r: any) => {
            const mediaObj = r.media;
            const thumbUrl = mediaObj?.urls?.thumb || mediaObj?.thumbnailUrl || '';
            const isReady = mediaObj?.status === 'READY' || !!thumbUrl;
            return {
              id: r.id, type: 'REELS' as const,
              thumbnail: thumbUrl,
              blurhash: mediaObj?.blurhash,
              views: r.stats?.views ? formatCount(r.stats.views) : '0',
              isProcessing: !isReady,
            };
          });
      return source;
    }

    if (activeTab === 'COMMUNITIES') {
      return []; // Communities are handled separately in rendering
    }

    return [];
  }, [activeTab, posts, reels, loadingPosts, loadingReels]);

  const handleRepair = async () => {
    try {
      const res = await api.post('/media/recovery/reset', {});
      if (res.data.success) {
        Alert.alert('Recovery Triggered', `Reset ${res.data.count} stalled media jobs.`);
        refetchPosts();
        refetchReels();
        onRepairSuccess?.();
      }
    } catch {
      Alert.alert('Error', 'Could not trigger media recovery.');
    }
  };

  const handleItemPress = useCallback((item: any) => {
    if (item.type === 'REELS') {
      const list = reels.length > 0 ? reels : GALLERY_MOCKS.filter(m => m.type === 'VIDEO');
      router.push({
        pathname: `/reels/${userId}`,
        params: { initialIndex: String(list.findIndex((r: any) => r.id === item.id)) },
      });
    } else {
      const list = posts.length > 0 ? posts : GALLERY_MOCKS;
      router.push({
        pathname: `/gallery/${userId}`,
        params: { initialIndex: String(list.findIndex((p: any) => p.id === item.id)) },
      });
    }
  }, [posts, reels, userId, router]);

  const isCustom = extraTabs.includes(activeTab);
  const data = gridData();
  const isLoading = loadingPosts || loadingReels;

  return (
    <View style={styles.container}>
      {/* ── Tab bar ── */}
      <View style={[styles.tabBar, { borderBottomColor: theme.border ?? '#222' }]}>
        {allTabs.map(tab => {
          const isActive = tab === activeTab;
          const accent = theme.accent ?? '#FF3040';
          return (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[styles.tabItem, isActive && { borderBottomColor: accent }]}
              activeOpacity={0.75}
            >
              {tab === 'POSTS' && (
                <MaterialCommunityIcons
                  name="grid"
                  size={20}
                  color={isActive ? accent : theme.textSecondary ?? '#555'}
                />
              )}
              {tab === 'REELS' && (
                <MaterialCommunityIcons
                  name="movie-play-outline"
                  size={20}
                  color={isActive ? accent : theme.textSecondary ?? '#555'}
                />
              )}
              {tab === 'COMMUNITIES' && (
                <MaterialCommunityIcons
                  name="account-group-outline"
                  size={20}
                  color={isActive ? accent : theme.textSecondary ?? '#555'}
                />
              )}
              {tab !== 'POSTS' && tab !== 'REELS' && tab !== 'COMMUNITIES' && (
                <Text
                  style={[
                    styles.tabLabel,
                    { color: isActive ? accent : theme.textSecondary ?? '#555' },
                  ]}
                >
                  {tab}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── Content ── */}
      <View style={styles.content}>
        {activeTab === 'COMMUNITIES' ? (
          <View style={styles.communitiesContainer}>
            {/* Mocked Communities Display */}
            <View style={styles.emptyState}>
              <MaterialCommunityIcons
                name="account-group-outline"
                size={44}
                color={theme.textSecondary ?? '#333'}
              />
              <Text style={[styles.emptyTitle, { color: theme.text ?? '#fff' }]}>
                No communities yet
              </Text>
              <Text style={[styles.emptySubtitle, { color: theme.textSecondary ?? '#555' }]}>
                Create a community to engage with your channel audience.
              </Text>
              <TouchableOpacity 
                style={[styles.createBtn, { backgroundColor: theme.accent ?? '#FF3040' }]}
                onPress={() => {
                  // This is a bit tricky since the state is in the parent.
                  // For now, we'll just show the message. 
                  // In a real app, we might use an event emitter or store.
                  Alert.alert("Create Community", "Use the 'Community' button in the profile header to create your first community.");
                }}
              >
                <Text style={styles.createBtnText}>Create Your First Community</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : isCustom ? (
          renderCustomTab?.(activeTab)
        ) : (
          <>
            {isLoading && data.length === 0 ? (
              <View style={styles.loaderRow}>
                <ActivityIndicator color={theme.accent ?? '#FF3040'} size="small" />
              </View>
            ) : data.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons
                  name={activeTab === 'REELS' ? 'movie-open-outline' : 'image-multiple-outline'}
                  size={44}
                  color={theme.textSecondary ?? '#333'}
                />
                <Text style={[styles.emptyTitle, { color: theme.text ?? '#fff' }]}>
                  No {activeTab === 'REELS' ? 'reels' : 'posts'} yet
                </Text>
                <Text style={[styles.emptySubtitle, { color: theme.textSecondary ?? '#555' }]}>
                  Content will appear here once uploaded.
                </Text>
              </View>
            ) : (
              <ContentGrid
                data={data}
                mode={activeTab === 'REELS' ? 'reels' : 'grid'}
                onItemPress={handleItemPress}
              />
            )}

            {/* Repair button (only when stale media exists) */}
            {!isLoading && hasStaleMedia && (
              <TouchableOpacity onPress={handleRepair} style={styles.repairBtn}>
                <MaterialCommunityIcons name="wrench-outline" size={13} color={theme.accent ?? '#FF3040'} />
                <Text style={[styles.repairText, { color: theme.accent ?? '#FF3040' }]}>
                  REPAIR PROCESSING MEDIA
                </Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 11,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabLabel: { fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },
  content: { marginTop: 2 },
  loaderRow: { paddingVertical: 32, alignItems: 'center' },
  emptyState: { alignItems: 'center', paddingVertical: 52, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 15, fontWeight: '800', marginTop: 14, letterSpacing: 0.2 },
  emptySubtitle: { fontSize: 13, fontWeight: '500', marginTop: 6, textAlign: 'center', lineHeight: 20 },
  repairBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 16,
    paddingBottom: 24,
  },
  repairText: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  communitiesContainer: {
    flex: 1,
    padding: 20,
  },
  createBtn: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  createBtnText: {
    color: 'white',
    fontWeight: '800',
    fontSize: 14,
  },
});