import React from 'react';
import { View, Image, StyleSheet, TouchableOpacity, Text, Dimensions, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const COLUMN_COUNT = 3;
const SPACING = 1;
const SQUARE_SIZE = (width - (COLUMN_COUNT - 1) * SPACING) / COLUMN_COUNT;

export interface ContentItem {
  id: string;
  thumbnail: string;
  type: 'POSTS' | 'REELS' | 'YT VIDEOS' | 'SHORTS';
  views?: string;
  likes?: string;
  isProcessing?: boolean;
}

interface ContentCardProps {
  item: ContentItem;
  mode?: 'grid' | 'reels';
  onPress?: (item: ContentItem) => void;
}

export const ContentCard: React.FC<ContentCardProps> = ({ item, mode = 'grid', onPress }) => {
  const { theme } = useTheme();
  const isReelsMode = mode === 'reels';

  return (
    <TouchableOpacity 
      activeOpacity={0.8} 
      onPress={() => onPress?.(item)}
      style={[
        styles.container, 
        isReelsMode ? styles.reelsContainer : styles.gridContainer
      ]}
    >
      {item.thumbnail && !item.isProcessing ? (
        <Image 
          source={{ uri: item.thumbnail }} 
          style={styles.image} 
          onError={(e) => {
            console.error(`🖼️ [BLACK-SCREEN-DIAGNOSTIC] | ID: ${item.id} | URL: ${item.thumbnail} | Error:`, e.nativeEvent.error);
          }}
        />
      ) : (
        <View style={styles.placeholderContainer}>
          <ActivityIndicator size="small" color={theme.accent} />
          <Text style={[styles.placeholderText, { color: theme.textSecondary }]}>
            {item.isProcessing ? 'Processing' : ''}
          </Text>
        </View>
      )}
      
      {/* Type Indicator Overlays */}
      {!isReelsMode && (
        <View style={styles.overlay}>
          {item.type === 'REELS' && (
            <MaterialCommunityIcons name="play-outline" size={18} color="white" />
          )}
          {item.type === 'YT VIDEOS' && (
            <MaterialCommunityIcons name="youtube" size={18} color="white" />
          )}
          {item.type === 'SHORTS' && (
            <MaterialCommunityIcons name="play-box-outline" size={18} color="#FF0000" />
          )}
        </View>
      )}

      {/* View count for reels/videos */}
      {item.views && (
        <>
          {isReelsMode && (
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.6)']}
              style={styles.reelsGradient}
            />
          )}
          <View style={[styles.metrics, isReelsMode && styles.reelsMetrics]}>
            <MaterialCommunityIcons name="play-outline" size={isReelsMode ? 14 : 12} color="white" />
            <Text style={[styles.metricsText, isReelsMode && styles.reelsMetricsText]}>{item.views}</Text>
          </View>
        </>
      )}

      {isReelsMode && (
        <View style={styles.reelsTypeOverlay}>
          <MaterialCommunityIcons 
            name={item.type === 'SHORTS' ? "play-box-outline" : "play-outline"} 
            size={16} 
            color={item.type === 'SHORTS' ? "#FF0000" : "white"} 
          />
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1a1a1a',
  },
  gridContainer: {
    width: SQUARE_SIZE,
    height: SQUARE_SIZE,
  },
  reelsContainer: {
    width: SQUARE_SIZE,
    height: SQUARE_SIZE * 1.6, // Proper 9:16-ish ratio
  },
  image: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    top: 6,
    right: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  metrics: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  metricsText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700',
    marginLeft: 2,
  },
  reelsGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
  },
  reelsMetrics: {
    backgroundColor: 'transparent',
    bottom: 8,
    left: 8,
  },
  reelsMetricsText: {
    fontSize: 11,
    fontWeight: '800',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10
  },
  reelsTypeOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.2)',
    padding: 2,
    borderRadius: 4,
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111',
  },
  placeholderText: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 8,
    textTransform: 'uppercase',
  }
});
