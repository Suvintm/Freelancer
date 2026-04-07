import React, {
  useState,
  useRef,
  useMemo,
  useEffect,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Image,
  TouchableOpacity,
  Animated as RNAnimated,
  FlatList,
} from 'react-native';
import Animated, { 
  useSharedValue, 
  runOnJS,
  useAnimatedRef,
  scrollTo,
  useAnimatedReaction,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  cancelAnimation
} from 'react-native-reanimated';
import { useTheme } from '../../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import Video from 'react-native-video';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useBannerData } from '../../hooks/useBannerData';

// ─── Native Components (Used below at line 72) ───────────────────────────────

// ─── Dimensions ───────────────────────────────────────────────────────────────
const { width: SW } = Dimensions.get('window');
const CARD_WIDTH    = SW - 48; // Symmetrical 24px margins when centered
const BANNER_HEIGHT = CARD_WIDTH / (16 / 10);

// ─── Constants ───────────────────────────────────────────────────────────────
const CATEGORY_STYLES: Record<string, { color: string; icon: any }> = {
  HOME:    { color: '#f59e0b', icon: 'megaphone-outline' },
  SPARKS:  { color: '#a78bfa', icon: 'sparkles-outline' },
  EXPLORE: { color: '#34d399', icon: 'film-outline' },
};

