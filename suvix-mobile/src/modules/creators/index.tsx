import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Colors } from '../../constants/Colors';

export default function CreatorDashboard() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Creator Dashboard</Text>
        <Text style={styles.subtitle}>Welcome back, Creator!</Text>
      </View>
      
      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>Creator Stats & Content Insights coming soon...</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.primary },
  header: { padding: 24, paddingTop: 100 },
  title: { color: Colors.white, fontSize: 32, fontWeight: '800' },
  subtitle: { color: Colors.dark.textSecondary, fontSize: 16, marginTop: 4 },
  placeholder: { margin: 24, padding: 40, backgroundColor: Colors.dark.secondary, borderRadius: 20, alignItems: 'center' },
  placeholderText: { color: Colors.dark.textSecondary, textAlign: 'center' },
});
