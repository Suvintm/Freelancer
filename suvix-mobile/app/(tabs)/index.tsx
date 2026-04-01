import React from 'react';
import { useAuthStore } from '../../src/store/useAuthStore';
import ClientDashboard from './client/index';
import EditorDashboard from './editor/index';
import { View, Text, ActivityIndicator } from 'react-native';

/**
 * DYNAMIC DASHBOARD ROUTER (Web Sync)
 * Automatically switches between Client and Editor dashboards based on user role.
 * This is the first tab ("Home").
 */
export default function DashboardIndex() {
  const { user, isLoadingUser, isAuthenticated } = useAuthStore();

  if (isLoadingUser || (isAuthenticated && !user)) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={{ color: '#fff', marginTop: 10 }}>Syncing Profile...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        <Text style={{ color: '#888' }}>Authentication required.</Text>
      </View>
    );
  }

  // Role-Aware Dashboard Logic
  if (user.role === 'client') {
    return <ClientDashboard />;
  }

  return <EditorDashboard />;
}
