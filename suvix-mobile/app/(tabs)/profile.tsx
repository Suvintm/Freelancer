import React, { useMemo } from 'react';
import { useAuthStore } from '../../src/store/useAuthStore';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useTheme } from '../../src/context/ThemeContext';
import { CATEGORIES } from '../../src/constants/categories';
import { Colors } from '../../src/constants/Colors';
import { CategoryId } from '../../src/types/category';

// Modules
import CreatorProfile from '../../src/modules/creators/profile';
import RentalProfile from '../../src/modules/rentals/profile';
import PromoterProfile from '../../src/modules/promoters/profile';
import EditorProfile from '../../src/modules/editors/profile';
import ClientProfile from '../../src/modules/clients/profile';

/**
 * PRODUCTION-GRADE DYNAMIC PROFILE (Profile Tab)
 * Acts as a "Module Loader" that swaps the UI based on the user's category.
 */
export default function ProfileIndex() {
  const { theme } = useTheme();

  const { user, isLoadingUser, isAuthenticated } = useAuthStore();

  // Determine which module to load based on user metadata
  const activeModule = useMemo(() => {
    if (!user) return null;
    
    // 1. Try to get module from Category metadata
    const categoryId = user.categoryId as CategoryId;
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
    case 'creators':  return <CreatorProfile />;
    case 'rentals':   return <RentalProfile />;
    case 'promoters': return <PromoterProfile />;
    case 'editors':   return <EditorProfile />;
    case 'clients':   return <ClientProfile />;
    default:         return <EditorProfile />;
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
