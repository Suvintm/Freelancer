import React, { useMemo, useCallback } from 'react';
import { useAuthStore } from '../../src/store/useAuthStore';
import { View, Text, ActivityIndicator, StyleSheet, BackHandler } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../src/context/ThemeContext';
import { CATEGORIES } from '../../src/constants/categories';
import { Colors } from '../../src/constants/Colors';
import { CategoryId } from '../../src/types/category';

// Modules
import CreatorDashboard from '../../src/modules/creators';
import RentalDashboard from '../../src/modules/rentals';
import PromoterDashboard from '../../src/modules/promoters';
import EditorDashboard from '../../src/modules/editors';
import ClientDashboard from '../../src/modules/clients';

/**
 * PRODUCTION-GRADE DYNAMIC DASHBOARD (Home Tab)
 * Acts as a "Module Loader" that swaps the UI based on the user's category.
 */
export default function DashboardIndex() {
  const { theme } = useTheme();

  const { user, isLoadingUser, isAuthenticated } = useAuthStore();

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        // Exit app on back press from home
        BackHandler.exitApp();
        return true;
      };

      BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () =>
        BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }, [])
  );

  // Determine which module to load based on user metadata
  const activeModule = useMemo(() => {
    if (!user) return null;
    
    // 1. Try to get module from Category metadata
    const categoryId = user.categoryId as CategoryId | undefined;
    if (categoryId && CATEGORIES[categoryId]) {
      return CATEGORIES[categoryId].defaultModule;
    }

    // 2. Fallback to base role logic
    return user.role === 'client' ? 'clients' : 'editors';
  }, [user]);

  if (isLoadingUser || (isAuthenticated && !user)) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.primary }]}>
        <ActivityIndicator size="large" color={theme.text} />
        <Text style={[styles.loadingText, { color: theme.text }]}>Syncing SuviX Profile...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.primary }]}>
        <Text style={[styles.errorText, { color: theme.textSecondary }]}>Please login to access SuviX.</Text>
      </View>
    );
  }

  // Dynamic Module Rendering
  switch (activeModule) {
    case 'creators':  return <CreatorDashboard />;
    case 'rentals':   return <RentalDashboard />;
    case 'promoters': return <PromoterDashboard />;
    case 'editors':   return <EditorDashboard />;
    case 'clients':   return <ClientDashboard />;
    default:         return <EditorDashboard />;
  }
}

const styles = StyleSheet.create({
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
  },
  loadingText: { 
    marginTop: 12,
    fontWeight: '600'
  },
  errorText: { 
    fontSize: 14
  }
});
