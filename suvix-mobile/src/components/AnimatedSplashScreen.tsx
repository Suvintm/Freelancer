import React, { useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  StatusBar,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  withSequence,
  withRepeat,
  runOnJS,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// --- Timing constants (Total 2300ms) ---
const T = {
  PARTICLES_IN: 0,
  ICON_IN:     200,
  TEXT_IN:     500,
  X_IN:        700,
  SPARKLE_IN:  900,
  EXIT:        1800,
};

const SPRING = { damping: 18, stiffness: 200, mass: 0.8 };

interface Props {
  onAnimationFinish: () => void;
}

function FloatingParticle({ delay }: { delay: number }) {
  const x = useSharedValue(Math.random() * SCREEN_WIDTH);
  const y = useSharedValue(Math.random() * SCREEN_HEIGHT);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(0.2, { duration: 1000 }));
    x.value = withRepeat(withTiming(x.value + (Math.random() * 40 - 20), { duration: 4000, easing: Easing.inOut(Easing.sin) }), -1, true);
    y.value = withRepeat(withTiming(y.value + (Math.random() * 40 - 20), { duration: 5000, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [delay, opacity, x, y]);

  const style = useAnimatedStyle(() => ({
    position: 'absolute',
    left: x.value,
    top: y.value,
    opacity: opacity.value,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
  }));

  return <Animated.View style={style} />;
}

function Sparkle({ sv, dx, dy }: { sv: Animated.SharedValue<number>; dx: number; dy: number }) {
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: sv.value,
    transform: [
      { translateX: interpolate(sv.value, [0, 1], [0, dx]) },
      { translateY: interpolate(sv.value, [0, 1], [0, dy]) },
      { scale: interpolate(sv.value, [0, 1], [0.2, 1]) },
    ],
  }));

  return <Animated.View style={[styles.sparkle, animatedStyle]} />;
}

export default function AnimatedSplashScreen({ onAnimationFinish }: Props) {
  const containerOpacity = useSharedValue(1);
  const iconScale = useSharedValue(0.4);
  const iconOpacity = useSharedValue(0);
  const iconRotate = useSharedValue(-20);
  const textOpacity = useSharedValue(0);
  const textTranslateX = useSharedValue(-40);
  const xScale = useSharedValue(0);
  const xOpacity = useSharedValue(0);
  const xRotate = useSharedValue(240);
  
  const spark1 = useSharedValue(0);
  const spark2 = useSharedValue(0);
  const spark3 = useSharedValue(0);
  const spark4 = useSharedValue(0);

  const startAnimations = useCallback(() => {
    iconScale.value = withDelay(T.ICON_IN, withSpring(1, SPRING));
    iconOpacity.value = withDelay(T.ICON_IN, withTiming(1, { duration: 500 }));
    iconRotate.value = withDelay(T.ICON_IN, withSpring(0, { damping: 20 }));

    textOpacity.value = withDelay(T.TEXT_IN, withTiming(1, { duration: 500 }));
    textTranslateX.value = withDelay(T.TEXT_IN, withSpring(0, { damping: 22 }));

    xScale.value = withDelay(T.X_IN, withSpring(1.1, { damping: 10 }));
    xOpacity.value = withDelay(T.X_IN, withTiming(1, { duration: 300 }));
    xRotate.value = withDelay(T.X_IN, withSpring(0, { damping: 12 }));

    const sparkAnim = (sv: any) =>
      withDelay(T.SPARKLE_IN, withSequence(withTiming(1, { duration: 400 }), withTiming(0, { duration: 300 })));

    spark1.value = sparkAnim(spark1);
    spark2.value = withDelay(60, sparkAnim(spark2));
    spark3.value = withDelay(120, sparkAnim(spark3));
    spark4.value = withDelay(180, sparkAnim(spark4));

    containerOpacity.value = withDelay(T.EXIT, withTiming(0, { duration: 500 }, (f) => f && runOnJS(onAnimationFinish)()));
  }, [onAnimationFinish, containerOpacity, iconOpacity, iconRotate, iconScale, spark1, spark2, spark3, spark4, textOpacity, textTranslateX, xOpacity, xRotate, xScale]);

  useEffect(() => { startAnimations(); }, [startAnimations]);

  const containerStyle = useAnimatedStyle(() => ({ opacity: containerOpacity.value }));
  const iconStyle = useAnimatedStyle(() => ({
    opacity: iconOpacity.value,
    transform: [{ scale: iconScale.value }, { rotate: `${iconRotate.value}deg` }],
  }));
  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateX: textTranslateX.value }],
  }));
  const xStyle = useAnimatedStyle(() => ({
    opacity: xOpacity.value,
    transform: [{ scale: xScale.value }, { rotate: `${xRotate.value}deg` }],
  }));

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <LinearGradient 
        colors={['#0047FF', '#8B00FF', '#FF00A8']} 
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill} 
      />

      {[...Array(12)].map((_, i) => (
        <FloatingParticle key={i} delay={i * 150} />
      ))}

      <View style={styles.content}>
        <View style={styles.logoRow}>
          <Animated.Image 
            source={require('../../assets/flashlogo.png')}
            style={[styles.mainIcon, iconStyle]}
            resizeMode="contain"
          />

          <View style={styles.wordmarkContainer}>
            <Animated.Image 
              source={require('../../assets/suvi.png')}
              style={[styles.suviText, textStyle]}
              resizeMode="contain"
            />
            <View style={styles.xWrapper}>
              <Sparkle sv={spark1} dx={-35} dy={-35} />
              <Sparkle sv={spark2} dx={35} dy={-35} />
              <Sparkle sv={spark3} dx={35} dy={35} />
              <Sparkle sv={spark4} dx={-35} dy={35} />
              
              <Animated.Image 
                source={require('../../assets/x.png')}
                style={[styles.xIcon, xStyle]}
                resizeMode="contain"
              />
            </View>
          </View>
        </View>

        <Animated.Text style={[styles.tagline, textStyle]}>
          Where Creators Meet Master Editors
        </Animated.Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0047FF',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  content: { alignItems: 'center', justifyContent: 'center' },
  logoRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 0, // No gap
  },
  mainIcon: { 
    width: 95, 
    height: 95, 
    marginRight: -20, // Aggressively pull text into the circle
  },
  wordmarkContainer: { flexDirection: 'row', alignItems: 'center', width: 140 },
  suviText: { width: 110, height: 50, position: 'absolute', left: 0 },
  xWrapper: { position: 'absolute', left: 88, width: 62, height: 62, alignItems: 'center', justifyContent: 'center' },
  xIcon: { width: 62, height: 62 },
  sparkle: { position: 'absolute', width: 6, height: 6, borderRadius: 2, backgroundColor: '#FFFFFF', transform: [{ rotate: '45deg' }] },
  tagline: { 
    marginTop: 45, 
    fontSize: 13, 
    fontWeight: '700', 
    color: 'rgba(255,255,255,0.85)', 
    letterSpacing: 2,
    textAlign: 'center'
  },
});
