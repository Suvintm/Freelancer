import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../../../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

interface ReelItemProps {
  data: {
    author: { name: string; avatar: string };
    thumbnail: string;
    title: string;
    views: string;
  };
}

export const ReelItem: React.FC<ReelItemProps> = ({ data }) => {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      <TouchableOpacity activeOpacity={0.9} style={styles.card}>
        <Image source={{ uri: data.thumbnail }} style={styles.thumbnail} contentFit="cover" />
        
        {/* Overlay Info */}
        <LinearGradient 
          colors={['transparent', 'rgba(0,0,0,0.8)']} 
          style={styles.overlay}
        >
          <View style={styles.content}>
             <View style={styles.authorRow}>
               <Image source={{ uri: data.author.avatar }} style={styles.miniAvatar} />
               <Text style={styles.authorName}>{data.author.name}</Text>
             </View>
             <Text numberOfLines={2} style={styles.title}>{data.title}</Text>
             <View style={styles.viewRow}>
               <MaterialCommunityIcons name="play-outline" size={14} color="white" />
               <Text style={styles.viewsText}>{data.views}</Text>
             </View>
          </View>
        </LinearGradient>

        <View style={styles.reelBadge}>
          <MaterialCommunityIcons name="movie-play-outline" size={16} color="white" />
          <Text style={styles.reelText}>Reel</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingTop: 0,
  },
  card: {
    width: '100%',
    aspectRatio: 9 / 16, 
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
  },
  thumbnail: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    padding: 20,
  },
  content: {
    gap: 8,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  miniAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'white',
  },
  authorName: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
  title: {
    color: 'white',
    fontSize: 18,
    fontWeight: '900',
    lineHeight: 24,
  },
  viewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewsText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: '800',
  },
  reelBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  reelText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
  }
});
