import React, { useMemo } from 'react';
import { useAuthStore } from '../../src/store/useAuthStore';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
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
  const { user, isLoadingUser, isAuthenticated } = useAuthStore();

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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.white} />
        <Text style={styles.loadingText}>Syncing SuviX Profile...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Please login to access SuviX.</Text>
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
    backgroundColor: Colors.dark.primary 
  },
  loadingText: { 
    color: Colors.white, 
    marginTop: 12,
    fontWeight: '600'
  },
  errorText: { 
    color: Colors.dark.textSecondary,
    fontSize: 14
  }
});
