import React from 'react';
import { View, StyleSheet, Dimensions, Pressable, Image } from 'react-native';
import { ReelPlayer } from '../ReelPlayer';
import { ReelOverlay } from './ReelOverlay';
import { MediaConfig } from '../../constants/MediaConfig';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withSequence, 
  withDelay, 
  withTiming 
} from 'react-native-reanimated';
import { Heart } from 'lucide-react-native';
import { api } from '../../api/client';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('screen');

interface ReelItemProps {
  reel: any;
  isActive: boolean;
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
  onMute: () => void;
  isMuted: boolean;
}

/**
 * PRODUCTION-GRADE REEL ITEM WRAPPER
 * Encapsulates Player and Overlay with React.memo for max performance.
 */
const ReelItemInternal = ({ 
  reel, 
  isActive, 
  onLike, 
  onComment, 
  onShare, 
  onMute, 
  isMuted 
}: ReelItemProps) => {
  const lastTap = React.useRef(0);
  const tapTimer = React.useRef<NodeJS.Timeout | null>(null);
  const heartScale = useSharedValue(0);
  const heartOpacity = useSharedValue(0);

  // 1. Impression Tracking (Production Logic)
  React.useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isActive) {
      // Fire view after 2 seconds (Impression threshold like IG)
      timer = setTimeout(async () => {
        try {
          await api.post(`/reels/${reel._id}/view`);
          console.log(`📈 Impression tracked for: ${reel._id}`);
        } catch (e) {
          // Fail silently in production analytics
        }
      }, 2000);
    }
    return () => clearTimeout(timer);
  }, [isActive, reel._id]);

  const triggerHeart = () => {
    onLike(); // Fire API
    heartScale.value = 0;
    heartOpacity.value = 1;
    heartScale.value = withSequence(
      withSpring(1.2, { damping: 12, stiffness: 200 }),
      withSpring(1, { damping: 10, stiffness: 100 }),
      withDelay(300, withSpring(0))
    );
    heartOpacity.value = withDelay(400, withTiming(0, { duration: 300 }));
  };

  const handlePress = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (now - lastTap.current < DOUBLE_TAP_DELAY) {
      // SUCCESS: It's a double tap
      if (tapTimer.current) {
        clearTimeout(tapTimer.current);
        tapTimer.current = null;
      }
      triggerHeart();
    } else {
      // Potential single tap - wait to see if a second one comes
      tapTimer.current = setTimeout(() => {
        onMute(); // Trigger Mute/Unmute
        tapTimer.current = null;
      }, DOUBLE_TAP_DELAY);
    }
    lastTap.current = now;
  };

  const animatedHeartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
    opacity: heartOpacity.value,
  }));

  return (
    <View style={styles.container}>
      {/* Layer 1: Background Media */}
      {reel.mediaType === 'image' ? (
        <View style={styles.container}>
          {/* Layer 1 (Background): Blurred Cover */}
          <Image 
            source={{ uri: MediaConfig.repairUrl(reel.mediaUrl) }} 
            style={StyleSheet.absoluteFill} 
            blurRadius={25}
            resizeMode="cover"
          />
          <View style={styles.backgroundDimmer} />
          
          {/* Layer 2 (Foreground): Clear Contain */}
          <Image 
            source={{ uri: MediaConfig.repairUrl(reel.mediaUrl) }} 
            style={StyleSheet.absoluteFill} 
            resizeMode="contain"
          />
        </View>
      ) : (
        <ReelPlayer 
          url={reel.mediaUrl || ''} 
          isActive={isActive} 
          isMuted={isMuted} 
        />
      )}
      
      {/* Layer 2: Heart Pop Animation (Double Tap) */}
      <View style={styles.heartOverlay} pointerEvents="none">
        <Animated.View style={[animatedHeartStyle, { zIndex: 5 }]}>
          <Heart color="#FFF" size={100} fill="#FFF" />
        </Animated.View>
      </View>

      {/* Layer 3: Interactive Overlay */}
      <ReelOverlay 
        reel={reel}
        onLike={onLike}
        onComment={onComment}
        onShare={onShare}
        onMute={onMute}
        isMuted={isMuted}
        isActive={isActive}
        progress={isActive ? 0 : 0} 
        onVideoPress={handlePress}
      />
    </View>
  );
};

export const ReelItem = React.memo(ReelItemInternal);

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: '#000',
    overflow: 'hidden',
  },
  backgroundDimmer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  heartOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
});
