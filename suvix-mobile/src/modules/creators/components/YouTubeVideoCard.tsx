import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Dimensions, Linking,
} from 'react-native';
import { Image } from 'expo-image';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../../context/ThemeContext';
import { formatDistanceToNow } from 'date-fns';
import { formatCount } from '../../../utils/formatters';

const { width: SW } = Dimensions.get('window');

// Sizes
const STREAMING_W = 180;
const STREAMING_H = 210;
const GRID_W = (SW - 48) / 2;

// Types
interface Video {
  id?: string;
  video_id?: string;
  title: string;
  thumbnail?: string;
  published_at?: string;
  view_count?: string | number;
}

interface Props {
  video: Video;
  mode?: 'grid' | 'full' | 'streaming' | 'list';
  channelAvatar?: string;
}

// Helper
function buildMeta(viewCount?: string | number, publishedAt?: string): string {
  try {
    const views = viewCount ? `${formatCount(viewCount)} views` : '';
    let date = '';
    
    if (publishedAt) {
      const d = new Date(publishedAt);
      if (!isNaN(d.getTime())) {
        date = formatDistanceToNow(d, { addSuffix: true });
      }
    }
    
    return [views, date].filter(Boolean).join(' · ');
  } catch (err) {
    return viewCount ? `${formatCount(viewCount)} views` : '';
  }
}

// Component
export const YouTubeVideoCard: React.FC<Props> = ({
  video, mode = 'grid', channelAvatar,
}) => {
  const { theme } = useTheme();

  const videoId = video.id || video.video_id;
  const metaText = buildMeta(video.view_count, video.published_at);
  const thumbSrc = video.thumbnail ? { uri: video.thumbnail } : undefined;

  const handleWatch = () => {
    if (videoId) Linking.openURL(`https://www.youtube.com/watch?v=${videoId}`);
  };

  // STREAMING (Netflix portrait card)
  if (mode === 'streaming') {
    return (
      <TouchableOpacity
        activeOpacity={0.88}
        onPress={handleWatch}
        style={[stm.card, { 
          backgroundColor: theme.isDarkMode ? '#050505' : '#f9f9f9',
          borderColor: theme.isDarkMode ? '#1e1e1e' : '#333333'
        }]}
      >
        <View style={stm.thumbWrap}>
          {thumbSrc ? (
            <Image
              source={thumbSrc}
              style={stm.thumb}
              contentFit="cover"
              contentPosition="center"
              transition={300}
            />
          ) : (
            <View style={[stm.thumb, { backgroundColor: '#111' }]} />
          )}

          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.95)']}
            style={StyleSheet.absoluteFill}
          />

          <View style={stm.playBtn}>
            <MaterialCommunityIcons name="play" size={18} color="white" />
          </View>

          <View style={stm.overlayInfo}>
            <Text style={stm.overlayTitle} numberOfLines={2}>{video.title}</Text>
            <Text style={stm.overlayMeta} numberOfLines={1}>{metaText}</Text>
            <View style={stm.watchPill}>
              <Text style={stm.watchPillTxt}>WATCH FULL VIDEO</Text>
              <Feather name="arrow-right" size={10} color="white" />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  // LIST (Master Archive Redesign 🔥)
  if (mode === 'list') {
    const isDark = theme?.isDarkMode;
    // Force Pitch Black Aesthetic for high-end archive feed consistency
    const cardBg = '#000000'; 
    const borderCol = '#1e1e1e';
    const textColor = '#FFFFFF';
    const subTextColor = 'rgba(255,255,255,0.6)';

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={handleWatch}
        style={[lst.card, {
          backgroundColor: cardBg,
          borderColor: borderCol,
        }]}
      >
        <View style={lst.thumbWrap}>
          {thumbSrc ? (
            <Image
              source={thumbSrc}
              style={lst.thumb}
              contentFit="cover"
              contentPosition="center"
              transition={300}
            />
          ) : (
            <View style={[lst.thumb, { backgroundColor: '#111' }]} />
          )}
          
          <LinearGradient
            colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.5)']}
            style={StyleSheet.absoluteFill}
          />
          
          <View style={lst.playBadge}>
            {channelAvatar ? (
              <Image 
                source={{ uri: channelAvatar }} 
                style={lst.avatarBadge}
                contentFit="cover"
              />
            ) : (
              <MaterialCommunityIcons name="youtube" size={14} color="white" />
            )}
          </View>
        </View>

        <View style={lst.content}>
          <View style={{ flex: 1 }}>
            <Text
              style={[lst.title, { color: textColor }]}
              numberOfLines={2}
            >
              {video.title || 'Untitled Video'}
            </Text>

            <View style={lst.metaRow}>
              <Text style={[lst.metaText, { color: subTextColor }]}>
                {metaText}
              </Text>
            </View>
          </View>

          <View style={lst.actionRow}>
            <View style={lst.actionBtn}>
              <Text style={lst.actionTxt}>WATCH</Text>
              <MaterialCommunityIcons name="play" size={14} color="white" />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  // FULL
  if (mode === 'full') {
    return (
      <TouchableOpacity style={fll.card} onPress={handleWatch}>
        <View style={fll.thumbWrap}>
          <Image source={thumbSrc} style={fll.thumb} contentFit="cover" />
        </View>
        <Text style={[fll.title, { color: theme.text }]}>{video.title}</Text>
        <Text style={[fll.meta, { color: theme.textSecondary }]}>{metaText}</Text>
      </TouchableOpacity>
    );
  }

  // GRID
  return (
    <TouchableOpacity style={[grd.card, { width: GRID_W }]} onPress={handleWatch}>
      <View style={grd.thumbWrap}>
        <Image source={thumbSrc} style={grd.thumb} contentFit="cover" />
      </View>
      <Text style={[grd.title, { color: theme.text }]} numberOfLines={2}>
        {video.title}
      </Text>
    </TouchableOpacity>
  );
};

// Styles

const stm = StyleSheet.create({
  card: {
    width:        STREAMING_W,
    height:       STREAMING_H,
    borderRadius: 14,
    overflow:     'hidden',
    marginRight:  14,
    borderWidth:  1,
  },
  thumbWrap: { width: '100%', height: '100%', position: 'relative' },
  thumb:     { width: '100%', height: '100%' },
  playBtn: {
    position: 'absolute', top: 12, left: 12,
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: '#27272a',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)',
    elevation: 8,
  },
  overlayInfo: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 14, paddingBottom: 12, paddingTop: 20,
  },
  overlayTitle: { color: '#FFFFFF', fontSize: 13, fontWeight: '900', lineHeight: 18, letterSpacing: -0.2 },
  overlayMeta:  { color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: '700', marginTop: 4 },
  watchPill: {
    marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#27272a',
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, alignSelf: 'flex-start',
  },
  watchPillTxt: { color: 'white', fontSize: 9, fontWeight: '900', letterSpacing: 0.6 },
});

