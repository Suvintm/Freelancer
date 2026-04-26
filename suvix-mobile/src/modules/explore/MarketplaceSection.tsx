import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { BlurView } from 'expo-blur';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import * as Haptics from 'expo-haptics';

interface MarketplaceItem {
  id: string;
  name: string;
  subtitle: string;
  image: string;
  rating?: number;
  price?: string;
  tag?: string;
}

interface MarketplaceSectionProps {
  title: string;
  items: MarketplaceItem[];
  type: 'EDITOR' | 'RENTAL' | 'TALENT';
}

export const MarketplaceSection = ({ title, items, type }: MarketplaceSectionProps) => {
  const { isDarkMode, theme } = useTheme();

  const handlePress = (name: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    console.log(`🔗 [MARKETPLACE] Viewing detail for: ${name}`);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: isDarkMode ? 'white' : 'black' }]}>{title}</Text>
        <TouchableOpacity>
          <Ionicons name="arrow-forward" size={20} color={theme.accent} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {items.map((item) => (
          <TouchableOpacity 
            key={item.id} 
            activeOpacity={0.9}
            onPress={() => handlePress(item.name)}
            style={styles.card}
          >
            <Image source={{ uri: item.image }} style={styles.image} />
            
            {item.tag && (
              <View style={styles.tagBadge}>
                <BlurView intensity={40} tint="dark" style={styles.blurTag}>
                  <Text style={styles.tagText}>{item.tag}</Text>
                </BlurView>
              </View>
            )}

            <BlurView 
              intensity={isDarkMode ? 35 : 55} 
              tint={isDarkMode ? 'dark' : 'light'} 
              style={styles.infoBar}
            >
              <View>
                <Text style={[styles.itemName, { color: isDarkMode ? 'white' : 'black' }]} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.itemSub}>{item.subtitle}</Text>
              </View>

              <View style={styles.metaRow}>
                {item.rating ? (
                  <View style={styles.ratingBadge}>
                    <Ionicons name="star" size={10} color="#f59e0b" />
                    <Text style={styles.ratingText}>{item.rating}</Text>
                  </View>
                ) : item.price ? (
                  <Text style={[styles.priceText, { color: theme.accent }]}>{item.price}</Text>
                ) : null}
              </View>
            </BlurView>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 25,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 15,
  },
  card: {
    width: 160,
    height: 220,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  image: {
    ...StyleSheet.absoluteFillObject,
  },
  tagBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    borderRadius: 8,
    overflow: 'hidden',
  },
  blurTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  tagText: {
    color: 'white',
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  infoBar: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    padding: 12,
    gap: 6,
  },
  itemName: {
    fontSize: 13,
    fontWeight: '800',
  },
  itemSub: {
    fontSize: 10,
    color: '#888',
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 3,
  },
  ratingText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '800',
  },
  priceText: {
    fontSize: 11,
    fontWeight: '900',
  }
});
