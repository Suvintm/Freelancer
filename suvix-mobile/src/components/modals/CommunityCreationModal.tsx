import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface CommunityCreationModalProps {
  visible: boolean;
  onClose: () => void;
  channels: any[];
  theme: any;
  user: any;
  updateUser: (data: any) => void;
  formatCount: (count: number) => string;
  DEFAULT_AVATAR: any;
}

export const CommunityCreationModal = React.memo(({ 
  visible, 
  onClose, 
  channels, 
  theme, 
  user, 
  updateUser, 
  formatCount, 
  DEFAULT_AVATAR 
}: CommunityCreationModalProps) => {
  const [selectedChannelId, setSelectedChannelId] = React.useState<string | null>(null);
  const [isCreating, setIsCreating] = React.useState(false);

  const handleCreate = async () => {
    if (!selectedChannelId) {
      Alert.alert("Selection Required", "Please select a channel to create a community.");
      return;
    }
    
    setIsCreating(true);
    try {
      // Mocking API call for now
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const selectedChannel = channels?.find((c: any) => (c.id === selectedChannelId || c.channel_id === selectedChannelId));
      
      // Update local state if needed (though we'd usually refetch)
      const newCommunity = {
        id: Math.random().toString(36).substr(2, 9),
        name: `${selectedChannel?.channel_name || 'Channel'} Community`,
        channelId: selectedChannelId,
        memberCount: 1,
        createdAt: new Date().toISOString(),
        type: 'COMMUNITY'
      };
      
      const currentCommunities = user.communities || [];
      updateUser({ communities: [...currentCommunities, newCommunity] });
      
      Alert.alert("Success", `Community "${newCommunity.name}" created!`);
      onClose();
    } catch (error) {
      Alert.alert("Error", "Could not create community. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={modalStyles.overlay}>
        <View style={[modalStyles.content, { backgroundColor: theme.primary, borderColor: theme.border }]}>
          <View style={modalStyles.header}>
            <View>
              <Text style={[modalStyles.title, { color: theme.text }]}>Create Community</Text>
              <Text style={[modalStyles.subtitle, { color: theme.textSecondary }]}>Select a channel to build your community</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <MaterialCommunityIcons name="close" size={24} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={{ maxHeight: 300, marginBottom: 20 }}>
            {channels && channels.length > 0 ? (
              channels.map((ch: any) => (
                <TouchableOpacity 
                  key={ch.id || ch.channel_id}
                  onPress={() => setSelectedChannelId(ch.id || ch.channel_id)}
                  style={[
                    modalStyles.channelItem, 
                    { 
                      backgroundColor: theme.secondary, 
                      borderColor: selectedChannelId === (ch.id || ch.channel_id) ? theme.accent : theme.border,
                      borderWidth: selectedChannelId === (ch.id || ch.channel_id) ? 2 : 1
                    }
                  ]}
                >
                  <Image 
                    source={ch.thumbnail_url ? { uri: ch.thumbnail_url } : DEFAULT_AVATAR} 
                    style={modalStyles.channelThumb} 
                  />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[modalStyles.channelName, { color: theme.text }]} numberOfLines={1}>{ch.channel_name}</Text>
                    <Text style={[modalStyles.channelSubs, { color: theme.textSecondary }]}>{formatCount(ch.subscriber_count || 0)} Subscribers</Text>
                  </View>
                  {selectedChannelId === (ch.id || ch.channel_id) && (
                    <MaterialCommunityIcons name="check-circle" size={24} color={theme.accent} />
                  )}
                </TouchableOpacity>
              ))
            ) : (
              <View style={modalStyles.emptyState}>
                <MaterialCommunityIcons name="youtube-subscription" size={48} color={theme.textSecondary} />
                <Text style={[modalStyles.emptyText, { color: theme.textSecondary }]}>No connected channels found.</Text>
              </View>
            )}
          </View>

          <TouchableOpacity 
            style={[
              modalStyles.actionBtn, 
              { backgroundColor: theme.isDarkMode ? '#27272A' : theme.text, opacity: selectedChannelId ? 1 : 0.6 }
            ]}
            onPress={handleCreate}
            disabled={!selectedChannelId || isCreating}
          >
            {isCreating ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Text style={[modalStyles.actionBtnText, { color: '#FFF' }]}>Initialize Community</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
});

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  content: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    borderWidth: 1,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 25,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  channelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
  },
  channelThumb: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  channelName: {
    fontSize: 15,
    fontWeight: '700',
  },
  channelSubs: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    padding: 30,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  actionBtn: {
    height: 54,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '800',
  },
});