const lst = StyleSheet.create({
  card: {
    width: '100%',
    flexDirection: 'row',
    borderRadius:  16,
    borderWidth:   1,
    marginBottom:  12,
    overflow:      'hidden',
    height:        100,
  },
  thumbWrap: {
    width:       155,
    height:      100,
    backgroundColor: '#000',
    position:    'relative',
  },
  thumb: {
    width:  '100%',
    height: '100%',
  },
  playBadge: {
    position: 'absolute', top: 8, left: 8,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#27272a',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#FFFFFF',
    overflow: 'hidden',
  },
  avatarBadge: {
    width: '100%',
    height: '100%',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    justifyContent: 'center',
  },
  title: {
    fontSize:    14,
    fontWeight:  '900',
    lineHeight:  19,
    letterSpacing: -0.3,
  },
  metaRow: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize:   11,
    fontWeight: '700',
    opacity:    0.6,
  },
  actionRow: {
    marginTop: 'auto',
    alignSelf: 'flex-end',
  },
  actionBtn: {
    backgroundColor: '#27272a',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
  },
  actionTxt: { color: 'white', fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
});

const fll = StyleSheet.create({
  card: { marginBottom: 16 },
  thumbWrap: { aspectRatio: 16 / 9 },
  thumb: { width: '100%', height: '100%' },
  title: { fontSize: 14, fontWeight: 'bold' },
  meta: { fontSize: 12 },
});

const grd = StyleSheet.create({
  card: { marginBottom: 12 },
  thumbWrap: { aspectRatio: 16 / 9 },
  thumb: { width: '100%', height: '100%' },
  title: { fontSize: 12, fontWeight: 'bold' },
});