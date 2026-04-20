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
import { PremiumNativeAd } from '../../../components/ads/PremiumNativeAd';
import { useAdPool } from '../../../hooks/useAdPool';
import { useStories } from '../../../hooks/useStories';

interface UnifiedFeedProps {
  ListHeaderComponent?: React.ComponentType<any> | React.ReactElement | null;
  onScrollBeginDrag?: () => void;
  onScrollEndDrag?: () => void;
}

export const UnifiedFeed = ({ ListHeaderComponent, onScrollBeginDrag, onScrollEndDrag }: UnifiedFeedProps) => {
  const { theme } = useTheme();
  const { feed, isLoading, refreshFeed } = useDiscoveryStore();
  const { refetch: refetchStories } = useStories();
  const NATIVE_AD_UNIT_ID = process.env.EXPO_PUBLIC_ADMOB_NATIVE_UNIT_ID || 'ca-app-pub-3940256099942544/2247696110';

  // 🏊‍♂️ 1. AD POOL MANAGER (Preloads 5 ads)
  const { ads, refreshAds } = useAdPool(NATIVE_AD_UNIT_ID, 5);

  const handleRefresh = useRefreshManager(() => {
    refreshAds();
    refreshFeed();
    refetchStories();
  });

  React.useEffect(() => {
    refreshFeed();
  }, []);

  const displayData = React.useMemo(() => {
    const baseData = (isLoading && feed.length > 0) 
      ? Array.from({ length: 6 }, (_, i) => ({ id: `skel-${i}`, type: 'SKELETON' as const }))
      : feed;
    
    // 🧬 Interleave 5 Ad Slots every 3 items, regardless of pool state
    const dataWithAds: any[] = [];
    let injectedAds = 0;

    baseData.forEach((item, index) => {
      dataWithAds.push(item);
      
      // Inject an AD slot every 3 items up to 5 total
      if ((index + 1) % 3 === 0 && injectedAds < 5) {
        dataWithAds.push({ 
          id: `ad-${index}`, 
          type: 'AD', 
          adData: ads[injectedAds] || null // Pass the ad if ready, otherwise null (loading state)
        });
        injectedAds++;
      }
    });

    // If we have remaining slots to fill ensure we have 5 total
    while (injectedAds < 5) {
      dataWithAds.push({
        id: `ad-extra-${injectedAds}`,
        type: 'AD',
        adData: ads[injectedAds] || null
      });
      injectedAds++;
    }

    return dataWithAds;
  }, [feed, isLoading, ads]);

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
      case 'AD':
        return <PremiumNativeAd preloadedAd={item.adData} />;
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
