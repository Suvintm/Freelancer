import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
  Image,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useBannerData } from '../../hooks/useBannerData';

const HORIZONTAL_PADDING = 24;
const BANNER_ASPECT_RATIO = 16 / 9;
const AUTO_SCROLL_MS = 4500;

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
  const [index, setIndex] = useState(0);
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

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (paused || banners.length <= 1 || isUserDraggingRef.current) return;

    timerRef.current = setTimeout(() => {
      const next = (index + 1) % banners.length;
      listRef.current?.scrollToOffset({
        offset: next * screenWidth,
        animated: true,
      });
      setIndex(next);
    }, AUTO_SCROLL_MS);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [index, paused, banners.length, screenWidth]);

  useEffect(() => {
    setIndex(0);
    listRef.current?.scrollToOffset({
      offset: 0,
      animated: false,
    });
  }, [banners.length, screenWidth]);

  const renderItem = useCallback(({ item }: any) => {
    const imageSource =
      typeof item.image === 'string' ? { uri: item.image } : item.image;

    return (
      <View style={[styles.card, { width: cardWidth, height: bannerHeight }]}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => item.link && router.push(item.link)}
          style={[styles.touchable, { backgroundColor: theme.secondary }]}
        >
          <Image
            source={imageSource}
            style={styles.image}
            resizeMode="cover"
          />

          <LinearGradient
            colors={['rgba(0,0,0,0.7)', 'transparent']}
            style={StyleSheet.absoluteFill}
          />

          <View style={styles.content}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.desc}>{item.description}</Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  }, [bannerHeight, cardWidth, router, theme.secondary]);

  if (!banners.length) {
    return (
      <View style={[styles.card, { width: cardWidth, height: bannerHeight }]}>
        <View style={[styles.touchable, { backgroundColor: theme.secondary }]} />
      </View>
    );
  }

  return (
    <View style={{ marginVertical: 4 }}>
      <FlatList
        ref={listRef}
        data={banners}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item, i) => item._id || i.toString()}
        renderItem={renderItem}
        getItemLayout={(_, i) => ({
          length: screenWidth,
          offset: screenWidth * i,
          index: i,
        })}
        onScrollBeginDrag={() => {
          isUserDraggingRef.current = true;
          if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
          }
        }}
        onMomentumScrollEnd={(e) => {
          const i = Math.round(e.nativeEvent.contentOffset.x / screenWidth);
          isUserDraggingRef.current = false;
          setIndex(i);
        }}
        decelerationRate="fast"
        snapToInterval={screenWidth}
        disableIntervalMomentum
        removeClippedSubviews={false}
        windowSize={3}
        initialNumToRender={1}
        maxToRenderPerBatch={2}
      />

      <View style={styles.dots}>
        {banners.map((_: any, i: number) => (
          <View
            key={i}
            style={[
              styles.dot,
              { opacity: i === index ? 1 : 0.3 },
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    paddingHorizontal: HORIZONTAL_PADDING,
  },
  touchable: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  content: {
    position: 'absolute',
    bottom: 20,
    left: 40,
    right: 40,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  desc: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginTop: 4,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
    marginHorizontal: 3,
  },
});
