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

const { width } = Dimensions.get('window');
const COLUMN_COUNT = 3;
const GAP = 1.5;
const CELL_SIZE = (width - GAP * (COLUMN_COUNT - 1)) / COLUMN_COUNT;

export interface ContentItem {
  id: string;
  thumbnail: string;
  blurhash?: string;
  type: 'POSTS' | 'REELS' | 'YT VIDEOS' | 'SHORTS';
  views?: string;
  likes?: string;
  isProcessing?: boolean;
  isMock?: boolean;
}

interface ContentCardProps {
  item: ContentItem;
  mode?: 'grid' | 'reels';
  onPress?: (item: ContentItem) => void;
}

export const ContentCard: React.FC<ContentCardProps> = ({
  item,
  mode = 'grid',
  onPress,
}) => {
  const { theme } = useTheme();
  const [hasError, setHasError] = React.useState(false);

  const isReels = mode === 'reels';
  const cellHeight = isReels ? CELL_SIZE * 1.55 : CELL_SIZE;

  const isVideo = item.type === 'REELS' || item.type === 'YT VIDEOS' || item.type === 'SHORTS';
  const isYoutube = item.type === 'YT VIDEOS' || item.type === 'SHORTS';

  return (
    <TouchableOpacity
      activeOpacity={0.78}
      onPress={() => onPress?.(item)}
      style={[styles.card, { width: CELL_SIZE, height: cellHeight }]}
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

      {/* Gradient for reels */}
      {isReels && (
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.65)']}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
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
});