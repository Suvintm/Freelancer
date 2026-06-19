import React from 'react';
import { 
  View, 
  Text,
  FlatList, 
  StyleSheet, 
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { Plus } from 'lucide-react-native';
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
  layout?: 'horizontal' | 'vertical';
  width?: number;
  height?: number;
  isHomeScrolling?: boolean;
  onScrollBeginDrag?: () => void;
  onScrollEndDrag?: () => void;
}

export const StoryBar = ({ 
  isLoading: forcedLoading, 
  layout = 'horizontal', 
  width, 
  height,
  isHomeScrolling,
  onScrollBeginDrag,
  onScrollEndDrag
}: StoryBarProps) => {
  const { data: rawData, isLoading: internalLoading, isFallbackData } = useStories();
  const { theme, isDarkMode } = useTheme();
  const { user } = useAuthStore();
  const isLoading = forcedLoading || internalLoading;
  
  const listRef = React.useRef<FlatList>(null);

  React.useEffect(() => {
    if (isHomeScrolling && isVertical && listRef.current) {
      listRef.current.scrollToOffset({ offset: 0, animated: true });
    }
  }, [isHomeScrolling]);

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

  const isVertical = layout === 'vertical';

  if (isLoading) {
    if (isVertical) {
      return (
        <View style={[s.outerVertical, { width, height, backgroundColor: isDarkMode ? '#242526' : '#C8CBD0', alignItems: 'center' }]}>
          {[1, 2, 3, 4].map((i) => (
            <View key={i} style={{ marginBottom: 14, alignItems: 'center' }}>
              <Skeleton circle height={56} width={56} />
              <Skeleton height={8} width={36} style={{ marginTop: 6 }} />
            </View>
          ))}
        </View>
      );
    }
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
    <View 
      style={isVertical ? [s.outerVertical, { width, height, backgroundColor: isDarkMode ? '#242526' : '#C8CBD0' }] : s.outer}
      onTouchStart={onScrollBeginDrag}
      onTouchEnd={onScrollEndDrag}
      onTouchCancel={onScrollEndDrag}
    >
      {isVertical && (
        <View style={[s.floatingPlus, { transform: [{ rotate: '-12deg' }] }]} pointerEvents="none">
          <Plus 
            size={28} 
            strokeWidth={4.5} 
            color={isDarkMode ? 'rgba(255,255,255,0.95)' : 'rgba(90,90,90,0.85)'} 
          />
        </View>
      )}
      {isVertical ? (
        <View style={{ flex: 1, width: '100%', overflow: 'hidden', borderTopLeftRadius: 40, borderBottomLeftRadius: 40 }}>
          <FlatList
            ref={listRef}
            data={data}
            horizontal={!isVertical}
            nestedScrollEnabled={true}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            keyExtractor={(item) => item._id}
            contentContainerStyle={isVertical ? s.contentVertical : s.content}
            removeClippedSubviews
            initialNumToRender={isVertical ? 6 : 6}
            maxToRenderPerBatch={isVertical ? 6 : 6}
            windowSize={5}
            getItemLayout={(_, index) => ({
              length: isVertical ? 80 : 92,
              offset: (isVertical ? 80 : 92) * index,
              index,
            })}
            renderItem={({ item }) => (
              <StoryCircle 
                story={item} 
                layout={layout}
              />
            )}
          />
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={data}
          horizontal={!isVertical}
          nestedScrollEnabled={true}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          keyExtractor={(item) => item._id}
          contentContainerStyle={isVertical ? s.contentVertical : s.content}
          removeClippedSubviews
          initialNumToRender={isVertical ? 6 : 6}
          maxToRenderPerBatch={isVertical ? 6 : 6}
          windowSize={5}
          getItemLayout={(_, index) => ({
            length: isVertical ? 80 : 92,
            offset: (isVertical ? 80 : 92) * index,
            index,
          })}
          renderItem={({ item }) => (
            <StoryCircle 
              story={item} 
              layout={layout}
            />
          )}
        />
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
  outerVertical: {
    borderTopLeftRadius: 40,
    borderBottomLeftRadius: 40,
    alignItems: 'center',
    position: 'relative',
    height: '100%',
  },
  floatingPlus: {
    position: 'absolute',
    top: -12,
    left: 12,
    zIndex: 10,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    paddingHorizontal: 8,
  },
  contentVertical: {
    alignItems: 'center',
    paddingBottom: 20,
    paddingTop: 16,
  },
  loader: {
    height: 104,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
