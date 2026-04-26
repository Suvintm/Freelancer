import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { MarketplaceSection } from './MarketplaceSection';
import { BlurView } from 'expo-blur';
import { MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

const { width } = Dimensions.get('window');

const CATEGORIES = [
  { id: 'cams', name: 'Cameras', icon: 'camera', type: 'FontAwesome5', color: '#6366f1' },
  { id: 'lights', name: 'Lighting', icon: 'lightbulb-on', type: 'MaterialCommunityIcons', color: '#f59e0b' },
  { id: 'audio', name: 'Audio Gear', icon: 'microphone', type: 'FontAwesome5', color: '#ec4899' },
  { id: 'drones', name: 'Drones', icon: 'drone', type: 'MaterialCommunityIcons', color: '#10b981' },
];

const MOCK_GEAR = [
  { id: 'g1', name: 'Sony A7S III', subtitle: '4K 120fps Camera', price: '₹2500/day', tag: 'HOT', image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=400' },
  { id: 'g2', name: 'DJI Ronin RS3', subtitle: '3-Axis Stabilizer', price: '₹1200/day', image: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?q=80&w=400' },
];

export const RentalView = () => {
  const { isDarkMode, theme } = useTheme();
  
  return (
    <View style={styles.container}>
      <View style={styles.categorySection}>
        <Text style={[styles.sectionTitle, { color: isDarkMode ? 'white' : 'black' }]}>Shop by Category</Text>
        <View style={styles.grid}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity key={cat.id} style={styles.catCard}>
              <BlurView intensity={25} tint={isDarkMode ? 'dark' : 'light'} style={styles.catBlur}>
                <View style={[styles.iconBox, { backgroundColor: `${cat.color}15` }]}>
                  {cat.type === 'FontAwesome5' ? 
                    <FontAwesome5 name={cat.icon} size={20} color={cat.color} /> :
                    <MaterialCommunityIcons name={cat.icon as any} size={24} color={cat.color} />
                  }
                </View>
                <Text style={[styles.catName, { color: isDarkMode ? 'white' : 'black' }]}>{cat.name}</Text>
              </BlurView>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <MarketplaceSection title="Popular Gear" items={MOCK_GEAR} type="RENTAL" />
      <View style={styles.spacer} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  categorySection: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 15,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  catCard: {
    width: (width - 40 - 36) / 4,
    height: 90,
  },
  catBlur: {
    flex: 1,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    gap: 8,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  catName: {
    fontSize: 10,
    fontWeight: '800',
    textAlign: 'center',
  },
  spacer: {
    height: 100,
  }
});
