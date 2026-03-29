import React from 'react';
import { useAuthStore } from '../../src/store/useAuthStore';
import ClientDashboard from './client/index';
import EditorDashboard from './editor/index';
import { View, Text } from 'react-native';

/**
 * DYNAMIC DASHBOARD ROUTER (Web Sync)
 * Automatically switches between Client and Editor dashboards based on user role.
 * This is the first tab ("Home").
 */
export default function DashboardIndex() {
  const { user } = useAuthStore();

  if (!user) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Please sign in to view your dashboard</Text>
      </View>
    );
  }

  // Role-Aware Dashboard Logic
  if (user.role === 'client') {
    return <ClientDashboard />;
  }

  return <EditorDashboard />;
}
