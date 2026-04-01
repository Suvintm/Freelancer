import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Dimensions, 
  Image, 
  TouchableOpacity,
  FlatList,
  NativeSyntheticEvent,
  NativeScrollEvent
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { Colors } from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';

const { width } = Dimensions.get('window');
const ASPECT_RATIO = 16 / 10;
const BANNER_HEIGHT = (width - 32) / ASPECT_RATIO;

// ─── STATIC PRO ASSETS (With Posters to avoid black screening) ───────────────
const LEVELS = [
  {
    id: 0,
    label: 'FEATURED',
    color: '#FFF',
    items: [
      { 
        id: 'f1', 
        title: 'Elite Workspace', 
        desc: 'Transform your vision with local experts.', 
        type: 'video', 
        media: 'https://cdn.pixabay.com/video/2019/04/13/22758-330689456_large.mp4',
        poster: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=1200' 
      },
      { 
        id: 'f2', 
        title: 'Global SuviX', 
        desc: 'Secure payments, global delivery.', 
        type: 'video', 
        media: 'https://cdn.pixabay.com/video/2020/03/15/33580-397227441_large.mp4',
        poster: 'https://images.unsplash.com/photo-1550439062-609e1531270e?q=80&w=1200' 
      }
    ]
  },
  {
    id: 1,
    label: 'SPARKS',
    color: '#00F0FF',
    items: [
      { 
        id: 's1', 
        title: 'Neon Sparks v2', 
        desc: 'New editing tools just landed.', 
        type: 'video', 
        media: 'https://cdn.pixabay.com/video/2021/08/17/85375-589578160_large.mp4',
        poster: 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1200' 
      },
      { 
        id: 's2', 
        title: 'AI Automation', 
        desc: 'Scale faster than ever before.', 
        type: 'video', 
        media: 'https://cdn.pixabay.com/video/2023/11/05/187851-881268677_large.mp4',
        poster: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1200' 
      }
    ]
  },
  {
    id: 2,
    label: 'EXPLORE',
    color: '#FFF',
    items: [
      { 
        id: 'e1', 
        title: 'Explore Gigs', 
        desc: 'Discover thousands of services.', 
        type: 'video', 
        media: 'https://cdn.pixabay.com/video/2021/04/12/70860-537402685_large.mp4',
        poster: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=1200' 
      },
      { 
        id: 'e2', 
        title: 'Learn Skills', 
        desc: 'Master new tools with SuviX.', 
        type: 'video', 
        media: 'https://cdn.pixabay.com/video/2023/05/16/163273-827616654_large.mp4',
        poster: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1200' 
      }
    ]
  }
];

interface FlatSlide {
  id: string;
  media: string;
  poster?: string;
  type: 'video' | 'image';
  title: string;
  desc: string;
  levelId: number;
  levelLabel: string;
  levelColor: string;
}

interface UnifiedBannerProps {
  pageName?: 'home' | 'editors' | 'gigs' | 'jobs' | 'explore';
}

