import React from 'react';
import Animated, { 
  SharedValue, 
  useAnimatedStyle, 
  interpolate, 
  Extrapolate,
  useDerivedValue
} from 'react-native-reanimated';
import {
  View,
  Text,
  StyleSheet,
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
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../../store/useAuthStore';
import { ProfileSkeletonContent } from '../../shared/skeletons/ProfileSkeleton';
import { useTheme } from '../../../context/ThemeContext';
import { useRefreshManager } from '../../../hooks/useRefreshManager';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { api } from '../../../api/client';
import * as ImagePicker from 'expo-image-picker';
import { formatCount } from '../../../utils/formatters';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { SmartText } from '../../shared/content/SmartText';
import { ProfileContentTabs } from '../../shared/profiles/ProfileContentTabs';

const { width } = Dimensions.get('window');
const DEFAULT_AVATAR = require('../../../../assets/defualtprofile.png');

/**
 * PERFECTED PREMIUM CLIENT PROFILE
 * Indistinguishable from the YouTube Creator layout.
 */
export default function ClientProfile({ scrollY }: { scrollY?: SharedValue<number> }) {
  const { theme, isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();
  const { user, updateUser, fetchUser, setIsRefreshing, isLoadingUser, isRefreshing } = useAuthStore();
  const router = useRouter();

  const [isBioModalVisible, setIsBioModalVisible] = React.useState(false);
  const [tempBio, setTempBio] = React.useState(user?.bio || '');
  const [isAvatarModalVisible, setIsAvatarModalVisible] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = React.useState(false);
  const BANNER_HEIGHT = 160;
  const MIN_HEADER_HEIGHT = insets.top + 56;
  
  // 🛰️ Syncing with Parent Scroll
  const scrollOffset = scrollY || { value: 0 };

  // 📐 Parallax & Morphing Styles
  const bannerAnimatedStyle = useAnimatedStyle(() => {
    return {
      height: interpolate(
        scrollOffset.value,
        [-BANNER_HEIGHT, 0, BANNER_HEIGHT],
        [BANNER_HEIGHT * 2, BANNER_HEIGHT, BANNER_HEIGHT],
        Extrapolate.CLAMP
      ),
      transform: [
        {
          translateY: interpolate(
            scrollOffset.value,
            [-BANNER_HEIGHT, 0, BANNER_HEIGHT],
            [-BANNER_HEIGHT / 2, 0, BANNER_HEIGHT * 0.75],
            Extrapolate.CLAMP
          ),
        },
      ],
    };
  });

  const headerOpacity = useAnimatedStyle(() => {
    return {
      opacity: interpolate(
        scrollOffset.value,
        [0, BANNER_HEIGHT - MIN_HEADER_HEIGHT],
        [0, 1],
        Extrapolate.CLAMP
      ),
    };
  });

  const avatarAnimatedStyle = useAnimatedStyle(() => {
    const size = interpolate(
      scrollOffset.value,
      [0, BANNER_HEIGHT - MIN_HEADER_HEIGHT],
      [90, 40],
      Extrapolate.CLAMP
    );
    
    return {
      width: size,
      height: size,
      borderRadius: size / 2,
      transform: [
        {
          translateY: interpolate(
            scrollOffset.value,
            [0, BANNER_HEIGHT - MIN_HEADER_HEIGHT],
            [0, -insets.top - 5],
            Extrapolate.CLAMP
          ),
        },
        {
          translateX: interpolate(
            scrollOffset.value,
            [0, BANNER_HEIGHT - MIN_HEADER_HEIGHT],
            [0, width / 2 - 45], // Move to center-ish or side
            Extrapolate.CLAMP
          ),
        },
      ],
    };
  });

  const onRefresh = React.useCallback(async () => {
    setIsRefreshing(true);
    try {
      await fetchUser();
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchUser, setIsRefreshing]);

  const handleRefresh = useRefreshManager(onRefresh);

  if (isLoadingUser && !user) return null;
  if (!user) return null;



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

  const BioModal = React.memo(({ visible, onClose, onSave, currentBio }: any) => {
    const [localBio, setLocalBio] = React.useState(currentBio || '');
    const [selection, setSelection] = React.useState({ start: 0, end: 0 });

    React.useEffect(() => {
      setLocalBio(currentBio || '');
    }, [currentBio, visible]);

    const insertShortcut = (symbol: string) => {
      const before = localBio.substring(0, selection.start);
      const after = localBio.substring(selection.end);
      const newText = before + symbol + after;
      if (newText.length <= 250) setLocalBio(newText);
    };

    return (
      <Modal visible={visible} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={modalStyles.overlay}>
          <View style={[modalStyles.content, { backgroundColor: theme.primary, borderColor: theme.border }]}>
            <View style={modalStyles.header}>
              <Text style={[modalStyles.title, { color: theme.text }]}>Edit Bio</Text>
              <TouchableOpacity onPress={onClose}>
                <MaterialCommunityIcons name="close" size={24} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={[modalStyles.inputContainer, { backgroundColor: theme.secondary, borderColor: theme.border }]}>
              <TextInput
                multiline
                autoFocus
                maxLength={250}
                placeholder="Tell your story..."
                placeholderTextColor={theme.textSecondary}
                style={[modalStyles.input, { color: theme.text }]}
                value={localBio}
                onChangeText={setLocalBio}
                onSelectionChange={(e) => setSelection(e.nativeEvent.selection)}
              />
              <View style={modalStyles.charCountRow}>
                <Text style={[modalStyles.charCount, { color: localBio.length > 200 ? '#FF0000' : theme.textSecondary }]}>
                  {localBio.length} / 250
                </Text>
              </View>
            </View>

            <View style={modalStyles.shortcuts}>
              {['🔥', '🚀', '✨', '📸', '⚡️'].map(s => (
                <TouchableOpacity key={s} onPress={() => insertShortcut(s)} style={[modalStyles.shortcutBtn, { backgroundColor: theme.secondary }]}>
                  <Text style={modalStyles.shortcutText}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity 
              style={[modalStyles.saveBtn, { backgroundColor: theme.accent }]}
              onPress={() => onSave(localBio)}
            >
              <Text style={modalStyles.saveBtnText}>{isSaving ? 'Saving...' : 'Save Changes'}</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    );
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.primary }]}>
      {/* 🏙️ DYNAMIC BLUR BANNER LAYER */}
      <Animated.View style={[styles.bannerContainer, bannerAnimatedStyle]}>
        <View style={[StyleSheet.absoluteFill, { backgroundColor: isDarkMode ? '#09090B' : '#F4F4F5' }]} />
        <View style={styles.bannerOverlay}>
           <View style={[styles.bannerLogoBadge, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.015)' : 'rgba(0,0,0,0.01)' }]}>
             <MaterialCommunityIcons 
               name="infinity" 
               size={40} 
               color={isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'} 
             />
           </View>
        </View>
      </Animated.View>

      {/* 🕶️ STICKY GLASS HEADER (Morphs on Scroll) */}
      <Animated.View style={[
        styles.stickyHeader, 
        { height: MIN_HEADER_HEIGHT, backgroundColor: theme.primary },
        headerOpacity
      ]}>
        <BlurView intensity={isDarkMode ? 80 : 40} tint={isDarkMode ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
        <View style={[styles.headerContent, { paddingTop: insets.top }]}>
          <Text style={[styles.stickyTitle, { color: theme.text }]}>@{user.username?.toLowerCase()}</Text>
        </View>
      </Animated.View>

      {/* 🏷️ TOP-LEFT IDENTITY (Fades with Scroll) */}
      <Animated.View style={[styles.bannerTopLeft, { top: insets.top + 10, zIndex: 999 }]}>
        <TouchableOpacity style={styles.usernameRow} activeOpacity={0.7}>
          <Text style={[styles.bannerUsername, { color: isDarkMode ? '#FFF' : '#000' }]}>
            {user.username?.toLowerCase()}
          </Text>
          <Feather name="chevron-down" size={14} color={isDarkMode ? '#FFF' : '#000'} style={{ marginLeft: 4 }} />
        </TouchableOpacity>
      </Animated.View>

      <Animated.ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={[styles.scrollContent, { paddingTop: BANNER_HEIGHT }]}
        onScroll={(e) => {
          if (scrollY) {
            scrollY.value = e.nativeEvent.contentOffset.y;
          }
        }}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl 
            refreshing={isRefreshing} 
            onRefresh={handleRefresh} 
            tintColor={theme.accent} 
            colors={[theme.accent]} 
            progressViewOffset={BANNER_HEIGHT + 20}
          />
        }
      >
        <View style={[styles.profileWrap, { backgroundColor: theme.primary }]}>
          {/* 🌑 OBSIDIAN GLASS CARD */}
          <View style={[styles.mainCard, { backgroundColor: theme.primary }]}>
            <View style={[styles.headerRow, styles.padded]}>
              <Animated.View style={[styles.avatarContainer, avatarAnimatedStyle]}>
                <TouchableOpacity 
                  style={styles.avatarInner} 
                  onPress={() => setIsAvatarModalVisible(true)}
                  activeOpacity={0.9}
                  disabled={isUploadingAvatar}
                >
                  <Image
                    source={user.profilePicture ? { uri: user.profilePicture } : DEFAULT_AVATAR}
                    style={[styles.avatar, { borderColor: theme.primary }]}
                    contentFit="cover"
                  />
                  {!isRefreshing && (
                    <TouchableOpacity 
                      style={[styles.avatarEditBadge, { backgroundColor: theme.accent }]}
                      onPress={handlePickMedia}
                    >
                      <MaterialCommunityIcons name="camera" size={12} color="#FFFFFF" />
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
              </Animated.View>

              <View style={styles.headerStats}>
                <View style={styles.miniStatsRow}>
                  <StatModule label="Followers" value={formatCount(user.followers || 0)} theme={theme} />
                  <StatModule label="Following" value={formatCount(user.following || 0)} theme={theme} />
                  <StatModule label="Posts" value={formatCount(user.postsCount || 0)} theme={theme} />
                </View>
              </View>
            </View>

            {/* 🍱 BENTO ACTION GRID */}
            <View style={[styles.bentoGrid, styles.padded]}>
              <TouchableOpacity 
                onPress={() => router.push('/settings')}
                style={[styles.bentoItemLarge, { backgroundColor: isDarkMode ? '#1A1A1A' : '#F1F3F5' }]}
              >
                <View style={styles.bentoIconCircle}>
                  <Feather name="settings" size={20} color={theme.accent} />
                </View>
                <Text style={[styles.bentoLabel, { color: theme.text }]}>Settings</Text>
                <Text style={[styles.bentoSublabel, { color: theme.textSecondary }]}>Account & Security</Text>
              </TouchableOpacity>

              <View style={styles.bentoRightCol}>
                <TouchableOpacity 
                  onPress={() => router.push('/story/create')}
                  style={[styles.bentoItemSmall, { backgroundColor: isDarkMode ? '#1A1A1A' : '#F1F3F5' }]}
                >
                  <MaterialCommunityIcons name="plus-circle-outline" size={24} color="#0044FF" />
                  <Text style={[styles.bentoLabelSmall, { color: theme.text }]}>Add Story</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.bentoItemSmall, { backgroundColor: isDarkMode ? '#1A1A1A' : '#F1F3F5' }]}
                >
                  <MaterialCommunityIcons name="wallet-outline" size={24} color="#22C55E" />
                  <Text style={[styles.bentoLabelSmall, { color: theme.text }]}>Wallet</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={[styles.infoBlock, styles.padded]}>
               <View style={styles.nameRow}>
                  <Text style={[styles.name, { color: theme.text }]}>{user.name || 'Premium Member'}</Text>
                  <View style={styles.statusDot} />
                  <MaterialCommunityIcons name="shield-check" size={18} color="#0044FF" style={{ marginLeft: 4 }} />
               </View>
               
               <View style={styles.experienceRow}>
                 <Feather name="anchor" size={10} color={theme.textSecondary} />
                 <Text style={[styles.experienceText, { color: theme.textSecondary, marginLeft: 4 }]}>
                    VERIFIED CLIENT • {new Date().getFullYear()} MEMBER
                 </Text>
               </View>

               {isSaving ? (
                 <View style={styles.bioLoadingWrap}>
                   <ActivityIndicator size="small" color={theme.accent} />
                 </View>
               ) : user.bio ? (
                 <View style={styles.bioWrapper}>
                    <SmartText text={user.bio} style={[styles.bio, { color: theme.textSecondary }]} />
                    <TouchableOpacity onPress={() => setIsBioModalVisible(true)} style={styles.bioEditIcon}>
                       <Feather name="edit-3" size={14} color={theme.textSecondary} />
                    </TouchableOpacity>
                 </View>
               ) : (
                 <TouchableOpacity 
                   onPress={() => setIsBioModalVisible(true)} 
                   style={[styles.addBioBtn, { backgroundColor: theme.secondary }]}
                 >
                   <Text style={[styles.addBioText, { color: theme.textSecondary }]}>+ Add a professional bio</Text>
                 </TouchableOpacity>
               )}
            </View>

            <View style={styles.tabsSection}>
              <ProfileContentTabs userId={user.id} theme={theme} />
            </View>
          </View>
        </View>
        <View style={{ height: 60 }} />
      </Animated.ScrollView>

      <BioModal 
        visible={isBioModalVisible} 
        onClose={() => setIsBioModalVisible(false)}
        onSave={(newBio: string) => {
          setTempBio(newBio);
          handleUpdateBio();
        }}
        currentBio={user.bio}
      />
    </View>
  );
}

function StatModule({ label, value, theme }: any) {
  return (
    <View style={styles.miniStat}>
      <Text style={[styles.miniStatValue, { color: theme.text }]}>{value}</Text>
      <Text style={[styles.miniStatLabel, { color: theme.textSecondary }]}>{label}</Text>
    </View>
  );
}

const modalStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  content: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, borderTopWidth: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 18, fontWeight: '800' },
  inputContainer: { borderRadius: 16, borderWidth: 1, padding: 12, minHeight: 120 },
  input: { fontSize: 15, fontWeight: '500', lineHeight: 22, height: 100, textAlignVertical: 'top' },
  charCountRow: { alignItems: 'flex-end', marginTop: 8 },
  charCount: { fontSize: 10, fontWeight: '700' },
  shortcuts: { flexDirection: 'row', marginTop: 15, gap: 10 },
  shortcutBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  shortcutText: { fontSize: 18 },
  saveBtn: { height: 50, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginTop: 25 },
  saveBtnText: { color: 'white', fontSize: 16, fontWeight: '800' },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  
  // 🏙️ Banner Styles
  bannerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
    zIndex: 0,
  },
  bannerLogoBadge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // 🕶️ Sticky Header
  stickyHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  headerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  stickyTitle: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
  },

  // 🏷️ Identity Styles
  bannerTopLeft: {
    position: 'absolute',
    left: 20,
  },
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bannerUsername: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  // 🃏 Main Profile Wrap
  profileWrap: {
    marginTop: -30,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: 'hidden',
  },
  mainCard: {
    flex: 1,
    paddingTop: 20,
  },

  // 👤 Header Row (Avatar + Stats)
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    marginBottom: 25,
  },
  avatarContainer: {
    zIndex: 10,
  },
  avatarInner: {
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 10,
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 45,
    borderWidth: 3,
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,1)',
  },

  // 📊 Stats Styles
  headerStats: {
    flex: 1,
  },
  miniStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingRight: 5,
  },
  miniStat: {
    alignItems: 'center',
  },
  miniStatValue: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  miniStatLabel: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 1,
    opacity: 0.6,
  },

  // 🍱 Bento Grid
  bentoGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  bentoItemLarge: {
    flex: 1.4,
    padding: 16,
    borderRadius: 20,
    justifyContent: 'center',
  },
  bentoIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  bentoLabel: {
    fontSize: 15,
    fontWeight: '800',
  },
  bentoSublabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 1,
  },
  bentoRightCol: {
    flex: 1,
    gap: 10,
  },
  bentoItemSmall: {
    flex: 1,
    padding: 12,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  bentoLabelSmall: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },

  // 📝 Info Block
  infoBlock: {
    marginBottom: 20,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  name: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22C55E',
    marginLeft: 6,
    marginTop: 4,
  },
  experienceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  experienceText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  bioWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  bio: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  bioEditIcon: {
    padding: 4,
  },
  addBioBtn: {
    padding: 15,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
  },
  addBioText: {
    fontSize: 13,
    fontWeight: '700',
  },

  // 🧩 Tabs Section
  tabsSection: {
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },

  padded: {
    paddingHorizontal: 25,
  },
  bioLoadingWrap: { padding: 10, alignItems: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContentCentered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  closeModalBtn: { position: 'absolute', top: 60, right: 30, zIndex: 100 },
  enlargedAvatar: { width: 320, height: 320, borderRadius: 160, borderWidth: 6 },
});
