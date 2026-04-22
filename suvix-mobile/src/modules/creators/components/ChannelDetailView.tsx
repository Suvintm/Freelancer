import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Dimensions,
  TouchableOpacity, Linking, ActivityIndicator,
  StatusBar, Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../../context/ThemeContext';
import { formatCount } from '../../../utils/formatters';
import { YouTubeVideoCard } from './YouTubeVideoCard';

const { width: SW } = Dimensions.get('window');
const DEFAULT_AVATAR = require('../../../../assets/defualtprofile.png');

// ── Stat Pill ────────────────────────────────────────────────────────────────

interface StatPillProps { icon: string; value: string; label: string; theme: any; }

const StatPill = ({ icon, value, label, theme }: StatPillProps) => (
  <View style={[
    sp.pill,
    { backgroundColor: theme.isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' },
  ]}>
    <MaterialCommunityIcons name={icon as any} size={18} color="#FF3040" />
    <View style={sp.textWrap}>
      <Text style={[sp.value, { color: theme.text }]} numberOfLines={1}>{value}</Text>
      <Text style={[sp.label, { color: theme.textSecondary }]}>{label}</Text>
    </View>
  </View>
);

const sp = StyleSheet.create({
  pill: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    gap: 10, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12,
  },
  textWrap: { flex: 1 },
  value: { fontSize: 17, fontWeight: '900', letterSpacing: -0.5 },
  label: { fontSize: 9, fontWeight: '800', letterSpacing: 0.8, opacity: 0.65, marginTop: 1 },
});

// ── Section Header ───────────────────────────────────────────────────────────

interface SectionHeaderProps { title: string; badge?: string; theme: any; showScrollHint?: boolean; }

const SectionHeader = ({ title, badge, theme, showScrollHint }: SectionHeaderProps) => (
  <View style={sh.row}>
    <View style={sh.accent} />
    <Text style={[sh.title, { color: theme.text }]}>{title}</Text>
    {badge && (
      <View style={sh.badgeWrap}>
        <Text style={sh.badgeTxt}>{badge}</Text>
      </View>
    )}
    {showScrollHint && (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 'auto' }}>
        <Text style={{ fontSize: 9, fontWeight: '900', color: '#FF3040', letterSpacing: 0.5 }}>SWIPE</Text>
        <MaterialCommunityIcons name="chevron-double-right" size={14} color="#FF3040" />
      </View>
    )}
  </View>
);

const sh = StyleSheet.create({
  row:       { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, marginBottom: 14 },
  accent:    { width: 3, height: 16, backgroundColor: '#FF3040', borderRadius: 2 },
  title:     { flex: 1, fontSize: 12, fontWeight: '900', letterSpacing: 0.8 },
  badgeWrap: { backgroundColor: 'rgba(255,48,64,0.1)', borderRadius: 5, paddingHorizontal: 8, paddingVertical: 3 },
  badgeTxt:  { color: '#FF3040', fontSize: 9, fontWeight: '900', letterSpacing: 0.3 },
});

// ── Main Component ───────────────────────────────────────────────────────────

interface ChannelDetailViewProps {
  channel: any;
  videos: any[];
  onBack?: () => void;
}

