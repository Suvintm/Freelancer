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
import { useGoogleAuth } from '../src/hooks/useGoogleAuth';
import { api } from '../src/api/client';
import * as Haptics from 'expo-haptics';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const DEFAULT_AVATAR = "https://cdn-icons-png.flaticon.com/512/149/149071.png";

export default function SignupScreen() {
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

  const handleSignup = async () => {
    if (loading) return;
    if (!username || !email || !password || !phone) {
      handleImpact(Haptics.ImpactFeedbackStyle.Medium);
      Alert.alert('Incomplete Form', 'Please fill in all details.');
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', username.trim());
      formData.append('email', email.trim().toLowerCase());
      formData.append('password', password);
      formData.append('phone', phone.trim());
      formData.append('role', 'pending');
      formData.append('country', 'IN');

      if (profileImage) {
        const uriParts = profileImage.split('.');
        const fileType = uriParts[uriParts.length - 1];
        formData.append('profilePicture', {
          uri: profileImage,
          name: `profile.${fileType}`,
          type: `image/${fileType}`,
        } as any);
      }

      const response = await api.post('/auth/register', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data.success) {
        handleImpact(Haptics.ImpactFeedbackStyle.Heavy);
        router.replace('/login');
      }
    } catch (error: any) {
      Alert.alert('Signup Error', error.response?.data?.message || 'Check your details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboardView}>
          <ScrollView contentContainerStyle={styles.scrollContent} scrollEnabled={SCREEN_HEIGHT < 750} showsVerticalScrollIndicator={false}>
            
            <View style={styles.header}>
              <Image source={require('../assets/whitebglogo.png')} style={styles.logo} resizeMode="contain" />
              
              <TouchableOpacity onPress={pickImage} style={styles.avatarWrapper} activeOpacity={0.8}>
                <Image source={{ uri: profileImage || DEFAULT_AVATAR }} style={styles.avatar} />
                <View style={styles.plusBadge}><Feather name="plus" size={10} color="#000" /></View>
              </TouchableOpacity>
              
              <Text style={styles.title}>Join SuviX</Text>
            </View>

            <View style={styles.content}>
              <View style={styles.inputGroup}>
                <SuvixInput small label="Full Name" placeholder="Name" value={username} onChangeText={setUsername} icon={<Feather name="user" color={Colors.dark.textSecondary} size={16} />} />
                <SuvixInput small label="Email Address" placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" icon={<Feather name="mail" color={Colors.dark.textSecondary} size={16} />} />
                <SuvixInput small label="Phone Number" placeholder="Mobile" value={phone} onChangeText={setPhone} keyboardType="phone-pad" icon={<Feather name="phone" color={Colors.dark.textSecondary} size={16} />} />
                <SuvixInput small label="Password" placeholder="••••••••" value={password} onChangeText={setPassword} secureTextEntry={!showPassword} icon={<Feather name="lock" color={Colors.dark.textSecondary} size={16} />} 
                  rightIcon={<TouchableOpacity onPress={() => setShowPassword(!showPassword)}><Feather name={showPassword ? "eye-off" : "eye"} color={Colors.dark.textSecondary} size={16} /></TouchableOpacity>} 
                />
              </View>

              <TouchableOpacity activeOpacity={0.8} onPress={() => { if(!loading) { handleImpact(); handleSignup(); } }} disabled={loading} style={[styles.primaryBtn, loading && styles.btnDisabled]}>
                <Text style={styles.primaryBtnText}>{loading ? 'Please wait...' : 'Create Account'}</Text>
              </TouchableOpacity>

              <View style={styles.dividerContainer}>
                <View style={styles.line} /><Text style={styles.dividerText}>OR</Text><View style={styles.line} />
              </View>

              <TouchableOpacity 
                style={[styles.googleButton, (isGoogleLoading || loading) && styles.btnDisabled]} 
                onPress={() => { handleImpact(); googleSignIn(); }}
                disabled={isGoogleLoading || loading}
              >
                {/* LARGER GOOGLE ICON (24x24) */}
                <Image source={require('../assets/google-icon.png')} style={styles.googleIconAsset} resizeMode="contain" />
                <Text style={styles.googleButtonText}>Continue with Google</Text>
              </TouchableOpacity>

              <View style={styles.footer}>
                <Text style={styles.footerText}>Existing user? </Text>
                <TouchableOpacity onPress={() => { handleImpact(); router.replace('/login'); }}>
                  <Text style={styles.footerLink}>Log In</Text>
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
  container: { flex: 1, backgroundColor: '#000' },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 32, justifyContent: 'center', paddingVertical: 10 },
  header: { alignItems: 'center', marginBottom: 16 },
  logo: { width: 90, height: 36, marginBottom: 8 },
  avatarWrapper: { width: 60, height: 60, borderRadius: 30, borderWidth: 1.5, borderColor: '#444', justifyContent: 'center', alignItems: 'center', marginBottom: 8, position: 'relative' },
  avatar: { width: 54, height: 54, borderRadius: 27 },
  plusBadge: { position: 'absolute', bottom: -2, right: -2, backgroundColor: '#FFF', width: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#000' },
  title: { color: '#FFF', fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  content: { width: '100%' },
  inputGroup: { marginBottom: 12 },
  primaryBtn: { backgroundColor: '#FFF', height: 50, borderRadius: 100, justifyContent: 'center', alignItems: 'center', marginTop: 4 },
  btnDisabled: { opacity: 0.5 },
  primaryBtnText: { color: '#000', fontSize: 16, fontWeight: '800' },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 16 },
  line: { flex: 1, height: 1.2, backgroundColor: Colors.dark.border },
  dividerText: { color: Colors.dark.textSecondary, paddingHorizontal: 12, fontSize: 10, fontWeight: '700' },
  googleButton: { flexDirection: 'row', height: 48, borderRadius: 100, borderWidth: 1.2, borderColor: Colors.dark.border, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
  googleIconAsset: { width: 24, height: 24 },
  googleButtonText: { color: Colors.white, fontSize: 14, fontWeight: '600', marginLeft: 12 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  footerText: { color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: '500' },
  footerLink: { color: '#FFF', fontSize: 13, fontWeight: '800' },
});
