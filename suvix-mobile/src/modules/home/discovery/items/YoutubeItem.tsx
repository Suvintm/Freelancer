import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Linking } from 'react-native';
import { Image } from 'expo-image';
import { MaterialCommunityIcons, FontAwesome } from '@expo/vector-icons';
import Video from 'react-native-video';
import { useTheme } from '../../../../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

interface YoutubeItemProps {
  data: {
    id: string;
    user: string;
    location: string;
    img: string;
    likes: number;
    comment: string;
    commentsCount: number;
    videoUrl?: string;
    ytChannelName?: string;
    ytSubscribeLink?: string;
    watchOnYtLink?: string;
  };
  isVisible?: boolean;
}

export const YoutubeItem: React.FC<YoutubeItemProps> = ({ data, isVisible = false }) => {
  const { theme } = useTheme();
  const videoRef = useRef<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isLiked, setIsLiked] = useState(false);

  const handleOpenUrl = (url?: string) => {
    if (!url) return;
    Linking.openURL(url).catch((err) => console.error("Couldn't open URL", err));
  };

  return (
    <View style={[styles.container, { borderBottomColor: theme.border }]}>
      {/* Header */}
      <View style={styles.header}>
        <Image source={{ uri: data.img }} style={styles.avatar} />
        <View style={styles.authorInfo}>
          <Text style={[styles.authorName, { color: theme.text }]}>{data.user}</Text>
          <Text style={[styles.location, { color: theme.textSecondary }]}>{data.location}</Text>
        </View>
        <TouchableOpacity style={styles.moreBtn}>
          <MaterialCommunityIcons name="dots-horizontal" size={20} color={theme.text} />
        </TouchableOpacity>
      </View>

      {/* Caption / Comment */}
      <View style={styles.metaData}>
        <Text style={[styles.captionText, { color: theme.text, marginBottom: 8 }]}>
          {data.comment}
        </Text>
      </View>

      {/* YouTube Channel Info Bar */}
      {data.ytChannelName && (
        <View style={[styles.channelBar, { backgroundColor: theme.isDarkMode ? '#1C1C1E' : '#F2F2F7' }]}>
          <View style={styles.channelLeft}>
            <FontAwesome name="youtube-play" size={18} color="#FF0000" />
            <Text style={[styles.channelName, { color: theme.text }]} numberOfLines={1}>
              {data.ytChannelName}
            </Text>
          </View>
          {data.ytSubscribeLink && (
            <TouchableOpacity 
              onPress={() => handleOpenUrl(data.ytSubscribeLink)}
              style={styles.subscribeBtn}
            >
              <Text style={styles.subscribeBtnText}>Subscribe</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Video Player Section */}
      <TouchableOpacity 
        activeOpacity={0.95}
        onPress={() => setIsPlaying(!isPlaying)}
        style={styles.videoContainer}
      >
        {data.videoUrl && isVisible ? (
          <Video
            ref={videoRef}
            source={{ uri: data.videoUrl }}
            style={styles.video}
            paused={!isPlaying}
            muted={isMuted}
            repeat
            resizeMode="cover"
            playInBackground={false}
            playWhenInactive={false}
          />
        ) : (
          <Image source={{ uri: data.img }} style={styles.video} contentFit="cover" />
        )}

        {/* Play/Pause Center Indicator */}
        {!isPlaying && (
          <View style={styles.centerPlayIcon}>
            <MaterialCommunityIcons name="play" size={48} color="#FFF" />
          </View>
        )}

        {/* Bottom controls gradient & Mute button */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.6)']}
          style={styles.controlsGradient}
        >
          <TouchableOpacity 
            onPress={() => setIsMuted(!isMuted)}
            style={styles.muteBtn}
          >
            <MaterialCommunityIcons 
              name={isMuted ? "volume-off" : "volume-high"} 
              size={20} 
              color="#FFF" 
            />
          </TouchableOpacity>
        </LinearGradient>
      </TouchableOpacity>

      {/* YouTube Watch CTA Link */}
      {data.watchOnYtLink && (
        <TouchableOpacity 
          onPress={() => handleOpenUrl(data.watchOnYtLink)}
          style={[styles.youtubeCta, { borderColor: theme.border }]}
        >
          <FontAwesome name="youtube-play" size={16} color="#FF0000" />
          <Text style={[styles.youtubeCtaText, { color: theme.text }]}>Watch on YouTube</Text>
        </TouchableOpacity>
      )}

      {/* Actions & Likes */}
      <View style={styles.actionsRow}>
        <View style={styles.leftActions}>
          <TouchableOpacity onPress={() => setIsLiked(!isLiked)} style={styles.actionIcon}>
            <MaterialCommunityIcons 
              name={isLiked ? "heart" : "heart-outline"} 
              size={24} 
              color={isLiked ? "#EF4444" : theme.text} 
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionIcon}>
            <MaterialCommunityIcons name="chat-outline" size={24} color={theme.text} />
          </TouchableOpacity>
        </View>
        <Text style={[styles.likesText, { color: theme.textSecondary }]}>
          {(data.likes + (isLiked ? 1 : 0)).toLocaleString()} likes
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#333',
  },
  authorInfo: {
    marginLeft: 10,
    flex: 1,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '700',
  },
  location: {
    fontSize: 11,
    marginTop: 1,
  },
  moreBtn: {
    padding: 4,
  },
  metaData: {
    paddingHorizontal: 12,
  },
  captionText: {
    fontSize: 13.5,
    lineHeight: 18,
  },
  channelBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 12,
    marginBottom: 10,
    borderRadius: 8,
  },
  channelLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  channelName: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  subscribeBtn: {
    backgroundColor: '#FF0000',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  subscribeBtnText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
  videoContainer: {
    width: '100%',
    height: 220,
    backgroundColor: '#000',
    position: 'relative',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  centerPlayIcon: {
    position: 'absolute',
    alignSelf: 'center',
    top: '40%',
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 30,
    padding: 4,
  },
  controlsGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 44,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    paddingBottom: 8,
    paddingRight: 12,
  },
  muteBtn: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  youtubeCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 8,
    marginHorizontal: 12,
    marginTop: 10,
    height: 38,
  },
  youtubeCtaText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    marginTop: 12,
  },
  leftActions: {
    flexDirection: 'row',
    gap: 16,
  },
  actionIcon: {
    padding: 2,
  },
  likesText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
