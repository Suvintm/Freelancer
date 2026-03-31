import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../../src/constants/Colors';
import { useAuthStore } from '../../../src/store/useAuthStore';
import { useDashboardStore } from '../../../src/store/useDashboardStore';
import { useTheme } from '../../../src/context/ThemeContext';

export default function EditorHomeScreen() {
  const { user, logout } = useAuthStore();
  const { editorStats } = useDashboardStore();
  const { isDarkMode, theme } = useTheme();

  const palette = isDarkMode ? Colors.dark : Colors.light;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.primary }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.welcomeTxt, { color: palette.textSecondary }]}>Welcome back,</Text>
            <Text style={[styles.nameTxt, { color: palette.text }]}>{user?.name || 'Editor'} 🎥</Text>
          </View>
          <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
            <Feather name="log-out" size={16} color={Colors.white} />
            <Text style={styles.logoutTxt}>Log Out</Text>
          </TouchableOpacity>
        </View>

        {/* Editor Role Stats */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: palette.secondary, borderColor: palette.border }]}>
            <Text style={styles.statValue}>{editorStats?.activeOrders || 0}</Text>
            <Text style={[styles.statLabel, { color: palette.textSecondary }]}>Active Orders</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: palette.secondary, borderColor: palette.border }]}>
            <Text style={styles.statValue}>{formatCurrency(editorStats?.monthlyEarnings)}</Text>
            <Text style={[styles.statLabel, { color: palette.textSecondary }]}>This Month</Text>
          </View>
        </View>

        {/* Empty State / Welcome Message */}
        <View style={[styles.welcomeCard, { backgroundColor: palette.secondary, borderColor: palette.border }]}>
          <Feather name="zap" size={40} color={Colors.accent} />
          <Text style={[styles.cardTitle, { color: palette.text }]}>Ready to create?</Text>
          <Text style={[styles.cardSubtitle, { color: palette.textSecondary }]}>
            You are logged in as an EDITOR. Soon you will be able to upload your reels and showcase your skills to clients!
          </Text>
          <TouchableOpacity style={styles.primaryBtn}>
            <Text style={styles.btnTxt}>Start Uploading</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 },
  welcomeTxt: { fontSize: 16, fontWeight: '500' },
  nameTxt: { fontSize: 24, fontWeight: '800' },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 59, 48, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.3)'
  },
  logoutTxt: { color: Colors.white, fontSize: 13, fontWeight: '700', marginLeft: 8 },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  statCard: { flex: 0.48, padding: 20, borderRadius: 20, borderWidth: 1 },
  statValue: { color: Colors.accent, fontSize: 28, fontWeight: '800', marginBottom: 4 },
  statLabel: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase' },
  welcomeCard: { padding: 32, borderRadius: 30, alignItems: 'center', borderWidth: 1 },
  cardTitle: { fontSize: 22, fontWeight: '800', marginTop: 16, marginBottom: 8 },
  cardSubtitle: { fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  primaryBtn: { backgroundColor: Colors.accent, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 16 },
  btnTxt: { color: Colors.dark.primary, fontSize: 16, fontWeight: '700' },
});
