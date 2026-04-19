import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../../context/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export interface ContentItem {
  id: string;
  thumbnail: string;
  blurhash?: string;
  type: 'POSTS' | 'REELS' | 'YT VIDEOS' | 'SHORTS';
  views?: string;
  likes?: string;
  title?: string; // New: Video Title
  channelAvatar?: string; // New: Channel Profile Picture
  isProcessing?: boolean;
  isMock?: boolean;
}

interface ContentCardProps {
  item: ContentItem;
  mode?: 'grid' | 'reels';
  columns?: number;
  gap?: number; // New: Pass custom gap for math
  onPress?: (item: ContentItem) => void;
}

export const ContentCard: React.FC<ContentCardProps> = ({
  item,
  mode = 'grid',
  columns = 3,
  gap: customGap,
  onPress,
}) => {
  const { theme } = useTheme();
  const [hasError, setHasError] = React.useState(false);

  // 📐 Precise Layout Calculation
  // If columns are 2, we assume a more padded layout (Tiles).
  // If 3, we assume flush layout (Standard).
  const HORIZONTAL_PADDING = columns === 2 ? 16 : 0; 
  const GAP = customGap ?? 1.5;
  
  const availableWidth = SCREEN_WIDTH - HORIZONTAL_PADDING;
  const cellSize = (availableWidth - GAP * (columns - 1)) / columns;
  
  const isReels = mode === 'reels';
  const cellHeight = isReels ? cellSize * 1.55 : cellSize;

  const isVideo = item.type === 'REELS' || item.type === 'YT VIDEOS' || item.type === 'SHORTS';
  const isYoutube = item.type === 'YT VIDEOS' || item.type === 'SHORTS';

  return (
    <TouchableOpacity
      activeOpacity={0.78}
      onPress={() => onPress?.(item)}
      style={[
        styles.card, 
        { width: cellSize, height: cellHeight },
        isYoutube && { borderRadius: 10 } // Premium rounded edges for YT
      ]}
    >
      {/* Thumbnail */}
      {item.thumbnail && !item.isProcessing && !hasError ? (
        <Image
          source={{ uri: item.thumbnail }}
          placeholder={item.blurhash}
          style={styles.image}
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={200}
          onError={(e) => {
            console.warn(`❌ [CONTENT-CARD] Failed to load: ${item.thumbnail}`, e);
            setHasError(true);
          }}
        />
      ) : (
        <View style={[styles.placeholder, { backgroundColor: theme.secondary ?? '#1a1a1a' }]}>
          {item.isProcessing ? (
            <>
              <ActivityIndicator size="small" color={theme.accent ?? '#FF3040'} />
              <Text style={[styles.processingText, { color: theme.textSecondary ?? '#666' }]}>
                Processing
              </Text>
            </>
          ) : (
            <MaterialCommunityIcons 
              name={isYoutube ? "youtube" : "image-off-outline"} 
              size={isYoutube ? 32 : 22} 
              color={isYoutube ? "#FF0000" : "rgba(255,255,255,0.2)"} 
              style={isYoutube ? { opacity: 0.8 } : {}}
            />
          )}
        </View>
      )}

      {/* 🔴 BRANDING: Channel Avatar (Top Level) */}
      {item.channelAvatar && !isReels && (
        <View style={styles.avatarOverlay} pointerEvents="none">
          <Image 
            source={{ uri: item.channelAvatar }} 
            style={styles.channelThumb} 
            contentFit="cover"
            cachePolicy="memory-disk"
          />
        </View>
      )}

      {/* Gradient for text contrast (Always for YT, or for reels) */}
      {(isReels || (isYoutube && item.title)) && (
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.85)']}
          style={styles.bottomGradient}
          pointerEvents="none"
        />
      )}

      {/* 📝 METADATA: Title (Bottom Level) */}
      {item.title && isYoutube && !isReels && (
        <View style={styles.titleArea} pointerEvents="none">
          <Text style={styles.videoTitle} numberOfLines={2}>
            {item.title}
          </Text>
        </View>
      )}

      {/* Type badge (top-right) */}
      <View style={styles.badgeArea} pointerEvents="none">
        {item.type === 'REELS' && (
          <MaterialCommunityIcons name="movie-play-outline" size={15} color="white" />
        )}
        {item.type === 'YT VIDEOS' && (
          <MaterialCommunityIcons name="youtube" size={15} color="#FF0000" />
        )}
        {item.type === 'SHORTS' && (
          <View style={styles.shortsBadge}>
            <Text style={styles.shortsText}>#S</Text>
          </View>
        )}
      </View>

      {/* Views (bottom-left) */}
      {item.views && (
        <View style={styles.viewsRow} pointerEvents="none">
          <MaterialCommunityIcons
            name="play-outline"
            size={isReels ? 13 : 11}
            color="rgba(255,255,255,0.9)"
          />
          <Text style={[styles.viewsText, isReels && styles.viewsTextLarge]}>
            {item.views}
          </Text>
        </View>
      )}

      {/* Processing shimmer overlay */}
      {item.isProcessing && (
        <View style={styles.processingOverlay} pointerEvents="none">
          <View style={styles.processingDot} />
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#111',
    overflow: 'hidden',
  },
  image: { width: '100%', height: '100%' },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  processingText: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  badgeArea: {
    position: 'absolute',
    top: 6,
    right: 6,
  },
  shortsBadge: {
    backgroundColor: '#FF0000',
    borderRadius: 3,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  shortsText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '900',
  },
  viewsRow: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewsText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 10,
    fontWeight: '800',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  viewsTextLarge: { fontSize: 11 },
  processingOverlay: {
    position: 'absolute',
    top: 6,
    left: 6,
  },
  processingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF3040',
  },
  avatarOverlay: {
    position: 'absolute',
    top: 8,
    left: 8,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 3,
    elevation: 4,
  },
  channelThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#fff',
    backgroundColor: '#000',
  },
  bottomGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '45%',
  },
  titleArea: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    zIndex: 5,
  },
  videoTitle: {
    color: '#fff',
    fontSize: 9.5,
    fontWeight: '800',
    lineHeight: 12,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});