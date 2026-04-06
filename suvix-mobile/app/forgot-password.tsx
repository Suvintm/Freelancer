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
  TouchableOpacity,
  useColorScheme,
  StatusBar
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../src/constants/Colors';
import SuvixInput from '../src/components/SuvixInput';
import SuvixButton from '../src/components/SuvixButton';
import { api } from '../src/api/client';

export default function ForgotPasswordScreen() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const isDark = colorScheme === 'dark';

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleResetRequest = async () => {
    if (!email) {
      Alert.alert('Email Required', 'Please enter your email to receive reset instructions.');
      return;
    }
    setLoading(true);
    try {
      const response = await api.post('/auth/forgot-password', {
        email: email.trim().toLowerCase(),
      });

      if (response.data.success) {
        Alert.alert(
          'Email Sent! 📧',
          'If an account exists with this email, you will receive instructions to reset your password.',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      }
    } catch (error: any) {
      console.error('❌ Forgot Password Error:', error.response?.data || error.message);
      const data = error.response?.data;
      const isSuspended = typeof data === 'string' && data.includes('Service Suspended');

      if (!error.response) {
        Alert.alert('Connection Error', 'Could not reach SuviX. Check your internet.');
      } else if (isSuspended) {
        Alert.alert('Service Suspended', 'The SuviX Backend is currently suspended by the hosting provider. Please check the dashboard.');
      } else {
        Alert.alert('Request Failed', 'Could not process your request. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.primary }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: theme.secondary }]}>
              <Feather name="arrow-left" size={24} color={theme.text} />
            </TouchableOpacity>

            <View style={styles.header}>
              <View style={[styles.iconContainer, { backgroundColor: theme.secondary }]}>
                <Feather name="mail" size={40} color={theme.accent} />
              </View>
              <Text style={[styles.title, { color: theme.text }]}>Reset Password</Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Enter your email address and we'll send you instructions to reset your password.</Text>
            </View>

            <View style={styles.form}>
              <SuvixInput
                label="Email Address"
                placeholder="name@example.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                icon={<Feather name="mail" size={20} />}
              />

              <SuvixButton 
                title="Send Instructions" 
                onPress={handleResetRequest} 
                loading={loading} 
                style={styles.actionBtn} 
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
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40 },
  backButton: { marginTop: 20, width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  header: { marginTop: 40, marginBottom: 40, alignItems: 'center' },
  iconContainer: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 26, fontWeight: '800', textAlign: 'center', marginBottom: 12 },
  subtitle: { fontSize: 15, textAlign: 'center', lineHeight: 22 },
  form: { flex: 1 },
  actionBtn: { height: 50, marginTop: 10 },
});
