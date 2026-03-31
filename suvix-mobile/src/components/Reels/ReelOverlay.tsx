import React from 'react';
import { View, Text, StyleSheet, Pressable, Image, Dimensions, Platform } from 'react-native';
import { Heart, MessageCircle, Share2, MoreHorizontal, Music, Eye, Volume2, VolumeX, ChevronLeft } from 'lucide-react-native';
import { Colors } from '../../constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useAnimatedStyle, withRepeat, withSequence, withTiming, useSharedValue, withDelay } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MusicVisualizer } from './MusicVisualizer';
import { MediaConfig } from '../../constants/MediaConfig';

const whiteLogo = require('../../../assets/whitebglogo.png');

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('screen');

interface ReelOverlayProps {
  reel: any;
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
  onMute?: () => void;
  isMuted?: boolean;
  progress?: number; // 0 to 100
  isActive?: boolean;
  onVideoPress?: () => void;
}

/**
 * PRODUCTION-GRADE REEL OVERLAY (FULL PARITY)
 * Includes Liker Avatars, Glassmorphism Sidebar, and Progress Bar Glow.
 */
const ReelOverlayInternal = ({ 
  reel, 
  onLike, 
  onComment, 
  onShare, 
  onMute, 
  isMuted = false,
  progress = 0,
  isActive = false,
  onVideoPress
}: ReelOverlayProps) => {
  const insets = useSafeAreaInsets();
  
  // — PERFORMANCE: Safe fallbacks for nested objects —
  const editor = reel.editor || {};
  const likesCount = reel.likesCount || 0;
  const commentsCount = reel.commentsCount || 0;
  const viewsCount = reel.viewsCount || 0;
  const latestLikers = reel.latestLikers || [];
  const createdAt = reel.createdAt ? new Date(reel.createdAt) : new Date();
  const isNew = (new Date().getTime() - createdAt.getTime()) < 24 * 60 * 60 * 1000;

  // Animation for "NEW" Badge
  const badgeScale = useSharedValue(1);
  const badgeOpacity = useSharedValue(0.8);

  React.useEffect(() => {
    if (isNew) {
      badgeScale.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 1000 }),
          withTiming(1, { duration: 1000 })
        ),
        -1,
        true
      );
      badgeOpacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1000 }),
          withTiming(0.8, { duration: 1000 })
        ),
        -1,
        true
      );
    }
  }, [isNew]);

  const animatedBadgeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: badgeScale.value }],
    opacity: badgeOpacity.value,
  }));

  return (
    <View style={styles.container} pointerEvents="box-none">
      {/* 0. BACKGROUND TAP LAYER (Layer 0 - for Mute/Like) */}
      <Pressable 
        style={StyleSheet.absoluteFill} 
        onPress={onVideoPress}
      />

      {/* 1. TOP HEADER (Safe Area Aware) */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
        <Pressable style={styles.backButton} onPress={() => console.log('Back')}>
          <ChevronLeft color="#FFF" size={28} />
        </Pressable>
        
        <View style={styles.brandingContainer}>
          <Image source={whiteLogo} style={styles.fullBrandingLogo} resizeMode="contain" />
          
          {isNew && (
            <Animated.View style={[styles.newBadge, animatedBadgeStyle]}>
              <Text style={styles.newBadgeText}>NEW</Text>
            </Animated.View>
          )}
        </View>
        
        <View style={styles.placeholder} />
      </View>

      {/* 2. BOTTOM GRADIENT (Readability Overlay - Lowered for clarity) */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.6)']}
        style={[styles.gradient, { top: '70%', height: '30%' }]}
        pointerEvents="none"
      />

      {/* 2. RIGHT SIDEBAR (Interactive Glassmorphism - Layer 3) */}
      <View style={styles.sidebar}>
        {/* Like */}
        <View style={styles.sidebarItem}>
          <Pressable style={styles.glassButton} onPress={onLike}>
            <Heart 
              color={reel.isLiked ? Colors.heart : '#FFF'} 
              fill={reel.isLiked ? Colors.heart : 'none'} 
              size={24} 
            />
          </Pressable>
          <Text style={styles.sidebarText}>{likesCount}</Text>
        </View>

        {/* Comment */}
        <View style={styles.sidebarItem}>
          <Pressable style={styles.glassButton} onPress={onComment}>
            <MessageCircle color="#FFF" size={24} />
          </Pressable>
          <Text style={styles.sidebarText}>{commentsCount}</Text>
        </View>

        {/* Views (Eye) */}
        <View style={styles.sidebarItem}>
          <View style={[styles.glassButton, styles.disabledButton]}>
            <Eye color="#FFF" size={20} />
          </View>
          <Text style={styles.sidebarText}>{viewsCount}</Text>
        </View>

        {/* Share */}
        <View style={styles.sidebarItem}>
          <Pressable style={styles.glassButton} onPress={onShare}>
            <Share2 color="#FFF" size={22} />
          </Pressable>
        </View>

        {/* Mute/Volume Toggle */}
        <Pressable style={styles.glassButton} onPress={onMute}>
          {isMuted ? <VolumeX color="#FFF" size={22} /> : <Volume2 color="#FFF" size={22} />}
        </Pressable>
      </View>

      {/* 4. BOTTOM INFO STACK (Safe Area Aware - Layer 3) */}
      <View style={[styles.bottomInfo, { bottom: Math.max(insets.bottom, 20) + SCREEN_HEIGHT * 0.02 }]}>
        {/* Liker Avatars Stack */}
        {latestLikers.length > 0 && (
          <View style={styles.likerStack}>
            <View style={styles.avatarGroup}>
              {latestLikers.slice(0, 3).map((liker: any, idx: number) => (
                <View key={idx} style={[styles.miniAvatar, { marginLeft: idx === 0 ? 0 : -10, zIndex: 10 - idx }]}>
                  {liker.profilePicture ? (
                    <Image source={{ uri: MediaConfig.toOptimizedImage(liker.profilePicture, 40) }} style={styles.miniAvatarImage} />
                  ) : (
                    <View style={styles.miniAvatarPlaceholder}><Text style={styles.miniAvatarText}>{liker.name?.[0] || '?'}</Text></View>
                  )}
                </View>
              ))}
            </View>
            <Text style={styles.likerText}>
              Liked by <Text style={styles.boldText}>{latestLikers[0]?.name || 'User'}</Text> {likesCount > 1 ? `and ${likesCount - 1} others` : ''}
            </Text>
          </View>
        )}

        {/* Editor Profile Row */}
        <View style={styles.userInfo}>
          <View style={styles.avatarContainer}>
            {editor.profilePicture ? (
              <Image source={{ uri: MediaConfig.toOptimizedImage(editor.profilePicture, 80) }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}><Text style={styles.avatarInitial}>{editor.name?.[0] || 'S'}</Text></View>
            )}
          </View>
          <View style={styles.userMeta}>
             <View style={styles.nameRow}>
                <Text style={styles.username}>{editor.name || 'suvix_user'}</Text>
                <View style={styles.roleBadge}><Text style={styles.roleText}>{(editor.role || 'EDITOR').toUpperCase()}</Text></View>
                <Pressable style={styles.followButton}>
                  <Text style={styles.followText}>Follow</Text>
                </Pressable>
             </View>
             <MusicVisualizer isPlaying={isActive} />
          </View>
        </View>

        {/* Content Info */}
        <View style={styles.contentBox}>
          <Text style={styles.title}>{reel.title || 'Untitled Reel'}</Text>
          <View style={styles.descriptionRow}>
            <Text style={styles.description} numberOfLines={2}>
              {reel.description || 'Watch this amazing reel on SuviX...'}
            </Text>
            <Pressable onPress={onComment}>
              <Text style={styles.moreText}>more...</Text>
            </Pressable>
          </View>
        </View>

        {/* Music row (Visualizer placeholder) */}
        <View style={styles.musicContainer}>
          <Music color="#FFF" size={12} />
          <Text style={styles.musicText}>Original Audio - {editor.name || 'Artist'}</Text>
          {/* Visualizer bars here later */}
        </View>
      </View>

      {/* 5. PROGRESS BAR (Absolute Bottom Edge) */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { width: `${progress}%` }]}>
           <View style={styles.progressGlow} />
        </View>
      </View>
    </View>
  );
};

