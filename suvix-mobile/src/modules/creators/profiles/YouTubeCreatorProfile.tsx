import React from 'react';
import { useAuthStore } from '../../../store/useAuthStore';
import { useSocketStore } from '../../../store/useSocketStore';
import {
  View,
  Text,
  StyleSheet,
  Image,
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
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { api } from '../../../api/client';
import { useTheme } from '../../../context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { Colors } from '../../../constants/Colors';
import { formatCount } from '../../../utils/formatters';

import { ContentGrid } from '../../shared/content/ContentGrid';
import { ContentItem } from '../../shared/content/ContentCard';
import { SmartText } from '../../shared/content/SmartText';
import { YouTubeVideoCard } from '../components/YouTubeVideoCard';
import { useRouter } from 'expo-router';

const DEFAULT_AVATAR = require('../../../../assets/defualtprofile.png');

const MOCK_CONTENT: ContentItem[] = [
  { id: '1', type: 'POSTS', thumbnail: 'https://picsum.photos/id/101/400/400' },
  { id: '2', type: 'REELS', thumbnail: 'https://picsum.photos/id/201/400/711', views: '1.2M' },
  { id: '3', type: 'YT VIDEOS', thumbnail: 'https://picsum.photos/id/301/400/400', views: '450K' },
  { id: '4', type: 'SHORTS', thumbnail: 'https://picsum.photos/id/401/400/711', views: '2.5M' },
  { id: '5', type: 'POSTS', thumbnail: 'https://picsum.photos/id/501/400/400' },
  { id: '6', type: 'REELS', thumbnail: 'https://picsum.photos/id/601/400/711', views: '800K' },
  { id: '7', type: 'YT VIDEOS', thumbnail: 'https://picsum.photos/id/701/400/400', views: '1M' },
  { id: '8', type: 'SHORTS', thumbnail: 'https://picsum.photos/id/801/400/711', views: '500K' },
  { id: '9', type: 'POSTS', thumbnail: 'https://picsum.photos/id/901/400/400' },
  { id: '10', type: 'REELS', thumbnail: 'https://picsum.photos/id/111/400/711', views: '2.1M' },
  { id: '11', type: 'SHORTS', thumbnail: 'https://picsum.photos/id/121/400/711', views: '3.4M' },
];

const { width } = Dimensions.get('window');

export default function YouTubeCreatorProfile() {
  const { theme } = useTheme();
  const { user, updateUser, fetchUser, setYoutubeVideos } = useAuthStore();
  const { socket } = useSocketStore();
  const router = useRouter();
  
  // 🔗 WEB SOCKET: Real-time Surgical Sync Listener
  React.useEffect(() => {
    if (!socket) return;

    const handleSyncComplete = async (data: any) => {
      if (data.type === 'SYNC_COMPLETE') {
        console.log('🔄 [SYNC] Real-time surgical signal received!');
        
        // 💉 SURGICAL BYPASS: If the payload contains videos, inject them instantly
        if (data.metadata?.videos && Array.isArray(data.metadata.videos)) {
          console.log('✨ [SYNC] Injecting surgical video data (Zero-API Refresh)');
          setYoutubeVideos(data.metadata.videos);
        } else {
          // Fallback: Refresh the whole user if metadata is missing (legacy compat)
          console.log('📡 [SYNC] Falling back to Full-Profile Refresh');
          await fetchUser();
        }

        // 🧼 CLEANUP: Removed disruptive Alert.alert per user request for a "Premium" silent update.
      }
    };

    socket.on('notification:new', handleSyncComplete);

    return () => {
      socket.off('notification:new', handleSyncComplete);
    };
  }, [socket, fetchUser]);

  React.useEffect(() => {
    if (user?.bio) {
      setTempBio(user.bio);
    }
  }, [user?.bio]);
  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab] = React.useState('YOUTUBE VIDEOS');
  const [isBioModalVisible, setBioModalVisible] = React.useState(false);
  const [tempBio, setTempBio] = React.useState(user?.bio || '');
  const [isSaving, setIsSaving] = React.useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = React.useState(false);
  const [selection, setSelection] = React.useState({ start: 0, end: 0 });

  if (!user || !user.youtubeProfile) return null;

  const { youtubeProfile } = user;
  const displayName = user.name || youtubeProfile.channel_name;
  const subCategoryName = user.primaryRole?.subCategory || 'YouTube Creator';

  // Calculate header height (Navbar 50 + Safe Area Inset Top)
  const headerOffset = insets.top + 50;

  const handleViewChannel = async () => {
    try {
      const url = `https://www.youtube.com/channel/${youtubeProfile.channel_id}`;
      await Linking.openURL(url);
    } catch (error) {
      Alert.alert("Error", "Could not open YouTube link. Please check your internet connection or try again later.");
    }
  };

  const getFilteredContent = () => {
    if (activeTab === 'POSTS') {
      return MOCK_CONTENT.filter(item => item.type === 'POSTS');
    }
    // We handle YOUTUBE VIDEOS separately to show the feed
    return MOCK_CONTENT.filter(item => item.type === activeTab);
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

  const handlePickImage = async () => {
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

  const insertShortcut = (symbol: string) => {
    const before = tempBio.substring(0, selection.start);
    const after = tempBio.substring(selection.end);
    const newText = before + symbol + after;
    
    if (newText.length <= 150) {
      setTempBio(newText);
    }
  };

  const isReelsTab = activeTab === 'REELS';

  return (
    <View style={[styles.container, { backgroundColor: theme.primary }]}>
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={[styles.content, { paddingTop: headerOffset, flexGrow: 1 }]}
      >
        
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
                <MaterialCommunityIcons name="check-decagram" size={20} color="#FF0000" />
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
                <View style={styles.miniStat}>
                  <Text style={[styles.miniStatValue, { color: '#FFFFFF' }]}>{formatCount(MOCK_CONTENT.length)}</Text>
                  <Text style={[styles.miniStatLabel, { color: '#FFFFFF' }]}>Posts</Text>
                </View>
              </View>

              <TouchableOpacity style={[styles.editBtn, { backgroundColor: theme.secondary, borderColor: theme.border }]}>
                 <Text style={[styles.editBtnText, { color: theme.text }]}>Settings</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={[styles.infoBlock, styles.padded]}>
            <View style={styles.nameRow}>
               <Text style={[styles.name, { color: theme.text }]}>{displayName}</Text>
               <MaterialCommunityIcons name="shield-check" size={16} color={theme.accent} style={{ marginLeft: 6 }} />
            </View>
            <Text style={[styles.niche, { color: '#FF0000' }]}>{subCategoryName.toUpperCase()}</Text>
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

          {/* Linked Channels Section */}
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: theme.text, marginTop: 0 }]}>Linked Channels</Text>
            <TouchableOpacity 
              style={[styles.addChannelBtn, { backgroundColor: theme.secondary, borderColor: theme.accent }]}
              onPress={() => router.push('/creators/manual-link')}
            >
              <Feather name="plus-circle" size={14} color={theme.accent} />
              <Text style={[styles.addChannelBtnText, { color: theme.accent }]}>Add Another</Text>
            </TouchableOpacity>
          </View>
          <View style={[styles.channelCard, { backgroundColor: theme.secondary, borderColor: theme.border }]}>
            <Image 
              source={youtubeProfile.thumbnail_url ? { uri: youtubeProfile.thumbnail_url } : DEFAULT_AVATAR} 
              style={styles.channelThumb}
            />
            <View style={styles.channelInfo}>
              <Text style={[styles.channelName, { color: theme.text }]} numberOfLines={1}>{youtubeProfile.channel_name}</Text>
              <View style={styles.channelStatsRow}>
                <View style={styles.channelStat}>
                  <MaterialCommunityIcons name="account-group" size={14} color="#FF0000" />
                  <Text style={[styles.channelStatText, { color: theme.textSecondary }]}>
                    {formatCount(youtubeProfile.subscriber_count)}
                  </Text>
                </View>
                <View style={[styles.channelStat, { marginLeft: 12 }]}>
                  <MaterialCommunityIcons name="movie-play" size={14} color={theme.accent} />
                  <Text style={[styles.channelStatText, { color: theme.textSecondary }]}>
                    {formatCount(youtubeProfile.video_count)}
                  </Text>
                </View>
              </View>
            </View>
            <View style={styles.cardActions}>
              <MaterialCommunityIcons name="check-circle" size={16} color="#FF0000" style={{ marginBottom: 8 }} />
              <TouchableOpacity style={styles.viewBtn} onPress={handleViewChannel}>
                <Text style={[styles.viewBtnText, { color: theme.accent }]}>View</Text>
                <MaterialCommunityIcons name="open-in-new" size={12} color={theme.accent} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Creator Toolbox */}
          <Text style={[styles.sectionTitle, { color: theme.text, paddingHorizontal: 20 }]}>Creator Toolbox</Text>
          <View style={[styles.toolbox, styles.padded]}>
             <TouchableOpacity style={[styles.toolCard, { backgroundColor: theme.secondary }]}>
                <MaterialCommunityIcons name="chart-bell-curve-cumulative" size={20} color="#FF0000" />
                <Text style={[styles.toolText, { color: theme.text }]}>Analytics</Text>
             </TouchableOpacity>
             <TouchableOpacity style={[styles.toolCard, { backgroundColor: theme.secondary }]}>
                <MaterialCommunityIcons name="briefcase-outline" size={20} color={theme.accent} />
                <Text style={[styles.toolText, { color: theme.text }]}>Opportunities</Text>
             </TouchableOpacity>
             <TouchableOpacity style={[styles.toolCard, { backgroundColor: theme.secondary }]}>
                <MaterialCommunityIcons name="account-group-outline" size={20} color="#22C55E" />
                <Text style={[styles.toolText, { color: theme.text }]}>Collaborate</Text>
             </TouchableOpacity>
          </View>

          {/* Content Tabs */}
          <View style={[styles.tabBar, { borderBottomColor: theme.border }]}>
            {['YOUTUBE VIDEOS', 'POSTS', 'REELS'].map((tab) => (
              <TouchableOpacity 
                key={tab} 
                onPress={() => setActiveTab(tab)}
                style={[styles.tabItem, activeTab === tab && { borderBottomColor: theme.accent }]}
              >
                <Text style={[
                  styles.tabLabel, 
                  { color: activeTab === tab ? theme.text : theme.textSecondary }
                ]}>
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          
          {/* 📱 DYNAMIC CONTENT RENDERER */}
          <View style={{ marginTop: 10, paddingBottom: 40 }}>
            {activeTab === 'YOUTUBE VIDEOS' ? (
              // 🎥 YouTube Instagram-Style Feed
              <View style={styles.feedContainer}>
                {user.youtubeVideos && user.youtubeVideos.length > 0 ? (
                  user.youtubeVideos.map((video: any) => (
                    <YouTubeVideoCard key={video.id || video.video_id} video={{
                        id: video.video_id || video.id,
                        title: video.title,
                        thumbnail: video.thumbnail,
                        published_at: video.published_at || video.publishedAt
                    }} />
                  ))
                ) : (
                  <View style={styles.emptyFeed}>
                    <MaterialCommunityIcons name="video-off-outline" size={48} color={theme.textSecondary} />
                    <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No videos found.</Text>
                  </View>
                )}
              </View>
            ) : (
              // 🖼️ Standard Grid for Posts/Reels
              <ContentGrid data={getFilteredContent()} mode={isReelsTab ? 'reels' : 'grid'} />
            )}
          </View>
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
              <Text style={[styles.modalTitle, { color: theme.text }]}>Edit Bio</Text>
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
                  placeholder="Tell your story..."
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
                <TouchableOpacity style={styles.toolBtn} onPress={() => insertShortcut('🔗')}>
                  <MaterialCommunityIcons name="link-variant" size={18} color={theme.accent} />
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
              style={[styles.saveBtn, { backgroundColor: theme.accent }]}
            >
              {isSaving ? (
                <Text style={styles.saveBtnText}>Saving...</Text>
              ) : (
                <>
                  <Text style={styles.saveBtnText}>Save Biography</Text>
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
  avatar: { width: 90, height: 90, borderRadius: 45, borderWidth: 4 },
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
  avatarInner: {
    position: 'relative',
    width: 90,
    height: 90,
    borderRadius: 45,
    overflow: 'hidden'
  },
  avatarLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center'
  },
  avatarEditBtn: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: '#FF0000',
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
  }
});
