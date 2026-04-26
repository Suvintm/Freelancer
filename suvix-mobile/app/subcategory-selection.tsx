import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  StatusBar,
  Alert,
  useColorScheme,
  Animated,
  TextInput,
  Dimensions
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather, Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Colors } from '../src/constants/Colors';
import SuvixButton from '../src/components/SuvixButton';
import { useAuthStore } from '../src/store/useAuthStore';
import { useCategoryStore } from '../src/store/useCategoryStore';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

export default function SubcategorySelectionScreen() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();

  const { categoryId } = useLocalSearchParams<{ categoryId: string }>();
  const router = useRouter();
  const { categories } = useCategoryStore();
  const category = categories.find(c => c.id === categoryId);
  const { setTempSignupData } = useAuthStore();
  
  const [selectedSubs, setSelectedSubs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // ── Animation ─────────────────────────────────────────────────────────────
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 20, friction: 7, useNativeDriver: true })
    ]).start();
  }, []);

  const getCategoryAssets = (slug?: string) => {
    switch(slug) {
      case 'yt_influencer': return { thumb: require('../assets/images/categories/youtube.jpg'), overlay: require('../assets/images/categories/youtubeicon.png') };
      case 'direct_client': return { thumb: require('../assets/images/categories/client.jpg'), overlay: null };
      case 'fitness_expert': return { thumb: require('../assets/images/categories/fitness.jpg'), overlay: require('../assets/images/categories/fitnessicon.png') };
      case 'dancer': return { thumb: require('../assets/images/categories/dancer.jpg'), overlay: require('../assets/images/categories/danceicon.png') };
      case 'singer': return { thumb: require('../assets/images/categories/singer.jpg'), overlay: require('../assets/images/categories/singericon.png') };
      case 'social_promoter': return { thumb: require('../assets/images/categories/promotions.jpg'), overlay: require('../assets/images/categories/ads.png') };
      case 'video_editor': return { thumb: require('../assets/images/categories/editor.jpg'), overlay: require('../assets/images/categories/editing.png') };
      case 'rent_service': return { thumb: require('../assets/images/categories/rentals.jpg'), overlay: require('../assets/images/categories/rental.png') };
      default: return { thumb: require('../assets/images/categories/editor.jpg'), overlay: null };
    }
  };

  const assets = getCategoryAssets(category?.slug);

  if (!category) {
    return (
      <View style={[styles.container, { backgroundColor: theme.primary, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: theme.text }}>Category not found</Text>
      </View>
    );
  }

  const handleImpact = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    Haptics.impactAsync(style);
  };

  const toggleSub = (sub: string) => {
    handleImpact();
    if (category?.slug === 'yt_influencer') {
      setSelectedSubs([sub]);
      return;
    }
    setSelectedSubs(current => 
      current.includes(sub) 
        ? current.filter(s => s !== sub) 
        : [...current, sub]
    );
  };

  const filteredSubs = category?.subCategories?.filter(sub => 
    sub.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleFinish = async () => {
    if (selectedSubs.length === 0 && category?.slug !== 'direct_client') {
      handleImpact(Haptics.ImpactFeedbackStyle.Medium);
      Alert.alert('Niche Required', 'Please choose at least one specialization.');
      return;
    }
    
    setLoading(true);
    try {
      handleImpact(Haptics.ImpactFeedbackStyle.Heavy);
      setTempSignupData({ roleSubCategoryIds: selectedSubs });
      router.push('/signup');
    } catch (error: any) {
       Alert.alert('Setup Failed', 'Could not save your selections.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.primary }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} translucent backgroundColor="transparent" />
      
      {/* 🏙️ STICKY GLASS HEADER */}
      <BlurView intensity={isDark ? 80 : 100} tint={isDark ? 'dark' : 'light'} style={[styles.blurHeader, { paddingTop: insets.top }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: theme.secondary }]}>
            <Ionicons name="arrow-back" size={20} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Discover Niche</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* 🔎 FLUENT DISCOVERY BAR */}
        <View style={styles.searchContainer}>
          <View style={[styles.searchBar, { backgroundColor: theme.secondary, borderColor: theme.border }]}>
            <Feather name="search" size={16} color={theme.textSecondary} style={{ marginRight: 10 }} />
            <TextInput
              placeholder="Search specific niches..."
              placeholderTextColor={theme.textSecondary}
              style={[styles.searchInput, { color: theme.text }]}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>
      </BlurView>

      <ScrollView 
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 130 }]} 
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <View style={styles.heroSection}>
            <View style={styles.iconWrapper}>
               {assets.overlay ? (
                 <Image source={assets.overlay} style={styles.mainIcon} resizeMode="contain" />
               ) : (
                 <View style={[styles.fallbackIcon, { backgroundColor: theme.secondary, borderColor: theme.border }]}>
                   <Feather name={category?.icon as any || 'user'} size={32} color={theme.accent} />
                 </View>
               )}
            </View>
            <Text style={[styles.title, { color: theme.text }]}>How do you specialize?</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              Selecting accurate niches helps SuviX match you with the highest-paying brands in your industry.
            </Text>
          </View>

          {/* 🏷️ TAG CLOUD WITH PREMIUM INTERACTION */}
          <View style={styles.tagCloud}>
            {filteredSubs.map((sub, index) => {
              const isSelected = selectedSubs.includes(sub.id);
              return (
                <TouchableOpacity
                  key={sub.id}
                  activeOpacity={0.8}
                  onPress={() => toggleSub(sub.id)}
                  style={[
                    styles.tag, 
                    { backgroundColor: theme.secondary, borderColor: theme.border },
                    isSelected && { 
                      backgroundColor: theme.text, 
                      borderColor: theme.text,
                      shadowColor: theme.text,
                      shadowOpacity: 0.2,
                      shadowRadius: 10,
                      elevation: 5
                    }
                  ]}
                >
                  <Text style={[
                    styles.tagText, 
                    { color: theme.textSecondary },
                    isSelected && { color: isDark ? '#000' : '#FFF' }
                  ]}>
                    {sub.name}
                  </Text>
                  {isSelected && <Ionicons name="checkmark-circle" size={14} color={isDark ? '#000' : '#FFF'} style={{ marginLeft: 6 }} />}
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.infoCard}>
            <LinearGradient
              colors={isDark ? ['#1a1a1a', '#000000'] : ['#F7F9FC', '#FFFFFF']}
              style={[styles.infoCardInner, { borderColor: theme.border }]}
            >
              <Feather name="trending-up" size={18} color={theme.accent} />
              <Text style={[styles.infoText, { color: theme.textSecondary }]}>
                Profiles with precise targeting receive <Text style={{ fontWeight: '800', color: theme.text }}>85% more</Text> exclusive matching opportunities.
              </Text>
            </LinearGradient>
          </View>

          <View style={{ height: 120 }} />
        </Animated.View>
      </ScrollView>

      {/* 🚀 PREMIUM ACTION FOOTER */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        <LinearGradient
          colors={isDark ? ['transparent', 'rgba(0,0,0,0.9)'] : ['transparent', 'rgba(255,255,255,0.9)']}
          style={styles.footerGradient}
        />
        <SuvixButton 
          title={selectedSubs.length > 0 ? `Confirm ${selectedSubs.length} Niche(s)` : 'Select a Niche'} 
          onPress={handleFinish}
          loading={loading}
          disabled={selectedSubs.length === 0 && category?.slug !== 'direct_client'}
          style={styles.finishBtn}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  blurHeader: {
    position: 'absolute',
    top: 0,
    width: '100%',
    zIndex: 100,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150,150,150,0.1)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    height: 60,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  scrollContent: { 
    paddingHorizontal: 24,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  mainIcon: { width: 64, height: 64 },
  fallbackIcon: { 
    width: 64, 
    height: 64, 
    borderRadius: 20, 
    justifyContent: 'center', 
    alignItems: 'center',
    borderWidth: 1.5,
  },
  title: { fontSize: 28, fontWeight: '900', textAlign: 'center', letterSpacing: -1 },
  subtitle: { fontSize: 14, textAlign: 'center', marginTop: 8, lineHeight: 20 },
  tagCloud: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'center',
    gap: 10,
    marginTop: 10
  },
  tag: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 100,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagText: { fontSize: 13, fontWeight: '800', letterSpacing: -0.3 },
  infoCard: {
    marginTop: 40,
  },
  infoCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '500',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  footerGradient: {
    ...StyleSheet.absoluteFillObject,
    height: 100,
    top: -30,
  },
  finishBtn: { 
    width: '100%',
    height: 60,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
  }
});
