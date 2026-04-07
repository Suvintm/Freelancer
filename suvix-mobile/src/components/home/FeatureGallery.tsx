import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ImageBackground,
} from 'react-native';
import Animated, { 
    useSharedValue, 
    useAnimatedStyle,
    withTiming,
    withRepeat,
    cancelAnimation,
    Easing
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

const { width: SW } = Dimensions.get('window');
const CARD_WIDTH = SW * 0.8; 
const CARD_MARGIN = 16;
const FULL_CARD_WIDTH = CARD_WIDTH + CARD_MARGIN;

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
    route: '/(tabs)/nearby'
  },
  {
    id: 'brands',
    title: 'Promote Your Brand',
    desc: 'Connect with elite YouTube content creators.',
    icon: 'megaphone',
    image: 'https://images.unsplash.com/photo-1492724441997-5dc865305da7?auto=format&fit=crop&q=80&w=800',
    route: '/(tabs)/explore'
  },
  {
    id: 'rentals',
    title: 'Rental Services',
    desc: 'Equip your project with professional gear.',
    icon: 'camera',
    image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=800',
    route: '/(tabs)/jobs'
  }
];

// Double the set for seamless looping
const FEATURES = [...ORIGINAL_FEATURES, ...ORIGINAL_FEATURES];

/**
 * PRODUCTION-GRADE GPU-ACCELERATED MARQUEE
 * Zero Main-Thread Load: Uses hardware compositor for the glide.
 */
export const FeatureGallery = () => {
  const { theme } = useTheme();
  const router = useRouter();
  
  const translateX = useSharedValue(0);

  useEffect(() => {
    // Linear continuous glide
    // We move by exactly one set (ORIGINAL_FEATURES.length cards)
    const setWidth = FULL_CARD_WIDTH * ORIGINAL_FEATURES.length;
    
    translateX.value = withRepeat(
      withTiming(-setWidth, { 
        duration: 20000, // Slow, premium glide (20s)
        easing: Easing.linear 
      }),
      -1, // Infinite
      false // No reverse
    );

    return () => cancelAnimation(translateX);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const handlePress = (route: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(route as any);
  };

  const renderCard = (item: FeatureCard, index: number) => (
    <TouchableOpacity 
      key={`feature-${index}`}
      activeOpacity={0.9} 
      onPress={() => handlePress(item.route)}
      style={[s.card, { borderColor: theme.border }]}
    >
      <ImageBackground
        source={{ uri: item.image }}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      >
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
  );

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={[s.headerTitle, { color: theme.text }]}>DISCOVER SUVIX</Text>
        <Ionicons name="infinite" size={14} color={theme.textSecondary} style={{ opacity: 0.5 }} />
      </View>

      <View style={s.marqueeContainer}>
        <Animated.View style={[s.marqueeList, animatedStyle]}>
          {FEATURES.map((item, index) => renderCard(item, index))}
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
    paddingHorizontal: 24, 
    marginBottom: 10 
  },
  headerTitle: { fontSize: 12, fontWeight: '900', letterSpacing: 1.5, opacity: 0.9 },

  marqueeContainer: {
    width: SW,
    overflow: 'hidden',
  },
  marqueeList: {
    flexDirection: 'row',
    paddingLeft: 24,
  },
  card: { 
    width: CARD_WIDTH,
    height: 124, 
    borderRadius: 28, 
    overflow: 'hidden', 
    borderWidth: 1,
    marginRight: CARD_MARGIN,
  },
  cardInner: { flex: 1, overflow: 'hidden' },
  cardContent: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 20, 
    gap: 16 
  },
  roundIcon: { 
    width: 48, 
    height: 48, 
    borderRadius: 16, 
    backgroundColor: 'rgba(255,255,255,0.1)', 
    alignItems: 'center', 
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)'
  },
  cardTitle: { color: '#fff', fontSize: 17, fontWeight: '900', letterSpacing: -0.5 },
  cardDesc: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '600', marginTop: 3 }
});
