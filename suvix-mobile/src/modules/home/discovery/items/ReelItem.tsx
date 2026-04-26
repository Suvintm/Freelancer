import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { Image } from 'expo-image';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Video, ResizeMode } from 'expo-av';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

interface ReelItemProps {
  data: {
    author: { name: string; avatar: string };
    thumbnail: string;
    videoUrl: string;
    title: string;
    views: string;
  };
  isVisible: boolean;
}

export const ReelItem: React.FC<ReelItemProps> = ({ data, isVisible }) => {
  const { isDarkMode } = useTheme();
  const [isMuted, setIsMuted] = useState(true);
  const [status, setStatus] = useState<any>({});
  const videoRef = useRef<Video>(null);

  const toggleMute = (e: any) => {
    e.stopPropagation();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsMuted(!isMuted);
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity activeOpacity={0.95} style={styles.card} onPress={handlePress}>
        {/* 🎬 INDUSTRIAL-STRENGTH VIDEO ENGINE (expo-av) */}
        <Video
          ref={videoRef}
          source={{ 
            uri: data.videoUrl,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
          }}
          style={StyleSheet.absoluteFill}
          resizeMode={ResizeMode.COVER}
          shouldPlay={isVisible}
          isLooping={true}
          isMuted={isMuted}
          onPlaybackStatusUpdate={status => setStatus(() => status)}
          onError={(err) => console.log('❌ [REEL-VIDEO] Error:', err)}
        />
        
        {/* Poster / Loading Fallback */}
        {(!status.isLoaded || status.isBuffering) && (
          <Image 
            source={{ uri: data.thumbnail }} 
            style={styles.thumbnail} 
            contentFit="cover" 
            transition={300}
          />
        )}

        {/* Top Actions */}
        <View style={styles.topActions}>
          <BlurView intensity={25} tint="light" style={styles.reelBadge}>
            <MaterialCommunityIcons name="movie-play" size={14} color="white" />
            <Text style={styles.reelText}>REEL</Text>
          </BlurView>

          <TouchableOpacity onPress={toggleMute} activeOpacity={0.7}>
            <BlurView intensity={35} tint="light" style={styles.muteBtn}>
              <Ionicons 
                name={isMuted ? "volume-mute" : "volume-high"} 
                size={18} 
                color="white" 
              />
            </BlurView>
          </TouchableOpacity>
        </View>

        {/* Bottom Metadata Bar */}
        <BlurView 
          intensity={isDarkMode ? 40 : 60} 
          tint={isDarkMode ? 'dark' : 'light'} 
          style={styles.metaBar}
        >
          <View style={styles.content}>
            <View style={styles.authorRow}>
              <View style={styles.avatarWrapper}>
                <Image source={{ uri: data.author.avatar }} style={styles.miniAvatar} />
                <View style={styles.liveIndicator} />
              </View>
              <Text style={styles.authorName}>{data.author.name}</Text>
            </View>
            
            <Text numberOfLines={1} style={styles.title}>{data.title}</Text>
            
            <View style={styles.statsRow}>
              <View style={styles.viewBadge}>
                <Ionicons name="eye" size={12} color="rgba(255,255,255,0.9)" />
                <Text style={styles.viewsText}>{data.views} views</Text>
              </View>
            </View>
          </View>
        </BlurView>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  card: {
    width: '100%',
    aspectRatio: 9 / 16, 
    borderRadius: 32,
    overflow: 'hidden',
    backgroundColor: '#000',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
      },
      android: {
        elevation: 10,
      }
    })
  },
  thumbnail: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  topActions: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  reelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  reelText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  muteBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  metaBar: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    padding: 20,
    overflow: 'hidden',
  },
  content: {
    gap: 10,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarWrapper: {
    position: 'relative',
  },
  miniAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'white',
  },
  liveIndicator: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF3040',
    borderWidth: 1.5,
    borderColor: 'black',
  },
  authorName: {
    color: 'white',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  title: {
    color: 'white',
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  viewsText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '800',
  },
});