// ─── Utils ──────────────────────────────────────────────────────────────────
const repairUrl = (url?: any): any => {
  if (!url || typeof url !== 'string' || !url.includes('cloudinary')) return url ?? '';
  let f = url.replace(/^(https?):?\/*_+/gi, '$1://').replace(/_+res_+cloudinary_+com/g, 'res.cloudinary.com');
  if (f.includes('res.cloudinary.com')) {
    const uploadIdx = f.indexOf('/upload/');
    if (uploadIdx !== -1) {
      const baseUrl = f.substring(0, uploadIdx + 8);
      let rest = f.substring(uploadIdx + 8).replace(/_mp4$/i, '.mp4').replace(/_jpg$/i, '.jpg').replace(/_png$/i, '.png');
      f = `${baseUrl}q_auto,f_mp4,vc_h264,ac_aac,w_1080,c_limit/${rest.split('/').pop()}`;
    }
  }
  return f.replace(/([^:])\/\/+/g, '$1/').replace(/^http:/, 'https:');
};

const resolveLayout = (lc: Record<string, any> = {}) => ({
  overlayOpacity: lc.overlayOpacity ?? 75,
  overlayColor: lc.overlayColor ?? '#040408',
  titleSize: lc.titleSize ?? 'md',
  titleWeight: lc.titleWeight ?? 'black',
  titleColor: lc.titleColor ?? '#ffffff',
  descColor: lc.descColor ?? 'rgba(212,212,216,0.85)',
  slideDuration: lc.slideDuration ?? 5000,
});

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);

// ─── Video Component ────────────────────────────────────────────────────────
const BannerVideo = ({ source, muted, onPlayError }: any) => {
  const fadeAnim = useRef(new RNAnimated.Value(0)).current;
  return (
    <RNAnimated.View style={[StyleSheet.absoluteFill, { opacity: fadeAnim }]}>
      <Video
        source={(typeof source === 'number' ? source : { uri: source }) as any}
        style={StyleSheet.absoluteFill}
        muted={muted}
        repeat={true}
        resizeMode="cover"
        shutterColor="transparent"
        onReadyForDisplay={() => {
          RNAnimated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
        }}
        onError={onPlayError}
      />
    </RNAnimated.View>
  );
};

// ─── Main Unified Banner ────────────────────────────────────────────────────
interface UnifiedBannerProps {
  pageName?: 'home' | 'editors' | 'gigs' | 'jobs' | 'explore';
}

export const UnifiedBanner = ({ pageName = 'home' }: UnifiedBannerProps) => {
  const { theme } = useTheme();
  const router = useRouter();
  const { data: adsData, isLoading } = useBannerData(pageName);

  const activeIndexValue = useSharedValue(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [muted, setMuted] = useState(true);
  const [videoFailures, setVideoFailures] = useState<Record<string, boolean>>({});

  const listRef = useAnimatedRef<any>();
  const isLayoutReady = useSharedValue(false);

  // 1. Flatten all categories into a single stream
  const allBanners = useMemo(() => {
    if (!adsData) return [];
    const fmt = (ad: any, category: string) => ({
      ...ad,
      category,
      mediaUrl: repairUrl(ad.mediaUrl),
      thumbnailUrl: ad.thumbnailUrl ? repairUrl(ad.thumbnailUrl) : '',
      layout: resolveLayout(ad.layoutConfig),
    });

    const l0 = adsData.filter((a: any) => a.displayLocations?.some((l: string) => l.includes('home_0') || l === 'home_banner')).map((a: any) => fmt(a, 'HOME'));
    const l1 = adsData.filter((a: any) => a.displayLocations?.some((l: string) => l.includes('home_1'))).map((a: any) => fmt(a, 'SPARKS'));
    const l2 = adsData.filter((a: any) => a.displayLocations?.some((l: string) => l.includes('home_2'))).map((a: any) => fmt(a, 'EXPLORE'));

    return [...l0, ...l1, ...l2];
  }, [adsData]);

  const progressValue = useSharedValue(0);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressValue.value}%`,
  }));

  // 2. STABLE NATIVE ANIMATION (Zero UI Thread Load)
  useEffect(() => {
    if (!adsData || allBanners.length <= 1) return;

    // A. Native Progress Bar Glide (GPU)
    progressValue.value = 0;
    progressValue.value = withRepeat(
      withTiming(100, { duration: 5000, easing: Easing.linear }),
      -1,
      false
    );

    // B. Main Slide Dispatcher (Lighter than 60fps frame loop)
    const interval = setInterval(() => {
      const nextIdx = (activeIndexValue.value + 1) % allBanners.length;
      activeIndexValue.value = nextIdx;
      
      // Native-safe scrollTo (Once every 5s instead of 60x per sec)
      scrollTo(listRef, nextIdx * SW, 0, true);
      
      // Sync React state for HUD
      runOnJS(setActiveIndex)(nextIdx);
    }, 5000);

    return () => {
      clearInterval(interval);
      cancelAnimation(progressValue);
    };
  }, [allBanners.length, adsData]);

  // JS Sync for HUD indexing
  useAnimatedReaction(
    () => activeIndexValue.value,
    (curr, prev) => {
      if (curr !== prev) {
        runOnJS(setActiveIndex)(curr);
      }
    }
  );

  const onMomentumScrollEnd = (e: any) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / SW);
    activeIndexValue.value = idx;
    progressValue.value = 0;
  };

  // 4. PRODUCTION-GRADE PLACEHOLDER: Ensure UI is stable during 1ms data resolution
  if (isLoading || !allBanners.length) return (
    <View style={[s.container, { height: BANNER_HEIGHT, paddingHorizontal: 24 }]}>
       <View style={[s.card, { backgroundColor: theme.secondary, opacity: 0.5, borderStyle: 'dashed' }]} />
    </View>
  );

  return (
    <View style={[s.container, { height: BANNER_HEIGHT }]}>
      <AnimatedFlatList
        ref={listRef}
        onLayout={() => { isLayoutReady.value = true; }}
        data={allBanners}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        onMomentumScrollEnd={onMomentumScrollEnd}
        keyExtractor={(item: any) => item._id}
        renderItem={({ item, index }: any) => {
          const cat = CATEGORY_STYLES[item.category] || CATEGORY_STYLES.HOME;
          const isActive = index === activeIndex;

          return (
            <View style={[s.slide, { width: SW }]}>
              <View style={[s.card, { width: CARD_WIDTH, backgroundColor: theme.secondary, borderColor: theme.border }]}>
                {/* Media Layer */}
                <TouchableOpacity activeOpacity={1} style={StyleSheet.absoluteFill} onPress={() => item.cardLink && router.push(item.cardLink as any)}>
                  {(item.thumbnailUrl || item.mediaType === 'image') && (
                    <Image source={{ uri: item.thumbnailUrl || item.mediaUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                  )}
                  {item.mediaType === 'video' && isActive && !videoFailures[item._id] && (
                    <BannerVideo 
                      source={item.mediaUrl} 
                      muted={muted} 
                      onPlayError={() => setVideoFailures(p => ({ ...p, [item._id]: true }))}
                    />
                  )}
                </TouchableOpacity>

                {/* Content HUD */}
                <LinearGradient colors={['rgba(0,0,0,0.85)', 'rgba(0,0,0,0.2)', 'transparent']} start={{ x: 0, y: 1 }} end={{ x: 0, y: 0 }} style={StyleSheet.absoluteFill} pointerEvents="none" />
                
                <View style={s.hud} pointerEvents="box-none">
                  {/* Category Badge */}
                  <View style={s.badgeRow}>
                    <View style={[s.badge, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
                      <Ionicons name={cat.icon} size={10} color={cat.color} />
                      <Text style={[s.badgeTxt, { color: cat.color }]}>{item.category}</Text>
                    </View>
                    <View style={s.sponsor}><Text style={s.sponsorTxt}>SPONSOR</Text></View>
                  </View>

                  <Text numberOfLines={2} style={s.title}>{item.title}</Text>
                  <Text numberOfLines={1} style={s.desc}>{item.description || item.tagline}</Text>

                  <View style={s.ctaRow}>
                    <TouchableOpacity style={[s.ctaBtn, { backgroundColor: theme.text }]} onPress={() => router.push(`/ad-details/${item._id}` as any)}>
                      <Text style={[s.ctaTxt, { color: theme.primary }]}>{item.ctaText || 'Learn More'}</Text>
                    </TouchableOpacity>
                    {item.mediaType === 'video' && (
                      <TouchableOpacity style={s.muteBtn} onPress={() => setMuted(!muted)}>
                        <Ionicons name={muted ? 'volume-mute' : 'volume-high'} size={14} color="#fff" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                {/* Progress Bar (Always at bottom of active card) */}
                {isActive && (
                  <View style={[s.progBar, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
                    <Animated.View style={[s.progFill, { backgroundColor: cat.color }, progressStyle]} />
                  </View>
                )}
              </View>
            </View>
          );
        }}
      />
    </View>
  );
};

const s = StyleSheet.create({
  container: { marginVertical: 12, position: 'relative' },
  slide: { height: '100%', alignItems: 'center', justifyContent: 'center' },
  card: { flex: 1, borderRadius: 28, overflow: 'hidden', borderWidth: 1 },
  
  hud: { ...StyleSheet.absoluteFillObject, padding: 20, justifyContent: 'flex-end' },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  badgeTxt: { fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  sponsor: { paddingHorizontal: 6, paddingVertical: 2, backgroundColor: 'rgba(245,158,11,0.2)', borderRadius: 4 },
  sponsorTxt: { fontSize: 7, fontWeight: '900', color: '#f59e0b' },

  title: { color: '#fff', fontSize: 18, fontWeight: '900', letterSpacing: -0.5, marginBottom: 4 },
  desc: { color: 'rgba(255,255,255,0.7)', fontSize: 11, marginBottom: 16 },
  
  ctaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ctaBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  ctaTxt: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  muteBtn: { width: 32, height: 32, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 10, alignItems: 'center', justifyContent: 'center' },

  progBar: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 3 },
  progFill: { height: '100%' },
  loader: { justifyContent: 'center', alignItems: 'center' }
});