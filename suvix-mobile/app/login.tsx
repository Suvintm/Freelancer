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
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather, AntDesign } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../src/constants/Colors';
import SuvixInput from '../src/components/SuvixInput';
import SuvixButton from '../src/components/SuvixButton';
import { useAuthStore } from '../src/store/useAuthStore';
import { useGoogleAuth } from '../src/hooks/useGoogleAuth';
import { api } from '../src/api/client';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { signIn: googleSignIn, isLoading: isGoogleLoading } = useGoogleAuth();
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Incomplete Form', 'Please enter both your email and password.');
      return;
    }
    setLoading(true);
    try {
      const response = await api.post('/auth/login', {
        // 🔒 SECURITY SYNC: Matching backend .trim().toLowerCase()
        email: email.trim().toLowerCase(),
        password,
      });

      if (response.data.success) {
        const { user, token } = response.data;
        await setAuth(user, token);
        router.replace('/');
      }
    } catch (error: any) {
      console.error('❌ [AUTH] Login Error:', error.response?.data || error.message);
      
      const status = error.response?.status;
      const data = error.response?.data;
      const isCloudflare = typeof data === 'string' && data.includes('challenge-platform');
      const isSuspended = typeof data === 'string' && data.includes('Service Suspended');

      if (!error.response) {
        Alert.alert('Connection Error', 'Could not reach SuviX. Check your internet.');
      } else if (isSuspended) {
        // 🚨 HOSTING SECURITY: Detecting server-side suspension
        Alert.alert('Service Suspended', 'The SuviX Backend is currently suspended by the hosting provider. Please check the dashboard.');
      } else if (isCloudflare) {
        Alert.alert('Network Protection', 'Cloudflare security is active. Please try again in a few minutes or switch networks.');
      } else if (status === 403) {
        // 🌍 REGIONAL SECURITY: Handling Geo/VPN blocks
        if (data?.error === 'REGION_BLOCKED') {
          Alert.alert('Region Restricted', 'SuviX is currently only available in India and the US.');
        } else if (data?.error === 'ACCESS_DENIED' || data?.error === 'VPN_DETECTED') {
          Alert.alert('VPN Detected', 'Please disable your VPN or Proxy to continue to SuviX.');
        } else {
          Alert.alert('Access Denied', data?.message || 'Access restricted by security layers.');
        }
      } else if (status === 429) {
        Alert.alert('Too Many Requests', 'Please wait a moment before trying again.');
      } else if (status === 401) {
        Alert.alert('Invalid Credentials', 'The email or password you entered is incorrect.');
      } else {
        Alert.alert('Login Failed', data?.message || 'An unexpected error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <Image source={require('../assets/logo.png')} style={styles.logo} resizeMode="contain" />
              <Text style={styles.title}>Welcome Back!</Text>
              <Text style={styles.subtitle}>Sign in to continue to SuviX</Text>
            </View>

            <View style={styles.form}>
              <SuvixInput
                small
                label="Email Address"
                placeholder="name@example.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                icon={<Feather name="mail" color={Colors.dark.textSecondary} size={18} />}
              />
              <SuvixInput
                small
                label="Password"
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                icon={<Feather name="lock" color={Colors.dark.textSecondary} size={18} />}
                rightIcon={
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Feather name={showPassword ? "eye-off" : "eye"} color={Colors.dark.textSecondary} size={16} />
                  </TouchableOpacity>
                }
              />

              <TouchableOpacity 
                style={styles.forgotPassword}
                onPress={() => router.push('/forgot-password')}
              >
                <Text style={styles.forgotText}>Forgot Password?</Text>
              </TouchableOpacity>

              <SuvixButton title="Continue" onPress={handleLogin} loading={loading} style={styles.actionBtn} />

              <View style={styles.dividerContainer}>
                <View style={styles.line} /><Text style={styles.dividerText}>or</Text><View style={styles.line} />
              </View>

              {/* GOOGLE AUTH (REAL) */}
              <TouchableOpacity 
                style={[styles.googleButton, isGoogleLoading && { opacity: 0.7 }]} 
                onPress={googleSignIn}
                disabled={isGoogleLoading}
              >
                <AntDesign name="google" size={18} color={Colors.white} style={styles.googleIcon} />
                <Text style={styles.googleButtonText}>
                  {isGoogleLoading ? 'Verifying...' : 'Continue with Google'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/signup')}>
                <Text style={styles.footerLink}>Sign up</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.primary },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40 },
  header: { marginTop: 40, marginBottom: 30, alignItems: 'center' },
  logo: { width: 60, height: 60, marginBottom: 12 },
  title: { color: Colors.white, fontSize: 24, fontWeight: '800', textAlign: 'center' },
  subtitle: { color: Colors.dark.textSecondary, fontSize: 14, textAlign: 'center' },
  form: { flex: 1 },
  forgotPassword: { alignSelf: 'flex-end', marginBottom: 20 },
  forgotText: { color: Colors.accent, fontSize: 13, fontWeight: '600' },
  actionBtn: { height: 48 },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  line: { flex: 1, height: 1, backgroundColor: Colors.dark.border },
  dividerText: { color: Colors.dark.textSecondary, paddingHorizontal: 12, fontSize: 12, fontWeight: '600' },
  googleButton: { flexDirection: 'row', height: 48, borderRadius: 12, borderWidth: 1.2, borderColor: Colors.dark.border, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.dark.secondary },
  googleIcon: { width: 16, height: 16, marginRight: 10 },
  googleButtonText: { color: Colors.white, fontSize: 15, fontWeight: '600' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 30, marginBottom: 20 },
  footerText: { color: Colors.dark.textSecondary, fontSize: 14 },
  footerLink: { color: Colors.accent, fontSize: 14, fontWeight: '700' },
});
