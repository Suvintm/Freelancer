import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

interface GearItem {
  id: string;
  name: string;
  price: string;
  image: string;
  category: string;
}

const MOCK_GEAR: GearItem[] = [
  { id: '1', name: 'Sony A7S III', price: '₹2500/day', category: 'Camera', image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=400' },
  { id: '2', name: 'DJI RS3 Pro', price: '₹1200/day', category: 'Gimbal', image: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?q=80&w=400' },
  { id: '3', name: 'Aputure 600d', price: '₹1800/day', category: 'Lighting', image: 'https://images.unsplash.com/photo-1589134719002-5883506fb95e?q=80&w=400' },
  { id: '4', name: 'Red Komodo 6K', price: '₹8500/day', category: 'Cinema', image: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=400' },
];

export const RentalPodGrid = () => {
  const { isDarkMode } = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: isDarkMode ? 'white' : 'black' }]}>Premium Gear Rentals</Text>
        <TouchableOpacity><Text style={styles.seeAll}>Browse Catalog</Text></TouchableOpacity>
      </View>
      <View style={styles.grid}>
        {MOCK_GEAR.map((item) => (
          <TouchableOpacity key={item.id} style={[styles.card, { backgroundColor: isDarkMode ? '#121212' : '#FFFFFF' }]} activeOpacity={0.9}>
            <View style={styles.imageContainer}>
              <Image source={{ uri: item.image }} style={styles.image} />
              <View style={styles.priceBadge}>
                <Text style={styles.priceText}>{item.price}</Text>
              </View>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryBadgeText}>{item.category}</Text>
              </View>
            </View>
            <View style={styles.info}>
              <Text numberOfLines={1} style={[styles.name, { color: isDarkMode ? 'white' : 'black' }]}>{item.name}</Text>
              <View style={styles.actionRow}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>Available Now</Text>
              </View>
              <TouchableOpacity style={styles.viewBtn}>
                <Text style={styles.viewBtnText}>VIEW GEAR</Text>
                <Ionicons name="arrow-forward" size={12} color="white" />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 20,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  seeAll: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10b981',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
  },
  card: {
    width: '47.8%',
    borderRadius: 24,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 15,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#0A0A0A',
  },
  image: {
    width: '100%',
    height: '100%',
    opacity: 0.85,
  },
  priceBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.95)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  priceText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '900',
  },
  categoryBadge: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  categoryBadgeText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  info: {
    marginTop: 12,
    paddingHorizontal: 4,
  },
  name: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    color: 'gray',
  },
  viewBtn: {
    backgroundColor: '#10b981',
    marginTop: 15,
    height: 36,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  viewBtnText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
