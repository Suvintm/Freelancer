import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
  Image,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  useColorScheme,
  Modal,
  Switch
} from 'react-native';
import { 
  isValidEmail, 
  isValidPhone, 
  isValidPassword, 
  isValidUsername 
} from '../src/utils/validation';
import { useRouter } from 'expo-router';
import { Feather, Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../src/constants/Colors';
import SuvixInput from '../src/components/SuvixInput';
import SuvixButton from '../src/components/SuvixButton';
import { useGoogleAuth } from '../src/hooks/useGoogleAuth';
import * as Haptics from 'expo-haptics';
import { useAuthStore } from '../src/store/useAuthStore';
import { ProcessingOverlay } from '../src/components/shared/ProcessingOverlay';
import { LottieOverlay } from '../src/components/shared/LottieOverlay';
import { AnimatedBackground } from '../src/components/auth/AnimatedBackground';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const DEFAULT_AVATAR = "https://cdn-icons-png.flaticon.com/512/149/149071.png";

export default function SignupScreen() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const isDark = colorScheme === 'dark';

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [motherTongue, setMotherTongue] = useState('English');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  
  const [showPassword, setShowPassword] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<{ type: 'loading' | 'success' | 'error' | 'none', message: string }>({ type: 'none', message: '' });
  const LANGUAGES = [
    'English', 'Hindi', 'Kannada', 'Telugu', 'Tamil', 
    'Malayalam', 'Marathi', 'Bengali', 'Gujarati', 'Punjabi'
  ];
  
  const router = useRouter();
  const { signIn: googleSignIn, isLoading: isGoogleLoading } = useGoogleAuth();
  const { user, isAuthenticated, setAuth } = useAuthStore();
  const clearTempSignupData = useAuthStore((state) => state.clearTempSignupData);

  // Watch for Google Auth completion to handle redirect smoothly
  React.useEffect(() => {
    if (isAuthenticated && user) {
      setIsTransitioning(true);
      setTimeout(() => {
        router.replace('/(tabs)');
      }, 600);
    }
  }, [isAuthenticated, user?.id]);

  const handleImpact = (style = Haptics.ImpactFeedbackStyle.Light) => {
    Haptics.impactAsync(style);
  };

  const pickImage = async () => {
    handleImpact();
    try {
      const ImagePickerModule = require('expo-image-picker');
      const result = await ImagePickerModule.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled) {
        setProfileImage(result.assets[0].uri);
      }
    } catch {
      Alert.alert('Feature Unavailable', 'Image picking requires a native rebuild.');
    }
  };

  const setTempSignupData = useAuthStore((state) => state.setTempSignupData);

  const tempSignupDataContext = useAuthStore((state) => state.tempSignupData);
  const isYoutubeCreator = tempSignupDataContext?.categorySlug === 'yt_influencer';
  const youtubeChannels = tempSignupDataContext?.youtubeChannels || [];

  const handleUsernameChange = (text: string) => {
    const lowerText = text.toLowerCase();
    let sanitized = lowerText.replace(/[^a-z0-9_.]/g, '');
    sanitized = sanitized.replace(/\.\.+/g, '.');
    setUsername(sanitized);
  };

  const handleSignup = async () => {
    if (loading) return;
    if (!fullName || !username || !email || !password || !phone || !motherTongue) {
      handleImpact(Haptics.ImpactFeedbackStyle.Medium);
      Alert.alert('Incomplete Form', 'Please fill in all details.');
      return;
    }

    if (!isValidUsername(username)) {
      handleImpact(Haptics.ImpactFeedbackStyle.Medium);
      Alert.alert('Invalid Handle', 'Handles must be 3-30 characters.');
      return;
    }

    setLoading(true);

    try {
      const { api } = require('../src/api/client');
      await api.post('/auth/validate-signup', { 
        email: email.trim().toLowerCase(), 
        username: username.trim().toLowerCase() 
      });

      const onboardingData = useAuthStore.getState().tempSignupData || {};
      const categoryId = onboardingData.categoryId;
      const categorySlug = onboardingData.categorySlug;
      const roleSubCategoryIds = onboardingData.roleSubCategoryIds || [];
      const ytChannels = onboardingData.youtubeChannels || [];

      setTempSignupData({
        ...onboardingData,
        name: fullName.trim(),
        username: username.trim().toLowerCase(),
        email: email.trim().toLowerCase(),
        password: password,
        phone: phone.trim(),
        motherTongue: motherTongue,
        profileImage: profileImage
      });

      if (!categoryId) {
        router.push('/role-selection');
        return;
      }

      const formData = new FormData();
      formData.append('fullName', fullName.trim());
      formData.append('username', username.trim().toLowerCase());
      formData.append('email', email.trim().toLowerCase());
      formData.append('password', password);
      formData.append('phone', phone.trim());
      formData.append('motherTongue', motherTongue);
      formData.append('categoryId', categoryId);
      formData.append('roleSubCategoryIds', JSON.stringify(roleSubCategoryIds));

      if (profileImage) {
        const uriParts = profileImage.split('.');
        const fileType = uriParts[uriParts.length - 1];
        formData.append('profilePicture', {
          uri: profileImage,
          name: `profile.${fileType}`,
          type: `image/${fileType}`,
        } as any);
      }

      setShowSuccessOverlay(true);

      const registerRes = await api.post('/auth/register-full', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (registerRes.data?.success) {
        const { user, token, refreshToken } = registerRes.data;
        handleImpact(Haptics.ImpactFeedbackStyle.Heavy);
        setTimeout(async () => {
          await setAuth(user, token, refreshToken);
          useAuthStore.getState().setIsAddingAccount(false);
          clearTempSignupData();
          router.replace('/(tabs)');
        }, 1500);
      } else {
        setShowSuccessOverlay(false);
      }
    } catch (error: any) {
      setShowSuccessOverlay(false);
      handleImpact(Haptics.ImpactFeedbackStyle.Medium);
      Alert.alert('Signup Error', error.response?.data?.message || 'Error occurred.');
    } finally {
      if (!showSuccessOverlay) setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {!isGoogleLoading && !showSuccessOverlay && <AnimatedBackground />}
      <SafeAreaView style={{ flex: 1 }}>
        <ProcessingOverlay isVisible={showSuccessOverlay} message="Creating profile..." />
        <LottieOverlay isVisible={isGoogleLoading || isTransitioning} message="Connecting Google..." />
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboardView}>
            <ScrollView contentContainerStyle={styles.scrollContent} scrollEnabled={SCREEN_HEIGHT < 850} showsVerticalScrollIndicator={false}>
              <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => { handleImpact(); router.back(); }}>
                  <Ionicons name="arrow-back" size={24} color={theme.text} />
                </TouchableOpacity>
                <Image source={require('../assets/whitebglogo.png')} style={[styles.logo, { tintColor: isDark ? undefined : theme.text }]} resizeMode="contain" />
                <TouchableOpacity onPress={pickImage} style={[styles.avatarWrapper, { borderColor: theme.border }]}>
                  <Image source={{ uri: profileImage || DEFAULT_AVATAR }} style={styles.avatar} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: theme.text }]}>Join SuviX</Text>
              </View>

              <View style={styles.content}>
                <View style={styles.inputGroup}>
                  <SuvixInput small label="Full Name" placeholder="Your Name" value={fullName} onChangeText={setFullName} icon={<Feather name="user" size={16} />} />
                  <SuvixInput small label="Username" placeholder="unique_handle" value={username} onChangeText={handleUsernameChange} icon={<Feather name="at-sign" size={16} />} />
                  <SuvixInput small label="Email" placeholder="email@example.com" value={email} onChangeText={setEmail} icon={<Feather name="mail" size={16} />} />
                  <SuvixInput small label="Phone" placeholder="+91..." value={phone} onChangeText={setPhone} icon={<Feather name="phone" size={16} />} />
                  <SuvixInput small label="Password" placeholder="••••••••" value={password} onChangeText={setPassword} secureTextEntry={!showPassword} icon={<Feather name="lock" size={16} />} 
                    rightIcon={<TouchableOpacity onPress={() => setShowPassword(!showPassword)}><Feather name={showPassword ? "eye-off" : "eye"} color={theme.textSecondary} size={16} /></TouchableOpacity>} 
                  />
                </View>

                <SuvixButton title={loading ? 'Please wait...' : 'Create Account'} onPress={handleSignup} loading={loading} variant="primary" />

                <View style={styles.footer}>
                  <Text style={[styles.footerText, { color: theme.textSecondary }]}>Already have an account? </Text>
                  <TouchableOpacity onPress={() => router.replace('/login')}>
                    <Text style={[styles.footerLink, { color: theme.text }]}>Login Here</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.dividerContainer}>
                  <View style={[styles.line, { backgroundColor: theme.border }]} /><Text style={[styles.dividerText, { color: theme.textSecondary }]}>OR</Text><View style={[styles.line, { backgroundColor: theme.border }]} />
                </View>

                <TouchableOpacity 
                  style={[styles.googleButton, { borderColor: theme.border, backgroundColor: theme.secondary }, (isGoogleLoading || loading) && styles.btnDisabled]} 
                  onPress={() => { handleImpact(); googleSignIn(); }}
                  disabled={isGoogleLoading || loading}
                >
                  <Image source={require('../assets/google-icon.png')} style={styles.googleIconAsset} resizeMode="contain" />
                  <Text style={[styles.googleButtonText, { color: theme.text }]}>Continue with Google</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 32, justifyContent: 'center', paddingVertical: 10 },
  header: { alignItems: 'center', marginBottom: 12, position: 'relative' },
  backButton: { position: 'absolute', left: -10, top: 0, zIndex: 100, padding: 10 },
  logo: { width: 80, height: 32, marginBottom: 4 },
  avatarWrapper: { width: 60, height: 60, borderRadius: 30, borderWidth: 1.5, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  avatar: { width: 54, height: 54, borderRadius: 27 },
  title: { fontSize: 22, fontWeight: '900' },
  content: { width: '100%' },
  inputGroup: { marginBottom: 8 },
  btnDisabled: { opacity: 0.5 },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 12 },
  line: { flex: 1, height: 1.2 },
  dividerText: { paddingHorizontal: 12, fontSize: 10, fontWeight: '700' },
  googleButton: { flexDirection: 'row', height: 48, borderRadius: 100, borderWidth: 1.2, justifyContent: 'center', alignItems: 'center' },
  googleIconAsset: { width: 24, height: 24 },
  googleButtonText: { fontSize: 14, fontWeight: '600', marginLeft: 12 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24, marginBottom: 20 },
  footerText: { fontSize: 13, fontWeight: '500' },
  footerLink: { fontSize: 13, fontWeight: '800' },
});
