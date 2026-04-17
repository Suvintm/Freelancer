import React from 'react';
import { View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Skeleton } from '../../../components/shared/Skeleton';
import { useTheme } from '../../../context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

/**
 * PRODUCTION-GRADE PROFILE SKELETON
 * Universal ghost state for Creator, Client, and Fitness profiles.
 * Mimics: Banner -> Avatar -> Stats -> Bio -> Tabs
 */
/**
 * 🧱 SUB-COMPONENT: ProfileSkeletonContent
 * The inner ghost UI without the ScrollView wrapper.
 * Use this for "In-Place" refreshing.
 */
export const ProfileSkeletonContent = () => {
  const { width } = Dimensions.get('window');
  const { theme } = useTheme();

  return (
    <>
      {/* 1. Banner Shimmer */}
      <Skeleton height={120} width="100%" borderRadius={0} />

      <View style={[styles.profileWrap, { backgroundColor: theme.primary }]}>
        {/* 2. Avatar & Stats Row */}
        <View style={styles.headerRow}>
          <View style={styles.avatarContainer}>
            <Skeleton 
              circle 
              height={90} 
              width={90} 
              style={[styles.avatarSkeleton, { borderColor: theme.primary }]} 
            />
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.statsRow}>
              {[1, 2, 3].map((i) => (
                <View key={i} style={styles.statItem}>
                  <Skeleton height={20} width={40} borderRadius={4} />
                  <Skeleton height={10} width={50} borderRadius={2} style={{ marginTop: 6 }} />
                </View>
              ))}
            </View>
            <Skeleton height={36} width="100%" borderRadius={10} style={{ marginTop: 15 }} />
          </View>
        </View>

        {/* 3. Info Block */}
        <View style={styles.infoBlock}>
          <Skeleton height={24} width="50%" borderRadius={6} />
          <Skeleton height={14} width="30%" borderRadius={4} style={{ marginTop: 8 }} />
          <View style={styles.bioContainer}>
             <Skeleton height={14} width="90%" borderRadius={4} style={{ marginTop: 15 }} />
             <Skeleton height={14} width="70%" borderRadius={4} style={{ marginTop: 8 }} />
          </View>
        </View>

        {/* 4. Tabs & Content Shimmer */}
        <View style={styles.tabsRow}>
           <Skeleton height={40} width="30%" borderRadius={8} />
           <Skeleton height={40} width="30%" borderRadius={8} />
           <Skeleton height={40} width="30%" borderRadius={8} />
        </View>

        <View style={styles.contentGrid}>
           <View style={styles.gridRow}>
              <Skeleton height={width / 2.3} width="48%" borderRadius={12} />
              <Skeleton height={width / 2.3} width="48%" borderRadius={12} />
           </View>
           <View style={styles.gridRow}>
              <Skeleton height={width / 2.3} width="48%" borderRadius={12} />
              <Skeleton height={width / 2.3} width="48%" borderRadius={12} />
           </View>
        </View>
      </View>
    </>
  );
};

/**
 * 📦 EXPORT: ProfileSkeleton
 * Full page wrapper with ScrollView (Typically for initial loads).
 */
export const ProfileSkeleton = () => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const headerOffset = insets.top + 50;

  return (
    <View style={[styles.container, { backgroundColor: theme.primary }]}>
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={[styles.content, { paddingTop: headerOffset }]}
      >
        <ProfileSkeletonContent />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: 40,
  },
  profileWrap: {
    paddingHorizontal: 20,
    marginTop: -20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: -40,
    gap: 15,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarSkeleton: {
    borderWidth: 4,
  },
  statsContainer: {
    flex: 1,
    paddingTop: 45,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  infoBlock: {
    marginTop: 20,
  },
  bioContainer: {
    marginTop: 5,
  },
  tabsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
    paddingHorizontal: 10,
  },
  contentGrid: {
    marginTop: 20,
    gap: 15,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  }
});
