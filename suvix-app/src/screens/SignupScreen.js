import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView, 
  TouchableOpacity,
  Alert,
  Image 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { Colors } from '../constants/Colors';
import SuvixInput from '../components/SuvixInput';
import SuvixButton from '../components/SuvixButton';
import { API_BASE_URL } from '../config/api';

const DEFAULT_AVATAR = "https://cdn-icons-png.flaticon.com/512/149/149071.png";

const SignupScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'editor',
  });
  const [profileImage, setProfileImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const handleSignup = async () => {
    const { name, email, password, phone, role } = formData;
    if (!name || !email || !password || !phone) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const data = new FormData();
      data.append('name', name.trim());
      data.append('email', email.trim());
      data.append('password', password);
      data.append('phone', phone.trim());
      data.append('role', role);
      
      if (profileImage) {
        let filename = profileImage.split('/').pop();
        let match = /\.(\w+)$/.exec(filename);
        let type = match ? `image/${match[1]}` : `image`;
        data.append('profilePicture', { uri: profileImage, name: filename, type });
      }

      await axios.post(`${API_BASE_URL}/auth/register`, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      Alert.alert('Success', 'Account created! Please log in.', [
        { text: 'OK', onPress: () => navigation.navigate('Login') }
      ]);
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed.';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.navRow}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                <MaterialCommunityIcons name="arrow-left" size={22} color={Colors.white} />
              </TouchableOpacity>
              <View style={styles.logoCentered}>
                <Image 
                  source={require('../../assets/logo.png')} 
                  style={styles.logo} 
                  resizeMode="contain"
                />
              </View>
              {/* Spacer for symmetry */}
              <View style={{ width: 36 }} />
            </View>

            <View style={styles.titleRow}>
              <View style={styles.titleTextColumn}>
                <Text style={styles.title}>Create Account</Text>
                <Text style={styles.subtitle}>Join SuviX and start your journey</Text>
              </View>
              <TouchableOpacity onPress={pickImage} style={styles.profilePicker}>
                <Image source={{ uri: profileImage || DEFAULT_AVATAR }} style={styles.avatar} />
                <View style={styles.addIconContainer}>
                   <MaterialCommunityIcons name="plus" size={12} color={Colors.white} />
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Role Selection */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Select your account role</Text>
          </View>
          <View style={styles.roleContainer}>
            <TouchableOpacity 
              style={[styles.roleTab, formData.role === 'editor' && styles.activeTab]} 
              onPress={() => setFormData({...formData, role: 'editor'})}
            >
              <Text style={[styles.roleText, formData.role === 'editor' && styles.activeRoleText]}>I'm an Editor</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.roleTab, formData.role === 'client' && styles.activeTab]} 
              onPress={() => setFormData({...formData, role: 'client'})}
            >
              <Text style={[styles.roleText, formData.role === 'client' && styles.activeRoleText]}>I'm a Client</Text>
            </TouchableOpacity>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <SuvixInput
              placeholder="Full Name"
              value={formData.name}
              onChangeText={(val) => setFormData({ ...formData, name: val })}
              icon={(props) => <MaterialCommunityIcons name="account-outline" {...props} />}
            />

            <SuvixInput
              placeholder="Email Address"
              value={formData.email}
              onChangeText={(val) => setFormData({ ...formData, email: val })}
              keyboardType="email-address"
              autoCapitalize="none"
              icon={(props) => <MaterialCommunityIcons name="email-outline" {...props} />}
            />

            <SuvixInput
              placeholder="Mobile Number"
              value={formData.phone}
              onChangeText={(val) => setFormData({ ...formData, phone: val })}
              keyboardType="phone-pad"
              icon={(props) => <MaterialCommunityIcons name="phone-outline" {...props} />}
            />
            
            <SuvixInput
              placeholder="Password"
              value={formData.password}
              onChangeText={(val) => setFormData({ ...formData, password: val })}
              secureTextEntry
              icon={(props) => <MaterialCommunityIcons name="lock-outline" {...props} />}
            />

            <SuvixButton 
              title="Create Account" 
              onPress={handleSignup} 
              loading={loading} 
              style={styles.signupBtn}
            />

            <View style={styles.divider}>
              <View style={styles.line} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.line} />
            </View>

            <TouchableOpacity style={styles.googleButton}>
              <MaterialCommunityIcons name="google" size={18} color={Colors.white} />
              <Text style={styles.googleText}>Sign up with Google</Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.footerLink}>Sign in</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  header: {
    marginTop: 10,
    marginBottom: 12,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  logoCentered: {
    flex: 1,
    alignItems: 'center',
  },
  logo: {
    width: 110,
    height: 44,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleTextColumn: {
    flex: 1,
  },
  profilePicker: {
    position: 'relative',
    marginLeft: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  addIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.accent,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  title: {
    color: Colors.white,
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
    marginTop: 2,
  },
  sectionHeader: {
    marginBottom: 8,
    marginTop: 12,
  },
  sectionTitle: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  roleContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.secondary,
    padding: 4,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  roleTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 12,
  },
  activeTab: {
    backgroundColor: Colors.white,
  },
  roleText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '700',
  },
  activeRoleText: {
    color: Colors.primary,
  },
  form: {
    flex: 1,
  },
  signupBtn: {
    height: 50,
    marginTop: 12,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 14,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    color: Colors.textSecondary,
    marginHorizontal: 10,
    fontSize: 11,
    fontWeight: '600',
  },
  googleButton: {
    flexDirection: 'row',
    height: 50,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.secondary,
  },
  googleText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 10,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  footerText: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  footerLink: {
    color: Colors.accent,
    fontSize: 14,
    fontWeight: '700',
  },
});

export default SignupScreen;
