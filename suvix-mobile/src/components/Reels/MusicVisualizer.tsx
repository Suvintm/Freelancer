import React, { useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withRepeat, 
  withTiming, 
  withSequence,
  withDelay
} from 'react-native-reanimated';

/**
 * MusicVisualizer - Mobile version of the web audio wave.
 * Uses 12 animated bars to simulate audio playback.
 */
const VisualizerBar = ({ index }: { index: number }) => {
  const height = useSharedValue(5);

  useEffect(() => {
    // Randomize initial heights and durations slightly for organic wave look
    const val1 = 12 + Math.random() * 8;
    const val2 = 6 + Math.random() * 4;
    const duration = 400 + Math.random() * 300;

    height.value = withDelay(
      index * 60,
      withRepeat(
        withSequence(
          withTiming(val1, { duration }),
          withTiming(val2, { duration })
        ),
        -1,
        true
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    height: height.value,
  }));

  return <Animated.View style={[styles.bar, animatedStyle]} />;
};

export const MusicVisualizer = ({ isPlaying = true }) => {
  if (!isPlaying) return null;

  return (
    <View style={styles.container}>
      <View style={styles.barsRow}>
        {Array.from({ length: 12 }).map((_, i) => (
          <VisualizerBar key={i} index={i} />
        ))}
      </View>
      <Text style={styles.audioText} numberOfLines={1}>Original Audio</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    height: 16,
    paddingLeft: 2, // Tiny offset to perfectly align with the text above
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    height: 16,
    width: 32,
    justifyContent: 'center',
  },
  bar: {
    width: 2,
    backgroundColor: '#FFF',
    borderRadius: 1,
    shadowColor: '#FFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 2,
  },
  audioText: {
    color: '#FFF',
    fontSize: 8,
    fontWeight: 'bold',
    marginLeft: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    opacity: 0.7,
    maxWidth: 150,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
