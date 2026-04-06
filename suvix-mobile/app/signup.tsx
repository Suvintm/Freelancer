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
  useColorScheme
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../src/constants/Colors';
import SuvixInput from '../src/components/SuvixInput';
import SuvixButton from '../src/components/SuvixButton';
import { useGoogleAuth } from '../src/hooks/useGoogleAuth';
import { api } from '../src/api/client';
import * as Haptics from 'expo-haptics';
import { useAuthStore } from '../src/store/useAuthStore';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const DEFAULT_AVATAR = "https://cdn-icons-png.flaticon.com/512/149/149071.png";

export default function SignupScreen() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const isDark = colorScheme === 'dark';

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
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

  const handleSignup = async () => {
    if (loading) return;
    
    if (!username || !email || !password || !phone) {
      handleImpact(Haptics.ImpactFeedbackStyle.Medium);
      Alert.alert('Incomplete Form', 'Please fill in all details.');
      return;
    }

    setLoading(true);
    try {
      // Save data to the store's temporary buffer for final atomic registration
      setTempSignupData({
        name: username.trim(),
        email: email.trim().toLowerCase(),
        password: password,
        phone: phone.trim(),
        profileImage: profileImage
      });

      handleImpact(Haptics.ImpactFeedbackStyle.Heavy);
      router.push({
        pathname: '/role-selection',
        params: { name: username || 'SuviX Professional' }
      });
    } catch (error: any) {
      Alert.alert('Signup Error', 'Could not prepare your account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.primary }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboardView}>
          <ScrollView contentContainerStyle={styles.scrollContent} scrollEnabled={SCREEN_HEIGHT < 750} showsVerticalScrollIndicator={false}>
            
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
                <SuvixInput small label="Full Name" placeholder="Name" value={username} onChangeText={setUsername} icon={<Feather name="user" size={16} />} />
                <SuvixInput small label="Email Address" placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" icon={<Feather name="mail" size={16} />} />
                <SuvixInput small label="Phone Number" placeholder="Mobile" value={phone} onChangeText={setPhone} keyboardType="phone-pad" icon={<Feather name="phone" size={16} />} />
                <SuvixInput small label="Password" placeholder="••••••••" value={password} onChangeText={setPassword} secureTextEntry={!showPassword} icon={<Feather name="lock" size={16} />} 
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
  header: { alignItems: 'center', marginBottom: 16 },
  logo: { width: 90, height: 36, marginBottom: 8 },
  avatarWrapper: { width: 60, height: 60, borderRadius: 30, borderWidth: 1.5, justifyContent: 'center', alignItems: 'center', marginBottom: 8, position: 'relative' },
  avatar: { width: 54, height: 54, borderRadius: 27 },
  plusBadge: { position: 'absolute', bottom: -2, right: -2, width: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center', borderWidth: 2 },
  title: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  content: { width: '100%' },
  inputGroup: { marginBottom: 12 },
  btnDisabled: { opacity: 0.5 },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 16 },
  line: { flex: 1, height: 1.2 },
  dividerText: { paddingHorizontal: 12, fontSize: 10, fontWeight: '700' },
  googleButton: { flexDirection: 'row', height: 48, borderRadius: 100, borderWidth: 1.2, justifyContent: 'center', alignItems: 'center' },
  googleIconAsset: { width: 24, height: 24 },
  googleButtonText: { fontSize: 14, fontWeight: '600', marginLeft: 12 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  footerText: { fontSize: 13, fontWeight: '500' },
  footerLink: { fontSize: 13, fontWeight: '800' },
});
