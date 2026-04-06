import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Colors } from '../../constants/Colors';
import { UnifiedBanner } from '../../components/home/UnifiedBanner';
import { StoryBar } from '../../components/stories/StoryBar';
import { NearbyExperts } from '../../components/home/NearbyExperts';

export default function EditorDashboard() {
  const { theme } = useTheme();

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.primary }]}>
      <View style={styles.bannerWrapper}>
        <UnifiedBanner pageName="home" />
        <StoryBar />
        <NearbyExperts />
      </View>

      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Editor Dashboard</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Find gigs and manage your editing projects.</Text>
      </View>
      
      <View style={[styles.placeholder, { backgroundColor: theme.secondary }]}>
        <Text style={[styles.placeholderText, { color: theme.textSecondary }]}>Active Orders & Gig Management coming soon...</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  bannerWrapper: {
    paddingTop: 80, // Space for the absolute TopNavbar
  },
  header: { padding: 24, paddingTop: 10 },
  title: { fontSize: 32, fontWeight: '800' },
  subtitle: { fontSize: 16, marginTop: 4 },
  placeholder: { margin: 24, padding: 40, borderRadius: 20, alignItems: 'center' },
  placeholderText: { textAlign: 'center' },
});
