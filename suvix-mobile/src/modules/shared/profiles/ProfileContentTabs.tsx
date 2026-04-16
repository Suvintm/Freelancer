/**
 * 🚀 PROFILE CONTENT TABS ENGINE
 * 
 * Centralized logic for fetching and rendering User Posts and Reels.
 * Shared across YouTube Profiles, Fitness Profiles, and Client Profiles.
 */
import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert 
} from 'react-native';
import { useRouter } from 'expo-router';
import { useProfilePosts } from '../../../hooks/useProfilePosts';
import { useProfileReels } from '../../../hooks/useProfileReels';
import { ContentGrid } from '../content/ContentGrid';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { api } from '../../../api/client';

interface ProfileContentTabsProps {
  userId: string;
  theme: any;
  extraTabs?: string[];
  renderCustomTab?: (tab: string) => React.ReactNode;
  onRepairSuccess?: () => void;
  // Allows parent to sync repair button visibility
  onStaleMediaDetected?: (isStale: boolean) => void;
}

export const ProfileContentTabs: React.FC<ProfileContentTabsProps> = ({ 
  userId, 
  theme, 
  extraTabs = [], 
  renderCustomTab,
  onRepairSuccess,
  onStaleMediaDetected
}) => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(extraTabs.length > 0 ? extraTabs[0] : 'POSTS');

  // 🎣 MEDIA HOOKS
  const { 
    data: postData, 
    fetchNextPage: fetchNextPosts, 
    hasNextPage: hasNextPosts, 
    isFetchingNextPage: isFetchingPosts, 
    isLoading: isLoadingPosts,
    refetch: refetchPosts
  } = useProfilePosts(userId);

  const { 
    data: reelData, 
    fetchNextPage: fetchNextReels, 
    hasNextPage: hasNextReels, 
    isFetchingNextPage: isFetchingReels, 
    isLoading: isLoadingReels,
    refetch: refetchReels
  } = useProfileReels(userId);

  const posts = postData?.pages.flatMap(page => page.items) || [];
  const reels = reelData?.pages.flatMap(page => page.items) || [];

  // 🛡️ HARDENED MAPPING (Single Source of Truth)
  const getFilteredContent = useCallback((): any[] => {
    if (activeTab === 'POSTS') {
      console.log(`📡 [ENGINE] Resolving POSTS for user ${userId}. Count: ${posts.length}`);
      return posts.map(p => {
        const thumbUrl = p.thumbnail?.url || p.media?.thumbnailUrl || p.media?.urls?.thumb || '';
        const isReady = !!thumbUrl && (p.thumbnail?.url || p.media?.status === 'READY');
        
        console.log(`   🔸 Post ${p.id.substring(0,8)}: Status=${p.media?.status}, Thumb=${thumbUrl ? 'YES' : 'MISSING'}`);
        if (thumbUrl && thumbUrl.length < 50) {
           console.log(`      🔗 Short URL detected: ${thumbUrl}`);
        }

        return {
          id: p.id,
          type: 'POSTS',
          thumbnail: thumbUrl,
          blurhash: p.thumbnail?.blurhash || p.media?.blurhash,
          isProcessing: !isReady
        };
      });
    }
    if (activeTab === 'REELS') {
      console.log(`📡 [ENGINE] Resolving REELS for user ${userId}. Count: ${reels.length}`);
      return reels.map(r => {
        const thumbUrl = r.media?.thumbnailUrl || r.media?.urls?.thumb || '';
        const isReady = !!thumbUrl && r.media?.status === 'READY';

        console.log(`   🔹 Reel ${r.id.substring(0,8)}: Status=${r.media?.status}, Thumb=${thumbUrl ? 'YES' : 'MISSING'}`);

        return {
          id: r.id,
          type: 'REELS',
          thumbnail: thumbUrl,
          blurhash: r.media?.blurhash,
          views: r.stats?.views ? formatCount(r.stats.views) : '0',
          isProcessing: !isReady
        };
      });
    }
    return [];
  }, [activeTab, posts, reels, userId]);

  // 🛠️ SHARED REPAIR TOOL
  const handleRepair = async () => {
    try {
      const res = await api.post('/media/recovery/reset', {});
      if (res.data.success) {
        Alert.alert("Recovery Triggered", `Reset ${res.data.count} media jobs.`);
        refetchPosts();
        refetchReels();
        onRepairSuccess?.();
      }
    } catch (error) {
      Alert.alert("Error", "Could not trigger recovery.");
    }
  };

  // 🛰️ EXPOSE STALE STATE TO PARENT
  React.useEffect(() => {
    const hasStale = posts.some(p => !p.thumbnail?.url) || reels.some(r => !r.media?.thumbnailUrl);
    onStaleMediaDetected?.(hasStale);
  }, [posts, reels]);

  const allTabs = [...extraTabs, 'POSTS', 'REELS'];
  const isCustomTab = extraTabs.includes(activeTab);

  return (
    <View style={styles.container}>
       {/* 2.5 TAB BAR */}
       <View style={[styles.tabBar, { borderBottomColor: theme.border }]}>
          {allTabs.map((tab) => (
            <TouchableOpacity 
              key={tab} 
              onPress={() => setActiveTab(tab)}
              style={[styles.tabItem, activeTab === tab && { borderBottomColor: theme.accent || '#FF0000' }]}
            >
              <Text style={[
                styles.tabLabel, 
                { color: activeTab === tab ? theme.text : theme.textSecondary }
              ]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 📱 DYNAMIC CONTENT RENDERER */}
        <View style={{ marginTop: 10 }}>
           {isCustomTab ? (
              renderCustomTab?.(activeTab)
           ) : (
             <View>
                <ContentGrid 
                  data={getFilteredContent()} 
                  mode={activeTab === 'REELS' ? 'reels' : 'grid'} 
                  onItemPress={(item) => {
                    if (item.type === 'REELS') {
                      router.push({
                        pathname: `/reels/${userId}`,
                        params: { initialIndex: reels.findIndex(r => r.id === item.id) }
                      });
                    } else if (item.type === 'POSTS') {
                      router.push({
                        pathname: `/gallery/${userId}`,
                        params: { initialIndex: posts.findIndex(p => p.id === item.id) }
                      });
                    }
                  }}
                />

                {/* LOADING & EMPTY STATES */}
                {(isLoadingPosts || isLoadingReels) && (
                  <View style={{ paddingVertical: 20 }}>
                    <ActivityIndicator color={theme.accent || '#FF0000'} size="small" />
                  </View>
                )}

                {!isLoadingPosts && !isLoadingReels && getFilteredContent().length === 0 && (
                  <View style={styles.emptyState}>
                    <MaterialCommunityIcons name="image-multiple-outline" size={48} color={theme.textSecondary} />
                    <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                      No {activeTab.toLowerCase()} yet
                    </Text>
                  </View>
                )}
             </View>
           )}
        </View>

        {/* MINI REPAIR TOOL (Centralized) */}
        {!isCustomTab && (posts.some(p => !p.thumbnail?.url) || reels.some(r => !r.media?.thumbnailUrl)) && (
            <TouchableOpacity onPress={handleRepair} style={styles.repairBtn}>
              <Text style={[styles.repairText, { color: theme.accent || '#FF0000' }]}>
                REPAIR PROCESSING MEDIA
              </Text>
            </TouchableOpacity>
        )}
    </View>
  );
};

// 🧼 UTILS
function formatCount(num: number) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num?.toString() || '0';
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabBar: { flexDirection: 'row', borderBottomWidth: 1, paddingHorizontal: 15 },
  tabItem: { paddingVertical: 12, marginRight: 25, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabLabel: { fontSize: 13, fontWeight: '800', letterSpacing: 0.5 },
  emptyState: { alignItems: 'center', marginTop: 40, opacity: 0.5 },
  emptyText: { marginTop: 10, fontWeight: '700' },
  repairBtn: { marginTop: 20, marginBottom: 20, alignItems: 'center' },
  repairText: { fontSize: 10, fontWeight: '900', letterSpacing: 1 }
});
