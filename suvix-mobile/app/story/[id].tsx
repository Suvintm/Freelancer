import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Dimensions, 
  Image, 
  TouchableOpacity, 
  Platform, 
  StatusBar,
  Pressable
} from 'react-native';
import PagerView from 'react-native-pager-view';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useStories, StoryItem } from '../../src/hooks/useStories';

const { width: SW, height: SH } = Dimensions.get('window');

/**
 * PRODUCTION-GRADE IMMERSIVE STORY ENGINE
 * Handles multi-user PagerView and interactive multi-slide navigation.
 */
export default function StoryEngineScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { data: allStories } = useStories();
  const pagerRef = useRef<PagerView>(null);

  // 1. Determine Initial Page based on ID
  const initialPageIndex = useMemo(() => {
    const idx = allStories.findIndex(s => s._id === id);
    return idx !== -1 ? idx : 0;
  }, [id, allStories]);

  const [currentPage, setCurrentPage] = useState(initialPageIndex);

  return (
    <View style={s.container}>
      <StatusBar hidden />
      
      <PagerView
        ref={pagerRef}
        style={s.pager}
        initialPage={initialPageIndex}
        onPageSelected={(e) => setCurrentPage(e.nativeEvent.position)}
      >
        {allStories.map((story, index) => (
          <View key={story._id} style={s.page}>
            <StoryThread 
              story={story} 
              isActive={index === currentPage}
              onClose={() => router.back()}
              onNextUser={() => {
                if (index < allStories.length - 1) {
                    pagerRef.current?.setPage(index + 1);
                } else {
                    router.back();
                }
              }}
              onPrevUser={() => {
                if (index > 0) {
                    pagerRef.current?.setPage(index - 1);
                }
              }}
            />
          </View>
        ))}
      </PagerView>
    </View>
  );
}

/**
 * Individual User Story Thread Component
 */
function StoryThread({ 
  story, 
  isActive, 
  onClose, 
  onNextUser, 
  onPrevUser 
}: { 
  story: StoryItem, 
  isActive: boolean,
  onClose: () => void,
  onNextUser: () => void,
  onPrevUser: () => void
}) {
  const [slideIndex, setSlideIndex] = useState(0);
  const slides = story.slides;
  const currentSlide = slides[slideIndex];
  const router = useRouter();

  // Reset slide index if user swipes away and back
  useEffect(() => {
    if (!isActive) {
        setSlideIndex(0);
    }
  }, [isActive]);

  const handleNext = () => {
    if (slideIndex < slides.length - 1) {
      setSlideIndex(prev => prev + 1);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      onNextUser();
    }
  };

  const handlePrev = () => {
    if (slideIndex > 0) {
      setSlideIndex(prev => prev - 1);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      onPrevUser();
    }
  };

  const handleAddMore = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/story/create');
  };

  return (
    <View style={s.threadContainer}>
      {/* ─── MEDIA CONTENT ─── */}
      <Image 
        source={{ uri: currentSlide.image }} 
        style={StyleSheet.absoluteFill} 
        resizeMode="cover" 
      />

      <LinearGradient
        colors={['rgba(0,0,0,0.6)', 'transparent', 'rgba(0,0,0,0.8)']}
        style={StyleSheet.absoluteFill}
      />

      {/* ─── GESTURE REGIONS ─── */}
      <View style={s.gestureLayer}>
        <Pressable style={s.halfRegion} onPress={handlePrev} />
        <Pressable style={s.halfRegion} onPress={handleNext} />
      </View>

      {/* ─── HEADER ─── */}
      <View style={s.header}>
        {/* Progress Indicators */}
        <View style={s.progressContainer}>
           {slides.map((_, i) => (
             <View key={i} style={s.progressBarTrack}>
                <View 
                  style={[
                    s.progressBarLevel, 
                    { width: i < slideIndex ? '100%' : i === slideIndex ? '100%' : '0%' }
                  ]} 
                />
             </View>
           ))}
        </View>

        <View style={s.userInfoRow}>
          <View style={s.userMeta}>
            <Image source={{ uri: story.avatar }} style={s.miniAvatar} />
            <View>
              <Text style={s.username}>{story.username}</Text>
              <Text style={s.timestamp}>2h ago</Text>
            </View>
          </View>
          <TouchableOpacity onPress={onClose} style={s.closeBtn}>
             <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ─── CAPTION ─── */}
      {currentSlide.caption && (
        <View style={s.captionWrapper} pointerEvents="none">
           <Text style={s.caption}>{currentSlide.caption}</Text>
        </View>
      )}

      {/* ─── FOOTER (Only for current user story) ─── */}
      {story.isUserStory && (
        <View style={s.footer}>
           <TouchableOpacity style={s.addBtn} onPress={handleAddMore}>
              <View style={s.plusCircle}>
                <Ionicons name="add" size={18} color="#fff" />
              </View>
              <Text style={s.addLabel}>Add Post</Text>
           </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  pager: { flex: 1 },
  page: { flex: 1 },
  threadContainer: { flex: 1 },

  gestureLayer: { ...StyleSheet.absoluteFillObject, flexDirection: 'row', zIndex: 5 },
  halfRegion: { flex: 1 },

  header: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 44 : 24,
    width: '100%',
    paddingHorizontal: 16,
    zIndex: 10,
  },
  progressContainer: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 16,
    width: '100%',
  },
  progressBarTrack: {
    height: 2,
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 1,
    overflow: 'hidden',
  },
  progressBarLevel: {
    height: '100%',
    backgroundColor: '#fff',
  },

  userInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userMeta: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  miniAvatar: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: '#fff' },
  username: { color: '#fff', fontSize: 13, fontWeight: '800' },
  timestamp: { color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: '600' },
  closeBtn: { padding: 4 },

  captionWrapper: {
    position: 'absolute',
    bottom: 120,
    width: '100%',
    paddingHorizontal: 30,
    alignItems: 'center',
    zIndex: 8,
  },
  caption: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
  },

  footer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 50 : 30,
    width: '100%',
    paddingHorizontal: 20,
    zIndex: 10,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    padding: 6,
    borderRadius: 30,
    gap: 10,
    width: 140,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  plusCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addLabel: { color: '#fff', fontSize: 13, fontWeight: '800' },
});
