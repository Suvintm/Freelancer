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
  Switch,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather, Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Colors } from '../src/constants/Colors';
import SuvixInput from '../src/components/SuvixInput';
import SuvixButton from '../src/components/SuvixButton';
import { useAuthStore } from '../src/store/useAuthStore';
import { useGoogleAuth } from '../src/hooks/useGoogleAuth';
import { isValidEmail } from '../src/utils/validation';
import { api } from '../src/api/client';
import * as Haptics from 'expo-haptics';
import { ProcessingOverlay } from '../src/components/shared/ProcessingOverlay';
import { LottieOverlay } from '../src/components/shared/LottieOverlay';
import { AnimatedBackground } from '../src/components/auth/AnimatedBackground';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

export default function LoginScreen() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const isDark = colorScheme === 'dark';

  const params = useLocalSearchParams<{ mode?: string; email?: string }>();
  const isAddingAccount = useAuthStore(state => state.isAddingAccount);
  const isAddMode  = params.mode === 'add' || isAddingAccount;
  const isReauthMode = params.mode === 'reauth';
  const prefillEmail = params.email ?? '';

  const [email, setEmail]             = useState(prefillEmail);
  const [password, setPassword]       = useState('');
  const [showPassword, setShowPassword]         = useState(false);
  const [loading, setLoading]         = useState(false);
  const [showLoadingOverlay, setShowLoadingOverlay] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [allowNotifications, setAllowNotifications] = useState(true);

  // ── Animation ─────────────────────────────────────────────────────────────
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 20,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const router = useRouter();
  const { signIn: googleSignIn, isLoading: isGoogleLoading } = useGoogleAuth();
  const { user, isAuthenticated, setAuth } = useAuthStore();

  const initialUserIdRef = useRef<string | undefined>(user?.id);

  useEffect(() => {
    const isNewAccountAdded =
      isAuthenticated &&
      user &&
      user.id !== initialUserIdRef.current;

    if (isNewAccountAdded) {
      setIsTransitioning(true);
      useAuthStore.getState().setIsAddingAccount(false);
      setTimeout(() => {
        router.replace('/(tabs)');
      }, 600);
    }
  }, [user?.id, isAuthenticated]);

  const handleImpact = (style = Haptics.ImpactFeedbackStyle.Light) => {
    Haptics.impactAsync(style);
  };

  const handleLogin = async () => {
    if (loading) return;
    if (!email || !password) {
      handleImpact(Haptics.ImpactFeedbackStyle.Medium);
      Alert.alert('Missing Info', 'Email and password are required.');
      return;
    }
    if (!isValidEmail(email)) {
      handleImpact(Haptics.ImpactFeedbackStyle.Medium);
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    setLoading(true);
    setShowLoadingOverlay(true);

    try {
      const response = await api.post('/auth/login', {
        email: email.trim().toLowerCase(),
        password,
      });

      if (response.data.success) {
        handleImpact(Haptics.ImpactFeedbackStyle.Heavy);
        const { user: newUser, token, refreshToken, accessTokenExpiresAt } = response.data;
        await setAuth(newUser, token, refreshToken, { accessTokenExpiresAt });

        setShowLoadingOverlay(false);
        setLoading(false);
        useAuthStore.getState().setIsAddingAccount(false);
        
        // 🛰️ REGISTER PUSH TOKEN (Elite Quality)
        if (allowNotifications) {
          try {
            const Notifications = require('expo-notifications');
            const tokenData = await Notifications.getDevicePushTokenAsync();
            const pushToken = tokenData.data;
            if (pushToken) {
              await api.post('/notifications/tokens', { 
                token: pushToken, 
                platform: Platform.OS.toUpperCase() 
              });
              console.log('✅ [PUSH] Token registered successfully after login');
            }
          } catch (err) {
            console.warn('⚠️ [PUSH] Could not register token after login:', err);
          }
        }

        router.replace('/(tabs)');
      } else {
        setShowLoadingOverlay(false);
        setLoading(false);
      }
    } catch (error: any) {
      setShowLoadingOverlay(false);
      setLoading(false);
      handleImpact(Haptics.ImpactFeedbackStyle.Medium);
      Alert.alert('Login Failed', error.response?.data?.message || 'Check your credentials.');
    }
  };

  const titleText = isAddMode ? 'Add Account' : isReauthMode ? 'Log back in' : 'Welcome to SuviX';

  return (
    <View style={styles.container}>
      {!isGoogleLoading && !showLoadingOverlay && <AnimatedBackground />}
      
      <SafeAreaView style={{ flex: 1 }}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <ProcessingOverlay isVisible={showLoadingOverlay} message="Authenticating..." />
        <LottieOverlay isVisible={isGoogleLoading || isTransitioning} message="Secure Connection..." />

        {(isAddMode || isReauthMode) && (
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: theme.secondary }]}
            onPress={() => {
              handleImpact();
              router.canGoBack() ? router.back() : router.replace('/(tabs)');
            }}
          >
            <Ionicons name="arrow-back" size={20} color={theme.text} />
          </TouchableOpacity>
        )}

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
                  intensity={isDark ? 40 : 80} 
                  tint={isDark ? 'dark' : 'light'} 
                  style={[
                    styles.authCard, 
                    { 
                      borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                      backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.5)'
                    }
                  ]}
                >
                  <View style={styles.header}>
                    <Image
                      source={require('../assets/whitebglogo.png')}
                      style={[styles.logo, { tintColor: isDark ? undefined : theme.text }]}
                      resizeMode="contain"
                    />
                    <Text style={[styles.title, { color: theme.text }]}>{titleText}</Text>
                    <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                      The premium creator ecosystem
                    </Text>
                  </View>

                  <View style={styles.form}>
                    <SuvixInput
                      label="Email"
                      placeholder="name@example.com"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      icon={<Feather name="mail" size={16} color={theme.textSecondary} />}
                    />
                    
                    <View style={{ height: 12 }} />

                    <SuvixInput
                      label="Password"
                      placeholder="••••••••"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                      icon={<Feather name="lock" size={16} color={theme.textSecondary} />}
                      rightIcon={
                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                          <Feather name={showPassword ? 'eye-off' : 'eye'} size={16} color={theme.textSecondary} />
                        </TouchableOpacity>
                      }
                    />

                    <TouchableOpacity
                      style={styles.forgotPassword}
                      onPress={() => { handleImpact(); router.push('/forgot-password'); }}
                    >
                      <Text style={[styles.forgotText, { color: theme.textSecondary }]}>Forgot Password?</Text>
                    </TouchableOpacity>

                    <View style={[styles.notificationToggle, { borderTopColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }]}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.toggleLabel, { color: theme.text }]}>Enable Notifications</Text>
                        <Text style={[styles.toggleSublabel, { color: theme.textSecondary }]}>Get real-time updates on your growth</Text>
                      </View>
                      <Switch
                        value={allowNotifications}
                        onValueChange={(val) => { handleImpact(); setAllowNotifications(val); }}
                        trackColor={{ false: '#767577', true: theme.primary }}
                        thumbColor={allowNotifications ? '#fff' : '#f4f3f4'}
                        ios_backgroundColor="#3e3e3e"
                      />
                    </View>

                    <SuvixButton
                      title={loading ? 'Checking...' : 'Sign In'}
                      onPress={handleLogin}
                      loading={loading}
                      variant="primary"
                      style={styles.signInBtn}
                    />

                    <View style={styles.dividerContainer}>
                      <View style={[styles.line, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]} />
                      <Text style={[styles.dividerText, { color: theme.textSecondary }]}>OR CONTINUE WITH</Text>
                      <View style={[styles.line, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]} />
                    </View>

                    <TouchableOpacity
                      style={[
                        styles.googleButton,
                        { 
                          backgroundColor: isDark ? '#FFFFFF' : '#F2F2F2',
                          borderColor: theme.border 
                        }
                      ]}
                      onPress={() => { handleImpact(); googleSignIn(); }}
                      disabled={isGoogleLoading || loading}
                    >
                      <Image
                        source={require('../assets/google-icon.png')}
                        style={styles.googleIconAsset}
                        resizeMode="contain"
                      />
                      <Text style={[styles.googleButtonText, { color: '#000000' }]}>
                        Google
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.footer}>
                    <Text style={[styles.footerText, { color: theme.textSecondary }]}>
                      Don't have an account?{' '}
                    </Text>
                    <TouchableOpacity
                      onPress={() => { handleImpact(); router.replace('/role-selection'); }}
                    >
                      <Text style={[styles.footerLink, { color: theme.text }]}>Join SuviX</Text>
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
  backButton: { 
    position: 'absolute', 
    top: 60, 
    left: 24, 
    zIndex: 100, 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    alignItems: 'center', 
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  keyboardView: { flex: 1 },
  scrollContent: { 
    flexGrow: 1, 
    paddingHorizontal: 24, 
    justifyContent: 'center', 
    paddingTop: 40,
    paddingBottom: 40 
  },
  authCardWrapper: {
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.2,
    shadowRadius: 30,
    elevation: 10,
  },
  authCard: {
    borderRadius: 32,
    padding: 32,
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: { alignItems: 'center', marginBottom: 32 },
  logo: { width: 110, height: 44, marginBottom: 16 },
  title: { fontSize: 28, fontWeight: '900', letterSpacing: -1 },
  subtitle: { fontSize: 13, fontWeight: '600', marginTop: 4, opacity: 0.6 },
  form: { width: '100%' },
  forgotPassword: { alignSelf: 'flex-end', marginTop: 12, marginBottom: 24 },
  forgotText: { fontSize: 13, fontWeight: '700' },
  signInBtn: { height: 56, borderRadius: 16 },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 24 },
  line: { flex: 1, height: 1 },
  dividerText: { paddingHorizontal: 12, fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  googleButton: {
    flexDirection: 'row', 
    height: 56, 
    borderRadius: 16,
    justifyContent: 'center', 
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  googleIconAsset: { width: 22, height: 22 },
  googleButtonText: { fontSize: 15, fontWeight: '800', marginLeft: 10 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 32 },
  footerText: { fontSize: 14, fontWeight: '600' },
  footerLink: { fontSize: 14, fontWeight: '900' },
  notificationToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4,
    marginBottom: 12,
    borderTopWidth: 1,
  },
  toggleLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
  toggleSublabel: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 2,
  },
});