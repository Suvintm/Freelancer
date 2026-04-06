import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
  Image,
  Dimensions,
  Animated,
  StatusBar,
  Modal,
  useColorScheme
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../src/constants/Colors';
import SuvixInput from '../src/components/SuvixInput';
import SuvixButton from '../src/components/SuvixButton';
import { useAuthStore } from '../src/store/useAuthStore';
import { api } from '../src/api/client';
import { DUMMY_CATEGORIES } from '../src/constants/dummy_categories';
import { CategoryId, CategoryConfig } from '../src/types/category';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 64) / 2;

// Custom sorting order as requested by USER:
// 1. Normal User, 2. YouTube, 3. Gym, 4. Singer, 5. Dance, 6. Ads, 7. Remaining
const CATEGORY_ORDER = [
  'direct_client',    // Normal User
  'yt_influencer',    // YouTube
  'fitness_expert',   // Gym / Fitness Pro
  'singer',           // Singer
  'dancer',           // Dance
  'social_promoter',  // Ads & Promotions
  'video_editor',
  'rent_service',
  'photographer',
  'videographer',
  'musician',
  'actor'
];

export default function RoleSelectionScreen() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const isDark = colorScheme === 'dark';

  const { token, name } = useLocalSearchParams<{ token: string; name: string }>();
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | null>(null);
  const [infoCategory, setInfoCategory] = useState<CategoryConfig | null>(null);
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  
  const setAuth = useAuthStore((state) => state.setAuth);
  const router = useRouter();

  // Entrance Animations
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(20))[0];

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 800, useNativeDriver: true })
    ]).start();
  }, []);

  const handleImpact = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    Haptics.impactAsync(style);
  };

  const { tempSignupData, setTempSignupData, clearTempSignupData } = useAuthStore();

  const handleFinalize = async () => {
    if (!selectedCategory) {
      handleImpact(Haptics.ImpactFeedbackStyle.Medium);
      Alert.alert('Selection Required', 'Please choose a professional category to continue.');
      return;
    }

    setLoading(true);
    try {
      handleImpact(Haptics.ImpactFeedbackStyle.Heavy);
      
      // Update global signup buffer
      setTempSignupData({ categoryId: selectedCategory });

      const category = DUMMY_CATEGORIES[selectedCategory];
      const backendRole = category?.roleGroupId === 'CLIENT' ? 'client' : 'editor';

      // For Normal User / Client, trigger registration immediately
      if (selectedCategory === 'direct_client') {
        const data = useAuthStore.getState().tempSignupData;
        if (!data) throw new Error('Signup data missing');

        const formData = new FormData();
        formData.append('name', data.name || '');
        formData.append('email', data.email || '');
        formData.append('password', data.password || '');
        formData.append('phone', data.phone || '');
        formData.append('role', backendRole);
        formData.append('country', 'IN');

        if (data.profileImage) {
          const uriParts = data.profileImage.split('.');
          const fileType = uriParts[uriParts.length - 1];
          formData.append('profilePicture', {
            uri: data.profileImage,
            name: `profile.${fileType}`,
            type: `image/${fileType}`,
          } as any);
        }

        const response = await api.post('/auth/register', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        if (response.data.success) {
          const { user, token: authToken } = response.data;
          await setAuth(user, authToken);
          clearTempSignupData();
          Alert.alert('Welcome to SuviX!', 'Your Client profile is ready. Explore elite talent now.');
          router.replace('/(tabs)');
        }
        return;
      }
      
      // Navigation to the Subcategory Selection Screen for other roles
      router.push({
        pathname: '/subcategory-selection',
        params: { categoryId: selectedCategory }
      });
    } catch (error: any) {
      Alert.alert('Setup Failed', error.response?.data?.message || 'Could not finalize your path.');
    } finally {
      setLoading(false);
    }
  };

  const sortedCategories = CATEGORY_ORDER.map(id => DUMMY_CATEGORIES[id]).filter(Boolean);

  const renderCategoryCard = (item: CategoryConfig, index: number) => {
    const isSelected = selectedCategory === item.id;
    const isSpecialClient = item.id === 'direct_client';
    
    return (
      <TouchableOpacity 
        key={item.id}
        activeOpacity={0.9}
        onPress={() => { handleImpact(); setSelectedCategory(item.id as CategoryId); }}
        style={[
          styles.card, 
          { backgroundColor: theme.secondary, borderColor: theme.border },
          isSelected && { borderColor: theme.accent, borderWidth: 2.5 },
          isSpecialClient && { borderStyle: 'dashed' }
        ]}
      >
        <Image source={item.thumbnail} style={styles.cardImage} resizeMode="cover" />

        {/* Info Icon - Top Right */}
        <TouchableOpacity 
          style={styles.infoIcon} 
          onPress={() => { handleImpact(Haptics.ImpactFeedbackStyle.Medium); setInfoCategory(item); }}
        >
          <Feather name="info" size={16} color={theme.text} />
        </TouchableOpacity>

        {/* Absolute Icon Overlay - Perfect Top Left Corner */}
        {item.overlayIcon && (
          <Image source={item.overlayIcon} style={styles.overlayIcon} resizeMode="contain" />
        )}

        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.9)']}
          style={styles.cardOverlay}
        >
          <View style={styles.cardLabelContainer}>
            <Text style={styles.cardLabel} numberOfLines={1}>{item.label}</Text>
            {isSelected && (
              <View style={[styles.selectedBadge, { backgroundColor: theme.accent }]}>
                <Feather name="check" size={10} color={isDark ? "#000" : "#FFF"} />
              </View>
            )}
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.primary }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            
            <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
              <Image source={require('../assets/whitebglogo.png')} style={[styles.logo, { tintColor: isDark ? undefined : theme.text }]} resizeMode="contain" />
              <Text style={[styles.title, { color: theme.text }]}>Choose Your Path</Text>
              <Text style={[styles.disclaimer, { color: theme.textSecondary }]}>Wisely choose your category by checking the info of each category on the respective category info icon</Text>
            </Animated.View>

            <View style={styles.grid}>
              {sortedCategories.map((cat, index) => renderCategoryCard(cat, index))}
            </View>

            <View style={{ height: 120 }} />
          </ScrollView>

          {/* FLOATING ACTION BOTTOM BAR */}
          <LinearGradient
            colors={isDark ? ['transparent', 'rgba(0,0,0,1)'] : ['transparent', 'rgba(248,250,252,1)']}
            style={styles.bottomBar}
          >
            <SuvixButton 
              title="Continue" 
              onPress={handleFinalize}
              loading={loading}
              disabled={!selectedCategory}
              variant="primary"
            />
          </LinearGradient>

          {/* INFO MODAL */}
          <Modal
            visible={!!infoCategory}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setInfoCategory(null)}
          >
            <View style={styles.modalOverlay}>
              <TouchableOpacity style={styles.modalBlurClose} activeOpacity={1} onPress={() => setInfoCategory(null)} />
              <View style={[styles.modalContent, { backgroundColor: theme.secondary, borderColor: theme.border }]}>
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: theme.text }]}>{infoCategory?.label}</Text>
                  <TouchableOpacity onPress={() => setInfoCategory(null)}>
                    <Feather name="x" size={24} color={theme.text} />
                  </TouchableOpacity>
                </View>
                <Text style={[styles.modalInfo, { color: theme.textSecondary }]}>{infoCategory?.info}</Text>
                <SuvixButton 
                  title="Got it" 
                  onPress={() => setInfoCategory(null)}
                  style={styles.modalBtn}
                />
              </View>
            </View>
          </Modal>
        </View>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 10 },
  header: { alignItems: 'center', marginBottom: 20 },
  logo: { width: 90, height: 36, marginBottom: 8 },
  title: { fontSize: 26, fontWeight: '900', letterSpacing: -0.5 },
  disclaimer: { fontSize: 11, textAlign: 'center', marginTop: 8, paddingHorizontal: 20, fontStyle: 'italic' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: {
    width: CARD_WIDTH,
    height: CARD_WIDTH * 1.05, // Smaller cards
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1.5,
  },
  cardImage: { width: '100%', height: '100%', position: 'absolute' },
  overlayIcon: {
    position: 'absolute',
    bottom: -5, // Pinned to the bottom-left
    left: -15, // Pushed left to capitalize on wide icons
    width: 130, // Large size to dominate the grid
    height: 130,
    zIndex: 10
  },
  infoIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)'
  },
  cardOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '100%', justifyContent: 'flex-end', padding: 15 },
  cardLabelContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardLabel: { color: '#FFF', fontSize: 13, fontWeight: '800' },
  selectedBadge: { width: 16, height: 16, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 24, paddingBottom: 30, paddingTop: 30 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalBlurClose: { ...StyleSheet.absoluteFillObject },
  modalContent: { width: '100%', borderRadius: 24, padding: 24, borderWidth: 1.5 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: '900' },
  modalInfo: { fontSize: 13, lineHeight: 20, marginBottom: 24 },
  modalBtn: { borderRadius: 100 }
});
