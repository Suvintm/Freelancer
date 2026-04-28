import React, { useState, useRef, useEffect } from 'react';
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
  Animated,
} from 'react-native';
import { 
  isValidEmail, 
  isValidUsername 
} from '../src/utils/validation';
import { useRouter } from 'expo-router';
import { Feather, Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
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
  const [loading, setLoading] = useState(false);
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // ── Animation ─────────────────────────────────────────────────────────────
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 15,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const router = useRouter();
  const { signIn: googleSignIn, isLoading: isGoogleLoading } = useGoogleAuth();
  const { user, isAuthenticated, setAuth, isAddingAccount } = useAuthStore();
  const clearTempSignupData = useAuthStore((state) => state.clearTempSignupData);

  useEffect(() => {
    if (isAuthenticated && user && !isAddingAccount) {
      setIsTransitioning(true);
      setTimeout(() => {
        router.replace('/(tabs)');
      }, 600);
    }
  }, [isAuthenticated, user?.id, isAddingAccount]);

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

  const handleUsernameChange = (text: string) => {
    const lowerText = text.toLowerCase();
    let sanitized = lowerText.replace(/[^a-z0-9_.]/g, '');
    sanitized = sanitized.replace(/\.\.+/g, '.');
    setUsername(sanitized);
  };

  const handleSignup = async () => {
    if (loading) return;
    if (!fullName || !username || !email || !password || !phone) {
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
      
      // 🛰️ GET PUSH TOKEN (Elite Quality)
      let pushToken = null;
      try {
        const Notifications = require('expo-notifications');
        const tokenData = await Notifications.getDevicePushTokenAsync();
        pushToken = tokenData.data;
      } catch (err) {
        console.warn('⚠️ [PUSH] Could not capture token during signup:', err);
      }

      await api.post('/auth/validate-signup', { 
        email: email.trim().toLowerCase(), 
        username: username.trim().toLowerCase() 
      });

      const onboardingData = useAuthStore.getState().tempSignupData || {};
      const categoryId = onboardingData.categoryId;
      const roleSubCategoryIds = onboardingData.roleSubCategoryIds || [];

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
      
      // 🛰️ ADD PUSH & PLATFORM
      if (pushToken) formData.append('pushToken', pushToken);
      formData.append('platform', Platform.OS.toUpperCase());

      if (onboardingData.youtubeChannels) {
        formData.append('youtubeChannels', JSON.stringify(onboardingData.youtubeChannels));
      }

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
        const { user: newUser, token, refreshToken } = registerRes.data;
        handleImpact(Haptics.ImpactFeedbackStyle.Heavy);
        setTimeout(async () => {
          await setAuth(newUser, token, refreshToken);
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
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
        <ProcessingOverlay isVisible={showSuccessOverlay} message="Designing your identity..." />
        <LottieOverlay isVisible={isGoogleLoading || isTransitioning} message="Secure Connection..." />

        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
            style={styles.keyboardView}
          >
            <ScrollView 
              contentContainerStyle={styles.scrollContent} 
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <Animated.View 
                style={[
                  styles.authCardWrapper, 
                  { 
                    opacity: fadeAnim, 
                    transform: [{ translateY: slideAnim }] 
                  }
                ]}
              >
                <BlurView 
                  intensity={isDark ? 30 : 60} 
                  tint={isDark ? 'dark' : 'light'} 
                  style={[
                    styles.authCard, 
                    { 
                      borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.03)',
                      backgroundColor: isDark ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.4)'
                    }
                  ]}
                >
                  <View style={styles.header}>
                    <TouchableOpacity 
                      style={[styles.backButton, { backgroundColor: theme.secondary }]} 
                      onPress={() => { handleImpact(); router.back(); }}
                    >
                      <Ionicons name="arrow-back" size={18} color={theme.text} />
                    </TouchableOpacity>
                    
                    <Image 
                      source={require('../assets/whitebglogo.png')} 
                      style={[styles.logo, { tintColor: isDark ? undefined : theme.text }]} 
                      resizeMode="contain" 
                    />
                    
                    <TouchableOpacity 
                      onPress={pickImage} 
                      style={[styles.avatarContainer, { borderColor: theme.border }]}
                    >
                      <Image source={{ uri: profileImage || DEFAULT_AVATAR }} style={styles.avatar} />
                      <View style={[styles.editBadge, { backgroundColor: theme.primary }]}>
                        <Feather name="camera" size={10} color={theme.text} />
                      </View>
                    </TouchableOpacity>
                    
                    <Text style={[styles.title, { color: theme.text }]}>Join SuviX</Text>
                    <Text style={[styles.subtitle, { color: theme.textSecondary }]}>The premium creator ecosystem</Text>
                  </View>

                  <View style={styles.form}>
                    <View style={styles.inputGrid}>
                      <SuvixInput 
                        small 
                        label="Full Name" 
                        placeholder="John Doe" 
                        value={fullName} 
                        onChangeText={setFullName} 
                        icon={<Feather name="user" size={13} color={theme.textSecondary} />} 
                      />
                      <SuvixInput 
                        small 
                        label="Handle" 
                        placeholder="unique_handle" 
                        value={username} 
                        onChangeText={handleUsernameChange} 
                        icon={<Feather name="at-sign" size={13} color={theme.textSecondary} />} 
                      />
                      <SuvixInput 
                        small 
                        label="Email" 
                        placeholder="name@example.com" 
                        value={email} 
                        onChangeText={setEmail} 
                        icon={<Feather name="mail" size={13} color={theme.textSecondary} />} 
                      />
                      <SuvixInput 
                        small 
                        label="Phone" 
                        placeholder="+1 234..." 
                        value={phone} 
                        onChangeText={setPhone} 
                        icon={<Feather name="phone" size={13} color={theme.textSecondary} />} 
                      />
                      <SuvixInput 
                        small 
                        label="Password" 
                        placeholder="••••••••" 
                        value={password} 
                        onChangeText={setPassword} 
                        secureTextEntry={!showPassword} 
                        icon={<Feather name="lock" size={13} color={theme.textSecondary} />} 
                        rightIcon={
                          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                            <Feather name={showPassword ? "eye-off" : "eye"} color={theme.textSecondary} size={13} />
                          </TouchableOpacity>
                        } 
                      />
                    </View>
                    
                    {/* 🎥 YOUTUBE IDENTITY PREVIEW (New) */}
                    {useAuthStore.getState().tempSignupData?.youtubeChannels && (
                      <View style={styles.ytIdentitySection}>
                        <Text style={[styles.ytIdentityLabel, { color: theme.textSecondary }]}>LINKED IDENTITY</Text>
                        {useAuthStore.getState().tempSignupData?.youtubeChannels?.map((ch) => (
                          <View key={ch.channelId} style={[styles.ytIdentityCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)', borderColor: theme.border }]}>
                            <Image source={{ uri: ch.thumbnailUrl || '' }} style={styles.ytIdentityAvatar} />
                            <View style={styles.ytIdentityMeta}>
                              <Text style={[styles.ytIdentityName, { color: theme.text }]} numberOfLines={1}>{ch.channelName}</Text>
                              <View style={styles.ytIdentityStats}>
                                <Ionicons name="logo-youtube" size={10} color="#FF0000" />
                                <Text style={[styles.ytIdentityStatsText, { color: theme.textSecondary }]}>
                                  {(ch.subscriberCount || 0).toLocaleString()} • {ch.subCategorySlug}
                                </Text>
                              </View>
                            </View>
                            <Ionicons name="checkmark-circle" size={18} color="#00C853" />
                          </View>
                        ))}
                      </View>
                    )}

                    <SuvixButton 
                      title={loading ? 'Building...' : 'Create Account'} 
                      onPress={handleSignup} 
                      loading={loading} 
                      variant="primary" 
                      style={styles.signupBtn}
                    />

                    <View style={styles.dividerContainer}>
                      <View style={[styles.line, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }]} />
                      <Text style={[styles.dividerText, { color: theme.textSecondary }]}>OR</Text>
                      <View style={[styles.line, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }]} />
                    </View>

                    <TouchableOpacity 
                      style={[
                        styles.googleButton, 
                        { backgroundColor: isDark ? '#FFFFFF' : '#F2F2F2', borderColor: theme.border }
                      ]} 
                      onPress={() => { handleImpact(); googleSignIn(); }}
                      disabled={isGoogleLoading || loading}
                    >
                      <Image source={require('../assets/google-icon.png')} style={styles.googleIconAsset} resizeMode="contain" />
                      <Text style={[styles.googleButtonText, { color: '#000' }]}>Continue with Google</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.footer}>
                    <Text style={[styles.footerText, { color: theme.textSecondary }]}>Member already? </Text>
                    <TouchableOpacity onPress={() => router.replace('/login')}>
                      <Text style={[styles.footerLink, { color: theme.text }]}>Sign In</Text>
                    </TouchableOpacity>
                  </View>
                </BlurView>
              </Animated.View>
            </ScrollView>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  keyboardView: { flex: 1 },
  scrollContent: { 
    flexGrow: 1, 
    paddingHorizontal: 20, 
    justifyContent: 'center', 
    paddingTop: 30,
    paddingBottom: 20 
  },
  authCardWrapper: {
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  authCard: {
    borderRadius: 28,
    padding: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: { alignItems: 'center', marginBottom: 12, position: 'relative' },
  backButton: { 
    position: 'absolute', 
    left: -4, 
    top: -4, 
    width: 32, 
    height: 32, 
    borderRadius: 16, 
    justifyContent: 'center', 
    alignItems: 'center',
    zIndex: 10,
  },
  logo: { width: 70, height: 28, marginBottom: 8 },
  avatarContainer: { 
    width: 60, 
    height: 60, 
    borderRadius: 30, 
    borderWidth: 1.5, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 6,
    position: 'relative',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  avatar: { width: 54, height: 54, borderRadius: 27 },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(150,150,150,0.2)',
  },
  title: { fontSize: 20, fontWeight: '900', letterSpacing: -0.5 },
  subtitle: { fontSize: 11, fontWeight: '600', marginTop: 2, opacity: 0.6 },
  form: { width: '100%' },
  inputGrid: { gap: 6, marginBottom: 16 },
  signupBtn: { height: 50, borderRadius: 14 },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 12 },
  line: { flex: 1, height: 1 },
  dividerText: { paddingHorizontal: 12, fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  googleButton: { 
    flexDirection: 'row', 
    height: 48, 
    borderRadius: 14, 
    borderWidth: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
  },
  googleIconAsset: { width: 18, height: 18 },
  googleButtonText: { fontSize: 13, fontWeight: '800', marginLeft: 8 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 16 },
  footerText: { fontSize: 13, fontWeight: '600' },
  footerLink: { fontSize: 13, fontWeight: '900' },
  // 🎥 NEW YOUTUBE IDENTITY STYLES
  ytIdentitySection: {
    marginBottom: 20,
    marginTop: 4,
  },
  ytIdentityLabel: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  ytIdentityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  ytIdentityAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  ytIdentityMeta: {
    flex: 1,
  },
  ytIdentityName: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 2,
  },
  ytIdentityStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ytIdentityStatsText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
