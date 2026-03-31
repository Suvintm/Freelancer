import React, { useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withRepeat, 
  withTiming, 
  Easing,
  useDerivedValue,
  cancelAnimation,
  interpolate
} from 'react-native-reanimated';

/**
 * PRODUCTION-GRADE MUSIC VISUALIZER (ULTRA-SMOOTH WAVE EDITION)
 * 🎬 Features:
 * 1. Single-Phase Shared Animation for zero-glitch coordination.
 * 2. Mathematical Sine-Wave Peak Propagation (Traveling Wave).
 * 3. High-Fidelity "Fluid" Motion (No randomness).
 */

const BAR_WIDTH = 2;
const BAR_GAP = 2;
const VISIBLE_COUNT = 12;

const VisualizerBar = ({ index, phase }: { index: number; phase: Animated.SharedValue<number> }) => {
  // We use useDerivedValue to calculate the height based on the global phase
  // This ensures all bars are perfectly in sync with the "traveling wave"
  const animatedStyle = useAnimatedStyle(() => {
    // 1. Calculate height using a sine wave shifted by index
    // phase - index * 0.6 creates the "moving from left to right" wave peak effect
    const waveHeight = Math.sin(phase.value - index * 0.6);
    
    // 2. Interpolate the -1...1 sine range to a beautiful bar height 4...16
    const h = interpolate(waveHeight, [-1, 1], [4, 16]);
    
    return {
      height: h,
    };
  });

  return <Animated.View style={[styles.bar, animatedStyle]} />;
};

export const MusicVisualizer = ({ isPlaying = true }) => {
  // The 'phase' is the engine of the entire wave. 
  // Increasing this value makes the peaks "travel" across the bars.
  const phase = useSharedValue(0);

  useEffect(() => {
    if (isPlaying) {
      // 🎬 ELITE: Infinite Traveling Wave
      // we animate phase from 0 to 2*PI (a full cycle) and repeat
      phase.value = withRepeat(
        withTiming(Math.PI * 2, { 
          duration: 1500, // Speed of the traveling wave
          easing: Easing.linear 
        }),
        -1,
        false
      );
    } else {
      // ⏸️ PAUSE: Smoothly decelerate and hold a "minimal" ripple
      cancelAnimation(phase);
      phase.value = withTiming(phase.value + 0.1, { duration: 1000 }); // Tiny settling nudge
    }
  }, [isPlaying]);

  return (
    <View style={styles.container}>
      <View style={styles.barsRow}>
        {Array.from({ length: VISIBLE_COUNT }).map((_, i) => (
          <VisualizerBar key={i} index={i} phase={phase} />
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
    paddingLeft: 2,
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: BAR_GAP,
    width: 32,
    justifyContent: 'center',
  },
  bar: {
    width: BAR_WIDTH,
    backgroundColor: '#FFF',
    borderRadius: 1,
    shadowColor: '#FFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
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
  },
});
