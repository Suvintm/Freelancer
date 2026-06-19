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
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { StoryItem } from '../../hooks/useStories';
import { useTheme } from '../../context/ThemeContext';
import { useRouter } from 'expo-router';
const DEFAULT_AVATAR = require('../../../assets/defualtprofile.png');

/**
 * PREMIUM STORY CIRCLE with 'Dashed Wave' Elevation
 * Features a high-fidelity SVG pulsing wave border that orbits a static avatar.
 */
export const StoryCircle = React.memo(({ story, layout = 'horizontal' }: { story: StoryItem, layout?: 'horizontal' | 'vertical' }) => {
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

  const isVertical = layout === 'vertical';

  const containerStyle = [s.container, isVertical && { width: 64, marginHorizontal: 0, marginVertical: 6 }];
  const avatarWrapperStyle = [s.avatarWrapper, isVertical && { width: 56, height: 56, marginBottom: 4 }];
  const waveLayerStyle = [s.waveLayer, isVertical && { width: 62, height: 62 }];
  
  const borderStyle = isVertical 
    ? { width: 56, height: 56, borderRadius: 28, padding: 2 } 
    : s.gradientBorder;
    
  const plainBorderStyle = isVertical
    ? { width: 56, height: 56, borderRadius: 28, borderWidth: 1, padding: 1.5, justifyContent: 'center' as const, alignItems: 'center' as const }
    : s.plainBorder;

  const innerCircleStyle = [s.innerCircle, isVertical && { borderRadius: 26, padding: 1.5 }];
  const avatarStyle = [s.avatar, isVertical && { borderRadius: 24 }];
  const plusBadgeStyle = [s.plusBadge, isVertical && { width: 16, height: 16, borderRadius: 8, bottom: 0, right: 0 }];
  const usernameStyle = [s.username, { color: theme.text }, isSeen && s.seenUsername, isVertical && { fontSize: 8.5, maxWidth: 50 }];
  const verifiedIconSize = isVertical ? 10 : 13;

  return (
    <View style={containerStyle}>
      <Pressable onPress={handlePress} style={s.pressable}>
        <View style={avatarWrapperStyle}>
            {/* ─── PREMIUM DASHED WAVE LAYER (SVG) ─── */}
            <Animated.View style={[waveLayerStyle, waveStyle]}>
                <Svg width={isVertical ? "62" : "80"} height={isVertical ? "62" : "80"} viewBox={isVertical ? "0 0 62 62" : "0 0 80 80"}>
                    <Circle
                        cx={isVertical ? "31" : "40"}
                        cy={isVertical ? "31" : "40"}
                        r={isVertical ? "29" : "38"}
                        stroke={strokeColor}
                        strokeWidth={isVertical ? "1.5" : "2"}
                        fill="none"
                        strokeDasharray={isVertical ? "4, 6" : "6, 10"} // Discontinuous Dots
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
                    style={borderStyle}
                >
                    <View style={[innerCircleStyle, { backgroundColor: theme.primary }]}>
                        <Image 
                          source={story.avatar ? { uri: story.avatar } : DEFAULT_AVATAR} 
                          style={avatarStyle} 
                        />
                    </View>
                </LinearGradient>
            ) : (
                <View style={[plainBorderStyle, isSeen && s.seenBorder]}>
                    <View style={[innerCircleStyle, { backgroundColor: theme.primary }]}>
                        <Image 
                          source={story.avatar ? { uri: story.avatar } : DEFAULT_AVATAR} 
                          style={avatarStyle} 
                        />
                    </View>
                </View>
            )}

            {story.isUserStory && (
                <TouchableOpacity 
                    style={plusBadgeStyle} 
                    onPress={() => router.push('/story/create')}
                    activeOpacity={0.8}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Ionicons name="add" size={isVertical ? 10 : 14} color="#FFF" />
                </TouchableOpacity>
            )}
        </View>
        
        <View style={s.usernameContainer}>
          <Text 
              style={usernameStyle} 
              numberOfLines={1}
          >
              {story.username}
          </Text>
          {story.verifiedColor && (
              <MaterialCommunityIcons name="check-decagram" size={verifiedIconSize} color={story.verifiedColor} style={s.verifiedIcon} />
          )}
        </View>
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
  usernameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    maxWidth: '100%',
  },
  username: {
    fontSize: 11,
    textAlign: 'center',
    fontWeight: '500',
    letterSpacing: -0.2,
    maxWidth: 55, // Leaves room for badge
  },
  verifiedIcon: {
    marginLeft: 2,
  },
  seenUsername: {
    opacity: 0.5,
  },
});
