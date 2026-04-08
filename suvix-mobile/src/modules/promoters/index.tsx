import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

export default function PromoterDashboard() {
  const { theme } = useTheme();

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.primary }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Promoter Dashboard</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Scale your reach and manage your campaigns.</Text>
      </View>
      
      <View style={[styles.placeholder, { backgroundColor: theme.secondary }]}>
        <Text style={[styles.placeholderText, { color: theme.textSecondary }]}>Ad Campaigns & Collaboration Requests coming soon...</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 24, paddingTop: 10 },
  title: { fontSize: 32, fontWeight: '800' },
  subtitle: { fontSize: 16, marginTop: 4 },
  placeholder: { margin: 24, padding: 40, borderRadius: 20, alignItems: 'center' },
  placeholderText: { textAlign: 'center' },
});
