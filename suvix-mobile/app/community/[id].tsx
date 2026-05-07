import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '../../src/context/ThemeContext';
import { ScreenContainer } from '../../src/components/shared/ScreenContainer';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Ionicons, Feather } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/useAuthStore';
import { api } from '../../src/api/client';
import { useQuery, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import BottomSheet, { BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { useSocketStore } from '../../src/store/useSocketStore';

const { width } = Dimensions.get('window');
const DEFAULT_AVATAR = require('../../assets/defualtprofile.png');

const MessageSkeleton = () => {
  const { theme, isDarkMode } = useTheme();
  return (
    <View style={styles.messageContainer}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
        <View style={[styles.senderAvatar, { backgroundColor: isDarkMode ? '#333' : '#eee' }]} />
        <View style={{ flex: 1 }}>
          <View style={[styles.contentBubble, { 
            width: '70%', 
            height: 60, 
            backgroundColor: isDarkMode ? '#1A1A1B' : '#eee', 
            borderRadius: 18,
            marginLeft: 8,
          }]} />
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

  const getFullImageUrl = (path: string | undefined | null) => {
    if (!path || path === 'null' || path === 'undefined') return null;
    if (path.startsWith('http')) return path;
    const baseUrl = api.defaults.baseURL || 'http://192.168.0.175:5051/api';
    const cleanBase = baseUrl.replace(/\/api$/, '');
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    return `${cleanBase}/${cleanPath}`;
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;
    const tempMsg = {
      id: 'temp-' + Date.now(),
      content: inputText.trim(),
      type: 'text',
      sender_id: user?.id,
      sender: { 
        ...user, 
        username: user?.username || 'You',
        profile: {
          profile_picture: user?.profilePicture 
        }
      },
      created_at: new Date().toISOString(),
      reactions: []
    };

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

  const handleReact = async (emoji: string, messageId?: string) => {
    const targetMsgId = messageId || selectedMessageForReaction;
    if (!targetMsgId || targetMsgId.startsWith('temp-')) return; 
    
    bottomSheetRef.current?.close();

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

    try {
      await api.post(`/communities/${id}/messages/${targetMsgId}/react`, { emoji });
    } catch (e) {
      console.error('[Community] React error:', e);
    }
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

      socket.on('identity:profile_updated', (data: any) => {
        const { userId, profilePicture } = data;
        queryClient.setQueryData(['community_messages', id], (old: any) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page: any) => page.map((msg: any) => {
              if (msg.sender_id === userId || msg.sender?.id === userId) {
                return {
                  ...msg,
                  sender: {
                    ...msg.sender,
                    profile: { ...msg.sender?.profile, profile_picture: profilePicture }
                  }
                };
              }
              return msg;
            }))
          };
        });
      });

      return () => {
        socket.emit('leave_room', `community:${id}`);
        socket.off('new_community_message');
        socket.off('message_reaction_update');
        socket.off('identity:profile_updated');
      };
    }
  }, [socket, id, queryClient]);

  const renderMessage = ({ item, index }: { item: any, index: number }) => {
    if (item.isSkeleton) return <MessageSkeleton />;

    const isMedia = item.type === 'IMAGE' || item.type === 'VIDEO';
    const sender = item.sender;
    const profile = sender?.profile;
    const avatarPath = profile?.profile_picture || sender?.profile_picture || sender?.profilePicture || sender?.avatar;
    const avatarUri = getFullImageUrl(avatarPath);
    
    const currentSenderId = item.sender_id || item.sender?.id;
    const prevItem = index < messages.length - 1 ? messages[index + 1] : null;
    const prevSenderId = prevItem?.sender_id || prevItem?.sender?.id;

    const isSameAsPrev = prevItem && prevSenderId === currentSenderId && (Math.abs(new Date(item.created_at).getTime() - new Date(prevItem.created_at).getTime())) < 30000;

    return (
      <View style={[styles.messageContainer, { marginTop: isSameAsPrev ? 2 : 12 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
           <View style={{ width: 30, alignItems: 'center' }}>
              {!isSameAsPrev && (
                <View style={[styles.senderAvatar, { backgroundColor: isDarkMode ? '#27272A' : '#E4E4E7' }]}>
                   <Image 
                     source={avatarUri ? { uri: avatarUri } : DEFAULT_AVATAR} 
                     style={styles.senderAvatarImage} 
                     contentFit="cover"
                     cachePolicy="memory-disk"
                   />
                </View>
              )}
           </View>

           <View style={{ flex: 1 }}>
              <View style={[
                styles.contentBubble, 
                { 
                  backgroundColor: isDarkMode ? '#1F1F21' : '#F4F4F5',
                  borderColor: isDarkMode ? '#2A2A2C' : '#E4E4E7',
                  marginLeft: 8,
                  borderRadius: 18,
                  borderTopLeftRadius: isSameAsPrev ? 18 : 4
                }
              ]}>
                {!isSameAsPrev && (
                  <View style={[styles.bubbleTail, { borderRightColor: isDarkMode ? '#1F1F21' : '#F4F4F5' }]} />
                )}

                {isMedia && (
                   <View style={styles.mediaWrapper}>
                      <Image source={{ uri: getFullImageUrl(item.media?.url) }} style={styles.mediaContent} contentFit="cover" />
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
                       if (!groups[r.emoji]) groups[r.emoji] = { emoji: r.emoji, count: 0, hasReacted: false };
                       groups[r.emoji].count++;
                       if (r.userId === user?.id || r.user?.id === user?.id) groups[r.emoji].hasReacted = true;
                     });
                     return Object.values(groups).map((group, idx) => (
                       <TouchableOpacity key={idx} onPress={() => handleReact(group.emoji, item.id)} activeOpacity={0.7} style={[styles.reactionPill, { backgroundColor: group.hasReacted ? (isDarkMode ? 'rgba(139, 92, 246, 0.2)' : 'rgba(139, 92, 246, 0.1)') : (isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)'), borderColor: group.hasReacted ? '#8B5CF6' : 'transparent', borderWidth: 1 }]}>
                          <Text style={styles.reactionEmoji}>{group.emoji}</Text>
                          <Text style={[styles.reactionCount, { color: group.hasReacted ? '#8B5CF6' : (isDarkMode ? '#A1A1AA' : '#71717A') }]}>{group.count}</Text>
                       </TouchableOpacity>
                     ));
                   })()}
                   <TouchableOpacity style={[styles.addReaction, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.03)' }]} onPress={() => { setSelectedMessageForReaction(item.id); bottomSheetRef.current?.expand(); }}>
                      <Feather name="plus" size={12} color={theme.textSecondary} />
                   </TouchableOpacity>
                </View>
              </View>
              {!isSameAsPrev && <Text style={[styles.timestamp, { color: theme.textSecondary, marginLeft: 8 }]}>{new Date(item.created_at).toLocaleString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}</Text>}
           </View>
        </View>
      </View>
    );
  };

  const headerAvatarPath = community?.thumbnail || community?.owner?.profile?.profile_picture;
  const headerAvatarUri = getFullImageUrl(headerAvatarPath);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      {/* HEADER: Manual padding + ScreenContainer's lack of header = Perfect Alignment */}
      <View style={[styles.headerContainer, { paddingTop: insets.top + 8, borderBottomWidth: 1, borderBottomColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerIconBtn}>
            <Ionicons name="chevron-back" size={26} color={theme.text} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <View style={styles.headerTitleRow}>
               <View style={[styles.mainAvatarContainer, { backgroundColor: isDarkMode ? '#27272A' : '#E4E4E7' }]}>
                  <Image source={headerAvatarUri ? { uri: headerAvatarUri } : DEFAULT_AVATAR} style={styles.mainAvatar} contentFit="cover" cachePolicy="memory-disk" />
               </View>
               <View style={{ flexShrink: 1 }}>
                  <Text style={[styles.communityName, { color: theme.text }]} numberOfLines={1}>{community?.name || 'Community'}</Text>
                  <Text style={[styles.memberCount, { color: theme.textSecondary }]} numberOfLines={1}>
                    {community?.owner?.username ? `@${community.owner.username}` : (community?.category || 'General')} • {community?._count?.members || 0} members
                  </Text>
               </View>
            </View>
          </View>
          <TouchableOpacity style={styles.headerIconBtn}>
            <Ionicons name="ellipsis-vertical" size={22} color={theme.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* FEED: Swapping paddingTop and paddingBottom because list is INVERTED */}
      <FlatList
        inverted
        data={isLoadingMessages && messages.length === 0 ? Array(3).fill({ isSkeleton: true }) : messages}
        keyExtractor={(it, idx) => it.isSkeleton ? `s-${idx}` : it.id}
        renderItem={renderMessage}
        onEndReached={() => { if (hasNextPage && !isFetchingNextPage) fetchNextPage(); }}
        onEndReachedThreshold={0.5}
        ListHeaderComponent={isFetchingNextPage ? <ActivityIndicator style={{ marginVertical: 20 }} color={theme.accent} /> : null}
        contentContainerStyle={[styles.feedContent, { 
          paddingTop: 80, // Space at the BOTTOM (where input is)
          paddingBottom: 10, // Space at the TOP (where header is)
        }]}
        showsVerticalScrollIndicator={false}
      />

      {/* ACTION BAR: Minimized bottom space */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.bottomBar, { 
          paddingBottom: 4, 
          backgroundColor: theme.background,
          borderTopWidth: 1,
          borderTopColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
        }]}>
          <View style={[styles.inputWrapper, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
             <TouchableOpacity style={styles.actionBtn}>
                <Feather name="plus" size={20} color={theme.text} />
             </TouchableOpacity>
             <TextInput 
                style={[styles.input, { color: theme.text }]}
                placeholder="Message..."
                placeholderTextColor={theme.textSecondary}
                value={inputText}
                onChangeText={setInputText}
                multiline
             />
             <TouchableOpacity onPress={handleSendMessage} style={styles.sendBtn} disabled={!inputText.trim()}>
                <Ionicons name="send" size={20} color={inputText.trim() ? theme.accent : theme.textSecondary} />
             </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

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
    paddingHorizontal: 12,
    paddingBottom: 8,
    zIndex: 10,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 56,
  },
  headerIconBtn: {
    padding: 6,
  },
  headerCenter: {
    flex: 1,
    marginLeft: 4,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  mainAvatarContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,
    overflow: 'hidden',
  },
  mainAvatar: {
    width: '100%',
    height: '100%',
  },
  communityName: {
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 20,
  },
  memberCount: {
    fontSize: 11,
    fontWeight: '600',
    opacity: 0.7,
  },
  feedContent: {
    paddingHorizontal: 12,
  },
  messageContainer: {
    marginBottom: 8,
  },
  senderAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    overflow: 'hidden',
  },
  senderAvatarImage: {
    width: '100%',
    height: '100%',
  },
  contentBubble: {
    borderWidth: 1,
    alignSelf: 'flex-start',
    maxWidth: '82%',
    position: 'relative',
  },
  bubbleTail: {
    position: 'absolute',
    top: 0,
    left: -7,
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderRightWidth: 8,
    borderBottomWidth: 8,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomColor: 'transparent',
  },
  mediaWrapper: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  mediaContent: {
    width: '100%',
    height: width * 0.7,
  },
  textContainer: {
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  messageText: {
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 21,
  },
  reactionsRow: {
    flexDirection: 'row',
    padding: 6,
    paddingTop: 0,
    gap: 4,
    alignItems: 'center',
  },
  reactionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 8,
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
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timestamp: {
    fontSize: 8,
    fontWeight: '700',
    marginTop: 4,
    textTransform: 'uppercase',
    opacity: 0.4,
  },
  bottomBar: {
    paddingTop: 8,
    paddingHorizontal: 12,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    paddingHorizontal: 6,
    minHeight: 48,
  },
  actionBtn: {
    padding: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    paddingHorizontal: 8,
    maxHeight: 100,
  },
  sendBtn: {
    padding: 8,
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
