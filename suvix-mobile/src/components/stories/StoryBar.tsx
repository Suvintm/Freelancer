import React from 'react';
import { 
  View, 
  FlatList, 
  StyleSheet, 
  ActivityIndicator,
} from 'react-native';
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
      <View style={s.loader}>
        <ActivityIndicator color="rgba(255,255,255,0.3)" />
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
