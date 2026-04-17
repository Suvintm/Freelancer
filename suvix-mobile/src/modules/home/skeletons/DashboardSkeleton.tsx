import React from 'react';
import { View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Skeleton } from '../../../components/shared/Skeleton';
import { useTheme } from '../../../context/ThemeContext';

const { width } = Dimensions.get('window');

/**
 * PRODUCTION-GRADE DASHBOARD SKELETON
 * Mimics the Home layout (Banner -> Stories -> Header -> Cards)
 */
/**
 * 🧱 SUB-COMPONENT: DashboardSkeletonContent
 * The inner ghost UI for the Home dashboard.
 * Used for "In-Place" reloading.
 */
export const DashboardSkeletonContent = () => {
  const { width } = Dimensions.get('window');
  return (
    <>
      {/* 2. Banner Shimmer */}
      <View style={styles.section}>
        <Skeleton height={200} borderRadius={24} width={width - 32} />
      </View>

      {/* 3. Story Bar Shimmer */}
      <View style={styles.storyRow}>
        {[1, 2, 3, 4, 5].map((i) => (
          <View key={i} style={styles.storyItem}>
            <Skeleton circle height={65} width={65} />
            <Skeleton height={10} width={40} style={{ marginTop: 8 }} />
          </View>
        ))}
      </View>

      {/* 4. Welcome Text Shimmer */}
      <View style={styles.headerTextSection}>
        <Skeleton height={25} width="60%" borderRadius={6} />
        <Skeleton height={14} width="40%" borderRadius={4} style={{ marginTop: 8 }} />
      </View>

      {/* 5. Feature Gallery Simulation */}
      <View style={styles.galleryRow}>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} height={120} width={width / 2.4} borderRadius={20} style={{ marginRight: 16 }} />
        ))}
      </View>

      {/* 6. Feed Item Shimmers */}
      <View style={styles.headerTextSection}>
          <Skeleton height={20} width="35%" borderRadius={4} />
      </View>
      
      <View style={styles.feedRow}>
         <Skeleton height={180} width="47%" borderRadius={16} />
         <Skeleton height={180} width="47%" borderRadius={16} />
      </View>
    </>
  );
};

/**
 * 📦 EXPORT: DashboardSkeleton
 * Full page wrapper with ScrollView.
 */
export const DashboardSkeleton = () => {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.primary }]}>
      {/* 1. Header Spacer + Progress Navbar Simulation */}
      <View style={{ height: 60 }} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <DashboardSkeletonContent />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  storyRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  storyItem: {
    marginRight: 20,
    alignItems: 'center',
  },
  headerTextSection: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  galleryRow: {
    flexDirection: 'row',
    paddingLeft: 16,
    marginBottom: 30,
  },
  feedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 10,
  }
});
