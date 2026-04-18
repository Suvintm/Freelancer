import React, { useRef, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { StoryObject } from '../types';

interface Props {
  item: StoryObject;
  isPaused?: boolean;
}

export const CanvasVideoItem: React.FC<Props> = ({ item, isPaused = false }) => {
  const videoRef = useRef<Video>(null);

  useEffect(() => {
    if (isPaused) {
      videoRef.current?.pauseAsync();
    } else {
      videoRef.current?.playAsync();
    }
  }, [isPaused]);

  // Dynamically use original aspect ratio or default to 16:9
  const aspectRatio = item.aspectRatio || 9 / 16;

  return (
    <View style={[s.wrapper, { aspectRatio }]}>
      <Video
        ref={videoRef}
        style={s.video}
        source={{ uri: item.content }}
        shouldPlay={!isPaused}
        isLooping={true}
        isMuted={false} // Enable sound as requested
        resizeMode={ResizeMode.CONTAIN}
        useNativeControls={false}
        onError={(error) => console.log(`[EXPO-AV STATUS] Error:`, error)}
      />
    </View>
  );
};

const s = StyleSheet.create({
  wrapper: {
    width: '100%',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  video: {
    width: '100%',
    height: '100%',
  },
});
