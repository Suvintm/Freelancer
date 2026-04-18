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
    const hasUserStory = (rawData || []).some(s => s.isUserStory);
    if (hasUserStory || !user) return rawData || [];

    // Prepend a 'Ghost' Story Circle for adding
    const ghostUserStory: StoryItem = {
      _id: 'user_story_ghost',
      username: 'Your Story',
      avatar: user.profilePicture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150',
      isUserStory: true,
      hasActiveStory: false,
      slides: []
    };
    return [ghostUserStory, ...(rawData || [])];
  }, [rawData, user]);

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

      {isFallbackData && (
        <View style={[s.fallbackCard, { backgroundColor: theme.secondary, borderColor: theme.border }]}>
          <View style={[s.iconBox, { backgroundColor: theme.primary }]}>
            <MaterialCommunityIcons name="cards-playing-outline" size={18} color={theme.text} />
          </View>
          <View style={s.fallbackTextWrapper}>
            <Text style={[s.fallbackTitle, { color: theme.text }]}>Showcase Stories</Text>
            <Text style={[s.fallbackSubtitle, { color: theme.textSecondary }]}>
              Follow friends and experts to start seeing their stories here.
            </Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={18} color={theme.textSecondary} />
        </View>
      )}
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
  fallbackCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 10,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackTextWrapper: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  fallbackTitle: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 2,
  },
  fallbackSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 16,
  },
});
