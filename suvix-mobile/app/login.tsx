import React, { useState, useRef } from 'react';
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
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather, Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../src/constants/Colors';
import SuvixInput from '../src/components/SuvixInput';
import SuvixButton from '../src/components/SuvixButton';
import { useAuthStore } from '../src/store/useAuthStore';
import { useGoogleAuth } from '../src/hooks/useGoogleAuth';
import { isValidEmail } from '../src/utils/validation';
import { api } from '../src/api/client';
import * as Haptics from 'expo-haptics';
import { ProcessingOverlay } from '../src/components/shared/ProcessingOverlay';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

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

  const router = useRouter();
  const { signIn: googleSignIn, isLoading: isGoogleLoading } = useGoogleAuth();
  const { user, isAuthenticated, setAuth } = useAuthStore();

  // ─────────────────────────────────────────────────────────────────────────────
  // ✅ THE FIX: Track the user ID that was active when this screen MOUNTED.
  //
  // THE BUG that was here:
  //   if (isAuthenticated && user && isAddingAccount) → redirect immediately
  //
  // This fired on mount because all 3 were already true (existing user is
  // authenticated, isAddingAccount was just set to true). It would immediately
  // call setIsAddingAccount(false) and redirect back home before the user could
  // type anything.
  //
  // THE FIX:
  //   Store the user ID at mount time. Only redirect when a DIFFERENT user
  //   successfully logs in (user.id changes from the initial value).
  //   This means we stay on the login page until new credentials are entered.
  // ─────────────────────────────────────────────────────────────────────────────
  const initialUserIdRef = useRef<string | undefined>(user?.id);

  React.useEffect(() => {
    // Only act if a DIFFERENT user has successfully authenticated.
    // "Different" means the user.id changed from the one we captured at mount time.
    const isNewAccountAdded =
      isAuthenticated &&
      user &&
      user.id !== initialUserIdRef.current;

    if (isNewAccountAdded) {
      console.log(
        `✨ [AUTH] New account authenticated (@${user?.username}). Cleaning up and redirecting...`,
      );
      useAuthStore.getState().setIsAddingAccount(false);
      setTimeout(() => router.replace('/(tabs)'), 400);
    }
  }, [user?.id, isAuthenticated, router]);

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
      Alert.alert('Invalid Email', 'Please enter a valid email address (e.g., name@example.com).');
      return;
    }

    setLoading(true);
    setShowLoadingOverlay(true);

    try {
      const response = await api.post('/auth/login', {
        email:    email.trim().toLowerCase(),
        password,
      });

      if (response.data.success) {
        handleImpact(Haptics.ImpactFeedbackStyle.Heavy);
        const { user: newUser, token, refreshToken, accessTokenExpiresAt } = response.data;

        // setAuth will update user.id in the store, which the useEffect above will
        // detect as a "new account" and trigger the redirect automatically.
        await setAuth(newUser, token, refreshToken, { accessTokenExpiresAt });

        // In reauth mode specifically (token expired, re-entering password),
        // we navigate back to wherever the user came from.
        if (isReauthMode) {
          setShowLoadingOverlay(false);
          setLoading(false);
          console.log('✅ [AUTH] Re-auth successful.');
          if (router.canGoBack()) {
            router.back();
          } else {
            router.replace('/(tabs)');
          }
          return;
        }

        // For normal login (no add-account mode), the _layout.tsx guard handles
        // navigation automatically once user is set in the store.
       setShowLoadingOverlay(false);
setLoading(false);
// ✅ FIX: Navigate explicitly — don't rely on useEffect because
// key={user?.id} in _layout.tsx remounts the Stack before the effect fires.
useAuthStore.getState().setIsAddingAccount(false);
router.replace('/(tabs)');
      } else {
        setShowLoadingOverlay(false);
        setLoading(false);
      }
    } catch (error: any) {
      setShowLoadingOverlay(false);
      setLoading(false);
      handleImpact(Haptics.ImpactFeedbackStyle.Medium);

      if (error.response?.status === 403 && error.response?.data?.isBanned) {
        return; // Ban redirect is handled by Axios interceptor
      }

      Alert.alert(
        'Login Failed',
        error.response?.data?.message || 'Please check your credentials and try again.',
      );
    }
  };

  const overlayMessage = isAddMode
    ? 'Adding account...'
    : isReauthMode
    ? 'Verifying account...'
    : 'Logging you in...';

  const titleText = isAddMode
    ? 'Add Account'
    : isReauthMode
    ? 'Log back in'
    : 'Welcome Back';

  const subtitleText = isAddMode
    ? 'Sign in with a different account'
    : isReauthMode
    ? `Re-enter your password for @${prefillEmail}`
    : '';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.primary }]}>
      <ProcessingOverlay isVisible={showLoadingOverlay} message={overlayMessage} />
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {(isAddMode || isReauthMode) && (
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            handleImpact();
            useAuthStore.getState().setIsAddingAccount(false);
            router.canGoBack() ? router.back() : router.replace('/(tabs)');
          }}
        >
          <Ionicons name="arrow-back" size={22} color={theme.text} />
        </TouchableOpacity>
      )}

      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            scrollEnabled={SCREEN_HEIGHT < 700}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.header}>
              <Image
                source={require('../assets/whitebglogo.png')}
                style={[styles.logo, { tintColor: isDark ? undefined : theme.text }]}
                resizeMode="contain"
              />
              <Text style={[styles.title, { color: theme.text }]}>{titleText}</Text>
              {subtitleText ? (
                <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                  {subtitleText}
                </Text>
              ) : null}
            </View>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <SuvixInput
                  small
                  label="Email Address"
                  placeholder="name@example.com"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCorrect={false}
                  spellCheck={false}
                  textContentType="none"
                  autoCapitalize="none"
                  icon={<Feather name="mail" size={16} />}
                />
                <SuvixInput
                  small
                  label="Password"
                  placeholder="••••••••"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  icon={<Feather name="lock" size={16} />}
                  rightIcon={
                    <TouchableOpacity
                      onPress={() => { handleImpact(); setShowPassword(v => !v); }}
                    >
                      <Feather
                        name={showPassword ? 'eye-off' : 'eye'}
                        color={theme.textSecondary}
                        size={16}
                      />
                    </TouchableOpacity>
                  }
                />
              </View>

              <TouchableOpacity
                style={styles.forgotPassword}
                onPress={() => { handleImpact(); router.push('/forgot-password'); }}
              >
                <Text style={[styles.forgotText, { color: theme.text }]}>Forgot Password?</Text>
              </TouchableOpacity>

              <SuvixButton
                title={loading ? 'Signing in...' : 'Sign In'}
                onPress={handleLogin}
                loading={loading}
                variant="primary"
              />

              <View style={styles.dividerContainer}>
                <View style={[styles.line, { backgroundColor: theme.border }]} />
                <Text style={[styles.dividerText, { color: theme.textSecondary }]}>OR</Text>
                <View style={[styles.line, { backgroundColor: theme.border }]} />
              </View>

              <TouchableOpacity
                style={[
                  styles.googleButton,
                  { borderColor: theme.border, backgroundColor: theme.secondary },
                  (isGoogleLoading || loading) && styles.btnDisabled,
                ]}
                onPress={() => { handleImpact(); googleSignIn(); }}
                disabled={isGoogleLoading || loading}
              >
                <Image
                  source={require('../assets/google-icon.png')}
                  style={styles.googleIconAsset}
                  resizeMode="contain"
                />
                <Text style={[styles.googleButtonText, { color: theme.text }]}>
                  Continue with Google
                </Text>
              </TouchableOpacity>
            </View>

            {/* Only show sign-up link in normal login mode */}
            {!isAddMode && !isReauthMode && (
              <View style={styles.footer}>
                <Text style={[styles.footerText, { color: theme.textSecondary }]}>
                  New to SuviX?{' '}
                </Text>
                <TouchableOpacity
                  onPress={() => { handleImpact(); router.replace('/role-selection'); }}
                >
                  <Text style={[styles.footerLink, { color: theme.text }]}>Join Now</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:     { flex: 1 },
  backButton:    { position: 'absolute', top: 52, left: 20, zIndex: 10, padding: 8 },
  keyboardView:  { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 32, justifyContent: 'center', paddingVertical: 10 },
  header:        { alignItems: 'center', marginBottom: 24 },
  logo:          { width: 100, height: 40, marginBottom: 8 },
  title:         { fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
  subtitle:      { fontSize: 13, fontWeight: '500', marginTop: 4, textAlign: 'center' },
  form:          { width: '100%' },
  inputGroup:    { marginBottom: 4 },
  forgotPassword: { alignSelf: 'flex-end', marginBottom: 24, paddingVertical: 4 },
  forgotText:    { fontSize: 13, fontWeight: '700', opacity: 0.8 },
  btnDisabled:   { opacity: 0.5 },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  line:          { flex: 1, height: 1.2 },
  dividerText:   { paddingHorizontal: 16, fontSize: 10, fontWeight: '700' },
  googleButton:  {
    flexDirection: 'row', height: 52, borderRadius: 100,
    borderWidth: 1.2, justifyContent: 'center', alignItems: 'center',
  },
  googleIconAsset:   { width: 24, height: 24 },
  googleButtonText:  { fontSize: 15, fontWeight: '600', marginLeft: 12 },
  footer:        { flexDirection: 'row', justifyContent: 'center', marginTop: 32 },
  footerText:    { fontSize: 14, fontWeight: '500' },
  footerLink:    { fontSize: 14, fontWeight: '800' },
});