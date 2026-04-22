import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Dimensions, 
  TouchableOpacity,
  Linking,
  ActivityIndicator
} from 'react-native';
import { Image } from 'expo-image';
import { MaterialCommunityIcons, Ionicons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../../context/ThemeContext';
import { formatCount } from '../../../utils/formatters';
import { ContentGrid } from '../../shared/content/ContentGrid';
import { SmartText } from '../../shared/content/SmartText';

const { width } = Dimensions.get('window');
const DEFAULT_AVATAR = require('../../../../assets/defualtprofile.png');

interface ChannelDetailViewProps {
  channel: any;
  videos: any[];
  onBack?: () => void;
}

export const ChannelDetailView = ({ channel, videos, onBack }: ChannelDetailViewProps) => {
  const { theme } = useTheme();

  if (!channel) return null;

  const publishedDate = channel.published_at 
    ? new Date(channel.published_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short' })
    : null;

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.primary }]}
      showsVerticalScrollIndicator={false}
    >
      {/* ─── PREMIUM BANNER ─── */}
      <View style={styles.bannerContainer}>
        {channel.banner_url ? (
          <Image 
            source={{ uri: channel.banner_url }} 
            style={styles.banner}
            contentFit="cover"
          />
        ) : (
          <LinearGradient
            colors={['#FF3040', '#991B1B']}
            style={styles.banner}
          />
        )}
        <LinearGradient
          colors={['rgba(0,0,0,0.6)', 'transparent', 'rgba(0,0,0,0.8)']}
          style={StyleSheet.absoluteFill}
        />
        
        {onBack && (
          <TouchableOpacity 
            style={styles.backBtn} 
            onPress={onBack}
          >
            <Ionicons name="chevron-back" size={24} color="white" />
          </TouchableOpacity>
        )}
      </View>

      {/* ─── IDENTITY SECTION ─── */}
      <View style={styles.identityRow}>
        <Image 
          source={channel.thumbnail_url ? { uri: channel.thumbnail_url } : DEFAULT_AVATAR} 
          style={[styles.avatar, { borderColor: theme.primary }]}
          contentFit="cover"
        />
        <View style={styles.nameBox}>
          <Text style={[styles.channelName, { color: theme.text }]} numberOfLines={2}>
            {channel.channel_name}
          </Text>
          <View style={styles.badgeRow}>
             <Text style={[styles.customUrl, { color: theme.accent }]}>
               {channel.custom_url || `@${channel.channel_id.substring(0, 8)}`}
             </Text>
             {channel.country && (
               <View style={[styles.countryBadge, { backgroundColor: theme.secondary }]}>
                 <Text style={[styles.countryText, { color: theme.textSecondary }]}>{channel.country}</Text>
               </View>
             )}
          </View>
        </View>
      </View>

      {/* ─── BIG STATS ROW ─── */}
      <View style={[styles.statsRow, { borderBottomColor: theme.border, borderTopColor: theme.border }]}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: theme.text }]}>{formatCount(channel.subscriber_count)}</Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Subscribers</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: theme.text }]}>{formatCount(channel.view_count)}</Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Total Views</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: theme.text }]}>{formatCount(channel.video_count)}</Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Videos</Text>
        </View>
      </View>

      {/* ─── ABOUT / DESCRIPTION ─── */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>About Channel</Text>
        {publishedDate && (
          <View style={styles.infoRow}>
            <Feather name="calendar" size={14} color={theme.textSecondary} />
            <Text style={[styles.infoText, { color: theme.textSecondary }]}>Joined {publishedDate}</Text>
          </View>
        )}
        <SmartText 
          text={channel.description || "No description available for this channel."}
          style={[styles.description, { color: theme.textSecondary }]}
        />
      </View>

      {/* ─── VIDEO FEED ─── */}
      <View style={styles.section}>
        <View style={styles.feedHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 0 }]}>Recent Uploads</Text>
          <TouchableOpacity 
            onPress={() => Linking.openURL(`https://youtube.com/channel/${channel.channel_id}/videos`)}
            style={styles.externalLink}
          >
            <Text style={[styles.externalLinkText, { color: theme.accent }]}>View on YT</Text>
            <Feather name="external-link" size={12} color={theme.accent} />
          </TouchableOpacity>
        </View>

        {videos.length > 0 ? (
          <ContentGrid 
            data={videos.map(v => ({
              id: v.video_id || v.id,
              thumbnail: v.thumbnail,
              title: v.title,
              type: 'YT VIDEOS',
              published_at: v.published_at
            }))}
            mode="grid"
            columns={2}
            gap={10}
            onItemPress={(item) => Linking.openURL(`https://youtube.com/watch?v=${item.id}`)}
          />
        ) : (
          <View style={styles.emptyVideos}>
            <ActivityIndicator size="small" color={theme.accent} />
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>Syncing videos...</Text>
          </View>
        )}
      </View>
      
      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  bannerContainer: { width: '100%', height: 180, position: 'relative' },
  banner: { width: '100%', height: '100%' },
  backBtn: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: -40,
    gap: 15,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
  },
  nameBox: { flex: 1, marginTop: 40 },
  channelName: { fontSize: 20, fontWeight: '900', letterSpacing: -0.5 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  customUrl: { fontSize: 13, fontWeight: '700' },
  countryBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  countryText: { fontSize: 10, fontWeight: '800' },
  
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 20,
    marginTop: 25,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 16, fontWeight: '900' },
  statLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginTop: 2, opacity: 0.6 },
  divider: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.1)' },

  section: { paddingHorizontal: 20, marginTop: 25 },
  sectionTitle: { fontSize: 16, fontWeight: '900', marginBottom: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  infoText: { fontSize: 13, fontWeight: '600' },
  description: { fontSize: 14, fontWeight: '500', lineHeight: 22 },
  
  feedHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  externalLink: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  externalLinkText: { fontSize: 12, fontWeight: '800' },
  
  emptyVideos: { padding: 40, alignItems: 'center' },
  emptyText: { marginTop: 10, fontSize: 13, fontWeight: '600' },
});
