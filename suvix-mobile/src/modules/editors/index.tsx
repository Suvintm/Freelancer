import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

/**
 * EDITOR DASHBOARD (ROOT)
 * Simplified and optimized for localized component-level animations.
 */
export default function EditorDashboard() {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Professional Desk</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Ready to find your next major editing gig?</Text>
      </View>
      
      <View style={[styles.placeholder, { backgroundColor: theme.secondary }]}>
        <Text style={[styles.placeholderText, { color: theme.textSecondary }]}>Active Orders & Gig Management coming soon...</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 24, paddingTop: 10 },
  title: { fontSize: 28, fontWeight: '800' },
  subtitle: { fontSize: 16, marginTop: 4 },
  placeholder: { margin: 24, marginTop: 10, padding: 40, borderRadius: 20, alignItems: 'center' },
  placeholderText: { textAlign: 'center' },
});
