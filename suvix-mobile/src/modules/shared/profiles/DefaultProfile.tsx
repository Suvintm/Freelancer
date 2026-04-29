import React from 'react';
import Animated, { SharedValue } from 'react-native-reanimated';
import { useAuthStore } from '../../../store/useAuthStore';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { useRefreshManager } from '../../../hooks/useRefreshManager';
import { Colors } from '../../../constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { formatCount } from '../../../utils/formatters';
import { BlurView } from 'expo-blur';
import { Modal } from 'react-native';

import { ProfileContentTabs } from '../../shared/profiles/ProfileContentTabs';
import { useRouter } from 'expo-router';
import { Image as ExpoImage } from 'expo-image';
import { MaterialCommunityIcons, Ionicons, Feather } from '@expo/vector-icons';
import { useState } from 'react';
import { ProfileSkeleton, ProfileSkeletonContent } from '../../shared/skeletons/ProfileSkeleton';
import * as ImagePicker from 'expo-image-picker';
import { api } from '../../../api/client';

const DEFAULT_AVATAR = require('../../../../assets/defualtprofile.png');

export default function DefaultProfile({ scrollY }: { scrollY?: SharedValue<number> }) {
  const { theme } = useTheme();
  const { user, isRefreshing, setIsRefreshing, isLoadingUser, fetchUser } = useAuthStore();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isAvatarModalVisible, setIsAvatarModalVisible] = useState(false);

  const onRefresh = React.useCallback(async () => {
    setIsRefreshing(true);
    try {
      await useAuthStore.getState().fetchUser();
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchUser, setIsRefreshing]);

  const handleRefresh = useRefreshManager(onRefresh);

  if (isLoadingUser && !user) return <ProfileSkeleton />;
  if (!user) return null;

  const displayName = user.name || 'SuviX User';
  const username = user.username ? `@${user.username}` : '@suvix_member';
  const roleText = user.primaryRole?.category || user.role || 'Member';
  const bioText = `Building with SuviX as ${roleText}.`;
  // 📐 SURGICAL LAYOUT: Banner flows all the way to the top under status bar
  const headerOffset = 0;

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
      const type = match ? `image/${match[1]}` : `image/jpeg`;

      // @ts-ignore
      formData.append('image', { 
        uri: Platform.OS === 'android' ? uri : uri.replace('file://', ''), 
        name: filename, 
        type 
      });

      const res = await api.post('/user/me/profile-picture', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (res.data.success) {
        useAuthStore.getState().updateUser({ profilePicture: res.data.profilePicture });
        Alert.alert("Success", "Profile picture updated!");
      }
    } catch (error: any) {
      console.error('Upload Avatar Error:', error);
      Alert.alert("Error", "Could not upload image. Please try again.");
    } finally {
      setIsUploadingAvatar(false);
    }
  };


  return (
    <View style={[styles.container, { backgroundColor: theme.primary }]}>
      {/* 🕶️ STATUS BAR OVERLAY FOR LEGIBILITY */}
      <LinearGradient
        colors={['rgba(0,0,0,0.6)', 'transparent']}
        style={{ position: 'absolute', top: 0, width: '100%', height: insets.top + 20, zIndex: 100 }}
        pointerEvents="none"
      />
      <Animated.ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={[styles.content, { paddingTop: headerOffset }]}
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
        {/* 🟦 BLUE Dynamic Banner */}
        <LinearGradient
          colors={['#0044FF', '#0022AA', '#000000']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.banner}
        >
          <View style={styles.bannerOverlay}>
            <MaterialCommunityIcons name="account" size={40} color="rgba(255,255,255,0.2)" />
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
                <ExpoImage
                  source={user.profilePicture ? { uri: user.profilePicture } : DEFAULT_AVATAR}
                  style={[styles.avatar, { borderColor: theme.primary }]}
                  contentFit="cover"
                  transition={200}
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

                         <ExpoImage
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
                  <View style={[styles.avatarLoadingOverlay, { backgroundColor: 'rgba(0,0,0,0.4)' }]}>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  </View>
                )}
              </TouchableOpacity>
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
                <View style={styles.miniStat}>
                  <Text style={[styles.miniStatValue, { color: '#FFFFFF' }]}>PRO</Text>
                  <Text style={[styles.miniStatLabel, { color: '#FFFFFF' }]}>Member</Text>
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity 
                  onPress={() => router.push('/settings')}
                  style={[styles.editBtn, { flex: 1, backgroundColor: theme.secondary, borderColor: theme.border }]}
                >
                  <Text style={[styles.editBtnText, { color: theme.text }]}>Settings</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  onPress={() => router.push('/story/create')}
                  style={[styles.editBtn, { flex: 1, backgroundColor: '#0044FF', borderColor: '#0044FF' }]}
                >
                  <MaterialCommunityIcons name="plus" size={16} color="#FFFFFF" style={{ marginRight: 4 }} />
                  <Text style={[styles.editBtnText, { color: '#FFFFFF' }]}>Add Story</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.miniToolboxRow}>
                <TouchableOpacity style={[styles.miniToolItem, { backgroundColor: theme.secondary }]}>
                  <MaterialCommunityIcons name="chart-bell-curve-cumulative" size={14} color="#0044FF" />
                  <Text style={[styles.miniToolText, { color: theme.text }]}>Insights</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.miniToolItem, { backgroundColor: theme.secondary }]}>
                  <MaterialCommunityIcons name="wallet-outline" size={14} color={theme.accent} />
                  <Text style={[styles.miniToolText, { color: theme.text }]}>Wallet</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.miniToolItem, { backgroundColor: theme.secondary }]}>
                  <MaterialCommunityIcons name="shield-check-outline" size={14} color="#22C55E" />
                  <Text style={[styles.miniToolText, { color: theme.text }]}>Verified</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={[styles.infoBlock, styles.padded, { marginTop: 4 }]}>
             <View style={[styles.nameRow, { paddingLeft: 12 }]}>
                <Text style={[styles.name, { color: theme.text }]}>{displayName}</Text>
                <MaterialCommunityIcons name="check-decagram" size={16} color="#0044FF" style={{ marginLeft: 6 }} />
             </View>
             
             <View style={styles.nicheRow}>
               <View style={[styles.nicheChip, { backgroundColor: theme.secondary, borderColor: theme.border }]}>
                 <Text style={[styles.nicheChipText, { color: theme.textSecondary }]}>{roleText.toUpperCase()}</Text>
               </View>
             </View>
             
             {/* 📍 Global Experience Line */}
             <View style={styles.experienceRow}>
               <Feather name="globe" size={10} color={theme.textSecondary} />
               <Text style={[styles.experienceText, { color: theme.textSecondary, marginLeft: 4 }]}>
                 {user.username ? `@${user.username.toUpperCase()}` : 'GLOBAL MEMBER'}
               </Text>
             </View>

             <View style={styles.bioWrapper}>
               <View style={{ flex: 1 }}>
                 <Text style={[styles.bio, { color: theme.textSecondary }]}>{bioText}</Text>
               </View>
             </View>
          </View>
        </View>

        {/* 📱 CENTRALIZED MEDIA ENGINE */}
        <ProfileContentTabs 
          userId={user.id} 
          theme={theme} 
          onRepairSuccess={() => {}}
        />
          </>
        )}
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingTop: 10,
    paddingBottom: 20,
  },
  banner: { height: 100, width: '100%', justifyContent: 'center', alignItems: 'center' },
  bannerOverlay: { opacity: 0.5 },
  profileWrap: { marginTop: -20, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 20 },
  padded: { paddingHorizontal: 25 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginTop: -40, gap: 15 },
  avatarContainer: { position: 'relative' },
  avatarInner: { position: 'relative' },
  avatar: { width: 90, height: 90, borderRadius: 45, borderWidth: 4 },
  avatarEditBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#0044FF',
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
  avatarLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 45,
    overflow: 'hidden'
  },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  modalContentCentered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  closeModalBtn: { position: 'absolute', top: 60, right: 30, zIndex: 100 },
  enlargedAvatar: { width: 320, height: 320, borderRadius: 160, borderWidth: 6 },
  headerStats: { flex: 1, paddingTop: 10 },
  miniStatsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, paddingHorizontal: 5 },
  miniStat: { alignItems: 'center' },
  miniStatValue: { fontSize: 16, fontWeight: '900', letterSpacing: -0.5 },
  miniStatLabel: { fontSize: 9, fontWeight: '800', marginTop: 2, textTransform: 'uppercase', opacity: 0.8, letterSpacing: 0.5 },
  editBtn: {
    paddingVertical: 7,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  editBtnText: { fontSize: 11, fontWeight: '800' },
  miniToolboxRow: { flexDirection: 'row', gap: 6, marginTop: 8 },
  miniToolItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
    borderRadius: 6,
    gap: 4,
  },
  miniToolText: { fontSize: 9, fontWeight: '700' },
  infoBlock: { marginTop: 12 },
  nameRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 0 },
  name: { fontSize: 17, fontWeight: '800', letterSpacing: -0.5 },
  nicheRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6, paddingLeft: 12 },
  nicheChip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1 },
  nicheChipText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  experienceRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, paddingLeft: 12 },
  experienceText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  bioWrapper: { marginTop: 12, flexDirection: 'row', alignItems: 'flex-start', paddingLeft: 12 },
  bio: { fontSize: 13, lineHeight: 18, fontWeight: '500' },

});
