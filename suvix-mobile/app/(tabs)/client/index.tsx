import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../../src/store/useAuthStore';
import { useTheme } from '../../../src/context/ThemeContext';
import { Colors } from '../../../src/constants/Colors';

import { ScreenContainer } from '../../../src/components/shared/ScreenContainer';

export default function ClientHomeScreen() {
  const { user } = useAuthStore();
  const { isDarkMode } = useTheme();

  const palette = isDarkMode ? Colors.dark : Colors.light;

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.welcomeTxt, { color: palette.textSecondary }]}>Welcome back,</Text>
          <Text style={[styles.nameTxt, { color: palette.text }]}>{user?.name || 'Client'} 💼</Text>
        </View>
      </View>

      {/* Empty State / Simplified Home */}
      <View style={styles.emptyState}>
        <View style={[styles.infoCard, { backgroundColor: palette.secondary, borderColor: palette.border }]}>
           <Text style={[styles.infoTxt, { color: palette.textSecondary }]}>
              We are building your personalized experience. Use the sidebar to explore talented editors and manage your profile.
           </Text>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { marginBottom: 32 },
  welcomeTxt: { fontSize: 16, fontWeight: '500' },
  nameTxt: { fontSize: 24, fontWeight: '800' },
  emptyState: {
    marginTop: 20,
    alignItems: 'center',
  },
  infoCard: {
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    width: '100%',
  },
  infoTxt: {
    fontSize: 15,
    lineHeight: 24,
    textAlign: 'center',
    opacity: 0.8,
  }
});
