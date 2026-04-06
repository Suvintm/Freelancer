/**
 * UnifiedBanner.tsx
 * React Native port of UnifiedBannerSlider.jsx — feature-for-feature parity.
 */

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from 'react';
import { useTheme } from '../../context/ThemeContext';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Image,
  TouchableOpacity,
  Animated,
  NativeSyntheticEvent,
  NativeScrollEvent,
  AppState,
  AppStateStatus,
} from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import Video from 'react-native-video';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useBannerData } from '../../hooks/useBannerData';

// ─── Dimensions ───────────────────────────────────────────────────────────────
const { width: SW } = Dimensions.get('window');
const BANNER_HEIGHT = (SW - 32) / (16 / 10);
const TICK_MS       = 50;

// Layout Constants for "Slices"
const CARD_MARGIN = 16;
const MULTI_CARD_WIDTH = SW - 32;
const SINGLE_CARD_WIDTH = SW - 32;
const GAP = 12;
const PEEK_PER_CARD = 12; // Bring back the 12px peeks
const STACK_X_OFFSET = 16; // Perfectly centered (16px margin)
const SNAP_DIST = SW;      // Standard full-page snap for simplicity

// ─── URL Repair (exact port from web) ────────────────────────────────────────
const repairUrl = (url?: any): any => {
  if (!url || typeof url !== 'string' || !url.includes('cloudinary')) return url ?? '';
  
  let f = url.replace(/^(https?):?\/*_+/gi, '$1://')
             .replace(/_+res_+cloudinary_+com/g, 'res.cloudinary.com')
             .replace(/res_cloudinary_com/g, 'res.cloudinary.com');

  if (f.includes('res.cloudinary.com')) {
    const uploadIdx = f.indexOf('/upload/');
    if (uploadIdx !== -1) {
      const baseUrl = f.substring(0, uploadIdx + 8);
      let rest = f.substring(uploadIdx + 8);

      // Strip any existing Cloudinary transformation segment first
      // (handles cases where the URL already has transforms from a previous repair)
      const existingTransformPattern = /^[a-z_,]+\/(?=[a-zA-Z0-9])/;
      if (existingTransformPattern.test(rest)) {
        rest = rest.replace(existingTransformPattern, '');
      }

      // Fix mangled extensions
      rest = rest.replace(/_mp4$/i,  '.mp4')
                 .replace(/_jpg$/i,  '.jpg')
                 .replace(/_jpeg$/i, '.jpeg')
                 .replace(/_png$/i,  '.png')
                 .replace(/_webp$/i, '.webp');

      const parts = rest.split('/');

      const pathSegments = parts.filter(p => {
        if (/^v\d+$/.test(p)) return false;
        if (p.includes('_') && /^(q|f|vc|br|c|w|h|so|eo|du|co|bo|ac|fps|an)_/i.test(p)) return false;
        return true;
      });

      // Fix underscores → slashes in path only (not in filename)
      const fileName = pathSegments[pathSegments.length - 1] ?? '';
      const folderSegments = pathSegments
        .slice(0, -1)
        .map(seg => seg.replace(/_+/g, '/'));
      const reconstructedPath = [...folderSegments, fileName].join('/');

      // ✅ FIXED: valid Cloudinary params for Android compatibility
      // - f_mp4:  force MP4 container (Android requires this)
      // - vc_h264: H.264 video codec (universal Android support)
      // - ac_aac:  AAC audio codec  (required for Android MediaCodec)
      // - q_auto: auto quality
      // - w_1080,c_limit: max 1080px wide, don't upscale
      const isVideo = f.includes('/video/') || fileName.match(/\.(mp4|mov|webm|avi|mkv)$/i);
      const opt = isVideo
        ? 'q_auto,f_mp4,vc_h264,ac_aac,w_1080,c_limit'
        : 'q_auto,f_auto,w_1080,c_limit';

      f = `${baseUrl}${opt}/${reconstructedPath}`;
    }
  }

  return f
    .replace(/([^:])\/\/+/g, '$1/')
    .replace(/^http:/, 'https:');
};

// ─── Layout config resolver ───────────────────────────────────────────────────
const resolveLayout = (lc: Record<string, any> = {}) => ({
  textPosition:    lc.textPosition     ?? 'bl',
  overlayDirection:lc.overlayDirection ?? 'to-top',
  overlayOpacity:  lc.overlayOpacity   ?? 75,
  overlayColor:    lc.overlayColor     ?? '#040408',
  titleSize:       lc.titleSize        ?? 'md',
  titleWeight:     lc.titleWeight      ?? 'black',
  titleColor:      lc.titleColor       ?? '#ffffff',
  descColor:       lc.descColor        ?? 'rgba(212,212,216,0.75)',
  showBadge:       lc.showBadge        ?? true,
  showSponsorTag:  lc.showSponsorTag   ?? true,
  showDescription: lc.showDescription  ?? true,
  showProgressBar: lc.showProgressBar  ?? true,
  showDetailsBtn:  lc.showDetailsBtn   ?? true,
  showMuteBtn:     lc.showMuteBtn      ?? true,
  slideDuration:   lc.slideDuration    ?? 5000,
  badgeText:       lc.badgeText        ?? '',
  badgeColor:      lc.badgeColor       ?? 'rgba(255,255,255,0.12)',
});

// ─── Button style resolver ────────────────────────────────────────────────────
const resolveButton = (bs: Record<string, any> = {}) => ({
  variant:      bs.variant      ?? 'filled',
  bgColor:      bs.bgColor      ?? '#ffffff',
  textColor:    bs.textColor    ?? '#000000',
  borderColor:  bs.borderColor  ?? '#ffffff',
  radius:       bs.radius       ?? 'md',
  icon:         bs.icon         ?? 'chevron',
  iconPosition: bs.iconPosition ?? 'right',
});

// ─── Overlay gradient → LinearGradient props ─────────────────────────────────
type GradProp = { colors: string[]; locations?: number[]; start: { x: number; y: number }; end: { x: number; y: number } };

const buildOverlay = (lc: ReturnType<typeof resolveLayout>): GradProp => {
  const toRgba = (hex: string, op: number) => {
    try {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r},${g},${b},${(op / 100).toFixed(2)})`;
    } catch { return `rgba(4,4,8,${(op / 100).toFixed(2)})`; }
  };
  const s = toRgba(lc.overlayColor, lc.overlayOpacity);
  const m = toRgba(lc.overlayColor, Math.round(lc.overlayOpacity * 0.35));
  const t = 'transparent';
  const dirs: Record<string, GradProp> = {
    'to-top':    { colors: [s, m, t], locations: [0, 0.42, 0.75], start: { x: 0, y: 1 }, end: { x: 0, y: 0 } },
    'to-bottom': { colors: [s, t],    locations: [0, 0.75],       start: { x: 0, y: 0 }, end: { x: 0, y: 1 } },
    'to-left':   { colors: [s, t],    locations: [0, 0.75],       start: { x: 1, y: 0 }, end: { x: 0, y: 0 } },
    'to-right':  { colors: [s, t],    locations: [0, 0.75],       start: { x: 0, y: 0 }, end: { x: 1, y: 0 } },
    'radial':    { colors: [t, s],    locations: [0.3, 1],        start: { x: 0.5, y: 0.5 }, end: { x: 0, y: 0 } },
    'none':      { colors: ['transparent', 'transparent'],        start: { x: 0, y: 0 }, end: { x: 0, y: 1 } },
  };
  return dirs[lc.overlayDirection] ?? dirs['to-top'];
};

// ─── Text position → RN flex ──────────────────────────────────────────────────
const textFlex = (pos: string): { justifyContent: any; alignItems: any } =>
  ({
    tl: { justifyContent: 'flex-start', alignItems: 'flex-start' },
    tc: { justifyContent: 'flex-start', alignItems: 'center'     },
    tr: { justifyContent: 'flex-start', alignItems: 'flex-end'   },
    ml: { justifyContent: 'center',     alignItems: 'flex-start' },
    mc: { justifyContent: 'center',     alignItems: 'center'     },
    mr: { justifyContent: 'center',     alignItems: 'flex-end'   },
    bl: { justifyContent: 'flex-end',   alignItems: 'flex-start' },
    bc: { justifyContent: 'flex-end',   alignItems: 'center'     },
    br: { justifyContent: 'flex-end',   alignItems: 'flex-end'   },
  } as any)[pos] ?? { justifyContent: 'flex-end', alignItems: 'flex-start' };

const btnR  = (r: string) => ({ sm: 6, md: 8, lg: 12, full: 999 } as any)[r] ?? 8;
const tSize = (s: string) => ({ sm: 13, md: 16, lg: 20, xl: 24 } as any)[s]  ?? 16;
const tWt   = (w: string) => ({ bold: '700', black: '900', extrabold: '800' } as any)[w] ?? '900';

// ─── Types ────────────────────────────────────────────────────────────────────
interface AdItem {
  _id:            string;
  title:          string;
  description:    string;
  mediaUrl:       any;
  mediaType:      'image' | 'video';
  linkText:       string;
  badge:          string;
  isAd:           boolean;
  layoutConfig:   Record<string, any>;
  buttonStyle:    Record<string, any>;
  buttonLinkType: string;
  buttonLink:     string;
  cardLinkType:   string;
  cardLink:       string;
  thumbnailUrl?:  string;
  isEmptyState?:  boolean;
}
interface Level {
  id:    string;
  label: string;
  color: string;
  icon:  keyof typeof Ionicons.glyphMap;
  items: AdItem[];
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
const BannerSkeleton = React.memo(() => {
  const { theme } = useTheme();
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 900, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [anim]);
  const op = anim.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0.65] });
  return (
    <View style={[sk.wrap, { backgroundColor: theme.secondary, borderColor: theme.border }]}>
      <Animated.View style={[sk.inner, { opacity: op }]}>
        <View style={[sk.badge, { backgroundColor: theme.border }]} />
        <View style={[sk.title, { backgroundColor: theme.border }]} />
        <View style={[sk.desc,  { backgroundColor: theme.border }]} />
        <View style={[sk.btn,   { backgroundColor: theme.border }]} />
      </Animated.View>
    </View>
  );
});
BannerSkeleton.displayName = 'BannerSkeleton';
const sk = StyleSheet.create({
  wrap:  { height: BANNER_HEIGHT, marginHorizontal: 16, borderRadius: 32, backgroundColor: '#18181b', overflow: 'hidden', justifyContent: 'flex-end', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  inner: { padding: 20, gap: 10 },
  badge: { height: 10, width: 56,  backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 99 },
  title: { height: 20, width: 192, backgroundColor: 'rgba(255,255,255,0.10)', borderRadius: 8 },
  desc:  { height: 14, width: 240, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 8 },
  btn:   { height: 32, width: 112, backgroundColor: 'rgba(255,255,255,0.10)', borderRadius: 12, marginTop: 4 },
});

// ─── Memoised video (using react-native-video for elite production performance) ───
const BannerVideo = React.memo(({ source, muted, onPlaySuccess, onPlayError }: { 
  source: any; 
  muted: boolean;
  onPlaySuccess?: () => void;
  onPlayError?: () => void;
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  return (
    <Animated.View style={[StyleSheet.absoluteFill, { opacity: fadeAnim }]}>
      <Video
        source={(typeof source === 'number' ? source : { uri: source }) as any}
        style={StyleSheet.absoluteFill}
        muted={muted}
        repeat={true}
        resizeMode="cover"
        shutterColor="transparent"
        playInBackground={false}
        playWhenInactive={false}
        onReadyForDisplay={() => {
          Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
          onPlaySuccess?.();
        }}
        onError={(err) => {
          console.error(`🎥 [VIDEO_ERROR_RNV] Result: ${source} — ${JSON.stringify(err)}`);
          onPlayError?.();
        }}
      />
    </Animated.View>
  );
});
BannerVideo.displayName = 'BannerVideo';

// Sub-component to safely use the video player for preloading
const VideoPreloader = React.memo(({ url }: { url: any }) => {
  return (
    <Video
      source={(typeof url === 'number' ? url : { uri: url }) as any}
      style={{ width: 1, height: 1, opacity: 0 }}
      paused={true}
      muted={true}
    />
  );
});
VideoPreloader.displayName = 'VideoPreloader';

// ─── Preloader component to safely use hooks for the "next" item ──────────────
const BannerPreloader = React.memo(({ item }: { item: AdItem }) => {
  const url = repairUrl(item.mediaUrl);
  if (item.mediaType === 'video') {
    return <VideoPreloader url={url} />;
  }
  return <Image source={{ uri: url }} style={{ width: 1, height: 1 }} />;
});
BannerPreloader.displayName = 'BannerPreloader';

interface UnifiedBannerProps {
  pageName?: 'home' | 'editors' | 'gigs' | 'jobs' | 'explore';
}

export const UnifiedBanner = ({ pageName = 'home' }: UnifiedBannerProps) => {
  const { theme, isDarkMode } = useTheme();
  const router      = useRouter();

  const [vIdx, setVIdx]       = useState(0);          // vertical (level) index
  const [hMap, setHMap]       = useState<number[]>(new Array(10).fill(0)); // hIdx per level
  const [videoFailures, setVideoFailures] = useState<Record<string, boolean>>({}); // tracking errors
  const [muted, setMuted]     = useState(true);
  const [progress, setProgress] = useState(0);
  const [appActive, setAppActive] = useState(true);

  const vRef  = useRef(0);
  const hRef  = useRef(0);
  vRef.current = vIdx;

  const scrollRef = useRef<ScrollView>(null);
  const scrollX   = useRef(new Animated.Value(0)).current;
  const tickRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const fadeAnim  = useRef(new Animated.Value(1)).current;

  // AppState
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s: AppStateStatus) => setAppActive(s === 'active'));
    return () => sub.remove();
  }, []);

  // Fetch ads using unified hook
  const { data: adsData, isLoading } = useBannerData(pageName);

  // Build levels
  const levels: Level[] = useMemo(() => {
    const all = adsData || [];
    const fmt = (ad: any): AdItem => ({
      _id:            ad._id,
      title:          ad.title ?? '',
      description:    ad.description || ad.tagline || '',
      mediaUrl:       repairUrl(ad.mediaUrl),
      thumbnailUrl:   ad.thumbnailUrl ? repairUrl(ad.thumbnailUrl) : '',
      mediaType:      (ad.mediaType?.toLowerCase() || 'image') as 'image' | 'video',
      linkText:       ad.ctaText    || 'Learn More',
      badge:          ad.badge      || 'SPONSOR',
      isAd:           true,
      layoutConfig:   ad.layoutConfig   ?? {},
      buttonStyle:    ad.buttonStyle    ?? {},
      buttonLinkType: ad.buttonLinkType || 'ad_details',
      buttonLink:     ad.buttonLink     || '',
      cardLinkType:   ad.cardLinkType   || 'none',
      cardLink:       ad.cardLink       || '',
    });
    const result: Level[] = [];

    const l0 = all.filter((a: any) => a.displayLocations?.some((l: string) =>
      ['banners:home_0','banners:editors','banners:gigs','banners:jobs','banners:explore',
       'banners_home_0','banners_editors','banners_gigs','banners_jobs',
       'home_banner_0','editors_banner','gigs_banner','jobs_banner','home_banner'].includes(l)
    )).map(fmt);
    if (l0.length) result.push({ id: 'l0', label: 'HOME BANNER',  color: '#f59e0b', icon: 'megaphone-outline', items: l0 });

    const l1 = all.filter((a: any) => a.displayLocations?.some((l: string) =>
      ['banners:home_1','banners_home_1','home_banner_1'].includes(l)
    )).map(fmt);
    if (l1.length) result.push({ id: 'l1', label: 'SPARKS',       color: '#a78bfa', icon: 'sparkles-outline',  items: l1 });

    const l2 = all.filter((a: any) => a.displayLocations?.some((l: string) =>
      ['banners:home_2','banners_home_2','home_banner_2'].includes(l)
    )).map(fmt);
    if (l2.length) result.push({ id: 'l2', label: 'EXPLORE',      color: '#34d399', icon: 'film-outline',      items: l2 });

    if (!result.length)
      result.push({ id: 'empty', label: '', color: '#71717a', icon: 'megaphone-outline', items: [{ _id: 'e', isEmptyState: true } as AdItem] });

    return result;
  }, [adsData]);

  useEffect(() => { if (vIdx >= levels.length) setVIdx(0); }, [levels.length, vIdx]);

  const level  = levels[vIdx] ?? levels[0];
  const hIdx   = hMap[vIdx]  ?? 0;
  hRef.current = hIdx;
  const item   = level?.items[hIdx];

  const lc          = useMemo(() => resolveLayout(item?.layoutConfig), [item]);
  const DURATION_MS = lc.slideDuration;

  const displayLabel = useMemo(() =>
    pageName === 'editors' ? 'EXPLORE EDITOR BANNER' :
    pageName === 'gigs'    ? 'GIG BANNER' :
    pageName === 'jobs'    ? 'JOB BANNER' : level?.label ?? '',
  [pageName, level]);

  const advance = useCallback(() => {
    const lvl    = levels[vRef.current];
    if (!lvl) return;
    const isLast = hRef.current >= lvl.items.length - 1;
    if (isLast) {
      const next = (vRef.current + 1) % levels.length;
      Animated.timing(fadeAnim, { toValue: 0, duration: 220, useNativeDriver: true }).start(() => {
        setVIdx(next);
        setHMap(p => { const n = [...p]; n[next] = 0; return n; });
        setProgress(0);
        scrollRef.current?.scrollTo({ x: 0, animated: false });
        Animated.timing(fadeAnim, { toValue: 1, duration: 220, useNativeDriver: true }).start();
      });
    } else {
      const nextH = hRef.current + 1;
      const isMulti = level.items.length > 1;
      const snapDist = isMulti ? SNAP_DIST : SW;
      
      setHMap(p => { const n = [...p]; n[vRef.current] = nextH; return n; });
      scrollRef.current?.scrollTo({ x: nextH * snapDist, animated: true });
      setProgress(0);
    }
  }, [levels, fadeAnim]);

  useEffect(() => {
    clearInterval(tickRef.current!);
    if (!appActive || !item || item.isEmptyState || item.mediaType === 'video') {
      setProgress(0); return;
    }
    setProgress(0);
    tickRef.current = setInterval(() => {
      setProgress(p => { if (p >= 100) { advance(); return 0; } return p + (TICK_MS / DURATION_MS) * 100; });
    }, TICK_MS);
    return () => clearInterval(tickRef.current!);
  }, [appActive, vIdx, hIdx, advance, item, DURATION_MS]);

  useEffect(() => {
    if (!appActive || !item || item.mediaType !== 'video') return;
    const t = setTimeout(advance, DURATION_MS);
    return () => clearTimeout(t);
  }, [appActive, item, advance, DURATION_MS]);

  useEffect(() => { scrollRef.current?.scrollTo({ x: 0, animated: false }); }, [vIdx]);

  const goTo = useCallback((v: number, h: number) => {
    if (v !== vRef.current) {
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
        setVIdx(v);
        setHMap(p => { const n = [...p]; n[v] = h; return n; });
        setProgress(0);
        scrollRef.current?.scrollTo({ x: 0, animated: false });
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
      });
    } else {
      const isMulti = levels[v].items.length > 1;
      const snapDist = isMulti ? SNAP_DIST : SW;

      setHMap(p => { const n = [...p]; n[v] = h; return n; });
      scrollRef.current?.scrollTo({ x: h * snapDist, animated: true });
      setProgress(0);
    }
  }, [fadeAnim, levels]);

  const onScrollEnd = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const isMulti = levels[vRef.current]?.items.length > 1;
    const snapDist = isMulti ? SNAP_DIST : SW;
    
    const idx = Math.round(e.nativeEvent.contentOffset.x / snapDist);
    const clamped = Math.max(0, Math.min(idx, (levels[vRef.current]?.items.length ?? 1) - 1));
    if (clamped === hRef.current) return;
    setHMap(p => { const n = [...p]; n[vRef.current] = clamped; return n; });
    setProgress(0);
  }, [levels]);

  const handleCardPress = useCallback(() => {
    if (!item || item.cardLinkType === 'none') return;
    if (item.cardLinkType === 'internal' && item.cardLink) router.push(item.cardLink as any);
  }, [item, router]);

  const handleCTAPress = useCallback((ad: AdItem) => {
    if (ad.buttonLinkType === 'ad_details')             { router.push(`/ad-details/${ad._id}` as any); return; }
    if (ad.buttonLinkType === 'internal' && ad.buttonLink) { router.push(ad.buttonLink as any); return; }
  }, [router]);

  if (isLoading && !adsData) return <BannerSkeleton />;
  if (!item)                  return null;

  return (
    <View style={s.container}>
      <Animated.View style={[s.wrapper, { opacity: fadeAnim }]}>
        <Animated.ScrollView
          ref={scrollRef as any}
          horizontal
          pagingEnabled={level.items.length === 1}
          snapToInterval={level.items.length > 1 ? SNAP_DIST : undefined}
          snapToAlignment="start"
          decelerationRate="fast"
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          onMomentumScrollEnd={onScrollEnd}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: true }
          )}
          bounces={false}
          contentContainerStyle={{
            paddingHorizontal: 0,
            alignItems: 'center'
          }}
        >
          {levels.map((lvl, vI) => (
            <View key={lvl.id} style={{ flexDirection: 'row' }}>
              {vIdx === vI && lvl.items.map((ad, hI) => {
                const ilc   = resolveLayout(ad.layoutConfig);
                const ibs   = resolveButton(ad.buttonStyle);
                const ovl   = buildOverlay(ilc);
                const flex  = textFlex(ilc.textPosition);
                const align: any = flex.alignItems === 'flex-end' ? 'right' : flex.alignItems === 'center' ? 'center' : 'left';
                const isActive = hI === hMap[vIdx];

                const isMulti = lvl.items.length > 1;
                const snapDist = isMulti ? SNAP_DIST : SW;

                const cardStackPos = STACK_X_OFFSET + (hI * PEEK_PER_CARD);

                const translateX = scrollX.interpolate({
                  inputRange: [
                    (hI - 1) * snapDist,
                    hI * snapDist,
                    (hI + 1) * snapDist,
                  ],
                  outputRange: [
                    (SW - hI * snapDist - 44), // PIN TO RIGHT (Next Peek)
                    0,                         // CENTER FOCUS
                    (snapDist - 12),           // PIN TO LEFT (Prev Peek)
                  ],
                  extrapolate: 'clamp',
                });

                const scale = scrollX.interpolate({
                  inputRange: [
                    (hI - 1) * snapDist,
                    hI * snapDist,
                    (hI + 1) * snapDist,
                  ],
                  outputRange: [0.92, 1, 0.92],
                  extrapolate: 'clamp',
                });

                const opacity = scrollX.interpolate({
                  inputRange: [
                    (hI - 1) * snapDist,
                    hI * snapDist,
                    (hI + 1) * snapDist,
                  ],
                  outputRange: [0.6, 1, 0.6],
                  extrapolate: 'clamp',
                });

                return (
                  <Animated.View 
                    key={ad._id} 
                    style={[
                      s.slide, 
                      { 
                        width: isMulti ? snapDist : SW,
                        zIndex: (hI === hMap[vIdx]) ? 100 : 50,
                      },
                      isMulti ? {
                        transform: [{ scale }, { translateX }],
                        opacity,
                        paddingHorizontal: 16,
                      } : {
                        paddingHorizontal: 16,
                      }
                    ]}
                  >
                    <View style={[
                      s.card, 
                      { 
                        backgroundColor: theme.secondary, 
                        borderColor: theme.border,
                        width: isMulti ? MULTI_CARD_WIDTH : '100%' 
                      }
                    ]}>
                      {ad.isEmptyState ? (
                        <View style={s.emptyWrap}>
                          <Text style={s.emptyTxt}>No ads or banners</Text>
                        </View>
                      ) : (
                        <>
                          <TouchableOpacity activeOpacity={1} style={StyleSheet.absoluteFill} onPress={handleCardPress}>
                            {/* Always render Thumbnail first to avoid flashes */}
                            {(ad.thumbnailUrl || (ad.mediaType === 'image' && ad.mediaUrl)) && (
                              <Image source={{ uri: ad.thumbnailUrl || ad.mediaUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                            )}
                            
                            {/* Video Layer: Smooth fade-on-ready, Silent fallback-on-error */}
                            {ad.mediaType === 'video' && isActive && !videoFailures[ad._id] && (
                              <BannerVideo 
                                source={ad.mediaUrl} 
                                muted={muted} 
                                onPlayError={() => setVideoFailures(p => ({ ...p, [ad._id]: true }))}
                              />
                            )}
                          </TouchableOpacity>

                          <LinearGradient
                            colors={ovl.colors as any}
                            start={ovl.start}
                            end={ovl.end}
                            locations={ovl.locations as any}
                            style={StyleSheet.absoluteFill}
                            pointerEvents="none"
                          />

                          <View style={[s.hud, flex]} pointerEvents="box-none">
                            <View style={s.hudInner}>
                              {ilc.showBadge && (
                                <View style={s.badgeRow}>
                                  <View style={[s.badge, { backgroundColor: ilc.badgeColor }]}>
                                    <Ionicons name={level.icon} size={9} color={level.color} />
                                    <Text style={s.badgeTxt}>
                                      {(ilc.badgeText || ad.badge || displayLabel).toUpperCase()}
                                    </Text>
                                  </View>
                                  {ad.isAd && ilc.showSponsorTag && (
                                    <View style={s.sponsor}><Text style={s.sponsorTxt}>SPONSOR</Text></View>
                                  )}
                                </View>
                              )}

                              <Text numberOfLines={2} style={[s.title, { fontSize: tSize(ilc.titleSize), fontWeight: tWt(ilc.titleWeight), color: ilc.titleColor, textAlign: align }]}>
                                {ad.title}
                              </Text>

                              {ilc.showDescription && (
                                <Text numberOfLines={1} style={[s.desc, { color: ilc.descColor }]}>
                                  {ad.description}
                                </Text>
                              )}

                              <View style={s.ctaRow}>
                                <TouchableOpacity
                                  style={[s.ctaBtn, { borderRadius: btnR(ibs.radius), backgroundColor: ibs.variant === 'filled' ? ibs.bgColor : ibs.variant === 'ghost' ? 'rgba(255,255,255,0.1)' : 'transparent', borderWidth: ibs.variant === 'outline' ? 1.5 : 0, borderColor: ibs.variant === 'outline' ? ibs.borderColor : undefined }]}
                                  onPress={() => handleCTAPress(ad)}
                                  activeOpacity={0.8}
                                >
                                  {ibs.iconPosition === 'left' && <Ionicons name="chevron-forward" size={10} color={ibs.variant === 'filled' ? ibs.textColor : ibs.variant === 'outline' ? ibs.borderColor : '#fff'} />}
                                  <Text style={[s.ctaTxt, { color: ibs.variant === 'filled' ? ibs.textColor : ibs.variant === 'outline' ? ibs.borderColor : '#fff' }]}>{ad.linkText}</Text>
                                  {ibs.iconPosition !== 'left' && <Ionicons name="chevron-forward" size={10} color={ibs.variant === 'filled' ? ibs.textColor : ibs.variant === 'outline' ? ibs.borderColor : '#fff'} />}
                                </TouchableOpacity>

                                {ad.isAd && ilc.showDetailsBtn && (
                                  <TouchableOpacity style={s.detailsBtn} onPress={() => router.push(`/ad-details/${ad._id}` as any)} activeOpacity={0.8}>
                                    <Text style={s.detailsTxt}>Details</Text>
                                    <Ionicons name="arrow-forward" size={10} color="#fff" />
                                  </TouchableOpacity>
                                )}

                                {ad.isAd && ilc.showMuteBtn && ad.mediaType === 'video' && (
                                  <TouchableOpacity style={s.muteBtn} onPress={() => setMuted(v => !v)} activeOpacity={0.8}>
                                    <Ionicons name={muted ? 'volume-mute' : 'volume-high'} size={14} color="#fff" />
                                  </TouchableOpacity>
                                )}
                              </View>
                            </View>
                          </View>
                        </>
                      )}
                    </View>
                  </Animated.View>
                );
              })}
            </View>
          ))}
        </Animated.ScrollView>

        {!item.isEmptyState && lc.showProgressBar && (
          <View 
            style={[
              s.progBg, 
              { 
                backgroundColor: theme.border,
                width: level.items.length > 1 ? MULTI_CARD_WIDTH : SINGLE_CARD_WIDTH,
                left: level.items.length > 1 ? CARD_MARGIN : 16,
              }
            ]} 
            pointerEvents="none"
          >
            <View style={[s.progFill, { backgroundColor: theme.accent, width: `${progress}%` as any }]} />
          </View>
        )}

        {/* ISOLATION: Preloader disabled for debugging */}
        {/*
        <View style={{ width: 0, height: 0, opacity: 0, position: 'absolute' }} pointerEvents="none" aria-hidden={true}>
          {(() => {
            const items = levels[vIdx]?.items;
            if (!items || items.length <= 1) return null;
            const nextIdx = (hMap[vIdx] + 1) % items.length;
            const nextItem = items[nextIdx];
            if (!nextItem || nextItem.isEmptyState || !nextItem.mediaUrl) return null;
            return <BannerPreloader key={nextItem._id} item={nextItem} />;
          })()}
        </View>
        */}
      </Animated.View>

      {!item.isEmptyState && level.items.length > 1 && (
        <View style={s.dots}>
          {level.items.map((_, i) => (
            <TouchableOpacity key={i} onPress={() => goTo(vIdx, i)} hitSlop={8}>
              <View style={[s.dot, { width: i === hIdx ? 18 : 5, backgroundColor: i === hIdx ? theme.accent : theme.textSecondary, opacity: i === hIdx ? 1 : 0.4 }]} />
            </TouchableOpacity>
          ))}
        </View>
      )}

      {!item.isEmptyState && levels.length > 1 && (
        <View style={[s.sidebar, { backgroundColor: isDarkMode ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.4)', borderColor: theme.border }]}>
          {levels.map((lvl, i) => {
            const active = vIdx === i;
            return (
              <TouchableOpacity key={lvl.id} onPress={() => goTo(i, 0)} style={[s.sideBtn, active && { backgroundColor: theme.accent }]} activeOpacity={0.7}>
                <Ionicons name={lvl.icon} size={11} color={active ? theme.primary : lvl.color} />
                {active && <View style={[s.sideGlow, { backgroundColor: theme.accent, opacity: 0.2 }]} />}
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
};

const s = StyleSheet.create({
  container: { marginVertical: 12, height: BANNER_HEIGHT, position: 'relative' },
  wrapper:   { width: '100%', height: BANNER_HEIGHT },

  slide: { height: BANNER_HEIGHT, justifyContent: 'center' },
  card:  {
    flex: 1, borderRadius: 32, overflow: 'hidden',
    backgroundColor: '#09090b', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.5, shadowRadius: 24, elevation: 12,
  },

  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(39,39,42,0.4)' },
  emptyTxt:  { color: '#71717a', fontSize: 14, fontWeight: '500' },

  hud:      { ...StyleSheet.absoluteFillObject, padding: 16, paddingBottom: 14, flexDirection: 'column' },
  hudInner: { maxWidth: '85%', gap: 4 },

  badgeRow:   { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  badge:      { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  badgeTxt:   { fontSize: 7.5, fontWeight: '900', letterSpacing: 1.6, color: '#fff', textTransform: 'uppercase' },
  sponsor:    { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, backgroundColor: 'rgba(245,158,11,0.85)' },
  sponsorTxt: { fontSize: 6.5, fontWeight: '900', color: '#fff', textTransform: 'uppercase' },

  title: { letterSpacing: -0.3, marginBottom: 2, maxWidth: '80%', textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 8 },
  desc:  { fontSize: 9.5, fontWeight: '500', lineHeight: 14, marginBottom: 8, maxWidth: '72%' },

  ctaRow:     { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ctaBtn:     { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 6 },
  ctaTxt:     { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  detailsBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  detailsTxt: { fontSize: 9, fontWeight: '700', color: '#fff' },
  muteBtn:    { width: 28, height: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },

  progBg:   { position: 'absolute', bottom: 0, height: 2, backgroundColor: 'rgba(255,255,255,0.08)', borderBottomLeftRadius: 32, borderBottomRightRadius: 32, overflow: 'hidden' },
  progFill: { height: '100%', backgroundColor: 'rgba(255,255,255,0.6)' },

  dots: { position: 'absolute', top: 16, right: 52, flexDirection: 'row', alignItems: 'center', gap: 6, zIndex: 30 },
  dot:  { height: 5, borderRadius: 99 },

  sidebar:      { position: 'absolute', right: 28, top: '50%', transform: [{ translateY: -44 }], backgroundColor: 'rgba(0,0,0,0.45)', paddingVertical: 8, paddingHorizontal: 6, borderRadius: 16, gap: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', zIndex: 30, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 },
  sideBtn:      { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' },
  sideBtnActive:{ backgroundColor: '#ffffff', shadowColor: '#fff', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.15, shadowRadius: 8 },
  sideGlow:     { ...StyleSheet.absoluteFillObject, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.12)' },
});