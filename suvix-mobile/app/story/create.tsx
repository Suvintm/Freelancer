import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  StatusBar,
  Alert,
  ActivityIndicator,
  useWindowDimensions,
  ScrollView,
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
import { StoryObject } from '../../src/modules/story/types';
import { DraggableItem } from '../../src/modules/story/components/DraggableItem';
import { CanvasTextItem } from '../../src/modules/story/components/CanvasTextItem';
import { CanvasStickerItem } from '../../src/modules/story/components/CanvasStickerItem';
import { CanvasImageItem } from '../../src/modules/story/components/CanvasImageItem';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { useSharedValue, runOnJS } from 'react-native-reanimated';
import ViewShot, { captureRef } from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';

// ── Constants ────────────────────────────────────────────────────────────────

const TEXT_COLORS = [
  '#FFFFFF', '#000000', '#FF3040', '#FFD700',
  '#3897f0', '#00C875', '#FF6B35', '#FF00FF',
  '#C0C0C0', '#00FFFF', '#FFA500', '#8B00FF',
];

const BG_PRESETS = [
  '#000000', '#1A1A1A', '#FF3040', '#3897f0',
  '#5851DB', '#833AB4', '#F56040', '#121212',
];

const ALIGN_CYCLE: StoryObject['textAlign'][] = ['center', 'left', 'right'];

// ── Component ─────────────────────────────────────────────────────────────────

