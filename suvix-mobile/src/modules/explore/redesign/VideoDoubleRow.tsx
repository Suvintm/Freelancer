import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

interface VideoItem {
  id: string;
  thumbnail: string;
  title: string;
  channel: string;
  views: string;
}

const MOCK_VIDEOS: VideoItem[] = [
  { id: '1', title: 'Cinematic Lighting Masterclass', channel: 'ProFilm', views: '1.2M', thumbnail: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=400' },
  { id: '2', title: 'After Effects Speed Art', channel: 'VFX Flow', views: '800K', thumbnail: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=400' },
  { id: '3', title: 'Top 5 Mirrorless Cameras 2026', channel: 'GearHead', views: '2.4M', thumbnail: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=400' },
  { id: '4', title: 'Directing Music Videos', channel: 'Director X', views: '450K', thumbnail: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=400' },
  { id: '5', title: 'Color Grading Secrets', channel: 'DaVinci Pro', views: '1.5M', thumbnail: 'https://images.unsplash.com/photo-1535016120720-40c646bebbdc?q=80&w=400' },
  { id: '6', title: 'Building a YT Studio', channel: 'Creator Hub', views: '3.1M', thumbnail: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=400' },
];

export const VideoDoubleRow = () => {
  const { isDarkMode } = useTheme();

  const renderVideo = (item: VideoItem) => (
    <TouchableOpacity key={item.id} style={styles.card} activeOpacity={0.9}>
      <View style={styles.thumbnailContainer}>
        <Image source={{ uri: item.thumbnail }} style={styles.thumbnail} />
        <View style={styles.durationTag}>
          <Text style={styles.durationText}>12:45</Text>
        </View>
      </View>
      <View style={styles.info}>
        <Text numberOfLines={2} style={[styles.title, { color: isDarkMode ? 'white' : 'black' }]}>
          {item.title}
        </Text>
        <Text style={styles.channel}>{item.channel} • {item.views} views</Text>
      </View>
    </TouchableOpacity>
  );

  // Split videos into two rows
  const row1 = MOCK_VIDEOS.slice(0, 3);
  const row2 = MOCK_VIDEOS.slice(3, 6);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: isDarkMode ? 'white' : 'black' }]}>Suggested for You</Text>
        <TouchableOpacity><Text style={styles.seeAll}>See All</Text></TouchableOpacity>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.gridColumn}>
          <View style={styles.row}>{row1.map(renderVideo)}</View>
          <View style={styles.row}>{row2.map(renderVideo)}</View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 15,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  seeAll: {
    fontSize: 12,
    fontWeight: '700',
    color: '#818cf8',
  },
  scrollContent: {
    paddingHorizontal: 15,
  },
  gridColumn: {
    flexDirection: 'column',
    gap: 20,
  },
  row: {
    flexDirection: 'row',
    gap: 15,
  },
  card: {
    width: 240,
    backgroundColor: 'transparent',
  },
  thumbnailContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#1A1B1E',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  durationTag: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  durationText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700',
  },
  info: {
    marginTop: 10,
    paddingHorizontal: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18,
  },
  channel: {
    fontSize: 11,
    color: 'gray',
    marginTop: 4,
    fontWeight: '500',
  },
});
