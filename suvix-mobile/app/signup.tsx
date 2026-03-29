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
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather, AntDesign } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../src/constants/Colors';
import SuvixInput from '../src/components/SuvixInput';
import SuvixButton from '../src/components/SuvixButton';
import { useGoogleAuth } from '../src/hooks/useGoogleAuth';
import api from '../src/services/api';

const { width } = Dimensions.get('window');
const DEFAULT_AVATAR = "https://cdn-icons-png.flaticon.com/512/149/149071.png";

type UserRole = 'editor' | 'client';

export default function SignupScreen() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('editor');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();
  const { signIn: googleSignIn, isLoading: isGoogleLoading } = useGoogleAuth();

  const pickImage = async () => {
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
    } catch (error) {
      Alert.alert('Feature Unavailable', 'Image picking requires a native rebuild.');
    }
  };

  const handleSignup = async () => {
    if (!username || !email || !password || !phone) {
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
      formData.append('role', role);
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
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        Alert.alert('Account Created! 🎉', 'Please log in to continue.', [
          { text: 'Log In', onPress: () => router.replace('/login') }
        ]);
      }
    } catch (error: any) {
      Alert.alert('Registration Failed', error.response?.data?.message || 'Try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* COMPACT HEADER */}
            <View style={styles.header}>
              <Image source={require('../assets/logo.png')} style={styles.logo} resizeMode="contain" />
              <Text style={styles.title}>Join SuviX</Text>
              <Text style={styles.subtitle}>Start your journey with us today</Text>
            </View>

            <View style={styles.content}>
              {/* COMPACT PROFILE */}
              <View style={styles.profileSection}>
                <TouchableOpacity onPress={pickImage} style={styles.avatarContainer}>
                  <Image source={{ uri: profileImage || DEFAULT_AVATAR }} style={styles.avatar} />
                  <View style={styles.editBadge}><Feather name="plus" size={10} color={Colors.white} /></View>
                </TouchableOpacity>
                <Text style={styles.profileLabel}>Upload Photo</Text>
              </View>

              {/* COMPACT ROLE */}
              <View style={styles.roleSelector}>
                <TouchableOpacity style={[styles.roleTab, role === 'editor' && styles.activeTab]} onPress={() => setRole('editor')}>
                  <Text style={[styles.roleText, role === 'editor' && styles.activeRoleText]}>I'm an Editor</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.roleTab, role === 'client' && styles.activeTab]} onPress={() => setRole('client')}>
                  <Text style={[styles.roleText, role === 'client' && styles.activeRoleText]}>I'm a Client</Text>
                </TouchableOpacity>
              </View>

              {/* INPUTS (USING SMALL PROP) */}
              <SuvixInput small label="Full Name" placeholder="John Doe" value={username} onChangeText={setUsername} icon={<Feather name="user" color={Colors.dark.textSecondary} />} />
              <SuvixInput small label="Email" placeholder="name@example.com" value={email} onChangeText={setEmail} keyboardType="email-address" icon={<Feather name="mail" color={Colors.dark.textSecondary} />} />
              <SuvixInput small label="Mobile" placeholder="+91 00000 00000" value={phone} onChangeText={setPhone} keyboardType="phone-pad" icon={<Feather name="phone" color={Colors.dark.textSecondary} />} />
              <SuvixInput small label="Password" placeholder="••••••••" value={password} onChangeText={setPassword} secureTextEntry={!showPassword} icon={<Feather name="lock" color={Colors.dark.textSecondary} />} 
                rightIcon={<TouchableOpacity onPress={() => setShowPassword(!showPassword)}><Feather name={showPassword ? "eye-off" : "eye"} color={Colors.dark.textSecondary} size={16} /></TouchableOpacity>} 
              />
              <SuvixInput small label="Confirm Password" placeholder="••••••••" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry={!showPassword} icon={<Feather name="shield" color={Colors.dark.textSecondary} />} />

              <SuvixButton title="Create Account" onPress={handleSignup} loading={loading} style={styles.actionBtn} />

              <View style={styles.dividerContainer}>
                <View style={styles.line} /><Text style={styles.dividerText}>or</Text><View style={styles.line} />
              </View>

              {/* GOOGLE BUTTON (REAL AUTH) */}
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

              {/* FOOTER (INSIDE SCROLL) */}
              <View style={styles.footer}>
                <Text style={styles.footerText}>Already have an account? </Text>
                <TouchableOpacity onPress={() => router.push('/login')}>
                  <Text style={styles.footerLink}>Log In</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={{ height: 40 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.primary },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 20, paddingBottom: 60 },
  header: { marginTop: 10, marginBottom: 10, alignItems: 'center' },
  logo: { width: 40, height: 40, marginBottom: 5 },
  title: { color: Colors.white, fontSize: 20, fontWeight: '800', textAlign: 'center' },
  subtitle: { color: Colors.dark.textSecondary, fontSize: 12, textAlign: 'center' },
  content: { width: '100%' },
  actionBtn: { marginTop: 10, height: 46 },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 12 },
  line: { flex: 1, height: 1, backgroundColor: Colors.dark.border },
  dividerText: { color: Colors.dark.textSecondary, paddingHorizontal: 10, fontSize: 11, fontWeight: '600' },
  googleButton: { flexDirection: 'row', height: 46, borderRadius: 12, borderWidth: 1.2, borderColor: Colors.dark.border, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.dark.secondary },
  googleIcon: { width: 16, height: 16, marginRight: 8 },
  googleButtonText: { color: Colors.white, fontSize: 14, fontWeight: '600' },
  profileSection: { alignItems: 'center', marginBottom: 12 },
  avatarContainer: { position: 'relative', marginBottom: 4 },
  avatar: { width: 55, height: 55, borderRadius: 27.5, borderWidth: 2, borderColor: Colors.dark.border },
  editBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: Colors.accent, width: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: Colors.dark.primary },
  profileLabel: { color: Colors.dark.textSecondary, fontSize: 11, fontWeight: '600' },
  roleSelector: { flexDirection: 'row', backgroundColor: Colors.dark.secondary, padding: 3, borderRadius: 10, marginBottom: 12, borderWidth: 1, borderColor: Colors.dark.border },
  roleTab: { flex: 1, paddingVertical: 6, alignItems: 'center', borderRadius: 8 },
  activeTab: { backgroundColor: Colors.white },
  roleText: { color: Colors.dark.textSecondary, fontSize: 12, fontWeight: '700' },
  activeRoleText: { color: Colors.dark.primary },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 15 },
  footerText: { color: Colors.dark.textSecondary, fontSize: 13 },
  footerLink: { color: Colors.accent, fontSize: 13, fontWeight: '700' },
});
