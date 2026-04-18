import React, { useRef, useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  Image, 
  StyleSheet, 
  Pressable, 
  TouchableOpacity,
} from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  Easing,
  cancelAnimation
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { StoryItem } from '../../hooks/useStories';
import { useTheme } from '../../context/ThemeContext';
import { useRouter } from 'expo-router';

/**
 * PREMIUM STORY CIRCLE with 'Dashed Wave' Elevation
 * Features a high-fidelity SVG pulsing wave border that orbits a static avatar.
 */
export const StoryCircle = React.memo(({ story }: { story: StoryItem }) => {
  const { isDarkMode, theme } = useTheme();
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);
  const navTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Wave Animation Values
  const waveScale = useSharedValue(1);
  const waveRotate = useSharedValue(0);
  const waveOpacity = useSharedValue(0);

  const waveStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: waveScale.value },
      { rotate: `${waveRotate.value}deg` }
    ],
    opacity: waveOpacity.value,
  }));

  const performNavigation = () => {
    setIsNavigating(false);
    cancelAnimation(waveScale);
    cancelAnimation(waveRotate);
    waveOpacity.value = 0;
    waveScale.value = 1;
    waveRotate.value = 0;

    if (story.isUserStory && !story.hasActiveStory) {
      router.push('/story/create');
    } else {
      router.push(`/story/${story._id}`);
    }
  };

  useEffect(() => {
    return () => {
      if (navTimerRef.current) {
        clearTimeout(navTimerRef.current);
        navTimerRef.current = null;
      }
    };
  }, []);

  const handlePress = () => {
    if (isNavigating) return;
    setIsNavigating(true);
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    cancelAnimation(waveScale);
    cancelAnimation(waveRotate);
    cancelAnimation(waveOpacity);
    waveScale.value = 1;
    waveRotate.value = 0;

    // 1. Kickstart the 'Dashed Wave' Pulsing Sequence
    waveOpacity.value = withTiming(1, { duration: 150 });
    
    // Wave Expansion
    waveScale.value = withTiming(1.15, { 
        duration: 800, 
        easing: Easing.bezier(0.4, 0, 0.2, 1) 
    });

    // Wave Angular Velocity (Orbit)
    waveRotate.value = withTiming(270, { 
        duration: 850, 
        easing: Easing.out(Easing.quad) 
    });

    // 2. Scheduled Navigation
    navTimerRef.current = setTimeout(() => {
      performNavigation();
      navTimerRef.current = null;
    }, 650);
  };

  const isSeen = story.isSeen && !story.isUserStory;
  const hasUserActive = story.isUserStory && story.hasActiveStory;
  const showGradient = (!isSeen && !story.isUserStory) || hasUserActive;

  const gradientColors = isDarkMode 
    ? (['#FFFFFF', '#71717a'] as const) 
    : (['#09090b', '#a1a1aa'] as const);

  // Stroke color based on theme
  const strokeColor = isDarkMode ? '#FFFFFF' : '#09090b';

  return (
    <View style={s.container}>
      <Pressable onPress={handlePress} style={s.pressable}>
        <View style={s.avatarWrapper}>
            {/* ─── PREMIUM DASHED WAVE LAYER (SVG) ─── */}
            <Animated.View style={[s.waveLayer, waveStyle]}>
                <Svg width="80" height="80" viewBox="0 0 80 80">
                    <Circle
                        cx="40"
                        cy="40"
                        r="38"
                        stroke={strokeColor}
                        strokeWidth="2"
                        fill="none"
                        strokeDasharray="6, 10" // Discontinuous Dots
                        strokeLinecap="round"
                        opacity={0.6}
                    />
                </Svg>
            </Animated.View>

            {/* ─── STATIC AVATAR & BORDER ─── */}
            {showGradient ? (
                <LinearGradient
                    colors={gradientColors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={s.gradientBorder}
                >
                    <View style={[s.innerCircle, { backgroundColor: theme.primary }]}>
                        <Image source={{ uri: story.avatar }} style={s.avatar} />
                    </View>
                </LinearGradient>
            ) : (
                <View style={[s.plainBorder, isSeen && s.seenBorder]}>
                    <View style={[s.innerCircle, { backgroundColor: theme.primary }]}>
                        <Image source={{ uri: story.avatar }} style={s.avatar} />
                    </View>
                </View>
            )}

            {story.isUserStory && (
                <TouchableOpacity 
                    style={s.plusBadge} 
                    onPress={() => router.push('/story/create')}
                    activeOpacity={0.8}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Ionicons name="add" size={14} color="#FFF" />
                </TouchableOpacity>
            )}
        </View>
        
        <Text 
            style={[s.username, { color: theme.text }, isSeen && s.seenUsername]} 
            numberOfLines={1}
        >
            {story.username}
        </Text>
      </Pressable>
    </View>
  );
});

const s = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginHorizontal: 8,
    width: 76,
  },
  pressable: {
    alignItems: 'center',
    width: '100%',
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 6,
    width: 72,
    height: 72,
    justifyContent: 'center',
    alignItems: 'center',
  },
  waveLayer: {
    position: 'absolute',
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: -1,
  },
  gradientBorder: {
    width: 72,
    height: 72,
    borderRadius: 36,
    padding: 2.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerCircle: {
    width: '100%',
    height: '100%',
    borderRadius: 34,
    padding: 2,
  },
  plainBorder: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    padding: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  seenBorder: {
    borderColor: 'rgba(255,255,255,0.08)',
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 32,
    backgroundColor: '#1a1a1a',
  },
  plusBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#3b82f6',
    borderWidth: 2,
    borderColor: '#050505',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  username: {
    fontSize: 11,
    textAlign: 'center',
    fontWeight: '500',
    letterSpacing: -0.2,
  },
  seenUsername: {
    opacity: 0.5,
  },
});
