import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Skeleton } from '../../../components/shared/Skeleton';
import { DashboardSkeleton } from '../skeletons/DashboardSkeleton';
import { FlashList } from '@shopify/flash-list';
import { useDiscoveryStore, FeedItem } from '../../../store/useDiscoveryStore';
import { PostItem } from './items/PostItem';
import { ReelItem } from './items/ReelItem';
import { SuggestionCarousel } from './items/SuggestionCarousel';
import { useTheme } from '../../../context/ThemeContext';
import { RefreshControl } from 'react-native';
import { useRefreshManager } from '../../../hooks/useRefreshManager';

interface UnifiedFeedProps {
  ListHeaderComponent?: React.ComponentType<any> | React.ReactElement | null;
  onScrollBeginDrag?: () => void;
  onScrollEndDrag?: () => void;
}

export const UnifiedFeed = ({ ListHeaderComponent, onScrollBeginDrag, onScrollEndDrag }: UnifiedFeedProps) => {
  const { theme } = useTheme();
  const { feed, isLoading, refreshFeed } = useDiscoveryStore();

  const handleRefresh = useRefreshManager(refreshFeed);

  React.useEffect(() => {
    refreshFeed();
  }, []);

  const displayData = (isLoading && feed.length > 0) 
    ? Array.from({ length: 6 }, (_, i) => ({ id: `skel-${i}`, type: 'SKELETON' as const }))
    : feed;

  const renderItem = ({ item }: { item: any }) => {
    if (item.type === 'SKELETON') {
      return (
        <View style={{ paddingHorizontal: 16, marginBottom: 20 }}>
          <Skeleton height={200} borderRadius={20} />
          <View style={{ marginTop: 12, flexDirection: 'row', gap: 12 }}>
            <Skeleton circle height={40} width={40} />
            <View style={{ flex: 1, gap: 8 }}>
              <Skeleton height={15} width="60%" borderRadius={4} />
              <Skeleton height={10} width="40%" borderRadius={4} />
            </View>
          </View>
        </View>
      );
    }

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
        data={displayData}
        renderItem={renderItem}
        estimatedItemSize={400}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefresh}
            tintColor={theme.isDarkMode ? theme.accent : '#FF3040'}
            colors={[theme.isDarkMode ? theme.accent : '#FF3040']}
            progressViewOffset={80} // Aligns with the TopNavbar space for more immediate response
            progressBackgroundColor={theme.secondary}
          />
        }
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
