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
  Dimensions
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../src/constants/Colors';
import SuvixInput from '../src/components/SuvixInput';
import { useAuthStore } from '../src/store/useAuthStore';
import { useGoogleAuth } from '../src/hooks/useGoogleAuth';
import { api } from '../src/api/client';
import * as Haptics from 'expo-haptics';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { signIn: googleSignIn, isLoading: isGoogleLoading } = useGoogleAuth();
  const setAuth = useAuthStore((state) => state.setAuth);

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
    setLoading(true);
    try {
      const response = await api.post('/auth/login', {
        email: email.trim().toLowerCase(),
        password,
      });

      if (response.data.success) {
        handleImpact(Haptics.ImpactFeedbackStyle.Heavy);
        const { user, token } = response.data;
        await setAuth(user, token);
        router.replace('/');
      }
    } catch (error: any) {
      handleImpact(Haptics.ImpactFeedbackStyle.Medium);
      Alert.alert('Login Failed', error.response?.data?.message || 'Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboardView}>
          <ScrollView contentContainerStyle={styles.scrollContent} scrollEnabled={SCREEN_HEIGHT < 700} showsVerticalScrollIndicator={false}>
            
            <View style={styles.header}>
              <Image source={require('../assets/whitebglogo.png')} style={styles.logo} resizeMode="contain" />
              <Text style={styles.title}>Welcome Back</Text>
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
                  icon={<Feather name="mail" color={Colors.dark.textSecondary} size={16} />}
                />
                <SuvixInput
                  small
                  label="Password"
                  placeholder="••••••••"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  icon={<Feather name="lock" color={Colors.dark.textSecondary} size={16} />}
                  rightIcon={
                    <TouchableOpacity onPress={() => { handleImpact(); setShowPassword(!showPassword); }}>
                      <Feather name={showPassword ? "eye-off" : "eye"} color={Colors.dark.textSecondary} size={16} />
                    </TouchableOpacity>
                  }
                />
              </View>

              <TouchableOpacity 
                style={styles.forgotPassword}
                onPress={() => { handleImpact(); router.push('/forgot-password'); }}
              >
                <Text style={styles.forgotText}>Forgot Password?</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                activeOpacity={0.8}
                onPress={() => { if(!loading) { handleImpact(); handleLogin(); } }}
                disabled={loading}
                style={[styles.primaryBtn, loading && styles.btnDisabled]}
              >
                <Text style={styles.primaryBtnText}>{loading ? 'Signing in...' : 'Sign In'}</Text>
              </TouchableOpacity>

              <View style={styles.dividerContainer}>
                <View style={styles.line} /><Text style={styles.dividerText}>OR</Text><View style={styles.line} />
              </View>

              <TouchableOpacity 
                style={[styles.googleButton, (isGoogleLoading || loading) && styles.btnDisabled]} 
                onPress={() => { handleImpact(); googleSignIn(); }}
                disabled={isGoogleLoading || loading}
              >
                {/* LARGER CUSTOM GOOGLE ICON (24x24) */}
                <Image source={require('../assets/google-icon.png')} style={styles.googleIconAsset} resizeMode="contain" />
                <Text style={styles.googleButtonText}>Continue with Google</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>New to SuviX? </Text>
              <TouchableOpacity onPress={() => { handleImpact(); router.replace('/signup'); }}>
                <Text style={styles.footerLink}>Join Now</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  keyboardView: { flex: 1 },
  scrollContent: { 
    flexGrow: 1, 
    paddingHorizontal: 32, 
    justifyContent: 'center',
    paddingVertical: 10
  },
  header: { alignItems: 'center', marginBottom: 24 },
  logo: { width: 100, height: 40, marginBottom: 8 },
  title: { color: '#FFF', fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
  form: { width: '100%' },
  inputGroup: { marginBottom: 4 },
  forgotPassword: { 
    alignSelf: 'flex-end', 
    marginBottom: 24,
    paddingVertical: 4
  },
  forgotText: { 
    color: '#FFF', 
    fontSize: 13, 
    fontWeight: '700',
    opacity: 0.8
  },
  primaryBtn: {
    backgroundColor: '#FFF',
    height: 52,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.5 },
  primaryBtnText: { color: '#000', fontSize: 16, fontWeight: '800' },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  line: { flex: 1, height: 1.2, backgroundColor: Colors.dark.border },
  dividerText: { color: Colors.dark.textSecondary, paddingHorizontal: 16, fontSize: 10, fontWeight: '700' },
  googleButton: { 
    flexDirection: 'row', 
    height: 52, 
    borderRadius: 100, 
    borderWidth: 1.2, 
    borderColor: Colors.dark.border, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#000' 
  },
  googleIconAsset: { width: 24, height: 24 },
  googleButtonText: { color: Colors.white, fontSize: 15, fontWeight: '600', marginLeft: 12 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 32 },
  footerText: { color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: '500' },
  footerLink: { color: '#FFF', fontSize: 14, fontWeight: '800' },
});
