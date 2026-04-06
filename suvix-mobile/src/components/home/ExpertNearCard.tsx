import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Image,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { Expert } from '../../hooks/useNearbyExperts';
import { repairUrl } from '../../utils/media';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';

const { width: SW } = Dimensions.get('window');
const CARD_WIDTH = SW * 0.65;
const ASPECT_RATIO = 16 / 10;
const CARD_HEIGHT = CARD_WIDTH / ASPECT_RATIO;

interface ExpertNearCardProps {
  expert: Expert;
}

export const ExpertNearCard = ({ expert }: ExpertNearCardProps) => {
  const { theme } = useTheme();
  const router = useRouter();

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/editor/${expert._id}` as any);
  };

  const avatarUrl = typeof expert.profilePicture === 'string' 
    ? repairUrl(expert.profilePicture) 
    : (expert.profilePicture?.url ? repairUrl(expert.profilePicture.url) : 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=800');

  return (
    <TouchableOpacity 
      activeOpacity={0.9} 
      onPress={handlePress}
      style={[s.card, { width: CARD_WIDTH, height: CARD_HEIGHT, backgroundColor: theme.secondary, borderColor: theme.border }]}
    >
      <Image source={{ uri: avatarUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      <LinearGradient 
        colors={['transparent', 'rgba(0,0,0,0.8)']} 
        style={StyleSheet.absoluteFill} 
      />

      {/* Distance Badge */}
      <View style={s.topRow}>
        <View style={s.distBadge}>
          <Ionicons name="location" size={10} color="#fff" />
          <Text style={s.distTxt}>{expert.distance} KM</Text>
        </View>
        {expert.isOnline && (
            <View style={s.onlineDot} />
        )}
      </View>

      {/* Info Overlay */}
      <View style={s.info}>
        <View style={s.ratingRow}>
          <Ionicons name="star" size={10} color="#fbbf24" />
          <Text style={s.ratingTxt}>{expert.ratingStats?.averageRating?.toFixed(1) || '5.0'}</Text>
        </View>
        <Text numberOfLines={1} style={s.name}>{expert.name}</Text>
        <Text numberOfLines={1} style={s.skills}>
          {expert.skills?.join(' • ') || 'Expert Creator'}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const s = StyleSheet.create({
  card: { borderRadius: 24, overflow: 'hidden', borderWidth: 1, marginRight: 16 },
  topRow: { position: 'absolute', top: 12, left: 12, right: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  distBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(59,130,246,0.8)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  distTxt: { color: '#fff', fontSize: 10, fontWeight: '900' },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#22c55e', borderWidth: 1.5, borderColor: '#fff' },
  
  info: { position: 'absolute', bottom: 12, left: 12, right: 12 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  ratingTxt: { color: '#fff', fontSize: 10, fontWeight: '800' },
  name: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: -0.5 },
  skills: { color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: '600', marginTop: 2 }
});
