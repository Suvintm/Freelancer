import React, { useState, useRef, useEffect, useMemo } from 'react';
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
import { useQuery, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import BottomSheet, { BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { useSocketStore } from '../../src/store/useSocketStore';

const { width, height } = Dimensions.get('window');

const MessageSkeleton = () => {
  const { theme, isDarkMode } = useTheme();
  return (
    <View style={styles.messageContainer}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
        <View style={[styles.senderAvatar, { backgroundColor: isDarkMode ? '#333' : '#eee' }]} />
        <View style={[styles.contentBubble, { 
          width: '70%', 
          height: 80, 
          backgroundColor: isDarkMode ? '#1A1A1B' : '#eee', 
          borderColor: 'transparent',
          borderRadius: 20,
          marginLeft: 12,
          borderTopLeftRadius: 4
        }]}>
           <View style={[styles.bubbleTail, { borderRightColor: isDarkMode ? '#1A1A1B' : '#eee' }]} />
        </View>
      </View>
    </View>
  );
};

export default function CommunityWorkspace() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { theme, isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { socket } = useSocketStore();
  const queryClient = useQueryClient();

  const [inputText, setInputText] = useState('');
  const bottomSheetRef = useRef<BottomSheet>(null);
  const [selectedMessageForReaction, setSelectedMessageForReaction] = useState<string | null>(null);

  // ── 🚀 Cached Community Details ──
  const { data: community, isLoading: isCommunityLoading } = useQuery({
    queryKey: ['community', id],
    queryFn: async () => {
      const response = await api.get(`/communities/${id}`);
      return response.data.data;
    },
    enabled: !!id,
    staleTime: 60000,
  });

  // ── 🚀 Infinite Message Loading ──
  const {
    data: infiniteData,
    isLoading: isLoadingMessages,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['community_messages', id],
    queryFn: async ({ pageParam }) => {
      const response = await api.get(`/communities/${id}/messages?limit=20${pageParam ? `&cursor=${pageParam}` : ''}`);
      return response.data.data;
    },
    initialPageParam: null,
    getNextPageParam: (lastPage) => (lastPage.length < 20 ? null : lastPage[lastPage.length - 1].id),
    enabled: !!id,
    staleTime: 30000,
  });

  const messages = useMemo(() => {
    return infiniteData?.pages.flat() || [];
  }, [infiniteData]);

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;
    const tempMsg = {
      id: 'temp-' + Date.now(),
      content: inputText.trim(),
      type: 'text',
      sender_id: user?.id,
      sender: { ...user, username: user?.username || 'You' },
      created_at: new Date().toISOString(),
      reactions: []
    };

    // Optimistic Update
    queryClient.setQueryData(['community_messages', id], (old: any) => {
      if (!old) return old;
      return {
        ...old,
        pages: [[tempMsg, ...old.pages[0]], ...old.pages.slice(1)]
      };
    });

    setInputText('');

    try {
      await api.post(`/communities/${id}/messages`, {
        content: inputText.trim(),
        type: 'text'
      });
    } catch (error) {
      console.error('[Community] Send message error:', error);
    }
  };

  const reactionBuffer = useRef<Record<string, number>>({});
  const reactionTimerRef = useRef<any>(null);

  const handleReact = async (emoji: string, messageId?: string) => {
    const targetMsgId = messageId || selectedMessageForReaction;
    if (!targetMsgId || targetMsgId.startsWith('temp-')) return; 
    
    bottomSheetRef.current?.close();

    // ── 🚀 Optimistic UI Update ──
    queryClient.setQueryData(['community_messages', id], (old: any) => {
      if (!old) return old;
      return {
        ...old,
        pages: old.pages.map((page: any) => page.map((msg: any) => {
          if (msg.id !== targetMsgId) return msg;
          const existingReactions = msg.reactions || [];
          const userReactionIndex = existingReactions.findIndex((r: any) => r.emoji === emoji && (r.userId === user?.id || r.user?.id === user?.id));
          let newReactions;
          if (userReactionIndex > -1) {
            newReactions = existingReactions.filter((_: any, idx: number) => idx !== userReactionIndex);
          } else {
            newReactions = [...existingReactions, { emoji, userId: user?.id, user: user }];
          }
          return { ...msg, reactions: newReactions };
        }))
      };
    });

    // ── 🚀 Production Batching (Debounce) ──
    const bufferKey = `${targetMsgId}:${emoji}`;
    reactionBuffer.current[bufferKey] = (reactionBuffer.current[bufferKey] || 0) + 1;

    if (reactionTimerRef.current) clearTimeout(reactionTimerRef.current);
    reactionTimerRef.current = setTimeout(async () => {
      const currentBuffer = { ...reactionBuffer.current };
      reactionBuffer.current = {};

      for (const [key, count] of Object.entries(currentBuffer)) {
        if (count % 2 !== 0) {
          const [mId, emo] = key.split(':');
          try {
            await api.post(`/communities/${id}/messages/${mId}/react`, { emoji: emo });
          } catch (e) {
            console.error('[Community] Batch React error:', e);
          }
        }
      }
    }, 800);
  };

  useEffect(() => {
    if (socket && id) {
      socket.emit('join_room', `community:${id}`);

      socket.on('new_community_message', (message: any) => {
        queryClient.setQueryData(['community_messages', id], (old: any) => {
          if (!old) return old;
          const firstPage = old.pages[0];
          if (firstPage.find((m: any) => m.id === message.id)) return old;
          const newFirstPage = [message, ...firstPage.filter((m: any) => !m.id.startsWith('temp-'))];
          return { ...old, pages: [newFirstPage, ...old.pages.slice(1)] };
        });
      });

      socket.on('message_reaction_update', (data: any) => {
        const { messageId, result } = data;
        queryClient.setQueryData(['community_messages', id], (old: any) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page: any) => page.map((msg: any) => {
              if (msg.id === messageId) return { ...msg, reactions: result.reactions };
              return msg;
            }))
          };
        });
      });

      return () => {
        socket.emit('leave_room', `community:${id}`);
        socket.off('new_community_message');
        socket.off('message_reaction_update');
      };
    }
  }, [socket, id, queryClient]);

  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => { scrollY.value = event.contentOffset.y; },
  });

  const headerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, 50], [1, 0], Extrapolate.CLAMP),
    transform: [{ translateY: interpolate(scrollY.value, [0, 50], [0, -10], Extrapolate.CLAMP) }],
  }));

  const compactHeaderStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [40, 80], [0, 1], Extrapolate.CLAMP),
  }));

  const getFullImageUrl = (path: string | undefined | null) => {
    if (!path) return 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200';
    if (path.startsWith('http')) return path;
    const baseUrl = api.defaults.baseURL || 'http://192.168.0.175:5051/api';
    const cleanBase = baseUrl.replace(/\/api$/, '');
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    return `${cleanBase}/${cleanPath}`;
  };

  const renderMessage = ({ item, index }: { item: any, index: number }) => {
    if (item.isSkeleton) return <MessageSkeleton />;

    const isMedia = item.type === 'IMAGE' || item.type === 'VIDEO';
    const sender = item.sender;
    const profile = sender?.profile;
    const name = profile?.name || sender?.name || sender?.username || 'Unknown';
    const avatar = getFullImageUrl(profile?.profile_picture || sender?.profile_picture || sender?.avatar);
    
    const currentSenderId = item.sender_id || item.sender?.id;
    const prevItem = index > 0 ? messages[index - 1] : null;
    const prevSenderId = prevItem?.sender_id || prevItem?.sender?.id;

    const isSameAsPrev = prevItem && 
      prevSenderId === currentSenderId && 
      (Math.abs(new Date(item.created_at).getTime() - new Date(prevItem.created_at).getTime())) < 30000;

    return (
      <View style={[styles.messageContainer, { marginTop: isSameAsPrev ? 4 : 20 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
           {/* AVATAR COLUMN */}
           <View style={{ width: 32, alignItems: 'center' }}>
              {!isSameAsPrev && (
                <Image source={{ uri: avatar }} style={styles.senderAvatar} />
              )}
           </View>

           {/* BUBBLE COLUMN */}
           <View style={{ flex: 1 }}>
              <View style={[
                styles.contentBubble, 
                { 
                  backgroundColor: isDarkMode ? '#1F1F21' : '#F4F4F5',
                  borderColor: isDarkMode ? '#2A2A2C' : '#E4E4E7',
                  marginLeft: 10,
                  borderRadius: 20,
                  borderTopLeftRadius: isSameAsPrev ? 20 : 4
                }
              ]}>
                {!isSameAsPrev && (
                  <View style={[styles.bubbleTail, { borderRightColor: isDarkMode ? '#1F1F21' : '#F4F4F5' }]} />
                )}

                {isMedia && (
                   <View style={styles.mediaWrapper}>
                      <Image source={{ uri: getFullImageUrl(item.media?.url) }} style={styles.mediaContent} />
                      {item.type === 'VIDEO' && (
                        <View style={styles.playOverlay}>
                          <Ionicons name="play" size={32} color="white" />
                        </View>
                      )}
                   </View>
                )}

                {item.content && (
                  <View style={styles.textContainer}>
                    <Text style={[styles.messageText, { color: theme.text }]}>{item.content}</Text>
                  </View>
                )}

                <View style={styles.reactionsRow}>
                   {(() => {
                     const groups: Record<string, { emoji: string, count: number, hasReacted: boolean }> = {};
                     (item.reactions || []).forEach((r: any) => {
                       if (!groups[r.emoji]) {
                         groups[r.emoji] = { emoji: r.emoji, count: 0, hasReacted: false };
                       }
                       groups[r.emoji].count++;
                       if (r.userId === user?.id || r.user?.id === user?.id) {
                         groups[r.emoji].hasReacted = true;
                       }
                     });
                     return Object.values(groups).map((group, idx) => (
                       <TouchableOpacity 
                         key={idx} 
                         onPress={() => handleReact(group.emoji, item.id)}
                         activeOpacity={0.7}
                         style={[
                           styles.reactionPill, 
                           { 
                             backgroundColor: group.hasReacted ? (isDarkMode ? 'rgba(139, 92, 246, 0.2)' : 'rgba(139, 92, 246, 0.1)') : (isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)'),
                             borderColor: group.hasReacted ? '#8B5CF6' : 'transparent',
                             borderWidth: 1
                           }
                         ]}
                       >
                          <Text style={styles.reactionEmoji}>{group.emoji}</Text>
                          <Text style={[styles.reactionCount, { color: group.hasReacted ? '#8B5CF6' : (isDarkMode ? '#A1A1AA' : '#71717A') }]}>{group.count}</Text>
                       </TouchableOpacity>
                     ));
                   })()}
                   <TouchableOpacity 
                     style={[styles.addReaction, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.03)' }]}
                     onPress={() => {
                       setSelectedMessageForReaction(item.id);
                       bottomSheetRef.current?.expand();
                     }}
                   >
                      <Feather name="plus" size={12} color={theme.textSecondary} />
                   </TouchableOpacity>
                </View>
              </View>
              
              {!isSameAsPrev && (
                <Text style={[styles.timestamp, { color: theme.textSecondary, marginLeft: 10 }]}>
                  {new Date(item.created_at).toLocaleString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}
                </Text>
              )}
           </View>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <ScreenContainer hasHeader={false} isScrollable={false}>
        {/* HEADER */}
        <View style={[styles.headerContainer, { paddingTop: insets.top }]}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity onPress={() => router.back()} style={styles.headerIconBtn}>
              <Ionicons name="chevron-back" size={28} color={theme.text} />
            </TouchableOpacity>

            <Animated.View style={[styles.headerCenter, headerStyle]}>
              <View style={styles.headerTitleRow}>
                <Image 
                  source={{ uri: getFullImageUrl(community?.thumbnail) }} 
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

        {/* FEED */}
        <Animated.FlatList
          data={isLoadingMessages && messages.length === 0 ? Array(3).fill({ isSkeleton: true }) : messages}
          keyExtractor={(it, idx) => it.isSkeleton ? `s-${idx}` : it.id}
          renderItem={renderMessage}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) fetchNextPage();
          }}
          onEndReachedThreshold={0.5}
          ListFooterComponent={isFetchingNextPage ? <ActivityIndicator style={{ marginVertical: 20 }} color={theme.accent} /> : null}
          contentContainerStyle={[styles.feedContent, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
        />

        {/* BOTTOM ACTION BAR */}
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

        {/* EMOJI PICKER SHEET */}
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
      </ScreenContainer>
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
    marginBottom: 10,
  },
  senderAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  contentBubble: {
    borderRadius: 20,
    borderWidth: 1,
    alignSelf: 'flex-start',
    maxWidth: '85%',
    position: 'relative',
  },
  bubbleTail: {
    position: 'absolute',
    top: 0,
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
  },
  mediaWrapper: {
    width: '100%',
    borderRadius: 18,
    overflow: 'hidden',
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
    padding: 8,
    paddingTop: 0,
    gap: 4,
    alignItems: 'center',
  },
  reactionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    gap: 2,
  },
  reactionEmoji: {
    fontSize: 10,
  },
  reactionCount: {
    fontSize: 9,
    fontWeight: '700',
  },
  addReaction: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timestamp: {
    fontSize: 9,
    fontWeight: '700',
    marginTop: 6,
    textTransform: 'uppercase',
    opacity: 0.5,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 12,
    paddingHorizontal: 16,
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
