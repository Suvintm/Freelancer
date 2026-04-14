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

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type Step = 'IDENTIFY' | 'VERIFY' | 'LOADING' | 'PREVIEW';

export default function ManualLinkScreen() {
  const { theme, isDarkMode } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [currentStep, setCurrentStep] = useState<Step>('IDENTIFY');
  const [channelUrl, setChannelUrl] = useState('');
  const [timer, setTimer] = useState(300); // 5 minutes in seconds
  const [verificationCode] = useState(`SUVIX-${Math.floor(10000 + Math.random() * 90000)}`);
  
  // Form State
  const [selectedCategory, setSelectedCategory] = useState('Entertainment');
  const [selectedLanguage, setSelectedLanguage] = useState('English');

  // Animation values
  const [fadeAnim] = useState(new Animated.Value(1));

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

  const handleVerify = () => {
    handleNextStep('LOADING');
    // Simulated verification delay
    setTimeout(() => {
      handleNextStep('PREVIEW');
    }, 2500);
  };

  const handleFinalConfirm = () => {
    Alert.alert("Request Received", "Channel verification in progress. We will notify you once linked!");
    router.back();
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
          <Text style={[styles.label, { color: theme.textSecondary }]}>Category</Text>
          <TouchableOpacity style={[styles.dropdown, { backgroundColor: theme.secondary, borderColor: theme.border }]}>
            <Text style={{ color: theme.text }}>{selectedCategory}</Text>
            <Feather name="chevron-down" size={16} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>
        <View style={{ flex: 1, marginLeft: 8 }}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Language</Text>
          <TouchableOpacity style={[styles.dropdown, { backgroundColor: theme.secondary, borderColor: theme.border }]}>
            <Text style={{ color: theme.text }}>{selectedLanguage}</Text>
            <Feather name="chevron-down" size={16} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity 
        style={[styles.primaryButton, { backgroundColor: theme.accent }]}
        onPress={() => handleNextStep('VERIFY')}
      >
        <Text style={styles.primaryButtonText}>Continue to Verification</Text>
        <Feather name="arrow-right" size={18} color="#000" />
      </TouchableOpacity>
    </View>
  );

  const renderVerify = () => (
    <View style={styles.stepContent}>
      <View style={styles.timerBadge}>
        <Feather name="clock" size={14} color="#FF6B6B" />
        <Text style={styles.timerText}>{formatTime(timer)}</Text>
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
      <Text style={[styles.title, { color: theme.text }]}>Confirm Channel</Text>
      <Text style={[styles.description, { color: theme.textSecondary }]}>
        We found your channel! Does this look correct?
      </Text>

      <View style={[styles.previewCard, { backgroundColor: theme.secondary, borderColor: theme.border }]}>
        <Image source={{ uri: 'https://placehold.co/100x100.png' }} style={styles.previewThumb} />
        <View style={styles.previewInfo}>
          <Text style={[styles.previewName, { color: theme.text }]}>Tech Insider Pro</Text>
          <View style={styles.previewStats}>
            <View style={styles.statChip}>
              <MaterialCommunityIcons name="account-group" size={12} color="#FF0000" />
              <Text style={[styles.statChipText, { color: theme.textSecondary }]}>154K</Text>
            </View>
            <View style={[styles.statChip, { marginLeft: 8 }]}>
              <MaterialCommunityIcons name="movie-play" size={12} color={theme.accent} />
              <Text style={[styles.statChipText, { color: theme.textSecondary }]}>420</Text>
            </View>
          </View>
          <Text style={[styles.previewNiche, { color: theme.accent }]}>{selectedCategory}</Text>
        </View>
        <View style={styles.verifiedBadge}>
          <MaterialCommunityIcons name="check-decagram" size={24} color="#FF0000" />
        </View>
      </View>

      <TouchableOpacity 
        style={[styles.primaryButton, { backgroundColor: theme.accent }]}
        onPress={handleFinalConfirm}
      >
        <Text style={styles.primaryButtonText}>Link this Channel</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.secondaryActionBtn}
        onPress={() => handleNextStep('IDENTIFY')}
      >
        <Text style={[styles.secondaryActionBtnText, { color: theme.textSecondary }]}>Wrong channel? Start over</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.primary }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity 
          style={[styles.backBtn, { backgroundColor: theme.secondary }]} 
          onPress={() => router.back()}
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
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 20,
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
  }
});
