import React from 'react';
import { useAuthStore } from '../../../store/useAuthStore';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { ProfileContentTabs } from '../../shared/profiles/ProfileContentTabs';
import * as ImagePicker from 'expo-image-picker';
import { api } from '../../../api/client';
import { useTheme } from '../../../context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { formatCount } from '../../../utils/formatters';

import { SmartText } from '../../shared/content/SmartText';

const DEFAULT_AVATAR = require('../../../../assets/defualtprofile.png');
const { width } = Dimensions.get('window');

// --- MOCK DATA FOR FITNESS FEATURES ---
const TRANSFORMATIONS = [
  { id: '1', before: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&q=80&w=400', after: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=400', label: '12 Week Shred' },
  { id: '2', before: 'https://images.unsplash.com/photo-1594882645126-14020914d58d?auto=format&fit=crop&q=80&w=400', after: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&q=80&w=400', label: 'Muscle Gain' },
];

const PROGRAMS = [
  { id: '1', title: 'Power Bodybuilding', duration: '8 Weeks', price: '₹2,499', icon: 'dumbbell' },
  { id: '2', title: 'Fat Loss Catalyst', duration: '4 Weeks', price: '₹1,599', icon: 'fire' },
  { id: '3', title: 'Stamina & HIIT', duration: '6 Weeks', price: '₹1,999', icon: 'lightning-bolt' },
];


export default function FitnessInfluencerProfile() {
  const { theme } = useTheme();
  const { user, updateUser, fetchUser } = useAuthStore();
  

  React.useEffect(() => {
    if (user?.bio) {
      setTempBio(user.bio);
    }
  }, [user?.bio]);
  const insets = useSafeAreaInsets();

  const [isBioModalVisible, setBioModalVisible] = React.useState(false);
  const [tempBio, setTempBio] = React.useState(user?.bio || '');
  const [isSaving, setIsSaving] = React.useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = React.useState(false);
  const [selection, setSelection] = React.useState({ start: 0, end: 0 });

  if (!user) return null;

  const displayName = user.name || user.username || 'Fitness Pro';
  const subCategoryName = user.primaryRole?.subCategory || 'Fitness Specialist';
  const headerOffset = insets.top + 50;

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'We need camera roll permissions to change your profile picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, // 🛡️ Backward compatibility for some SDKs, but guarded
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      console.log('🖼️ [PICKER] Asset selected:', result.assets[0].uri);
      handleUploadAvatar(result.assets[0].uri);
    }
  };

  const handleUploadAvatar = async (uri: string) => {
    setIsUploadingAvatar(true);
    console.log('📡 [API] Attempting profile picture upload...');
    
    try {
      const formData = new FormData();
      const filename = uri.split('/').pop() || 'profile.jpg';
      
      // PRODUCTION-GRADE: Ensure URI is clean for Android networking
      const cleanUri = Platform.OS === 'android' ? uri : uri.replace('file://', '');
      
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image/jpeg`;

      // @ts-ignore - FormData expects specialized object for files in RN
      formData.append('image', { 
        uri: Platform.OS === 'android' ? uri : cleanUri, 
        name: filename, 
        type 
      });

      const res = await api.post('/user/me/profile-picture', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        // IMPORTANT: Let Axios handle the boundary automatically
        transformRequest: (data) => data, 
      });

      if (res.data.success) {
        console.log('✅ [API] Upload success:', res.data.profilePicture);
        updateUser({ profilePicture: res.data.profilePicture });
        Alert.alert("Success", "Profile picture updated!");
      }
    } catch (error: any) {
      console.error('❌ [API Error] Upload Failed:', error.message);
      if (error.response) {
        console.error('❌ [API Error] Details:', error.response.status, error.response.data);
      }
      Alert.alert("Error", `Could not upload image. ${error.message || 'System error'}`);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleUpdateBio = async () => {
    if (tempBio.length > 150) {
      Alert.alert("Limit Exceeded", "Bio must be 150 characters or less.");
      return;
    }

    setIsSaving(true);
    try {
      const res = await api.patch('/user/me', { bio: tempBio });
      if (res.data.success) {
        updateUser({ bio: tempBio });
        setBioModalVisible(false);
      }
    } catch (error) {
       console.error('Update Bio Error:', error);
       Alert.alert("Error", "Could not update bio. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const insertShortcut = (symbol: string) => {
    const before = tempBio.substring(0, selection.start);
    const after = tempBio.substring(selection.end);
    const newText = before + symbol + after;
    
    if (newText.length <= 150) {
      setTempBio(newText);
    }
  };



  return (
    <View style={[styles.container, { backgroundColor: theme.primary }]}>
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={[styles.content, { paddingTop: headerOffset, flexGrow: 1 }]}
      >
        
        {/* Dynamic Fitness Banner ( emerald green identity ) */}
        <LinearGradient
          colors={['#2ECC71', '#27AE60', '#000000']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.banner}
        >
          <View style={styles.bannerOverlay}>
            <MaterialCommunityIcons name="run-fast" size={40} color="rgba(255,255,255,0.2)" />
          </View>
        </LinearGradient>

        <View style={[styles.profileWrap, { backgroundColor: theme.primary }]}>
          <View style={[styles.headerRow, styles.padded]}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatarInner}>
                <Image
                  source={user.profilePicture ? { uri: user.profilePicture } : DEFAULT_AVATAR}
                  style={[styles.avatar, { borderColor: '#FFFFFF' }]}
                />
                {isUploadingAvatar && (
                  <View style={[styles.avatarLoadingOverlay, { backgroundColor: 'rgba(0,0,0,0.4)' }]}>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  </View>
                )}
              </View>
              <TouchableOpacity style={styles.avatarEditBtn} onPress={handlePickImage} disabled={isUploadingAvatar}>
                <MaterialCommunityIcons name="camera-outline" size={16} color="white" />
              </TouchableOpacity>
              <View style={styles.verifiedBadge}>
                <MaterialCommunityIcons name="check-decagram" size={20} color="#2ECC71" />
              </View>
            </View>

            <View style={styles.headerStats}>
              <View style={styles.miniStatsRow}>
                <View style={styles.miniStat}>
                  <Text style={[styles.miniStatValue, { color: '#FFFFFF' }]}>{formatCount(user.followers)}</Text>
                  <Text style={[styles.miniStatLabel, { color: '#FFFFFF' }]}>Followers</Text>
                </View>
                <View style={styles.miniStat}>
                  <Text style={[styles.miniStatValue, { color: '#FFFFFF' }]}>{formatCount(user.following)}</Text>
                  <Text style={[styles.miniStatLabel, { color: '#FFFFFF' }]}>Following</Text>
                </View>
                <View style={[styles.miniStat, { opacity: 0.8 }]}>
                  <Text style={[styles.miniStatValue, { color: '#FFFFFF' }]}>PRO</Text>
                  <Text style={[styles.miniStatLabel, { color: '#FFFFFF' }]}>Elite</Text>
                </View>
              </View>

              <TouchableOpacity 
                onPress={handleRepairMedia}
                style={[styles.editBtn, { backgroundColor: theme.secondary, borderColor: theme.border }]}
              >
                 <Text style={[styles.editBtnText, { color: theme.text }]}>Repair Media</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={[styles.infoBlock, styles.padded]}>
            <View style={styles.nameRow}>
               <Text style={[styles.name, { color: theme.text }]}>{displayName}</Text>
               <MaterialCommunityIcons name="shield-check" size={16} color={theme.accent} style={{ marginLeft: 6 }} />
            </View>
            <Text style={[styles.niche, { color: '#2ECC71' }]}>{subCategoryName.toUpperCase()}</Text>
            {user.bio ? (
              <View style={styles.bioWrapper}>
                <View style={{ flex: 1 }}>
                  <SmartText 
                    text={user.bio} 
                    style={[styles.bio, { color: theme.textSecondary }]} 
                  />
                </View>
                <TouchableOpacity 
                  onPress={() => { setTempBio(user.bio || ''); setBioModalVisible(true); }}
                  style={styles.bioEditTrigger}
                >
                  <MaterialCommunityIcons name="pencil-outline" size={16} color={theme.accent} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity 
                onPress={() => { setTempBio(''); setBioModalVisible(true); }} 
                style={[styles.addBioBtn, { borderColor: theme.border, backgroundColor: theme.secondary }]}
              >
                <MaterialCommunityIcons name="pencil-plus-outline" size={18} color={theme.accent} />
                <Text style={[styles.addBioText, { color: theme.textSecondary }]}>Add profile bio</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* --- SPECIALIZED FITNESS COMPONENTS --- */}

          {/* TRANSFORMATION GALLERY */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Transformation Results</Text>
            <TouchableOpacity><Text style={{ color: '#2ECC71', fontSize: 12, fontWeight: '700' }}>View All</Text></TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingLeft: 20, paddingRight: 10 }}>
            {TRANSFORMATIONS.map((item) => (
              <View key={item.id} style={[styles.transCard, { backgroundColor: theme.secondary, borderColor: theme.border }]}>
                <View style={styles.transImages}>
                  <View style={styles.transHalf}>
                    <Image source={{ uri: item.before }} style={styles.transImg} />
                    <View style={styles.transBadge}><Text style={styles.transBadgeText}>BEFORE</Text></View>
                  </View>
                  <View style={[styles.transHalf, { marginLeft: 2 }]}>
                    <Image source={{ uri: item.after }} style={styles.transImg} />
                    <View style={[styles.transBadge, { backgroundColor: '#2ECC71' }]}><Text style={styles.transBadgeText}>AFTER</Text></View>
                  </View>
                </View>
                <Text style={[styles.transLabel, { color: theme.text }]} numberOfLines={1}>{item.label}</Text>
              </View>
            ))}
          </ScrollView>

          {/* TRAINING PROGRAMS */}
          <View style={styles.sectionHeader}>
             <Text style={[styles.sectionTitle, { color: theme.text }]}>Active Programs</Text>
             <MaterialCommunityIcons name="shield-star" size={18} color="#FFD700" />
          </View>
          <View style={styles.programsGrid}>
            {PROGRAMS.map((prog) => (
              <TouchableOpacity key={prog.id} style={[styles.progCard, { backgroundColor: theme.secondary, borderColor: theme.border }]}>
                <View style={styles.progIconWrap}>
                   <MaterialCommunityIcons name={prog.icon as any} size={24} color="#2ECC71" />
                </View>
                <View style={{ flex: 1 }}>
                   <Text style={[styles.progTitle, { color: theme.text }]}>{prog.title}</Text>
                   <Text style={[styles.progDuration, { color: theme.textSecondary }]}>{prog.duration}</Text>
                </View>
                <View style={styles.progPriceWrap}>
                   <Text style={[styles.progPrice, { color: theme.text }]}>{prog.price}</Text>
                   <MaterialCommunityIcons name="chevron-right" size={18} color={theme.textSecondary} />
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* COACHING CTA SECTION */}
          <TouchableOpacity style={styles.ctaBanner}>
            <LinearGradient colors={['#2ECC71', '#1DB954']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.ctaGradient}>
               <MaterialCommunityIcons name="calendar-check" size={24} color="white" />
               <View style={{ marginLeft: 15 }}>
                  <Text style={styles.ctaTitle}>Apply for Online Training</Text>
                  <Text style={styles.ctaSubtitle}>Limited slots available for the next batch</Text>
               </View>
               <View style={{ flex: 1 }} />
               <MaterialCommunityIcons name="arrow-right" size={20} color="white" />
            </LinearGradient>
          </TouchableOpacity>

          {/* 📱 CENTRALIZED MEDIA ENGINE */}
          <ProfileContentTabs 
            userId={user.id} 
            theme={theme} 
            extraTabs={['DIET TIPS']}
            onRepairSuccess={() => fetchUser()}
            renderCustomTab={(tab) => (
              <View style={{ paddingVertical: 40, alignItems: 'center', opacity: 0.6 }}>
                 <MaterialCommunityIcons name="nutrition" size={60} color={theme.textSecondary} />
                 <Text style={{ color: theme.text, marginTop: 15, fontSize: 16, fontWeight: '700' }}>
                   No diet tips shared yet
                 </Text>
              </View>
            )}
          />
        </View>
      </ScrollView>

      {/* Bio Update Modal */}
      <Modal
        visible={isBioModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setBioModalVisible(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContent, { backgroundColor: theme.primary, borderColor: theme.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Edit Motivation Bio</Text>
              <TouchableOpacity onPress={() => setBioModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={[styles.inputContainer, { backgroundColor: theme.secondary, borderColor: theme.border }]}>
              <View style={styles.mirrorContainer}>
                <SmartText 
                  text={tempBio} 
                  showIcons={false}
                  style={[styles.bioInputMirror, { color: theme.text }]} 
                />
                <TextInput
                  multiline
                  placeholder="Your mission as a fitness pro..."
                  placeholderTextColor="transparent"
                  selectionColor={theme.accent}
                  value={tempBio}
                  onChangeText={setTempBio}
                  onSelectionChange={(e) => setSelection(e.nativeEvent.selection)}
                  maxLength={150}
                  autoFocus
                  style={[styles.bioInput, { color: 'transparent' }]}
                />
              </View>
              <View style={[styles.toolbar, { borderTopColor: theme.border }]}>
                <TouchableOpacity style={styles.toolBtn} onPress={() => insertShortcut('@')}>
                  <Text style={[styles.toolBtnText, { color: theme.accent }]}>@</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.toolBtn} onPress={() => insertShortcut('🔥')}>
                   <Text style={[styles.toolBtnText, { color: theme.accent }]}>🔥</Text>
                </TouchableOpacity>
                <View style={{ flex: 1 }} />
                <Text style={[styles.charCount, { color: tempBio.length >= 150 ? '#FF0000' : theme.textSecondary }]}>
                  {tempBio.length}/150
                </Text>
              </View>
            </View>

            <TouchableOpacity 
              disabled={isSaving}
              onPress={handleUpdateBio}
              style={[styles.saveBtn, { backgroundColor: '#2ECC71' }]}
            >
              {isSaving ? (
                <Text style={styles.saveBtnText}>Updating...</Text>
              ) : (
                <>
                  <Text style={styles.saveBtnText}>Update Profile</Text>
                  <MaterialCommunityIcons name="check-circle" size={18} color="white" />
                </>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingTop: 0, paddingBottom: 40 },
  banner: { height: 100, width: '100%', justifyContent: 'center', alignItems: 'center' },
  bannerOverlay: { opacity: 0.5 },
  profileWrap: { marginTop: -20, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 20 },
  padded: { paddingHorizontal: 20 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginTop: -40, gap: 15 },
  avatarContainer: { position: 'relative' },
  avatarInner: { width: 90, height: 90, borderRadius: 45, overflow: 'hidden' },
  avatar: { width: 90, height: 90, borderRadius: 45, borderWidth: 4 },
  avatarLoadingOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  avatarEditBtn: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: '#2ECC71',
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    zIndex: 10
  },
  verifiedBadge: { position: 'absolute', bottom: 2, right: 2, backgroundColor: 'white', borderRadius: 10 },
  headerStats: { flex: 1, justifyContent: 'center' },
  miniStatsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14, paddingRight: 5, marginTop: -8 },
  miniStat: { alignItems: 'center' },
  miniStatValue: { fontSize: 18, fontWeight: '900', letterSpacing: -0.5 },
  miniStatLabel: { fontSize: 10, fontWeight: '700', marginTop: 3, textTransform: 'uppercase', opacity: 0.8, letterSpacing: 0.8 },
  editBtn: { height: 36, borderRadius: 10, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  editBtnText: { fontSize: 12, fontWeight: '700' },
  infoBlock: { marginTop: 12 },
  nameRow: { flexDirection: 'row', alignItems: 'center' },
  name: { fontSize: 20, fontWeight: '800' },
  niche: { fontSize: 11, fontWeight: '900', marginTop: 2, letterSpacing: 1 },
  bio: { fontSize: 13, marginTop: 8, lineHeight: 18, flex: 1 },
  bioWrapper: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  bioEditTrigger: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 4
  },
  addBioBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginTop: 10, 
    paddingVertical: 10, 
    paddingHorizontal: 16, 
    borderRadius: 12, 
    borderWidth: 1, 
    borderStyle: 'dashed',
    gap: 10
  },
  addBioText: { fontSize: 13, fontWeight: '700' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 25, marginBottom: 12, paddingHorizontal: 20 },
  sectionTitle: { fontSize: 14, fontWeight: '800' },
  transCard: { width: width * 0.75, borderRadius: 20, padding: 12, marginRight: 15, borderWidth: 1 },
  transImages: { flexDirection: 'row', height: 180 },
  transHalf: { flex: 1, position: 'relative', borderRadius: 12, overflow: 'hidden' },
  transImg: { width: '100%', height: '100%', resizeMode: 'cover' },
  transBadge: { position: 'absolute', top: 8, left: 8, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  transBadgeText: { color: 'white', fontSize: 8, fontWeight: '900' },
  transLabel: { fontSize: 14, fontWeight: '800', marginTop: 10, textAlign: 'center' },
  programsGrid: { paddingHorizontal: 20, gap: 12 },
  progCard: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 18, borderWidth: 1 },
  progIconWrap: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(46, 204, 113, 0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  progTitle: { fontSize: 15, fontWeight: '800' },
  progDuration: { fontSize: 12, opacity: 0.6, marginTop: 2 },
  progPriceWrap: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  progPrice: { fontSize: 14, fontWeight: '900' },
  ctaBanner: { margin: 20, height: 80, borderRadius: 20, overflow: 'hidden' },
  ctaGradient: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20 },
  ctaTitle: { color: 'white', fontSize: 16, fontWeight: '900' },
  ctaSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: '600', marginTop: 2 },
  tabBar: { flexDirection: 'row', marginTop: 25, borderBottomWidth: 1, paddingHorizontal: 5 },
  tabItem: { flex: 1, alignItems: 'center', paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { padding: 24, borderTopLeftRadius: 32, borderTopRightRadius: 32, borderWidth: 1, borderBottomWidth: 0, minHeight: '50%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '900' },
  inputContainer: { borderRadius: 16, padding: 16, borderWidth: 1, minHeight: 120 },
  bioInput: { fontSize: 16, lineHeight: 22, height: 120, textAlignVertical: 'top', padding: 0, margin: 0 },
  charCount: { alignSelf: 'flex-end', fontSize: 12, fontWeight: '700', marginTop: 8 },
  saveBtn: { marginTop: 24, height: 56, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  saveBtnText: { color: 'white', fontSize: 16, fontWeight: '800' },
  toolbar: { flexDirection: 'row', alignItems: 'center', paddingTop: 12, marginTop: 12, borderTopWidth: 1, gap: 12 },
  toolBtn: { padding: 8, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.05)', minWidth: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  toolBtnText: { fontSize: 18, fontWeight: '900' },
  mirrorContainer: { position: 'relative', minHeight: 120 },
  bioInputMirror: { position: 'absolute', top: 0, left: 0, right: 0, fontSize: 16, lineHeight: 22, padding: 0, margin: 0, textAlignVertical: 'top' },
});
