import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { MaterialCommunityIcons, FontAwesome5, Ionicons, FontAwesome } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');
const GRID_SPACING = 15;
const ITEM_WIDTH = (width - 40 - GRID_SPACING) / 2;

const SERVICES = [
  { id: 'editors', name: 'Hire Editors', icon: 'movie-edit', iconType: 'MaterialCommunityIcons', color: '#6366f1', sub: 'VFX & Cuts' },
  { id: 'rentals', name: 'Rent Gear', icon: 'camera', iconType: 'FontAwesome5', color: '#f59e0b', sub: 'Cam & Lights' },
  { id: 'singers', name: 'Find Singers', icon: 'microphone-variant', iconType: 'MaterialCommunityIcons', color: '#ec4899', sub: 'Vocals & Art' },
  { id: 'fitness', name: 'Health', icon: 'heartbeat', iconType: 'FontAwesome5', color: '#10b981', sub: 'Pro Trainers' },
];

export const ServiceGrid = () => {
  const { isDarkMode } = useTheme();

  const handlePress = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    console.log('🚀 [EXPLORE] Navigating to service:', id);
  };

  const getIcon = (item: typeof SERVICES[0]) => {
    const color = item.color;
    if (item.iconType === 'MaterialCommunityIcons') {
      return <MaterialCommunityIcons name={item.icon as any} size={28} color={color} />;
    }
    return <FontAwesome5 name={item.icon as any} size={24} color={color} />;
  };

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {SERVICES.map((service) => (
          <TouchableOpacity 
            key={service.id} 
            activeOpacity={0.8}
            onPress={() => handlePress(service.id)}
            style={styles.item}
          >
            <BlurView 
              intensity={isDarkMode ? 25 : 45} 
              tint={isDarkMode ? 'dark' : 'light'} 
              style={styles.blurCard}
            >
              <View style={[styles.iconWrapper, { backgroundColor: `${service.color}15` }]}>
                {getIcon(service)}
              </View>
              <View style={styles.labelWrapper}>
                <Text style={[styles.name, { color: isDarkMode ? 'white' : 'black' }]}>
                  {service.name}
                </Text>
                <Text style={styles.subtext}>
                  {service.sub}
                </Text>
              </View>
              <View style={styles.arrow}>
                <Ionicons name="chevron-forward" size={14} color={isDarkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)'} />
              </View>
            </BlurView>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_SPACING,
  },
  item: {
    width: ITEM_WIDTH,
    height: 110,
  },
  blurCard: {
    flex: 1,
    borderRadius: 24,
    padding: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'space-between',
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  labelWrapper: {
    marginTop: 8,
  },
  name: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  subtext: {
    fontSize: 10,
    color: '#888',
    fontWeight: '600',
    marginTop: 2,
  },
  arrow: {
    position: 'absolute',
    top: 16,
    right: 16,
  }
});
