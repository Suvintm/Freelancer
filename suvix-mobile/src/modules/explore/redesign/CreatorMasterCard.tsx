import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

interface Channel {
  id: string;
  name: string;
  icon: string;
  subscribers: string;
}

interface CreatorData {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  reach: string;
  bio: string;
  channels: Channel[];
}

const MOCK_CREATORS: CreatorData[] = [
  {
    id: '1',
    name: 'Souvik Suman',
    handle: '@souviksuman_pro',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200',
    reach: '3.7M',
    bio: 'Digital architect and visual storyteller.',
    channels: [
      { id: '1a', name: 'SuviX Tech', icon: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=100', subscribers: '1.2M' },
      { id: '1b', name: 'SuviX Vlogs', icon: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=100', subscribers: '450K' },
    ]
  },
  {
    id: '2',
    name: 'Maya Veda',
    handle: '@mayaveda_cinema',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200',
    reach: '1.5M',
    bio: 'Cinematic colorist and director.',
    channels: [
      { id: '2a', name: 'Veda Films', icon: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=100', subscribers: '1.5M' },
    ]
  },
  {
    id: '3',
    name: 'Rhythm J',
    handle: '@rhythm_j_music',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400',
    reach: '2.8M',
    bio: 'Electronic music producer.',
    channels: [
      { id: '3a', name: 'Rhythm Lab', icon: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=100', subscribers: '2.8M' },
    ]
  },
  {
    id: '4',
    name: 'Gear Guru',
    handle: '@gearguru_hq',
    avatar: 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?q=80&w=200',
    reach: '900K',
    bio: 'Ultimate camera reviews.',
    channels: [
      { id: '4a', name: 'Gear HQ', icon: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=100', subscribers: '900K' },
    ]
  },
  {
    id: '5',
    name: 'VFX Alex',
    handle: '@vfx_alex_3d',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=200',
    reach: '4.2M',
    bio: '3D Artist and Animator.',
    channels: [
      { id: '5a', name: 'Alex VFX', icon: 'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?q=80&w=100', subscribers: '4.2M' },
    ]
  },
];

export const CreatorMasterCard = () => {
  const { isDarkMode } = useTheme();

  return (
    <View style={styles.outerContainer}>
      <View style={styles.mainHeader}>
        <Text style={[styles.mainTitle, { color: isDarkMode ? 'white' : 'black' }]}>Featured Creators</Text>
        <TouchableOpacity><Text style={styles.seeAll}>Discover All</Text></TouchableOpacity>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {MOCK_CREATORS.map((creator) => (
          <View key={creator.id} style={[styles.container, { backgroundColor: isDarkMode ? '#1A1B1E' : '#F8F9FA' }]}>
            <View style={styles.header}>
              <Image source={{ uri: creator.avatar }} style={styles.avatar} />
              <View style={styles.mainInfo}>
                <View style={styles.nameRow}>
                  <Text numberOfLines={1} style={[styles.name, { color: isDarkMode ? 'white' : 'black' }]}>{creator.name}</Text>
                  <MaterialCommunityIcons name="check-decagram" size={16} color="#ef4444" />
                </View>
                <Text style={styles.handle}>{creator.handle}</Text>
                <Text style={styles.stat}>{creator.reach} Reach</Text>
              </View>
            </View>

            <View style={styles.actions}>
              <TouchableOpacity style={styles.subscribeBtn}>
                <Text style={styles.subscribeText}>Subscribe</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.followBtn, { borderColor: isDarkMode ? '#333' : '#E5E7EB' }]}>
                <Ionicons name="person-add" size={16} color={isDarkMode ? 'white' : 'black'} />
              </TouchableOpacity>
            </View>

            <View style={styles.divider} />

            <View style={styles.channelsSection}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.channelsList}>
                {creator.channels.map((ch) => (
                  <View key={ch.id} style={styles.channelItem}>
                    <Image source={{ uri: ch.icon }} style={styles.channelIcon} />
                    <Text style={styles.channelSubs}>{ch.subscribers}</Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    marginVertical: 15,
  },
  mainHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  mainTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  seeAll: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ef4444',
  },
  scrollContent: {
    paddingHorizontal: 15,
    gap: 12,
  },
  container: {
    width: 260,
    borderRadius: 24,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#ef4444',
  },
  mainInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  name: {
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  handle: {
    fontSize: 11,
    color: '#ef4444',
    fontWeight: '700',
    marginTop: 1,
  },
  stat: {
    fontSize: 10,
    color: 'gray',
    fontWeight: '600',
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 15,
  },
  subscribeBtn: {
    flex: 1,
    backgroundColor: '#ef4444',
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subscribeText: {
    color: 'white',
    fontWeight: '800',
    fontSize: 12,
  },
  followBtn: {
    width: 38,
    height: 38,
    borderWidth: 1,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(128,128,128,0.1)',
    marginVertical: 15,
  },
  channelsSection: {
    marginTop: 0,
  },
  channelsList: {
    gap: 10,
  },
  channelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(128,128,128,0.05)',
    paddingRight: 8,
    paddingLeft: 4,
    paddingVertical: 4,
    borderRadius: 8,
  },
  channelIcon: {
    width: 24,
    height: 24,
    borderRadius: 6,
  },
  channelSubs: {
    fontSize: 9,
    color: 'gray',
    fontWeight: '700',
  },
});
