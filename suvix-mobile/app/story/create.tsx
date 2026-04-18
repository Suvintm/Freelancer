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
  useWindowDimensions,
  ScrollView
} from 'react-native';
import { useFonts } from 'expo-font';
import { Inter_900Black } from '@expo-google-fonts/inter/900Black';
import { Pacifico_400Regular } from '@expo-google-fonts/pacifico/400Regular';
import { PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display/700Bold';
import { PlayfairDisplay_700Bold_Italic } from '@expo-google-fonts/playfair-display/700Bold_Italic';
import { Bangers_400Regular } from '@expo-google-fonts/bangers/400Regular';
import { SpecialElite_400Regular } from '@expo-google-fonts/special-elite/400Regular';
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
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { useSharedValue, runOnJS } from 'react-native-reanimated';
import ViewShot, { captureRef } from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';
import { useRef } from 'react';



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
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [editingObjectId, setEditingObjectId] = useState<string | null>(null);
  
  const [fontsLoaded] = useFonts({
    Inter_900Black,
    Pacifico_400Regular,
    PlayfairDisplay_700Bold,
    PlayfairDisplay_700Bold_Italic,
    Bangers_400Regular,
    SpecialElite_400Regular,
  });

  const FONT_OPTIONS: { id: StoryObject['fontStyle']; label: string; family: string }[] = [
    { id: 'Modern', label: 'Modern', family: 'Inter_900Black' },
    { id: 'Classic', label: 'Elegant', family: 'PlayfairDisplay_700Bold' },
    { id: 'Italic', label: 'Italic', family: 'PlayfairDisplay_700Bold_Italic' },
    { id: 'Neon', label: 'Neon', family: 'Inter_900Black' },
    { id: 'Typewriter', label: 'Mono', family: 'SpecialElite_400Regular' },
    { id: 'Cursive', label: 'Hand', family: 'Pacifico_400Regular' },
    { id: 'Comic', label: 'Punch', family: 'Bangers_400Regular' },
  ];
  const [isSaving, setIsSaving] = useState(false);
  const canvasRef = useRef<View>(null);

  // -- 🚀 GLOBAL GESTURE ENGINE SHARED VALUES --
  const activeX = useSharedValue(0);
  const activeY = useSharedValue(0);
  const activeScale = useSharedValue(1);
  const activeRotation = useSharedValue(0);

  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const startScale = useSharedValue(1);
  const startRotation = useSharedValue(0);


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
            handleSelectObject(newObj.id);
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
            handleSelectObject(newObj.id);
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

  const handleSaveToGallery = async () => {
    try {
        const { status: libStatus } = await MediaLibrary.requestPermissionsAsync();
        if (libStatus !== 'granted') {
            Alert.alert("Permission Error", "SuviX needs gallery access to save your stories.");
            return;
        }

        setIsSaving(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        // Allow UI to hide before snapshot
        setTimeout(async () => {
            const uri = await captureRef(canvasRef, {
                format: "jpg",
                quality: 1,
                result: "tmpfile",
            });

            const asset = await MediaLibrary.createAssetAsync(uri);
            const albumName = "SuviX Stories";
            const album = await MediaLibrary.getAlbumAsync(albumName);

            if (album === null) {
                await MediaLibrary.createAlbumAsync(albumName, asset, false);
            } else {
                await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
            }

            setIsSaving(false);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert("Success", "Story saved to your gallery!");
        }, 100);
    } catch (err) {
        console.error("[STORY] Save Error:", err);
        setIsSaving(false);
        Alert.alert("Error", "Could not save story to gallery.");
    }
  };

  const toggleFontStyle = () => {
    Haptics.selectionAsync();
    const styles: StoryObject['fontStyle'][] = ['Modern', 'Classic', 'Italic', 'Neon', 'Typewriter', 'Cursive', 'Comic'];
    const nextIndex = (styles.indexOf(selectedFont) + 1) % styles.length;
    setSelectedFont(styles[nextIndex]);
  };

  const handleAddText = () => {
      if (currentText.trim()) {
          if (editingObjectId) {
              // --- 🛰️ TEXT UPDATE ENGINE ---
              setObjects(prev => prev.map(obj => 
                  obj.id === editingObjectId 
                    ? { ...obj, content: currentText, fontStyle: selectedFont } 
                    : obj
              ));
              setEditingObjectId(null);
          } else {
              // --- 🚀 NEW TEXT CREATION ---
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
              handleSelectObject(newObj.id);
          }
          setCurrentText('');
          setActiveTextInput(false);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        setEditingObjectId(null);
        setActiveTextInput(false); // Close if empty
      }
  };

  const handleEditText = (id: string) => {
    const obj = objects.find(o => o.id === id);
    if (obj && obj.type === 'TEXT') {
        setCurrentText(obj.content);
        setSelectedFont(obj.fontStyle || 'Modern');
        setEditingObjectId(id);
        setActiveTextInput(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleFontSelect = (fontId: StoryObject['fontStyle']) => {
    setSelectedFont(fontId);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
    handleSelectObject(newObj.id);
  };
  const handleSelectObject = (id: string | null) => {
    if (selectedObjectId === id) return;
    
    // Sync PREVIOUSLY selected object before switching
    if (selectedObjectId) {
        saveObjectState(selectedObjectId, activeX.value, activeY.value, activeScale.value, activeRotation.value);
    }

    setSelectedObjectId(id);

    if (id) {
        // --- 🎭 AUTO-LAYERING (Bring to Front) ---
        // Move the selected object to the end of the array to render it on top
        setObjects(prev => {
            const index = prev.findIndex(o => o.id === id);
            if (index === -1) return prev;
            const newArr = [...prev];
            const [item] = newArr.splice(index, 1);
            newArr.push(item);
            return newArr;
        });

        const obj = objects.find(o => o.id === id);
        if (obj) {
            activeX.value = obj.x;
            activeY.value = obj.y;
            activeScale.value = obj.scale;
            activeRotation.value = obj.rotation;
        }
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const saveObjectState = (id: string, x: number, y: number, s: number, r: number) => {
    setObjects(prev => prev.map(obj => 
        obj.id === id ? { ...obj, x, y, scale: s, rotation: r } : obj
    ));
  };

  const handleDeleteObject = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setObjects(prev => prev.filter(obj => obj.id !== id));
    if (selectedObjectId === id) setSelectedObjectId(null);
  };

  // -- 🕹️ GLOBAL GESTURE HANDLERS --
  const panGesture = Gesture.Pan()
    .enabled(!!selectedObjectId)
    .onStart(() => {
        startX.value = activeX.value;
        startY.value = activeY.value;
    })
    .onUpdate((event) => {
        activeX.value = startX.value + event.translationX;
        activeY.value = startY.value + event.translationY;
    })
    .onEnd(() => {
        if (selectedObjectId) {
            runOnJS(saveObjectState)(selectedObjectId, activeX.value, activeY.value, activeScale.value, activeRotation.value);
        }
    });

  const pinchGesture = Gesture.Pinch()
    .enabled(!!selectedObjectId)
    .onStart(() => {
        startScale.value = activeScale.value;
    })
    .onUpdate((event) => {
        activeScale.value = startScale.value * event.scale;
    })
    .onEnd(() => {
        if (selectedObjectId) {
            runOnJS(saveObjectState)(selectedObjectId, activeX.value, activeY.value, activeScale.value, activeRotation.value);
        }
    });

  const rotationGesture = Gesture.Rotation()
    .enabled(!!selectedObjectId)
    .onStart(() => {
        startRotation.value = activeRotation.value;
    })
    .onUpdate((event) => {
        activeRotation.value = startRotation.value + event.rotation;
    })
    .onEnd(() => {
        if (selectedObjectId) {
            runOnJS(saveObjectState)(selectedObjectId, activeX.value, activeY.value, activeScale.value, activeRotation.value);
        }
    });

  const globalGestures = Gesture.Simultaneous(panGesture, Gesture.Simultaneous(pinchGesture, rotationGesture));
  const bgTapGesture = Gesture.Tap().onEnd(() => {
      runOnJS(handleSelectObject)(null);
  });

  // REMOVED: PICKER fallback. Screen is always in EDIT mode.
 
  // --- 🛡️ FONT RENDERING GUARD ---
  if (!fontsLoaded) {
      return (
          <View style={[s.container, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }]}>
              <ActivityIndicator size="large" color="#fff" />
              <Text style={{ color: '#fff', marginTop: 12, fontWeight: '600' }}>Initializing Creative Suite...</Text>
          </View>
      );
  }

  return (
    <View style={[s.container, { backgroundColor: theme.primary }]}>
      <StatusBar hidden={activeTextInput} barStyle={isDarkMode ? "light-content" : "dark-content"} />
      
      {/* ─── INFINITY BACKGROUND GRADIENT (Subtle Darkening) ─── */}
      <LinearGradient
        colors={[isDarkMode ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.2)', 'transparent', isDarkMode ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.4)']}
        style={StyleSheet.absoluteFill}
      />

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={s.content}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={{ flex: 1 }}>
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
                   onPress={() => setShowStickerPicker(true)}
                   style={[s.glassBtn, { backgroundColor: theme.secondary, borderColor: theme.border }]}
                >
                  <Ionicons name="happy-outline" size={24} color={theme.text} />
                </TouchableOpacity>

                <TouchableOpacity 
                   onPress={() => setActiveTextInput(true)}
                   style={[s.glassBtn, { backgroundColor: theme.secondary, borderColor: theme.border }]}
                >
                  <Ionicons name="text" size={24} color={theme.text} />
                </TouchableOpacity>
              </View>
            </View>

            {/* 🕹️ SIDEBAR TOOLS (Vertical Right) */}
            <View style={[s.sidebar, { top: insets.top + 80 }]}>
                <TouchableOpacity 
                   onPress={handleSaveToGallery} 
                   style={[s.glassBtn, { backgroundColor: theme.secondary, borderColor: theme.border, marginBottom: 16 }]}
                   disabled={isSaving}
                >
                  <Ionicons name={isSaving ? "sync-outline" : "download-outline"} size={22} color={theme.text} />
                </TouchableOpacity>

                <TouchableOpacity 
                   onPress={handleAddPhoto} 
                   style={[s.glassBtn, { backgroundColor: theme.secondary, borderColor: theme.border }]}
                >
                  <Ionicons name="images-outline" size={22} color={theme.text} />
                </TouchableOpacity>
            </View>

            {/* 🎨 INFINITY CANVAS ENGINE */}
            <View style={s.canvasWrapper}>
                <ViewShot ref={canvasRef} options={{ format: "jpg", quality: 0.9 }}>
                    <GestureDetector gesture={Gesture.Exclusive(globalGestures, bgTapGesture)}>
                        <View style={[s.canvas, { width: canvasWidth, height: canvasHeight, backgroundColor: canvasBg }]}>
                            
                            {objects.length === 0 && !activeTextInput && (
                                <View style={s.editorWrapper}>
                                    <View style={[s.hubIconBox, { backgroundColor: 'rgba(255,255,255,0.1)', marginBottom: 12 }]}>
                                        <Ionicons name="images" size={28} color="#fff" />
                                    </View>
                                    <Text style={s.hubBtnTxt}>Add Media</Text>
                                </View>
                            )}

                            {/* INTERACTIVE OBJECTS LAYER */}
                            {objects.map((obj) => (
                                <DraggableItem 
                                  key={obj.id}
                                  isSelected={!isSaving && selectedObjectId === obj.id}
                                  onSelect={() => handleSelectObject(obj.id)}
                                  onDelete={() => handleDeleteObject(obj.id)}
                                  onEdit={obj.type === 'TEXT' ? () => handleEditText(obj.id) : undefined}
                                  // --- GLOBAL CONTROL BRIDGE ---
                                  activeX={obj.id === selectedObjectId ? activeX : undefined}
                                  activeY={obj.id === selectedObjectId ? activeY : undefined}
                                  activeScale={obj.id === selectedObjectId ? activeScale : undefined}
                                  activeRotation={obj.id === selectedObjectId ? activeRotation : undefined}
                                  // Passed initial pure state
                                  initialX={obj.x}
                                  initialY={obj.y}
                                >
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
                    </GestureDetector>
                </ViewShot>
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
          </View>
        </TouchableWithoutFeedback>

        {/* 📝 TEXT INPUT MODAL OVERLAY */}
        {activeTextInput && (
            <View style={[StyleSheet.absoluteFill, s.textInputOverlay]}>
                <View style={[s.textInputHeader, { marginTop: insets.top }]}>
                  <TouchableOpacity onPress={toggleFontStyle} style={s.fontStyleBtn}>
                      <Text style={[
                          s.fontStyleBtnTxt, 
                          { fontFamily: FONT_OPTIONS.find(f => f.id === selectedFont)?.family || 'System' }
                      ]}>
                          {FONT_OPTIONS.find(f => f.id === selectedFont)?.label}
                      </Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleAddText}>
                      <Text style={s.doneBtnTxt}>Done</Text>
                  </TouchableOpacity>
                </View>
                
                  <View style={s.textInputCenter}>
                      <TextInput
                          autoFocus
                          style={[
                              s.captionInput, 
                              { 
                                  color: '#fff', 
                                  fontFamily: FONT_OPTIONS.find(f => f.id === selectedFont)?.family || 'System' 
                              },
                              selectedFont === 'Neon' && {
                                  textShadowColor: 'rgba(255, 255, 255, 0.8)',
                                  textShadowOffset: { width: 0, height: 0 },
                                  textShadowRadius: 15,
                              }
                          ]}
                          value={currentText}
                          onChangeText={setCurrentText}
                          placeholder="Type something..."
                          placeholderTextColor="rgba(255,255,255,0.4)"
                          multiline
                      />
                  </View>

                {/* 🕹️ HORIZONTAL FONT PICKER (Instagram-Style) */}
                <View style={s.fontPickerWrapper}>
                    <ScrollView 
                        horizontal 
                        showsHorizontalScrollIndicator={false}
                        keyboardShouldPersistTaps="always"
                        decelerationRate="fast"
                        snapToInterval={80}
                        snapToAlignment="center"
                        nestedScrollEnabled={true}
                        contentContainerStyle={s.fontPickerScroll}
                    >
                        {FONT_OPTIONS.map((f) => (
                            <TouchableOpacity 
                                key={f.id}
                                onPress={() => setSelectedFont(f.id)}
                                style={[
                                    s.fontBubble,
                                    selectedFont === f.id && s.fontBubbleActive,
                                    { marginRight: 12 }
                                ]}
                            >
                                <Text 
                                  style={[
                                      s.fontBubbleTxt, 
                                      { fontFamily: f.family },
                                      selectedFont === f.id && { color: '#000' }
                                  ]}
                                >
                                    {f.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
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
  sidebar: {
    position: 'absolute',
    right: 20,
    zIndex: 100,
    alignItems: 'center',
  },
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
    fontSize: 13,
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
  fontPickerWrapper: {
    height: 60,
    width: '100%',
    zIndex: 2000,
  },
  fontPickerScroll: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  fontBubble: {
    height: 44,
    minWidth: 44,
    paddingHorizontal: 16,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  fontBubbleActive: {
    backgroundColor: '#fff',
    borderColor: '#fff',
  },
  fontBubbleTxt: {
    color: '#fff',
    fontSize: 14,
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
  sidebar: {
    position: 'absolute',
    left: 20,
    zIndex: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
