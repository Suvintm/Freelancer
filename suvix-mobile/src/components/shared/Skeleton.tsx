import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions, useColorScheme, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/Colors';

const { width } = Dimensions.get('window');

interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: ViewStyle;
  circle?: boolean;
}

/**
 * PRODUCTION-GRADE SHIMMER SKELETON
 * Uses hardware-accelerated Animated API and Theme-aware gradients.
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  width: w = '100%',
  height: h = 20,
  borderRadius = 8,
  style,
  circle = false,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark : Colors.light;

  // Shimmer animation state
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      })
    ).start();
  }, [animatedValue]);

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-width, width],
  });

  const baseColor = isDark ? '#1A1A1A' : '#E1E9EE';
  const highlightColor = isDark ? '#2A2A2A' : '#F2F8FC';

  return (
    <View
      style={[
        styles.skeleton,
        {
          width: w as any,
          height: h as any,
          borderRadius: circle ? (typeof h === 'number' ? h / 2 : 50) : borderRadius,
          backgroundColor: baseColor,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateX }] }]}>
        <LinearGradient
          colors={[baseColor, highlightColor, baseColor]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  skeleton: {
    position: 'relative',
  },
});
