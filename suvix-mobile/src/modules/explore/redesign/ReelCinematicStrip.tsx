import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

interface Reel {
  id: string;
  thumbnail: string;
  views: string;
  creator: string;
}

const MOCK_REELS: Reel[] = [
  { id: '1', creator: 'VFX_Alex', views: '145K', thumbnail: 'https://images.unsplash.com/photo-1540331547168-8b63109225b7?q=80&w=400' },
  { id: '2', creator: 'FilmPro', views: '82K', thumbnail: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=400' },
  { id: '3', creator: 'LensLife', views: '210K', thumbnail: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400' },
  { id: '4', creator: 'ColorJoy', views: '95K', thumbnail: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400' },
];

export const ReelCinematicStrip = () => {
  const { isDarkMode } = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons name="play-circle" size={20} color="#f43f5e" />
          <Text style={[styles.headerTitle, { color: isDarkMode ? 'white' : 'black' }]}>Trending Reels</Text>
        </View>
        <TouchableOpacity><Text style={styles.seeAll}>Watch All</Text></TouchableOpacity>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {MOCK_REELS.map((reel) => (
          <TouchableOpacity key={reel.id} style={styles.reelCard} activeOpacity={0.9}>
            <Image source={{ uri: reel.thumbnail }} style={styles.thumbnail} />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.8)']}
              style={styles.overlay}
            />
            <View style={styles.info}>
              <Text style={styles.creator}>{reel.creator}</Text>
              <View style={styles.viewRow}>
                <Ionicons name="eye" size={12} color="white" />
                <Text style={styles.views}>{reel.views}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

// Simple LinearGradient shim if expo-linear-gradient is not imported correctly here
import { LinearGradient } from 'expo-linear-gradient';

const styles = StyleSheet.create({
  container: {
    marginVertical: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  seeAll: {
    fontSize: 12,
    fontWeight: '700',
    color: '#f43f5e',
  },
  scrollContent: {
    paddingHorizontal: 15,
    gap: 12,
  },
  reelCard: {
    width: 150,
    height: 240,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#1A1B1E',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  info: {
    position: 'absolute',
    bottom: 15,
    left: 15,
  },
  creator: {
    color: 'white',
    fontSize: 12,
    fontWeight: '800',
  },
  viewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  views: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 10,
    fontWeight: '700',
  },
});
