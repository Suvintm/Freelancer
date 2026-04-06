import React from 'react';
import { 
  View, 
  FlatList, 
  StyleSheet, 
  ActivityIndicator,
  Text
} from 'react-native';
import { StoryCircle } from './StoryCircle';
import { useStories, StoryItem } from '../../hooks/useStories';

export const StoryBar = () => {
  const { data, isLoading } = useStories();

  const handlePress = (story: StoryItem) => {
    console.log(`[STORY_TAP] ${story.username} - ID: ${story._id}`);
    // Future: Navigation to Story Viewer
  };

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
        renderItem={({ item }) => (
          <StoryCircle 
            story={item} 
            onPress={handlePress} 
          />
        )}
      />
    </View>
  );
};

const s = StyleSheet.create({
  outer: {
    paddingVertical: 12,
    backgroundColor: 'transparent',
  },
  content: {
    paddingHorizontal: 8, // Center-aligned appearance
  },
  loader: {
    height: 104,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