export const ChannelDetailView = ({ channel, videos, onBack }: ChannelDetailViewProps) => {
  const { theme } = useTheme();
  const [descExpanded, setDescExpanded] = useState(false);

  if (!channel) return null;

  const sinceYear = channel.published_at
    ? new Date(channel.published_at).getFullYear()
    : null;

  const openStudio = () =>
    Linking.openURL(`https://studio.youtube.com/channel/${channel.channel_id}/editing/details`);

  const rawDesc   = (channel.description ?? '').trim();
  const shortDesc = rawDesc.length > 130 ? rawDesc.slice(0, 130) : rawDesc;
  const canExpand = rawDesc.length > 130;

  const featuredVideos = videos.slice(0, 5);
  const archiveVideos  = videos.slice(5);

  return (
    <View style={[s.root, { backgroundColor: theme.primary }]}>
      <StatusBar
        translucent
        barStyle={theme.isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
      />

      {/* ── Sticky header ─────────────────────────────────────────────── */}
      <View style={[s.header, { paddingTop: Platform.OS === 'ios' ? 50 : 36 }]}>
        <TouchableOpacity style={s.iconBtn} onPress={onBack}>
          <Ionicons name="arrow-back" size={22} color={theme.text} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: theme.text }]} numberOfLines={1}>
          {channel.channel_name}
        </Text>
        <TouchableOpacity style={s.iconBtn} onPress={openStudio}>
          <MaterialCommunityIcons name="youtube-studio" size={22} color="#FF0000" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 80 }}
      >
        {/* ── Banner ────────────────────────────────────────────────────── */}
        <View style={s.bannerWrap}>
          {channel.banner_url ? (
            <Image
              source={{ uri: channel.banner_url }}
              style={s.banner}
              contentFit="cover"
              contentPosition="center"
              transition={400}
            />
          ) : (
            <LinearGradient colors={['#1a1a2e', '#16213e', '#0f3460']} style={s.banner} />
          )}
          {/* Bottom fade so banner bleeds into background */}
          <LinearGradient
            colors={[
              'rgba(0,0,0,0)',
              'rgba(0,0,0,0.05)',
              theme.isDarkMode ? theme.primary : theme.primary,
            ]}
            style={StyleSheet.absoluteFill}
          />
          <TouchableOpacity style={s.editBannerBtn} onPress={openStudio}>
            <Feather name="edit-3" size={11} color="white" />
            <Text style={s.editBtnTxt}>EDIT</Text>
          </TouchableOpacity>
        </View>

        {/* ── Avatar + subscriber row ───────────────────────────────────── */}
        <View style={s.identityRow}>
          {/* Avatar */}
          <View style={s.avatarShadow}>
            <Image
              source={channel.thumbnail_url ? { uri: channel.thumbnail_url } : DEFAULT_AVATAR}
              style={[s.avatar, { borderColor: theme.isDarkMode ? '#111' : '#fff' }]}
              contentFit="cover"
              contentPosition="center"
              transition={300}
            />
            <TouchableOpacity style={s.editAvatarBtn} onPress={openStudio}>
              <Feather name="camera" size={11} color="white" />
            </TouchableOpacity>
          </View>

          {/* Sub count + manage button */}
          <View style={s.subBlock}>
            <Text style={[s.subCount, { color: theme.text }]}>
              {formatCount(channel.subscriber_count ?? 0)}
            </Text>
            <Text style={[s.subLabel, { color: theme.textSecondary }]}>SUBSCRIBERS</Text>
            <TouchableOpacity
              style={[s.manageBtn, {
                backgroundColor: theme.isDarkMode ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)',
                borderColor: theme.isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
              }]}
              onPress={openStudio}
            >
              <Text style={[s.manageBtnTxt, { color: theme.text }]}>Manage on YouTube</Text>
              <Feather name="external-link" size={11} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Name + handle ─────────────────────────────────────────────── */}
        <View style={s.nameBlock}>
          <View style={s.nameRow}>
            <Text
              style={[s.channelName, { color: theme.text }]}
              numberOfLines={1}
            >
              {channel.channel_name}
            </Text>
            <TouchableOpacity onPress={openStudio} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Feather name="edit-2" size={13} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>
          <Text style={[s.handle, { color: theme.textSecondary }]} numberOfLines={1}>
            {channel.custom_url || `@${channel.channel_id?.substring(0, 14)}`}
            {channel.country ? ` · ${channel.country.toUpperCase()}` : ''}
            {sinceYear ? ` · Since ${sinceYear}` : ''}
          </Text>
        </View>

        {/* ── Stats row ─────────────────────────────────────────────────── */}
        <View style={s.statsRow}>
          <StatPill
            icon="eye-outline"
            value={formatCount(channel.view_count ?? 0)}
            label="TOTAL VIEWS"
            theme={theme}
          />
          <StatPill
            icon="video-outline"
            value={formatCount(channel.video_count ?? 0)}
            label="VIDEOS"
            theme={theme}
          />
        </View>

        {/* ── Description ───────────────────────────────────────────────── */}
        {rawDesc.length > 0 && (
          <View style={[s.descBox, {
            backgroundColor: theme.isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
            borderColor: theme.isDarkMode ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)',
          }]}>
            <Text style={[s.descText, { color: theme.textSecondary }]}>
              {descExpanded ? rawDesc : shortDesc}
            </Text>
            {canExpand && (
              <TouchableOpacity onPress={() => setDescExpanded(v => !v)}>
                <Text style={s.readMore}>{descExpanded ? 'Show less' : 'Read more'}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* ── Featured (horizontal, first 5) ────────────────────────────── */}
        {featuredVideos.length > 0 && (
          <View style={s.section}>
            <SectionHeader
              title="FEATURED CONTENT"
              badge={`LATEST ${featuredVideos.length}`}
              theme={theme}
              showScrollHint={true}
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingLeft: 16, paddingRight: 28 }}
              decelerationRate="fast"
              snapToInterval={194}  /* card 180 + gap 14 */
              snapToAlignment="start"
            >
              {featuredVideos.map((v) => (
                <YouTubeVideoCard
                  key={v.id || v.video_id}
                  video={v}
                  mode="streaming"
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Loading state */}
        {videos.length === 0 && (
          <View style={s.emptyState}>
            <ActivityIndicator size="small" color="#FF3040" />
            <Text style={[s.emptyTxt, { color: theme.textSecondary }]}>Syncing content…</Text>
          </View>
        )}

        {/* ── Archive (vertical list, remaining) ────────────────────────── */}
        {archiveVideos.length > 0 && (
          <View style={s.section}>
            <SectionHeader
              title="ALL VIDEOS"
              badge={`${archiveVideos.length} MORE`}
              theme={theme}
            />
            <View style={{ paddingHorizontal: 16 }}>
              {archiveVideos.map((v) => (
                <YouTubeVideoCard
                  key={v.id || v.video_id}
                  video={v}
                  mode="list"
                />
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const s = StyleSheet.create({
  root: { flex: 1 },

  // Header
  header: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100,
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 4, paddingBottom: 8,
  },
  iconBtn:     { padding: 10 },
  headerTitle: { flex: 1, fontSize: 14, fontWeight: '700', textAlign: 'center', paddingHorizontal: 4 },

  // Banner
  bannerWrap: { width: '100%', aspectRatio: 2.4 / 1, position: 'relative' },
  banner:     { width: '100%', height: '100%' },
  editBannerBtn: {
    position: 'absolute', bottom: 12, right: 14,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 6, flexDirection: 'row', alignItems: 'center', gap: 5,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  editBtnTxt: { color: 'white', fontSize: 9, fontWeight: '900', letterSpacing: 1 },

  // Identity row
  identityRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: -46,
    alignItems: 'flex-end',
    gap: 16,
  },
  avatarShadow: {
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5, shadowRadius: 14, elevation: 12,
  },
  avatar: {
    width: 82, height: 82, borderRadius: 41, borderWidth: 3,
  },
  editAvatarBtn: {
    position: 'absolute', bottom: 0, right: 0,
    backgroundColor: '#FF0000', width: 27, height: 27, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#000',
  },
  subBlock:    { flex: 1, paddingBottom: 2 },
  subCount:    { fontSize: 30, fontWeight: '900', letterSpacing: -1 },
  subLabel:    { fontSize: 9, fontWeight: '800', letterSpacing: 1, opacity: 0.55 },
  manageBtn: {
    marginTop: 8, paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-start', borderWidth: 1,
  },
  manageBtnTxt: { fontSize: 11, fontWeight: '700' },

  // Name block
  nameBlock: { paddingHorizontal: 16, marginTop: 14 },
  nameRow:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  channelName: { flex: 1, fontSize: 20, fontWeight: '900', letterSpacing: -0.3 },
  handle:      { fontSize: 12, fontWeight: '600', marginTop: 3, opacity: 0.6 },

  // Stats
  statsRow: { flexDirection: 'row', paddingHorizontal: 16, marginTop: 14, gap: 10 },

  // Description
  descBox: {
    marginHorizontal: 16, marginTop: 14,
    padding: 14, borderRadius: 12, borderWidth: 1,
  },
  descText: { fontSize: 13, lineHeight: 20 },
  readMore: { color: '#FF3040', fontSize: 12, fontWeight: '700', marginTop: 6 },

  // Sections
  section:    { marginTop: 28 },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyTxt:   { marginTop: 10, fontSize: 12, fontWeight: '700' },
});