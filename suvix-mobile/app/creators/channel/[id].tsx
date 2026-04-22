import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuthStore } from '../../../src/store/useAuthStore';
import { ChannelDetailView } from '../../../src/modules/creators/components/ChannelDetailView';
import { useTheme } from '../../../src/context/ThemeContext';

export default function ChannelDetailScreen() {
  const { id } = useLocalSearchParams();
  const { user } = useAuthStore();
  const { theme } = useTheme();
  const router = useRouter();

  if (!user || !user.youtubeProfile) return null;

  // Find the specific channel by ID
  const channel = user.youtubeProfile.find((p: any) => p.id === id || p.channel_id === id);
  
  // Filter videos for this specific channel
  const channelVideos = (user.youtubeVideos || []).filter((v: any) => 
    v.youtubeProfileId === channel?.id || v.channel_id === channel?.channel_id
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.primary }]}>
      <ChannelDetailView 
        channel={channel} 
        videos={channelVideos} 
        onBack={() => router.back()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
