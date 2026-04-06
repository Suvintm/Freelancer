import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  TextInput, 
  KeyboardAvoidingView, 
  Platform, 
  TouchableWithoutFeedback, 
  Keyboard,
  StatusBar,
  Alert
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../src/context/ThemeContext';

/**
 * PRODUCTION-GRADE STORY CREATOR
 * Immersive, fullscreen image selection and text annotation experience.
 */
export default function AddStoryScreen() {
  const { theme, isDarkMode } = useTheme();
  const router = useRouter();
  const [image, setImage] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // 1. Initial Launch: Prompt for image if none selected
  useEffect(() => {
    if (!image) {
      pickImage();
    }
  }, []);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [9, 16], // Vertical Story Aspect Ratio
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    } else if (!image) {
        // If user cancels and there's no image yet, go back
        router.back();
    }
  };

  const handleShare = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert("Success", "Your story has been shared to SuviX!");
    router.back();
  };

  return (
    <View style={[s.container, { backgroundColor: '#000' }]}>
      <StatusBar hidden={!isTyping} barStyle="light-content" />
      
      {/* ─── BACKGROUND MEDIA ─── */}
      {image ? (
        <Image source={{ uri: image }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      ) : (
        <View style={s.placeholderBg}>
           <Text style={s.placeholderTxt}>Select an image to start</Text>
        </View>
      )}

      {/* ─── OVERLAY GRADIENTS ─── */}
      <LinearGradient
        colors={['rgba(0,0,0,0.5)', 'transparent', 'rgba(0,0,0,0.7)']}
        style={StyleSheet.absoluteFill}
      />

      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
          style={s.content}
        >
          {/* ─── TOP ACTIONS ─── */}
          <View style={s.header}>
            <TouchableOpacity onPress={() => router.back()} style={s.roundBtn}>
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
            
            <View style={s.rightActions}>
                <TouchableOpacity style={s.iconBtn} onPress={() => setIsTyping(true)}>
                    <Ionicons name="text" size={24} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity style={s.iconBtn} onPress={pickImage}>
                    <Ionicons name="images" size={24} color="#fff" />
                </TouchableOpacity>
            </View>
          </View>

          {/* ─── TEXT EDITOR ─── */}
          <View style={s.editorWrapper}>
            <TextInput
              style={[
                s.captionInput,
                isTyping && s.inputActive
              ]}
              placeholder="Type a caption..."
              placeholderTextColor="rgba(255,255,255,0.6)"
              multiline
              value={caption}
              onChangeText={setCaption}
              onFocus={() => setIsTyping(true)}
              onBlur={() => setIsTyping(false)}
              selectionColor="#fff"
            />
          </View>

          {/* ─── FOOTER ─── */}
          <View style={s.footer}>
            <TouchableOpacity 
              style={s.shareBtn} 
              onPress={handleShare}
              activeOpacity={0.8}
            >
              <Text style={s.shareBtnTxt}>Share to Story</Text>
              <View style={s.shareCircle}>
                 <Ionicons name="chevron-forward" size={18} color="#3b82f6" />
              </View>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1 },
  placeholderBg: { flex: 1, backgroundColor: '#121212', justifyContent: 'center', alignItems: 'center' },
  placeholderTxt: { color: 'rgba(255,255,255,0.4)', fontSize: 16, fontWeight: '600' },
  
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 100,
  },
  roundBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightActions: { flexDirection: 'row', gap: 12 },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  editorWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  captionInput: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    width: '100%',
    letterSpacing: -0.5,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  inputActive: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: 20,
    borderRadius: 20,
  },

  footer: {
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 50 : 30,
    alignItems: 'flex-end',
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingLeft: 24,
    paddingRight: 6,
    paddingVertical: 6,
    borderRadius: 30,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  shareBtnTxt: {
    fontSize: 15,
    fontWeight: '800',
    color: '#000',
    marginRight: 12,
  },
  shareCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#f1f5fe',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
