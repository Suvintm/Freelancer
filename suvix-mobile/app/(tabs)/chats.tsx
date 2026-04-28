import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  TextInput,
  Animated as RNAnimated,
  FlatList,
  Platform,
} from 'react-native';
import { useTheme } from '../../src/context/ThemeContext';
import { ScreenContainer } from '../../src/components/shared/ScreenContainer';
import { useAuthStore } from '../../src/store/useAuthStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Ionicons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  SharedValue,
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { CommunityCreationModal } from '../../src/components/modals/CommunityCreationModal';
import { BlurView } from 'expo-blur';

const { width, height } = Dimensions.get('window');

// ─────────────────────────────────────────────────────────────────────────────
// DEMO DATA
// ─────────────────────────────────────────────────────────────────────────────

const PINNED_CHATS = [
  {
    id: 'p1',
    name: 'Sarah Wilson',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120',
    unread: 3,
    online: true,
  },
  {
    id: 'p2',
    name: 'Alex Rivera',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=120',
    unread: 0,
    online: true,
  },
  {
    id: 'p3',
    name: 'Tech Innovators',
    avatar: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=120',
    unread: 12,
    online: false,
    isGroup: true,
  },
  {
    id: 'p4',
    name: 'James Chen',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120',
    unread: 1,
    online: false,
  },
  {
    id: 'p5',
    name: 'Design Synerge',
    avatar: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=120',
    unread: 0,
    online: true,
    isGroup: true,
  },
];

const ALL_CHATS = [
  {
    id: '1',
    name: 'Sarah Wilson',
    message: 'The new motion graphics are ready for the SuviX launch! 🎬',
    time: '2m',
    unread: 3,
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120',
    type: 'DIRECT',
    verified: true,
    online: true,
    emoji: '🎬',
  },
  {
    id: '2',
    name: 'Tech Innovators',
    message: 'Marcus: We should aim for the Q3 release 🚀',
    time: '15m',
    unread: 12,
    avatar: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=120',
    type: 'COMMUNITY',
    verified: false,
    online: false,
    memberCount: 1284,
    emoji: '🚀',
  },
  {
    id: '3',
    name: 'Alex Rivera',
    message: 'Sent a project document  📄',
    time: '1h',
    unread: 1,
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=120',
    type: 'DIRECT',
    verified: false,
    online: true,
    emoji: '📄',
  },
  {
    id: '4',
    name: 'Design Synerge',
    message: 'Emma: Just updated the Figma files ✨',
    time: '3h',
    unread: 0,
    avatar: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=120',
    type: 'COMMUNITY',
    verified: true,
    online: false,
    memberCount: 342,
    emoji: '✨',
  },
  {
    id: '5',
    name: 'James Chen',
    message: 'Can you check the latest API specs? 🔧',
    time: '5h',
    unread: 0,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120',
    type: 'DIRECT',
    verified: true,
    online: false,
    emoji: '🔧',
  },
  {
    id: '6',
    name: 'UI/UX Collective',
    message: 'Lisa: New design system is live! 🎨',
    time: '8h',
    unread: 5,
    avatar: 'https://images.unsplash.com/photo-1558655146-9f40138edfeb?auto=format&fit=crop&q=80&w=120',
    type: 'COMMUNITY',
    verified: true,
    online: false,
    memberCount: 5621,
    emoji: '🎨',
  },
  {
    id: '7',
    name: 'Priya Nair',
    message: 'Love the new dashboard design! 💯',
    time: '1d',
    unread: 0,
    avatar: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&q=80&w=120',
    type: 'DIRECT',
    verified: false,
    online: false,
    emoji: '💯',
  },
];

const TABS = [
  { id: 'All', label: 'All', icon: 'message-text' },
  { id: 'Direct', label: 'Direct', icon: 'account' },
  { id: 'Communities', label: 'Communities', icon: 'account-group' },
];

