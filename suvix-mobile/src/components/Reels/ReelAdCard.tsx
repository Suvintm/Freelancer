import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { X, Play, Volume2, VolumeX, ChevronRight, Globe } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Dimensions, Image } from 'react-native';
import Video from 'react-native-video';
import { MediaConfig } from '../../constants/MediaConfig';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('screen');

interface ReelAdCardProps {
  ad: any;
  onSkip: () => void;
  onCTA: () => void;
  isMuted?: boolean;
  onMute?: () => void;
  isActive?: boolean;
}

/**
 * PRODUCTION-GRADE REEL AD CARD
 * Features: 3s Skip Countdown, Pulsing "Advertisement" header, and Dynamic CTA button.
 */
export const ReelAdCard = ({ 
  ad, 
  onSkip, 
  onCTA, 
  isMuted = false, 
  onMute,
  isActive = true 
}: ReelAdCardProps) => {
  const [skipCountdown, setSkipCountdown] = useState(3);
  const [canSkip, setCanSkip] = useState(false);
  const pulseAnim = useRef(new Animated.Value(0.7)).current;

  // 1. Skip Logic
  useEffect(() => {
    if (!isActive) return;
    if (skipCountdown <= 0) {
      setCanSkip(true);
      return;
    }
    const timer = setTimeout(() => setSkipCountdown(s => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [skipCountdown, isActive]);

  // 2. Pulse Animation for "Advertisement" header
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.7, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.container}>
      {/* 1. BACKGROUND MEDIA LAYER (Layer 1) */}
      <View style={StyleSheet.absoluteFill}>
        {ad.mediaUrl ? (
          <View style={StyleSheet.absoluteFill}>
             {/* Background: Blurred Cover */}
             <Image 
               source={{ uri: ad.mediaType === 'video' ? MediaConfig.getPosterUrl(ad.mediaUrl) : MediaConfig.repairUrl(ad.mediaUrl) }} 
               style={StyleSheet.absoluteFill} 
               blurRadius={25}
               resizeMode="cover"
             />
             <View style={styles.backgroundDimmer} />

             {/* Foreground: Clear Contain */}
             {ad.mediaType === 'video' ? (
                <Video
                  source={{ uri: MediaConfig.toAdaptiveStream(ad.mediaUrl) }}
                  style={StyleSheet.absoluteFill}
                  resizeMode="contain"
                  repeat
                  muted={isMuted}
                  paused={!isActive}
                />
             ) : (
                <Image 
                  source={{ uri: MediaConfig.toOptimizedImage(ad.mediaUrl, 1080) }} 
                  style={StyleSheet.absoluteFill} 
                  resizeMode="contain" 
                />
             )}
          </View>
        ) : (
          <View style={styles.adMediaPlaceholder} />
        )}
      </View>

      {/* 2. GRADIENT OVERLAY (Layer 2) */}
      <LinearGradient
        colors={['rgba(0,0,0,0.8)', 'transparent', 'rgba(0,0,0,0.9)']}
        style={[StyleSheet.absoluteFill, { zIndex: 1 }]}
      />

      {/* TOP HEADER: Pulsing Advertisement Label */}
      <View style={styles.header}>
         <Animated.View style={[styles.adBadge, { opacity: pulseAnim }]}>
            <Text style={styles.adBadgeText}>ADVERTISEMENT</Text>
         </Animated.View>
      </View>

      {/* SIDE CONTROLS: Skip & Mute */}
      <View style={styles.sideControls}>
        <Pressable 
          style={[styles.circleButton, !canSkip && styles.disabledSkip]} 
          onPress={canSkip ? onSkip : undefined}
        >
          {canSkip ? (
            <View style={styles.skipContent}>
              <X color="#FFF" size={16} />
              <Text style={styles.skipSubText}>SKIP</Text>
            </View>
          ) : (
            <Text style={styles.countdownText}>{skipCountdown}</Text>
          )}
        </Pressable>

        <Pressable style={styles.circleButton} onPress={onMute}>
           {isMuted ? <VolumeX color="#FFF" size={20} /> : <Volume2 color="#FFF" size={20} />}
        </Pressable>
      </View>

      {/* BOTTOM OVERLAY: CTA and Info */}
      <View style={styles.bottomOverlay}>
        <Text style={styles.companyName}>{ad.companyName || 'Sponsored'}</Text>
        <Text style={styles.title}>{ad.title || 'Discover SuviX Premium'}</Text>
        
        {/* Pulsing CTA Button */}
        <Pressable style={styles.ctaButton} onPress={onCTA}>
           <Text style={styles.ctaText}>{ad.ctaText || 'LEARN MORE'}</Text>
           <ChevronRight color="#000" size={18} />
        </Pressable>

        <View style={styles.footer}>
           <Globe color="rgba(255,255,255,0.4)" size={14} />
           <Text style={styles.footerText}>{ad.websiteDisplay || 'suvix.in'}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: '#000',
    overflow: 'hidden',
  },
  header: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  adBadge: {
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    shadowColor: '#FFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
  adBadgeText: {
    color: '#000',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
  },
  sideControls: {
    position: 'absolute',
    right: 12,
    top: '40%',
    gap: 20,
    zIndex: 10,
  },
  circleButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledSkip: {
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  skipContent: {
    alignItems: 'center',
  },
  skipSubText: {
    color: '#FFF',
    fontSize: 7,
    fontWeight: 'bold',
  },
  countdownText: {
    color: '#FFF',
    fontWeight: '900',
    fontSize: 16,
  },
  bottomOverlay: {
    position: 'absolute',
    bottom: 60,
    left: 20,
    right: 20,
  },
  companyName: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  title: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 28,
    marginBottom: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  ctaButton: {
    backgroundColor: '#FFF',
    height: 50,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  ctaText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
    opacity: 0.6,
  },
  footerText: {
    color: '#FFF',
    fontSize: 12,
  },
  adMediaPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0A0A0A', // Dark depth for ads
  },
  backgroundDimmer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  }
});
