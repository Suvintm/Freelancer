import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  ImageBackground,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useNearbyExperts } from '../../hooks/useNearbyExperts';
import { ExpertNearCard } from './ExpertNearCard';
import { useRouter } from 'expo-router';

const { width: SW } = Dimensions.get('window');

export const NearbyExperts = () => {
  const { theme, isDarkMode } = useTheme();
  const { experts, isLoading, error, permissionStatus, isModuleAvailable } = useNearbyExperts();
  const router = useRouter();

  // ─── Main Nearby Stream ──────────────────────────────────────────────────
  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={[s.title, { color: theme.text }]}>EXPERTS NEAR YOU</Text>
        <TouchableOpacity style={s.seeAllRow} onPress={() => router.push('/(tabs)/nearby' as any)}>
            <Text style={[s.seeAll, { color: theme.textSecondary }]}>SEE ALL</Text>
            <Ionicons name="chevron-forward" size={12} color={theme.textSecondary} />
        </TouchableOpacity>
      </View>

      {!isLoading && experts.length > 0 ? (
        <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.scrollContent}
        >
            {experts.map(expert => (
            <ExpertNearCard key={expert._id} expert={expert} />
            ))}
        </ScrollView>
      ) : (
        <TouchableOpacity 
          activeOpacity={0.9} 
          onPress={() => router.push('/(tabs)/nearby' as any)}
          style={[s.fallbackCard, { borderColor: theme.border }]}
        >
          <ImageBackground
            source={require('../../../assets/nearby.png')}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          >
            <LinearGradient 
              colors={['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.3)', 'transparent']} 
              start={{ x: 0, y: 0 }} 
              end={{ x: 1, y: 1 }} 
              style={StyleSheet.absoluteFill} 
            />
            
            <View style={s.fallbackContent}>
              <View style={s.roundIcon}>
                {isLoading ? (
                    <ActivityIndicator color="#fff" size="small" />
                ) : (
                    <Ionicons name="rocket" size={24} color="#fff" />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.fallbackTitle}>
                    {isLoading ? 'Connecting to Map...' : 'Find Experts Nearby'}
                </Text>
                <Text style={s.fallbackDesc}>Collaborate with local creative talent today.</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#fff" />
            </View>
          </ImageBackground>
        </TouchableOpacity>
      )}
    </View>
  );
};

const s = StyleSheet.create({
  container: { marginTop: 4, marginBottom: 12 },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 24, 
    marginBottom: 8 
  },
  title: { fontSize: 13, fontWeight: '900', letterSpacing: 1.5, opacity: 0.9 },
  badge: { 
    backgroundColor: '#3b82f6', 
    paddingHorizontal: 6, 
    paddingVertical: 2, 
    borderRadius: 4, 
    marginLeft: 8 
  },
  badgeTxt: { color: '#fff', fontSize: 8, fontWeight: '900' },
  seeAllRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  seeAll: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },

  scrollContent: { paddingLeft: 24, paddingRight: 8 },

  loader: { height: 120, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingTxt: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },

  fallbackCard: { 
    marginHorizontal: 24, 
    height: 120, 
    borderRadius: 28, 
    overflow: 'hidden', 
    borderWidth: 1 
  },
  fallbackInner: { flex: 1, overflow: 'hidden' },
  fallbackContent: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 20, 
    gap: 16 
  },
  roundIcon: { 
    width: 48, 
    height: 48, 
    borderRadius: 16, 
    backgroundColor: 'rgba(255,255,255,0.1)', 
    alignItems: 'center', 
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)'
  },
  fallbackTitle: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: -0.5 },
  fallbackDesc: { color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '600', marginTop: 2 }
});
