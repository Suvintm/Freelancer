import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import Video, { VideoRef } from 'react-native-video';
import { MediaConfig } from '../constants/MediaConfig';
import { Colors } from '../constants/Colors';

interface ReelPlayerProps {
  url: string;
  isActive: boolean; // Only play if this reel is currently visible
  isMuted: boolean;
  onBuffer?: (isBuffering: boolean) => void;
}

/**
 * PRODUCTION-GRADE REEL PLAYER
 * Custom wrapper around react-native-video optimized for:
 * 1. Infinite scrolling with FlashList.
 * 2. HLS Adaptive bitrate streaming via MediaConfig.
 * 3. Minimal memory footprint.
 */
const ReelPlayerInternal = ({ url, isActive, isMuted, onBuffer }: ReelPlayerProps) => {
  const videoRef = useRef<VideoRef>(null);
  const hlsUrl = MediaConfig.toAdaptiveStream(url);

  useEffect(() => {
    if (!isActive && videoRef.current) {
        // Pause and seek to 0 to save resources when not visible
        videoRef.current.seek(0);
    }
  }, [isActive]);

  return (
    <View style={styles.container}>
      <Video
        ref={videoRef}
        key={hlsUrl}
        source={{ uri: hlsUrl }}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
        repeat={true}
        paused={!isActive}
        muted={isMuted}
        playInBackground={false}
        playWhenInactive={false}
        ignoreSilentSwitch="obey"
        onBuffer={(e) => onBuffer?.(e.isBuffering)}
        // Production optimization: use a smaller buffer for Reels to start instantly
        bufferConfig={{
          minBufferMs: 1500,
          maxBufferMs: 3000,
          bufferForPlaybackMs: 1000,
          bufferForPlaybackAfterRebufferMs: 1500,
        }}
      />
      
      {isActive && (
        <View 
          pointerEvents="none"
          style={[
            styles.loader, 
            { opacity: 0 } // Video component handles its own buffering internally
          ]}
        >
          <ActivityIndicator color={Colors.accent} size="large" />
        </View>
      )}
    </View>
  );
};

export const ReelPlayer = React.memo(ReelPlayerInternal);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loader: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
});
