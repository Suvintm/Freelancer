import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
  useColorScheme,
  ActivityIndicator,
  Image,
  Platform,
  LayoutAnimation,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather, Ionicons } from '@expo/vector-icons';
import { Colors } from '../src/constants/Colors';
import SuvixButton from '../src/components/SuvixButton';
import { useCategoryStore } from '../src/store/useCategoryStore';
import { useAuthStore } from '../src/store/useAuthStore';
import * as Haptics from 'expo-haptics';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Constants from 'expo-constants';

type YouTubeChannel = {
  channelId: string;
  channelName: string;
  thumbnailUrl?: string | null;
  subscriberCount?: number;
  videoCount?: number;
  videos?: {
    id: string;
    title: string;
    thumbnail: string;
    publishedAt: string;
  }[];
  isClaimed?: boolean;
};

type SelectedYouTubeChannelPayload = {
  channelId: string;
  channelName: string;
  thumbnailUrl?: string | null;
  subscriberCount?: number;
  videoCount?: number;
  subCategoryId?: string;
  subCategorySlug?: string;
  isPrimary?: boolean;
  isVerified?: boolean;
  videos?: {
    id: string;
    title: string;
    thumbnail: string;
    publishedAt: string;
  }[];
};

export default function YoutubeConnectScreen() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const { categoryId } = useLocalSearchParams<{ categoryId: string }>();
  const { categories, fetchCategories } = useCategoryStore();
  const setTempSignupData = useAuthStore((state) => state.setTempSignupData);

  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [pickerExpandedFor, setPickerExpandedFor] = useState<string | null>(null);

  // 🛡️ [PERSISTENCE] Connect to Global Discovery Store
  const { 
    youtubeDiscovery, 
    addDiscoveredChannels, 
    toggleYoutubeChannelSelection, 
    setYoutubeChannelCategory,
    clearYoutubeDiscovery 
  } = useAuthStore();

  const channels = youtubeDiscovery.channels;
  const selectedChannels = youtubeDiscovery.selectedChannelIds;
  const channelToSubCategory = youtubeDiscovery.categorizations;

  // 🛡️ [RESILIENCE] Detect Client IDs from Expo Constants (Reliable for Production APK)
  const extra = Constants.expoConfig?.extra || {};
  const androidClientId = extra.googleAndroidClientId || '';
  const iosClientId = extra.googleIosClientId || '';
  const webClientId = extra.googleWebClientId || '';

  useEffect(() => {
    if (webClientId) {
      GoogleSignin.configure({
        webClientId,
        iosClientId,
        offlineAccess: true,
        scopes: ['https://www.googleapis.com/auth/youtube.readonly'],
      });
    }
  }, [webClientId, iosClientId]);

  const category = categories.find((c) => c.id === categoryId);
  const subCategories = category?.subCategories || [];

  useEffect(() => {
    fetchCategories().catch(() => {});
  }, [fetchCategories]);

  // 🛡️ [RESILIENCE] Auto-detect connection if channels already exist in global store
  useEffect(() => {
    if (channels.length > 0) {
      setConnected(true);
    }
  }, [channels.length]);


  const fetchChannels = async (accessToken: string) => {
    setConnecting(true);
    try {
      const { api } = require('../src/api/client');
      const resData = await api.post('/auth/youtube/channels', { accessToken });
      
      if (!resData.data.success) {
        throw new Error(resData.data.message || "Invalid Google token.");
      }

      const fetchedChannels: YouTubeChannel[] = (resData.data.channels || []).map((item: any) => ({
        channelId: item.channelId,
        channelName: item.channelName,
        thumbnailUrl: item.thumbnailUrl,
        subscriberCount: item.subscriberCount,
        videoCount: item.videoCount,
        videos: item.videos || [],
        isClaimed: item.isClaimed || false,
      }));
      
      console.log('📱 [YT-DEBUG] Received from Server:', JSON.stringify(fetchedChannels, null, 2));

      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      addDiscoveredChannels(fetchedChannels);
      setConnected(true);
      setPickerExpandedFor(null);
    } catch (error: any) {
      Alert.alert('YouTube Connect Failed', error.message || 'Could not fetch your channels from Google.');
    } finally {
      setConnecting(false);
    }
  };

  const handleImpact = (style = Haptics.ImpactFeedbackStyle.Light) => {
    Haptics.impactAsync(style);
  };

  const toggleChannel = (channelId: string) => {
    const channel = channels.find(ch => ch.channelId === channelId);
    if (channel?.isClaimed) {
        Alert.alert("Already Claimed", "This YouTube channel is already linked to another SuviX account. If you believe this is an error, please contact SuviX Support.");
        return;
    }
    handleImpact();
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    toggleYoutubeChannelSelection(channelId);
    if (!selectedChannels.includes(channelId) && pickerExpandedFor === channelId) {
      setPickerExpandedFor(null);
    }
  };

  const assignSubCategory = (channelId: string, subCategoryId: string) => {
    const channel = channels.find(ch => ch.channelId === channelId);
    if (channel?.isClaimed) return;
    handleImpact();
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setYoutubeChannelCategory(channelId, subCategoryId);
    if (!selectedChannels.includes(channelId)) {
        toggleYoutubeChannelSelection(channelId);
    }
    setPickerExpandedFor(null);
  };

  const allSelectedChannelsTagged = useMemo(() => {
    if (selectedChannels.length === 0) return false;
    return selectedChannels.every((channelId) => !!channelToSubCategory[channelId]);
  }, [selectedChannels, channelToSubCategory]);

  const handleContinue = () => {
    if (!categoryId) {
      Alert.alert('Setup Error', 'Missing category context. Please select role again.');
      router.replace('/role-selection');
      return;
    }

    if (selectedChannels.length === 0 || !allSelectedChannelsTagged) {
      Alert.alert('Action Required', 'Please select at least one channel and strictly assign a niche to proceed.');
      return;
    }

    const selectedChannelData: SelectedYouTubeChannelPayload[] = selectedChannels
      .map((channelId, index) => {
        const channel = channels.find((ch) => ch.channelId === channelId);
        const selectedSubCategoryId = channelToSubCategory[channelId];
        if (!channel || !selectedSubCategoryId) return null;
        const selectedSubCategory = subCategories.find((sub) => sub.id === selectedSubCategoryId);
        return {
          channelId: channel.channelId,
          channelName: channel.channelName,
          thumbnailUrl: channel.thumbnailUrl || null,
          subscriberCount: Number(channel.subscriberCount || 0),
          videoCount: Number(channel.videoCount || 0),
          subCategoryId: selectedSubCategoryId,
          subCategorySlug: selectedSubCategory?.slug,
          isPrimary: index === 0,
          isVerified: true,
          uploadsPlaylistId: channel.uploadsPlaylistId || null,
          videos: channel.videos || [],
        };
      })
      .filter((item): item is SelectedYouTubeChannelPayload => !!item);

    const uniqueSubCategoryIds = Array.from(
      new Set(selectedChannelData.map((ch) => ch.subCategoryId).filter(Boolean))
    ) as string[];

    setTempSignupData({
      categoryId,
      categorySlug: category?.slug,
      roleSubCategoryIds: uniqueSubCategoryIds,
      youtubeChannels: selectedChannelData,
    });

    router.push('/signup');
  };

  const handleConnectYouTube = async () => {
    if (Platform.OS === 'android' && !androidClientId) {
      Alert.alert('Configuration Error', 'Android Google Client ID is missing in app environment.');
      return;
    }

    handleImpact(Haptics.ImpactFeedbackStyle.Heavy);
    try {
      await GoogleSignin.hasPlayServices();
      try {
        await GoogleSignin.signOut();
      } catch (e) {}
      await GoogleSignin.signIn();
      const tokens = await GoogleSignin.getTokens();
      
      if (tokens.accessToken) {
        fetchChannels(tokens.accessToken);
      } else {
        Alert.alert('Authentication Error', 'Google did not return a valid access token. Please try again.');
      }
    } catch (error: any) {
      if (error.code !== statusCodes.SIGN_IN_CANCELLED && error.code !== statusCodes.IN_PROGRESS) {
        Alert.alert('Connection Interrupted', error.message || 'Could not launch Google authentication window.');
      }
    }
  };

  const ytRed = '#FF0000';
  const safeGreen = isDark ? '#00E676' : '#00C853';

  return (
    <View style={[styles.container, { backgroundColor: theme.primary }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} translucent backgroundColor="transparent" />

      {/* Modern Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16, paddingBottom: 16, backgroundColor: theme.primary, borderBottomWidth: 1, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: theme.secondary }]}>
          <Feather name="arrow-left" size={20} color={theme.text} />
        </TouchableOpacity>
        <Ionicons name="logo-youtube" size={24} color={ytRed} style={{ marginLeft: 16, marginRight: 6 }} />
        <Text style={[styles.title, { color: theme.text }]}>YouTube Connect</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Banner Explaining Value Proposition - Now Safe Green */}
        {!connected && !connecting && (
          <LinearGradient
            colors={isDark ? ['#00331A', '#001A0D'] : ['#E6F9F0', '#CCF3DF']}
            style={[styles.heroBanner, { borderColor: isDark ? '#004D26' : '#99E6C0' }]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={[styles.heroIconWrap, { backgroundColor: isDark ? 'rgba(0,200,83,0.15)' : 'rgba(0,200,83,0.1)' }]}>
              <Ionicons name="shield-checkmark" size={28} color={safeGreen} />
            </View>
            <Text style={[styles.heroTitle, { color: theme.text }]}>Safe & Secure Connection</Text>
            <Text style={[styles.heroDesc, { color: theme.textSecondary }]}>
              By safely verifying your identity, you unlock official creator badges. Authentic metrics attract premium brands, high-paying sponsorships, and exclusive collaboration opportunities on SuviX.
            </Text>
          </LinearGradient>
        )}

        {/* STEP 1: Connect Account */}
        <View style={styles.stepBlock}>
          <Text style={[styles.stepLabel, { color: theme.textSecondary }]}>STEP 1 : IDENTITY SYNC</Text>
          <Text style={[styles.stepTitle, { color: theme.text }]}>YouTube Integration</Text>
          <Text style={[styles.stepDesc, { color: theme.textSecondary }]}>
            Securely verify your ownership to sync metrics and unlock official creator badges. 💡 <Text style={{fontWeight: '700', color: theme.text}}>Pro Tip: Link multiple channels from different accounts by tapping "Add Another" below.</Text>
          </Text>

          {/* 🛡️ PREMIUM IDENTITY GUIDE */}
          <View style={[styles.guideCard, { backgroundColor: isDark ? '#161A22' : '#F0F4F8', borderColor: isDark ? '#2D3748' : '#D1DCE5' }]}>
            <View style={styles.guideHeader}>
                <Ionicons name="shield-checkmark" size={16} color={isDark ? '#4A90E2' : '#007AFF'} />
                <Text style={[styles.guideTitle, { color: theme.text }]}>Identity Discovery Settings</Text>
            </View>
            <Text style={[styles.guideText, { color: theme.textSecondary }]}>
                To ensure a successful sync, please keep in mind:
            </Text>
            <View style={styles.guideStep}>
                <View style={[styles.guideDot, { backgroundColor: isDark ? '#4A90E2' : '#007AFF' }]} />
                <Text style={[styles.guideStepText, { color: theme.text }]}>
                    <Text style={{fontWeight: '700'}}>Primary Setup:</Text> Google shares your currently active identity first.
                </Text>
            </View>
            <View style={styles.guideStep}>
                <View style={[styles.guideDot, { backgroundColor: safeGreen }]} />
                <Text style={[styles.guideStepText, { color: theme.text }]}>
                    <Text style={{fontWeight: '700'}}>Sub-Channels:</Text> If a second channel is missing, add it later from your <Text style={{fontWeight: '700'}}>Profile</Text>.
                </Text>
            </View>
            <View style={[styles.proTipBox, { backgroundColor: isDark ? '#1c1c1c' : '#ffffff', borderLeftWidth: 3, borderLeftColor: safeGreen }]}>
                <Text style={[styles.proTipText, { color: theme.textSecondary }]}>
                   💡 <Text style={{fontWeight: '800', color: theme.text}}>Pro Tip:</Text> Switch identities in your YouTube App first to quickly link a specific brand channel here.
                </Text>
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.ytButton, { backgroundColor: connected ? theme.secondary : ytRed, opacity: connecting ? 0.7 : 1 }]} 
            onPress={handleConnectYouTube} 
            disabled={connecting}
            activeOpacity={0.8}
          >
            <Ionicons name={connected ? "person-add" : "logo-youtube"} size={20} color={connected ? theme.text : "#fff"} style={{ marginRight: 10 }} />
            <Text style={[styles.ytButtonText, { color: connected ? theme.text : "#fff" }]}>
              {connected ? 'Link Another Identity' : 'Securely Add YouTube Account'}
            </Text>
          </TouchableOpacity>
        </View>

        {connecting && (
          <View style={styles.stateWrap}>
            <ActivityIndicator size="large" color={ytRed} />
            <Text style={[styles.stateText, { color: theme.textSecondary, marginTop: 12 }]}>
              Authenticating with Google servers...
            </Text>
          </View>
        )}

        {/* STEP 2: Configure Channels */}
        {connected && !connecting && (
          <View style={styles.stepBlock}>
            <View style={styles.divider} />
            <Text style={[styles.stepLabel, { color: theme.textSecondary }]}>STEP 2 : CONFIGURE IDENTITY</Text>
            <Text style={[styles.stepTitle, { color: theme.text }]}>Selection & Verification</Text>
            
            {/* Critical Instructional Warning */}
            <View style={[styles.infoCard, { backgroundColor: isDark ? '#1F1A00' : '#FFF9E5', borderColor: isDark ? '#332900' : '#FFE899' }]}>
              <Feather name="info" size={16} color={isDark ? '#FFDA44' : '#CC9900'} style={{ marginTop: 2 }} />
              <View style={styles.infoCardContent}>
                <Text style={[styles.infoCardTitle, { color: isDark ? '#FFF' : '#332600' }]}>Important: Choose Wisely!</Text>
                <Text style={[styles.infoCardDesc, { color: isDark ? '#CCC' : '#664C00' }]}>
                  Please choose the most accurate niche category for your channel from the available list. SuviX’s recommendation algorithm strictly relies on this to map your profile to highly relevant industry brands.
                </Text>
              </View>
            </View>

            {channels.length === 0 ? (
              <View style={[styles.emptyCard, { backgroundColor: theme.secondary, borderColor: theme.border }]}>
                <Feather name="alert-circle" size={24} color={theme.textSecondary} style={{ marginBottom: 8 }} />
                <Text style={[styles.emptyText, { color: theme.text }]}>No Channels Found</Text>
                <Text style={[styles.emptySubText, { color: theme.textSecondary }]}>
                  This Google account doesn't have any attached public YouTube channels. Try a different account.
                </Text>
              </View>
            ) : (
              <View style={styles.listWrap}>
                {channels.map((channel) => {
                  const isSelected = selectedChannels.includes(channel.channelId);
                  const activeSubCategoryId = channelToSubCategory[channel.channelId];
                  const activeSubCategoryName = subCategories.find(s => s.id === activeSubCategoryId)?.name;
                  const isPickerOpen = pickerExpandedFor === channel.channelId;
                  
                  return (
                    <View 
                      key={channel.channelId} 
                      style={[
                        styles.channelCard, 
                        { backgroundColor: isDark ? '#151515' : '#fff', borderColor: isSelected ? ytRed : theme.border },
                        isSelected && { shadowColor: ytRed, shadowOpacity: 0.15, shadowRadius: 12, elevation: 4 }
                      ]}
                    >
                      <TouchableOpacity 
                        style={styles.channelRow} 
                        onPress={() => toggleChannel(channel.channelId)} 
                        activeOpacity={0.7}
                      >
                        <Image source={{ uri: channel.thumbnailUrl || 'https://via.placeholder.com/64' }} style={styles.avatar} />
                        <View style={styles.channelDetails}>
                          <Text style={[styles.channelName, { color: theme.text }]}>{channel.channelName}</Text>
                          <Text style={[styles.channelStats, { color: isDark ? '#aaa' : '#666' }]}>
                            <Feather name="users" size={12} /> {(channel.subscriberCount || 0).toLocaleString()} • {channel.videoCount} videos
                          </Text>
                          {channel.isClaimed && (
                            <View style={[styles.claimedBadge, { backgroundColor: isDark ? '#332900' : '#FFF9E5', borderColor: isDark ? '#FFDA44' : '#FFE899' }]}>
                              <Feather name="lock" size={10} color={isDark ? '#FFDA44' : '#CC9900'} />
                              <Text style={[styles.claimedBadgeText, { color: isDark ? '#FFDA44' : '#CC9900' }]}>THIS ACCOUNT IS ALREADY IN USE BY ANOTHER USER</Text>
                            </View>
                          )}
                        </View>
                        <View style={[
                          styles.checkbox, 
                          { borderColor: channel.isClaimed ? theme.border : (isSelected ? ytRed : theme.border) }, 
                          isSelected && { backgroundColor: ytRed },
                          channel.isClaimed && { opacity: 0.3 }
                        ]}>
                          {isSelected && <Feather name="check" size={16} color="#fff" />}
                        </View>
                      </TouchableOpacity>

                      {/* Add Category UI is now visible by default for all channels */}
                      <View style={styles.categoryActionContainer}>
                        <TouchableOpacity 
                          style={[
                            styles.addCategoryBtn, 
                            activeSubCategoryId 
                              ? { backgroundColor: isDark ? 'rgba(0, 200, 83, 0.15)' : '#E6F9F0', borderColor: safeGreen } 
                              : { backgroundColor: theme.primary, borderColor: theme.border },
                            channel.isClaimed && { opacity: 0.5 }
                          ]}
                          activeOpacity={0.7}
                          onPress={() => {
                            if (channel.isClaimed) return;
                            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                            setPickerExpandedFor(isPickerOpen ? null : channel.channelId);
                          }}
                        >
                          <Feather 
                            name={activeSubCategoryId ? "check-circle" : "plus-circle"} 
                            size={16} 
                            color={activeSubCategoryId ? safeGreen : theme.text} 
                          />
                          <Text style={[
                            styles.addCategoryBtnText, 
                            { color: activeSubCategoryId ? safeGreen : theme.text }
                          ]}>
                            {activeSubCategoryId ? `Added: ${activeSubCategoryName}` : 'Add Category'}
                          </Text>
                          <Feather 
                            name={isPickerOpen ? "chevron-up" : "chevron-down"} 
                            size={16} 
                            color={theme.textSecondary} 
                            style={{ marginLeft: 'auto' }} 
                          />
                        </TouchableOpacity>

                        {isPickerOpen && (
                          <View style={styles.nicheDropdown}>
                            <Text style={[styles.nichePrompt, { color: theme.textSecondary }]}>Choose the most suitable niche:</Text>
                            <View style={styles.nicheGrid}>
                              {subCategories.map((sub) => {
                                const isActive = activeSubCategoryId === sub.id;
                                return (
                                  <TouchableOpacity
                                    key={sub.id}
                                    activeOpacity={0.8}
                                    onPress={() => assignSubCategory(channel.channelId, sub.id)}
                                    style={[
                                      styles.nichePill,
                                      { backgroundColor: theme.primary, borderColor: theme.border },
                                      isActive && { backgroundColor: safeGreen, borderColor: safeGreen },
                                    ]}
                                  >
                                    <Text style={[styles.nicheText, { color: isActive ? '#fff' : theme.textSecondary }]}>
                                      {sub.name}
                                    </Text>
                                  </TouchableOpacity>
                                );
                              })}
                            </View>
                          </View>
                        )}
                      </View>

                      {/* 🎬 PREVIEW VIDEOS (LATEST 15) */}
                      {channel.videos && channel.videos.length > 0 && (
                        <View style={[styles.videoPreviewContainer, { borderTopColor: theme.border }]}>
                          <View style={styles.previewHeader}>
                            <Feather name="play-circle" size={14} color={ytRed} />
                            <Text style={[styles.previewTitle, { color: theme.textSecondary }]}>
                              Latest {channel.videos.length} Videos Preview
                            </Text>
                            {!activeSubCategoryId && (
                              <View style={styles.actionPromptBadge}>
                                <Text style={styles.actionPromptText}>Action Needed: Select Category Below</Text>
                              </View>
                            )}
                          </View>
                          <ScrollView 
                            horizontal 
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.videoPreviewScroll}
                          >
                            {channel.videos.map((video) => (
                              <View key={video.id} style={styles.videoCard}>
                                <Image source={{ uri: video.thumbnail }} style={styles.videoThumb} />
                                <View style={styles.videoInfo}>
                                  <Text style={[styles.videoTitle, { color: theme.text }]} numberOfLines={2}>
                                    {video.title}
                                  </Text>
                                </View>
                              </View>
                            ))}
                          </ScrollView>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Floating Action Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom || 24, backgroundColor: theme.primary, borderTopWidth: 1, borderTopColor: theme.border }]}>
        <View style={styles.footerInner}>
          <Text style={[styles.footerStatus, { color: theme.textSecondary }]}>
            {selectedChannels.length} channel(s) ready
          </Text>
          <TouchableOpacity 
            style={[styles.continueBtn, (!connected || channels.length === 0 || !allSelectedChannelsTagged) && { opacity: 0.4 }]}
            onPress={handleContinue}
            disabled={!connected || channels.length === 0 || !allSelectedChannelsTagged}
            activeOpacity={0.8}
          >
            <Text style={styles.continueBtnText}>Proceed</Text>
            <Feather name="arrow-right" size={18} color="#000" style={{ marginLeft: 6 }} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    zIndex: 10,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 220, // Increased for footer accessibility
  },
  heroBanner: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
  },
  heroIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  heroDesc: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '500',
  },
  stepBlock: {
    marginBottom: 8,
  },
  divider: {
    height: 30,
    width: 2,
    backgroundColor: '#ccc',
    marginLeft: 14,
    marginBottom: 20,
    opacity: 0.3,
  },
  stepLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  stepDesc: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 16,
  },
  ytButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF0000',
    height: 50,
    borderRadius: 12,
    marginTop: 6,
    shadowColor: '#FF0000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  ytButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  infoCard: {
    flexDirection: 'row',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  infoCardContent: {
    flex: 1,
    marginLeft: 10,
  },
  infoCardTitle: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 4,
  },
  infoCardDesc: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '500',
  },
  listWrap: {
    gap: 12,
    paddingTop: 4,
  },
  channelCard: {
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 14,
    overflow: 'hidden',
  },
  channelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  channelDetails: {
    flex: 1,
    marginLeft: 12,
  },
  channelName: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  channelStats: {
    fontSize: 12,
    fontWeight: '500',
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  categoryActionContainer: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(150, 150, 150, 0.15)',
  },
  addCategoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  addCategoryBtnText: {
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 8,
  },
  nicheDropdown: {
    marginTop: 12,
    paddingBottom: 4,
  },
  nichePrompt: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 10,
  },
  nicheGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  nichePill: {
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 100,
  },
  nicheText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  stateWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  stateText: {
    fontSize: 13,
    fontWeight: '500',
  },
  emptyCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderStyle: 'dashed',
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 8,
  },
  emptySubText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 6,
    paddingHorizontal: 10,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 14,
  },
  footerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  footerStatus: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  continueBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#000',
  },
  continueBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#000',
  },
  // Video Preview styles
  videoPreviewContainer: {
    paddingTop: 12,
    marginTop: 8,
    borderTopWidth: 1,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  previewTitle: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  videoPreviewScroll: {
    paddingRight: 20,
    gap: 10,
  },
  videoCard: {
    width: 140,
  },
  videoThumb: {
    width: 140,
    height: 78,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  videoInfo: {
    marginTop: 4,
  },
  videoTitle: {
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 14,
  },
  actionPromptBadge: {
    backgroundColor: '#FF0000',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 'auto',
  },
  actionPromptText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  // Guide Styles
  guideCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
    marginTop: 4,
  },
  guideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  guideTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  guideText: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 10,
  },
  guideStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
    paddingLeft: 4,
  },
  guideDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  guideStepText: {
    fontSize: 12,
  },
  guideHint: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 10,
    fontStyle: 'italic',
  },
  proTipBox: {
    padding: 10,
    borderRadius: 8,
    marginTop: 12,
  },
  proTipText: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '600',
  },
  claimedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 10,
    gap: 6,
    borderWidth: 1.5,
  },
  claimedBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
