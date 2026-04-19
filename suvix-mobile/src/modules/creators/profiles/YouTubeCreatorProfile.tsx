import React from 'react';
import { useAuthStore } from '../../../store/useAuthStore';
import { useSocketStore } from '../../../store/useSocketStore';
import { Image } from 'expo-image';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Linking,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { api } from '../../../api/client';
import { useTheme } from '../../../context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, Feather, Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../constants/Colors';
import { formatCount } from '../../../utils/formatters';
import { BlurView } from 'expo-blur';

import { ProfileContentTabs } from '../../shared/profiles/ProfileContentTabs';
import { ContentGrid } from '../../shared/content/ContentGrid';
import { useRouter } from 'expo-router';
import { ProfileSkeleton, ProfileSkeletonContent } from '../../shared/skeletons/ProfileSkeleton';
import { useRefreshManager } from '../../../hooks/useRefreshManager';
import { SmartText } from '../../shared/content/SmartText';

// 🏆 Achievement Assets
const SILVER_BTN = require('../../../../assets/images/playbutton/silverbtn.png');
const GOLD_BTN = require('../../../../assets/images/playbutton/goldenbtn.png');
const DIAMOND_BTN = require('../../../../assets/images/playbutton/diamondbtn.png');

const DEFAULT_AVATAR = require('../../../../assets/defualtprofile.png');


const { width } = Dimensions.get('window');

