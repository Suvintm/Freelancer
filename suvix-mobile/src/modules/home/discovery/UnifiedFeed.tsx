import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { DashboardSkeleton } from '../skeletons/DashboardSkeleton';
import { FlashList } from '@shopify/flash-list';
import { useDiscoveryStore, FeedItem } from '../../../store/useDiscoveryStore';
import { PostItem } from './items/PostItem';
import { ReelItem } from './items/ReelItem';
import { SuggestionCarousel } from './items/SuggestionCarousel';
import { useTheme } from '../../../context/ThemeContext';

interface UnifiedFeedProps {
  ListHeaderComponent?: React.ComponentType<any> | React.ReactElement | null;
  onScrollBeginDrag?: () => void;
  onScrollEndDrag?: () => void;
}

export const UnifiedFeed = ({ ListHeaderComponent, onScrollBeginDrag, onScrollEndDrag }: UnifiedFeedProps) => {
  const { theme } = useTheme();
  const { feed, isLoading, refreshFeed } = useDiscoveryStore();

  React.useEffect(() => {
    refreshFeed();
  }, []);

  const renderItem = ({ item }: { item: FeedItem }) => {
    switch (item.type) {
      case 'POST':
        return <PostItem data={item.data} />;
      case 'REEL':
        return <ReelItem data={item.data} />;
      case 'SUGGESTION_EDITORS':
        return <SuggestionCarousel type="EDITORS" data={item.data} />;
      case 'SUGGESTION_RENTALS':
        return <SuggestionCarousel type="RENTALS" data={item.data} />;
      default:
        return null;
    }
  };

  if (isLoading && feed.length === 0) {
    return <DashboardSkeleton />;
  }

  return (
    <View style={styles.container}>
      <FlashList
        data={feed}
        renderItem={renderItem}
        estimatedItemSize={400}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        onRefresh={refreshFeed}
        refreshing={isLoading}
        ListHeaderComponent={ListHeaderComponent}
        onScrollBeginDrag={onScrollBeginDrag}
        onScrollEndDrag={onScrollEndDrag}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 500, // Ensure it has height in the ScrollView parent if needed, 
    // but in app/index.tsx it's in a ScrollView. 
    // FlashList inside ScrollView is tricky. 
    // Usually, we replace the parent ScrollView with the FlashList as the ListHeader.
  },
  listContent: {
    paddingBottom: 40,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  }
});
