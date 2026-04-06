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
  FlatList,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as LucideIcons from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../src/constants/Colors';
import SuvixInput from '../src/components/SuvixInput';
import SuvixButton from '../src/components/SuvixButton';
import { useAuthStore } from '../src/store/useAuthStore';
import { api } from '../src/api/client';
import { CATEGORIES, PROVIDER_CATEGORIES, CLIENT_CATEGORIES } from '../src/constants/categories';
import { CategoryId } from '../src/types/category';

export default function RoleSelectionScreen() {
  const { token, name } = useLocalSearchParams<{ token: string; name: string }>();
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>('video_editor');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleFinalize = async () => {
    if (!phone) {
      Alert.alert('Incomplete Form', 'Please enter your mobile number to finalize registration.');
      return;
    }

    const category = CATEGORIES[selectedCategory];
    const baseRole = category.roleGroupId.toLowerCase(); // 'provider' -> 'editor' or 'client'

    setLoading(true);
    try {
      const response = await api.post('/auth/select-role', {
        token,
        role: baseRole === 'provider' ? 'editor' : 'client',
        phone,
        country: 'IN',
        metadata: {
          categoryId: selectedCategory
        }
      });

      if (response.data.success) {
        const { user, token: authToken } = response.data;
        // Inject categoryId into user object for frontend use
        const userWithCategory = { ...user, categoryId: selectedCategory };
        await setAuth(userWithCategory, authToken);
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to finalize registration.';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  const renderCategoryItem = (item: any) => {
    const isSelected = selectedCategory === item.id;
    // Map Lucide icon name to component
    const IconComponent = (LucideIcons as any)[item.icon.charAt(0).toUpperCase() + item.icon.slice(1)] || LucideIcons.HelpCircle;

    return (
      <TouchableOpacity 
        style={[
          styles.categoryCard, 
          isSelected && { borderColor: item.color || Colors.dark.primary, backgroundColor: Colors.white }
        ]} 
        onPress={() => setSelectedCategory(item.id)}
      >
        <View style={[styles.iconWrapper, { backgroundColor: isSelected ? (item.color || Colors.dark.primary) : Colors.dark.secondary }]}>
          <IconComponent size={24} color={isSelected ? Colors.white : Colors.dark.textSecondary} />
        </View>
        <Text style={[styles.categoryLabel, isSelected && styles.activeCategoryLabel]}>{item.label}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <Text style={styles.title}>Welcome, {name}!</Text>
              <Text style={styles.subtitle}>Select your professional category to get started.</Text>
            </View>

            <View style={styles.content}>
              <Text style={styles.sectionLabel}>Service Providers</Text>
              <View style={styles.grid}>
                {PROVIDER_CATEGORIES.map(cat => (
                  <View key={cat.id} style={styles.gridItem}>
                    {renderCategoryItem(cat)}
                  </View>
                ))}
              </View>

              <Text style={[styles.sectionLabel, { marginTop: 24 }]}>For Clients</Text>
              <View style={styles.grid}>
                {CLIENT_CATEGORIES.map(cat => (
                  <View key={cat.id} style={styles.gridItem}>
                    {renderCategoryItem(cat)}
                  </View>
                ))}
              </View>

              <View style={styles.footer}>
                <SuvixInput
                  label="Mobile Number"
                  placeholder="+91 00000 00000"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  icon={<Feather name="phone" color={Colors.dark.textSecondary} size={20} />}
                />

                <SuvixButton 
                  title="Complete Setup" 
                  onPress={handleFinalize} 
                  loading={loading}
                  style={styles.actionBtn}
                />
              </View>
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
  title: { color: Colors.white, fontSize: 26, fontWeight: '800', textAlign: 'center', marginBottom: 8 },
  subtitle: { color: Colors.dark.textSecondary, fontSize: 15, textAlign: 'center', fontWeight: '500', paddingHorizontal: 20 },
  content: { flex: 1 },
  sectionLabel: { color: Colors.dark.textSecondary, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 16, marginLeft: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6 },
  gridItem: { width: '50%', padding: 6 },
  categoryCard: { 
    backgroundColor: Colors.dark.secondary, 
    borderRadius: 20, 
    padding: 16, 
    alignItems: 'center', 
    borderWidth: 2, 
    borderColor: 'transparent',
    minHeight: 120,
    justifyContent: 'center'
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  categoryLabel: { color: Colors.dark.textSecondary, fontSize: 14, fontWeight: '700', textAlign: 'center' },
  activeCategoryLabel: { color: Colors.dark.primary },
  footer: { marginTop: 32 },
  actionBtn: { marginTop: 12 },
});
