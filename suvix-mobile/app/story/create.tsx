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
  Alert,
  ActivityIndicator,
  useWindowDimensions
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../src/context/ThemeContext';
import { StoryObject, StoryObjectType } from '../../src/modules/story/types';
import { DraggableItem } from '../../src/modules/story/components/DraggableItem';
import { CanvasTextItem } from '../../src/modules/story/components/CanvasTextItem';
import { CanvasStickerItem } from '../../src/modules/story/components/CanvasStickerItem';
import { CanvasImageItem } from '../../src/modules/story/components/CanvasImageItem';



/**
 * 🎨 SUVI X INFINITY CANVAS (PHASE 1 - STABLE)
 * High-fidelity story creation hub with Gallery First workflow
 * and professionalized typography layouts.
 */

type EditorMode = 'PICKER' | 'EDIT' | 'PREVIEW';
type TextLayout = 'CENTER' | 'TOP' | 'BOTTOM';

export default function AddStoryScreen() {
  const { theme, isDarkMode } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  
  // -- Responsive Canvas Calculus --
  const availableWidth = screenWidth - insets.left - insets.right;
  const availableHeight = screenHeight - insets.top - insets.bottom;
  
  const canvasRatio = 9 / 16;
  
  // Calculate full-width dimensions
  let canvasWidth = screenWidth;
  let canvasHeight = screenWidth * (1/canvasRatio);

  // Safety check: scale down if it exceeds vertical capacity
  if (canvasHeight > availableHeight) {
      canvasHeight = availableHeight;
      canvasWidth = canvasHeight * canvasRatio;
  }

  const [isUploading, setIsUploading] = useState(false);

  // -- Canvas Engine State --
  const [objects, setObjects] = useState<StoryObject[]>([]);
  const [activeTextInput, setActiveTextInput] = useState(false);
  const [currentText, setCurrentText] = useState('');
  const [selectedFont, setSelectedFont] = useState<StoryObject['fontStyle']>('Modern');
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [canvasBg, setCanvasBg] = useState('#000000');
  const [bgIndex, setBgIndex] = useState(0);

  const BG_PRESETS = [
    '#000000', // Default Black
    '#1A1A1A', // Deep Grey
    '#FF3040', // SuviX Red
    '#3897f0', // Social Blue
    '#5851DB', // Purple
    '#833AB4', // Royal Purple
    '#F56040', // Orange
    '#121212'  // OLED Black
  ];

  const [status, requestPermission] = ImagePicker.useMediaLibraryPermissions();

  // REMOVED: Auto-launch gallery on mount. Landing directly on Canvas.

  const handleAddPhoto = async () => {
    try {
        if (status?.status !== ImagePicker.PermissionStatus.GRANTED) {
            const permission = await requestPermission();
            if (!permission.granted) {
                Alert.alert("Permission Required", "SuviX needs access to your gallery to add photos.");
                return;
            }
        }

        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [9, 16],
          quality: 1,
        });

        if (!result.canceled) {
            const newObj: StoryObject = {
                id: Date.now().toString(),
                type: 'IMAGE',
                content: result.assets[0].uri,
                x: 0,
                y: 0,
                scale: 1,
                rotation: 0,
            };
            setObjects(prev => [...prev, newObj]);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
    } catch (err) {
        console.error("[STORY] Photo Add Error:", err);
        Alert.alert("Error", "Could not add photo. Please try again.");
    }
  };

  const handleCapturePhoto = async () => {
    try {
        const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
        if (!cameraPermission.granted) {
            Alert.alert("Permission Required", "SuviX needs camera access for live pictures.");
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [9, 16],
            quality: 1,
        });

        if (!result.canceled) {
            const newObj: StoryObject = {
                id: Date.now().toString(),
                type: 'IMAGE',
                content: result.assets[0].uri,
                x: 0,
                y: 0,
                scale: 1,
                rotation: 0,
            };
            setObjects(prev => [...prev, newObj]);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
    } catch (err) {
        console.error("[STORY] Camera Error:", err);
        Alert.alert("Error", "Could not launch camera.");
    }
  };

  const cycleBg = () => {
    Haptics.selectionAsync();
    const nextIdx = (bgIndex + 1) % BG_PRESETS.length;
    setBgIndex(nextIdx);
    setCanvasBg(BG_PRESETS[nextIdx]);
  };

  const handleShare = async () => {
    setIsUploading(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    // Simulate professional processing
    setTimeout(() => {
        Alert.alert("SuviX Story", "Shared successfully to your Infinity Feed!");
        router.back();
    }, 1500);
  };

  const toggleFontStyle = () => {
    Haptics.selectionAsync();
    const styles: StoryObject['fontStyle'][] = ['Modern', 'Classic', 'Neon', 'Typewriter'];
    const nextIndex = (styles.indexOf(selectedFont) + 1) % styles.length;
    setSelectedFont(styles[nextIndex]);
  };

  const handleAddText = () => {
      if (currentText.trim()) {
          const newObj: StoryObject = {
              id: Date.now().toString(),
              type: 'TEXT',
              content: currentText,
              x: 0,
              y: 0,
              scale: 1,
              rotation: 0,
              fontStyle: selectedFont,
          };
          setObjects(prev => [...prev, newObj]);
          setCurrentText('');
          setActiveTextInput(false);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        setActiveTextInput(true);
      }
  };

  const handleAddSticker = (stickerId: string) => {
    const newObj: StoryObject = {
        id: Date.now().toString(),
        type: 'STICKER',
        content: stickerId,
        x: 0,
        y: 0,
        scale: 1,
        rotation: 0,
    };
    setObjects(prev => [...prev, newObj]);
    setShowStickerPicker(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  // REMOVED: PICKER fallback. Screen is always in EDIT mode.

  return (
    <View style={[s.container, { backgroundColor: theme.primary }]}>
      <StatusBar hidden={activeTextInput} barStyle={isDarkMode ? "light-content" : "dark-content"} />
      
      {/* ─── INFINITY BACKGROUND GRADIENT (Subtle Darkening) ─── */}
      <LinearGradient
        colors={[isDarkMode ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.2)', 'transparent', isDarkMode ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.4)']}
        style={StyleSheet.absoluteFill}
      />

      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
          style={s.content}
        >
          {/* 🛠️ NAVIGATION & TOOLS */}
          <View style={[s.header, { marginTop: insets.top }]}>
            <TouchableOpacity onPress={() => router.back()} style={[s.glassBtn, { backgroundColor: theme.secondary, borderColor: theme.border }]}>
              <Ionicons name="close" size={24} color={theme.text} />
            </TouchableOpacity>

            <View style={s.rightActions}>
              <TouchableOpacity 
                style={[s.glassBtn, { backgroundColor: theme.secondary, borderColor: theme.border }]} 
                onPress={cycleBg}
              >
                <Text style={{ color: theme.text, fontWeight: '900', fontSize: 10 }}>BG</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[s.glassBtn, { backgroundColor: theme.secondary, borderColor: theme.border }]} 
                onPress={() => setActiveTextInput(true)}
              >
                <MaterialCommunityIcons name="format-text" size={24} color={theme.text} />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[s.glassBtn, { backgroundColor: theme.secondary, borderColor: theme.border }]} 
                onPress={() => setShowStickerPicker(true)}
              >
                <Ionicons name="happy" size={22} color={theme.text} />
              </TouchableOpacity>

              <TouchableOpacity 
                style={[s.glassBtn, { backgroundColor: theme.secondary, borderColor: theme.border }]} 
                onPress={handleAddPhoto} 
              >
                <Ionicons name="images" size={20} color={theme.text} />
              </TouchableOpacity>
            </View>
          </View>

          {/* 🎨 9:16 INFINITY CANVAS ENGINE */}
          <View style={s.canvasWrapper}>
            <View style={[s.canvas, { width: canvasWidth, height: canvasHeight, backgroundColor: canvasBg, borderRadius: canvasWidth === screenWidth ? 0 : 24 }]}>
                
                {/* 🎯 EMPTY STATE HUB (Guides User) */}
                {objects.length === 0 && (
                    <View style={s.emptyHub}>
                        <TouchableOpacity style={s.hubBtn} onPress={handleAddPhoto} activeOpacity={0.8}>
                            <View style={s.hubIconBox}>
                                <Ionicons name="images" size={28} color="#fff" />
                            </View>
                            <Text style={s.hubBtnTxt}>Add Media</Text>
                        </TouchableOpacity>

                        <View style={s.hubDivider} />

                        <TouchableOpacity style={s.hubBtn} onPress={handleCapturePhoto} activeOpacity={0.8}>
                            <View style={[s.hubIconBox, { backgroundColor: '#FF3040' }]}>
                                <Ionicons name="camera" size={28} color="#fff" />
                            </View>
                            <Text style={s.hubBtnTxt}>Live Picture</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* INTERACTIVE OBJECTS LAYER */}
                {objects.map((obj) => (
                    <DraggableItem key={obj.id}>
                        {obj.type === 'TEXT' ? (
                            <CanvasTextItem item={obj} />
                        ) : obj.type === 'STICKER' ? (
                            <CanvasStickerItem item={obj} />
                        ) : (
                            <CanvasImageItem item={obj} />
                        )}
                    </DraggableItem>
                ))}
            </View>
          </View>

          {/* 🚀 ACTION FOOTER */}
          {!activeTextInput && !showStickerPicker && (
            <View style={[s.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
                <TouchableOpacity 
                    style={[s.shareBtn, { backgroundColor: '#FF3040' }]} 
                    onPress={handleShare}
                    disabled={isUploading}
                    activeOpacity={0.8}
                >
                {isUploading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <>
                    <Text style={s.shareBtnTxt}>Share Story</Text>
                    <View style={s.shareCircle}>
                        <Ionicons name="send" size={14} color="#FF3040" />
                    </View>
                    </>
                )}
                </TouchableOpacity>
            </View>
          )}

          {/* 📝 TEXT INPUT MODAL OVERLAY */}
          {activeTextInput && (
              <View style={[StyleSheet.absoluteFill, s.textInputOverlay]}>
                  <View style={[s.textInputHeader, { marginTop: insets.top }]}>
                    <TouchableOpacity onPress={toggleFontStyle} style={s.fontStyleBtn}>
                        <Text style={s.fontStyleBtnTxt}>{selectedFont}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleAddText}>
                        <Text style={s.doneBtnTxt}>Done</Text>
                    </TouchableOpacity>
                  </View>
                  
                  <View style={s.textInputCenter}>
                    <TextInput
                        autoFocus
                        style={[s.captionInput, { color: '#fff' }]}
                        value={currentText}
                        onChangeText={setCurrentText}
                        placeholder="Type something..."
                        placeholderTextColor="rgba(255,255,255,0.4)"
                        multiline
                    />
                  </View>
              </View>
          )}

          {/* ☺ STICKER PICKER OVERLAY */}
          {showStickerPicker && (
              <View style={[StyleSheet.absoluteFill, s.stickerPicker]}>
                   <View style={[s.stickerHeader, { marginTop: insets.top }]}>
                        <TouchableOpacity onPress={() => setShowStickerPicker(false)}>
                            <Ionicons name="chevron-down" size={32} color="#fff" />
                        </TouchableOpacity>
                   </View>
                   <View style={s.stickerGrid}>
                        {['heart', 'star', 'fire', 'verified', 'happy'].map(id => (
                            <TouchableOpacity key={id} onPress={() => handleAddSticker(id)} style={s.stickerBox}>
                                {id === 'heart' && <Ionicons name="heart" size={40} color="#FF3040" />}
                                {id === 'star' && <Ionicons name="star" size={40} color="#FFD700" />}
                                {id === 'fire' && <MaterialCommunityIcons name="fire" size={40} color="#FF4500" />}
                                {id === 'verified' && <MaterialCommunityIcons name="check-decagram" size={40} color="#3897f0" />}
                                {id === 'happy' && <Ionicons name="happy" size={40} color="#fff" />}
                            </TouchableOpacity>
                        ))}
                   </View>
              </View>
          )}
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1 },
  placeholderTxt: { color: 'rgba(255,255,255,0.5)', fontSize: 16, textAlign: 'center' },
  header: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 100,
    height: 60,
  },
  glassBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  rightActions: { flexDirection: 'row', gap: 12 },
  canvasWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  canvas: {
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 20,
  },
  editorWrapper: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  captionInput: {
    fontSize: 32,
    fontWeight: '900',
    textAlign: 'center',
    width: '100%',
    letterSpacing: -1,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  inputActive: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 20,
    borderRadius: 20,
  },
  footer: {
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 24,
    paddingRight: 6,
    paddingVertical: 6,
    borderRadius: 30,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  shareBtnTxt: {
    fontSize: 15,
    fontWeight: '900',
    color: '#fff',
    marginRight: 12,
  },
  shareCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textInputOverlay: {
    backgroundColor: 'rgba(0,0,0,0.85)',
    zIndex: 1000,
  },
  textInputHeader: {
    height: 60,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fontStyleBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  fontStyleBtnTxt: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 13,
    textTransform: 'uppercase',
  },
  doneBtnTxt: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 18,
  },
  textInputCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  stickerPicker: {
    backgroundColor: 'rgba(0,0,0,0.9)',
    zIndex: 1000,
  },
  stickerHeader: {
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 20,
    padding: 20,
  },
  stickerBox: {
    width: 80,
    height: 80,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyHub: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  hubBtn: {
    alignItems: 'center',
    width: 140,
  },
  hubIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  hubBtnTxt: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  hubDivider: {
    height: 1,
    width: 40,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginVertical: 30,
  },
});
