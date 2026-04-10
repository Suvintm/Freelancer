import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  Linking,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../../context/ThemeContext';
import { formatDistanceToNow } from 'date-fns';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - 40) / 2;

export const YouTubeVideoCard: React.FC<YouTubeVideoCardProps> = ({ video }) => {
  const { theme } = useTheme();

  const handleWatch = () => {
    const url = `https://www.youtube.com/watch?v=${video.id}`;
    Linking.openURL(url);
  };

  const formattedDate = video.published_at 
    ? formatDistanceToNow(new Date(video.published_at), { addSuffix: true })
    : '';

  return (
    <TouchableOpacity 
      activeOpacity={0.8} 
      onPress={handleWatch}
      style={[styles.card, { backgroundColor: theme.primary, borderColor: theme.border }]}
    >
      {/* Thumbnail Container */}
      <View style={styles.thumbnailContainer}>
        <Image 
          source={{ uri: video.thumbnail }} 
          style={styles.thumbnail} 
          resizeMode="cover" 
        />
        {/* Subtle Watch Icon Overlay - Minimalist */}
        <View style={styles.watchBadge}>
           <MaterialCommunityIcons name="play" size={14} color="white" />
        </View>
      </View>

      {/* Content Area */}
      <View style={styles.contentArea}>
        <Text style={[styles.title, { color: theme.text }]} numberOfLines={2}>
          {video.title}
        </Text>
        
        <View style={styles.metaRow}>
          <MaterialCommunityIcons name="youtube" size={14} color="#FF0000" />
          {formattedDate && (
            <Text style={[styles.date, { color: theme.textSecondary }]}>
              {formattedDate}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: COLUMN_WIDTH,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  thumbnailContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    position: 'relative',
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  watchBadge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 4,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  contentArea: {
    padding: 10,
  },
  title: {
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
    letterSpacing: -0.2,
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  date: {
    fontSize: 10,
    fontWeight: '600',
    opacity: 0.6,
  },
});
