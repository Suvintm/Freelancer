import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ContentCard, ContentItem } from './ContentCard';

interface ContentGridProps {
  data: ContentItem[];
  mode?: 'grid' | 'reels';
  columns?: number;
  onItemPress?: (item: ContentItem) => void;
}

export const ContentGrid: React.FC<ContentGridProps> = ({ 
  data, 
  mode = 'grid', 
  columns = 3,
  gap,
  onItemPress 
}) => {
  return (
    <View style={styles.grid}>
      {data.map((item) => (
        <ContentCard 
          key={item.id} 
          item={item} 
          mode={mode}
          columns={columns}
          gap={gap}
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
