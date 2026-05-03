import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Dimensions, 
  ActivityIndicator, 
  TouchableOpacity, 
  ImageBackground,
  StatusBar,
  ScrollView,
  DeviceEventEmitter
} from 'react-native';
import { useTheme } from '../../src/context/ThemeContext';
import { NearbyMap } from '../../src/components/map/NearbyMap';
import { useNearbyEditors } from '../../src/hooks/useNearbyEditors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RefreshCw, AlertTriangle, ChevronLeft, Search, User, Navigation, MapPin } from 'lucide-react-native';
import * as Location from 'expo-location';
import { Stack, useRouter, useNavigation } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useIsFocused } from '@react-navigation/native';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import SuvixButton from '../../src/components/SuvixButton';
import { Image } from 'expo-image';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * PREMIUM DISCOVERY NEARBY SCREEN
 * Flow: Onboarding (3D City Image) -> Permission -> Map Reveal.
 */
export default function NearbyScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  
  const [hasStartedSearching, setHasStartedSearching] = useState(false);
  const { editors, isLoading, userLocation, permissionStatus, refresh } = useNearbyEditors(hasStartedSearching && isFocused);
  
  const [address, setAddress] = useState("Locating...");
  const isDark = theme.dark;

  // ── BOTTOM SHEET MANAGEMENT ──────────────────────────────────────────────
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['18%', '45%', '85%'], []);

  // ── REVERSE GEOCODE ADDRESS ────────────────────────────────────────────────
  useEffect(() => {
    async function getAddress() {
      if (userLocation) {
        try {
          const results = await Location.reverseGeocodeAsync({
            latitude: userLocation.lat,
            longitude: userLocation.lng,
          });
          if (results && results.length > 0) {
            const item = results[0];
            const displayAddress = item.district || item.subregion || item.street || item.city || item.name || "Current Location";
            setAddress(displayAddress);
          }
        } catch (err) {
          setAddress("Nearby Area");
        }
      }
    }
    getAddress();
  }, [userLocation]);

  const handleStartSearching = () => {
    setHasStartedSearching(true);
  };

  // ── RENDER MAP VIEW ────────────────────────────────────────────────────────
  const renderMapView = () => (
    <View style={styles.mapContainer}>
      <View style={styles.mapWrapper}>
        {isLoading && !userLocation ? (
          <View style={styles.mapLoading}>
             <ActivityIndicator size="large" color={theme.primary} />
             <Text style={styles.loadingText}>Synchronizing with Satellites...</Text>
          </View>
        ) : (
          <NearbyMap 
            userLocation={userLocation} 
            editors={editors} 
            theme={theme} 
          />
        )}
        
        <LinearGradient
          colors={[isDark ? theme.background : '#FFF', 'transparent']}
          style={styles.mapTopGradient}
        />

        <TouchableOpacity 
          style={[styles.refreshButton, { backgroundColor: 'rgba(255,255,255,0.95)' }]} 
          onPress={() => refresh()}
        >
          <RefreshCw size={18} color="#000" />
        </TouchableOpacity>
      </View>

      <BottomSheet
        ref={bottomSheetRef}
        index={0}
        snapPoints={snapPoints}
        handleIndicatorStyle={{ backgroundColor: isDark ? '#333' : '#DDD' }}
        backgroundStyle={{ backgroundColor: isDark ? '#121212' : '#FFF' }}
      >
        <BottomSheetView style={styles.sheetContent}>
           <View style={styles.resultsContainer}>
               <View style={styles.resultHeader}>
                  <View style={[styles.dot, { backgroundColor: theme.primary }]} />
                  <Text style={[styles.resultsTitle, { color: theme.text }]}>
                    {isLoading ? 'Scanning Area...' : `${editors.length} Creators Found`}
                  </Text>
               </View>
               <Text style={[styles.resultsSubtitle, { color: theme.textSecondary }]}>
                  {address} (within 15km radar)
               </Text>
            </View>
        </BottomSheetView>
      </BottomSheet>
    </View>
  );

  // ── RENDER ONBOARDING VIEW ─────────────────────────────────────────────────
  const renderOnboarding = () => (
    <View style={[styles.onboardingContainer, { backgroundColor: isDark ? theme.background : '#FFF' }]}>
       <ScrollView contentContainerStyle={styles.onboardingScroll} showsVerticalScrollIndicator={false}>
          <Text style={[styles.onboardingTitle, { color: theme.text }]}>What's your location?</Text>
          <Text style={[styles.onboardingSubtitle, { color: theme.textSecondary }]}>
            We need your location to show you our creators and editors in your neighborhood.
          </Text>

          <View style={styles.imageWrapper}>
            <Image 
              source={require('../../assets/location_discovery_v2.png')} 
              style={styles.onboardingImage}
              contentFit="contain"
            />
            {/* Top Blend */}
            <LinearGradient
              colors={[isDark ? theme.background : '#FFF', 'transparent']}
              style={styles.imageTopBlend}
            />
            {/* Bottom Blend */}
            <LinearGradient
              colors={['transparent', isDark ? theme.background : '#FFF']}
              style={styles.imageBottomBlend}
            />
          </View>

          <View style={styles.onboardingActions}>
            <SuvixButton 
              title="Use current location"
              onPress={handleStartSearching}
              variant="primary"
              style={styles.locationBtn}
              icon={<Navigation size={20} color="#FFF" style={{ marginRight: 8 }} />}
            />
            
            <TouchableOpacity style={styles.manualBtn}>
              <Text style={[styles.manualText, { color: theme.primary }]}>Enter location manually</Text>
            </TouchableOpacity>
          </View>
       </ScrollView>
    </View>
  );

  return (
    <View style={[styles.mainContainer, { backgroundColor: isDark ? theme.background : '#FFF' }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="dark-content" />
      
      {/* SKY HEADER */}
      <ImageBackground 
        source={require('../../assets/sky_bg.png')} 
        style={[styles.skyHeader, { paddingTop: insets.top + 10 }]}
        resizeMode="cover"
      >
        <View style={styles.topNav}>
          <TouchableOpacity 
            style={styles.backCircle}
            onPress={() => {
              // Instant Switch via Global Event
              DeviceEventEmitter.emit('SWITCH_TAB', 0);
              // Sync URL state
              router.navigate('/(tabs)');
            }}
          >
            <ChevronLeft size={20} color="#000" />
          </TouchableOpacity>

          <View style={styles.locationContainer}>
            <View style={styles.addressRow}>
              <Text style={styles.addressText} numberOfLines={1}>
                {hasStartedSearching ? address : "Creator Radar"}
              </Text>
              {hasStartedSearching && <ChevronLeft size={14} color="#000" style={{ transform: [{ rotate: '-90deg' }] }} />}
            </View>
            <Text style={styles.locationLabel}>
              {hasStartedSearching ? 'STREET-LEVEL ACCURACY' : 'DISCOVER LOCAL TALENT'}
            </Text>
          </View>

          <View style={styles.topActions}>
             <TouchableOpacity style={styles.actionCircle}>
                <Search size={18} color="#000" />
             </TouchableOpacity>
             <TouchableOpacity style={styles.actionCircle}>
                <User size={18} color="#000" />
             </TouchableOpacity>
          </View>
        </View>

        <LinearGradient
          colors={['transparent', isDark ? theme.background : '#FFF']}
          style={styles.skyBottomGradient}
        />
      </ImageBackground>

      {hasStartedSearching ? renderMapView() : renderOnboarding()}
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1 },
  skyHeader: { height: 125, width: SCREEN_WIDTH, paddingHorizontal: 16 },
  skyBottomGradient: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 40 },
  topNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', zIndex: 10 },
  backCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.85)', justifyContent: 'center', alignItems: 'center' },
  actionCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.85)', justifyContent: 'center', alignItems: 'center', marginLeft: 8 },
  locationContainer: { flex: 1, paddingHorizontal: 12 },
  locationLabel: { fontSize: 9, fontWeight: '900', color: 'rgba(0,0,0,0.5)', letterSpacing: 0.5 },
  addressRow: { flexDirection: 'row', alignItems: 'center', marginTop: 1 },
  addressText: { fontSize: 16, fontWeight: '900', color: '#000', marginRight: 2 },
  
  // Onboarding
  onboardingContainer: { flex: 1 },
  onboardingScroll: { padding: 24, alignItems: 'center' },
  onboardingTitle: { fontSize: 28, fontWeight: '900', textAlign: 'center', marginBottom: 12 },
  onboardingSubtitle: { fontSize: 16, textAlign: 'center', lineHeight: 22, color: '#666', marginBottom: 30, paddingHorizontal: 10 },
  onboardingImage: { width: SCREEN_WIDTH - 40, height: SCREEN_WIDTH - 40 },
  imageWrapper: { width: SCREEN_WIDTH - 40, height: SCREEN_WIDTH - 40, marginBottom: 30, overflow: 'hidden' },
  imageTopBlend: { position: 'absolute', top: 0, left: 0, right: 0, height: 40 },
  imageBottomBlend: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 40 },
  onboardingActions: { width: '100%', alignItems: 'center' },
  locationBtn: { width: '100%', height: 56, borderRadius: 16 },
  manualBtn: { marginTop: 20 },
  manualText: { fontSize: 16, fontWeight: '700' },

  // Map
  mapContainer: { flex: 1 },
  mapWrapper: { flex: 1 },
  mapTopGradient: { position: 'absolute', top: 0, left: 0, right: 0, height: 40, zIndex: 5 },
  mapLoading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF' },
  loadingText: { marginTop: 10, fontSize: 14, color: '#666' },
  refreshButton: { position: 'absolute', top: 20, right: 20, padding: 10, borderRadius: 14, zIndex: 100, backgroundColor: '#FFF', elevation: 4 },
  
  // Bottom Sheet
  sheetContent: { padding: 24 },
  resultsContainer: { width: '100%' },
  resultHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  resultsTitle: { fontSize: 18, fontWeight: '800' },
  resultsSubtitle: { fontSize: 13, opacity: 0.6 },
});
