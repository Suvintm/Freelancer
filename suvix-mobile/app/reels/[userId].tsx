/**
 * 🎬 REEL FEED SCREEN
 * 
 * Vertical snapping feed for viewing user reels.
 * Uses HLS for instant playback and high quality.
 */
import React, { useRef, useState } from 'react';
import { View, StyleSheet, Dimensions, Text, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useProfileReels } from '../../src/hooks/useProfileReels';
import { VideoView, useVideoPlayer } from 'expo-video';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../src/context/ThemeContext';

const { width, height } = Dimensions.get('window');

const ReelItem = ({ reel, isActive }) => {
  const { theme } = useTheme();
  
  // 🛰️ HLS PLAYER INITIALIZATION
  const videoUrl = reel.media?.urls?.hls || reel.media?.urls?.video;
  const player = useVideoPlayer(videoUrl || '', (player) => {
    if (videoUrl) {
      player.loop = true;
    }
  });

  // 🚀 PLAY/PAUSE SYNC
  React.useEffect(() => {
    if (isActive && videoUrl) {
      player.play();
    } else {
      player.pause();
    }
  }, [isActive, player, videoUrl]);

  return (
    <View style={[styles.reelContainer, { backgroundColor: '#000' }]}>
      <VideoView
        player={player}
        style={styles.fullVideo}
        contentFit="cover"
        nativeControls={false}
      />
      
      {/* OVERLAY CONTENT */}
      <View style={styles.overlay}>
        <View style={styles.contentBottom}>
          <Text style={styles.caption} numberOfLines={2}>{reel.caption || 'SuviX Reel'}</Text>
          <Text style={styles.date}>{new Date(reel.createdAt).toLocaleDateString()}</Text>
        </View>
        
        {/* SIDE ACTIONS */}
        <View style={styles.sideActions}>
            <TouchableOpacity style={styles.actionIcon} activeOpacity={0.7}>
                <MaterialCommunityIcons name="heart-outline" size={32} color="white" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionIcon} activeOpacity={0.7}>
                <MaterialCommunityIcons name="comment-outline" size={30} color="white" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionIcon} activeOpacity={0.7}>
                <MaterialCommunityIcons name="share-variant-outline" size={28} color="white" />
            </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default function ReelFeedScreen() {
  const { userId, initialIndex } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeIndex, setActiveIndex] = useState(initialIndex ? parseInt(initialIndex as string) : 0);
  
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useProfileReels(userId as string);
  const reels = data?.pages.flatMap(page => page.items) || [];

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index);
    }
  }).current;

  if (isLoading && reels.length === 0) {
      return (
          <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
              <ActivityIndicator color="white" size="large" />
          </View>
      );
  }

  return (
    <View style={styles.container}>
      {/* BACK BUTTON */}
      <TouchableOpacity 
        style={[styles.backButton, { top: insets.top + 10 }]} 
        onPress={() => router.back()}
      >
        <MaterialCommunityIcons name="chevron-left" size={32} color="white" />
      </TouchableOpacity>

      <FlatList
        data={reels}
        renderItem={({ item, index }) => (
          <ReelItem reel={item} isActive={index === activeIndex} />
        )}
        keyExtractor={(item) => item.id}
        pagingEnabled
        vertical
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
        initialScrollIndex={initialIndex && reels.length > parseInt(initialIndex as string) ? parseInt(initialIndex as string) : 0}
        getItemLayout={(data, index) => ({
          length: height,
          offset: height * index,
          index,
        })}
        onEndReached={() => hasNextPage && fetchNextPage()}
        onEndReachedThreshold={0.5}
        windowSize={3} // Optimize memory: Keep only a few items in memory
        removeClippedSubviews={true}
        ListFooterComponent={isFetchingNextPage ? (
            <ActivityIndicator color="white" style={{ height: 100 }} />
        ) : null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  reelContainer: {
    width,
    height,
  },
  fullVideo: {
    ...StyleSheet.absoluteFillObject,
  },
  backButton: {
    position: 'absolute',
    left: 10,
    zIndex: 10,
    padding: 5,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    padding: 20,
    paddingBottom: 60,
  },
  contentBottom: {
    maxWidth: '80%',
  },
  caption: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  date: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
  },
  sideActions: {
      position: 'absolute',
      right: 15,
      bottom: 100,
      alignItems: 'center',
  },
  actionIcon: {
      marginBottom: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
  }
});
