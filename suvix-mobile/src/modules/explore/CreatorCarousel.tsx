import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { BlurView } from 'expo-blur';
import { MaterialCommunityIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.75;

const MOCK_CREATORS = [
  {
    id: 'c1',
    name: 'Tech Horizon',
    subscribers: '1.2M',
    category: 'Tech & Gadgets',
    image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=800',
    avatar: 'https://images.unsplash.com/photo-1540331547168-8b63109225b7?q=80&w=100',
  },
  {
    id: 'c2',
    name: 'Vlog Venture',
    subscribers: '850K',
    category: 'Lifestyle & Travel',
    image: 'https://images.unsplash.com/photo-1527631746610-bca00a040d60?q=80&w=800',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=100',
  }
];

export const CreatorCarousel = () => {
  const { isDarkMode, theme } = useTheme();

  const handleAction = (type: string, name: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    console.log(`🤝 [COLLAB] ${type} request sent to ${name}`);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: isDarkMode ? 'white' : 'black' }]}>YouTube Discovery</Text>
          <Text style={styles.subtitle}>Partner with top creators</Text>
        </View>
        <TouchableOpacity>
          <Text style={[styles.seeAll, { color: theme.accent }]}>See All</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        snapToInterval={CARD_WIDTH + 20}
        decelerationRate="fast"
      >
        {MOCK_CREATORS.map((creator) => (
          <View key={creator.id} style={styles.card}>
            <Image source={{ uri: creator.image }} style={styles.banner} />
            <LinearGradient 
              colors={['transparent', 'rgba(0,0,0,0.8)']} 
              style={styles.gradient} 
            />
            
            <View style={styles.cardContent}>
              <View style={styles.profileRow}>
                <Image source={{ uri: creator.avatar }} style={styles.avatar} />
                <View>
                  <Text style={styles.creatorName}>{creator.name}</Text>
                  <View style={styles.tagRow}>
                    <Ionicons name="logo-youtube" size={12} color="#FF0000" />
                    <Text style={styles.subCount}>{creator.subscribers} Subs</Text>
                  </View>
                </View>
              </View>

              <View style={styles.actionRow}>
                <TouchableOpacity 
                  onPress={() => handleAction('Collab', creator.name)}
                  style={styles.mainAction}
                >
                  <BlurView intensity={30} tint="light" style={styles.actionBlur}>
                    <MaterialCommunityIcons name="handshake" size={16} color="white" />
                    <Text style={styles.actionText}>Collab Request</Text>
                  </BlurView>
                </TouchableOpacity>

                <TouchableOpacity 
                  onPress={() => handleAction('Brand', creator.name)}
                  style={styles.promoBtn}
                >
                  <BlurView intensity={20} tint="light" style={styles.actionBlur}>
                    <MaterialCommunityIcons name="bullhorn" size={14} color="white" />
                  </BlurView>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

// Internal Import for Gradient to avoid side effects
import { LinearGradient } from 'expo-linear-gradient';

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 12,
    color: '#888',
    fontWeight: '600',
    marginTop: 2,
  },
  seeAll: {
    fontSize: 13,
    fontWeight: '800',
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 20,
    paddingBottom: 10,
  },
  card: {
    width: CARD_WIDTH,
    height: 180,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: '#111',
  },
  banner: {
    ...StyleSheet.absoluteFillObject,
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  cardContent: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 16,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 15,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: 'white',
  },
  creatorName: {
    color: 'white',
    fontSize: 16,
    fontWeight: '900',
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  subCount: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  mainAction: {
    flex: 1,
    height: 40,
    borderRadius: 14,
    overflow: 'hidden',
  },
  promoBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    overflow: 'hidden',
  },
  actionBlur: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  actionText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '800',
  }
});
