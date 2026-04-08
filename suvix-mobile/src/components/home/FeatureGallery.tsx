import React, { useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  cancelAnimation,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

const CARD_MARGIN = 16;
const HORIZONTAL_PADDING = 24;
const LOOP_DURATION_MS = 22000;

interface FeatureCard {
  id: string;
  title: string;
  desc: string;
  icon: string;
  image: string;
  route: string;
}

const ORIGINAL_FEATURES: FeatureCard[] = [
  {
    id: 'experts',
    title: 'Find Experts Nearby',
    desc: 'Collaborate with local creative talent today.',
    icon: 'rocket',
    image: 'https://images.unsplash.com/photo-1524666041070-9d87656c25bb?auto=format&fit=crop&q=80&w=800',
    route: '/(tabs)/nearby',
  },
  {
    id: 'brands',
    title: 'Promote Your Brand',
    desc: 'Connect with elite YouTube content creators.',
    icon: 'megaphone',
    image: 'https://images.unsplash.com/photo-1492724441997-5dc865305da7?auto=format&fit=crop&q=80&w=800',
    route: '/(tabs)/explore',
  },
  {
    id: 'rentals',
    title: 'Rental Services',
    desc: 'Equip your project with professional gear.',
    icon: 'camera',
    image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=800',
    route: '/(tabs)/jobs',
  },
];

type FeatureGalleryProps = {
  paused?: boolean;
};

export const FeatureGallery = ({ paused = false }: FeatureGalleryProps) => {
  const { theme } = useTheme();
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  const progress = useSharedValue(0);

  const cardWidth = screenWidth * 0.8;
  const fullCardWidth = cardWidth + CARD_MARGIN;
  const singleSetWidth = fullCardWidth * ORIGINAL_FEATURES.length;

  const features = useMemo(
    () => [...ORIGINAL_FEATURES, ...ORIGINAL_FEATURES],
    []
  );

  useEffect(() => {
    cancelAnimation(progress);
    if (singleSetWidth <= 0 || paused) return;

    const wrapped = progress.value % singleSetWidth;
    progress.value = wrapped;
    progress.value = withRepeat(
      withTiming(wrapped + singleSetWidth, {
        duration: LOOP_DURATION_MS,
        easing: Easing.linear,
      }),
      -1,
      false
    );

    return () => cancelAnimation(progress);
  }, [paused, progress, singleSetWidth]);

  const animatedStyle = useAnimatedStyle(() => {
    // Modulo wrap avoids visible "jump to start" hitch.
    const wrapped = singleSetWidth > 0 ? progress.value % singleSetWidth : 0;
    return {
      transform: [{ translateX: -wrapped }],
    };
  }, [singleSetWidth]);

  const handlePress = (route: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(route as any);
  };

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={[s.headerTitle, { color: theme.text }]}>DISCOVER SUVIX</Text>
        <Ionicons name="infinite" size={14} color={theme.textSecondary} style={{ opacity: 0.5 }} />
      </View>

      <View style={[s.marqueeContainer, { width: screenWidth }]}>
        <Animated.View style={[s.marqueeList, { paddingLeft: HORIZONTAL_PADDING }, animatedStyle]}>
          {features.map((item, index) => (
            <TouchableOpacity
              key={`feature-${item.id}-${index}`}
              activeOpacity={0.9}
              onPress={() => handlePress(item.route)}
              style={[s.card, { width: cardWidth, borderColor: theme.border }]}
            >
              <ImageBackground source={{ uri: item.image }} style={StyleSheet.absoluteFill} resizeMode="cover">
                <LinearGradient
                  colors={['rgba(0,0,0,0.8)', 'rgba(0,0,0,0.3)', 'transparent']}
                  start={{ x: 0, y: 0.2 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />

                <View style={s.cardContent}>
                  <View style={s.roundIcon}>
                    <Ionicons name={item.icon as any} size={24} color="#fff" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.cardTitle}>{item.title}</Text>
                    <Text style={s.cardDesc}>{item.desc}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#fff" />
                </View>
              </ImageBackground>
            </TouchableOpacity>
          ))}
        </Animated.View>
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  container: { marginTop: 4, marginBottom: 16 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: HORIZONTAL_PADDING,
    marginBottom: 10,
  },
  headerTitle: { fontSize: 12, fontWeight: '900', letterSpacing: 1.5, opacity: 0.9 },

  marqueeContainer: {
    overflow: 'hidden',
  },
  marqueeList: {
    flexDirection: 'row',
  },
  card: {
    height: 124,
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    marginRight: CARD_MARGIN,
  },
  cardContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 16,
  },
  roundIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  cardTitle: { color: '#fff', fontSize: 17, fontWeight: '900', letterSpacing: -0.5 },
  cardDesc: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '600', marginTop: 3 },
});
