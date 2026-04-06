import React, { useState, useEffect } from 'react';
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
  Image,
  Dimensions,
  Animated,
  StatusBar,
  Modal,
  
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../src/constants/Colors';
import SuvixInput from '../src/components/SuvixInput';
import SuvixButton from '../src/components/SuvixButton';
import { useAuthStore } from '../src/store/useAuthStore';
import { api } from '../src/api/client';
import { DUMMY_CATEGORY_LIST } from '../src/constants/dummy_categories';
import { CategoryId, CategoryConfig } from '../src/types/category';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 64) / 2;

export default function RoleSelectionScreen() {
  const { token, name } = useLocalSearchParams<{ token: string; name: string }>();
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | null>(null);
  const [infoCategory, setInfoCategory] = useState<CategoryConfig | null>(null);
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  
  const setAuth = useAuthStore((state) => state.setAuth);
  const router = useRouter();

  // Entrance Animations
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(20))[0];

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 800, useNativeDriver: true })
    ]).start();
  }, []);

  const handleImpact = (style = Haptics.ImpactFeedbackStyle.Light) => {
    Haptics.impactAsync(style);
  };

  const handleFinalize = async () => {
    if (!selectedCategory) {
      handleImpact(Haptics.ImpactFeedbackStyle.Medium);
      Alert.alert('Selection Required', 'Please choose a professional category to continue.');
      return;
    }

    if (!phone) {
      setIsFinalizing(true);
      return;
    }

    setLoading(true);
    try {
      handleImpact(Haptics.ImpactFeedbackStyle.Heavy);
      Alert.alert('Testing Mode', `Success! Selected: ${selectedCategory}. No redirection.`);
    } catch (error: any) {
      Alert.alert('Setup Failed', 'Could not finalize your professional path.');
    } finally {
      setLoading(false);
    }
  };

  const renderCategoryCard = (item: CategoryConfig, index: number) => {
    const isSelected = selectedCategory === item.id;
    const isSpecialClient = item.id === 'direct_client';
    
    return (
      <TouchableOpacity 
        key={item.id}
        activeOpacity={0.9}
        onPress={() => { handleImpact(); setSelectedCategory(item.id as CategoryId); }}
        style={[
          styles.card, 
          isSelected && styles.cardSelected,
          isSpecialClient && styles.specialClientCard
        ]}
      >
        <Image source={item.thumbnail} style={styles.cardImage} resizeMode="cover" />
        
        {/* Info Icon */}
        <TouchableOpacity 
          style={styles.infoIcon} 
          onPress={() => { handleImpact(Haptics.ImpactFeedbackStyle.Medium); setInfoCategory(item); }}
        >
          <Feather name="info" size={16} color="#FFF" />
        </TouchableOpacity>

        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.95)']}
          style={styles.cardOverlay}
        >
          <View style={styles.cardLabelContainer}>
            <Text style={styles.cardLabel} numberOfLines={1}>{item.label}</Text>
            {isSelected && (
              <View style={styles.selectedBadge}>
                <Feather name="check" size={10} color="#000" />
              </View>
            )}
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            
            <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
              <Image source={require('../assets/whitebglogo.png')} style={styles.logo} resizeMode="contain" />
              <Text style={styles.title}>Choose Your Path</Text>
              <Text style={styles.disclaimer}>Wisely choose your category by checking the info of each category on the respective category info icon</Text>
            </Animated.View>

            <View style={styles.grid}>
              {DUMMY_CATEGORY_LIST.sort((a, b) => a.id === 'direct_client' ? 1 : -1).map((cat, index) => renderCategoryCard(cat, index))}
            </View>

            <View style={{ height: 120 }} />
          </ScrollView>

          {/* FLOATING ACTION BOTTOM BAR */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,1)']}
            style={styles.bottomBar}
          >
            {isFinalizing ? (
              <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.finalForm}>
                <SuvixInput
                  small
                  label="Final Step: Mobile Number"
                  placeholder="+91 00000 00000"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  icon={<Feather name="phone" color={Colors.dark.textSecondary} size={16} />}
                />
                <SuvixButton 
                  title="Enter SuviX Ecosystem" 
                  onPress={handleFinalize} 
                  loading={loading}
                  style={styles.actionBtn}
                />
              </KeyboardAvoidingView>
            ) : (
              <TouchableOpacity 
                activeOpacity={0.8}
                onPress={handleFinalize}
                style={[styles.nextBtn, !selectedCategory && styles.btnDisabled]}
              >
                <Text style={styles.nextBtnText}>Continue</Text>
                <Feather name="chevron-right" size={20} color="#000" />
              </TouchableOpacity>
            )}
          </LinearGradient>

          {/* INFO MODAL */}
          <Modal
            visible={!!infoCategory}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setInfoCategory(null)}
          >
            <View style={styles.modalOverlay}>
              <TouchableOpacity style={styles.modalBlurClose} activeOpacity={1} onPress={() => setInfoCategory(null)} />
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{infoCategory?.label}</Text>
                  <TouchableOpacity onPress={() => setInfoCategory(null)}>
                    <Feather name="x" size={24} color="#FFF" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.modalInfo}>{infoCategory?.info}</Text>
                <SuvixButton 
                  title="Got it" 
                  onPress={() => setInfoCategory(null)}
                  style={styles.modalBtn}
                />
              </View>
            </View>
          </Modal>
        </View>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  scrollContent: { paddingHorizontal: 24, paddingTop: 10 },
  header: { alignItems: 'center', marginBottom: 20 },
  logo: { width: 90, height: 36, marginBottom: 8 },
  title: { color: '#FFF', fontSize: 26, fontWeight: '900', letterSpacing: -0.5 },
  disclaimer: { color: 'rgba(255,255,255,0.5)', fontSize: 11, textAlign: 'center', marginTop: 8, paddingHorizontal: 20, fontStyle: 'italic' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: {
    width: CARD_WIDTH,
    height: CARD_WIDTH * 1.05, // Smaller cards
    borderRadius: 16,
    backgroundColor: '#111',
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#222'
  },
  cardSelected: {
    borderColor: '#FFF',
    borderWidth: 2
  },
  specialClientCard: {
    borderColor: 'rgba(255,255,255,0.3)',
    borderStyle: 'dashed'
  },
  cardImage: { width: '100%', height: '100%', position: 'absolute' },
  infoIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)'
  },
  cardOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%', justifyContent: 'flex-end', padding: 10 },
  cardLabelContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardLabel: { color: '#FFF', fontSize: 13, fontWeight: '800' },
  selectedBadge: { width: 16, height: 16, borderRadius: 8, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center' },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 24, paddingBottom: 30, paddingTop: 30 },
  nextBtn: { backgroundColor: '#FFF', height: 52, borderRadius: 100, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  nextBtnText: { color: '#000', fontSize: 16, fontWeight: '800', marginRight: 8 },
  btnDisabled: { opacity: 0.5 },
  finalForm: { width: '100%' },
  actionBtn: { marginTop: 10, borderRadius: 100 },
  
  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalBlurClose: { ...StyleSheet.absoluteFillObject },
  modalContent: { width: '100%', backgroundColor: '#111', borderRadius: 24, padding: 24, borderWidth: 1, borderColor: '#333' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { color: '#FFF', fontSize: 20, fontWeight: '900' },
  modalInfo: { color: 'rgba(255,255,255,0.7)', fontSize: 15, lineHeight: 22, marginBottom: 24 },
  modalBtn: { borderRadius: 100 }
});
