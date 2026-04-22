import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  Dimensions,
  Animated,
  Platform,
  Linking,
  ActivityIndicator,
  StatusBar,
  Alert,
  Clipboard
} from 'react-native';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useTheme } from '../../src/context/ThemeContext';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '../../src/api/client';
import { useSocketStore } from '../../src/store/useSocketStore';
import { useAuthStore } from '../../src/store/useAuthStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type Step = 'IDENTIFY' | 'VERIFY' | 'LOADING' | 'PREVIEW';

export default function ManualLinkScreen() {
  const { theme, isDarkMode } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [currentStep, setCurrentStep] = useState<Step>('IDENTIFY');
  const [channelUrl, setChannelUrl] = useState('');
  const [timer, setTimer] = useState(900); // 15 minutes default
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [channelData, setChannelData] = useState<any>(null);
  const [subCategories, setSubCategories] = useState<any[]>([]);
  
  // Form State
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedCategoryName, setSelectedCategoryName] = useState('Select Category');
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [isSyncComplete, setIsSyncComplete] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncMessage, setSyncMessage] = useState('Initializing sync...');
  
  const { socket } = useSocketStore();

  const LANGUAGES = ['English', 'Hindi', 'Tamil', 'Telugu', 'Kannada', 'Malayalam', 'Bengali', 'Marathi', 'Gujarati', 'Punjabi', 'Spanish', 'French', 'Other'];

  // Animation values
  const [fadeAnim] = useState(new Animated.Value(1));

  // Category Fetch Logic
  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const res = await api.get('/youtube-creator/meta/subcategories');
        if (res.data.success) {
          setSubCategories(res.data.data);
        }
      } catch (err) {
        console.error("Failed to fetch subcategories:", err);
      }
    };
    fetchMeta();
  }, []);

  // Timer Logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (currentStep === 'VERIFY' && timer > 0) {
      interval = setInterval(() => {
        setTimer(t => t - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [currentStep, timer]);
  
  // 🛰️ Real-time Sync Listener
  useEffect(() => {
    if (!socket || currentStep !== 'PREVIEW') return;

    const handleNotification = (data: any) => {
      if (data.type === 'SYNC_PROGRESS') {
        setSyncProgress(data.metadata?.progress || 0);
        setSyncMessage(data.metadata?.message || 'Syncing content...');
      }
      
      if (data.type === 'SYNC_COMPLETE' || data.metadata?.type === 'youtube_sync_complete') {
        console.log('🎉 [YT-VERIFY] Received Sync Complete signal via socket!');
        setIsSyncComplete(true);
        setSyncProgress(100);
      }
    };

    socket.on('notification:new', handleNotification);
    return () => {
      socket.off('notification:new', handleNotification);
    };
  }, [socket, currentStep]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleNextStep = (next: Step) => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setCurrentStep(next);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    });
  };

  const copyToClipboard = () => {
    Clipboard.setString(verificationCode);
    // Silent success for premium feel
  };

  const handleInitiate = async () => {
    if (!channelUrl) {
      Alert.alert("Error", "Please enter a channel handle or URL first.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post('/youtube-creator/manual-verify/initiate', {
        channelInput: channelUrl,
        subCategoryId: selectedCategoryId,
        language: selectedLanguage,
      });

      if (response.data.success) {
        setVerificationCode(response.data.data.token);
        setTimer(response.data.data.expiresIn);
        handleNextStep('VERIFY');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to start verification.";
      Alert.alert("Notice", msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async () => {
    handleNextStep('LOADING');
    try {
      const response = await api.post('/youtube-creator/manual-verify/check', {
        channelInput: channelUrl,
        token: verificationCode,
      });

      if (response.data.success) {
        setChannelData(response.data.data.profile); // Update this based on your service return
        handleNextStep('PREVIEW');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || "Verification failed.";
      Alert.alert("Verification Error", msg);
      handleNextStep('VERIFY');
    }
  };

  const handleRegenerate = async () => {
    try {
      const response = await api.post('/youtube-creator/manual-verify/regenerate', {
        channelInput: channelUrl,
      });

      if (response.data.success) {
        setVerificationCode(response.data.data.token);
        setTimer(response.data.data.expiresIn);
        Alert.alert("Success", "A new verification code has been generated.");
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || "Regeneration failed.";
      Alert.alert("Error", msg);
    }
  };

  const handleFinalConfirm = async () => {
    // Refresh the local user state to include the new channel
    const fetchUser = useAuthStore.getState().fetchUser;
    if (fetchUser) await fetchUser();

    Alert.alert("Channel Linked!", "Successfully added the channel to your SuviX profile.");
    router.replace('/(tabs)/profile');
  };

  const renderIdentify = () => (
    <View style={styles.stepContent}>
      <Text style={[styles.title, { color: theme.text }]}>Channel Details</Text>
      <Text style={[styles.description, { color: theme.textSecondary }]}>
        Enter the details of the YouTube channel you want to link to your SuviX profile.
      </Text>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>YouTube URL or Handle</Text>
        <TextInput
          placeholder="@channelname or youtube.com/..."
          placeholderTextColor={theme.textSecondary}
          style={[styles.input, { backgroundColor: theme.secondary, borderColor: theme.border, color: theme.text }]}
          value={channelUrl}
          onChangeText={setChannelUrl}
          autoCapitalize="none"
        />
      </View>

      <View style={styles.row}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Niche / Category</Text>
          <TouchableOpacity 
            style={[styles.dropdown, { backgroundColor: theme.secondary, borderColor: theme.border }]}
            onPress={() => setShowCategoryDropdown(!showCategoryDropdown)}
          >
            <Text style={{ color: theme.text }} numberOfLines={1}>{selectedCategoryName}</Text>
            <Feather name={showCategoryDropdown ? "chevron-up" : "chevron-down"} size={16} color={theme.textSecondary} />
          </TouchableOpacity>
          {showCategoryDropdown && (
            <View style={[styles.dropdownMenu, { backgroundColor: theme.secondary, borderColor: theme.border }]}>
               <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
                {subCategories.map((item) => (
                  <TouchableOpacity 
                    key={item.id} 
                    style={styles.dropdownItem}
                    onPress={() => {
                      setSelectedCategoryId(item.id);
                      setSelectedCategoryName(item.name);
                      setShowCategoryDropdown(false);
                    }}
                  >
                    <Text style={{ color: theme.text }}>{item.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
        <View style={{ flex: 1, marginLeft: 8 }}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Content Language</Text>
          <TouchableOpacity 
            style={[styles.dropdown, { backgroundColor: theme.secondary, borderColor: theme.border }]}
            onPress={() => setShowLanguageDropdown(!showLanguageDropdown)}
          >
            <Text style={{ color: selectedLanguage ? theme.text : theme.textSecondary }}>
              {selectedLanguage || 'Select Language'}
            </Text>
            <Feather name={showLanguageDropdown ? "chevron-up" : "chevron-down"} size={16} color={theme.textSecondary} />
          </TouchableOpacity>
          {showLanguageDropdown && (
            <View style={[styles.dropdownMenu, { backgroundColor: theme.secondary, borderColor: theme.border }]}>
               <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
                {LANGUAGES.map((lang) => (
                  <TouchableOpacity 
                    key={lang} 
                    style={styles.dropdownItem}
                    onPress={() => {
                      setSelectedLanguage(lang);
                      setShowLanguageDropdown(false);
                    }}
                  >
                    <Text style={{ color: theme.text }}>{lang}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      </View>

      <TouchableOpacity 
        style={[
          styles.primaryButton, 
          { 
            backgroundColor: (selectedCategoryId && selectedLanguage && channelUrl) ? theme.accent : theme.secondary,
            opacity: (selectedCategoryId && selectedLanguage && channelUrl) ? 1 : 0.5
          }
        ]}
        onPress={handleInitiate}
        disabled={isLoading || !selectedCategoryId || !selectedLanguage || !channelUrl}
      >
        {isLoading ? (
          <ActivityIndicator color="#000" />
        ) : (
          <>
            <Text style={styles.primaryButtonText}>Continue to Verification</Text>
            <Feather name="arrow-right" size={18} color="#000" />
          </>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderVerify = () => (
    <View style={styles.stepContent}>
      <View style={styles.timerContainer}>
        <View style={[styles.timerBadge, { opacity: timer <= 60 ? 1 : 0.8 }]}>
          <Feather name="clock" size={14} color={timer <= 60 ? "#FF6B6B" : theme.textSecondary} />
          <Text style={[styles.timerText, { color: timer <= 60 ? "#FF6B6B" : theme.textSecondary }]}>{formatTime(timer)}</Text>
        </View>
        {timer === 0 && (
          <Text style={{ color: '#FF6B6B', fontSize: 12, fontWeight: '700', marginLeft: 12 }}>Code Expired</Text>
        )}
      </View>

      <Text style={[styles.title, { color: theme.text }]}>Add Verification Code</Text>
      <Text style={[styles.description, { color: theme.textSecondary }]}>
        To prove you own this channel, please add the code below to your YouTube channel's <Text style={{ fontWeight: '800' }}>"About" description</Text>.
      </Text>

      <View style={[styles.codeCard, { backgroundColor: theme.secondary, borderColor: theme.border }]}>
        <Text style={[styles.codeValue, { color: theme.text }]}>{verificationCode}</Text>
        <TouchableOpacity style={styles.copyBtn} onPress={copyToClipboard}>
          <Feather name="copy" size={20} color={theme.accent} />
        </TouchableOpacity>
      </View>

      <View style={styles.instructionList}>
        <View style={styles.instructionItem}>
          <View style={[styles.numberCircle, { backgroundColor: theme.accent }]}><Text style={styles.numberText}>1</Text></View>
          <Text style={[styles.instructionText, { color: theme.textSecondary }]}>Open YouTube Studio or Mobile App</Text>
        </View>
        <View style={styles.instructionItem}>
          <View style={[styles.numberCircle, { backgroundColor: theme.accent }]}><Text style={styles.numberText}>2</Text></View>
          <Text style={[styles.instructionText, { color: theme.textSecondary }]}>Edit Channel Info / Description</Text>
        </View>
        <View style={styles.instructionItem}>
          <View style={[styles.numberCircle, { backgroundColor: theme.accent }]}><Text style={styles.numberText}>3</Text></View>
          <Text style={[styles.instructionText, { color: theme.textSecondary }]}>Paste the code and Save changes</Text>
        </View>
      </View>

      <TouchableOpacity 
        style={[styles.primaryButton, { backgroundColor: theme.accent }]}
        onPress={handleVerify}
      >
        <Text style={styles.primaryButtonText}>I've added the code, Verify!</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.secondaryActionBtn}
        onPress={handleRegenerate}
      >
        <Text style={[styles.secondaryActionBtnText, { color: theme.accent }]}>Regenerate Code</Text>
        <Feather name="refresh-cw" size={14} color={theme.accent} style={{ marginLeft: 6 }} />
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.secondaryActionBtn}
        onPress={() => Linking.openURL('https://studio.youtube.com')}
      >
        <Text style={[styles.secondaryActionBtnText, { color: theme.textSecondary }]}>Go to YouTube Studio</Text>
        <Feather name="external-link" size={14} color={theme.textSecondary} style={{ marginLeft: 6 }} />
      </TouchableOpacity>
    </View>
  );

  const renderLoading = () => (
    <View style={[styles.stepContent, styles.centerContent]}>
      <ActivityIndicator size="large" color={theme.accent} />
      <Text style={[styles.loadingTitle, { color: theme.text }]}>Verifying Channel...</Text>
      <Text style={[styles.loadingSub, { color: theme.textSecondary }]}>
        Our system is scanning your channel's description for the security code.
      </Text>
    </View>
  );

  const renderPreview = () => (
    <View style={styles.stepContent}>
      <View style={styles.successHeader}>
        <View style={styles.celebrationCircle}>
           <MaterialCommunityIcons name="party-popper" size={32} color={theme.accent} />
        </View>
        <Text style={[styles.title, { color: theme.text, textAlign: 'center' }]}>Verification Successful!</Text>
      </View>
      
      <Text style={[styles.description, { color: theme.textSecondary, textAlign: 'center', marginTop: 10 }]}>
        Your channel <Text style={{ fontWeight: '800', color: theme.text }}>{channelData?.channel_name || 'YouTube'}</Text> has been successfully linked to your SuviX profile.
      </Text>

      <View style={[styles.previewCard, { backgroundColor: theme.secondary, borderColor: theme.border }]}>
        <Image 
          source={{ uri: channelData?.thumbnail_url || 'https://placehold.co/100x100.png' }} 
          style={styles.previewThumb} 
        />
        <View style={styles.previewInfo}>
          <Text style={[styles.previewName, { color: theme.text }]}>{channelData?.channel_name || 'YouTube Channel'}</Text>
          <View style={styles.previewStats}>
            <View style={styles.statChip}>
              <MaterialCommunityIcons name="account-group" size={12} color="#FF0000" />
              <Text style={[styles.statChipText, { color: theme.textSecondary }]}>
                {channelData?.subscriber_count ? `${(channelData.subscriber_count / 1000).toFixed(1)}K` : '0'}
              </Text>
            </View>
            <View style={[styles.statChip, { marginLeft: 8 }]}>
              <MaterialCommunityIcons name="movie-play" size={12} color={theme.accent} />
              <Text style={[styles.statChipText, { color: theme.textSecondary }]}>
                {channelData?.video_count || '0'}
              </Text>
            </View>
          </View>
          <View style={styles.statusRow}>
             <View style={[styles.dot, { backgroundColor: isSyncComplete ? '#22C55E' : '#FFB000' }]} />
             <Text style={[styles.previewNiche, { color: isSyncComplete ? '#22C55E' : '#FFB000', marginLeft: 6 }]}>
               {isSyncComplete ? 'READY & SYNCED' : 'SYNCING VIDEOS...'}
             </Text>
          </View>
        </View>
        <View style={styles.verifiedBadge}>
          <MaterialCommunityIcons name="check-decagram" size={24} color="#FF0000" />
        </View>
      </View>
      
      {!isSyncComplete && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBarBg}>
            <Animated.View 
              style={[
                styles.progressBarFill, 
                { 
                  backgroundColor: theme.accent,
                  width: `${syncProgress}%` 
                }
              ]} 
            />
          </View>
          <View style={styles.progressLabelRow}>
            <Text style={[styles.progressMessage, { color: theme.textSecondary }]}>{syncMessage}</Text>
            <Text style={[styles.progressPercentage, { color: theme.accent }]}>{syncProgress}%</Text>
          </View>
        </View>
      )}
      
      <TouchableOpacity 
        style={[
          styles.primaryButton, 
          { 
            backgroundColor: isSyncComplete ? theme.accent : theme.secondary,
            opacity: isSyncComplete ? 1 : 0.6,
            borderColor: theme.border,
            borderWidth: isSyncComplete ? 0 : 1
          }
        ]}
        onPress={handleFinalConfirm}
        disabled={!isSyncComplete}
      >
        {isSyncComplete ? (
          <>
            <Text style={styles.primaryButtonText}>Go to Profile</Text>
            <Feather name="arrow-right" size={18} color="#000" />
          </>
        ) : (
          <>
             <ActivityIndicator size="small" color={theme.textSecondary} style={{ marginRight: 10 }} />
             <Text style={[styles.primaryButtonText, { color: theme.textSecondary }]}>Finishing Sync...</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.primary }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity 
          style={[
            styles.backBtn, 
            { 
              backgroundColor: theme.secondary,
              opacity: (currentStep === 'PREVIEW' && !isSyncComplete) ? 0.3 : 1 
            }
          ]} 
          onPress={() => router.back()}
          disabled={currentStep === 'PREVIEW' && !isSyncComplete}
        >
          <Feather name="arrow-left" size={24} color={theme.text} />
        </TouchableOpacity>
        <View style={styles.stepperContainer}>
          {['IDENTIFY', 'VERIFY', 'PREVIEW'].map((step, idx) => {
            const isActive = currentStep === step || (currentStep === 'LOADING' && step === 'VERIFY');
            return (
              <View key={step} style={styles.stepWrapper}>
                <View style={[
                  styles.stepDot, 
                  { backgroundColor: isActive ? theme.accent : theme.border }
                ]} />
                {idx < 2 && <View style={[styles.stepLine, { backgroundColor: theme.border }]} />}
              </View>
            );
          })}
        </View>
        <View style={{ width: 44 }} />
      </View>

      <Animated.View style={{ opacity: fadeAnim, flex: 1 }}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {currentStep === 'IDENTIFY' && renderIdentify()}
          {currentStep === 'VERIFY' && renderVerify()}
          {currentStep === 'LOADING' && renderLoading()}
          {currentStep === 'PREVIEW' && renderPreview()}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  stepLine: {
    width: 20,
    height: 1,
    marginHorizontal: 4,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 60,
  },
  stepContent: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 32,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 10,
    marginLeft: 4,
  },
  input: {
    height: 58,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 18,
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 32,
  },
  dropdown: {
    height: 58,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  dropdownMenu: {
    position: 'absolute',
    top: 64,
    left: 0,
    right: 0,
    borderRadius: 16,
    borderWidth: 1,
    padding: 8,
    zIndex: 1000,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
      },
      android: { elevation: 10 },
    }),
  },
  dropdownItem: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  primaryButton: {
    height: 60,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: { elevation: 4 },
    }),
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#000',
    marginRight: 8,
  },
  codeCard: {
    padding: 28,
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    position: 'relative',
  },
  codeValue: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 2,
  },
  copyBtn: {
    position: 'absolute',
    right: 20,
    padding: 10,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  timerText: {
    color: '#FF6B6B',
    fontSize: 13,
    fontWeight: '800',
    marginLeft: 6,
  },
  instructionList: {
    marginBottom: 40,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  numberCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  numberText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#000',
  },
  instructionText: {
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryActionBtn: {
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    flexDirection: 'row',
  },
  secondaryActionBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  loadingTitle: {
    fontSize: 22,
    fontWeight: '900',
    marginTop: 24,
    marginBottom: 12,
  },
  loadingSub: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 24,
  },
  previewCard: {
    padding: 20,
    borderRadius: 28,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40,
  },
  previewThumb: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 20,
  },
  previewInfo: {
    flex: 1,
  },
  previewName: {
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 8,
  },
  previewStats: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  statChipText: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 5,
  },
  previewNiche: {
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  verifiedBadge: {
    marginLeft: 12,
  },
  successHeader: {
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  celebrationCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 48, 64, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  progressContainer: {
    marginBottom: 32,
    paddingHorizontal: 4,
  },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressMessage: {
    fontSize: 13,
    fontWeight: '600',
  },
  progressPercentage: {
    fontSize: 13,
    fontWeight: '800',
  }
});
