import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions, Image, useColorScheme } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  Easing 
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const IMAGES = [
  require('../../../assets/background/bg1.png'),
  require('../../../assets/background/bg2.png'),
  require('../../../assets/background/bg3.png'),
];

const COLUMN_WIDTH = SCREEN_WIDTH / 3;
const IMAGE_HEIGHT = 200; 
const COLUMN_IMAGES_COUNT = 10; 

interface ColumnProps {
  index: number;
  speed: number;
  paused?: boolean;
}

const Column = ({ index, speed, paused }: ColumnProps) => {
  const translateY = useSharedValue(0);
  const columnHeight = IMAGE_HEIGHT * COLUMN_IMAGES_COUNT;

  useEffect(() => {
    if (paused) {
      // Don't start or continue animation if paused
      return;
    }

    translateY.value = withRepeat(
      withTiming(-columnHeight / 2, {
        duration: speed,
        easing: Easing.linear,
      }),
      -1,
      false
    );

    return () => {
      // Clean up animation on unmount or pause
    };
  }, [columnHeight, speed, translateY, paused]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const columnImages = Array.from({ length: COLUMN_IMAGES_COUNT }).map((_, i) => IMAGES[i % IMAGES.length]);

  return (
    <Animated.View style={[styles.column, { left: index * COLUMN_WIDTH }, animatedStyle]}>
      {columnImages.map((img, i) => (
        <Image 
          key={i} 
          source={img} 
          style={styles.image} 
          resizeMode="cover"
        />
      ))}
    </Animated.View>
  );
};

export const AnimatedBackground = ({ paused }: { paused?: boolean }) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <View style={StyleSheet.absoluteFill}>
      {!paused ? (
        <View style={styles.container}>
          <Column index={0} speed={25000} paused={paused} />
          <Column index={1} speed={18000} paused={paused} />
          <Column index={2} speed={30000} paused={paused} />
        </View>
      ) : (
        <Image 
          source={IMAGES[0]} 
          style={StyleSheet.absoluteFill} 
          resizeMode="cover"
        />
      )}
      
      {/* Subtle overlay for better contrast */}
      <View 
        style={[
          styles.overlay, 
          { backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.3)' }
        ]} 
      />
      
      {/* Bottom-to-Top Black Gradient Overlay */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.9)', '#000000']}
        locations={[0, 0.4, 0.7, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Subtle Blur for premium depth */}
      <BlurView intensity={8} style={StyleSheet.absoluteFill} tint={isDark ? 'dark' : 'light'} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  column: {
    position: 'absolute',
    width: COLUMN_WIDTH,
  },
  image: {
    width: COLUMN_WIDTH - 10,
    height: IMAGE_HEIGHT,
    borderRadius: 12,
    marginVertical: 5,
    marginHorizontal: 5,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
});
