import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAuthStore } from '../src/store/useAuthStore';
import * as Haptics from 'expo-haptics';

export default function BannedScreen() {
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await logout();
    router.replace('/welcome');
  };

  return (
    <View style={styles.container}>
      {/* Background Decor */}
      <View style={[styles.glow, { top: -100, right: -100, backgroundColor: '#FF3B3022' }]} />
      <View style={[styles.glow, { bottom: -100, left: -100, backgroundColor: '#FF950011' }]} />

      <SafeAreaView style={styles.content}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <View style={styles.iconBackground}>
              <Feather name="shield-off" size={60} color="#FF3B30" />
            </View>
          </View>
          
          <Text style={styles.title}>Account Suspended</Text>
          <Text style={styles.subtitle}>
            Your access to SuviX has been restricted due to a violation of our community guidelines.
          </Text>
        </View>

        <View style={styles.detailsBox}>
          <View style={styles.detailsContent}>
            <View style={styles.detailRow}>
              <Feather name="info" size={20} color="#FF3B30" />
              <Text style={styles.detailText}>Reason: Community Policy Violation</Text>
            </View>
            <View style={styles.detailRow}>
              <Feather name="clock" size={20} color="#999" />
              <Text style={styles.detailText}>Duration: Permanent</Text>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.contactButton}
            onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
          >
            <Text style={styles.contactButtonText}>Contact Support</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <Text style={styles.logoutButtonText}>Sign Out & Exit</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  glow: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: 200,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#FF3B3044',
  },
  iconBackground: {
    flex: 1,
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  detailsBox: {
    marginVertical: 40,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  detailsContent: {
    padding: 24,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  detailText: {
    color: '#EEE',
    fontSize: 15,
    fontWeight: '500',
  },
  footer: {
    gap: 12,
    marginBottom: 20,
  },
  contactButton: {
    backgroundColor: '#FFF',
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
  },
  logoutButton: {
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.4)',
  },
  logoutButtonText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '600',
  },
});

