import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../src/constants/Colors';
import SuvixInput from '../src/components/SuvixInput';
import SuvixButton from '../src/components/SuvixButton';
import { useAuthStore } from '../src/store/useAuthStore';
import api from '../src/services/api';

type UserRole = 'editor' | 'client';

export default function RoleSelectionScreen() {
  const { token, name } = useLocalSearchParams<{ token: string; name: string }>();
  const [role, setRole] = useState<UserRole>('editor');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleFinalize = async () => {
    if (!phone) {
      Alert.alert('Incomplete Form', 'Please enter your mobile number to finalize registration.');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/select-role', {
        token,
        role,
        phone,
        country: 'IN', // Default for now
      });

      if (response.data.success) {
        const { user, token: authToken } = response.data;
        await setAuth(user, authToken);
        // RootLayout will handle the redirect based on role
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to finalize registration.';
      Alert.alert('Error', message);
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
              <Text style={styles.title}>Welcome, {name}!</Text>
              <Text style={styles.subtitle}>Complete your profile to join the SuviX community.</Text>
            </View>

            <View style={styles.content}>
              <Text style={styles.label}>Choose your role</Text>
              <View style={styles.roleSelector}>
                <TouchableOpacity 
                  style={[styles.roleTab, role === 'editor' && styles.activeTab]} 
                  onPress={() => setRole('editor')}
                >
                  <Feather name="video" size={20} color={role === 'editor' ? Colors.dark.primary : Colors.dark.textSecondary} />
                  <Text style={[styles.roleText, role === 'editor' && styles.activeRoleText]}>I'm an Editor</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.roleTab, role === 'client' && styles.activeTab]} 
                  onPress={() => setRole('client')}
                >
                  <Feather name="briefcase" size={20} color={role === 'client' ? Colors.dark.primary : Colors.dark.textSecondary} />
                  <Text style={[styles.roleText, role === 'client' && styles.activeRoleText]}>I'm a Client</Text>
                </TouchableOpacity>
              </View>

              <SuvixInput
                label="Mobile Number"
                placeholder="+91 00000 00000"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                icon={<Feather name="phone" color={Colors.dark.textSecondary} size={20} />}
              />

              <SuvixButton 
                title="Finish Registration" 
                onPress={handleFinalize} 
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
  container: { flex: 1, backgroundColor: Colors.dark.primary },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingVertical: 40 },
  header: { marginBottom: 32, alignItems: 'center' },
  title: { color: Colors.white, fontSize: 28, fontWeight: '800', textAlign: 'center', marginBottom: 8 },
  subtitle: { color: Colors.dark.textSecondary, fontSize: 16, textAlign: 'center', fontWeight: '500' },
  content: { flex: 1 },
  label: { color: Colors.dark.textSecondary, fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, marginLeft: 4 },
  roleSelector: { flexDirection: 'row', backgroundColor: Colors.dark.secondary, padding: 6, borderRadius: 16, marginBottom: 24, borderWidth: 1, borderColor: Colors.dark.border },
  roleTab: { flex: 1, paddingVertical: 16, alignItems: 'center', borderRadius: 12, flexDirection: 'row', justifyContent: 'center' },
  activeTab: { backgroundColor: Colors.white },
  roleText: { color: Colors.dark.textSecondary, fontSize: 14, fontWeight: '700', marginLeft: 8 },
  activeRoleText: { color: Colors.dark.primary },
  actionBtn: { marginTop: 12 },
});
