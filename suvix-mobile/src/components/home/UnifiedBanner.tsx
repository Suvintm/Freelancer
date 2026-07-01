import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  useWindowDimensions, 
  Image, 
  TouchableOpacity, 
  Animated,
  PanResponder
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useBannerData } from '../../hooks/useBannerData';
import * as Haptics from 'expo-haptics';

const BANNER_ASPECT_RATIO = 1.3;
const AUTO_SCROLL_MS = 5000;
const SWIPE_THRESHOLD = 40;

type UnifiedBannerProps = {
  data?: any[];
  pageName?: string;
  paused?: boolean;
  width?: number;
};

export const UnifiedBanner = ({ data, paused = false, width }: UnifiedBannerProps) => {
  const { theme } = useTheme();
  const router = useRouter();
  const { data: fetchedData = [] } = useBannerData();
  const { width: screenWidth } = useWindowDimensions();

  const [activeIndex, setActiveIndex] = useState(0);
  const anims = useRef<Array<{ x: Animated.Value; scale: Animated.Value; opacity: Animated.Value }>>([]);
  const dragX = useRef(new Animated.Value(0)).current;
  const autoScrollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cardWidth = width || screenWidth;
  const centerCardWidth = cardWidth * 0.86;
  const bannerHeight = centerCardWidth / BANNER_ASPECT_RATIO;

  const sourceData = Array.isArray(data) && data.length ? data : fetchedData;
  const banners = useMemo(() => {
    return (sourceData || [])
      .map((item: any) => ({
        ...item,
        image: item.thumbnailUrl || item.mediaUrl,
      }))
      .filter((item: any) => !!item.image);
  }, [sourceData]);

  // Navigate functions
  const next = useCallback(() => {
    if (banners.length <= 1) return;
    setActiveIndex((idx) => (idx + 1) % banners.length);
    Haptics.selectionAsync();
  }, [banners.length]);

  const prev = useCallback(() => {
    if (banners.length <= 1) return;
    setActiveIndex((idx) => (idx - 1 + banners.length) % banners.length);
    Haptics.selectionAsync();
  }, [banners.length]);

  // Helper for computing positions relative to active index
  const getPosition = useCallback((idx: number) => {
    const diff = idx - activeIndex;
    if (diff === 0) return 'center';
    if (diff === 1 || diff === -(banners.length - 1)) return 'right';
    if (diff === -1 || diff === banners.length - 1) return 'left';
    return 'hidden';
  }, [activeIndex, banners.length]);

  // Initialize animated values
  if (anims.current.length !== banners.length) {
    anims.current = banners.map((_, i) => {
      const position = getPosition(i);
      let xTarget = 0;
      let scaleTarget = 0.6;
      let opacityTarget = 0;

      if (position === 'center') {
        xTarget = 0;
        scaleTarget = 1.0;
        opacityTarget = 1.0;
      } else if (position === 'left') {
        xTarget = -cardWidth * 0.22;
        scaleTarget = 0.8;
        opacityTarget = 0.35;
      } else if (position === 'right') {
        xTarget = cardWidth * 0.22;
        scaleTarget = 0.8;
        opacityTarget = 0.35;
      }

      return {
        x: new Animated.Value(xTarget),
        scale: new Animated.Value(scaleTarget),
        opacity: new Animated.Value(opacityTarget),
      };
    });
  }

  // Trigger smooth parallel spring animations when activeIndex changes
  useEffect(() => {
    banners.forEach((_, i) => {
      const position = getPosition(i);
      const cardAnim = anims.current[i];
      if (!cardAnim) return;

      let xTarget = 0;
      let scaleTarget = 0.6;
      let opacityTarget = 0;

      if (position === 'center') {
        xTarget = 0;
        scaleTarget = 1.0;
        opacityTarget = 1.0;
      } else if (position === 'left') {
        xTarget = -cardWidth * 0.22;
        scaleTarget = 0.8;
        opacityTarget = 0.35;
      } else if (position === 'right') {
        xTarget = cardWidth * 0.22;
        scaleTarget = 0.8;
        opacityTarget = 0.35;
      }

      Animated.parallel([
        Animated.spring(cardAnim.x, {
          toValue: xTarget,
          useNativeDriver: true,
          tension: 65,
          friction: 9,
        }),
        Animated.spring(cardAnim.scale, {
          toValue: scaleTarget,
          useNativeDriver: true,
          tension: 65,
          friction: 9,
        }),
        Animated.timing(cardAnim.opacity, {
          toValue: opacityTarget,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, [activeIndex, banners.length, cardWidth, getPosition]);

  // Auto-scroll loop
  useEffect(() => {
    if (paused || banners.length <= 1) return;
    autoScrollTimer.current = setInterval(next, AUTO_SCROLL_MS);

    return () => {
      if (autoScrollTimer.current) {
        clearInterval(autoScrollTimer.current);
        autoScrollTimer.current = null;
      }
    };
  }, [next, paused, banners.length]);

  const handleImpact = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // Pan responder to handle swipes on the active center card
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 10;
      },
      onMoveShouldSetPanResponderCapture: (_, gestureState) => {
        // Intercept touch events from children when horizontal drag exceeds 10px
        return Math.abs(gestureState.dx) > 10;
      },
      onPanResponderGrant: () => {
        if (autoScrollTimer.current) {
          clearInterval(autoScrollTimer.current);
          autoScrollTimer.current = null;
        }
      },
      onPanResponderMove: (_, gestureState) => {
        dragX.setValue(gestureState.dx);
      },
      onPanResponderRelease: (_, gestureState) => {
        const { dx, vx } = gestureState;
        if (dx < -SWIPE_THRESHOLD || vx < -0.4) {
          Animated.spring(dragX, {
            toValue: 0,
            useNativeDriver: true,
            tension: 65,
            friction: 9,
          }).start();
          next();
        } else if (dx > SWIPE_THRESHOLD || vx > 0.4) {
          Animated.spring(dragX, {
            toValue: 0,
            useNativeDriver: true,
            tension: 65,
            friction: 9,
          }).start();
          prev();
        } else {
          // Bounce back to original position
          Animated.spring(dragX, {
            toValue: 0,
            useNativeDriver: true,
            tension: 65,
            friction: 9,
          }).start();
        }
      },
    })
  ).current;

  if (!banners.length) return null;

  return (
    <View style={styles.container}>
      <View 
        {...panResponder.panHandlers}
        style={[
          styles.carouselWrapper, 
          { 
            width: cardWidth, 
            height: bannerHeight + 16,
          }
        ]}
      >
        {banners.map((banner, i) => {
          const position = getPosition(i);
          const cardAnim = anims.current[i];
          if (!cardAnim) return null;

          const imageSource = typeof banner.image === 'string' ? { uri: banner.image } : banner.image;

          return (
            <Animated.View
              key={banner._id || i.toString()}
              pointerEvents={position === 'center' ? 'auto' : 'none'}
              style={[
                styles.absoluteCard,
                {
                  width: centerCardWidth,
                  height: bannerHeight,
                  zIndex: position === 'center' ? 30 : position === 'hidden' ? 10 : 20,
                  transform: [
                    { translateX: Animated.add(cardAnim.x, dragX) },
                    { scale: cardAnim.scale }
                  ],
                  opacity: cardAnim.opacity
                }
              ]}
            >
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => {
                  if (position === 'center') {
                    handleImpact();
                    banner.link && router.push(banner.link);
                  }
                }}
                style={[styles.touchable, { backgroundColor: theme.secondary }]}
              >
                <Image
                  source={imageSource}
                  style={styles.image}
                  resizeMode="cover"
                />

                <LinearGradient
                  colors={['rgba(0,0,0,0.85)', 'rgba(0,0,0,0.2)', 'transparent']}
                  style={StyleSheet.absoluteFill}
                  start={{ x: 0, y: 1 }}
                  end={{ x: 0, y: 0 }}
                />

                <View style={styles.content}>
                  <View style={[styles.tag, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                    <Text style={styles.tagText}>{banner.category || 'FEATURED'}</Text>
                  </View>
                  <Text style={styles.title} numberOfLines={1}>{banner.title}</Text>
                  <Text style={styles.desc} numberOfLines={2}>{banner.description}</Text>
                </View>
              </TouchableOpacity>
            </Animated.View>
          );
        })}

        {/* Floating tap overlay selectors for left/right peek cards */}
        {banners.length > 1 && (
          <>
            <TouchableOpacity 
              activeOpacity={1}
              onPress={prev}
              style={[
                styles.peekTapOverlay, 
                { 
                  left: 0, 
                  width: (cardWidth - centerCardWidth) / 2 + 10 
                }
              ]}
            />
            <TouchableOpacity 
              activeOpacity={1}
              onPress={next}
              style={[
                styles.peekTapOverlay, 
                { 
                  right: 0, 
                  width: (cardWidth - centerCardWidth) / 2 + 10 
                }
              ]}
            />
          </>
        )}
      </View>

      {/* 🔮 MINIMAL SEGMENTED INDICATOR */}
      <View style={styles.indicatorWrapper}>
        {banners.map((_: any, i: number) => (
          <View
            key={i}
            style={[
              styles.indicatorSegment,
              { 
                backgroundColor: i === activeIndex 
                  ? (theme.isDarkMode ? '#FFF' : '#1E1E1E') 
                  : (theme.isDarkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.15)'),
                width: i === activeIndex ? 20 : 6 
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 10,
    paddingBottom: 0,
  },
  carouselWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  absoluteCard: {
    position: 'absolute',
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 8,
  },
  touchable: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  content: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  tag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
  },
  tagText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  desc: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
    marginTop: 4,
  },
  peekTapOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    zIndex: 40,
  },
  indicatorWrapper: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  indicatorSegment: {
    height: 6,
    borderRadius: 3,
  }
});