// ─────────────────────────────────────────────────────────────────────────────
// PINNED STORY BUBBLE
// ─────────────────────────────────────────────────────────────────────────────
const PinnedBubble = ({
  item,
  theme,
  index,
}: {
  item: (typeof PINNED_CHATS)[0];
  theme: any;
  index: number;
}) => {
  const isDark = theme.isDarkMode;
  return (
    <Animated.View entering={FadeInDown.delay(index * 60).springify()} style={styles.pinnedBubbleWrap}>
      <TouchableOpacity activeOpacity={0.8} style={styles.pinnedBubbleTouch}>
        {/* Ring gradient for unread */}
        {item.unread > 0 ? (
          <LinearGradient
            colors={['#F59E0B', '#EF4444', '#8B5CF6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.pinnedRing}
          >
            <View style={[styles.pinnedRingInner, { borderColor: theme.background }]}>
              <Image source={{ uri: item.avatar }} style={styles.pinnedAvatar} />
            </View>
          </LinearGradient>
        ) : (
          <View style={[styles.pinnedRingInactive, { borderColor: theme.border }]}>
            <Image source={{ uri: item.avatar }} style={styles.pinnedAvatar} />
          </View>
        )}

        {/* Online dot */}
        {item.online && (
          <View style={[styles.onlineDot, { borderColor: theme.background }]} />
        )}

        {/* Group icon overlay */}
        {item.isGroup && (
          <View style={[styles.groupIcon, { backgroundColor: theme.secondary }]}>
            <MaterialCommunityIcons name="account-group" size={9} color={theme.textSecondary} />
          </View>
        )}

        {/* Unread badge */}
        {item.unread > 0 && (
          <View style={styles.pinnedUnreadBadge}>
            <Text style={styles.pinnedUnreadText}>{item.unread > 9 ? '9+' : item.unread}</Text>
          </View>
        )}
      </TouchableOpacity>

      <Text
        style={[styles.pinnedName, { color: theme.textSecondary }]}
        numberOfLines={1}
      >
        {item.name.split(' ')[0]}
      </Text>
    </Animated.View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// CHAT ROW CARD
// ─────────────────────────────────────────────────────────────────────────────
const ChatCard = ({
  item,
  theme,
  index,
  onPress,
}: {
  item: (typeof ALL_CHATS)[0];
  theme: any;
  index: number;
  onPress: () => void;
}) => {
  const isDark = theme.isDarkMode;
  const isCommunity = item.type === 'COMMUNITY';
  const hasUnread = item.unread > 0;

  return (
    <Animated.View entering={FadeInDown.delay(80 + index * 55).springify()}>
      <TouchableOpacity
        style={[
          styles.chatCard,
          {
            backgroundColor: theme.secondary,
            borderColor: hasUnread ? theme.accent + '30' : theme.border,
            borderWidth: hasUnread ? 1.5 : 1,
          },
        ]}
        activeOpacity={0.75}
        onPress={onPress}
      >
        {/* LEFT: Avatar */}
        <View style={styles.cardAvatarWrap}>
          {isCommunity ? (
            <LinearGradient
              colors={isDark ? ['#1D1D1F', '#2A2A2C'] : ['#F3F4F6', '#E9EAEC']}
              style={styles.communityAvatarGrad}
            >
              <Image source={{ uri: item.avatar }} style={styles.cardAvatar} />
            </LinearGradient>
          ) : (
            <Image source={{ uri: item.avatar }} style={styles.cardAvatar} />
          )}

          {/* Online indicator */}
          {item.online && !isCommunity && (
            <View style={[styles.cardOnline, { borderColor: isDark ? '#111113' : '#FFFFFF' }]} />
          )}

          {/* Community member count badge */}
          {isCommunity && item.memberCount && (
            <View style={[styles.memberBadge, { backgroundColor: isDark ? '#1C1C1E' : '#F9FAFB', borderColor: isDark ? '#2A2A2C' : '#E5E7EB' }]}>
              <MaterialCommunityIcons name="account-group" size={8} color={isDark ? '#9CA3AF' : '#6B7280'} />
            </View>
          )}
        </View>

        {/* MIDDLE: Info */}
        <View style={styles.cardBody}>
          {/* Name Row */}
          <View style={styles.cardNameRow}>
            <View style={styles.cardNameLeft}>
              <Text
                style={[
                  styles.cardName,
                  {
                    color: theme.text,
                    fontWeight: hasUnread ? '800' : '600',
                  },
                ]}
                numberOfLines={1}
              >
                {item.name}
              </Text>
              {item.verified && (
                <MaterialCommunityIcons
                  name="check-decagram"
                  size={13}
                  color="#3B82F6"
                  style={{ marginLeft: 4 }}
                />
              )}
            </View>
            <Text style={[styles.cardTime, { color: theme.textSecondary }]}>
              {item.time}
            </Text>
          </View>

          {/* Message + Meta Row */}
          <View style={styles.cardMsgRow}>
            <Text
              style={[
                styles.cardMessage,
                {
                  color: hasUnread ? theme.text : theme.textSecondary,
                  fontWeight: hasUnread ? '600' : '400',
                  flex: 1,
                },
              ]}
              numberOfLines={1}
            >
              {item.message}
            </Text>

            {/* Unread pill */}
            {hasUnread > 0 && (
              <View style={styles.unreadPill}>
                <Text style={styles.unreadPillText}>
                  {item.unread > 99 ? '99+' : item.unread}
                </Text>
              </View>
            )}
          </View>

          {/* Tags */}
          <View style={styles.cardTagRow}>
            <View
              style={[
                styles.typeTag,
                {
                  backgroundColor: isCommunity
                    ? isDark ? 'rgba(59,130,246,0.12)' : 'rgba(59,130,246,0.08)'
                    : isDark ? 'rgba(34,197,94,0.1)' : 'rgba(34,197,94,0.08)',
                },
              ]}
            >
              <MaterialCommunityIcons
                name={isCommunity ? 'account-group' : 'account'}
                size={9}
                color={isCommunity ? '#3B82F6' : '#22C55E'}
                style={{ marginRight: 3 }}
              />
              <Text
                style={[
                  styles.typeTagText,
                  { color: isCommunity ? '#3B82F6' : '#22C55E' },
                ]}
              >
                {isCommunity ? 'COMMUNITY' : 'DIRECT'}
              </Text>
            </View>

            {isCommunity && item.memberCount && (
              <Text style={[styles.memberCountText, { color: isDark ? '#6B7280' : '#9CA3AF' }]}>
                {item.memberCount >= 1000 ? `${(item.memberCount / 1000).toFixed(1)}K` : item.memberCount} members
              </Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────────────────────────────────────
export default function ChatsScreen({
  scrollY: globalScrollY,
}: {
  scrollY?: SharedValue<number>;
}) {
  const { theme } = useTheme();
  const { user, updateUser } = useAuthStore();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const isDark = theme.isDarkMode;

  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isCommunityModalVisible, setIsCommunityModalVisible] = useState(false);

  const searchAnim = useRef(new RNAnimated.Value(0)).current;
  const DEFAULT_AVATAR = require('../../assets/defualtprofile.png');

  const formatCount = (count: number) => {
    if (count >= 1000000) return (count / 1000000).toFixed(1) + 'M';
    if (count >= 1000) return (count / 1000).toFixed(1) + 'K';
    return count.toString();
  };

  // Expand/collapse search bar
  const onSearchFocus = () => {
    setIsSearchFocused(true);
    RNAnimated.spring(searchAnim, {
      toValue: 1,
      useNativeDriver: false,
      tension: 70,
      friction: 10,
    }).start();
  };

  const onSearchBlur = () => {
    if (!searchQuery) {
      setIsSearchFocused(false);
      RNAnimated.spring(searchAnim, {
        toValue: 0,
        useNativeDriver: false,
        tension: 70,
        friction: 10,
      }).start();
    }
  };

  const filteredChats = React.useMemo(() => {
    let chats = ALL_CHATS;
    if (activeTab === 'Direct') chats = chats.filter((c) => c.type === 'DIRECT');
    if (activeTab === 'Communities') chats = chats.filter((c) => c.type === 'COMMUNITY');
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      chats = chats.filter(
        (c) => c.name.toLowerCase().includes(q) || c.message.toLowerCase().includes(q)
      );
    }
    return chats;
  }, [activeTab, searchQuery]);

  const totalUnread = React.useMemo(
    () => ALL_CHATS.reduce((acc, c) => acc + c.unread, 0),
    []
  );

  const bgColor = theme.background;
  const surfaceColor = theme.secondary;
  const borderColor = theme.border;

  return (
    <ScreenContainer isScrollable={false} hasHeader={true}>
      <View style={[styles.root, { backgroundColor: bgColor }]}>

        {/* ══════════════════════════════════════════════════════════════════
            HEADER
        ═══════════════════════════════════════════════════════════════════ */}
        <Animated.View entering={FadeInDown.delay(0).springify()} style={styles.header}>

          {/* Title Row */}
          <View style={styles.headerTitleRow}>
            <View>
              <Text style={[styles.headerTitle, { color: theme.text }]}>
                Messages
              </Text>
              {totalUnread > 0 && (
                <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
                  {totalUnread} unread conversation{totalUnread !== 1 ? 's' : ''}
                </Text>
              )}
            </View>

            <View style={styles.headerActions}>
              {/* Request / Archive icon */}
              <TouchableOpacity
                style={[styles.headerIconBtn, { backgroundColor: theme.secondary, borderColor: theme.border }]}
              >
                <Feather name="archive" size={18} color={theme.textSecondary} />
              </TouchableOpacity>

              {/* New DM icon */}
              <TouchableOpacity
                style={[styles.headerIconBtn, { backgroundColor: theme.secondary, borderColor: theme.border }]}
                onPress={() => {/* navigate to new chat */}}
              >
                <Feather name="edit" size={18} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* ── CREATE COMMUNITY BUTTON ── */}
          <TouchableOpacity
            style={styles.createCommunityBtn}
            activeOpacity={0.85}
            onPress={() => setIsCommunityModalVisible(true)}
          >
            <LinearGradient
              colors={isDark ? ['#1F2937', '#111827'] : ['#111827', '#374151']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.createCommunityGrad}
            >
              <View style={styles.createCommunityIcon}>
                <LinearGradient
                  colors={['#8B5CF6', '#6366F1']}
                  style={styles.createCommunityIconGrad}
                >
                  <MaterialCommunityIcons name="account-group-outline" size={16} color="#FFF" />
                </LinearGradient>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.createCommunityTitle}>Create a Community</Text>
                <Text style={styles.createCommunitySubtitle}>
                  Connect with your audience
                </Text>
              </View>
              <View style={[styles.createCommunityArrow, { backgroundColor: 'rgba(255,255,255,0.06)' }]}>
                <Feather name="arrow-right" size={14} color="rgba(255,255,255,0.6)" />
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* ── SEARCH BAR ── */}
          <View
            style={[
              styles.searchBar,
              {
                backgroundColor: theme.secondary,
                borderColor: isSearchFocused
                  ? theme.accent + '80'
                  : theme.border,
              },
            ]}
          >
            <Feather
              name="search"
              size={16}
              color={isSearchFocused ? theme.accent : theme.textSecondary}
            />
            <TextInput
              style={[styles.searchInput, { color: theme.text }]}
              placeholder="Search messages..."
              placeholderTextColor={theme.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onFocus={onSearchFocus}
              onBlur={onSearchBlur}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <View style={[styles.searchClear, { backgroundColor: theme.border }]}>
                  <Feather name="x" size={10} color={theme.textSecondary} />
                </View>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>

        {/* ══════════════════════════════════════════════════════════════════
            TABS
        ═══════════════════════════════════════════════════════════════════ */}
        <Animated.View entering={FadeInDown.delay(60).springify()} style={styles.tabsContainer}>
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                onPress={() => setActiveTab(tab.id)}
                style={[
                  styles.tab,
                  isActive
                    ? { backgroundColor: theme.text }
                    : { backgroundColor: theme.secondary, borderColor: theme.border },
                ]}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons
                  name={tab.icon as any}
                  size={13}
                  color={isActive ? theme.background : theme.textSecondary}
                  style={{ marginRight: 5 }}
                />
                <Text
                  style={[
                    styles.tabText,
                    {
                      color: isActive ? theme.background : theme.textSecondary,
                    },
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </Animated.View>

        {/* ══════════════════════════════════════════════════════════════════
            PINNED / ACTIVE NOW (only in "All" tab, no search)
        ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'All' && !searchQuery && (
          <Animated.View entering={FadeInDown.delay(90).springify()}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionDot, { backgroundColor: '#22C55E' }]} />
              <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
                Active Now
              </Text>
            </View>
            <FlatList
              horizontal
              data={PINNED_CHATS}
              keyExtractor={(it) => it.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.pinnedList}
              renderItem={({ item, index }) => (
                <PinnedBubble item={item} theme={theme} index={index} />
              )}
            />
          </Animated.View>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            SECTION HEADER FOR CHAT LIST
        ═══════════════════════════════════════════════════════════════════ */}
        {!searchQuery && (
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
              {activeTab === 'All'
                ? 'Recent'
                : activeTab === 'Direct'
                ? 'Direct Messages'
                : 'Communities'}
            </Text>
            <Text style={[styles.sectionCount, { color: theme.textSecondary, opacity: 0.5 }]}>
              {filteredChats.length}
            </Text>
          </View>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            CHAT LIST
        ═══════════════════════════════════════════════════════════════════ */}
        <FlatList
          data={filteredChats}
          keyExtractor={(it) => it.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: 120 + insets.bottom },
          ]}
          onScroll={(e) => {
            if (globalScrollY) globalScrollY.value = e.nativeEvent.contentOffset.y;
          }}
          scrollEventThrottle={16}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <View style={[styles.emptyIconWrap, { backgroundColor: theme.secondary }]}>
                <Feather name="message-circle" size={32} color={theme.textSecondary} />
              </View>
              <Text style={[styles.emptyTitle, { color: theme.text }]}>
                No conversations found
              </Text>
              <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
                {searchQuery ? 'Try a different search term' : 'Start a new conversation'}
              </Text>
            </View>
          }
          renderItem={({ item, index }) => (
            <ChatCard
              item={item}
              theme={theme}
              index={index}
              onPress={() => router.push(`/chat/${item.id}`)}
            />
          )}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        />

        {/* ══════════════════════════════════════════════════════════════════
            FLOATING NEW MESSAGE BUTTON
        ═══════════════════════════════════════════════════════════════════ */}
        <Animated.View
          entering={FadeInUp.delay(300).springify()}
          style={[styles.fab, { bottom: 96 + insets.bottom }]}
        >
          <TouchableOpacity activeOpacity={0.85} onPress={() => {/* new message */}}>
            <LinearGradient
              colors={['#8B5CF6', '#6366F1']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.fabGradient}
            >
              <Feather name="edit-2" size={20} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* ══════════════════════════════════════════════════════════════════
            COMMUNITY CREATION MODAL
        ═══════════════════════════════════════════════════════════════════ */}
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

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
  },

  // ── HEADER ────────────────────────────────────────────────────────────────
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 50 : 16,
    paddingBottom: 4,
    gap: 12,
  },
  headerTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.8,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },

  // ── CREATE COMMUNITY BUTTON ───────────────────────────────────────────────
  createCommunityBtn: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  createCommunityGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  createCommunityIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    overflow: 'hidden',
  },
  createCommunityIconGrad: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createCommunityTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#F9FAFB',
    letterSpacing: -0.2,
  },
  createCommunitySubtitle: {
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.45)',
    marginTop: 2,
  },
  createCommunityArrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── SEARCH ────────────────────────────────────────────────────────────────
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 44,
    gap: 10,
    borderWidth: 1.5,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    padding: 0,
  },
  searchClear: {
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── TABS ──────────────────────────────────────────────────────────────────
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    marginTop: 12,
    marginBottom: 4,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.1,
  },

  // ── SECTION HEADER ────────────────────────────────────────────────────────
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 8,
  },
  sectionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    flex: 1,
  },
  sectionCount: {
    fontSize: 11,
    fontWeight: '700',
  },

  // ── PINNED BUBBLES ────────────────────────────────────────────────────────
  pinnedList: {
    paddingHorizontal: 20,
    paddingBottom: 6,
    gap: 16,
  },
  pinnedBubbleWrap: {
    alignItems: 'center',
    gap: 6,
    width: 62,
  },
  pinnedBubbleTouch: {
    position: 'relative',
    width: 62,
    height: 62,
  },
  pinnedRing: {
    width: 62,
    height: 62,
    borderRadius: 20,
    padding: 2.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pinnedRingInner: {
    flex: 1,
    borderRadius: 17,
    borderWidth: 2,
    overflow: 'hidden',
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pinnedRingInactive: {
    width: 62,
    height: 62,
    borderRadius: 20,
    borderWidth: 1.5,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pinnedAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#22C55E',
    borderWidth: 2,
  },
  groupIcon: {
    position: 'absolute',
    bottom: 0,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  pinnedUnreadBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  pinnedUnreadText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
  },
  pinnedName: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },

  // ── CHAT LIST ─────────────────────────────────────────────────────────────
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  chatCard: {
    flexDirection: 'row',
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    gap: 14,
  },
  cardAvatarWrap: {
    position: 'relative',
    width: 54,
    height: 54,
  },
  cardAvatar: {
    width: 54,
    height: 54,
    borderRadius: 18,
  },
  communityAvatarGrad: {
    width: 54,
    height: 54,
    borderRadius: 18,
    padding: 1,
    overflow: 'hidden',
  },
  cardOnline: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 13,
    height: 13,
    borderRadius: 7,
    backgroundColor: '#22C55E',
    borderWidth: 2,
  },
  memberBadge: {
    position: 'absolute',
    bottom: -2,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  cardBody: {
    flex: 1,
    gap: 3,
  },
  cardNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardNameLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  cardName: {
    fontSize: 15,
    letterSpacing: -0.3,
    flexShrink: 1,
  },
  cardTime: {
    fontSize: 11,
    fontWeight: '500',
  },
  cardMsgRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardMessage: {
    fontSize: 13,
    lineHeight: 18,
  },
  unreadPill: {
    backgroundColor: '#8B5CF6',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadPillText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },
  cardTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  typeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  typeTagText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  memberCountText: {
    fontSize: 10,
    fontWeight: '600',
  },

  // ── EMPTY STATE ───────────────────────────────────────────────────────────
  emptyWrap: {
    alignItems: 'center',
    paddingTop: 60,
    gap: 12,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptySubtitle: {
    fontSize: 13,
    fontWeight: '500',
  },

  // ── FAB ───────────────────────────────────────────────────────────────────
  fab: {
    position: 'absolute',
    right: 20,
  },
  fabGradient: {
    width: 54,
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 12,
  },
});