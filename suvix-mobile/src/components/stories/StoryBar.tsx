import React from 'react';
import { 
  View, 
  Text,
  FlatList, 
  StyleSheet, 
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { Skeleton } from '../shared/Skeleton';
import { StoryCircle } from './StoryCircle';
import { useStories, StoryItem } from '../../hooks/useStories';
import { useAuthStore } from '../../store/useAuthStore';
import { SUVIX_INDUSTRY_STORIES } from '../../data/suvixStories';

/**
 * STORY BAR
 * Provides a high-performance horizontal feed for creator stories.
 */
interface StoryBarProps {
  isLoading?: boolean;
}

export const StoryBar = ({ isLoading: forcedLoading }: StoryBarProps) => {
  const { data: rawData, isLoading: internalLoading, isFallbackData } = useStories();
  const { theme } = useTheme();
  const { user } = useAuthStore();
  const isLoading = forcedLoading || internalLoading;

  const data = React.useMemo(() => {
    // 🔍 ANALYZE: Check if we have stories from OTHER people (not the current user)
    const othersStories = (rawData || []).filter(s => !s.isUserStory);
    const hasCommunityContent = othersStories.length > 0;

    // 🔗 SOURCE: If no community content, show Industry Mock data. Otherwise, show real rawData.
    const baseList = hasCommunityContent ? rawData : SUVIX_INDUSTRY_STORIES;

    const list = baseList.map(item => ({
      ...item,
      userId: item.userId || item._id, // Ensure internal ID consistency
      hasActiveStory: item.hasActiveStory ?? true,
      isUserStory: item.isUserStory || false,
      isSeen: item.isSeen ?? false,
      slides: (item.slides || []).map(s => ({
        ...s,
        type: (s as any).type || 'IMAGE',
        metadata: (s as any).metadata || {},
        durationMs: (s as any).durationMs || 5000,
        created_at: (s as any).created_at || new Date().toISOString()
      }))
    }));

    // 👻 USER CIRCLE: Find the user's real active story if it exists
    const userActiveStory = (rawData || []).find(s => s.isUserStory);
    const hasUserInMergedList = list.some(s => s.isUserStory);

    // If the user's story is already in the list (because we used rawData), just return the list
    if (hasUserInMergedList || !user) return list;

    // Otherwise, we need to prepend either the REAL active story or the GHOST 'Add' story
    const userCircle: StoryItem = userActiveStory ? {
      ...userActiveStory,
      isUserStory: true
    } : {
      _id: 'user_story_ghost',
      userId: user.id,
      username: 'Your Story',
      avatar: user.profilePicture || null,
      isUserStory: true,
      hasActiveStory: false,
      isSeen: false,
      slides: []
    };

    const finalData = [userCircle, ...list.filter(s => s._id !== userCircle._id)];
    console.log('[StoryBar] Unified Data Count:', finalData.length);
    return finalData;
  }, [rawData, user]);

  if (isLoading) {
    /** ... skeleton remains same ... */
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
