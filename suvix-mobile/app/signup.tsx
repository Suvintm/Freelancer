import React, { useState, useCallback } from 'react';
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
  Modal
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../src/constants/Colors';
import SuvixInput from '../src/components/SuvixInput';
import SuvixButton from '../src/components/SuvixButton';
import { useGoogleAuth } from '../src/hooks/useGoogleAuth';
import * as Haptics from 'expo-haptics';
import { useAuthStore } from '../src/store/useAuthStore';

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
  const [loading, setLoading] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<{ type: 'loading' | 'success' | 'error' | 'none', message: string }>({ type: 'none', message: '' });
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);

  const LANGUAGES = [
    'English', 'Hindi', 'Kannada', 'Telugu', 'Tamil', 
    'Malayalam', 'Marathi', 'Bengali', 'Gujarati', 'Punjabi'
  ];
  
  const router = useRouter();
  const { signIn: googleSignIn, isLoading: isGoogleLoading } = useGoogleAuth();

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
    // Only allow lowercase letters, numbers, underscores, and periods
    const lowerText = text.toLowerCase();
    
    // 1. Basic character filtering
    let sanitized = lowerText.replace(/[^a-z0-9_.]/g, '');
    
    // 2. Prevent consecutive periods
    sanitized = sanitized.replace(/\.\.+/g, '.');
    
    setUsername(sanitized);
  };

  const handleSignup = async () => {
    if (loading) return;
    
    if (!fullName || !username || !email || !password || !phone || !motherTongue) {
      handleImpact(Haptics.ImpactFeedbackStyle.Medium);
      Alert.alert('Incomplete Form', 'Please fill in all details including your handle and mother tongue.');
      return;
    }

    setLoading(true);
    setUsernameStatus({ type: 'none', message: '' });

    try {
      const { api } = require('../src/api/client');
      
      // 1. Consolidated Validation (Email & Username)
      // Backend now throws 409 for duplicates
      await api.post('/auth/validate-signup', { 
        email: email.trim().toLowerCase(), 
        username: username.trim().toLowerCase() 
      });

      // 2. Local Format Validation (Instagram Rules)
      if (username.length < 3 || username.startsWith('.') || username.endsWith('.')) {
        handleImpact(Haptics.ImpactFeedbackStyle.Medium);
        setUsernameStatus({ type: 'error', message: 'Invalid handle format (Cannot start/end with dot)' });
        setLoading(false);
        return;
      }

      // 3. Save data to the store's temporary buffer
      setTempSignupData({
        name: fullName.trim(),
        username: username.trim().toLowerCase(),
        email: email.trim().toLowerCase(),
        password: password,
        phone: phone.trim(),
        motherTongue: motherTongue,
        profileImage: profileImage
      });

      handleImpact(Haptics.ImpactFeedbackStyle.Heavy);
      router.push({
        pathname: '/role-selection',
        params: { name: fullName || 'SuviX Professional' }
      });
    } catch (error: any) {
      handleImpact(Haptics.ImpactFeedbackStyle.Medium);
      
      const errorMessage = error.response?.data?.message || 'Could not prepare your account.';
      
      if (error.response?.status === 409) {
          // If it's a conflict, it could be email or username. 
          // We show a specific alert as it's a critical stop.
          if (errorMessage.toLowerCase().includes('username')) {
            setUsernameStatus({ type: 'error', message: errorMessage });
          } else {
            Alert.alert('Registration Issue', errorMessage);
          }
      } else {
        Alert.alert('Signup Error', errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.primary }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboardView}>
          <ScrollView contentContainerStyle={styles.scrollContent} scrollEnabled={SCREEN_HEIGHT < 850} showsVerticalScrollIndicator={false}>
            
            <View style={styles.header}>
              <Image source={require('../assets/whitebglogo.png')} style={[styles.logo, { tintColor: isDark ? undefined : theme.text }]} resizeMode="contain" />
              
              <TouchableOpacity onPress={pickImage} style={[styles.avatarWrapper, { borderColor: theme.border }]} activeOpacity={0.8}>
                <Image source={{ uri: profileImage || DEFAULT_AVATAR }} style={styles.avatar} />
                <View style={[styles.plusBadge, { backgroundColor: theme.accent, borderColor: theme.primary }]}><Feather name="plus" size={10} color={isDark ? "#000" : "#FFF"} /></View>
              </TouchableOpacity>
              
              <Text style={[styles.title, { color: theme.text }]}>Join SuviX</Text>
            </View>

            <View style={styles.content}>
              <View style={styles.inputGroup}>
                <SuvixInput small label="Full Name" placeholder="Your Name" value={fullName} onChangeText={setFullName} autoCorrect={false} spellCheck={false} textContentType="name" icon={<Feather name="user" size={16} />} />
                <SuvixInput small label="Username Handle" placeholder="unique_handle" value={username} onChangeText={handleUsernameChange} autoCapitalize="none" autoCorrect={false} spellCheck={false} textContentType="username" icon={<Feather name="at-sign" size={16} />} />
                {usernameStatus.type !== 'none' && (
                  <Text style={[
                      styles.statusMessage, 
                      { color: usernameStatus.type === 'error' ? '#FF4B4B' : usernameStatus.type === 'success' ? '#22C35E' : theme.textSecondary }
                  ]}>
                    {usernameStatus.message}
                  </Text>
                )}
                <SuvixInput small label="Email Address" placeholder="email@example.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} spellCheck={false} textContentType="none" icon={<Feather name="mail" size={16} />} />
                
                <View style={styles.flexRow}>
                  <View style={{ flex: 1.6, marginRight: 10 }}>
                    <SuvixInput small label="Phone Number" placeholder="+91..." value={phone} onChangeText={setPhone} keyboardType="phone-pad" autoCorrect={false} spellCheck={false} textContentType="none" icon={<Feather name="phone" size={16} />} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.langLabel, { color: theme.textSecondary }]}>Primary Mother Tongue</Text>
                    <TouchableOpacity 
                      activeOpacity={0.7}
                      onPress={() => { handleImpact(); setShowLanguageModal(true); }}
                      style={[styles.langSelector, { backgroundColor: theme.inputBg, borderColor: theme.border }]}
                    >
                      <Text numberOfLines={1} style={[styles.langValue, { color: theme.text }]}>{motherTongue}</Text>
                      <Feather name="chevron-down" size={14} color={theme.textSecondary} />
                    </TouchableOpacity>
                  </View>
                </View>

                <SuvixInput small label="Secure Password" placeholder="••••••••" value={password} onChangeText={setPassword} secureTextEntry={!showPassword} icon={<Feather name="lock" size={16} />} 
                  rightIcon={<TouchableOpacity onPress={() => setShowPassword(!showPassword)}><Feather name={showPassword ? "eye-off" : "eye"} color={theme.textSecondary} size={16} /></TouchableOpacity>} 
                />
              </View>

              <SuvixButton 
                title={loading ? 'Please wait...' : 'Create Account'} 
                onPress={handleSignup}
                loading={loading}
                variant="primary"
                style={{ marginTop: 4 }}
              />

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

              <View style={styles.footer}>
                <Text style={[styles.footerText, { color: theme.textSecondary }]}>Existing user? </Text>
                <TouchableOpacity onPress={() => { handleImpact(); router.replace('/login'); }}>
                  <Text style={[styles.footerLink, { color: theme.text }]}>Log In</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Language Selection Modal */}
            <Modal visible={showLanguageModal} transparent animationType="slide">
              <View style={styles.modalOverlay}>
                <TouchableOpacity style={{ flex: 1 }} onPress={() => setShowLanguageModal(false)} />
                <View style={[styles.modalContent, { backgroundColor: theme.primary, borderTopColor: theme.border }]}>
                  <View style={styles.modalHeader}>
                    <View style={[styles.modalKnob, { backgroundColor: theme.border }]} />
                    <Text style={[styles.modalTitle, { color: theme.text }]}>Select Mother Tongue</Text>
                  </View>
                  <ScrollView style={styles.modalList} showsVerticalScrollIndicator={false}>
                    {LANGUAGES.map(lang => (
                      <TouchableOpacity 
                        key={lang}
                        style={[styles.langItem, motherTongue === lang && { backgroundColor: theme.accent + '15' }]}
                        onPress={() => { handleImpact(); setMotherTongue(lang); setShowLanguageModal(false); }}
                      >
                        <Text style={[styles.langItemText, { color: theme.text }, motherTongue === lang && { color: theme.accent, fontWeight: '800' }]}>{lang}</Text>
                        {motherTongue === lang && <Feather name="check" size={18} color={theme.accent} />}
                      </TouchableOpacity>
                    ))}
                    <View style={{ height: 40 }} />
                  </ScrollView>
                </View>
              </View>
            </Modal>

          </ScrollView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 32, justifyContent: 'center', paddingVertical: 10 },
  header: { alignItems: 'center', marginBottom: 12 },
  logo: { width: 80, height: 32, marginBottom: 4 },
  avatarWrapper: { width: 60, height: 60, borderRadius: 30, borderWidth: 1.5, justifyContent: 'center', alignItems: 'center', marginBottom: 8, position: 'relative' },
  avatar: { width: 54, height: 54, borderRadius: 27 },
  plusBadge: { position: 'absolute', bottom: -2, right: -2, width: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center', borderWidth: 2 },
  title: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  content: { width: '100%' },
  inputGroup: { marginBottom: 8 },
  flexRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 2 },
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
  statusMessage: { fontSize: 11, fontWeight: '700', marginTop: -6, marginBottom: 10, marginLeft: 6 },
  // Language Selector
  langSelector: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    paddingHorizontal: 10, 
    height: 48,
    borderRadius: 12, 
    borderWidth: 1.5, 
    marginBottom: 10 
  },
  langLabel: { fontSize: 12, fontWeight: '600', marginBottom: 4, marginLeft: 4 },
  langValue: { fontSize: 13, fontWeight: '600', flex: 1 },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 30, borderTopRightRadius: 30, borderWidth: 1, height: 400, paddingHorizontal: 24 },
  modalHeader: { alignItems: 'center', paddingVertical: 12 },
  modalKnob: { width: 40, height: 4, borderRadius: 2, marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '900', marginBottom: 12 },
  modalList: { flex: 1 },
  langItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, paddingHorizontal: 16, borderRadius: 12, marginBottom: 4 },
  langItemText: { fontSize: 16, fontWeight: '600' },
});