export const ReelOverlay = React.memo(ReelOverlayInternal);

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 100,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  brandingContainer: {
    alignItems: 'center',
    gap: 4,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerLogo: {
    width: 20,
    height: 20,
  },
  fullBrandingLogo: {
    width: SCREEN_WIDTH * 0.4,
    height: 34,
  },
  brandingText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'normal',
    letterSpacing: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  newBadge: {
    backgroundColor: '#FFF',
    paddingHorizontal: 12,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  newBadgeText: {
    color: '#000',
    fontSize: 7,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  placeholder: {
    width: 40,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
    height: '100%',
    zIndex: 1,
  },
  sidebar: {
    position: 'absolute',
    right: 12,
    bottom: SCREEN_HEIGHT * 0.15,
    alignItems: 'center',
    gap: 20,
    zIndex: 100,
  },
  sidebarItem: {
    alignItems: 'center',
    gap: 4,
  },
  glassButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  sidebarText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  bottomInfo: {
    position: 'absolute',
    left: 14,
    right: 80,
    zIndex: 100,
  },
  likerStack: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  avatarGroup: {
    flexDirection: 'row',
  },
  miniAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#FFF',
    overflow: 'hidden',
    backgroundColor: '#333',
  },
  miniAvatarImage: {
    width: '100%',
    height: '100%',
  },
  miniAvatarPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniAvatarText: {
    color: '#FFF',
    fontSize: 8,
    fontWeight: 'bold',
  },
  likerText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  boldText: {
    fontWeight: 'bold',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    marginBottom: 12,
  },
  avatarContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1.5,
    borderColor: '#FFF',
    padding: 1,
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 18,
  },
  userMeta: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  username: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
  roleBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  roleText: {
    color: '#FFF',
    fontSize: 8,
    fontWeight: 'bold',
  },
  followButton: {
    marginLeft: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 15,
    paddingHorizontal: 14,
    paddingVertical: 3,
    backgroundColor: 'transparent',
  },
  followText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  contentBox: {
    marginBottom: 8,
  },
  title: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 22,
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  descriptionRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    flexWrap: 'wrap',
  },
  description: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    lineHeight: 18,
  },
  moreText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  musicContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  musicText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '500',
  },
  progressContainer: {
    position: 'absolute',
    bottom: -1,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#FFF',
  },
  progressGlow: {
    position: 'absolute',
    top: 0,
    right: -3,
    width: 6,
    height: '100%',
    backgroundColor: '#FFF',
    shadowColor: '#FFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 5,
    elevation: 5,
  }
});
