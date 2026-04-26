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
  Platform,
  LayoutAnimation,
  Image,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../src/constants/Colors';
import { useCategoryStore } from '../src/store/useCategoryStore';
import { useAuthStore } from '../src/store/useAuthStore';
import * as Haptics from 'expo-haptics';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Constants from 'expo-constants';
import { SuccessOverlay } from '../src/components/shared/SuccessOverlay';
import { LottieOverlay } from '../src/components/shared/LottieOverlay';

const { width } = Dimensions.get('window');

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
  const [showSuccess, setShowSuccess] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const [pickerExpandedFor, setPickerExpandedFor] = useState<string | null>(null);

  // 🛡️ [PERSISTENCE] Connect to Global Discovery Store
  const { 
    youtubeDiscovery, 
    addDiscoveredChannels, 
    toggleYoutubeChannelSelection, 
    setYoutubeChannelCategory,
  } = useAuthStore();

  const channels = youtubeDiscovery.channels;
  const selectedChannels = youtubeDiscovery.selectedChannelIds;
  const channelToSubCategory = youtubeDiscovery.categorizations;

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
      
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      addDiscoveredChannels(fetchedChannels);
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setConnected(true);
      }, 2000);
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
        Alert.alert("Already Claimed", "This YouTube channel is already linked to another SuviX account.");
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
      Alert.alert('Setup Error', 'Missing category context.');
      router.replace('/role-selection');
      return;
    }

    if (selectedChannels.length === 0 || !allSelectedChannelsTagged) {
      Alert.alert('Action Required', 'Please select at least one channel and assign a niche.');
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

    handleImpact(Haptics.ImpactFeedbackStyle.Heavy);
    setIsLinking(true);
    setTimeout(() => {
      setIsLinking(false);
      router.push('/signup');
    }, 1800);
  };

  const handleConnectYouTube = async () => {
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
        Alert.alert('Authentication Error', 'Google did not return a valid access token.');
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
      
      <LottieOverlay 
        isVisible={connecting} 
        theme="youtube" 
        message="Discovering your YouTube Identities..." 
      />

      <SuccessOverlay 
        isVisible={showSuccess} 
        type="youtube" 
        title="Identities Found"
        message="Your identities have been successfully discovered and synced." 
      />

      <SuccessOverlay 
        isVisible={isLinking} 
        type="success" 
        title="YouTube Linked!"
        message="Your YouTube channels are now successfully linked to your SuviX profile." 
      />

      {/* 🏙️ PREMIUM BLUR HEADER */}
      <BlurView intensity={isDark ? 80 : 100} tint={isDark ? 'dark' : 'light'} style={[styles.blurHeader, { paddingTop: insets.top }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: theme.secondary }]}>
            <Feather name="arrow-left" size={20} color={theme.text} />
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <Ionicons name="logo-youtube" size={22} color={ytRed} />
            <Text style={[styles.title, { color: theme.text }]}>YouTube Sync</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>
        
        {/* PROGRESS STEPPER */}
        <View style={styles.stepperContainer}>
          <View style={[styles.stepBar, { backgroundColor: theme.border }]}>
            <AnimatedLinearGradient 
              colors={[ytRed, '#FF5252']} 
              style={[styles.stepProgress, { width: connected ? '100%' : '50%' }]} 
              start={{ x: 0, y: 0 }} 
              end={{ x: 1, y: 0 }}
            />
          </View>
        </View>
      </BlurView>

      <ScrollView 
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 100 }]} 
        showsVerticalScrollIndicator={false}
      >
        
        {/* 🎭 PREMIUM HERO CARD */}
        {!connected && !connecting && (
          <View style={styles.heroWrapper}>
            <LinearGradient
              colors={isDark ? ['#1a1a1a', '#000000'] : ['#FFFFFF', '#F0F4F8']}
              style={[styles.heroCard, { borderColor: theme.border }]}
            >
              <View style={[styles.heroIconCircle, { backgroundColor: isDark ? 'rgba(255,0,0,0.1)' : 'rgba(255,0,0,0.05)' }]}>
                <MaterialCommunityIcons name="youtube-subscription" size={32} color={ytRed} />
              </View>
              <Text style={[styles.heroTitle, { color: theme.text }]}>Unlock Your Creator Identity</Text>
              <Text style={[styles.heroSubtitle, { color: theme.textSecondary }]}>
                Sync your channel to display verified metrics, gain access to exclusive brand deals, and boost your profile credibility.
              </Text>
              
              <View style={styles.featureList}>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={16} color={safeGreen} />
                  <Text style={[styles.featureText, { color: theme.textSecondary }]}>Verified Subscriber Counts</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={16} color={safeGreen} />
                  <Text style={[styles.featureText, { color: theme.textSecondary }]}>Content Engagement Insights</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={16} color={safeGreen} />
                  <Text style={[styles.featureText, { color: theme.textSecondary }]}>Priority in Search Results</Text>
                </View>
              </View>
            </LinearGradient>
          </View>
        )}

        {/* 🎬 MAIN ACTION SECTION */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>PHASE 1</Text>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Secure Identity Sync</Text>
            </View>
            {connected && (
              <View style={[styles.statusBadge, { backgroundColor: 'rgba(0,200,83,0.1)' }]}>
                <View style={[styles.statusDot, { backgroundColor: safeGreen }]} />
                <Text style={[styles.statusText, { color: safeGreen }]}>CONNECTED</Text>
              </View>
            )}
          </View>

          {!connected ? (
            <TouchableOpacity 
              style={[styles.mainActionBtn, { backgroundColor: ytRed }]} 
              onPress={handleConnectYouTube} 
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={['rgba(255,255,255,0.2)', 'transparent']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
              <Ionicons name="logo-google" size={20} color="#fff" style={{ marginRight: 12 }} />
              <Text style={styles.mainActionText}>Authenticate with Google</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={[styles.secondaryActionBtn, { backgroundColor: theme.secondary, borderColor: theme.border }]} 
              onPress={handleConnectYouTube} 
              activeOpacity={0.7}
            >
              <Ionicons name="add-circle-outline" size={20} color={theme.text} style={{ marginRight: 8 }} />
              <Text style={[styles.secondaryActionText, { color: theme.text }]}>Switch or Add Account</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* 📋 CHANNELS LIST */}
        {connected && !connecting && (
          <View style={styles.channelsSection}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>PHASE 2</Text>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Selection & Niche</Text>
              </View>
            </View>

            {channels.length === 0 ? (
              <View style={[styles.emptyState, { backgroundColor: theme.secondary }]}>
                <MaterialCommunityIcons name="video-off-outline" size={48} color={theme.textSecondary} />
                <Text style={[styles.emptyStateTitle, { color: theme.text }]}>No Channels Discovered</Text>
                <Text style={[styles.emptyStateDesc, { color: theme.textSecondary }]}>
                  We couldn't find any public channels on this Google account. Please try another one.
                </Text>
              </View>
            ) : (
              <View style={styles.channelsList}>
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
                        { 
                          backgroundColor: isDark ? '#111' : '#fff', 
                          borderColor: isSelected ? ytRed : theme.border 
                        },
                        channel.isClaimed && { opacity: 0.6, borderColor: theme.border }
                      ]}
                    >
                      {channel.isClaimed && (
                        <View style={[styles.lockedOverlay, { backgroundColor: isDark ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.4)' }]}>
                          <LinearGradient
                            colors={isDark ? ['#332900', '#1F1A00'] : ['#FFF9E5', '#FFF0B3']}
                            style={styles.lockedBanner}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                          >
                            <Feather name="shield" size={12} color={isDark ? '#FFDA44' : '#CC9900'} />
                            <Text style={[styles.lockedBannerText, { color: isDark ? '#FFDA44' : '#CC9900' }]}>
                              LINKED TO ANOTHER SUVIX IDENTITY
                            </Text>
                          </LinearGradient>
                        </View>
                      )}

                      <TouchableOpacity 
                        style={styles.cardHeader} 
                        onPress={() => toggleChannel(channel.channelId)}
                        activeOpacity={channel.isClaimed ? 1 : 0.7}
                      >
                        <View style={channel.isClaimed && styles.grayscaleAvatar}>
                          <Image source={{ uri: channel.thumbnailUrl || 'https://via.placeholder.com/100' }} style={styles.channelAvatar} />
                        </View>
                        <View style={styles.channelMeta}>
                          <Text style={[styles.channelName, { color: theme.text }]} numberOfLines={1}>
                            {channel.channelName}
                          </Text>
                          <View style={styles.statsRow}>
                            <View style={styles.statItem}>
                              <Feather name="users" size={12} color={theme.textSecondary} />
                              <Text style={[styles.statValue, { color: theme.textSecondary }]}>
                                {(channel.subscriberCount || 0).toLocaleString()}
                              </Text>
                            </View>
                            <View style={styles.statDivider} />
                            <View style={styles.statItem}>
                              <Feather name="video" size={12} color={theme.textSecondary} />
                              <Text style={[styles.statValue, { color: theme.textSecondary }]}>
                                {channel.videoCount}
                              </Text>
                            </View>
                          </View>
                        </View>
                        <View style={[
                          styles.selectionCircle, 
                          { borderColor: channel.isClaimed ? theme.border : (isSelected ? ytRed : theme.border), backgroundColor: isSelected ? ytRed : 'transparent' }
                        ]}>
                          {channel.isClaimed ? (
                            <Feather name="lock" size={14} color={theme.textSecondary} />
                          ) : (
                            isSelected && <Ionicons name="checkmark" size={16} color="#fff" />
                          )}
                        </View>
                      </TouchableOpacity>

                      {/* NICHE SELECTOR */}
                      <View style={[styles.nicheContainer, { borderTopColor: theme.border }]}>
                        <TouchableOpacity 
                          style={[
                            styles.nicheTrigger, 
                            { backgroundColor: isDark ? '#1a1a1a' : '#F7F9FC' },
                            activeSubCategoryId && { borderColor: safeGreen, borderWidth: 1 }
                          ]}
                          onPress={() => {
                            if (channel.isClaimed) return;
                            LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
                            setPickerExpandedFor(isPickerOpen ? null : channel.channelId);
                          }}
                        >
                          <View style={styles.nicheInfo}>
                            <Text style={[styles.nicheLabel, { color: theme.textSecondary }]}>PRIMARY NICHE</Text>
                            <Text style={[styles.nicheValue, { color: activeSubCategoryId ? safeGreen : theme.text }]}>
                              {activeSubCategoryName || 'Select your content niche...'}
                            </Text>
                          </View>
                          <Ionicons 
                            name={isPickerOpen ? "chevron-up" : "chevron-down"} 
                            size={18} 
                            color={theme.textSecondary} 
                          />
                        </TouchableOpacity>

                        {isPickerOpen && (
                          <View style={styles.nichePicker}>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.nicheScroll}>
                              {subCategories.map((sub) => {
                                const isActive = activeSubCategoryId === sub.id;
                                return (
                                  <TouchableOpacity
                                    key={sub.id}
                                    onPress={() => assignSubCategory(channel.channelId, sub.id)}
                                    style={[
                                      styles.nichePill,
                                      { backgroundColor: theme.secondary, borderColor: theme.border },
                                      isActive && { backgroundColor: ytRed, borderColor: ytRed }
                                    ]}
                                  >
                                    <Text style={[styles.nichePillText, { color: isActive ? '#fff' : theme.textSecondary }]}>
                                      {sub.name}
                                    </Text>
                                  </TouchableOpacity>
                                );
                              })}
                            </ScrollView>
                          </View>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* 🚀 PREMIUM ACTION FOOTER */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        <LinearGradient
          colors={isDark ? ['transparent', 'rgba(0,0,0,0.9)'] : ['transparent', 'rgba(255,255,255,0.9)']}
          style={styles.footerGradient}
        />
        <TouchableOpacity 
          style={[
            styles.primaryContinueBtn, 
            (!connected || !allSelectedChannelsTagged) && { backgroundColor: theme.border, shadowOpacity: 0 }
          ]}
          onPress={handleContinue}
          disabled={!connected || !allSelectedChannelsTagged}
          activeOpacity={0.8}
        >
          <Text style={[styles.continueText, { color: (!connected || !allSelectedChannelsTagged) ? theme.textSecondary : '#000' }]}>
            Finalize Connection
          </Text>
          <Feather name="arrow-right" size={20} color={(!connected || !allSelectedChannelsTagged) ? theme.textSecondary : '#000'} />
        </TouchableOpacity>
        <Text style={[styles.footerNote, { color: theme.textSecondary }]}>
          Selected: {selectedChannels.length} Identity
        </Text>
      </View>
    </View>
  );
}

// Wrapper for LinearGradient to use as Animated Component if needed
const AnimatedLinearGradient = LinearGradient;

const styles = StyleSheet.create({
  container: { flex: 1 },
  blurHeader: {
    position: 'absolute',
    top: 0,
    width: '100%',
    zIndex: 100,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150,150,150,0.1)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    height: 64,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  stepperContainer: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  stepBar: {
    height: 3,
    borderRadius: 1.5,
    width: '100%',
    overflow: 'hidden',
  },
  stepProgress: {
    height: '100%',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 150,
  },
  heroWrapper: {
    marginBottom: 32,
  },
  heroCard: {
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  heroIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    paddingHorizontal: 10,
  },
  featureList: {
    width: '100%',
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureText: {
    fontSize: 13,
    fontWeight: '600',
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  sectionSubtitle: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 100,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  mainActionBtn: {
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF0000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
    overflow: 'hidden',
  },
  mainActionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  secondaryActionBtn: {
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryActionText: {
    fontSize: 14,
    fontWeight: '700',
  },
  channelsSection: {
    marginTop: 8,
  },
  emptyState: {
    padding: 40,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateDesc: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  channelsList: {
    gap: 16,
  },
  channelCard: {
    borderRadius: 24,
    borderWidth: 1.5,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    position: 'relative',
  },
  lockedOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 5,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  lockedBanner: {
    width: '100%',
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  lockedBannerText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  grayscaleAvatar: {
    opacity: 0.5,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  channelAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  channelMeta: {
    flex: 1,
    marginLeft: 16,
  },
  channelName: {
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 12,
    fontWeight: '700',
  },
  statDivider: {
    width: 1,
    height: 10,
    backgroundColor: 'rgba(150,150,150,0.3)',
  },
  selectionCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nicheContainer: {
    borderTopWidth: 1,
    padding: 16,
  },
  nicheTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
  },
  nicheInfo: {
    flex: 1,
  },
  nicheLabel: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 2,
  },
  nicheValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  nichePicker: {
    marginTop: 12,
  },
  nicheScroll: {
    gap: 8,
    paddingRight: 20,
  },
  nichePill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  nichePillText: {
    fontSize: 13,
    fontWeight: '800',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  footerGradient: {
    ...StyleSheet.absoluteFillObject,
    height: 120,
    top: -40,
  },
  primaryContinueBtn: {
    width: '100%',
    height: 60,
    backgroundColor: '#fff',
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 8,
  },
  continueText: {
    fontSize: 16,
    fontWeight: '900',
  },
  footerNote: {
    marginTop: 12,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  }
});
