import React from 'react';
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
  RefreshControl,
} from 'react-native';
import { ProfileContentTabs } from '../../shared/profiles/ProfileContentTabs';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../../store/useAuthStore';
import { ProfileSkeleton, ProfileSkeletonContent } from '../../shared/skeletons/ProfileSkeleton';
import { useTheme } from '../../../context/ThemeContext';
import { useRefreshManager } from '../../../hooks/useRefreshManager';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { api } from '../../../api/client';
import * as ImagePicker from 'expo-image-picker';
import { formatCount } from '../../../utils/formatters';
import { BlurView } from 'expo-blur';

const { width } = Dimensions.get('window');
const DEFAULT_AVATAR = require('../../../../assets/defualtprofile.png');

/**
 * PERFECTED PREMIUM CLIENT PROFILE
 * Indistinguishable from the YouTube Creator layout.
 */
export default function ClientProfile() {
  const { theme, isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();
  const { user, updateUser, fetchUser, setIsRefreshing, isLoadingUser, isRefreshing } = useAuthStore();
  const router = useRouter();



  const [isBioModalVisible, setIsBioModalVisible] = React.useState(false);
  const [tempBio, setTempBio] = React.useState(user?.bio || '');
  const [isAvatarModalVisible, setIsAvatarModalVisible] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = React.useState(false);

  const onRefresh = React.useCallback(async () => {
    setIsRefreshing(true);
    try {
      await fetchUser();
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchUser, setIsRefreshing]);

  const handleRefresh = useRefreshManager(onRefresh);

  if (isLoadingUser && !user) return <ProfileSkeleton />;
  if (!user) return null;

  // 📐 SURGICAL LAYOUT: Match Navbar Offset
  const headerOffset = insets.top + 50;


  const handlePickMedia = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'We need camera roll permissions to change your profile picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      handleUploadAvatar(result.assets[0].uri);
    }
  };

  const handleUploadAvatar = async (uri: string) => {
    setIsUploadingAvatar(true);
    try {
      const formData = new FormData();
      const filename = uri.split('/').pop() || 'profile.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image`;

      // @ts-ignore
      formData.append('image', { uri, name: filename, type });

      const res = await api.post('/user/me/profile-picture', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (res.data.success) {
        updateUser({ profilePicture: res.data.profilePicture });
        Alert.alert("Success", "Profile picture updated!");
      }
    } catch (error) {
      console.error('Upload Avatar Error:', error);
      Alert.alert("Error", "Could not upload image. Please try again.");
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
        setIsBioModalVisible(false);
      }
    } catch (error) {
       console.error('Update Bio Error:', error);
       Alert.alert("Error", "Could not update bio. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.primary }]}>
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={[styles.content, { paddingTop: headerOffset, flexGrow: 1 }]}
        refreshControl={
          <RefreshControl 
            refreshing={isRefreshing} 
            onRefresh={handleRefresh} 
            tintColor={theme.isDarkMode ? theme.accent : '#FF3040'} 
            colors={[theme.isDarkMode ? theme.accent : '#FF3040']} 
            progressViewOffset={80}
            progressBackgroundColor={theme.secondary}
          />
        }
      >
        {isRefreshing ? (
          <ProfileSkeletonContent />
        ) : (
          <>
        
        {/* 1. UNIFIED PREMIUM BANNER (1:1 SYNC) */}
        <LinearGradient
          colors={isDarkMode ? ['#4338ca', '#1e1b4b', '#000000'] : ['#6366f1', '#4338ca', '#312e81']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.banner}
        >
          <View style={styles.bannerOverlay}>
            <MaterialCommunityIcons name="account-star-outline" size={40} color="rgba(255,255,255,0.2)" />
          </View>
        </LinearGradient>

        <View style={[styles.profileWrap, { backgroundColor: theme.primary }]}>
          <View style={[styles.headerRow, styles.padded]}>
            <View style={styles.avatarContainer}>
              <TouchableOpacity 
                style={styles.avatarInner} 
                onPress={() => setIsAvatarModalVisible(true)}
                activeOpacity={0.9}
                disabled={isUploadingAvatar}
              >
                <Image
                  source={user.profilePicture ? { uri: user.profilePicture } : DEFAULT_AVATAR}
                  style={[styles.avatar, { borderColor: theme.primary }]}
                />
                
                {/* 🚀 PREMIUM AVATAR PREVIEW MODAL */}
                <Modal
                  visible={isAvatarModalVisible}
                  transparent
                  animationType="fade"
                  onRequestClose={() => setIsAvatarModalVisible(false)}
                >
                  <TouchableOpacity 
                    style={styles.modalOverlay} 
                    activeOpacity={1} 
                    onPress={() => setIsAvatarModalVisible(false)}
                  >
                    <BlurView intensity={100} tint="dark" style={StyleSheet.absoluteFill}>
                      <View style={styles.modalContentCentered}>
                         <TouchableOpacity 
                            style={styles.closeModalBtn} 
                            onPress={() => setIsAvatarModalVisible(false)}
                          >
                            <Ionicons name="close-circle" size={36} color="white" />
                         </TouchableOpacity>

                         <Image
                            source={user.profilePicture ? { uri: user.profilePicture } : DEFAULT_AVATAR}
                            style={[styles.enlargedAvatar, { borderColor: theme.primary }]}
                          />
                      </View>
                    </BlurView>
                  </TouchableOpacity>
                </Modal>

                {/* 📸 CAMERA OVERLAY (Tappable for Edit) */}
                <TouchableOpacity 
                   style={[styles.avatarEditBadge, { borderColor: theme.primary }]}
                   onPress={handlePickMedia}
                   activeOpacity={0.8}
                >
                  <MaterialCommunityIcons name="camera" size={12} color="#FFFFFF" />
                </TouchableOpacity>

                {isUploadingAvatar && (
                  <View style={styles.avatarLoadingOverlay}>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  </View>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.headerStats}>
              <View style={styles.miniStatsRow}>
                <View style={styles.miniStat}>
                  <Text style={[styles.miniStatValue, { color: theme.text }]}>{formatCount(user.followers || 0)}</Text>
                  <Text style={[styles.miniStatLabel, { color: theme.textSecondary }]}>Followers</Text>
                </View>
                <View style={styles.miniStat}>
                  <Text style={[styles.miniStatValue, { color: theme.text }]}>{formatCount(user.following || 0)}</Text>
                  <Text style={[styles.miniStatLabel, { color: theme.textSecondary }]}>Following</Text>
                </View>
                <View 
                  style={[styles.miniStat, { opacity: 0.5 }]}
                >
                  <Text style={[styles.miniStatValue, { color: theme.text }]}>PRO</Text>
                  <Text style={[styles.miniStatLabel, { color: theme.textSecondary }]}>Member</Text>
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                <TouchableOpacity 
                   onPress={() => router.push('/settings')}
                   style={[styles.editBtn, { flex: 1, backgroundColor: theme.secondary, borderColor: theme.border }]}
                >
                  <Text style={[styles.editBtnText, { color: theme.text }]}>Settings</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  onPress={() => router.push('/story/create')}
                  style={[styles.editBtn, { flex: 1, backgroundColor: '#FF3040', borderColor: '#FF3040' }]}
                >
                  <MaterialCommunityIcons name="plus" size={16} color="#FFFFFF" style={{ marginRight: 4 }} />
                  <Text style={[styles.editBtnText, { color: '#FFFFFF' }]}>Add Story</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

        {/* 2. IDENTITY BLOCK (NAME, BIO) */}
          <View style={[styles.infoBlock, styles.padded]}>
             <View style={styles.nameRow}>
                <Text style={[styles.name, { color: theme.text }]}>{user.name || 'SuviX Member'}</Text>
                <MaterialCommunityIcons name="check-decagram" size={18} color="#007AFF" style={{ marginLeft: 6 }} />
            </View>
            <Text style={[styles.roleLabel, { color: '#007AFF' }]}>CLIENT MEMBER</Text>
            
            <View style={styles.bioWrapper}>
               <Text style={[styles.bio, { color: theme.textSecondary }]}>
                 {user.bio || 'Building with SuviX...'}
               </Text>
               <TouchableOpacity onPress={() => setIsBioModalVisible(true)} style={styles.bioEditTrigger}>
                  <MaterialCommunityIcons name="pencil-outline" size={16} color={theme.accent} />
               </TouchableOpacity>
            </View>
          </View>

          {/* 📱 CENTRALIZED MEDIA ENGINE */}
          <ProfileContentTabs 
            userId={user.id} 
            theme={theme} 
            extraTabs={['DASHBOARD']}
            onRepairSuccess={() => fetchUser()}
            renderCustomTab={(tab) => (
              <View>
                {/* 3. ENTERTAINMENT HUB SECTION */}
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>My Entertainment Hub</Text>
                    <TouchableOpacity>
                      <Text style={{ color: '#007AFF', fontSize: 13, fontWeight: '600' }}>View All</Text>
                    </TouchableOpacity>
                  </View>

                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
                    {[1, 2, 3].map((i) => (
                      <TouchableOpacity key={i} style={[styles.videoCard, { backgroundColor: theme.secondary }]}>
                        <View style={styles.videoThumbPlaceholder}>
                           <Ionicons name="play" size={30} color="#fff" />
                        </View>
                        <View style={styles.videoInfo}>
                           <Text style={[styles.videoTitle, { color: theme.text }]} numberOfLines={1}>Saved Content...</Text>
                           <Text style={[styles.videoSub, { color: theme.textSecondary }]}>Watched 2d ago</Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                {/* 4. MANAGEMENT DASHBOARD */}
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 12 }]}>Management Dashboard</Text>
                  <View style={styles.grid}>
                    {[
                      { label: 'My Orders', icon: 'wallet-outline' },
                      { label: 'Messages', icon: 'chat-processing-outline' },
                      { label: 'Hired Experts', icon: 'account-group-outline' },
                      { label: 'Settings', icon: 'cog-outline' }
                    ].map((item, idx) => (
                      <TouchableOpacity key={idx} style={[styles.gridItem, { backgroundColor: theme.secondary, borderColor: theme.border }]}>
                        <MaterialCommunityIcons name={item.icon as any} size={24} color={theme.text} />
                        <Text style={[styles.gridLabel, { color: theme.text }]}>{item.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            )}
          />

        </View>
        <View style={{ height: 100 }} />
          </>
        )}
      </ScrollView>

      {/* Bio Modal */}
      <Modal visible={isBioModalVisible} transparent animationType="fade">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.primary, borderColor: theme.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Edit Bio</Text>
              <TouchableOpacity onPress={() => setIsBioModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
            <TextInput
              multiline
              placeholder="Tell your story..."
              placeholderTextColor={theme.textSecondary}
              value={tempBio}
              onChangeText={setTempBio}
              maxLength={150}
              style={[styles.bioInput, { color: theme.text, backgroundColor: theme.secondary, borderColor: theme.border }]}
            />
            <TouchableOpacity onPress={handleUpdateBio} style={[styles.saveBtn, { backgroundColor: '#007AFF' }]}>
              <Text style={styles.saveBtnText}>{isSaving ? 'Saving...' : 'Save Biography'}</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabBar: { flexDirection: 'row', borderBottomWidth: 1, paddingHorizontal: 15 },
  tabItem: { paddingVertical: 12, marginRight: 25, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabLabel: { fontSize: 13, fontWeight: '800', letterSpacing: 0.5 },
  content: { paddingTop: 0, paddingBottom: 40 },
  banner: { height: 100, width: '100%', justifyContent: 'center', alignItems: 'center' },
  bannerOverlay: { opacity: 0.3 },
  profileWrap: { marginTop: -20, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 10 },
  padded: { paddingHorizontal: 25 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginTop: -40, gap: 15 },
  avatarContainer: { position: 'relative', zIndex: 10, elevation: 12 },
  avatarInner: {
    position: 'relative',
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 4,
  },
  avatarLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 45,
    overflow: 'hidden'
  },
  headerStats: { flex: 1, justifyContent: 'center' },
  miniStatsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14, paddingRight: 5, marginTop: -8 },
  miniStat: { alignItems: 'center' },
  miniStatValue: { fontSize: 18, fontWeight: '900' },
  miniStatLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', opacity: 0.8 },
  editBtn: { height: 36, borderRadius: 10, borderWidth: 1, justifyContent: 'center', alignItems: 'center', flexDirection: 'row' },
  editBtnText: { fontSize: 12, fontWeight: '700' },
  infoBlock: { marginTop: 15 },
  nameRow: { flexDirection: 'row', alignItems: 'center' },
  name: { fontSize: 18, fontWeight: '900', letterSpacing: -0.5 },
  avatarEditBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#007AFF',
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 30,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  settingsIcon: {
    padding: 8,
    marginLeft: 4,
  },
  roleLabel: { fontSize: 11, fontWeight: '900', marginTop: 2, letterSpacing: 1 },
  bio: { fontSize: 13, marginTop: 8, lineHeight: 18, flex: 1 },
  bioWrapper: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  bioEditTrigger: { padding: 4 },
  addBioBtn: { flexDirection: 'row', alignItems: 'center', marginTop: 10, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1, borderStyle: 'dashed', gap: 10 },
  addBioText: { fontSize: 13, fontWeight: '700' },
  section: { marginTop: 24, paddingHorizontal: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '800' },
  horizontalScroll: { paddingRight: 20, gap: 12 },
  videoCard: { width: 200, borderRadius: 16, overflow: 'hidden' },
  videoThumbPlaceholder: { height: 110, backgroundColor: '#334155', alignItems: 'center', justifyContent: 'center' },
  videoInfo: { padding: 10 },
  videoTitle: { fontSize: 13, fontWeight: '700' },
  videoSub: { fontSize: 11, marginTop: 2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  gridItem: { width: (width - 50) / 2, height: 100, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  gridLabel: { marginTop: 8, fontSize: 13, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { padding: 24, borderTopLeftRadius: 32, borderTopRightRadius: 32, borderWidth: 1, minHeight: '40%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '900' },
  bioInput: { fontSize: 16, borderRadius: 12, borderWidth: 1, padding: 16, minHeight: 100, textAlignVertical: 'top' },
  saveBtn: { marginTop: 20, height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  saveBtnText: { color: 'white', fontSize: 15, fontWeight: '800' },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContentCentered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeModalBtn: {
    position: 'absolute',
    top: 60,
    right: 30,
    zIndex: 100,
  },
  enlargedAvatar: {
    width: 320,
    height: 320,
    borderRadius: 160,
    borderWidth: 6,
  },
});
