import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Image,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 48;
const HEIGHT = CARD_WIDTH / (16 / 9);

export const UnifiedBanner = ({ data = [] }: any) => {
  const { theme } = useTheme();
  const router = useRouter();

  const listRef = useRef<FlatList>(null);
  const [index, setIndex] = useState(0);

  // 🔥 Memoize banners
  const banners = useMemo(() => {
    return data?.map((item: any) => ({
      ...item,
      image: item.thumbnailUrl || item.mediaUrl,
    })) || [];
  }, [data]);

  // 🚀 Smooth auto scroll (NO setInterval lag)
  useEffect(() => {
    if (!banners.length) return;

    const timer = setTimeout(() => {
      const next = (index + 1) % banners.length;
      listRef.current?.scrollToOffset({
        offset: next * width,
        animated: true,
      });
      setIndex(next);
    }, 4000);

    return () => clearTimeout(timer);
  }, [index, banners.length]);

  const renderItem = useCallback(({ item }: any) => {
    return (
      <View style={[styles.card, { backgroundColor: theme.secondary }]}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => item.link && router.push(item.link)}
          style={{ flex: 1 }}
        >
          {/* Image */}
          <Image
            source={{ uri: item.image }}
            style={styles.image}
            resizeMode="cover"
          />

          {/* Overlay */}
          <LinearGradient
            colors={['rgba(0,0,0,0.7)', 'transparent']}
            style={StyleSheet.absoluteFill}
          />

          {/* Content */}
          <View style={styles.content}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.desc}>{item.description}</Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  }, []);

  if (!banners.length) {
    return (
      <View style={[styles.card, { backgroundColor: theme.secondary }]} />
    );
  }

  return (
    <View style={{ marginVertical: 12 }}>
      <FlatList
        ref={listRef}
        data={banners}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item, i) => i.toString()}
        renderItem={renderItem}
        getItemLayout={(_, i) => ({
          length: width,
          offset: width * i,
          index: i,
        })}
        onMomentumScrollEnd={(e) => {
          const i = Math.round(e.nativeEvent.contentOffset.x / width);
          setIndex(i);
        }}
        removeClippedSubviews
        windowSize={3}
        initialNumToRender={1}
        maxToRenderPerBatch={2}
      />

      {/* Pagination Dots */}
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
    width: width,
    height: HEIGHT,
    paddingHorizontal: 24,
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
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