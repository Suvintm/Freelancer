import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ContentCard, ContentItem } from './ContentCard';

interface ContentGridProps {
  data: ContentItem[];
  mode?: 'grid' | 'reels';
  onItemPress?: (item: ContentItem) => void;
}

export const ContentGrid: React.FC<ContentGridProps> = ({ data, mode = 'grid', onItemPress }) => {
  return (
    <View style={styles.grid}>
      {data.map((item) => (
        <ContentCard 
          key={item.id} 
          item={item} 
          mode={mode}
          onPress={onItemPress} 
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 2,
    gap: 1,
  }
});
