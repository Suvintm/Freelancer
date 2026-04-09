import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ContentCard, ContentItem } from './ContentCard';

interface ContentGridProps {
  data: ContentItem[];
  onItemPress?: (item: ContentItem) => void;
}

export const ContentGrid: React.FC<ContentGridProps> = ({ data, onItemPress }) => {
  return (
    <View style={styles.grid}>
      {data.map((item) => (
        <ContentCard 
          key={item.id} 
          item={item} 
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
