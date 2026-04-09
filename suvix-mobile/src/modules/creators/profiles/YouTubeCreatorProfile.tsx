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
  Linking,
  Alert,
} from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../../constants/Colors';
import { formatCount } from '../../../utils/formatters';

import { ContentGrid } from '../../shared/content/ContentGrid';
import { ContentItem } from '../../shared/content/ContentCard';

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
  const { user } = useAuthStore();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = React.useState('POSTS');

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
    if (activeTab === 'POSTS') return MOCK_CONTENT;
    return MOCK_CONTENT.filter(item => item.type === activeTab);
  };

  const isReelsTab = activeTab === 'REELS' || activeTab === 'SHORTS';

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
              <Image
                source={user.profilePicture ? { uri: user.profilePicture } : DEFAULT_AVATAR}
                style={[styles.avatar, { borderColor: theme.primary }]}
              />
              <View style={styles.verifiedBadge}>
                <MaterialCommunityIcons name="check-decagram" size={20} color="#FF0000" />
              </View>
            </View>

            <View style={styles.headerStats}>
              <View style={styles.miniStatsRow}>
                <View style={styles.miniStat}>
                  <Text style={[styles.miniStatValue, { color: '#FFFFFF' }]}>{formatCount(user.followers)}</Text>
                  <Text style={[styles.miniStatLabel, { color: theme.textSecondary }]}>Followers</Text>
                </View>
                <View style={styles.miniStat}>
                  <Text style={[styles.miniStatValue, { color: '#FFFFFF' }]}>{formatCount(user.following)}</Text>
                  <Text style={[styles.miniStatLabel, { color: theme.textSecondary }]}>Following</Text>
                </View>
                <View style={styles.miniStat}>
                  <Text style={[styles.miniStatValue, { color: '#FF4444' }]}>{formatCount(youtubeProfile.subscriber_count)}</Text>
                  <Text style={[styles.miniStatLabel, { color: theme.textSecondary }]}>Subs</Text>
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
            <Text style={[styles.bio, { color: theme.textSecondary }]}>
              Official SuviX Partner. Professional creator focused on {subCategoryName.toLowerCase()} and brand growth.
            </Text>
          </View>

          {/* Linked Channels Section */}
          <Text style={[styles.sectionTitle, { color: theme.text, marginTop: 18 }]}>Linked Channels</Text>
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
            {['POSTS', 'REELS', 'YT VIDEOS', 'SHORTS'].map((tab) => (
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

          {/* Universal Content Grid */}
          <ContentGrid data={getFilteredContent()} mode={isReelsTab ? 'reels' : 'grid'} />
        </View>
      </ScrollView>
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
  miniStatsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, paddingRight: 5 },
  miniStat: { alignItems: 'center' },
  miniStatValue: { fontSize: 18, fontWeight: '900', letterSpacing: -0.5 },
  miniStatLabel: { fontSize: 10, fontWeight: '700', marginTop: 3, textTransform: 'uppercase', opacity: 0.6, letterSpacing: 0.8 },
  editBtn: { height: 36, borderRadius: 10, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  editBtnText: { fontSize: 12, fontWeight: '700' },
  infoBlock: { marginTop: 12 },
  nameRow: { flexDirection: 'row', alignItems: 'center' },
  name: { fontSize: 20, fontWeight: '800' },
  niche: { fontSize: 11, fontWeight: '900', marginTop: 2, letterSpacing: 1 },
  bio: { fontSize: 13, marginTop: 8, lineHeight: 18 },
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
  }
});
