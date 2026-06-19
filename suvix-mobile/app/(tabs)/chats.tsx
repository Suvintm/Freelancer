import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  TextInput,
  FlatList,
  RefreshControl,
  Alert,
} from 'react-native';
import { useTheme } from '../../src/context/ThemeContext';
import { ScreenContainer } from '../../src/components/shared/ScreenContainer';
import { useAuthStore } from '../../src/store/useAuthStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { CommunityCreationModal } from '../../src/components/modals/CommunityCreationModal';
import { api } from '../../src/api/client';
import { useInfiniteQuery } from '@tanstack/react-query';

const { width } = Dimensions.get('window');

const TABS = [
  { id: 'All', label: 'All', icon: 'message-text' },
  { id: 'Direct', label: 'Direct', icon: 'account' },
  { id: 'Communities', label: 'Communities', icon: 'account-group' },
];

// ─────────────────────────────────────────────────────────────────────────────
// CHAT ROW CARD
// ─────────────────────────────────────────────────────────────────────────────
const ChatCard = ({
  item,
  theme,
  index,
  onPress,
}: {
  item: any;
  theme: any;
  index: number;
  onPress: () => void;
}) => {
  const isDark = theme.isDarkMode;
  
  const lastMsg = item.messages?.[0];
  const messageText = lastMsg ? `${lastMsg.sender?.username || 'User'}: ${lastMsg.content}` : 'Welcome to our new community! 👋';
  const timeText = lastMsg ? new Date(lastMsg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now';
  const memberCount = item._count?.members || 0;
  
  const getFullImageUrl = (path: string | undefined | null) => {
    if (!path) return 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=200';
    if (path.startsWith('http')) return path;
    const baseUrl = api.defaults.baseURL || 'http://192.168.0.176:5051/api';
    const cleanBase = baseUrl.replace(/\/api$/, '');
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    return `${cleanBase}/${cleanPath}`;
  };

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 60).springify()}
      style={{ marginBottom: 12, paddingHorizontal: 10 }}
    >
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onPress}
        style={[
          styles.chatCard, 
          { 
            backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
            borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
            borderWidth: 1,
            borderRadius: 20,
            padding: 12,
            flexDirection: 'row',
            alignItems: 'center'
          }
        ]}
      >
        <View style={styles.avatarContainer}>
          <Image source={{ uri: getFullImageUrl(item.thumbnail) }} style={[styles.chatAvatar, { width: 56, height: 56, borderRadius: 18 }]} />
        </View>

        <View style={[styles.cardBody, { flex: 1, marginLeft: 12 }]}>
          <View style={[styles.cardHeader, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <Text style={[styles.cardName, { color: theme.text, fontSize: 16, fontWeight: '700' }]} numberOfLines={1}>
                {item.name}
              </Text>
            </View>
            <Text style={[styles.cardTime, { color: theme.textSecondary, fontSize: 11 }]}>
              {timeText}
            </Text>
          </View>

          <Text
            style={[styles.cardMessage, { color: theme.textSecondary, fontSize: 13, marginTop: 2 }]}
            numberOfLines={1}
          >
            {messageText}
          </Text>

          <View style={[styles.cardTagRow, { flexDirection: 'row', alignItems: 'center', marginTop: 6 }]}>
            <View
              style={[
                styles.typeTag,
                {
                  backgroundColor: isDark ? 'rgba(59,130,246,0.12)' : 'rgba(59,130,246,0.08)',
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                  borderRadius: 6,
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginRight: 8
                },
              ]}
            >
              <MaterialCommunityIcons
                name="account-group"
                size={10}
                color="#3B82F6"
                style={{ marginRight: 4 }}
              />
              <Text style={[styles.typeTagText, { color: '#3B82F6', fontSize: 10, fontWeight: '700' }]}>COMMUNITY</Text>
            </View>

            <Text style={[styles.memberCountText, { color: theme.textSecondary, fontSize: 11, opacity: 0.7 }]}>
              {memberCount} members
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────────────────────────────────────
export default function ChatsScreen() {
  const { theme } = useTheme();
  const { user, updateUser } = useAuthStore();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const isDark = theme.isDarkMode;

  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isCommunityModalVisible, setIsCommunityModalVisible] = useState(false);

  const ChatCardSkeleton = () => {
    const isDark = theme.isDarkMode;
    return (
      <View style={[styles.chatCardSkeleton, { opacity: 0.6, marginBottom: 12, borderRadius: 20, padding: 12, flexDirection: 'row', marginHorizontal: 10 }]}>
        <View style={{ backgroundColor: isDark ? '#333' : '#eee', borderRadius: 16, width: 56, height: 56 }} />
        <View style={{ marginLeft: 12, flex: 1, justifyContent: 'center' }}>
          <View style={{ width: 120, height: 16, backgroundColor: isDark ? '#333' : '#eee', borderRadius: 4, marginBottom: 8 }} />
          <View style={{ width: '80%', height: 14, backgroundColor: isDark ? '#333' : '#eee', borderRadius: 4 }} />
        </View>
      </View>
    );
  };

  // ── 🚀 React Query with Infinite Scrolling ──
  const { 
    data: infiniteData, 
    isLoading, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage,
    refetch, 
    isRefetching 
  } = useInfiniteQuery({
    queryKey: ['my_communities', user?.id],
    queryFn: async ({ pageParam }) => {
      const url = `/communities/me?limit=20${pageParam ? `&cursor=${pageParam}` : ''}`;
      const response = await api.get(url);
      return response.data.data;
    },
    initialPageParam: null,
    getNextPageParam: (lastPage) => {
      if (!lastPage || lastPage.length < 20) return null;
      return lastPage[lastPage.length - 1].id;
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!user?.id,
  });

  const communities = useMemo(() => {
    return infiniteData?.pages.flat() || [];
  }, [infiniteData]);

  const filteredChats = useMemo(() => {
    let list = communities;
    if (activeTab === 'Direct') return []; 
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(c => c.name.toLowerCase().includes(q));
    }
    return list;
  }, [activeTab, searchQuery, communities]);

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleChatPress = (item: any) => {
    router.push(`/community/${item.id}`);
  };

  // Search Animations
  const searchAnim = useSharedValue(0);
  const onSearchFocus = () => {
    setIsSearchFocused(true);
    searchAnim.value = withSpring(1, { damping: 15 });
  };
  const onSearchBlur = () => {
    if (!searchQuery) {
      setIsSearchFocused(false);
      searchAnim.value = withSpring(0, { damping: 15 });
    }
  };

  const animatedCommunityStyle = useAnimatedStyle(() => ({
    flex: interpolate(searchAnim.value, [0, 1], [1.8, 0.4]),
    marginRight: interpolate(searchAnim.value, [0, 1], [10, 8]),
  }));

  const animatedSearchStyle = useAnimatedStyle(() => ({
    flex: interpolate(searchAnim.value, [0, 1], [1, 2.0]),
  }));

  const animatedTextStyle = useAnimatedStyle(() => ({
    opacity: interpolate(searchAnim.value, [0, 0.3], [1, 0]),
    transform: [{ scale: interpolate(searchAnim.value, [0, 0.3], [1, 0.8]) }],
    width: interpolate(searchAnim.value, [0, 0.4], [150, 0]),
  }));

  const DEFAULT_AVATAR = require('../../assets/defualtprofile.png');
  const formatCount = (count: number) => {
    if (count >= 1000000) return (count / 1000000).toFixed(1) + 'M';
    if (count >= 1000) return (count / 1000).toFixed(1) + 'K';
    return count.toString();
  };

  return (
    <ScreenContainer isScrollable={false} hasHeader={true}>
      <View style={[styles.root, { backgroundColor: theme.background }]}>
        <FlatList
          data={isLoading && communities.length === 0 ? Array(6).fill({ isSkeleton: true }) : filteredChats}
          keyExtractor={(it, idx) => it.isSkeleton ? `s-${idx}` : it.id}
          renderItem={({ item, index }) => {
            if (item.isSkeleton) return <ChatCardSkeleton />;
            return (
              <ChatCard 
                item={item} 
                theme={theme} 
                index={index} 
                onPress={() => handleChatPress(item)} 
              />
            );
          }}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={handleRefresh}
              tintColor={theme.accent}
              colors={[theme.accent]}
            />
          }
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) fetchNextPage();
          }}
          onEndReachedThreshold={0.5}
          ListFooterComponent={isFetchingNextPage ? <ChatCardSkeleton /> : null}
          ListHeaderComponent={
            <View style={{ paddingBottom: 10 }}>
              <View style={[styles.header, { flexDirection: 'row', alignItems: 'center', paddingTop: 10 }]}>
                <Animated.View style={animatedCommunityStyle}>
                  <TouchableOpacity
                    style={styles.createCommunityBtn}
                    onPress={() => setIsCommunityModalVisible(true)}
                  >
                    <LinearGradient
                      colors={isDark ? ['#1F2937', '#111827'] : ['#111827', '#374151']}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                      style={styles.createCommunityGrad}
                    >
                      <View style={styles.plusIconWrap}>
                        <Feather name="plus" size={16} color="#FFF" />
                      </View>
                      <Animated.View style={[animatedTextStyle, { overflow: 'hidden' }]}>
                        <Text style={styles.createCommunityTitle} numberOfLines={1}>Create Community</Text>
                      </Animated.View>
                    </LinearGradient>
                  </TouchableOpacity>
                </Animated.View>

                <Animated.View style={[animatedSearchStyle, styles.searchBar, { backgroundColor: theme.secondary, borderColor: isSearchFocused ? theme.accent : theme.border }]}>
                  <Feather name="search" size={16} color={isSearchFocused ? theme.accent : theme.textSecondary} />
                  <TextInput
                    style={[styles.searchInput, { color: theme.text }]}
                    placeholder="Search..."
                    placeholderTextColor={theme.textSecondary}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    onFocus={onSearchFocus}
                    onBlur={onSearchBlur}
                  />
                </Animated.View>
              </View>

              <View style={styles.tabsContainer}>
                {TABS.map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <TouchableOpacity
                      key={tab.id}
                      onPress={() => setActiveTab(tab.id)}
                      style={[styles.tab, isActive ? { backgroundColor: theme.text } : { backgroundColor: theme.secondary, borderColor: theme.border }]}
                    >
                      <MaterialCommunityIcons name={tab.icon as any} size={14} color={isActive ? theme.background : theme.textSecondary} style={{ marginRight: 6 }} />
                      <Text style={[styles.tabText, { color: isActive ? theme.background : theme.textSecondary }]}>{tab.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {!searchQuery && (
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
                    {activeTab === 'All' ? 'Recent' : activeTab === 'Direct' ? 'Direct Messages' : 'Communities'}
                  </Text>
                  <Text style={[styles.sectionCount, { color: theme.textSecondary }]}>{filteredChats.length}</Text>
                </View>
              )}
            </View>
          }
          ListEmptyComponent={!isLoading ? (
            <View style={styles.emptyWrap}>
              <Feather name="message-circle" size={48} color={theme.textSecondary} style={{ opacity: 0.3 }} />
              <Text style={[styles.emptyTitle, { color: theme.textSecondary }]}>No conversations found</Text>
            </View>
          ) : null}
          contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        />

        <CommunityCreationModal
          visible={isCommunityModalVisible}
          onClose={() => setIsCommunityModalVisible(false)}
          channels={user?.youtubeProfile || []}
          theme={theme}
          user={user}
          updateUser={updateUser}
          formatCount={formatCount}
          DEFAULT_AVATAR={DEFAULT_AVATAR}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 10, gap: 10 },
  createCommunityBtn: { borderRadius: 18, overflow: 'hidden' },
  createCommunityGrad: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, gap: 10 },
  plusIconWrap: { width: 28, height: 28, borderRadius: 8, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  createCommunityTitle: { fontSize: 13, fontWeight: '800', color: '#FFF' },
  searchBar: { flexDirection: 'row', alignItems: 'center', borderRadius: 20, paddingHorizontal: 12, height: 44, flex: 1, borderWidth: 1.5 },
  searchInput: { flex: 1, fontSize: 14, fontWeight: '500', marginLeft: 8 },
  tabsContainer: { flexDirection: 'row', paddingHorizontal: 10, gap: 8, marginTop: 12 },
  tab: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: 'transparent' },
  tabText: { fontSize: 12, fontWeight: '800' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 12, justifyContent: 'space-between' },
  sectionLabel: { fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
  sectionCount: { fontSize: 11, fontWeight: '700', opacity: 0.5 },
  chatCard: { },
  chatCardSkeleton: { backgroundColor: 'rgba(0,0,0,0.02)' },
  avatarContainer: { },
  chatAvatar: { },
  cardBody: { },
  cardHeader: { },
  cardName: { },
  cardTime: { },
  cardMessage: { },
  cardTagRow: { },
  typeTag: { },
  typeTagText: { },
  memberCountText: { },
  emptyWrap: { alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 12 },
  emptyTitle: { fontSize: 14, fontWeight: '600' },
});