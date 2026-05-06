import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Image,
  ActivityIndicator,
  Alert,
  TextInput,
  ScrollView,
  Switch,
  Dimensions,
} from 'react-native';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { api } from '../../api/client';

const { height } = Dimensions.get('window');

interface CommunityCreationModalProps {
// ... rest of the interface is the same ...

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
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [selectedChannelIds, setSelectedChannelIds] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  // Sync name with first selected channel if empty
  useEffect(() => {
    if (!name && selectedChannelIds.length === 1) {
      const channel = channels.find(c => (c.id === selectedChannelIds[0] || c.channel_id === selectedChannelIds[0]));
      if (channel) setName(`${channel.channel_name} Hub`);
    }
  }, [selectedChannelIds, channels]);

  const toggleChannel = (id: string) => {
    setSelectedChannelIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert("Name Required", "Please give your community a name.");
      return;
    }
    
    setIsCreating(true);
    try {
      const linkedAccounts = selectedChannelIds.map(id => {
        const ch = channels.find(c => (c.id === id || c.channel_id === id));
        return {
          platform: 'YOUTUBE',
          externalId: ch.channel_id || ch.id,
          displayName: ch.channel_name,
          url: `https://youtube.com/channel/${ch.channel_id || ch.id}`,
          isVerified: true
        };
      });

      const response = await api.post('/communities', {
        name,
        description,
        isPrivate,
        category: user?.role === 'youtube_creator' ? 'CREATOR' : 'EDITOR',
        linkedAccounts
      });

      if (response.data.success) {
        const newCommunity = response.data.data;
        
        // Update local user state
        const currentCommunities = user.communities || [];
        updateUser({ communities: [newCommunity, ...currentCommunities] });
        
        Alert.alert("Success 🎉", `"${name}" is now live!`);
        onClose();
        
        // Reset form
        setName('');
        setDescription('');
        setSelectedChannelIds([]);
      }
    } catch (error: any) {
      console.error('[CommunityCreate] Error:', error);
      Alert.alert("Error", error.response?.data?.message || "Could not create community. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  const isCreator = user?.primaryRole?.categorySlug === 'yt_influencer';

  return (
    <Modal visible={visible} transparent animationType="slide">

      <View style={modalStyles.overlay}>
        <View style={[modalStyles.content, { backgroundColor: theme.primary, borderColor: theme.border }]}>
          <View style={modalStyles.header}>
            <View>
              <Text style={[modalStyles.title, { color: theme.text }]}>Create Community</Text>
              <Text style={[modalStyles.subtitle, { color: theme.textSecondary }]}>Build a space for your most loyal followers</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <MaterialCommunityIcons name="close" size={24} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: height * 0.7 }}>
            {/* 1. Basic Info */}
            <View style={modalStyles.inputGroup}>
              <Text style={[modalStyles.label, { color: theme.text }]}>Community Name</Text>
              <TextInput
                style={[modalStyles.input, { backgroundColor: theme.secondary, color: theme.text, borderColor: theme.border }]}
                placeholder="e.g. Creator Hub, VIP Group..."
                placeholderTextColor={theme.textSecondary}
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={modalStyles.inputGroup}>
              <Text style={[modalStyles.label, { color: theme.text }]}>Description</Text>
              <TextInput
                style={[modalStyles.input, modalStyles.textArea, { backgroundColor: theme.secondary, color: theme.text, borderColor: theme.border }]}
                placeholder="What is this community about?"
                placeholderTextColor={theme.textSecondary}
                multiline
                numberOfLines={3}
                value={description}
                onChangeText={setDescription}
              />
            </View>

            {/* 2. Privacy Switch */}
            <View style={[modalStyles.switchRow, { backgroundColor: theme.secondary, borderColor: theme.border }]}>
              <View style={{ flex: 1 }}>
                <Text style={[modalStyles.switchLabel, { color: theme.text }]}>Private Community</Text>
                <Text style={[modalStyles.switchSub, { color: theme.textSecondary }]}>Only invited members can join</Text>
              </View>
              <Switch
                value={isPrivate}
                onValueChange={setIsPrivate}
                trackColor={{ false: '#767577', true: theme.accent }}
              />
            </View>

            {/* 3. Role-Based Linking */}
            <View style={modalStyles.section}>
              <Text style={[modalStyles.sectionTitle, { color: theme.text }]}>
                {isCreator ? 'Link YouTube Channels' : 'Portfolio Integration'}
              </Text>
              
              {isCreator ? (
                <View style={modalStyles.channelList}>
                  {channels && channels.length > 0 ? (
                    channels.map((ch: any) => {
                      const id = ch.id || ch.channel_id;
                      const isSelected = selectedChannelIds.includes(id);
                      return (
                        <TouchableOpacity 
                          key={id}
                          onPress={() => toggleChannel(id)}
                          style={[
                            modalStyles.channelItem, 
                            { 
                              backgroundColor: theme.secondary, 
                              borderColor: isSelected ? theme.accent : theme.border,
                              borderWidth: isSelected ? 2 : 1
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
                          <MaterialCommunityIcons 
                            name={isSelected ? "check-circle" : "circle-outline"} 
                            size={22} 
                            color={isSelected ? theme.accent : theme.textSecondary} 
                          />
                        </TouchableOpacity>
                      );
                    })
                  ) : (
                    <View style={modalStyles.emptyState}>
                      <MaterialCommunityIcons name="youtube-subscription" size={32} color={theme.textSecondary} />
                      <Text style={[modalStyles.emptyText, { color: theme.textSecondary }]}>Connect YouTube in settings to link channels.</Text>
                    </View>
                  )}
                </View>
              ) : (
                <View style={[modalStyles.infoBox, { backgroundColor: theme.secondary, borderColor: theme.border }]}>
                  <Feather name="briefcase" size={20} color={theme.accent} />
                  <Text style={[modalStyles.infoText, { color: theme.textSecondary }]}>
                    As an Editor, your community will be linked to your primary SuviX portfolio automatically.
                  </Text>
                </View>
              )}
            </View>

            <TouchableOpacity 
              style={[
                modalStyles.actionBtn, 
                { 
                  backgroundColor: theme.text, 
                  opacity: (name.trim() && !isCreating) ? 1 : 0.6,
                  marginTop: 20
                }
              ]}
              onPress={handleCreate}
              disabled={!name.trim() || isCreating}
            >
              {isCreating ? (
                <ActivityIndicator size="small" color={theme.background} />
              ) : (
                <Text style={[modalStyles.actionBtnText, { color: theme.background }]}>Initialize Community</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
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
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  input: {
    height: 52,
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    fontSize: 15,
  },
  textArea: {
    height: 100,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
  },
  switchLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
  switchSub: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 12,
  },
  channelList: {
    gap: 8,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
});
