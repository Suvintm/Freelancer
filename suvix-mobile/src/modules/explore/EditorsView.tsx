import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { MarketplaceSection } from './MarketplaceSection';
import { useTheme } from '../../context/ThemeContext';

const MOCK_NEARBY = [
  { id: 'n1', name: 'Pro Cuts Studio', subtitle: '2km away • Fast delivery', rating: 4.9, tag: 'NEARBY', image: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=400' },
  { id: 'n2', name: 'VFX Lab', subtitle: '5km away • High end', rating: 4.7, image: 'https://images.unsplash.com/photo-1540331547168-8b63109225b7?q=80&w=400' },
];

const MOCK_ALL = [
  { id: 'e1', name: 'Alex VFX', subtitle: 'After Effects Expert', rating: 4.9, tag: 'PRO', image: 'https://images.unsplash.com/photo-1540331547168-8b63109225b7?q=80&w=400' },
  { id: 'e2', name: 'Studio Flow', subtitle: 'Premiere Pro Specialist', rating: 4.8, tag: 'TOP', image: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=400' },
];

export const EditorsView = () => {
  const { isDarkMode } = useTheme();
  
  return (
    <View style={styles.container}>
      <MarketplaceSection title="Editors Near You" items={MOCK_NEARBY} type="EDITOR" />
      <MarketplaceSection title="All Top Editors" items={MOCK_ALL} type="EDITOR" />
      <View style={styles.spacer} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  spacer: {
    height: 100,
  }
});
