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
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../src/constants/Colors';
import SuvixInput from '../src/components/SuvixInput';
import SuvixButton from '../src/components/SuvixButton';
import { useAuthStore } from '../src/store/useAuthStore';
import { api } from '../src/api/client';
import * as Haptics from 'expo-haptics';

export default function CompleteProfileScreen() {
  const theme = Colors.dark; // SuviX default is dark for high-end feel
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { user, updateUser, setAuth, tempSignupData, clearTempSignupData } = useAuthStore();
  const isSocialPending = tempSignupData?.isSocialSignup;

  const handleImpact = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    Haptics.impactAsync(style);
  };

  const handleSubmit = async () => {
    if (!username || !phone) {
      handleImpact(Haptics.ImpactFeedbackStyle.Medium);
      Alert.alert('Incomplete', 'Please provide a username and phone number to secure your account.');
      return;
    }

    setLoading(true);
    try {
      if (isSocialPending && tempSignupData?.googleIdToken) {
        // CASE: ATOMIC SOCIAL REGISTRATION
        // We send EVERYTHING together: Google Token + Profile + Roles
        const res = await api.post('/auth/google/register-atomic', {
          idToken: tempSignupData.googleIdToken,
          username: username.toLowerCase().trim(),
          phone: phone.trim(),
          categoryId: tempSignupData.categoryId,
          roleSubCategoryIds: tempSignupData.roleSubCategoryIds,
          youtubeChannels: tempSignupData.youtubeChannels
        });

        if (res.data.success) {
          handleImpact(Haptics.ImpactFeedbackStyle.Heavy);
          const { user: newUser, token, refreshToken } = res.data;
          
          // Clear onboarding buffer and log in
          clearTempSignupData();
          await setAuth(newUser, token, refreshToken);
          // Auth guard in _layout.tsx will handle routing to /(tabs)
        }
      } else {
        // CASE: STANDARD PROFILE COMPLETION
        const response = await api.put('/user/profile/minimal', {
          username: username.toLowerCase().trim(),
          phone: phone.trim(),
        });

        if (response.data.success) {
          handleImpact(Haptics.ImpactFeedbackStyle.Heavy);
          updateUser({ 
            username, 
            phone,
            isOnboarded: true 
          });
          
          // Finalize onboarding by pushing to the main dashboard
          router.replace('/(tabs)');
        }
      }
    } catch (error: any) {
      handleImpact(Haptics.ImpactFeedbackStyle.Medium);
      const msg = error.response?.data?.message || 'Something went wrong. Please try another handle.';
      Alert.alert('Registration Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.primary }]}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.header}>
              <View style={styles.iconCircle}>
                <Feather name="user-check" size={32} color={theme.accent} />
              </View>
              <Text style={[styles.title, { color: theme.text }]}>Finalize Your Profile</Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                Welcome to SuviX, {user?.name}! We just need a couple more details to get you started.
              </Text>
            </View>

            <View style={styles.form}>
              <SuvixInput
                label="Choose Username"
                placeholder="creative_mind"
                value={username}
                onChangeText={setUsername}
                icon={<Feather name="at-sign" size={18} color={theme.textSecondary} />}
                autoCapitalize="none"
              />

              <SuvixInput
                label="Mobile Number"
                placeholder="+91 99999 99999"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                icon={<Feather name="phone" size={18} color={theme.textSecondary} />}
              />

              <View style={styles.disclaimerBox}>
                <Feather name="shield" size={14} color={theme.textSecondary} />
                <Text style={styles.disclaimerText}>
                  Your data is hardware-encrypted and never shared with third parties.
                </Text>
              </View>

              <SuvixButton
                title="Save & Continue"
                onPress={handleSubmit}
                loading={loading}
                variant="primary"
                style={styles.submitBtn}
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 32, paddingTop: 60 },
  header: { alignItems: 'center', marginBottom: 40 },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  title: { fontSize: 24, fontWeight: '900', textAlign: 'center', marginBottom: 12 },
  subtitle: { fontSize: 14, textAlign: 'center', lineHeight: 22, opacity: 0.8 },
  form: { gap: 8 },
  disclaimerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    marginBottom: 24,
    opacity: 0.6,
  },
  disclaimerText: { fontSize: 11, color: '#FFF' },
  submitBtn: { marginTop: 10 },
});
