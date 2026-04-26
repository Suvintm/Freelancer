import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  useWindowDimensions, 
  Image, 
  FlatList, 
  TouchableOpacity, 
  Animated,
  Platform
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useBannerData } from '../../hooks/useBannerData';
import * as Haptics from 'expo-haptics';

const HORIZONTAL_PADDING = 20;
const BANNER_ASPECT_RATIO = 16 / 9;
const AUTO_SCROLL_MS = 5000;

type UnifiedBannerProps = {
  data?: any[];
  pageName?: string;
  paused?: boolean;
};

export const UnifiedBanner = ({ data, paused = false }: UnifiedBannerProps) => {
  const { theme } = useTheme();
  const router = useRouter();
  const { data: fetchedData = [] } = useBannerData();
  const { width: screenWidth } = useWindowDimensions();

  const listRef = useRef<FlatList>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isUserDraggingRef = useRef(false);

  const cardWidth = screenWidth;
  const imageWidth = screenWidth - HORIZONTAL_PADDING * 2;
  const bannerHeight = imageWidth / BANNER_ASPECT_RATIO;

  const sourceData = Array.isArray(data) && data.length ? data : fetchedData;
  const banners = useMemo(() => {
    return (sourceData || [])
      .map((item: any) => ({
        ...item,
        image: item.thumbnailUrl || item.mediaUrl,
      }))
      .filter((item: any) => !!item.image);
  }, [sourceData]);

  // ── Auto-Scroll & Progress Animation ─────────────────────────────────────
  const lastIndexRef = useRef(0);
  const currentProgressRef = useRef(0);

  // ── Auto-Scroll & Progress Animation ─────────────────────────────────────
  useEffect(() => {
    if (paused || banners.length <= 1 || isUserDraggingRef.current) {
        progressAnim.stopAnimation((val) => {
          currentProgressRef.current = val;
        });
        return;
    }

    // Determine if we should resume or start fresh
    const isNewSlide = activeIndex !== lastIndexRef.current;
    if (isNewSlide) {
      currentProgressRef.current = 0;
      lastIndexRef.current = activeIndex;
    }

    const startValue = currentProgressRef.current;
    const remainingDuration = AUTO_SCROLL_MS * (1 - startValue);

    progressAnim.setValue(startValue);
    
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: remainingDuration,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished && !isUserDraggingRef.current) {
        const next = (activeIndex + 1) % banners.length;
        listRef.current?.scrollToOffset({
          offset: next * screenWidth,
          animated: true,
        });
        setActiveIndex(next);
        currentProgressRef.current = 0;
      }
    });

    return () => progressAnim.stopAnimation((val) => {
      currentProgressRef.current = val;
    });
  }, [activeIndex, paused, banners.length, screenWidth]);

  useEffect(() => {
    setActiveIndex(0);
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [banners.length, screenWidth]);

  const handleImpact = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const renderItem = useCallback(({ item, index }: any) => {
    const imageSource = typeof item.image === 'string' ? { uri: item.image } : item.image;

    // Parallax Interpolation
    const translateX = scrollX.interpolate({
        inputRange: [(index - 1) * screenWidth, index * screenWidth, (index + 1) * screenWidth],
        outputRange: [-screenWidth * 0.15, 0, screenWidth * 0.15],
        extrapolate: 'clamp',
    });

    return (
      <View style={[styles.card, { width: cardWidth, height: bannerHeight }]}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => {
            handleImpact();
            item.link && router.push(item.link);
          }}
          style={[styles.touchable, { backgroundColor: theme.secondary }]}
        >
          {/* 🏙️ PARALLAX IMAGE */}
          <Animated.Image
            source={imageSource}
            style={[
              styles.image,
              { transform: [{ translateX }, { scale: 1.1 }] }
            ]}
            resizeMode="cover"
          />

          <LinearGradient
            colors={['rgba(0,0,0,0.8)', 'rgba(0,0,0,0.2)', 'transparent']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 1 }}
            end={{ x: 0, y: 0 }}
          />

          <View style={styles.content}>
            <View style={[styles.tag, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                <Text style={styles.tagText}>{item.category || 'FEATURED'}</Text>
            </View>
            <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
            <Text style={styles.desc} numberOfLines={2}>{item.description}</Text>
          </View>

          {/* ⚡ KINETIC PROGRESS LINE */}
          {activeIndex === index && !paused && (
            <View style={styles.progressBarBg}>
                <Animated.View 
                    style={[
                        styles.progressBarFill, 
                        { 
                            width: progressAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: ['0%', '100%']
                            })
                        }
                    ]} 
                />
            </View>
          )}
        </TouchableOpacity>
      </View>
    );
  }, [bannerHeight, cardWidth, router, theme.secondary, scrollX, activeIndex, paused, progressAnim]);

  if (!banners.length) return null;

  return (
    <View style={styles.container}>
      <Animated.FlatList
        ref={listRef}
        data={banners}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item, i) => item._id || i.toString()}
        renderItem={renderItem}
        onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: true }
        )}
        onScrollBeginDrag={() => {
          isUserDraggingRef.current = true;
          progressAnim.stopAnimation();
        }}
        onMomentumScrollEnd={(e) => {
          const i = Math.round(e.nativeEvent.contentOffset.x / screenWidth);
          isUserDraggingRef.current = false;
          setActiveIndex(i);
          Haptics.selectionAsync();
        }}
        decelerationRate="fast"
        snapToInterval={screenWidth}
        disableIntervalMomentum
        removeClippedSubviews={false}
        windowSize={3}
      />

      {/* 🔮 MINIMAL SEGMENTED INDICATOR */}
      <View style={styles.indicatorWrapper}>
        {banners.map((_: any, i: number) => (
          <View
            key={i}
            style={[
              styles.indicatorSegment,
              { 
                backgroundColor: i === activeIndex ? '#FFF' : 'rgba(255,255,255,0.3)',
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
    marginVertical: 12,
  },
  card: {
    paddingHorizontal: HORIZONTAL_PADDING,
  },
  touchable: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  content: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    right: 24,
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
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  desc: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
    marginTop: 4,
  },
  progressBarBg: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#71717a',
  },
  indicatorWrapper: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    gap: 6,
  },
  indicatorSegment: {
    height: 6,
    borderRadius: 3,
  }
});
