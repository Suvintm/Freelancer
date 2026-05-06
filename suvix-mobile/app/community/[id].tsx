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

const { width, height } = Dimensions.get('window');

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
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();

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
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<string | null>(null);

  const fetchMessages = async (isNewCursor = false) => {
    if ((!hasMore && isNewCursor) || isLoadingMessages) return;
    try {
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
          setHasMore(false);
        } else {
          setCursor(newMessages[newMessages.length - 1].id);
        }
      }
    } catch (error) {
      console.error('[Community] Fetch messages error:', error);
    } finally {
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
    const cleanBase = baseUrl.endsWith('/api') ? baseUrl.slice(0, -4) : baseUrl;
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    return `${cleanBase}/${cleanPath}`;
  };

  const renderMessage = ({ item, index }: { item: any, index: number }) => {
    const isMedia = item.type === 'IMAGE' || item.type === 'VIDEO';
    const sender = item.sender;
    const profile = sender?.profile;
    const name = profile?.name || sender?.username || 'Unknown';
    const avatar = getFullImageUrl(profile?.profile_picture || sender?.avatar);

    return (
      <Animated.View entering={FadeInDown.delay(index * 50).springify()} style={styles.messageContainer}>
        {/* Sender Info Row */}
        <View style={styles.senderRow}>
          <Image source={{ uri: avatar }} style={styles.senderAvatar} />
          <View style={{ marginLeft: 10, flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={[styles.senderName, { color: theme.text }]}>{name}</Text>
              <Text style={[styles.adminTag, { color: theme.textSecondary }]}>• Admin</Text>
            </View>
          </View>
        </View>

        {/* Content Bubble */}
        <View style={[styles.contentBubble, { backgroundColor: theme.secondary, borderColor: theme.border }]}>
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

          {/* Reactions Row (Mocked for now) */}
          <View style={styles.reactionsRow}>
             <TouchableOpacity style={[styles.reactionPill, { backgroundColor: 'rgba(0,0,0,0.4)' }]}>
                <Text style={styles.reactionEmoji}>❤️</Text>
                <Text style={styles.reactionCount}>0</Text>
              </TouchableOpacity>
            <TouchableOpacity style={styles.addReaction}>
              <Feather name="plus" size={16} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Timestamp */}
        <Text style={[styles.timestamp, { color: theme.textSecondary }]}>
          {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </Animated.View>
    );
  };

  if (isCommunityLoading && messages.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.isDarkMode ? '#1C1C1E' : '#F2F2F7', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.isDarkMode ? '#1C1C1E' : '#F2F2F7' }}>
      <StatusBar barStyle={theme.isDarkMode ? 'light-content' : 'dark-content'} />
      
      {/* ── HEADER ── */}
      <View style={[styles.headerContainer, { 
        paddingTop: insets.top,
        backgroundColor: theme.background,
        borderBottomWidth: 1,
        borderBottomColor: theme.isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
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
              <Text style={[styles.communityName, { color: theme.text }]}>{community?.name}</Text>
            </View>
            <Text style={[styles.memberCount, { color: theme.textSecondary }]}>
              {community?.owner?.username} • {community?._count?.members || 0} members
            </Text>
          </Animated.View>

          {/* Compact Header for Scroll */}
          <Animated.View 
            pointerEvents="none"
            style={[styles.compactHeader, compactHeaderStyle, { paddingTop: insets.top }]}
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
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        onEndReached={() => fetchMessages(true)}
        onEndReachedThreshold={0.5}
        ListFooterComponent={isLoadingMessages ? <ActivityIndicator style={{ marginVertical: 20 }} color={theme.accent} /> : null}
        contentContainerStyle={[styles.feedContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      />

      {/* ── BOTTOM ACTION BAR ── */}
      <View style={[styles.bottomBar, { 
        paddingBottom: Math.max(insets.bottom, 20),
        backgroundColor: theme.background,
        borderTopWidth: 1,
        borderTopColor: theme.isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
      }]}>
        <View style={[styles.inputWrapper, { backgroundColor: theme.isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
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
  },
  mainAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  communityName: {
    fontSize: 16,
    fontWeight: '800',
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
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  senderName: {
    fontSize: 13,
    fontWeight: '800',
  },
  adminTag: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 6,
  },
  contentBubble: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
  },
  mediaContent: {
    width: '100%',
    height: width * 1.2,
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
    padding: 16,
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
});