export default function AddStoryScreen() {
  const { theme, isDarkMode } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  // Responsive canvas
  const canvasRatio = 9 / 16;
  let canvasWidth = screenWidth;
  let canvasHeight = screenWidth * (1 / canvasRatio);
  const availableHeight = screenHeight - insets.top - insets.bottom;
  if (canvasHeight > availableHeight) {
    canvasHeight = availableHeight;
    canvasWidth = canvasHeight * canvasRatio;
  }

  // ── Core state ──
  const [objects, setObjects] = useState<StoryObject[]>([]);
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [editingObjectId, setEditingObjectId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Canvas background
  const [canvasBg, setCanvasBg] = useState('#000000');
  const [bgIndex, setBgIndex] = useState(0);

  // Text editor state
  const [activeTextInput, setActiveTextInput] = useState(false);
  const [currentText, setCurrentText] = useState('');
  const [selectedFont, setSelectedFont] = useState<StoryObject['fontStyle']>('Modern');
  const [textColor, setTextColor] = useState('#FFFFFF');
  const [textBg, setTextBg] = useState(false);
  const [selectedAlign, setSelectedAlign] = useState<StoryObject['textAlign']>('center');

  // Sticker picker
  const [showStickerPicker, setShowStickerPicker] = useState(false);

  // ── History (Undo) ──────────────────────────────────────────────────────────
  const historyRef = useRef<StoryObject[][]>([]);
  const objectsRef = useRef<StoryObject[]>(objects);
  useEffect(() => { objectsRef.current = objects; }, [objects]);

  const pushHistory = useCallback(() => {
    historyRef.current = [
      ...historyRef.current.slice(-20),
      objectsRef.current.map(o => ({ ...o })),
    ];
  }, []);

  const handleUndo = useCallback(() => {
    if (historyRef.current.length === 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    const prev = historyRef.current[historyRef.current.length - 1];
    historyRef.current = historyRef.current.slice(0, -1);
    setObjects(prev);
    setSelectedObjectId(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  // ── Fonts ──
  const [fontsLoaded] = useFonts({
    Inter_900Black,
    Pacifico_400Regular,
    PlayfairDisplay_700Bold,
    PlayfairDisplay_700Bold_Italic,
    Bangers_400Regular,
    SpecialElite_400Regular,
  });

  const FONT_OPTIONS: { id: StoryObject['fontStyle']; label: string; family: string }[] = [
    { id: 'Modern',     label: 'Modern',  family: 'Inter_900Black' },
    { id: 'Classic',    label: 'Elegant', family: 'PlayfairDisplay_700Bold' },
    { id: 'Italic',     label: 'Italic',  family: 'PlayfairDisplay_700Bold_Italic' },
    { id: 'Neon',       label: 'Neon',    family: 'Inter_900Black' },
    { id: 'Typewriter', label: 'Mono',    family: 'SpecialElite_400Regular' },
    { id: 'Cursive',    label: 'Hand',    family: 'Pacifico_400Regular' },
    { id: 'Comic',      label: 'Punch',   family: 'Bangers_400Regular' },
  ];

  // ── Canvas ref ──
  const canvasRef = useRef<View>(null);

  // ── Global gesture shared values ──
  const activeX        = useSharedValue(0);
  const activeY        = useSharedValue(0);
  const activeScale    = useSharedValue(1);
  const activeRotation = useSharedValue(0);
  const activeWidth    = useSharedValue(screenWidth * 0.8);
  const isResizing     = useSharedValue(false);
  const startX         = useSharedValue(0);
  const startY         = useSharedValue(0);
  const startScale     = useSharedValue(1);
  const startRotation  = useSharedValue(0);

  // ── Permission ──
  const [mediaStatus, requestMediaPermission] = ImagePicker.useMediaLibraryPermissions();

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handleAddPhoto = async () => {
    try {
      if (mediaStatus?.status !== ImagePicker.PermissionStatus.GRANTED) {
        const perm = await requestMediaPermission();
        if (!perm.granted) {
          Alert.alert('Permission Required', 'SuviX needs gallery access to add photos.');
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
        pushHistory();
        const newObj: StoryObject = {
          id: Date.now().toString(), type: 'IMAGE',
          content: result.assets[0].uri,
          x: 0, y: 0, scale: 1, rotation: 0,
        };
        setObjects(prev => [...prev, newObj]);
        handleSelectObject(newObj.id);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (err) {
      console.error('[STORY] Photo Add Error:', err);
      Alert.alert('Error', 'Could not add photo. Please try again.');
    }
  };

  const handleCapturePhoto = async () => {
    try {
      const camPerm = await ImagePicker.requestCameraPermissionsAsync();
      if (!camPerm.granted) {
        Alert.alert('Permission Required', 'SuviX needs camera access.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [9, 16],
        quality: 1,
      });
      if (!result.canceled) {
        pushHistory();
        const newObj: StoryObject = {
          id: Date.now().toString(), type: 'IMAGE',
          content: result.assets[0].uri,
          x: 0, y: 0, scale: 1, rotation: 0,
        };
        setObjects(prev => [...prev, newObj]);
        handleSelectObject(newObj.id);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    } catch (err) {
      console.error('[STORY] Camera Error:', err);
      Alert.alert('Error', 'Could not launch camera.');
    }
  };

  const cycleBg = () => {
    Haptics.selectionAsync();
    const next = (bgIndex + 1) % BG_PRESETS.length;
    setBgIndex(next);
    setCanvasBg(BG_PRESETS[next]);
  };

  const cycleAlignment = () => {
    Haptics.selectionAsync();
    setSelectedAlign(prev => {
      const i = ALIGN_CYCLE.indexOf(prev ?? 'center');
      return ALIGN_CYCLE[(i + 1) % ALIGN_CYCLE.length];
    });
  };

  const toggleFontStyle = () => {
    Haptics.selectionAsync();
    const styles: StoryObject['fontStyle'][] = [
      'Modern', 'Classic', 'Italic', 'Neon', 'Typewriter', 'Cursive', 'Comic',
    ];
    setSelectedFont(prev => {
      const next = (styles.indexOf(prev!) + 1) % styles.length;
      return styles[next];
    });
  };

  const handleShare = async () => {
    setIsUploading(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => {
      Alert.alert('SuviX Story', 'Shared successfully to your Infinity Feed!');
      router.back();
    }, 1500);
  };

  const handleSaveToGallery = async () => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Error', 'SuviX needs gallery access to save stories.');
        return;
      }
      setIsSaving(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setTimeout(async () => {
        try {
          const uri = await captureRef(canvasRef, { format: 'jpg', quality: 1, result: 'tmpfile' });
          const asset = await MediaLibrary.createAssetAsync(uri);
          const albumName = 'SuviX Stories';
          const album = await MediaLibrary.getAlbumAsync(albumName);
          if (album === null) {
            await MediaLibrary.createAlbumAsync(albumName, asset, false);
          } else {
            await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
          }
          setIsSaving(false);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Alert.alert('Saved!', 'Story saved to SuviX Stories album.');
        } catch (inner) {
          setIsSaving(false);
          Alert.alert('Error', 'Could not save story.');
        }
      }, 120);
    } catch (err) {
      console.error('[STORY] Save Error:', err);
      setIsSaving(false);
    }
  };

  const handleAddText = () => {
    if (!currentText.trim()) {
      setEditingObjectId(null);
      setActiveTextInput(false);
      return;
    }
    pushHistory();
    if (editingObjectId) {
      setObjects(prev => prev.map(obj =>
        obj.id === editingObjectId
          ? {
              ...obj,
              content: currentText,
              fontStyle: selectedFont,
              color: textColor,
              textBackground: textBg,
              textAlign: selectedAlign,
              width: activeWidth.value,
            }
          : obj,
      ));
      setEditingObjectId(null);
    } else {
      const newObj: StoryObject = {
        id: Date.now().toString(),
        type: 'TEXT',
        content: currentText,
        x: 0, y: 0, scale: 1, rotation: 0,
        fontStyle: selectedFont,
        color: textColor,
        textBackground: textBg,
        textAlign: selectedAlign,
        width: screenWidth * 0.8,
      };
      setObjects(prev => [...prev, newObj]);
      handleSelectObject(newObj.id);
    }
    setCurrentText('');
    setActiveTextInput(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleEditText = (id: string) => {
    const obj = objects.find(o => o.id === id);
    if (obj && obj.type === 'TEXT') {
      setCurrentText(obj.content);
      setSelectedFont(obj.fontStyle || 'Modern');
      setTextColor(obj.color || '#FFFFFF');
      setTextBg(obj.textBackground || false);
      setSelectedAlign(obj.textAlign || 'center');
      setEditingObjectId(id);
      setActiveTextInput(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleAddSticker = (stickerId: string) => {
    pushHistory();
    const newObj: StoryObject = {
      id: Date.now().toString(), type: 'STICKER',
      content: stickerId,
      x: 0, y: 0, scale: 1, rotation: 0,
    };
    setObjects(prev => [...prev, newObj]);
    setShowStickerPicker(false);
    handleSelectObject(newObj.id);
  };

  const handleSelectObject = (id: string | null) => {
    if (selectedObjectId === id) return;

    if (selectedObjectId) {
      saveObjectState(
        selectedObjectId,
        activeX.value, activeY.value,
        activeScale.value, activeRotation.value,
        activeWidth.value,
      );
    }

    if (id) {
      setObjects(prev => {
        const idx = prev.findIndex(o => o.id === id);
        if (idx === -1) return prev;
        const arr = [...prev];
        const [item] = arr.splice(idx, 1);
        arr.push(item);
        return arr;
      });

      const target = objects.find(o => o.id === id);
      if (target) {
        activeX.value        = target.x;
        activeY.value        = target.y;
        activeScale.value    = target.scale || 1;
        activeRotation.value = target.rotation || 0;
        activeWidth.value    = target.width || screenWidth * 0.8;
      }
      setSelectedObjectId(id);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      setSelectedObjectId(null);
    }
  };

  const saveObjectState = (
    id: string, x: number, y: number, s: number, r: number, w: number,
  ) => {
    setObjects(prev => prev.map(obj =>
      obj.id === id ? { ...obj, x, y, scale: s, rotation: r, width: w } : obj,
    ));
  };

  const handleDeleteObject = (id: string) => {
    pushHistory();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setObjects(prev => prev.filter(o => o.id !== id));
    if (selectedObjectId === id) setSelectedObjectId(null);
  };

  // ── Global gestures ───────────────────────────────────────────────────────

  const panGesture = Gesture.Pan()
    .enabled(!!selectedObjectId)
    .onStart(() => {
      if (isResizing.value) return;
      startX.value = activeX.value;
      startY.value = activeY.value;
    })
    .onUpdate((e) => {
      if (isResizing.value) return;
      activeX.value = startX.value + e.translationX;
      activeY.value = startY.value + e.translationY;
    })
    .onEnd(() => {
      if (selectedObjectId) {
        runOnJS(saveObjectState)(
          selectedObjectId,
          activeX.value, activeY.value,
          activeScale.value, activeRotation.value, activeWidth.value,
        );
      }
    });

  const pinchGesture = Gesture.Pinch()
    .enabled(!!selectedObjectId)
    .onStart(() => { if (!isResizing.value) startScale.value = activeScale.value; })
    .onUpdate((e) => { if (!isResizing.value) activeScale.value = startScale.value * e.scale; })
    .onEnd(() => {
      if (selectedObjectId) {
        runOnJS(saveObjectState)(
          selectedObjectId,
          activeX.value, activeY.value,
          activeScale.value, activeRotation.value, activeWidth.value,
        );
      }
    });

  const rotationGesture = Gesture.Rotation()
    .enabled(!!selectedObjectId)
    .onStart(() => { if (!isResizing.value) startRotation.value = activeRotation.value; })
    .onUpdate((e) => { if (!isResizing.value) activeRotation.value = startRotation.value + e.rotation; })
    .onEnd(() => {
      if (selectedObjectId) {
        runOnJS(saveObjectState)(
          selectedObjectId,
          activeX.value, activeY.value,
          activeScale.value, activeRotation.value, activeWidth.value,
        );
      }
    });

  const globalGestures = Gesture.Simultaneous(
    panGesture, Gesture.Simultaneous(pinchGesture, rotationGesture),
  );
  const bgTapGesture = Gesture.Tap().onEnd(() => { runOnJS(handleSelectObject)(null); });

  // ── Guard ──
  if (!fontsLoaded) {
    return (
      <View style={[s.container, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }]}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={{ color: '#fff', marginTop: 12, fontWeight: '600' }}>
          Initializing Creative Suite...
        </Text>
      </View>
    );
  }

  const alignIcon =
    selectedAlign === 'left'  ? 'format-align-left'  :
    selectedAlign === 'right' ? 'format-align-right' :
                                'format-align-center';

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <View style={[s.container, { backgroundColor: theme.primary }]}>
      <StatusBar hidden={activeTextInput} barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

      <LinearGradient
        colors={[
          isDarkMode ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.2)',
          'transparent',
          isDarkMode ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.4)',
        ]}
        style={StyleSheet.absoluteFill}
      />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.content}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={{ flex: 1 }}>

            {/* ─── HEADER ─── */}
            <View style={[s.header, { marginTop: insets.top }]}>
              <View style={s.headerLeft}>
                <TouchableOpacity
                  onPress={() => router.back()}
                  style={[s.glassBtn, { backgroundColor: theme.secondary, borderColor: theme.border }]}
                >
                  <Ionicons name="close" size={24} color={theme.text} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleUndo}
                  style={[s.glassBtn, { backgroundColor: theme.secondary, borderColor: theme.border }]}
                >
                  <Ionicons
                    name="arrow-undo-outline" size={22}
                    color={objects.length > 0 ? theme.text : 'rgba(255,255,255,0.25)'}
                  />
                </TouchableOpacity>
              </View>

              <View style={s.rightActions}>
                <TouchableOpacity
                  onPress={cycleBg}
                  style={[s.glassBtn, { backgroundColor: theme.secondary, borderColor: theme.border }]}
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

            {/* ─── LEFT SIDEBAR ─── */}
            <View style={[s.sidebar, { top: insets.top + 80 }]}>
              <TouchableOpacity
                onPress={handleSaveToGallery}
                disabled={isSaving}
                style={[s.glassBtn, { backgroundColor: theme.secondary, borderColor: theme.border, marginBottom: 14 }]}
              >
                <Ionicons name={isSaving ? 'sync-outline' : 'download-outline'} size={22} color={theme.text} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleAddPhoto}
                style={[s.glassBtn, { backgroundColor: theme.secondary, borderColor: theme.border, marginBottom: 14 }]}
              >
                <Ionicons name="images-outline" size={22} color={theme.text} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleCapturePhoto}
                style={[s.glassBtn, { backgroundColor: theme.secondary, borderColor: theme.border }]}
              >
                <Ionicons name="camera-outline" size={22} color={theme.text} />
              </TouchableOpacity>
            </View>

            {/* ─── CANVAS ─── */}
            <View style={s.canvasWrapper}>
              <ViewShot ref={canvasRef} options={{ format: 'jpg', quality: 0.9 }}>
                <GestureDetector gesture={Gesture.Exclusive(globalGestures, bgTapGesture)}>
                  <View style={[s.canvas, { width: canvasWidth, height: canvasHeight, backgroundColor: canvasBg }]}>

                    {objects.length === 0 && !activeTextInput && (
                      <TouchableOpacity style={s.emptyState} onPress={handleAddPhoto} activeOpacity={0.7}>
                        <View style={s.emptyIcon}>
                          <Ionicons name="images" size={30} color="rgba(255,255,255,0.7)" />
                        </View>
                        <Text style={s.emptyTitle}>Tap to add a photo</Text>
                        <Text style={s.emptyHint}>or use the tools on the left</Text>
                      </TouchableOpacity>
                    )}

                    {objects.map((obj) => (
                      <DraggableItem
                        key={obj.id}
                        isSelected={!isSaving && selectedObjectId === obj.id}
                        onSelect={() => handleSelectObject(obj.id)}
                        onDelete={() => handleDeleteObject(obj.id)}
                        onEdit={obj.type === 'TEXT' ? () => handleEditText(obj.id) : undefined}
                        activeX={obj.id === selectedObjectId ? activeX : undefined}
                        activeY={obj.id === selectedObjectId ? activeY : undefined}
                        activeScale={obj.id === selectedObjectId ? activeScale : undefined}
                        activeRotation={obj.id === selectedObjectId ? activeRotation : undefined}
                        activeWidth={obj.id === selectedObjectId ? activeWidth : undefined}
                        isResizing={obj.id === selectedObjectId ? isResizing : undefined}
                        initialWidth={obj.width}
                        onUpdate={(data) =>
                          saveObjectState(obj.id, data.x, data.y, data.scale, data.rotation, data.width ?? obj.width ?? screenWidth * 0.8)
                        }
                        initialX={obj.x}
                        initialY={obj.y}
                      >
                        {obj.type === 'TEXT'    ? <CanvasTextItem item={obj} />    :
                         obj.type === 'STICKER' ? <CanvasStickerItem item={obj} /> :
                                                  <CanvasImageItem item={obj} />}
                      </DraggableItem>
                    ))}
                  </View>
                </GestureDetector>
              </ViewShot>
            </View>

            {/* ─── FOOTER ─── */}
            {!activeTextInput && !showStickerPicker && (
              <View style={[s.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
                <TouchableOpacity
                  style={s.shareBtn}
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

        {/* ─── TEXT INPUT OVERLAY ─── */}
        {activeTextInput && (
          <View style={[StyleSheet.absoluteFill, s.textOverlay]}>

            {/* Row 1: Font cycle + Done */}
            <View style={[s.textHeader, { marginTop: insets.top }]}>
              <TouchableOpacity onPress={toggleFontStyle} style={s.fontStyleBtn}>
                <Text style={[
                  s.fontStyleBtnTxt,
                  { fontFamily: FONT_OPTIONS.find(f => f.id === selectedFont)?.family || 'System' },
                ]}>
                  {FONT_OPTIONS.find(f => f.id === selectedFont)?.label}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleAddText}>
                <Text style={s.doneTxt}>Done</Text>
              </TouchableOpacity>
            </View>

            {/* Row 2: BG toggle + Align + Color picker */}
            <View style={s.textControls}>
              <TouchableOpacity
                onPress={() => { setTextBg(v => !v); Haptics.selectionAsync(); }}
                style={[s.controlChip, textBg && s.controlChipActive]}
              >
                <MaterialCommunityIcons
                  name="format-color-fill"
                  size={18}
                  color={textBg ? '#000' : '#fff'}
                />
              </TouchableOpacity>

              <TouchableOpacity onPress={cycleAlignment} style={s.controlChip}>
                <MaterialCommunityIcons name={alignIcon as any} size={18} color="#fff" />
              </TouchableOpacity>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                keyboardShouldPersistTaps="always"
                style={{ flex: 1 }}
                contentContainerStyle={s.colorScroll}
              >
                {TEXT_COLORS.map(c => (
                  <TouchableOpacity
                    key={c}
                    onPress={() => { setTextColor(c); Haptics.selectionAsync(); }}
                    style={[
                      s.colorDot,
                      { backgroundColor: c },
                      textColor === c && s.colorDotActive,
                    ]}
                  />
                ))}
              </ScrollView>
            </View>

            {/* Center: Text input */}
            <View style={s.textCenter}>
              <TextInput
                autoFocus
                multiline
                value={currentText}
                onChangeText={setCurrentText}
                placeholder="Type something..."
                placeholderTextColor="rgba(255,255,255,0.35)"
                style={[
                  s.textInput,
                  {
                    color: textColor,
                    fontFamily: FONT_OPTIONS.find(f => f.id === selectedFont)?.family || 'System',
                    textAlign: selectedAlign ?? 'center',
                  },
                  selectedFont === 'Neon' && {
                    textShadowColor: 'rgba(255,255,255,0.8)',
                    textShadowOffset: { width: 0, height: 0 },
                    textShadowRadius: 15,
                  },
                ]}
              />
            </View>

            {/* Bottom: Font picker */}
            <View style={s.fontPickerBar}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                keyboardShouldPersistTaps="always"
                decelerationRate="fast"
                snapToInterval={80}
                snapToAlignment="center"
                nestedScrollEnabled
                contentContainerStyle={s.fontPickerContent}
              >
                {FONT_OPTIONS.map(f => (
                  <TouchableOpacity
                    key={f.id!}
                    onPress={() => { setSelectedFont(f.id); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                    style={[s.fontChip, selectedFont === f.id && s.fontChipActive, { marginRight: 12 }]}
                  >
                    <Text style={[s.fontChipTxt, { fontFamily: f.family }, selectedFont === f.id && { color: '#000' }]}>
                      {f.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        )}

        {/* ─── STICKER PICKER ─── */}
        {showStickerPicker && (
          <View style={[StyleSheet.absoluteFill, s.stickerOverlay]}>
            <View style={[s.stickerHeader, { marginTop: insets.top }]}>
              <TouchableOpacity onPress={() => setShowStickerPicker(false)}>
                <Ionicons name="chevron-down" size={32} color="#fff" />
              </TouchableOpacity>
            </View>
            <View style={s.stickerGrid}>
              {[
                { id: 'heart',    node: <Ionicons name="heart" size={40} color="#FF3040" /> },
                { id: 'star',     node: <Ionicons name="star" size={40} color="#FFD700" /> },
                { id: 'fire',     node: <MaterialCommunityIcons name="fire" size={40} color="#FF4500" /> },
                { id: 'verified', node: <MaterialCommunityIcons name="check-decagram" size={40} color="#3897f0" /> },
                { id: 'happy',    node: <Ionicons name="happy" size={40} color="#fff" /> },
              ].map(({ id, node }) => (
                <TouchableOpacity key={id} onPress={() => handleAddSticker(id)} style={s.stickerBox}>
                  {node}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

      </KeyboardAvoidingView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: { flex: 1 },
  content:   { flex: 1 },

  // Header
  header: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 100,
    height: 60,
  },
  headerLeft:   { flexDirection: 'row', gap: 10 },
  rightActions: { flexDirection: 'row', gap: 12 },
  glassBtn: {
    width: 44, height: 44, borderRadius: 22,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1,
  },

  // Sidebar — single definition, left side
  sidebar: {
    position: 'absolute',
    left: 20,
    zIndex: 100,
    alignItems: 'center',
  },

  // Canvas
  canvasWrapper: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  canvas: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 20,
  },
  emptyState: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyIcon: {
    width: 70, height: 70, borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  emptyTitle: { color: 'rgba(255,255,255,0.85)', fontSize: 16, fontWeight: '700', marginBottom: 4 },
  emptyHint:  { color: 'rgba(255,255,255,0.4)', fontSize: 13 },

  // Footer
  footer:   { paddingHorizontal: 24, alignItems: 'center' },
  shareBtn: {
    flexDirection: 'row', alignItems: 'center',
    paddingLeft: 24, paddingRight: 6, paddingVertical: 6,
    borderRadius: 30, backgroundColor: '#FF3040',
    elevation: 8, shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 12,
  },
  shareBtnTxt: { fontSize: 15, fontWeight: '900', color: '#fff', marginRight: 12 },
  shareCircle: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#fff',
    justifyContent: 'center', alignItems: 'center',
  },

  // Text overlay
  textOverlay: { backgroundColor: 'rgba(0,0,0,0.88)', zIndex: 1000 },
  textHeader: {
    height: 60, paddingHorizontal: 20,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  fontStyleBtn: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
  },
  fontStyleBtnTxt: { color: '#fff', fontSize: 13 },
  doneTxt: { color: '#fff', fontWeight: '900', fontSize: 18 },

  // Text controls row
  textControls: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, height: 52, gap: 10,
  },
  controlChip: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  controlChipActive: { backgroundColor: '#fff' },
  colorScroll: { paddingHorizontal: 4, alignItems: 'center', gap: 10 },
  colorDot: {
    width: 28, height: 28, borderRadius: 14,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.2)',
  },
  colorDotActive: {
    borderWidth: 3, borderColor: '#fff',
  },

  // Text input
  textCenter: {
    flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 28,
  },
  textInput: {
    fontSize: 32, width: '100%', letterSpacing: -0.5,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },

  // Font picker
  fontPickerBar:     { height: 64, width: '100%', zIndex: 2000 },
  fontPickerContent: { paddingHorizontal: 20, paddingBottom: 12, alignItems: 'center' },
  fontChip: {
    height: 44, minWidth: 44, paddingHorizontal: 16, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  fontChipActive: { backgroundColor: '#fff', borderColor: '#fff' },
  fontChipTxt:    { color: '#fff', fontSize: 14 },

  // Sticker picker
  stickerOverlay: { backgroundColor: 'rgba(0,0,0,0.92)', zIndex: 1000 },
  stickerHeader:  { height: 80, justifyContent: 'center', alignItems: 'center' },
  stickerGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    justifyContent: 'center', gap: 20, padding: 20,
  },
  stickerBox: {
    width: 80, height: 80, backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12, justifyContent: 'center', alignItems: 'center',
  },
});