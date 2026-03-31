import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Image } from 'react-native';
import Video, { VideoRef, SelectedVideoTrackType } from 'react-native-video';
import { MediaConfig } from '../constants/MediaConfig';
import { Colors } from '../constants/Colors';

interface ReelPlayerProps {
  url: string;
  isActive: boolean; // Only play if this reel is currently visible
  isMuted: boolean;
  onBuffer?: (isBuffering: boolean) => void;
  isPaused?: boolean;
  isNear: boolean; // PRODUCTION: Preloading guard
  onQualityChange?: (height: number) => void;
}

/**
 * PRODUCTION-GRADE REEL PLAYER (ABR OPTIMIZED)
 */
const ReelPlayerInternal = ({ url, isActive, isNear, isMuted, onBuffer, isPaused = false, onQualityChange }: ReelPlayerProps) => {
  const videoRef = useRef<VideoRef>(null);
  const hlsUrl = MediaConfig.toAdaptiveStream(url);
  const posterUrl = MediaConfig.getPosterUrl(url);

  useEffect(() => {
    if (!isActive && videoRef.current) {
        // Reset playback when not visible to save resources
        videoRef.current.seek(0);
    }
  }, [isActive]);

  return (
    <View style={styles.container}>
      {/* LAYER 1: BLURRED BACKGROUND */}
      <Image 
        source={{ uri: posterUrl }} 
        style={StyleSheet.absoluteFill} 
        blurRadius={25}
        resizeMode="cover"
      />
      <View style={styles.backgroundDimmer} />

      {/* LAYER 2: MAIN VIDEO (With Intelligence) */}
      <Video
        ref={videoRef}
        key={hlsUrl}
        source={{ uri: hlsUrl }}
        style={StyleSheet.absoluteFill}
        resizeMode="contain"
        repeat={true}
        paused={!isActive || isPaused}
        muted={isMuted}
        playInBackground={false}
        playWhenInactive={false}
        ignoreSilentSwitch="obey"
        onBuffer={(e) => onBuffer?.(e.isBuffering)}
        onLoad={(data) => {
          if (data.naturalSize) {
            onQualityChange?.(data.naturalSize.height);
          }
        }}
        onVideoTracks={(data) => {
          const activeTrack = data.videoTracks?.find(track => track.selected);
          if (activeTrack && activeTrack.height) {
            onQualityChange?.(activeTrack.height);
          }
        }}
        
        // ELITE: Hardware-Accelerated Adaptive Bitrate (ABR)
        selectedVideoTrack={{
          type: SelectedVideoTrackType.AUTO // Forces native engine to choose quality based on bandwidth
        }}
        
        // RESILIENCE: High-performance buffer for network fluidity
        // We use slightly larger buffers to prevent "stutter" on spikes
        bufferConfig={{
          minBufferMs: 2000,         // Wait for 2s of data on poor connections
          maxBufferMs: 5000,
          bufferForPlaybackMs: 1000, // Minimal delay to start
          bufferForPlaybackAfterRebufferMs: 1500,
        }}
        
        // PERFORMANCE: Professional Native Toggles
        preventsDisplaySleepDuringVideoPlayback={true}
        automaticallyWaitsToMinimizeStalling={true}
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
  backgroundDimmer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  loader: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
});
