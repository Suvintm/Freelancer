import React from 'react';
import { View, Image, StyleSheet, TouchableOpacity, Text, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../../context/ThemeContext';

const { width } = Dimensions.get('window');
const COLUMN_COUNT = 3;
const SPACING = 1;
const CARD_SIZE = (width - (COLUMN_COUNT - 1) * SPACING) / COLUMN_COUNT;

export interface ContentItem {
  id: string;
  thumbnail: string;
  type: 'POST' | 'REEL' | 'YT VIDEOS' | 'SHORTS';
  views?: string;
  likes?: string;
}

interface ContentCardProps {
  item: ContentItem;
  onPress?: (item: ContentItem) => void;
}

export const ContentCard: React.FC<ContentCardProps> = ({ item, onPress }) => {
  const { theme } = useTheme();

  return (
    <TouchableOpacity 
      activeOpacity={0.8} 
      onPress={() => onPress?.(item)}
      style={styles.container}
    >
      <Image source={{ uri: item.thumbnail }} style={styles.image} />
      
      {/* Type Indicator Overlays */}
      <View style={styles.overlay}>
        {item.type === 'REEL' && (
          <MaterialCommunityIcons name="play-outline" size={18} color="white" />
        )}
        {item.type === 'YT VIDEOS' && (
          <MaterialCommunityIcons name="youtube" size={18} color="white" />
        )}
        {item.type === 'SHORTS' && (
          <MaterialCommunityIcons name="play-box-outline" size={18} color="#FF0000" />
        )}
      </View>

      {/* View count for reels/videos */}
      {item.views && (
        <View style={styles.metrics}>
          <MaterialCommunityIcons name="play" size={12} color="white" />
          <Text style={styles.metricsText}>{item.views}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: CARD_SIZE,
    height: CARD_SIZE,
    backgroundColor: '#1a1a1a',
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
  }
});
