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
import { DUMMY_CATEGORIES } from '../src/constants/dummy_categories';
import SuvixButton from '../src/components/SuvixButton';
import { useAuthStore } from '../src/store/useAuthStore';
import { api } from '../src/api/client';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

export default function SubcategorySelectionScreen() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const isDark = colorScheme === 'dark';

  const { categoryId } = useLocalSearchParams<{ categoryId: string }>();
  const router = useRouter();
  const category = DUMMY_CATEGORIES[categoryId as string];
  
  // State for multiple selections
  const [selectedSubs, setSelectedSubs] = useState<string[]>([]);

  if (!category) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.primary }]}>
        <Text style={{ color: theme.text }}>Category not found</Text>
      </SafeAreaView>
    );
  }

  const isYoutube = categoryId === 'yt_influencer';

  const { tempSignupData, setTempSignupData, clearTempSignupData, setAuth } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const handleImpact = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    Haptics.impactAsync(style);
  };

  const toggleSub = (sub: string) => {
    handleImpact();
    
    if (isYoutube) {
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
    if (selectedSubs.length === 0) {
      handleImpact(Haptics.ImpactFeedbackStyle.Medium);
      Alert.alert('Selection Required', 'Please choose at least one niche to continue.');
      return;
    }
    
    setLoading(true);
    try {
      handleImpact(Haptics.ImpactFeedbackStyle.Heavy);
      
      const data = useAuthStore.getState().tempSignupData;
      if (!data) throw new Error('Signup data missing');

      const backendRole = category?.roleGroupId === 'CLIENT' ? 'client' : 'editor';

      const formData = new FormData();
      formData.append('name', data.name || '');
      formData.append('email', data.email || '');
      formData.append('password', data.password || '');
      formData.append('phone', data.phone || '');
      formData.append('role', backendRole);
      formData.append('country', 'IN');
      
      // JSON stringify subcategories for professional parsing
      formData.append('subCategories', JSON.stringify(selectedSubs));

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
        Alert.alert('Welcome to SuviX!', `Your professional profile as a ${category.label} is now active.`);
        router.replace('/(tabs)');
      }
    } catch (error: any) {
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
             {category.overlayIcon ? (
               <Image source={category.overlayIcon} style={styles.mainIcon} resizeMode="contain" />
             ) : (
               <View style={[styles.fallbackIcon, { backgroundColor: theme.secondary, borderColor: theme.border }]}>
                 <Feather name={category.icon as any} size={40} color={theme.accent} />
               </View>
             )}
          </View>
          
          <Text style={[styles.title, { color: theme.text }]}>Refine Your Niche</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            {isYoutube 
              ? 'Please select any one niche to specialize your channel presence' 
              : `Select your focus areas as a ${category.label}`}
          </Text>
          <Text style={[styles.disclaimer, { color: theme.textSecondary }]}>Accurately selecting your specific niches is critical for profile popularity. Profiles with precise professional targeting receive 85% higher engagement and appear at the top of client searches for elite expert matching within the SuviX ecosystem.</Text>
        </View>

        {/* TAG CLOUD (FLEX WRAP LIST) */}
        <View style={styles.tagCloud}>
          {category.subCategories?.map((sub) => {
            const isSelected = selectedSubs.includes(sub);
            return (
              <TouchableOpacity
                key={sub}
                activeOpacity={0.7}
                onPress={() => toggleSub(sub)}
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
                  {sub}
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
