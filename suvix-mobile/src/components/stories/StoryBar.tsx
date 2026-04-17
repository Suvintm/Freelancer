import React from 'react';
import { 
  View, 
  FlatList, 
  StyleSheet, 
} from 'react-native';
import { Skeleton } from '../shared/Skeleton';
import { StoryCircle } from './StoryCircle';
import { useStories } from '../../hooks/useStories';

/**
 * STORY BAR
 * Provides a high-performance horizontal feed for creator stories.
 */
export const StoryBar = () => {
  const { data, isLoading } = useStories();

  if (isLoading) {
    return (
      <View style={[s.outer, { flexDirection: 'row', paddingLeft: 16 }]}>
        {[1, 2, 3, 4, 5].map((i) => (
          <View key={i} style={{ marginRight: 20, alignItems: 'center' }}>
            <Skeleton circle height={64} width={64} />
            <Skeleton height={10} width={40} style={{ marginTop: 8 }} />
          </View>
        ))}
      </View>
    );
  }

  return (
    <View style={s.outer}>
      <FlatList
        data={data}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item._id}
        contentContainerStyle={s.content}
        removeClippedSubviews
        initialNumToRender={6}
        maxToRenderPerBatch={6}
        windowSize={5}
        getItemLayout={(_, index) => ({
          length: 92,
          offset: 92 * index,
          index,
        })}
        renderItem={({ item }) => (
          <StoryCircle 
            story={item} 
          />
        )}
      />
    </View>
  );
};

const s = StyleSheet.create({
  outer: {
    paddingVertical: 12,
    marginTop: -8, // Tightening with Banner
    backgroundColor: 'transparent',
  },
  content: {
    paddingHorizontal: 8,
  },
  loader: {
    height: 104,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