export default function YouTubeCreatorProfile() {
  const { theme } = useTheme();
  const { user, updateUser, fetchUser, setYoutubeVideos, setIsRefreshing, isLoadingUser, isRefreshing } = useAuthStore();
  const { socket } = useSocketStore();
  const router = useRouter();

  // 🛡️ [STATE] Track profile image load failures for linked channels
  const [avatarErrors, setAvatarErrors] = React.useState<Record<string, boolean>>({});

  // 🔗 WEB SOCKET: Real-time Surgical Sync Listener
  React.useEffect(() => {
    if (!socket) return;

    const handleSyncComplete = async (data: any) => {
      if (data.type === 'SYNC_COMPLETE') {
        console.log('🔄 [SYNC] Real-time surgical signal received!');
        console.log('📦 [SYNC-META]:', JSON.stringify(data.metadata || {}, null, 2));
        
        if (data.metadata?.videos && Array.isArray(data.metadata.videos)) {
          console.log(`🎬 [SYNC] Injecting ${data.metadata.videos.length} videos into store.`);
          setYoutubeVideos(data.metadata.videos);
        } else {
          console.log('⚠️ [SYNC] No video metadata found in signal, fetching full profile...');
          await fetchUser();
        }
      }
    };

    socket.on('notification:new', handleSyncComplete);

    return () => {
      socket.off('notification:new', handleSyncComplete);
    };
  }, [socket, fetchUser]);

  const insets = useSafeAreaInsets();

  const [isBioModalVisible, setIsBioModalVisible] = React.useState(false);
  const [isAvatarModalVisible, setIsAvatarModalVisible] = React.useState(false);
  const [isSavingBio, setIsSavingBio] = React.useState(false);
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
  if (!user || !user.youtubeProfile || user.youtubeProfile.length === 0) return null;

  const youtubeProfiles = user.youtubeProfile;
  // Use primary channel or first channel for main identity
  const primaryChannel = youtubeProfiles.find(p => p.is_primary) || youtubeProfiles[0];
  
  // Aggregate Stats for Header
  const totalSubscribers = youtubeProfiles.reduce((acc, p) => acc + (p.subscriber_count || 0), 0);
  const totalVideos = youtubeProfiles.reduce((acc, p) => acc + (p.video_count || 0), 0);
  
  const displayName = user.name || primaryChannel.channel_name;
  const subCategoryName = user.primaryRole?.subCategory || 'YouTube Creator';

  // Calculate header height (Navbar 50 + Safe Area Inset Top)
  const headerOffset = insets.top + 50;

  const handleViewChannel = async (channelId: string) => {
    try {
      const url = `https://www.youtube.com/channel/${channelId}`;
      await Linking.openURL(url);
    } catch (error) {
      Alert.alert("Error", "Could not open YouTube link. Please check your internet connection or try again later.");
    }
  };

  

  const handleUpdateBio = async (newBio: string) => {
    if (newBio.length > 250) {
      Alert.alert("Limit Exceeded", "Bio must be 250 characters or less.");
      return;
    }

    setIsBioModalVisible(false); // Close Modal immediately for responsive feel
    setIsSavingBio(true);
    try {
      const res = await api.patch('/user/me', { bio: newBio });
      if (res.data.success) {
        updateUser({ bio: newBio });
      }
    } catch (error) {
       console.error('Update Bio Error:', error);
       Alert.alert("Error", "Could not update bio. Please try again.");
    } finally {
      setIsSavingBio(false);
    }
  };

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

      // @ts-ignore - FormData expects specialized object for files in RN
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
        {/* YT Dynamic Banner */}
        <LinearGradient
          colors={['#FF0000', '#990000', '#000000']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.banner}
        >
          <View style={styles.bannerOverlay}>
            <MaterialCommunityIcons name="youtube" size={40} color="rgba(255,255,255,0.2)" />
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
                  contentFit="cover"
                  cachePolicy="memory-disk"
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

                         <Image
                            source={user.profilePicture ? { uri: user.profilePicture } : DEFAULT_AVATAR}
                            style={[styles.enlargedAvatar, { borderColor: theme.primary }]}
                            contentFit="cover"
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
                  <Text style={[styles.miniStatValue, { color: '#FFFFFF' }]}>{formatCount(totalVideos)}</Text>
                  <Text style={[styles.miniStatLabel, { color: '#FFFFFF' }]}>Posts</Text>
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
                  style={[styles.editBtn, { flex: 1, backgroundColor: '#FF3040', borderColor: '#FF3040' }]}
                >
                  <MaterialCommunityIcons name="plus" size={16} color="#FFFFFF" style={{ marginRight: 4 }} />
                  <Text style={[styles.editBtnText, { color: '#FFFFFF' }]}>Add Story</Text>
                </TouchableOpacity>
              </View>
              

              <View style={styles.miniToolboxRow}>
                <TouchableOpacity style={[styles.miniToolItem, { backgroundColor: theme.secondary }]}>
                  <MaterialCommunityIcons name="chart-bell-curve-cumulative" size={14} color="#FF0000" />
                  <Text style={[styles.miniToolText, { color: theme.text }]}>Analytics</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.miniToolItem, { backgroundColor: theme.secondary }]}>
                  <MaterialCommunityIcons name="briefcase-outline" size={14} color={theme.accent} />
                  <Text style={[styles.miniToolText, { color: theme.text }]}>Deals</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.miniToolItem, { backgroundColor: theme.secondary }]}>
                  <MaterialCommunityIcons name="account-group-outline" size={14} color="#22C55E" />
                  <Text style={[styles.miniToolText, { color: theme.text }]}>Collab</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={[styles.infoBlock, styles.padded, { marginTop: 4 }]}>
             <View style={styles.nameRow}>
                <Text style={[styles.name, { color: theme.text }]}>{displayName}</Text>
                <MaterialCommunityIcons name="check-decagram" size={18} color="#FF3040" style={{ marginLeft: 6 }} />
             </View>
            <Text style={[styles.niche, { color: '#FF0000' }]}>{subCategoryName.toUpperCase()}</Text>
            {isSavingBio ? (
              <View style={styles.bioLoadingWrap}>
                <ActivityIndicator size="small" color={theme.accent} />
                <Text style={[styles.bioLoadingText, { color: theme.textSecondary }]}>Updating bio...</Text>
              </View>
            ) : user.bio ? (
              <View style={styles.bioWrapper}>
                <View style={{ flex: 1 }}>
                  <SmartText 
                    text={user.bio} 
                    style={[styles.bio, { color: theme.textSecondary }]} 
                  />
                </View>
                <TouchableOpacity 
                   onPress={() => setBioModalVisible(true)}
                  style={styles.bioEditTrigger}
                >
                  <MaterialCommunityIcons name="pencil-outline" size={16} color={theme.accent} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity 
                onPress={() => setBioModalVisible(true)} 
                style={[styles.addBioBtn, { borderColor: theme.border, backgroundColor: theme.secondary }]}
              >
                <MaterialCommunityIcons name="pencil-plus-outline" size={18} color={theme.accent} />
                <Text style={[styles.addBioText, { color: theme.textSecondary }]}>Add profile bio</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* 🏆 Milestone Achievements Row */}
          <View style={[styles.milestoneSection, styles.padded]}>
            <Text style={[styles.sectionTitleSmall, { color: theme.textSecondary }]}>YT CREATOR MILESTONES</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.milestoneScroll}
            >
              {[
                { label: 'Silver', count: 100, img: SILVER_BTN },
                { label: 'Gold', count: 1000, img: GOLD_BTN },
                { label: 'Diamond', count: 10000, img: DIAMOND_BTN },
              ].map((milestone) => {
                const unlockedChannels = youtubeProfiles.filter(p => (p.subscriber_count || 0) >= milestone.count).length;
                const isPartiallyUnlocked = unlockedChannels > 0;
                const isFullyUnlocked = unlockedChannels === youtubeProfiles.length && youtubeProfiles.length > 0;
                
                return (
                  <View key={milestone.label} style={styles.milestoneCard}>
                    <View style={[
                      styles.badgeWrapper, 
                      { backgroundColor: theme.secondary, borderColor: theme.border }
                    ]}>
                      <Image source={milestone.img} style={styles.milestoneImg} contentFit="contain" />
                      {!isPartiallyUnlocked && (
                        <View style={styles.lockOverlay}>
                          <MaterialCommunityIcons name="lock" size={20} color="#FFFFFF" />
                        </View>
                      )}
                    </View>
                    <Text style={[styles.milestoneLabel, { color: !isPartiallyUnlocked ? theme.textSecondary : theme.text }]}>
                      {milestone.label}
                    </Text>
                    <Text style={[styles.milestoneStatus, { color: isPartiallyUnlocked ? theme.accent : theme.textSecondary }]}>
                      {unlockedChannels} / {youtubeProfiles.length} Unlocked
                    </Text>
                  </View>
                );
              })}
            </ScrollView>
          </View>

          {/* Linked Channels Section */}
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: theme.text, marginTop: 0 }]}>Linked Channels ({youtubeProfiles.length})</Text>
            <TouchableOpacity 
              style={[styles.addChannelBtn, { backgroundColor: theme.secondary, borderColor: theme.accent }]}
              onPress={() => router.push('/creators/manual-link')}
            >
              <Feather name="plus-circle" size={14} color={theme.accent} />
              <Text style={[styles.addChannelBtnText, { color: theme.accent }]}>Add Another</Text>
            </TouchableOpacity>
          </View>
          
          {youtubeProfiles.map((channel, index) => {
            const channelKey = channel.id || channel.channel_id;
            const hasError = avatarErrors[channelKey];
            const profileUri = channel.thumbnail_url;

            return (
              <View key={channelKey} style={[styles.channelCard, { backgroundColor: theme.secondary, borderColor: theme.border, marginTop: index === 0 ? 0 : 10 }]}>
                <Image 
                  source={profileUri && !hasError ? { uri: profileUri } : DEFAULT_AVATAR} 
                  style={styles.channelThumb}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                  transition={200}
                  onError={() => {
                    console.warn(`❌ [YT-PROFILE] Failed to load avatar: ${profileUri}`);
                    setAvatarErrors(prev => ({ ...prev, [channelKey]: true }));
                  }}
                />
                <View style={styles.channelInfo}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={[styles.channelName, { color: theme.text }]} numberOfLines={1}>{channel.channel_name}</Text>
                  {channel.is_primary && (
                    <View style={styles.primaryBadge}>
                      <Text style={styles.primaryBadgeText}>PRIMARY</Text>
                    </View>
                  )}
                  {/* Channel Achievement Badges (Highest Only) */}
                  <View style={styles.channelBadgeRow}>
                    {(channel.subscriber_count || 0) >= 10000 ? (
                      <Image source={DIAMOND_BTN} style={styles.miniBadge} contentFit="contain" />
                    ) : (channel.subscriber_count || 0) >= 1000 ? (
                      <Image source={GOLD_BTN} style={styles.miniBadge} contentFit="contain" />
                    ) : (channel.subscriber_count || 0) >= 100 ? (
                      <Image source={SILVER_BTN} style={styles.miniBadge} contentFit="contain" />
                    ) : null}
                  </View>
                </View>
                <View style={styles.channelStatsRow}>
                  <View style={styles.channelStat}>
                    <MaterialCommunityIcons name="account-group" size={14} color="#FF0000" />
                    <Text style={[styles.channelStatText, { color: theme.textSecondary }]}>
                      {formatCount(channel.subscriber_count)}
                    </Text>
                  </View>
                  <View style={[styles.channelStat, { marginLeft: 12 }]}>
                    <MaterialCommunityIcons name="movie-play" size={14} color={theme.accent} />
                    <Text style={[styles.channelStatText, { color: theme.textSecondary }]}>
                      {formatCount(channel.video_count)}
                    </Text>
                  </View>
                </View>
              </View>
              <View style={styles.cardActions}>
                <MaterialCommunityIcons name="check-circle" size={16} color="#FF0000" style={{ marginBottom: 8 }} />
                <TouchableOpacity style={styles.viewBtn} onPress={() => handleViewChannel(channel.channel_id)}>
                  <Text style={[styles.viewBtnText, { color: theme.accent }]}>View</Text>
                  <MaterialCommunityIcons name="open-in-new" size={12} color={theme.accent} />
                </TouchableOpacity>
              </View>
            </View>
          );
        })}


          {/* 📱 CENTRALIZED MEDIA ENGINE */}
          <ProfileContentTabs 
            userId={user.id}
            theme={theme}
            extraTabs={['YT POSTS']}
            onRepairSuccess={() => fetchUser()}
            renderCustomTab={(tab) => {
              if (tab !== 'YT POSTS') return null;

              const videoItems = (user.youtubeVideos || []).map((video: any) => ({
                id: video.video_id || video.id,
                thumbnail: video.thumbnail,
                type: 'YT VIDEOS' as const,
                title: video.title,
                published_at: video.published_at || video.publishedAt,
                // 🛰️ NORMALIZE FOR GRID ENGINE
                isProcessing: false
              }));

              const handleItemPress = (item: any) => {
                const url = `https://www.youtube.com/watch?v=${item.id}`;
                console.log(`🎬 [YT-OPEN] Launching: ${url}`);
                Linking.openURL(url);
              };

              return (
                <View style={styles.feedContainer}>
                  {videoItems.length > 0 ? (
                    <ContentGrid 
                      data={videoItems}
                      mode="grid"
                      onItemPress={handleItemPress}
                    />
                  ) : (
                    <View style={styles.emptyFeed}>
                      <MaterialCommunityIcons name="video-off-outline" size={48} color={theme.textSecondary} />
                      <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No posts found.</Text>
                    </View>
                  )}
                </View>
              );
            }}
          />
        </View>
          </>
        )}
      </ScrollView>

      {/* Bio Update Modal (Optimized) */}
      <BioEditModal 
        visible={isBioModalVisible} 
        onClose={() => setBioModalVisible(false)}
        onSave={handleUpdateBio}
        initialBio={user.bio || ''}
        theme={theme}
      />
    </View>
  );
}