export const UnifiedBanner = ({ pageName = 'home' }: UnifiedBannerProps) => {
  const { isDarkMode } = useTheme();
  const palette = isDarkMode ? Colors.dark : Colors.light;

  // Flatten slides with full typing
  const ALL_SLIDES: FlatSlide[] = LEVELS.flatMap(lvl => 
    lvl.items.map(item => ({ 
        ...(item as any), 
        levelId: lvl.id, 
        levelLabel: lvl.label, 
        levelColor: lvl.color 
    }))
  );

  const [activeIndex, setActiveIndex] = React.useState(0);
  const flatListRef = React.useRef<FlatList<FlatSlide>>(null);

  const currentSlide = ALL_SLIDES[activeIndex];
  
  // ─── LEVEL-SPECIFIC DOT CALCULATION ────────────────────────────────────────
  const levelItems = LEVELS.find(l => l.id === currentSlide.levelId)?.items || [];
  const firstIndexInLevel = ALL_SLIDES.findIndex(s => s.levelId === currentSlide.levelId);
  const relativeIndex = activeIndex - firstIndexInLevel;

  // ─── AUTO LOOP LOGIC ───────────────────────────────────────────────────────
  React.useEffect(() => {
    const timer = setInterval(() => {
        advance();
    }, 8000); // Slower for video clarity
    return () => clearInterval(timer);
  }, [activeIndex]);

  const advance = () => {
    const nextIdx = (activeIndex + 1) % ALL_SLIDES.length;
    goTo(nextIdx);
  };

  const goTo = (index: number) => {
    setActiveIndex(index);
    flatListRef.current?.scrollToIndex({ index, animated: true });
  };

  const goToLevel = (lvlId: number) => {
    const targetIdx = ALL_SLIDES.findIndex(s => s.levelId === lvlId);
    if (targetIdx !== -1) goTo(targetIdx);
  };

  const onMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const viewSize = event.nativeEvent.layoutMeasurement.width;
    const index = Math.round(contentOffset / viewSize);
    if (index !== activeIndex && index < ALL_SLIDES.length) setActiveIndex(index);
  };

  return (
    <View 
        style={styles.container}
        // GESTURE SHIELD: Intercept all horizontal touches in the banner zone
        onStartShouldSetResponderCapture={() => true}
        onMoveShouldSetResponderCapture={(ev) => Math.abs(ev.nativeEvent.pageX) > 10}
    >
      <FlatList
        ref={flatListRef}
        data={ALL_SLIDES}
        horizontal
        pagingEnabled
        nestedScrollEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumScrollEnd}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
            <View style={styles.slide}>
                <View style={[styles.card, { backgroundColor: palette.secondary, borderColor: palette.border }]}>
                    
                    {/* MEDIA ENGINE 2.0 (High Precision Visibility) */}
                    {item.type === 'video' ? (
                        <Video
                            source={{ uri: item.media }}
                            style={styles.media}
                            resizeMode={ResizeMode.COVER}
                            shouldPlay={true}
                            isLooping={true}
                            isMuted={true}
                            useNativeControls={false}
                            posterSource={{ uri: item.poster }}
                            usePoster={true}
                            posterStyle={styles.media}
                        />
                    ) : (
                        <Image source={{ uri: item.media }} style={styles.media} resizeMode="cover" />
                    )}

                    <LinearGradient colors={['transparent', 'rgba(0,0,0,0.85)']} style={styles.overlay} />

                    <View style={styles.hud}>
                        <View style={[styles.badge, { backgroundColor: item.levelColor + '22', borderColor: item.levelColor + '44' }]}>
                            <Text style={[styles.badgeTxt, { color: '#FFF' }]}>{item.levelLabel}</Text>
                        </View>
                        <Text style={styles.title}>{item.title}</Text>
                        <Text style={styles.desc}>{item.desc}</Text>
                        
                        <TouchableOpacity style={styles.cta}>
                            <Text style={styles.ctaTxt}>LEARN MORE</Text>
                            <Ionicons name="arrow-forward" size={14} color="#000" />
                        </TouchableOpacity>
                    </View>

                    {/* LEVEL-SPECIFIC DOT INDICATORS */}
                    <View style={styles.dots}>
                        {levelItems.map((_, i) => (
                            <View key={i} style={[styles.dot, { backgroundColor: i === relativeIndex ? '#FFF' : 'rgba(255,255,255,0.3)', width: i === relativeIndex ? 16 : 6 }]} />
                        ))}
                    </View>
                </View>
            </View>
        )}
      />

      {/* VERTICAL SIDEBAR SWITCHER (Syncs with flattened levels) */}
      <View style={styles.sidebar}>
        {LEVELS.map((lvl) => {
            const active = currentSlide.levelId === lvl.id;
            return (
                <TouchableOpacity 
                    key={lvl.id} 
                    onPress={() => goToLevel(lvl.id)}
                    style={[styles.sideItem, active && styles.sideActive]}
                >
                    <Ionicons 
                        name={lvl.id === 0 ? "flash" : lvl.id === 1 ? "sparkles" : "film"} 
                        size={12} 
                        color={active ? "#000" : lvl.color} 
                    />
                </TouchableOpacity>
            );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 0, 
    marginVertical: 12,
    position: 'relative',
    height: BANNER_HEIGHT,
  },
  slide: {
    width: width,
    paddingHorizontal: 16, // RESTORING FLOATING CARD LOOK
    height: BANNER_HEIGHT,
  },
  card: {
    flex: 1,
    borderRadius: 32, // WEB-PERFECT 2REM ROUNDED EDGES
    overflow: 'hidden',
    borderWidth: 1,
    position: 'relative',
  },
  media: { width: '100%', height: '100%', position: 'absolute' },
  overlay: { position: 'absolute', inset: 0 },
  hud: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20 },
  badge: { 
    alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, 
    borderRadius: 6, borderWidth: 1, marginBottom: 8 
  },
  badgeTxt: { fontSize: 8, fontWeight: '900', letterSpacing: 1.5 },
  title: { color: '#FFF', fontSize: 20, fontWeight: '900', marginBottom: 4 },
  desc: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginBottom: 12 },
  cta: { 
    flexDirection: 'row', alignItems: 'center', gap: 6, 
    backgroundColor: '#FFF', paddingHorizontal: 14, paddingVertical: 8, 
    borderRadius: 12, alignSelf: 'flex-start' 
  },
  ctaTxt: { fontSize: 10, fontWeight: '900', color: '#000' },
  dots: { position: 'absolute', bottom: 20, right: 20, flexDirection: 'row', gap: 4 },
  dot: { height: 6, borderRadius: 3 },
  sidebar: {
    position: 'absolute',
    right: 32,
    top: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 6,
    borderRadius: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    zIndex: 100,
  },
  sideItem: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  sideActive: { backgroundColor: '#FFF' }
});
