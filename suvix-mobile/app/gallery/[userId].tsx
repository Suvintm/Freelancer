/**
 * 🖼️ PREMIUM INTERACTIVE GALLERY
 * 
 * Vertical snapping gallery for viewing user posts.
 * Optimized for high-res images and standard video posts.
 */
import React, { useRef, useState } from 'react';
import { 
  View, 
  StyleSheet, 
  Dimensions, 
  Text, 
  TouchableOpacity, 
  FlatList, 
  ActivityIndicator,
  Image,
  Platform 
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useProfilePosts } from '../../src/hooks/useProfilePosts';
import { VideoView, useVideoPlayer } from 'expo-video';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../src/context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

const GalleryItem = ({ post, isActive }) => {
  const { theme } = useTheme();
  const isVideo = post.media?.type === 'VIDEO';

  // 🛰️ VIDEO INITIALIZATION (If applicable)
  const videoUrl = post.media?.urls?.video || post.media?.urls?.hls;
  const player = useVideoPlayer(videoUrl || '', (player) => {
    if (videoUrl) {
      player.loop = true;
    }
  });

  React.useEffect(() => {
    if (isActive && isVideo && videoUrl) {
      player.play();
    } else {
      player.pause();
    }
  }, [isActive, player, isVideo, videoUrl]);

  // 🛰️ HARDENED MEDIA RESOLVER
  const thumbUrl = post.thumbnail?.url || post.media?.thumbnailUrl || post.media?.urls?.thumb || '';
  const isReady = !!thumbUrl && (post.thumbnail?.url || post.media?.status === 'READY');

  return (
    <View style={[styles.itemContainer, { backgroundColor: '#000' }]}>
      {!isReady ? (
        <View style={styles.processingWrap}>
           <ActivityIndicator color={theme.accent} size="large" />
           <Text style={styles.processingText}>Processing High Quality Media...</Text>
        </View>
      ) : isVideo ? (
        <VideoView
          player={player}
          style={styles.fullMedia}
          contentFit="contain"
          nativeControls={false}
        />
      ) : (
        <Image 
          source={{ uri: thumbUrl }} 
          style={styles.fullMedia}
          resizeMode="contain"
        />
      )}
      
      {/* OVERLAY GRADIENT FOR READABILITY */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.8)']}
        style={styles.bottomOverlay}
      >
        <View style={styles.content}>
          {post.caption ? (
            <Text style={styles.caption} numberOfLines={3}>{post.caption}</Text>
          ) : (
            <Text style={[styles.caption, { fontStyle: 'italic', opacity: 0.6 }]}>
              Shared by SuviX Member
            </Text>
          )}
          <View style={styles.metaRow}>
             <MaterialCommunityIcons name="calendar-clock" size={12} color="rgba(255,255,255,0.6)" />
             <Text style={styles.date}>{new Date(post.createdAt).toLocaleDateString()}</Text>
          </View>
        </View>
      </LinearGradient>

      {/* SIDE ACTIONS */}
      <View style={styles.sideActions}>
          <TouchableOpacity style={styles.actionIcon}>
              <MaterialCommunityIcons name="heart-outline" size={30} color="white" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionIcon}>
              <MaterialCommunityIcons name="comment-outline" size={28} color="white" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionIcon}>
              <MaterialCommunityIcons name="share-variant-outline" size={26} color="white" />
          </TouchableOpacity>
      </View>
    </View>
  );
};

export default function GalleryScreen() {
  const { userId, initialIndex } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  
  const [activeIndex, setActiveIndex] = useState(initialIndex ? parseInt(initialIndex as string) : 0);
  
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useProfilePosts(userId as string);
  const posts = data?.pages.flatMap(page => page.items) || [];

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index);
    }
  }).current;

  // 🛡️ LOADING STATE
  if (isLoading && posts.length === 0) {
      return (
          <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
              <ActivityIndicator color="white" size="large" />
          </View>
      );
  }

  // 🛡️ EMPTY STATE
  if (!isLoading && posts.length === 0) {
    return (
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
            <MaterialCommunityIcons name="image-off-outline" size={60} color={theme.textSecondary} />
            <Text style={{ color: 'white', marginTop: 20, fontSize: 18, fontWeight: '700' }}>No content found</Text>
            <TouchableOpacity onPress={() => router.back()} style={styles.backCta}>
               <Text style={{ color: 'white', fontWeight: '800' }}>Go Back</Text>
            </TouchableOpacity>
        </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* BACK BUTTON */}
      <TouchableOpacity 
        style={[styles.closeButton, { top: insets.top + 10 }]} 
        onPress={() => router.back()}
      >
        <MaterialCommunityIcons name="close" size={28} color="white" />
      </TouchableOpacity>

      <FlatList
        data={posts}
        renderItem={({ item, index }) => (
          <GalleryItem post={item} isActive={index === activeIndex} />
        )}
        keyExtractor={(item) => item.id}
        pagingEnabled
        vertical
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
        initialScrollIndex={initialIndex && posts.length > parseInt(initialIndex as string) ? parseInt(initialIndex as string) : 0}
        getItemLayout={(data, index) => ({
          length: height,
          offset: height * index,
          index,
        })}
        onEndReached={() => hasNextPage && fetchNextPage()}
        onEndReachedThreshold={0.5}
        windowSize={3}
        removeClippedSubviews={Platform.OS === 'android'}
        ListFooterComponent={isFetchingNextPage ? (
            <ActivityIndicator color="white" style={{ height: 100 }} />
        ) : null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  itemContainer: { width, height },
  fullMedia: { ...StyleSheet.absoluteFillObject },
  closeButton: {
    position: 'absolute',
    right: 20,
    zIndex: 10,
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 25,
  },
  bottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 25,
    paddingBottom: 60,
  },
  content: { maxWidth: '85%' },
  caption: { color: 'white', fontSize: 16, fontWeight: '600', lineHeight: 22 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 5 },
  date: { color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: '700' },
  sideActions: {
    position: 'absolute',
    right: 15,
    bottom: height * 0.15,
    alignItems: 'center',
    gap: 20,
  },
  actionIcon: {
    padding: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 30,
  },
  backCta: {
      marginTop: 30,
      paddingHorizontal: 25,
      paddingVertical: 12,
      borderWidth: 2,
      borderColor: 'white',
      borderRadius: 12,
  },
  processingWrap: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#000',
      gap: 15
  },
  processingText: {
      color: 'rgba(255,255,255,0.6)',
      fontSize: 14,
      fontWeight: '600',
      textAlign: 'center'
  }
});