// --------------------------------------------------------------------------
// 👤 SUB-COMPONENT: BioEditModal (Isolated state for 60fps typing)
// --------------------------------------------------------------------------
const BioEditModal = React.memo(({ visible, onClose, onSave, initialBio, theme }: any) => {
  const [localBio, setLocalBio] = React.useState(initialBio);
  const [selection, setSelection] = React.useState({ start: 0, end: 0 });

  React.useEffect(() => {
    if (visible) {
      setLocalBio(initialBio);
    }
  }, [visible, initialBio]);

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
              placeholder="Tell your fans something about yourself..."
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
            <Text style={modalStyles.saveBtnText}>Save Changes</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
});

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
  content: { paddingTop: 0, paddingBottom: 40 },
  milestoneSection: {
    marginTop: 20,
    marginBottom: 5,
  },
  sectionTitleSmall: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginBottom: 12,
  },
  milestoneScroll: {
    paddingRight: 20,
  },
  milestoneCard: {
    alignItems: 'center',
    marginRight: 24,
  },
  badgeWrapper: {
    width: 58,
    height: 58,
    borderRadius: 29,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
  },
  milestoneImg: {
    width: 52,
    height: 52,
    resizeMode: 'contain',
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  milestoneLabel: {
    fontSize: 11,
    fontWeight: '800',
    marginTop: 8,
  },
  milestoneReq: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FF0000',
    marginTop: 2,
  },
  milestoneStatus: {
    fontSize: 9,
    fontWeight: '800',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  channelBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
    gap: 5,
  },
  miniBadge: {
    width: 32,
    height: 32,
    resizeMode: 'contain',
  },
  banner: { height: 100, width: '100%', justifyContent: 'center', alignItems: 'center' },
  bannerOverlay: { opacity: 0.5 },
  profileWrap: { marginTop: -20, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 20 },
  padded: { paddingHorizontal: 25 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginTop: -40, gap: 15 },
  avatarContainer: { position: 'relative' },
  avatar: { width: 90, height: 90, borderRadius: 45, borderWidth: 4 },
  avatarEditBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#FF3040',
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
  avatarLoadingOverlay: { ...StyleSheet.absoluteFillObject, borderRadius: 45, justifyContent: 'center', alignItems: 'center' },
  headerStats: { flex: 1, justifyContent: 'center' },
  miniStatsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14, paddingRight: 5, marginTop: -8 },
  miniStat: { alignItems: 'center' },
  miniStatValue: { fontSize: 18, fontWeight: '900', letterSpacing: -0.5 },
  miniStatLabel: { fontSize: 10, fontWeight: '700', marginTop: 3, textTransform: 'uppercase', opacity: 0.8, letterSpacing: 0.8 },
  editBtn: { height: 36, borderRadius: 10, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  editBtnText: { fontSize: 12, fontWeight: '700' },
  miniToolboxRow: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 6,
  },
  miniToolItem: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    borderRadius: 8,
    gap: 2,
  },
  miniToolText: {
    fontSize: 8,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  infoBlock: {
 marginTop: 12 },
  nameRow: { flexDirection: 'row', alignItems: 'center' },
  name: { fontSize: 18, fontWeight: '900', letterSpacing: -0.5 },
  settingsIcon: {
    padding: 8,
    marginLeft: 4,
  },
  niche: { fontSize: 11, fontWeight: '900', marginTop: 2, letterSpacing: 1 },
  bioLoadingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 8,
    padding: 10,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 8,
  },
  bioLoadingText: {
    fontSize: 12,
    fontWeight: '600',
  },
  bio: { fontSize: 13, marginTop: 8, lineHeight: 18, flex: 1 },
  bioWrapper: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  bioEditIcon: { marginTop: 10 },
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
  channelCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginTop: 10, 
    marginHorizontal: 20,
    padding: 12, 
    borderRadius: 16, 
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2
  },
  channelThumb: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#f1f5f9' },
  channelInfo: { flex: 1, marginLeft: 12 },
  channelName: { fontSize: 13, fontWeight: '800' },
  channelStatsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  channelStat: { flexDirection: 'row', alignItems: 'center' },
  channelStatText: { fontSize: 10, fontWeight: '700', marginLeft: 4 },
  cardActions: { 
    alignItems: 'flex-end', 
    justifyContent: 'center',
    paddingLeft: 8
  },
  viewBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'rgba(255,255,255,0.05)', 
    paddingHorizontal: 6, 
    paddingVertical: 4, 
    borderRadius: 6,
    gap: 3
  },
  viewBtnText: { fontSize: 10, fontWeight: '800' },
  sectionTitle: { fontSize: 14, fontWeight: '800', marginTop: 20, marginBottom: 12, paddingHorizontal: 20 },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 20,
    marginTop: 18,
    marginBottom: 8,
  },
  addChannelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  addChannelBtnText: {
    fontSize: 11,
    fontWeight: '800',
    marginLeft: 6,
  },
  toolbox: { flexDirection: 'row', justifyContent: 'space-between' },
  toolCard: { width: '31%', padding: 14, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  toolText: { fontSize: 10, fontWeight: '700', marginTop: 8 },
  tabBar: { 
    flexDirection: 'row', 
    marginTop: 25, 
    borderBottomWidth: 1, 
    paddingHorizontal: 5
  },
  tabItem: { 
    flex: 1, 
    alignItems: 'center', 
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent'
  },
  tabLabel: { 
    fontSize: 11, 
    fontWeight: '800', 
    letterSpacing: 0.5 
  },
  grid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    marginTop: 2,
    gap: 1
  },
  gridItem: { 
    width: (width - 42) / 3, // Accounting for padding and gaps
    aspectRatio: 1,
    marginBottom: 1
  },
  primaryBadge: {
    backgroundColor: '#FF0000',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  primaryBadgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '900',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end'
  },
  modalContent: {
    padding: 24,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderWidth: 1,
    borderBottomWidth: 0,
    minHeight: '50%'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900'
  },
  inputContainer: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    minHeight: 120
  },
  bioInput: {
    fontSize: 16,
    lineHeight: 22,
    height: 120, // Match minHeight of container
    textAlignVertical: 'top',
    padding: 0, // Reset to prevent drifting
    margin: 0,
  },
  charCount: {
    alignSelf: 'flex-end',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 8
  },
  saveBtn: {
    marginTop: 24,
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10
  },
  saveBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '800'
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    marginTop: 12,
    borderTopWidth: 1,
    gap: 12
  },
  toolBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    minWidth: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center'
  },
  toolBtnText: {
    fontSize: 18,
    fontWeight: '900'
  },
  bioEditTrigger: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 4
  },
  mirrorContainer: {
    position: 'relative',
    minHeight: 120
  },
  bioInputMirror: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    fontSize: 16,
    lineHeight: 22,
    padding: 0, // Must match bioInput
    margin: 0,
    textAlignVertical: 'top'
  },
  feedContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  emptyFeed: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 12,
  },
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
  }
});
