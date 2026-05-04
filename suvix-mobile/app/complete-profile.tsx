import React, { useState, useEffect } from 'react';
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
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../src/constants/Colors';
import SuvixInput from '../src/components/SuvixInput';
import SuvixButton from '../src/components/SuvixButton';
import { useAuthStore } from '../src/store/useAuthStore';
import { useCategoryStore } from '../src/store/useCategoryStore';
import { api } from '../src/api/client';
import * as Haptics from 'expo-haptics';

export default function CompleteProfileScreen() {
  const theme = Colors.dark; // SuviX default is dark for high-end feel
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { user, updateUser, setAuth, tempSignupData, clearTempSignupData } = useAuthStore();
  const { categories, fetchCategories } = useCategoryStore();
  const isSocialPending = tempSignupData?.isSocialSignup;
  const socialProfile = tempSignupData?.socialProfile;

  // Load categories to resolve names
  useEffect(() => {
    fetchCategories();
  }, []);

  // GUARD: role-first pattern — must have a categoryId before finalizing
  useEffect(() => {
    if (!isSocialPending || !tempSignupData?.googleIdToken) {
      // Not a social signup — shouldn't be here
      router.replace('/login');
      return;
    }
    if (!tempSignupData?.categoryId) {
      // Social signup started but no role picked yet
      router.replace('/role-selection');
    }
  }, [isSocialPending, tempSignupData?.googleIdToken, tempSignupData?.categoryId]);

  // Resolve Names
  const selectedCategory = categories.find(c => c.id === tempSignupData?.categoryId);
  const selectedSubCategories = selectedCategory 
    ? selectedCategory.subCategories.filter(s => tempSignupData?.roleSubCategoryIds?.includes(s.id))
    : [];

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
                Welcome to SuviX, {socialProfile?.name || 'User'}! We just need a couple more details to get you started.
              </Text>
            </View>

            {/* SELECTION SUMMARY CARD */}
            <View style={[styles.summaryCard, { backgroundColor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.1)' }]}>
              <View style={styles.summaryItem}>
                <Feather name="mail" size={14} color={theme.textSecondary} style={{ marginRight: 8 }} />
                <Text style={[styles.summaryText, { color: theme.textSecondary }]}>{socialProfile?.email}</Text>
              </View>
              
              {selectedCategory && (
                <View style={[styles.summaryItem, { marginTop: 8 }]}>
                  <Feather name="briefcase" size={14} color={theme.accent} style={{ marginRight: 8 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.summaryText, { color: theme.text, fontWeight: '700' }]}>{selectedCategory.name}</Text>
                  </View>
                  <TouchableOpacity 
                    onPress={() => router.push('/role-selection')}
                    style={{ paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}
                  >
                    <Text style={{ fontSize: 10, fontWeight: 'bold', color: theme.textSecondary }}>Change</Text>
                  </TouchableOpacity>
                </View>
              )}

              {selectedSubCategories.length > 0 && (
                <View style={styles.tagContainer}>
                  {selectedSubCategories.map(sub => (
                    <View key={sub.id} style={[styles.tag, { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }]}>
                      <Text style={[styles.tagText, { color: theme.textSecondary }]}>{sub.name}</Text>
                    </View>
                  ))}
                </View>
              )}
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
  summaryCard: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 24,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryText: {
    fontSize: 13,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 12,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
