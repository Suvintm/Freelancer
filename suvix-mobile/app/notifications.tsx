import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../src/context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * PRODUCTION-GRADE NOTIFICATIONS PAGE
 * Immersive, professional layout for managing platform alerts and updates.
 */
export default function NotificationsPage() {
  const { theme, isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Mock Notification Data
  const NOTIFICATIONS = [
    { id: '1', title: 'New Gig Alert', desc: 'A new video editing project matching your skills was posted.', time: '2m ago', icon: 'briefcase', color: '#3b82f6', isNew: true },
    { id: '2', title: 'Payment Success', desc: 'Your earnings for the "SuviX Promo" have been deposited.', time: '1h ago', icon: 'cash', color: '#10b981', isNew: false },
    { id: '3', title: 'Profile Views', desc: 'Your profile saw a 20% increase in traffic this week.', time: '5h ago', icon: 'trending-up', color: '#8b5cf6', isNew: false },
    { id: '4', title: 'System Update', desc: 'SuviX Mobile v2.1 is now live with better HLS streaming.', time: '1d ago', icon: 'rocket', color: '#f59e0b', isNew: false },
  ];

  return (
    <View style={[s.container, { backgroundColor: theme.primary }]}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* ─── CUSTOM HEADER ─── */}
      <View style={[s.header, { paddingTop: insets.top + 10, backgroundColor: theme.tabBar }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
           <Ionicons name="chevron-back" size={28} color={theme.text} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: theme.text }]}>Notifications</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={{ paddingBottom: 40 }}>
        {NOTIFICATIONS.map((item) => (
          <TouchableOpacity 
            key={item.id} 
            style={[s.item, { borderBottomColor: theme.border }]}
            activeOpacity={0.7}
          >
            <View style={[s.iconBox, { backgroundColor: item.color + '15' }]}>
               <Ionicons name={item.icon as any} size={22} color={item.color} />
            </View>
            
            <View style={s.content}>
               <View style={s.row}>
                  <Text style={[s.title, { color: theme.text }]}>{item.title}</Text>
                  {item.isNew && <View style={s.newBadge} />}
               </View>
               <Text style={[s.desc, { color: theme.textSecondary }]}>{item.desc}</Text>
               <Text style={[s.time, { color: theme.textSecondary }]}>{item.time}</Text>
            </View>
          </TouchableOpacity>
        ))}
        
        <View style={s.footer}>
           <Text style={[s.footerTxt, { color: theme.textSecondary }]}>That's all for now!</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 0,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerTitle: { fontSize: 18, fontWeight: '800', letterSpacing: -0.5 },
  backBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  
  scroll: { flex: 1 },
  item: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 0.5,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  content: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  title: { fontSize: 15, fontWeight: '700' },
  desc: { fontSize: 13, lineHeight: 18, marginBottom: 6 },
  time: { fontSize: 11, fontWeight: '600', opacity: 0.6 },
  newBadge: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#3b82f6' },
  
  footer: { padding: 40, alignItems: 'center' },
  footerTxt: { fontSize: 13, fontWeight: '600', opacity: 0.5 }
});
