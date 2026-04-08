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
} from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../../constants/Colors';
import { formatCount } from '../../../utils/formatters';

const DEFAULT_AVATAR = require('../../../../assets/defualtprofile.png');

const { width } = Dimensions.get('window');

export default function YouTubeCreatorProfile() {
  const { theme } = useTheme();
  const { user } = useAuthStore();

  if (!user || !user.youtubeProfile) return null;

  const { youtubeProfile } = user;
  const displayName = user.name || youtubeProfile.channel_name;
  const subCategoryName = user.primaryRole?.subCategory || 'YouTube Creator';

  return (
    <View style={[styles.container, { backgroundColor: theme.primary }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        
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
          <View style={styles.headerRow}>
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
                  <Text style={[styles.miniStatValue, { color: theme.text }]}>{formatCount(user.followers)}</Text>
                  <Text style={[styles.miniStatLabel, { color: theme.textSecondary }]}>Followers</Text>
                </View>
                <View style={styles.miniStat}>
                  <Text style={[styles.miniStatValue, { color: theme.text }]}>{formatCount(user.following)}</Text>
                  <Text style={[styles.miniStatLabel, { color: theme.textSecondary }]}>Following</Text>
                </View>
                <View style={styles.miniStat}>
                  <Text style={[styles.miniStatValue, { color: '#FF0000' }]}>{formatCount(youtubeProfile.subscriber_count)}</Text>
                  <Text style={[styles.miniStatLabel, { color: theme.textSecondary }]}>Subs</Text>
                </View>
              </View>

              <TouchableOpacity style={[styles.editBtn, { backgroundColor: theme.secondary, borderColor: theme.border }]}>
                 <Text style={[styles.editBtnText, { color: theme.text }]}>Settings</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.infoBlock}>
            <View style={styles.nameRow}>
               <Text style={[styles.name, { color: theme.text }]}>{displayName}</Text>
               <MaterialCommunityIcons name="shield-check" size={16} color={theme.accent} style={{ marginLeft: 6 }} />
            </View>
            <Text style={[styles.niche, { color: '#FF0000' }]}>{subCategoryName.toUpperCase()}</Text>
            <Text style={[styles.bio, { color: theme.textSecondary }]}>
              Official SuviX Partner. Professional creator focused on {subCategoryName.toLowerCase()} and brand growth.
            </Text>
          </View>

          {/* Video Count Anchor */}
          <View style={[styles.statsHub, { backgroundColor: theme.secondary, borderColor: theme.border }]}>
             <View style={styles.statCell}>
                <Text style={[styles.statValue, { color: theme.text }]}>
                  {formatCount(youtubeProfile.video_count)}
                </Text>
                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>YouTube Uploads</Text>
             </View>
             <View style={[styles.statCell, { borderLeftWidth: 1, borderLeftColor: theme.border }]}>
                <Text style={[styles.statValue, { color: theme.accent }]}>PRO</Text>
                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Creator Tier</Text>
             </View>
          </View>

          {/* Creator Toolbox */}
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Creator Toolbox</Text>
          <View style={styles.toolbox}>
             <TouchableOpacity style={[styles.toolCard, { backgroundColor: theme.secondary }]}>
                <MaterialCommunityIcons name="chart-bell-curve-cumulative" size={24} color="#FF0000" />
                <Text style={[styles.toolText, { color: theme.text }]}>Analytics</Text>
             </TouchableOpacity>
             <TouchableOpacity style={[styles.toolCard, { backgroundColor: theme.secondary }]}>
                <MaterialCommunityIcons name="briefcase-outline" size={24} color={theme.accent} />
                <Text style={[styles.toolText, { color: theme.text }]}>Opportunities</Text>
             </TouchableOpacity>
             <TouchableOpacity style={[styles.toolCard, { backgroundColor: theme.secondary }]}>
                <MaterialCommunityIcons name="account-group-outline" size={24} color="#22C55E" />
                <Text style={[styles.toolText, { color: theme.text }]}>Collaborate</Text>
             </TouchableOpacity>
          </View>

          <View style={styles.actionRow}>
             <TouchableOpacity style={[styles.mainAction, { backgroundColor: theme.accent }]}>
                <Text style={{ color: theme.primary, fontWeight: '700' }}>Manage Portfolios</Text>
             </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingTop: 0, paddingBottom: 40 },
  banner: { height: 120, width: '100%', justifyContent: 'center', alignItems: 'center' },
  bannerOverlay: { opacity: 0.5 },
  profileWrap: { marginTop: -20, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 20, paddingBottom: 20 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginTop: -40, gap: 15 },
  avatarContainer: { position: 'relative' },
  avatar: { width: 90, height: 90, borderRadius: 45, borderWidth: 4 },
  verifiedBadge: { position: 'absolute', bottom: 2, right: 2, backgroundColor: 'white', borderRadius: 10 },
  headerStats: { flex: 1, justifyContent: 'center' },
  miniStatsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, paddingRight: 5 },
  miniStat: { alignItems: 'center' },
  miniStatValue: { fontSize: 16, fontWeight: '800' },
  miniStatLabel: { fontSize: 10, fontWeight: '600', marginTop: 2, opacity: 0.7 },
  editBtn: { height: 36, borderRadius: 10, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  editBtnText: { fontSize: 12, fontWeight: '700' },
  infoBlock: { marginTop: 12 },
  nameRow: { flexDirection: 'row', alignItems: 'center' },
  name: { fontSize: 20, fontWeight: '800' },
  niche: { fontSize: 11, fontWeight: '900', marginTop: 2, letterSpacing: 1 },
  bio: { fontSize: 13, marginTop: 8, lineHeight: 18 },
  statsHub: { flexDirection: 'row', marginTop: 20, paddingVertical: 12, borderRadius: 12, borderWidth: 1 },
  statCell: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '800' },
  statLabel: { fontSize: 10, fontWeight: '600', marginTop: 2, textTransform: 'uppercase' },
  sectionTitle: { fontSize: 18, fontWeight: '800', marginTop: 28, marginBottom: 16 },
  toolbox: { flexDirection: 'row', justifyContent: 'space-between' },
  toolCard: { width: '31%', padding: 16, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  toolText: { fontSize: 11, fontWeight: '700', marginTop: 8 },
  actionRow: { marginTop: 30 },
  mainAction: { height: 54, borderRadius: 16, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 }
});
