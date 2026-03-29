import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../../src/constants/Colors';
import { useAuthStore } from '../../../src/store/useAuthStore';

export default function ClientHomeScreen() {
  const { user, logout } = useAuthStore();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeTxt}>Welcome back,</Text>
            <Text style={styles.nameTxt}>{user?.name || 'Client'} 💼</Text>
          </View>
          <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
            <Feather name="log-out" size={16} color={Colors.white} />
            <Text style={styles.logoutTxt}>Log Out</Text>
          </TouchableOpacity>
        </View>

        {/* Client Role Stats Placeholder */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Active Orders</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>₹0</Text>
            <Text style={styles.statLabel}>Total Spent</Text>
          </View>
        </View>

        {/* Empty State / Welcome Message */}
        <View style={styles.welcomeCard}>
          <Feather name="search" size={40} color={Colors.accent} />
          <Text style={styles.cardTitle}>Find your editor?</Text>
          <Text style={styles.cardSubtitle}>
            You are logged in as a CLIENT. Soon you will be able to explore talented editors and hire the best for your projects!
          </Text>
          <TouchableOpacity style={styles.primaryBtn}>
            <Text style={styles.btnTxt}>Explore Editors</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.primary },
  scrollContent: { padding: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 },
  welcomeTxt: { color: Colors.dark.textSecondary, fontSize: 16, fontWeight: '500' },
  nameTxt: { color: Colors.white, fontSize: 24, fontWeight: '800' },
  logoutBtn: { 
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 59, 48, 0.15)', // Subtle red tint
    paddingHorizontal: 16,
    paddingVertical: 10, 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: 'rgba(255, 59, 48, 0.3)' 
  },
  logoutTxt: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 8,
  },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  statCard: { flex: 0.48, backgroundColor: Colors.dark.secondary, padding: 20, borderRadius: 20, borderWidth: 1, borderColor: Colors.dark.border },
  statValue: { color: Colors.accent, fontSize: 28, fontWeight: '800', marginBottom: 4 },
  statLabel: { color: Colors.dark.textSecondary, fontSize: 12, fontWeight: '600', textTransform: 'uppercase' },
  welcomeCard: { backgroundColor: Colors.dark.secondary, padding: 32, borderRadius: 30, alignItems: 'center', borderWidth: 1, borderColor: Colors.dark.border },
  cardTitle: { color: Colors.white, fontSize: 22, fontWeight: '800', marginTop: 16, marginBottom: 8 },
  cardSubtitle: { color: Colors.dark.textSecondary, fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  primaryBtn: { backgroundColor: Colors.accent, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 16 },
  btnTxt: { color: Colors.dark.primary, fontSize: 16, fontWeight: '700' },
});
