import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../../context/ThemeContext';

const { width } = Dimensions.get('window');

const FEATURED_STUDIOS = [
  {
    id: 's1',
    name: 'Prism Studios',
    specialty: 'Cinematic VFX & Color',
    rating: '5.0',
    reviews: '124',
    image: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=600',
    tags: ['VFX', 'COLOR', '4K'],
  },
  {
    id: 's2',
    name: 'Velocity Edits',
    specialty: 'High-Energy Reels',
    rating: '4.9',
    reviews: '89',
    image: 'https://images.unsplash.com/photo-1574717024453-354056afd6ac?q=80&w=600',
    tags: ['REELS', 'TRANSITIONS'],
  }
];

const SKILL_CATEGORIES = [
  { id: 'c1', label: 'VFX', icon: 'flash' },
  { id: 'c2', label: 'Color', icon: 'color-palette' },
  { id: 'c3', label: 'Motion', icon: 'move' },
  { id: 'c4', label: 'Shorts', icon: 'phone-portrait' },
  { id: 'c5', label: 'YouTube', icon: 'logo-youtube' },
];

const MASTER_EDITORS = [
  {
    id: 'e1',
    name: 'Julian Vance',
    role: 'Master Colorist',
    verified: true,
    price: '₹5000/min',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200',
    portfolio: [
      'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=300',
      'https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=300',
      'https://images.unsplash.com/photo-1478720568477-152d9b164e26?q=80&w=300',
    ]
  },
  {
    id: 'e2',
    name: 'Elena Rose',
    role: 'VFX Supervisor',
    verified: true,
    price: '₹8500/min',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200',
    portfolio: [
      'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=300',
      'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=300',
      'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?q=80&w=300',
    ]
  }
];

export const EditorDiscovery = () => {
  const { isDarkMode } = useTheme();

  return (
    <View style={styles.container}>
      {/* 🏙️ Spotlight Billboard (Featured Studios) */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: isDarkMode ? 'white' : 'black' }]}>Spotlight Studios</Text>
        <TouchableOpacity><Text style={styles.seeAll}>See All</Text></TouchableOpacity>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
        {FEATURED_STUDIOS.map(studio => (
          <TouchableOpacity key={studio.id} style={styles.billboardCard} activeOpacity={0.9}>
            <Image source={{ uri: studio.image }} style={styles.billboardImage} />
            <LinearGradient colors={['transparent', 'rgba(0,0,0,0.9)']} style={styles.billboardOverlay}>
              <View style={styles.billboardInfo}>
                <View style={styles.tagRow}>
                  {studio.tags.map(tag => (
                    <View key={tag} style={styles.studioTag}><Text style={styles.studioTagText}>{tag}</Text></View>
                  ))}
                </View>
                <Text style={styles.billboardName}>{studio.name}</Text>
                <Text style={styles.billboardSpecialty}>{studio.specialty}</Text>
                <View style={styles.ratingRow}>
                  <Ionicons name="star" size={12} color="#FBBF24" />
                  <Text style={styles.ratingText}>{studio.rating} • {studio.reviews} reviews</Text>
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ⚙️ Specialty Engine (Skills) */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.skillScroll}>
        {SKILL_CATEGORIES.map(category => (
          <TouchableOpacity key={category.id} style={[styles.skillChip, { backgroundColor: isDarkMode ? '#121212' : '#F3F4F6' }]}>
            <Ionicons name={category.icon as any} size={14} color={isDarkMode ? '#a855f7' : '#7c3aed'} />
            <Text style={[styles.skillText, { color: isDarkMode ? 'white' : 'black' }]}>{category.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* 💎 Master Editor Nexus (The New Showreel Grid) */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: isDarkMode ? 'white' : 'black' }]}>Elite Master Editors</Text>
      </View>
      <View style={styles.editorList}>
        {MASTER_EDITORS.map(editor => (
          <View key={editor.id} style={[styles.editorCard, { backgroundColor: isDarkMode ? '#121212' : 'white' }]}>
            <View style={styles.editorProfileRow}>
              <View style={styles.avatarContainer}>
                <Image source={{ uri: editor.avatar }} style={styles.avatar} />
                {editor.verified && <View style={styles.verifiedBadge}><Ionicons name="checkmark" size={8} color="white" /></View>}
              </View>
              <View style={styles.editorMeta}>
                <Text style={[styles.editorName, { color: isDarkMode ? 'white' : 'black' }]}>{editor.name}</Text>
                <Text style={styles.editorRole}>{editor.role}</Text>
              </View>
              <View style={styles.pricePod}>
                <Text style={styles.priceText}>{editor.price}</Text>
              </View>
            </View>

            {/* 🎞️ Portfolio Previews */}
            <View style={styles.portfolioGrid}>
              {editor.portfolio.map((img, i) => (
                <Image key={i} source={{ uri: img }} style={styles.portfolioImage} />
              ))}
            </View>

            <View style={styles.editorActions}>
              <TouchableOpacity style={styles.viewBtn}>
                <Text style={styles.viewBtnText}>VIEW SHOWREEL</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.hireBtn, { backgroundColor: '#a855f7' }]}>
                <Text style={styles.hireBtnText}>HIRE STUDIO</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: 40,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 15,
    marginTop: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  seeAll: {
    fontSize: 12,
    fontWeight: '700',
    color: '#a855f7',
  },
  horizontalScroll: {
    paddingLeft: 20,
    gap: 15,
  },
  billboardCard: {
    width: width * 0.75,
    height: 180,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#1A1A1A',
  },
  billboardImage: {
    width: '100%',
    height: '100%',
  },
  billboardOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    padding: 15,
  },
  billboardInfo: {
    gap: 4,
  },
  tagRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 4,
  },
  studioTag: {
    backgroundColor: 'rgba(168, 85, 247, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.3)',
  },
  studioTagText: {
    color: '#d8b4fe',
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  billboardName: {
    color: 'white',
    fontSize: 18,
    fontWeight: '800',
  },
  billboardSpecialty: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '600',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  ratingText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 10,
    fontWeight: '700',
  },
  skillScroll: {
    paddingLeft: 20,
    paddingVertical: 20,
    gap: 10,
  },
  skillChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  skillText: {
    fontSize: 13,
    fontWeight: '700',
  },
  editorList: {
    paddingHorizontal: 20,
    gap: 20,
  },
  editorCard: {
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  editorProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2A2A2A',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#a855f7',
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#0A0A0A',
  },
  editorMeta: {
    flex: 1,
  },
  editorName: {
    fontSize: 15,
    fontWeight: '800',
  },
  editorRole: {
    fontSize: 12,
    color: 'gray',
    fontWeight: '600',
  },
  pricePod: {
    backgroundColor: 'rgba(168, 85, 247, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  priceText: {
    color: '#a855f7',
    fontSize: 11,
    fontWeight: '800',
  },
  portfolioGrid: {
    flexDirection: 'row',
    gap: 8,
    height: 90,
    marginBottom: 16,
  },
  portfolioImage: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: '#1A1A1A',
  },
  editorActions: {
    flexDirection: 'row',
    gap: 10,
  },
  viewBtn: {
    flex: 1,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  viewBtnText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  hireBtn: {
    flex: 1.4,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hireBtnText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
