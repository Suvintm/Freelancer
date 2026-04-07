import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
  StatusBar,
  Alert,
  useColorScheme
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../src/constants/Colors';
import SuvixButton from '../src/components/SuvixButton';
import { useAuthStore } from '../src/store/useAuthStore';
import { useCategoryStore } from '../src/store/useCategoryStore';
import { api } from '../src/api/client';
import * as Haptics from 'expo-haptics';
import { ActivityIndicator } from 'react-native';

const { width } = Dimensions.get('window');

export default function SubcategorySelectionScreen() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const isDark = colorScheme === 'dark';

  const { categoryId } = useLocalSearchParams<{ categoryId: string }>();
  const router = useRouter();
  const { categories } = useCategoryStore();
  const category = categories.find(c => c.id === categoryId);
  
  // ASSET MAPPING FOR DYNAMIC DATA
  const getCategoryAssets = (slug?: string) => {
    switch(slug) {
      case 'yt_influencer': return { thumb: require('../assets/images/categories/youtube.png'), overlay: require('../assets/images/categories/youtubeicon.png') };
      case 'direct_client': return { thumb: require('../assets/images/categories/client.png'), overlay: null };
      case 'fitness_expert': return { thumb: require('../assets/images/categories/fitness.png'), overlay: require('../assets/images/categories/fitnessicon.png') };
      case 'dancer': return { thumb: require('../assets/images/categories/dancer.png'), overlay: require('../assets/images/categories/danceicon.png') };
      case 'singer': return { thumb: require('../assets/images/categories/singer.png'), overlay: require('../assets/images/categories/singericon.png') };
      case 'social_promoter': return { thumb: require('../assets/images/categories/promotions.png'), overlay: require('../assets/images/categories/ads.png') };
      case 'video_editor': return { thumb: require('../assets/images/categories/editor.png'), overlay: require('../assets/images/categories/editing.png') };
      case 'rent_service': return { thumb: require('../assets/images/categories/rentals.png'), overlay: require('../assets/images/categories/rental.png') };
      default: return { thumb: require('../assets/images/categories/editor.png'), overlay: null };
    }
  };

  const assets = getCategoryAssets(category?.slug);
  const isYoutube = category?.slug === 'yt_influencer';

  // State for multiple selections
  const [selectedSubs, setSelectedSubs] = useState<string[]>([]);

  if (!category) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.primary }]}>
        <Text style={{ color: theme.text }}>Category not found</Text>
      </SafeAreaView>
    );
  }


  const { tempSignupData, setTempSignupData, clearTempSignupData, setAuth } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const handleImpact = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    Haptics.impactAsync(style);
  };

  const toggleSub = (sub: string) => {
    handleImpact();
    
    if (category?.slug === 'yt_influencer') {
      // Single select for Youtube as per USER request
      setSelectedSubs([sub]);
      return;
    }

    setSelectedSubs(current => 
      current.includes(sub) 
        ? current.filter(s => s !== sub) 
        : [...current, sub]
    );
  };

  const handleFinish = async () => {
    // For Professional roles, subcategories are mandatory. 
    // For Clients, they are optional but usually selected from a default list.
    if (selectedSubs.length === 0 && category?.slug !== 'direct_client') {
      handleImpact(Haptics.ImpactFeedbackStyle.Medium);
      Alert.alert('Selection Required', 'Please choose at least one niche to continue.');
      return;
    }
    
    setLoading(true);
    try {
      handleImpact(Haptics.ImpactFeedbackStyle.Heavy);
      
      const data = useAuthStore.getState().tempSignupData;
      if (!data) throw new Error('Onboarding data is missing. Please restart signup.');

      const backendRole = category?.roleGroup === 'CLIENT' ? 'client' : 'editor';

      const formData = new FormData();
      formData.append('fullName', data.name || '');
      formData.append('username', data.username || '');
      formData.append('email', data.email || '');
      formData.append('password', data.password || '');
      formData.append('phone', data.phone || '');
      formData.append('motherTongue', data.motherTongue || 'English');
      formData.append('categoryId', categoryId || '');
      formData.append('roleSubCategoryIds', JSON.stringify(selectedSubs));

      if (data.profileImage) {
        const uriParts = data.profileImage.split('.');
        const fileType = uriParts[uriParts.length - 1];
        formData.append('profilePicture', {
          uri: data.profileImage,
          name: `profile.${fileType}`,
          type: `image/${fileType}`,
        } as any);
      }

      // CALL THE NEW ATOMIC REGISTER ENDPOINT
      const response = await api.post('/auth/register-full', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data.success) {
        const { user, token: authToken } = response.data;
        
        // 1. CLEAR BUFFERS
        clearTempSignupData();
        
        // 2. SET AUTH (This triggers the Global Layout Guard automatically)
        await setAuth(user, authToken);
        
        // 3. SHOW WELCOME (The guard will handle the navigation in the background)
        Alert.alert(
          'SuviX Ready!', 
          `Your professional account as a ${category?.name} is now active. Welcome to the elite community!`
        );
      }
    } catch (error: any) {
       console.error("Registration Error:", error.response?.data || error.message);
       Alert.alert('Setup Failed', error.response?.data?.message || 'Could not finalize your professional profile.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.primary }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* HEADER WITH CATEGORY ICON */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="chevron-left" size={24} color={theme.text} />
          </TouchableOpacity>
          
          <View style={styles.iconContainer}>
             {assets.overlay ? (
               <Image source={assets.overlay} style={styles.mainIcon} resizeMode="contain" />
             ) : (
               <View style={[styles.fallbackIcon, { backgroundColor: theme.secondary, borderColor: theme.border }]}>
                 <Feather name={category?.icon as any || 'user'} size={40} color={theme.accent} />
               </View>
             )}
          </View>
          
          <Text style={[styles.title, { color: theme.text }]}>Refine Your Niche</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            {category?.slug === 'yt_influencer' 
              ? 'Please select any one niche to specialize your channel presence' 
              : `Select your focus areas as a ${category?.name}`}
          </Text>
          <Text style={[styles.disclaimer, { color: theme.textSecondary }]}>Accurately selecting your specific niches is critical for profile popularity. Profiles with precise professional targeting receive 85% higher engagement and appear at the top of client searches for elite expert matching within the SuviX ecosystem.</Text>
        </View>

        {/* TAG CLOUD (FLEX WRAP LIST) */}
        <View style={styles.tagCloud}>
          {category?.subCategories?.map((sub: any) => {
            const isSelected = selectedSubs.includes(sub.id);
            return (
              <TouchableOpacity
                key={sub.id}
                activeOpacity={0.7}
                onPress={() => toggleSub(sub.id)}
                style={[
                  styles.tag, 
                  { backgroundColor: theme.secondary, borderColor: theme.border },
                  isSelected && { backgroundColor: theme.accent, borderColor: theme.accent }
                ]}
              >
                <Text style={[
                  styles.tagText, 
                  { color: theme.textSecondary },
                  isSelected && { color: isDark ? '#000' : '#FFF' }
                ]}>
                  {sub.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* BOTTOM ACTION */}
      <LinearGradient
        colors={isDark ? ['transparent', 'rgba(0,0,0,1)'] : ['transparent', 'rgba(248,250,252,1)']}
        style={styles.bottomBar}
      >
        <SuvixButton 
          title="Finish Setup" 
          onPress={handleFinish}
          loading={loading}
          disabled={selectedSubs.length === 0}
          style={styles.finishBtn}
        />
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 10 },
  header: { alignItems: 'center', marginBottom: 30, position: 'relative' },
  backBtn: { position: 'absolute', left: 0, top: 0, width: 40, height: 40, justifyContent: 'center' },
  iconContainer: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 10
  },
  mainIcon: { width: 100, height: 100 },
  fallbackIcon: { 
    width: 80, 
    height: 80, 
    borderRadius: 40, 
    justifyContent: 'center', 
    alignItems: 'center',
    borderWidth: 1.5,
  },
  title: { fontSize: 26, fontWeight: '900', textAlign: 'center' },
  subtitle: { fontSize: 13, textAlign: 'center', marginTop: 6, paddingHorizontal: 20 },
  disclaimer: { fontSize: 10, textAlign: 'center', marginTop: 10, paddingHorizontal: 40, fontStyle: 'italic', opacity: 0.7 },
  
  // Tag Cloud Styles
  tagCloud: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'center',
    marginTop: 20
  },
  tag: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 25,
    margin: 6,
    borderWidth: 1.5,
    minWidth: 80,
    alignItems: 'center'
  },
  tagText: { fontSize: 13, fontWeight: '600' },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 24, paddingBottom: 30, paddingTop: 40 },
  finishBtn: { borderRadius: 100 }
});
