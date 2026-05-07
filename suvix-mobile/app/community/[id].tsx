import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '../../src/context/ThemeContext';
import { ScreenContainer } from '../../src/components/shared/ScreenContainer';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Ionicons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  FadeInDown, 
  FadeIn,
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  interpolate,
  Extrapolate
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { useAuthStore } from '../../src/store/useAuthStore';
import { api } from '../../src/api/client';
import { useQuery } from '@tanstack/react-query';
import BottomSheet, { BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { useSocketStore } from '../../src/store/useSocketStore';

const { width, height } = Dimensions.get('window');

const MessageSkeleton = () => {
  const { theme, isDarkMode } = useTheme();
  return (
    <View style={styles.messageContainer}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
        <View style={[styles.senderAvatar, { backgroundColor: isDarkMode ? '#333' : '#eee' }]} />
        <View style={[styles.contentBubble, { 
          width: '70%', 
          height: 80, 
          backgroundColor: isDarkMode ? '#1A1A1B' : '#eee', 
          borderColor: 'transparent',
          borderRadius: 20,
          marginLeft: 12,
          borderBottomLeftRadius: 4
        }]}>
           <View style={[styles.bubbleTail, { borderRightColor: isDarkMode ? '#1A1A1B' : '#eee' }]} />
        </View>
      </View>
    </View>
  );
};

// ── MOCK DATA FOR WORKSPACE ───────────────────────────────────────────
const MOCK_MESSAGES = [
  {
    id: '1',
    type: 'media',
    sender: { name: 'ijaaass._', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200', verified: true },
    mediaUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=600',
    caption: 'gymkha.co real one stays 🔱',
    reactions: [
      { emoji: '❤️', count: 117 },
      { emoji: '🎖️', count: 27 },
      { emoji: '🔥', count: 22 },
    ],
    time: 'YESTERDAY 1:57 PM'
  },
  {
    id: '2',
    type: 'video',
    sender: { name: 'ijaaass._', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200', verified: true },
    mediaUrl: 'https://images.unsplash.com/photo-1541534741688-6078c64b52d2?q=80&w=600',
    reactions: [
      { emoji: '❤️', count: 92 },
      { emoji: '💖', count: 15 },
      { emoji: '🔥', count: 31 },
    ],
    time: 'YESTERDAY 6:16 PM'
  },
  {
    id: '3',
    type: 'text',
    sender: { name: 'ijaaass._', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200', verified: true },
    content: 'Brevis ndo entry kand kand ee song n oru video cheyyanam enn thoonni😅',
    reactions: [
      { emoji: '❤️', count: 39 },
      { emoji: '😂', count: 13 },
      { emoji: '📈', count: 10 },
    ],
    time: 'APR 27, 1:09 PM'
  }
];

export default function CommunityWorkspace() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { theme, isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { socket } = useSocketStore();

  // ── 🚀 Cached Community Details ──
  const { data: community, isLoading: isCommunityLoading } = useQuery({
    queryKey: ['community', id],
    queryFn: async () => {
      const response = await api.get(`/communities/${id}`);
      return response.data.data;
    },
    enabled: !!id,
    staleTime: 60000, // Keep fresh for 60s
  });

  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const isLoadingMessagesRef = useRef(false);
  const [hasMore, setHasMore] = useState(true);
  const hasMoreRef = useRef(true);
  const [cursor, setCursor] = useState<string | null>(null);

  const bottomSheetRef = useRef<BottomSheet>(null);
  const [selectedMessageForReaction, setSelectedMessageForReaction] = useState<string | null>(null);

  const openReactionSheet = (msgId: string) => {
    setSelectedMessageForReaction(msgId);
    bottomSheetRef.current?.expand();
  };

  const handleReact = async (emoji: string) => {
    if (!selectedMessageForReaction) return;
    bottomSheetRef.current?.close();

    const targetMsgId = selectedMessageForReaction;
    
    // Optimistic UI update
    setMessages(prev => prev.map(msg => {
      if (msg.id === targetMsgId) {
        const existingReactions = msg.reactions || [];
        const userReactionIdx = existingReactions.findIndex((r: any) => r.user?.id === user?.id && r.emoji === emoji);
        let newReactions;
        if (userReactionIdx >= 0) {
          newReactions = existingReactions.filter((_: any, idx: number) => idx !== userReactionIdx);
        } else {
          newReactions = [...existingReactions, { id: 'temp-' + Date.now(), emoji, user: { id: user?.id } }];
        }
        return { ...msg, reactions: newReactions };
      }
      return msg;
    }));

    try {
      await api.post(`/communities/${id}/messages/${targetMsgId}/react`, { emoji });
    } catch (e) {
      console.error('[Community] React error:', e);
    }
  };

  const fetchMessages = async (isNewCursor = false) => {
    if ((!hasMoreRef.current && isNewCursor) || isLoadingMessagesRef.current) return;
    try {
      isLoadingMessagesRef.current = true;
      setIsLoadingMessages(true);
      const url = `/communities/${id}/messages?limit=20${cursor && isNewCursor ? `&cursor=${cursor}` : ''}`;
      const response = await api.get(url);
      if (response.data.success) {
        const newMessages = response.data.data;
        if (isNewCursor) {
          setMessages(prev => {
            const existingIds = new Set(prev.map((m: any) => m.id));
            const uniqueNew = newMessages.filter((m: any) => !existingIds.has(m.id));
            return [...prev, ...uniqueNew];
          });
        } else {
          setMessages(newMessages);
        }
        
        if (newMessages.length < 20) {
          hasMoreRef.current = false;
          setHasMore(false);
        } else {
          setCursor(newMessages[newMessages.length - 1].id);
        }
      } else {
        hasMoreRef.current = false;
        setHasMore(false);
      }
    } catch (error) {
      console.error('[Community] Fetch messages error:', error);
      hasMoreRef.current = false;
      setHasMore(false);
    } finally {
      isLoadingMessagesRef.current = false;
      setIsLoadingMessages(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;
    try {
      const response = await api.post(`/communities/${id}/messages`, {
        content: inputText.trim(),
        type: 'text'
      });
      if (response.data.success) {
        setMessages(prev => [response.data.data, ...prev]);
        setInputText('');
      }
    } catch (error) {
      console.error('[Community] Send message error:', error);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [id]);

  useEffect(() => {
    if (socket && id) {
      console.log(`📡 [COMMUNITY] Joining room community:${id}`);
      socket.emit('join_room', `community:${id}`);

      socket.on('new_community_message', (message: any) => {
        console.log('📬 [COMMUNITY] New message received via socket:', message.id);
        setMessages(prev => {
           // Avoid duplicates (especially from optimistic updates)
           if (prev.find(m => m.id === message.id)) return prev;
           return [message, ...prev];
        });
      });

      socket.on('message_reaction_update', (data: any) => {
        const { messageId, result } = data;
        setMessages(prev => prev.map(msg => {
          if (msg.id === messageId) {
            return { ...msg, reactions: result.reactions };
          }
          return msg;
        }));
      });

      return () => {
        console.log(`🔌 [COMMUNITY] Leaving room community:${id}`);
        socket.emit('leave_room', `community:${id}`);
        socket.off('new_community_message');
        socket.off('message_reaction_update');
      };
    }
  }, [socket, id]);

  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const headerStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(scrollY.value, [0, 50], [1, 0], Extrapolate.CLAMP),
      transform: [{ translateY: interpolate(scrollY.value, [0, 50], [0, -10], Extrapolate.CLAMP) }],
    };
  });

  const compactHeaderStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(scrollY.value, [40, 80], [0, 1], Extrapolate.CLAMP),
    };
  });

  const getFullImageUrl = (path: string | undefined | null) => {
    if (!path) return 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200';
    if (path.startsWith('http')) return path;
    const baseUrl = api.defaults.baseURL || 'https://api.suvix.in/api';
    const cleanBase = baseUrl.replace(/\/api$/, '');
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    return `${cleanBase}/${cleanPath}`;
  };

  const renderMessage = ({ item, index }: { item: any, index: number }) => {
    // Check if it's a skeleton
    if (item.isSkeleton) return <MessageSkeleton />;

    const isMedia = item.type === 'IMAGE' || item.type === 'VIDEO';
    const sender = item.sender;
    const profile = sender?.profile;
    const name = profile?.name || sender?.username || 'Unknown';
    const avatar = getFullImageUrl(profile?.profile_picture || sender?.avatar);
    const prevItem = index < messages.length - 1 ? messages[index + 1] : null;
    
    // Grouping logic: check if the next message (older) is from the same sender within 30s
    const isSameAsPrev = prevItem && prevItem.sender?.id === item.sender?.id;
    const diffMs = prevItem ? Math.abs(new Date(item.created_at).getTime() - new Date(prevItem.created_at).getTime()) : Infinity;
    const isGroupedWithPrev = isSameAsPrev && diffMs < 30000;

    const showAvatar = !isGroupedWithPrev;

    return (
      <Animated.View entering={FadeInDown.delay(index * 50).springify()} style={[styles.messageContainer, isGroupedWithPrev && { marginBottom: 4 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
          {showAvatar ? (
            <Image source={{ uri: avatar }} style={styles.senderAvatar} />
          ) : (
            <View style={{ width: 32, height: 32 }} /> // Spacer for grouped messages
          )}
          
          {/* Content Bubble */}
          <TouchableOpacity 
            activeOpacity={0.9}
            onLongPress={() => openReactionSheet(item.id)}
            style={[styles.contentBubble, { 
              backgroundColor: isDarkMode ? '#1A1A1B' : theme.secondary, 
              borderColor: isDarkMode ? '#27272A' : theme.border,
              marginLeft: 12,
              flexShrink: 1,
              borderBottomLeftRadius: 4, // Flatten corner for tail
            }]}
          >
            {/* 📐 Bubble Tail */}
            <View style={[styles.bubbleTail, { 
              borderRightColor: isDarkMode ? '#1A1A1B' : theme.secondary,
              borderBottomColor: 'transparent'
            }]} />
          {isMedia && item.media?.url ? (
            <View>
              <Image source={{ uri: getFullImageUrl(item.media.url) }} style={styles.mediaContent} />
              {item.type === 'VIDEO' && (
                <View style={styles.playOverlay}>
                  <Ionicons name="play" size={40} color="white" />
                </View>
              )}
              {item.content && (
                <View style={styles.captionContainer}>
                  <Text style={[styles.captionText, { color: theme.text }]}>{item.content}</Text>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.textContainer}>
              <Text style={[styles.messageText, { color: theme.text }]}>{item.content}</Text>
            </View>
          )}

          {/* Reactions */}
          {item.reactions && item.reactions.length > 0 && (
            <View style={styles.reactionsRow}>
              {Object.entries(
                item.reactions.reduce((acc: any, r: any) => {
                  acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                  return acc;
                }, {})
              ).map(([emoji, count]: [string, any]) => {
                const hasReacted = item.reactions.some((r: any) => r.user?.id === user?.id && r.emoji === emoji);
                return (
                  <TouchableOpacity 
                    key={emoji} 
                    onPress={() => handleReact(emoji)}
                    style={[
                      styles.reactionPill, 
                      { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' },
                      hasReacted && { backgroundColor: 'rgba(255, 48, 64, 0.2)', borderColor: 'rgba(255, 48, 64, 0.5)', borderWidth: 1 }
                    ]}
                  >
                    <Text style={styles.reactionEmoji}>{emoji}</Text>
                    <Text style={[styles.reactionCount, { color: theme.textSecondary }]}>{count}</Text>
                  </TouchableOpacity>
                );
              })}
              <TouchableOpacity 
                onPress={() => openReactionSheet(item.id)}
                style={[styles.reactionPill, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}
              >
                <Feather name="plus" size={16} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
          )}
          </TouchableOpacity>
        </View>

        {/* Time - Only show if not grouped or if it's the last in a group (newest) */}
        {showAvatar && (
          <Text style={[styles.messageTime, { color: theme.textSecondary, marginLeft: 44, marginTop: 4 }]}>
            {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        )}
      </Animated.View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <StatusBar barStyle="light-content" />
      
      {/* 🛡️ SAFE AREA TASK BAR (BLACK) */}
      <View style={{ height: insets.top, backgroundColor: '#000' }} />

      {/* ── HEADER ── */}
      <View style={[styles.headerContainer, { 
        backgroundColor: theme.background,
        borderBottomWidth: 1,
        borderBottomColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
      }]}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/chats')} style={styles.headerIconBtn}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          
          <Animated.View style={[styles.headerCenter, headerStyle]}>
            <View style={styles.headerTitleRow}>
              <Image 
                source={{ uri: community?.thumbnail || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200' }} 
                style={styles.mainAvatar} 
              />
              <Text style={[styles.communityName, { color: theme.text }]} numberOfLines={1} ellipsizeMode="tail">
                {community?.name}
              </Text>
            </View>
            <Text style={[styles.memberCount, { color: theme.textSecondary }]} numberOfLines={1} ellipsizeMode="tail">
              {community?.owner?.username} • {community?._count?.members || 0} members
            </Text>
          </Animated.View>

          {/* Compact Header for Scroll */}
          <Animated.View 
            pointerEvents="none"
            style={[styles.compactHeader, compactHeaderStyle]}
          >
             <Text style={[styles.compactTitle, { color: theme.text }]}>{community?.name}</Text>
             <Text style={[styles.compactSubtitle, { color: theme.textSecondary }]}>{community?._count?.members || 0} members</Text>
          </Animated.View>

          <TouchableOpacity style={styles.headerIconBtn}>
            <Ionicons name="notifications-outline" size={24} color={theme.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── FEED ── */}
      <Animated.FlatList
        data={isLoadingMessages && messages.length === 0 ? [
          { id: 's1', isSkeleton: true },
          { id: 's2', isSkeleton: true },
          { id: 's3', isSkeleton: true }
        ] : messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        onEndReached={() => fetchMessages(true)}
        onEndReachedThreshold={0.5}
        ListFooterComponent={isLoadingMessages && messages.length > 0 ? <ActivityIndicator style={{ marginVertical: 20 }} color={theme.accent} /> : null}
        contentContainerStyle={[styles.feedContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      />

      {/* ── BOTTOM ACTION BAR ── */}
      <View style={[styles.bottomBar, { 
        paddingBottom: Math.max(insets.bottom, 20),
        backgroundColor: theme.background,
        borderTopWidth: 1,
        borderTopColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
      }]}>
        <View style={[styles.inputWrapper, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
           <TouchableOpacity style={styles.actionBtn}>
              <Feather name="image" size={20} color={theme.text} />
           </TouchableOpacity>
           <TextInput 
              style={[styles.input, { color: theme.text }]}
              placeholder="Send a message..."
              placeholderTextColor={theme.textSecondary}
              value={inputText}
              onChangeText={setInputText}
           />
           <TouchableOpacity onPress={handleSendMessage} style={styles.sendBtn}>
              <Ionicons name="send" size={20} color={theme.accent} />
           </TouchableOpacity>
        </View>
      </View>

      {/* ── EMOJI PICKER SHEET ── */}
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={['20%']}
        enablePanDownToClose={true}
        backdropComponent={(props) => (
          <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.3} />
        )}
        backgroundStyle={{ backgroundColor: isDarkMode ? '#1C1C1E' : '#FFFFFF' }}
        handleIndicatorStyle={{ backgroundColor: isDarkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)' }}
      >
        <BottomSheetView style={styles.sheetContainer}>
          <Text style={[styles.sheetTitle, { color: theme.text }]}>Add Reaction</Text>
          <View style={styles.emojiGrid}>
            {['👍', '❤️', '😂', '😮', '😢', '🙏'].map(emoji => (
              <TouchableOpacity key={emoji} onPress={() => handleReact(emoji)} style={styles.emojiBtn}>
                <Text style={styles.emojiText}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </BottomSheetView>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerContainer: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    zIndex: 10,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 60,
  },
  headerIconBtn: {
    padding: 8,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
    maxWidth: width * 0.65,
  },
  mainAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  communityName: {
    fontSize: 16,
    fontWeight: '800',
    flexShrink: 1,
  },
  memberCount: {
    fontSize: 11,
    fontWeight: '600',
  },
  compactHeader: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,
  },
  compactTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  compactSubtitle: {
    fontSize: 10,
    fontWeight: '600',
  },
  feedContent: {
    paddingTop: 20,
    paddingHorizontal: 16,
  },
  messageContainer: {
    marginBottom: 30,
  },
  senderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingLeft: 4,
  },
  senderAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },

  contentBubble: {
    borderRadius: 20,
    overflow: 'visible', // Changed to visible for tail
    borderWidth: 1,
    alignSelf: 'flex-start',
    maxWidth: '85%',
    position: 'relative',
  },
  bubbleTail: {
    position: 'absolute',
    bottom: -1,
    left: -8,
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderRightWidth: 10,
    borderBottomWidth: 10,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomColor: 'transparent',
    transform: [{ rotate: '0deg' }],
  },
  mediaContent: {
    width: '100%',
    height: width * 0.8,
    resizeMode: 'cover',
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  captionContainer: {
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  captionText: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  textContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  messageText: {
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 22,
  },
  reactionsRow: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
    alignItems: 'center',
  },
  reactionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  reactionEmoji: {
    fontSize: 14,
  },
  reactionCount: {
    fontSize: 12,
    fontWeight: '700',
    color: 'white',
  },
  addReaction: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timestamp: {
    fontSize: 10,
    fontWeight: '800',
    marginTop: 8,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 25,
    paddingHorizontal: 8,
    height: 50,
  },
  actionBtn: {
    padding: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    paddingHorizontal: 10,
  },
  sendBtn: {
    padding: 10,
  },
  sheetContainer: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 20,
  },
  emojiGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  emojiBtn: {
    padding: 10,
    backgroundColor: 'rgba(128,128,128,0.1)',
    borderRadius: 25,
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiText: {
    fontSize: 24,
  }
});
