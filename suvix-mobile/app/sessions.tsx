/**
 * sessions.tsx — Active Sessions Manager
 *
 * Provides a production-grade interface for users to:
 * - See all devices currently logged into their account
 * - View details like IP address, last active time, and device type
 * - Remotely revoke a session (security feature)
 */
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { api } from '../src/api/client';
import { useTheme } from '../src/context/ThemeContext';

interface Session {
  id: string;
  deviceName?: string;
  userAgent?: string;
  ip?: string;
  lastActive: string;
  isCurrent: boolean;
}

export default function SessionsScreen() {
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const bg = isDarkMode ? '#0A0A0A' : '#F4F4F5';
  const cardBg = isDarkMode ? '#141414' : '#FFFFFF';
  const textColor = isDarkMode ? '#F9FAFB' : '#111827';
  const subColor = isDarkMode ? '#9CA3AF' : '#6B7280';
  const divider = isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const accent = '#8B5CF6';

  const fetchSessions = async () => {
    try {
      const res = await api.get('/auth/sessions');
      if (res.data.success) {
        setSessions(res.data.sessions);
      }
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleRevoke = (sessionId: string, deviceName?: string) => {
    Alert.alert(
      'Revoke Session?',
      `Are you sure you want to log out of "${deviceName || 'this device'}" remotely?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Revoke',
          style: 'destructive',
          onPress: async () => {
            setRevokingId(sessionId);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            try {
              await api.delete(`/auth/sessions/${sessionId}`);
              setSessions(prev => prev.filter(s => s.id !== sessionId));
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (err) {
              console.error('Failed to revoke session:', err);
              Alert.alert('Error', 'Could not revoke session. Please try again.');
            } finally {
              setRevokingId(null);
            }
          },
        },
      ]
    );
  };

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: divider }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textColor }]}>Active Sessions</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchSessions(); }} />
        }
      >
        <View style={styles.infoBox}>
          <Ionicons name="shield-checkmark" size={20} color={accent} />
          <Text style={[styles.infoText, { color: subColor }]}>
            These are devices that have recently logged into your account. You can log out of any session remotely if you don't recognize it.
          </Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={accent} style={{ marginTop: 40 }} />
        ) : (
          sessions.map((session, index) => (
            <View key={session.id} style={[styles.sessionCard, { backgroundColor: cardBg }]}>
              <View style={styles.itemRow}>
                {/* Icon based on platform or device */}
                <View style={[styles.iconWrap, { backgroundColor: isDarkMode ? '#27272a' : '#f4f4f5' }]}>
                  {session.userAgent?.includes('iPhone') || session.userAgent?.includes('Android') ? (
                    <MaterialCommunityIcons name="cellphone" size={22} color={accent} />
                  ) : (
                    <MaterialCommunityIcons name="laptop" size={22} color={accent} />
                  )}
                </View>

                <View style={styles.sessionInfo}>
                  <View style={styles.titleRow}>
                    <Text style={[styles.deviceName, { color: textColor }]} numberOfLines={1}>
                      {session.deviceName || session.userAgent?.split(' ')[0] || 'Unknown Device'}
                    </Text>
                    {session.isCurrent && (
                      <View style={styles.currentPill}>
                        <Text style={styles.currentText}>Current</Text>
                      </View>
                    )}
                  </View>
                  
                  <Text style={[styles.metadata, { color: subColor }]}>
                    {session.ip || 'Unknown IP'} • {new Date(session.lastActive).toLocaleDateString()}
                  </Text>
                  <Text style={[styles.userAgent, { color: subColor }]} numberOfLines={1}>
                    {session.userAgent || 'SuviX Mobile App'}
                  </Text>
                </View>

                {!session.isCurrent && (
                  <TouchableOpacity
                    onPress={() => handleRevoke(session.id, session.deviceName)}
                    disabled={revokingId === session.id}
                    style={styles.revokeBtn}
                  >
                    {revokingId === session.id ? (
                      <ActivityIndicator size="small" color="#EF4444" />
                    ) : (
                      <Ionicons name="log-out-outline" size={20} color="#EF4444" />
                    )}
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))
        )}

        {!loading && sessions.length === 0 && (
          <View style={styles.empty}>
            <Text style={{ color: subColor }}>No active sessions found.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 6 },
  headerTitle: { fontSize: 17, fontWeight: '800', letterSpacing: -0.3 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  infoBox: {
    flexDirection: 'row',
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#8B5CF610',
    marginBottom: 20,
    gap: 12,
  },
  infoText: { flex: 1, fontSize: 13, lineHeight: 18, fontWeight: '500' },
  sessionCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  iconWrap: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  sessionInfo: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  deviceName: { fontSize: 15, fontWeight: '700' },
  currentPill: { backgroundColor: '#10B98120', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  currentText: { fontSize: 10, fontWeight: '800', color: '#10B981' },
  metadata: { fontSize: 12, fontWeight: '600' },
  userAgent: { fontSize: 11, fontWeight: '500', marginTop: 2, opacity: 0.8 },
  revokeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EF444410',
    justifyContent: 'center',
    alignItems: 'center',
  },
  empty: { marginTop: 60, alignItems: 'center' },
});
