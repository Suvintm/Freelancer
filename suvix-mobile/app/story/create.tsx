import React, {
  useState, useCallback, useRef, useEffect, useMemo,
} from 'react';
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
  FlatList,
} from 'react-native';
import { useFonts } from 'expo-font';
import { Inter_900Black }                 from '@expo-google-fonts/inter/900Black';
import { Pacifico_400Regular }            from '@expo-google-fonts/pacifico/400Regular';
import { PlayfairDisplay_700Bold }        from '@expo-google-fonts/playfair-display/700Bold';
import { PlayfairDisplay_700Bold_Italic } from '@expo-google-fonts/playfair-display/700Bold_Italic';
import { Bangers_400Regular }             from '@expo-google-fonts/bangers/400Regular';
import { SpecialElite_400Regular }        from '@expo-google-fonts/special-elite/400Regular';
import { useSafeAreaInsets }              from 'react-native-safe-area-context';
import * as ImagePicker                   from 'expo-image-picker';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter }                      from 'expo-router';
import { LinearGradient }                 from 'expo-linear-gradient';
import * as Haptics                       from 'expo-haptics';
import { useTheme }                       from '../../src/context/ThemeContext';
import { GestureDetector, Gesture }       from 'react-native-gesture-handler';
import { useSharedValue, runOnJS, useAnimatedReaction } from 'react-native-reanimated';
import ViewShot, { captureRef }           from 'react-native-view-shot';
import * as MediaLibrary                  from 'expo-media-library';
import { useUploadStore }                 from '../../src/store/useUploadStore';

import {
  StoryObject, CanvasBg, DrawPath,
  FontStyle, TextEffect, TextAlign, ImageFilter,
} from '../../src/modules/story/types';
import { DraggableItem }       from '../../src/modules/story/components/DraggableItem';
import { CanvasTextItem }      from '../../src/modules/story/components/CanvasTextItem';
import { CanvasStickerItem, EMOJI_STICKERS } from '../../src/modules/story/components/CanvasStickerItem';
import { CanvasImageItem }     from '../../src/modules/story/components/CanvasImageItem';
import { CanvasVideoItem }     from '../../src/modules/story/components/CanvasVideoItem';
import { DrawingCanvas }       from '../../src/modules/story/components/DrawingCanvas';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

type ToolMode = 'select' | 'draw' | 'text' | 'sticker' | 'bg';

const TEXT_COLORS = [
  '#FFFFFF','#000000','#FF3040','#FFD700',
  '#3897f0','#00C875','#FF6B35','#FF00FF',
  '#C0C0C0','#00FFFF','#FFA500','#8B00FF',
  '#FF69B4','#7FFFD4','#DC143C','#FFE4B5',
];

const BG_SOLID_PRESETS = [
  '#000000','#FFFFFF','#1A1A1A','#FF3040',
  '#3897f0','#5851DB','#833AB4','#F56040',
  '#121212','#FF6B35','#00C875','#FFD700',
];

interface GradientPreset {
  id: string;
  colors: [string, string];
  label: string;
}

const BG_GRADIENT_PRESETS: GradientPreset[] = [
  { id: 'fire',    colors: ['#FF4500', '#FFD700'], label: '🔥 Fire'   },
  { id: 'ocean',   colors: ['#00B4D8', '#023E8A'], label: '🌊 Ocean'  },
  { id: 'sunset',  colors: ['#FF6B6B', '#FFE66D'], label: '🌅 Sunset' },
  { id: 'night',   colors: ['#2D1B69', '#11998e'], label: '🌃 Night'  },
  { id: 'candy',   colors: ['#FF69B4', '#7B68EE'], label: '🍬 Candy'  },
  { id: 'forest',  colors: ['#11998e', '#38ef7d'], label: '🌿 Forest' },
  { id: 'gold',    colors: ['#B8860B', '#FFD700'], label: '✨ Gold'   },
  { id: 'rose',    colors: ['#FF0080', '#FF6B35'], label: '🌹 Rose'   },
  { id: 'deep',    colors: ['#833ab4', '#fd1d1d'], label: '💜 Deep'   },
  { id: 'mono',    colors: ['#434343', '#000000'], label: '⚫ Mono'   },
  { id: 'aurora',  colors: ['#00C9FF', '#92FE9D'], label: '🌌 Aurora' },
  { id: 'blaze',   colors: ['#f7971e', '#ffd200'], label: '🌟 Blaze'  },
];

const DRAW_COLORS = [
  '#FFFFFF','#FF3040','#FFD700','#3897f0',
  '#00C875','#FF6B35','#FF69B4','#8B00FF',
  '#000000','#00FFFF','#FFA500','#DC143C',
];

const ALIGN_CYCLE: TextAlign[] = ['center', 'left', 'right'];

const FONT_OPTIONS: { id: FontStyle; label: string; family: string }[] = [
  { id: 'Modern',     label: 'Modern',    family: 'Inter_900Black'                 },
  { id: 'Classic',    label: 'Elegant',   family: 'PlayfairDisplay_700Bold'        },
  { id: 'Italic',     label: 'Italic',    family: 'PlayfairDisplay_700Bold_Italic' },
  { id: 'Neon',       label: 'Neon',      family: 'Inter_900Black'                 },
  { id: 'Typewriter', label: 'Mono',      family: 'SpecialElite_400Regular'        },
  { id: 'Cursive',    label: 'Hand',      family: 'Pacifico_400Regular'            },
  { id: 'Comic',      label: 'Punch',     family: 'Bangers_400Regular'             },
];

const TEXT_EFFECTS: { id: TextEffect; label: string; icon: string }[] = [
  { id: 'none',    label: 'None',    icon: 'text'                    },
  { id: 'shadow',  label: 'Shadow',  icon: 'contrast-outline'        },
  { id: 'outline', label: 'Outline', icon: 'square-outline'          },
  { id: 'glow',    label: 'Glow',    icon: 'sunny-outline'           },
  { id: 'neon',    label: 'Neon',    icon: 'flash-outline'           },
];

const IMAGE_FILTERS: { id: ImageFilter; label: string }[] = [
  { id: 'none',     label: 'Original' },
  { id: 'warm',     label: 'Warm'     },
  { id: 'cool',     label: 'Cool'     },
  { id: 'fade',     label: 'Fade'     },
  { id: 'retro',    label: 'Retro'    },
  { id: 'vivid',    label: 'Vivid'    },
  { id: 'noir',     label: 'Noir'     },
  { id: 'dramatic', label: 'Drama'    },
];

const STORY_DURATIONS = [5, 10, 15, 30];

const STICKER_TABS = ['Emojis', 'Icons', 'Widgets'] as const;
type StickerTab = typeof STICKER_TABS[number];

const ICON_STICKERS = [
  'heart', 'star', 'fire', 'verified', 'happy',
  'sad', 'thumbs_up', 'thumbs_down', 'musical_note', 'gift',
];

const WIDGET_STICKERS = [
  { id: 'widget_poll',      label: 'Poll',      icon: 'chart-bar',         color: '#6C63FF' },
  { id: 'widget_music',     label: 'Music',     icon: 'music-note',        color: '#FF3040' },
  { id: 'widget_countdown', label: 'Countdown', icon: 'timer-outline',     color: '#FF8C00' },
  { id: 'widget_mention',   label: 'Mention',   icon: 'at',                color: '#3897f0' },
  { id: 'widget_hashtag',   label: 'Hashtag',   icon: 'pound',             color: '#00C875' },
  { id: 'widget_location',  label: 'Location',  icon: 'map-marker-outline',color: '#FF3040' },
] as const;

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export default function AddStoryScreen() {
  const { theme, isDarkMode }                 = useTheme();
  const router                                = useRouter();
  const insets                                = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  // ── Responsive canvas ──────────────────────────────────────────────────────
  const canvasRatio = 9 / 16;
  const availableH  = screenHeight - insets.top - insets.bottom;
  let canvasWidth   = screenWidth;
  let canvasHeight  = screenWidth / canvasRatio;
  if (canvasHeight > availableH) {
    canvasHeight = availableH;
    canvasWidth  = canvasHeight * canvasRatio;
  }

  // ── Core state ─────────────────────────────────────────────────────────────
  const [objects,          setObjects]          = useState<StoryObject[]>([]);
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [editingObjectId,  setEditingObjectId]  = useState<string | null>(null);
  const [isUploading,      setIsUploading]      = useState(false);
  const [isSaving,         setIsSaving]         = useState(false);
  const [isInteracting,    setIsInteracting]    = useState(false);
  const [isResizingState,  setIsResizingState]  = useState(false);
  const [isGlobalPaused,   setIsGlobalPaused]   = useState(false);
  const [toolMode,         setToolMode]         = useState<ToolMode>('select');
  const [storyDuration,    setStoryDuration]    = useState(15);

  // ── Canvas background ──────────────────────────────────────────────────────
  const [canvasBg, setCanvasBg] = useState<CanvasBg>({ type: 'solid', color: '#000000' });

  // ── Drawing ────────────────────────────────────────────────────────────────
  const [drawPaths,   setDrawPaths]   = useState<DrawPath[]>([]);
  const [brushColor,  setBrushColor]  = useState('#FFFFFF');
  const [brushSize,   setBrushSize]   = useState(6);
  const [isEraser,    setIsEraser]    = useState(false);

  // ── Text editor ────────────────────────────────────────────────────────────
  const [currentText,   setCurrentText]   = useState('');
  const [selectedFont,  setSelectedFont]  = useState<FontStyle>('Modern');
  const [textColor,     setTextColor]     = useState('#FFFFFF');
  const [textBg,        setTextBg]        = useState(false);
  const [selectedAlign, setSelectedAlign] = useState<TextAlign>('center');
  const [textEffect,    setTextEffect]    = useState<TextEffect>('none');
  const [fontSize,      setFontSize]      = useState(32);

  // ── Sticker picker ─────────────────────────────────────────────────────────
  const [stickerTab, setStickerTab] = useState<StickerTab>('Emojis');

  // ── Snap guides ────────────────────────────────────────────────────────────
  const [snapX, setSnapX] = useState(false);
  const [snapY, setSnapY] = useState(false);

  // ── History ────────────────────────────────────────────────────────────────
  interface HistoryState {
    objects: StoryObject[];
    paths: DrawPath[];
  }

  const historyRef     = useRef<HistoryState[]>([]);
  const redoHistoryRef = useRef<HistoryState[]>([]);

  const objectsRef     = useRef<StoryObject[]>(objects);
  const drawPathsRef   = useRef<DrawPath[]>(drawPaths);
  useEffect(() => { objectsRef.current = objects; }, [objects]);
  useEffect(() => { drawPathsRef.current = drawPaths; }, [drawPaths]);

  const pushHistory = useCallback(() => {
    historyRef.current = [
      ...historyRef.current.slice(-25),
      {
        objects: objectsRef.current.map(o => ({ ...o })),
        paths:   drawPathsRef.current.map(p => ({ ...p })),
      },
    ];
    redoHistoryRef.current = [];
  }, []);

  const handleUndo = useCallback(() => {
    if (historyRef.current.length === 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    // Push current to redo stack
    redoHistoryRef.current.push({
      objects: objectsRef.current.map(o => ({ ...o })),
      paths:   drawPathsRef.current.map(p => ({ ...p })),
    });

    const prev = historyRef.current.pop()!;
    setObjects(prev.objects);
    setDrawPaths(prev.paths);
    setSelectedObjectId(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  const handleRedo = useCallback(() => {
    if (redoHistoryRef.current.length === 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    // Push current back to history
    historyRef.current.push({
      objects: objectsRef.current.map(o => ({ ...o })),
      paths:   drawPathsRef.current.map(p => ({ ...p })),
    });

    const next = redoHistoryRef.current.pop()!;
    setObjects(next.objects);
    setDrawPaths(next.paths);
    setSelectedObjectId(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  // ── Fonts ──────────────────────────────────────────────────────────────────
  const [fontsLoaded] = useFonts({
    Inter_900Black, Pacifico_400Regular,
    PlayfairDisplay_700Bold, PlayfairDisplay_700Bold_Italic,
    Bangers_400Regular, SpecialElite_400Regular,
  });

  // ── Canvas ref ─────────────────────────────────────────────────────────────
  const canvasRef = useRef<View>(null);

  // ── Global gesture shared values ───────────────────────────────────────────
  const activeX        = useSharedValue(0);
  const activeY        = useSharedValue(0);
  const activeScale    = useSharedValue(1);
  const activeRotation = useSharedValue(0);
  const activeWidth    = useSharedValue(screenWidth * 0.8);
  const isResizing     = useSharedValue(false);

  // Sync isResizing shared value to React State to stop render-warnings and stabilize playback
  useAnimatedReaction(
    () => isResizing.value,
    (resizing) => {
      runOnJS(setIsResizingState)(resizing);
    },
    []
  );

  // ── Permissions ────────────────────────────────────────────────────────────
  const [mediaStatus, requestMediaPermission] = ImagePicker.useMediaLibraryPermissions();

  // ─────────────────────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────────────────────

  const saveObjectState = useCallback((
    id: string, x: number, y: number, s: number, r: number, w: number,
  ) => {
    pushHistory();
    setObjects(prev => prev.map(obj =>
      obj.id === id ? { ...obj, x, y, scale: s, rotation: r, width: w } : obj,
    ));
  }, [pushHistory]);

  const handleSelectObject = useCallback((id: string | null) => {
    const isDeselect = selectedObjectId === id && id !== null;
    const targetId = isDeselect ? null : id;

    setObjects(prev => {
      if (!targetId) return prev;
      const idx = prev.findIndex(o => o.id === targetId);
      if (idx === -1) return prev;
      const arr  = [...prev];
      const [item] = arr.splice(idx, 1);
      arr.push(item);
      return arr;
    });

    if (targetId) {
      const target = objectsRef.current.find(o => o.id === targetId);
      if (target) {
        activeX.value        = target.x;
        activeY.value        = target.y;
        activeScale.value    = target.scale ?? 1;
        activeRotation.value = target.rotation ?? 0;
        activeWidth.value    = target.width ?? screenWidth * 0.8;
      }
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    setSelectedObjectId(targetId);
  }, [activeX, activeY, activeScale, activeRotation, activeWidth, screenWidth, selectedObjectId]);

  const handleDeleteObject = useCallback((id: string) => {
    pushHistory();
    setObjects(prev => prev.filter(o => o.id !== id));
    if (selectedObjectId === id) setSelectedObjectId(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [pushHistory, selectedObjectId]);

  const handleDuplicateObject = useCallback((id: string) => {
    pushHistory();
    const obj = objectsRef.current.find(o => o.id === id);
    if (!obj) return;
    const clone: StoryObject = {
      ...obj,
      id: Date.now().toString(),
      x: obj.x + 20,
      y: obj.y + 20,
    };
    setObjects(prev => [...prev, clone]);
    handleSelectObject(clone.id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [pushHistory, handleSelectObject]);

  const handleUpdateOpacity = useCallback((id: string, opacity: number) => {
    pushHistory();
    setObjects(prev => prev.map(o => o.id === id ? { ...o, opacity } : o));
  }, [pushHistory]);

  const handleUpdateFilter = useCallback((id: string, filter: ImageFilter) => {
    pushHistory();
    setObjects(prev => prev.map(o => o.id === id ? { ...o, imageFilter: filter } : o));
  }, [pushHistory]);

  const handleBringToFront = useCallback((id: string) => {
    pushHistory();
    setObjects(prev => {
      const idx = prev.findIndex(o => o.id === id);
      if (idx === -1 || idx === prev.length - 1) return prev;
      const arr = [...prev];
      const [item] = arr.splice(idx, 1);
      arr.push(item);
      return arr;
    });
  }, [pushHistory]);

  const handleSendToBack = useCallback((id: string) => {
    pushHistory();
    setObjects(prev => {
      const idx = prev.findIndex(o => o.id === id);
      if (idx === -1 || idx === 0) return prev;
      const arr = [...prev];
      const [item] = arr.splice(idx, 1);
      arr.unshift(item);
      return arr;
    });
  }, [pushHistory]);

  // ── Media handlers ─────────────────────────────────────────────────────────

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
        mediaTypes: ['images', 'videos'],
        allowsEditing: false,
        quality: 1,
      });
      if (!result.canceled && result.assets?.[0]?.uri) {
        pushHistory();
        const asset = result.assets[0];
        const logW = screenWidth * 0.7;
        const type: StoryObjectType = asset.type === 'video' ? 'VIDEO' : 'IMAGE';
        const newObj: StoryObject = {
          id: Date.now().toString(), type,
          content: asset.uri,
          x: 0, y: 0, scale: 1, rotation: 0,
          imageFilter: 'none',
          width: logW,
          height: logW / (asset.width / asset.height),
          aspectRatio: asset.width / asset.height,
        };
        setObjects(prev => [...prev, newObj]);
        handleSelectObject(newObj.id);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch {
      Alert.alert('Error', 'Could not add photo. Please try again.');
    }
  };

  const handleCapturePhoto = async () => {
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission Required', 'SuviX needs camera access.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images', 'videos'],
        allowsEditing: false,
        quality: 1,
      });
      if (!result.canceled && result.assets?.[0]?.uri) {
        pushHistory();
        const asset = result.assets[0];
        const logW = screenWidth * 0.7;
        const type: StoryObjectType = asset.type === 'video' ? 'VIDEO' : 'IMAGE';
        const newObj: StoryObject = {
          id: Date.now().toString(), type,
          content: asset.uri,
          x: 0, y: 0, scale: 1, rotation: 0,
          imageFilter: 'none',
          width: logW,
          height: logW / (asset.width / asset.height),
          aspectRatio: asset.width / asset.height,
        };
        setObjects(prev => [...prev, newObj]);
        handleSelectObject(newObj.id);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    } catch {
      Alert.alert('Error', 'Could not launch camera.');
    }
  };

  // ── Text handlers ──────────────────────────────────────────────────────────

  const openTextEditor = () => {
    setCurrentText('');
    setEditingObjectId(null);
    setSelectedFont('Modern');
    setTextColor('#FFFFFF');
    setTextBg(false);
    setSelectedAlign('center');
    setTextEffect('none');
    setFontSize(32);
    setToolMode('text');
  };

  const handleEditText = useCallback((id: string) => {
    const obj = objectsRef.current.find(o => o.id === id);
    if (obj?.type === 'TEXT') {
      setCurrentText(obj.content);
      setSelectedFont(obj.fontStyle   ?? 'Modern');
      setTextColor(obj.color         ?? '#FFFFFF');
      setTextBg(obj.textBackground   ?? false);
      setSelectedAlign(obj.textAlign ?? 'center');
      setTextEffect(obj.textEffect   ?? 'none');
      setFontSize(obj.fontSize       ?? 32);
      setEditingObjectId(id);
      setToolMode('text');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  const handleConfirmText = () => {
    if (!currentText.trim()) {
      setEditingObjectId(null);
      setToolMode('select');
      return;
    }
    pushHistory();
    if (editingObjectId) {
      setObjects(prev => prev.map(obj =>
        obj.id === editingObjectId
          ? { ...obj, content: currentText, fontStyle: selectedFont, color: textColor,
              textBackground: textBg, textAlign: selectedAlign, textEffect, fontSize, width: activeWidth.value }
          : obj,
      ));
      setEditingObjectId(null);
    } else {
      const newObj: StoryObject = {
        id: Date.now().toString(), type: 'TEXT',
        content: currentText,
        x: 0, y: 0, scale: 1, rotation: 0,
        fontStyle: selectedFont, color: textColor,
        textBackground: textBg, textAlign: selectedAlign,
        textEffect, fontSize,
        width: screenWidth * 0.8,
      };
      setObjects(prev => [...prev, newObj]);
      handleSelectObject(newObj.id);
    }
    setCurrentText('');
    setToolMode('select');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  // ── Sticker handler ────────────────────────────────────────────────────────

  const handleAddSticker = useCallback((content: string, extras?: Partial<StoryObject>) => {
    pushHistory();
    const newObj: StoryObject = {
      id: Date.now().toString(), type: 'STICKER',
      content,
      x: 0, y: 0, scale: 1, rotation: 0,
      ...extras,
    };
    setObjects(prev => [...prev, newObj]);
    handleSelectObject(newObj.id);
    setToolMode('select');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [pushHistory, handleSelectObject]);

  // ── Drawing handlers ───────────────────────────────────────────────────────

  const handlePathComplete = useCallback((path: DrawPath) => {
    pushHistory();
    setDrawPaths(prev => [...prev, path]);
  }, [pushHistory]);

  const handleClearDrawing = () => {
    Alert.alert('Clear Drawing', 'Remove all brush strokes?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear', style: 'destructive',
        onPress: () => {
          pushHistory();
          setDrawPaths([]);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        },
      },
    ]);
  };

  // ── Save / Share / Fit Media ───────────────────────────────────────────────────────────

  const handleFitMedia = () => {
    const selectedObject = objects.find(o => o.id === selectedObjectId);
    if (!selectedObject || (selectedObject.type !== 'IMAGE' && selectedObject.type !== 'VIDEO')) return;
    pushHistory();
    
    const mediaRatio = selectedObject.aspectRatio || 1;
    const canvasRatio = canvasWidth / canvasHeight;
    
    let newWidth, newHeight;
    
    if (mediaRatio > canvasRatio) {
      // Media is wider -> Fit width
      newWidth = canvasWidth;
      newHeight = canvasWidth / mediaRatio;
    } else {
      // Media is taller -> Fit height
      newHeight = canvasHeight;
      newWidth = canvasHeight * mediaRatio;
    }

    // Since DraggableItem relies on `top: 40%`, we must counteract this offset to perfectly center the media
    const perfectlyCenteredY = (canvasHeight * 0.1) - (newHeight / 2);

    setObjects(prev => prev.map(obj => 
      obj.id === selectedObject.id 
      ? { ...obj, width: newWidth, height: newHeight, x: 0, y: perfectlyCenteredY, scale: 1, rotation: 0 } 
      : obj
    ));
    
    // Reset the active gesture nodes so UI doesn't jump on next touch
    activeX.value = 0;
    activeY.value = perfectlyCenteredY;
    activeScale.value = 1;
    activeRotation.value = 0;
    activeWidth.value = newWidth;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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
      setSelectedObjectId(null);
      setTimeout(async () => {
        try {
          const uri    = await captureRef(canvasRef, { format: 'jpg', quality: 1, result: 'tmpfile' });
          const asset  = await MediaLibrary.createAssetAsync(uri);
          const album  = await MediaLibrary.getAlbumAsync('SuviX Stories');
          if (album === null) {
            await MediaLibrary.createAlbumAsync('SuviX Stories', asset, false);
          } else {
            await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
          }
          setIsSaving(false);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Alert.alert('Saved!', 'Story saved to SuviX Stories album.');
        } catch {
          setIsSaving(false);
          Alert.alert('Error', 'Could not save story.');
        }
      }, 160);
    } catch {
      setIsSaving(false);
    }
  };

  const handleShare = async () => {
    setIsUploading(true);
    setSelectedObjectId(null);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    // Navigate home instantly
    router.back();

    // Trigger the global Top Navbar upload progress bar, explicitly marked as 'STORY'
    const { startUpload, updateProgress, setSuccess } = useUploadStore.getState();
    startUpload('VIDEO', 'STORY');
    
    let progress = 0;
    const intervalId = setInterval(() => {
      progress += Math.floor(Math.random() * 15) + 5;
      if (progress >= 100) {
        clearInterval(intervalId as any);
        setSuccess('Story added to Infinity Feed! 🔥');
      } else {
        updateProgress(progress);
      }
    }, 400);
  };

  // ── Global gestures (object drag/pinch/rotate from parent) ─────────────────

  const startX         = useSharedValue(0);
  const startY         = useSharedValue(0);
  const startScale     = useSharedValue(1);
  const startRotation  = useSharedValue(0);

  const panGesture = Gesture.Pan()
    .enabled(!!selectedObjectId && toolMode === 'select')
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
    .enabled(!!selectedObjectId && toolMode === 'select')
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
    .enabled(!!selectedObjectId && toolMode === 'select')
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
  const bgTapGesture = Gesture.Tap().onEnd(() => {
    runOnJS(handleSelectObject)(null);
  });

  // ── Derived ────────────────────────────────────────────────────────────────
  const selectedObject = useMemo(
    () => objects.find(o => o.id === selectedObjectId) ?? null,
    [objects, selectedObjectId],
  );

  const bgSolidColor = canvasBg.type === 'gradient'
    ? canvasBg.gradientColors?.[0] ?? '#000'
    : canvasBg.color;

  const alignIcon =
    selectedAlign === 'left'  ? 'format-align-left'  :
    selectedAlign === 'right' ? 'format-align-right' :
                                'format-align-center';

  // ── Guard ──────────────────────────────────────────────────────────────────
  if (!fontsLoaded) {
    return (
      <View style={[s.container, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }]}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={{ color: '#fff', marginTop: 12, fontWeight: '600' }}>Initializing Creative Suite...</Text>
      </View>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <View style={[s.container, { backgroundColor: theme.primary }]}>
      <StatusBar hidden={toolMode === 'text'} barStyle="light-content" />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.flex}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={s.flex}>

            {/* ─── HEADER ─────────────────────────────────────────────────── */}
            <View style={[s.header, { marginTop: insets.top }]}>
              {/* Left: close + undo/redo */}
              <View style={s.row}>
                <TouchableOpacity
                  onPress={() => router.back()}
                  style={[s.glassBtn, { backgroundColor: theme.secondary, borderColor: theme.border }]}
                >
                  <Ionicons name="close" size={22} color={theme.text} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleUndo}
                  style={[s.glassBtn, { backgroundColor: theme.secondary, borderColor: theme.border }]}
                >
                  <Ionicons
                    name="arrow-undo-outline" size={20}
                    color={historyRef.current.length > 0
                      ? theme.text : 'rgba(255,255,255,0.25)'}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleRedo}
                  style={[s.glassBtn, { backgroundColor: theme.secondary, borderColor: theme.border }]}
                >
                  <Ionicons
                    name="arrow-redo-outline" size={20}
                    color={redoHistoryRef.current.length > 0 ? theme.text : 'rgba(255,255,255,0.25)'}
                  />
                </TouchableOpacity>
              </View>

              {/* Right: tool buttons */}
              <View style={s.row}>
                {/* Draw */}
                <TouchableOpacity
                  onPress={() => {
                    Haptics.selectionAsync();
                    setToolMode(m => m === 'draw' ? 'select' : 'draw');
                    setSelectedObjectId(null);
                  }}
                  style={[
                    s.glassBtn,
                    { backgroundColor: toolMode === 'draw' ? '#FF3040' : theme.secondary, borderColor: theme.border },
                  ]}
                >
                  <MaterialCommunityIcons name="draw" size={20} color="#fff" />
                </TouchableOpacity>

                {/* Text */}
                <TouchableOpacity
                  onPress={openTextEditor}
                  style={[s.glassBtn, { backgroundColor: theme.secondary, borderColor: theme.border }]}
                >
                  <Ionicons name="text" size={20} color={theme.text} />
                </TouchableOpacity>

                {/* Sticker */}
                <TouchableOpacity
                  onPress={() => {
                    Haptics.selectionAsync();
                    setToolMode(m => m === 'sticker' ? 'select' : 'sticker');
                    setSelectedObjectId(null);
                  }}
                  style={[
                    s.glassBtn,
                    { backgroundColor: toolMode === 'sticker' ? '#FFD700' : theme.secondary, borderColor: theme.border },
                  ]}
                >
                  <Ionicons name="happy-outline" size={20} color={toolMode === 'sticker' ? '#000' : theme.text} />
                </TouchableOpacity>

                {/* Background */}
                <TouchableOpacity
                  onPress={() => {
                    Haptics.selectionAsync();
                    setToolMode(m => m === 'bg' ? 'select' : 'bg');
                    setSelectedObjectId(null);
                  }}
                  style={[
                    s.glassBtn,
                    { backgroundColor: toolMode === 'bg' ? '#00C875' : theme.secondary, borderColor: theme.border },
                  ]}
                >
                  <MaterialCommunityIcons name="palette-outline" size={20} color={toolMode === 'bg' ? '#000' : theme.text} />
                </TouchableOpacity>
              </View>
            </View>

            {/* ─── LEFT SIDEBAR ────────────────────────────────────────────── */}
            <View style={[s.sidebar, { top: insets.top + 68 }]}>
              <TouchableOpacity
                onPress={handleSaveToGallery}
                disabled={isSaving}
                style={[s.glassBtn, { backgroundColor: theme.secondary, borderColor: theme.border, marginBottom: 12 }]}
              >
                <Ionicons name={isSaving ? 'sync-outline' : 'download-outline'} size={20} color={theme.text} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleAddPhoto}
                style={[s.glassBtn, { backgroundColor: theme.secondary, borderColor: theme.border, marginBottom: 12 }]}
              >
                <Ionicons name="images-outline" size={20} color={theme.text} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleCapturePhoto}
                style={[s.glassBtn, { backgroundColor: theme.secondary, borderColor: theme.border, marginBottom: 12 }]}
              >
                <Ionicons name="camera-outline" size={20} color={theme.text} />
              </TouchableOpacity>
              
              {/* Fit Media to Canvas */}
              {selectedObject && (selectedObject.type === 'IMAGE' || selectedObject.type === 'VIDEO') && (
                <TouchableOpacity
                  onPress={handleFitMedia}
                  style={[s.glassBtn, { backgroundColor: theme.secondary, borderColor: theme.border }]}
                >
                  <Ionicons name="expand-outline" size={20} color={theme.text} />
                </TouchableOpacity>
              )}
            </View>

            {/* ─── CANVAS ──────────────────────────────────────────────────── */}
            <View style={s.canvasWrapper}>
              <ViewShot ref={canvasRef} options={{ format: 'jpg', quality: 0.95 }}>
                <GestureDetector gesture={Gesture.Exclusive(globalGestures, bgTapGesture)}>
                  <View style={[s.canvas, { width: canvasWidth, height: canvasHeight }]}>

                    {/* Background */}
                    <LinearGradient
                      colors={
                        canvasBg.type === 'gradient'
                          ? canvasBg.gradientColors!
                          : [canvasBg.color, canvasBg.color]
                      }
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={StyleSheet.absoluteFill}
                    />

                    {/* Snap guides */}
                    {snapX && (
                      <View style={[s.snapGuide, s.snapGuideV, { left: canvasWidth / 2 - 0.5 }]} />
                    )}
                    {snapY && (
                      <View style={[s.snapGuide, s.snapGuideH, { top: canvasHeight / 2 - 0.5 }]} />
                    )}

                    {/* Empty state */}
                    {objects.length === 0 && drawPaths.length === 0 && toolMode === 'select' && (
                      <TouchableOpacity style={s.emptyState} onPress={handleAddPhoto} activeOpacity={0.7}>
                        <View style={s.emptyIcon}>
                          <Ionicons name="images" size={28} color="rgba(255,255,255,0.7)" />
                        </View>
                        <Text style={s.emptyTitle}>Tap to add a photo</Text>
                        <Text style={s.emptyHint}>or use the toolbar above</Text>
                      </TouchableOpacity>
                    )}

                    {/* Objects */}
                    {objects.map((obj) => (
                      <DraggableItem
                        key={obj.id}
                        isSelected={!isSaving && selectedObjectId === obj.id}
                        gesturesDisabled={toolMode === 'draw'}
                        onSelect={() => handleSelectObject(obj.id)}
                        onDelete={() => handleDeleteObject(obj.id)}
                        onEdit={obj.type === 'TEXT' ? () => handleEditText(obj.id) : undefined}
                        onDuplicate={() => handleDuplicateObject(obj.id)}
                        activeX={obj.id === selectedObjectId ? activeX : undefined}
                        activeY={obj.id === selectedObjectId ? activeY : undefined}
                        activeScale={obj.id === selectedObjectId ? activeScale : undefined}
                        activeRotation={obj.id === selectedObjectId ? activeRotation : undefined}
                        activeWidth={obj.id === selectedObjectId ? activeWidth : undefined}
                        isResizing={obj.id === selectedObjectId ? isResizing : undefined}
                        initialWidth={obj.type === 'TEXT' ? (obj.width ?? screenWidth * 0.8) : undefined}
                        initialX={obj.x}
                        initialY={obj.y}
                        opacity={obj.opacity ?? 1}
                        onUpdate={(data) =>
                          saveObjectState(obj.id, data.x, data.y, data.scale, data.rotation, data.width ?? obj.width ?? screenWidth * 0.8)
                        }
                        onSnapChange={setSnapX.bind(null) as any}
                        onInteractionStart={() => setIsInteracting(true)}
                        onInteractionEnd={() => setIsInteracting(false)}
                      >
                        {obj.type === 'TEXT'    ? <CanvasTextItem item={obj} />    :
                         obj.type === 'STICKER' ? <CanvasStickerItem item={obj} /> :
                         obj.type === 'VIDEO'   ? <CanvasVideoItem 
                                                    item={obj} 
                                                    isPaused={(obj.id === selectedObjectId && (isResizingState || isInteracting)) || toolMode !== 'select' || isGlobalPaused} 
                                                  /> :
                                                  <CanvasImageItem item={obj} />}
                      </DraggableItem>
                    ))}

                    {/* Drawing canvas layer (always present for SVG persistence) */}
                    <DrawingCanvas
                      width={canvasWidth}
                      height={canvasHeight}
                      paths={drawPaths}
                      brushColor={brushColor}
                      brushSize={brushSize}
                      isEraser={isEraser}
                      eraserBgColor={bgSolidColor}
                      interactive={toolMode === 'draw'}
                      onPathComplete={handlePathComplete}
                    />

                  </View>
                </GestureDetector>
              </ViewShot>
            </View>

            {/* ─── SELECTED OBJECT TOOLBAR ─────────────────────────────────── */}
            {selectedObjectId && toolMode === 'select' && selectedObject && (
              <View style={s.objToolbar}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.objToolbarContent}>

                  {/* Opacity */}
                  <View style={s.objToolGroup}>
                    <TouchableOpacity
                      onPress={() => handleUpdateOpacity(selectedObjectId, Math.max(0.1, (selectedObject.opacity ?? 1) - 0.2))}
                      style={s.objToolBtn}
                    >
                      <Text style={s.objToolIcon}>◐</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleUpdateOpacity(selectedObjectId, Math.min(1, (selectedObject.opacity ?? 1) + 0.2))}
                      style={s.objToolBtn}
                    >
                      <Text style={s.objToolIcon}>●</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={s.objToolDivider} />

                  {/* Layer order */}
                  <TouchableOpacity onPress={() => handleBringToFront(selectedObjectId)} style={s.objToolBtn}>
                    <MaterialCommunityIcons name="arrange-bring-to-front" size={18} color="#fff" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleSendToBack(selectedObjectId)} style={s.objToolBtn}>
                    <MaterialCommunityIcons name="arrange-send-to-back" size={18} color="#fff" />
                  </TouchableOpacity>

                  <View style={s.objToolDivider} />

                  {/* Video Playback Toggle */}
                  {selectedObject.type === 'VIDEO' && (
                    <TouchableOpacity
                      onPress={() => {
                        setIsGlobalPaused(!isGlobalPaused);
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }}
                      style={[s.filterChip, isGlobalPaused && s.filterChipActive]}
                    >
                      <Ionicons 
                        name={isGlobalPaused ? "play" : "pause"} 
                        size={16} 
                        color={isGlobalPaused ? "#fff" : "#000"} 
                      />
                      <Text style={[s.filterChipTxt, !isGlobalPaused && { color: '#000' }]}>
                        {isGlobalPaused ? 'Play Video' : 'Pause Video'}
                      </Text>
                    </TouchableOpacity>
                  )}

                  {/* Image filter pills */}
                  {selectedObject.type === 'IMAGE' &&
                    IMAGE_FILTERS.map(f => (
                      <TouchableOpacity
                        key={f.id}
                        onPress={() => handleUpdateFilter(selectedObjectId, f.id)}
                        style={[
                          s.filterChip,
                          selectedObject.imageFilter === f.id && s.filterChipActive,
                        ]}
                      >
                        <Text style={[s.filterChipTxt, selectedObject.imageFilter === f.id && { color: '#000' }]}>
                          {f.label}
                        </Text>
                      </TouchableOpacity>
                    ))
                  }

                  {/* Text effect pills */}
                  {selectedObject.type === 'TEXT' &&
                    TEXT_EFFECTS.map(e => (
                      <TouchableOpacity
                        key={e.id}
                        onPress={() => {
                          setObjects(prev => prev.map(o =>
                            o.id === selectedObjectId ? { ...o, textEffect: e.id } : o,
                          ));
                          Haptics.selectionAsync();
                        }}
                        style={[
                          s.filterChip,
                          selectedObject.textEffect === e.id && s.filterChipActive,
                        ]}
                      >
                        <Text style={[s.filterChipTxt, selectedObject.textEffect === e.id && { color: '#000' }]}>
                          {e.label}
                        </Text>
                      </TouchableOpacity>
                    ))
                  }

                </ScrollView>
              </View>
            )}

            {/* ─── DRAWING TOOLBAR ─────────────────────────────────────────── */}
            {toolMode === 'draw' && (
              <View style={s.drawToolbar}>
                {/* Brush/Eraser toggle */}
                <View style={s.drawToolSection}>
                  <TouchableOpacity
                    onPress={() => { setIsEraser(false); Haptics.selectionAsync(); }}
                    style={[s.drawModeBtn, !isEraser && s.drawModeBtnActive]}
                  >
                    <MaterialCommunityIcons name="draw" size={18} color={!isEraser ? '#000' : '#fff'} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => { setIsEraser(true); Haptics.selectionAsync(); }}
                    style={[s.drawModeBtn, isEraser && s.drawModeBtnActive]}
                  >
                    <MaterialCommunityIcons name="eraser" size={18} color={isEraser ? '#000' : '#fff'} />
                  </TouchableOpacity>
                </View>

                {/* Colors */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={{ flex: 1 }}
                  contentContainerStyle={s.colorScroll}
                >
                  {DRAW_COLORS.map(c => (
                    <TouchableOpacity
                      key={c}
                      onPress={() => { setBrushColor(c); setIsEraser(false); Haptics.selectionAsync(); }}
                      style={[
                        s.colorDot,
                        { backgroundColor: c },
                        !isEraser && brushColor === c && s.colorDotActive,
                      ]}
                    />
                  ))}
                </ScrollView>

                {/* Size dots */}
                <View style={s.drawToolSection}>
                  {[3, 6, 10, 16].map(sz => (
                    <TouchableOpacity
                      key={sz}
                      onPress={() => { setBrushSize(sz); Haptics.selectionAsync(); }}
                      style={s.sizeBtn}
                    >
                      <View style={[
                        s.sizeDot,
                        { width: sz + 4, height: sz + 4, borderRadius: (sz + 4) / 2 },
                        brushSize === sz && { backgroundColor: brushColor },
                      ]} />
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Clear */}
                <TouchableOpacity onPress={handleClearDrawing} style={s.clearBtn}>
                  <MaterialCommunityIcons name="delete-sweep-outline" size={20} color="#FF3040" />
                </TouchableOpacity>
              </View>
            )}

            {/* ─── FOOTER ──────────────────────────────────────────────────── */}
            {toolMode === 'select' && !isSaving && (
              <View style={[s.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
                {/* Duration selector */}
                <View style={s.durationRow}>
                  {STORY_DURATIONS.map(d => (
                    <TouchableOpacity
                      key={d}
                      onPress={() => { setStoryDuration(d); Haptics.selectionAsync(); }}
                      style={[s.durationChip, storyDuration === d && s.durationChipActive]}
                    >
                      <Text style={[s.durationTxt, storyDuration === d && { color: '#000' }]}>{d}s</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity
                  style={s.shareBtn}
                  onPress={handleShare}
                  disabled={isUploading}
                  activeOpacity={0.85}
                >
                  {isUploading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Text style={s.shareTxt}>Share Story</Text>
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

        {/* ═══════════════════════════════════════════════════════════════════
            OVERLAYS
        ═══════════════════════════════════════════════════════════════════ */}

        {/* ─── TEXT INPUT OVERLAY ──────────────────────────────────────────── */}
        {toolMode === 'text' && (
          <View style={[StyleSheet.absoluteFill, s.overlay]}>

            {/* Row 1: font cycle + done */}
            <View style={[s.textHeader, { marginTop: insets.top }]}>
              <TouchableOpacity
                onPress={() => {
                  const idx = FONT_OPTIONS.findIndex(f => f.id === selectedFont);
                  setSelectedFont(FONT_OPTIONS[(idx + 1) % FONT_OPTIONS.length].id);
                  Haptics.selectionAsync();
                }}
                style={s.fontStyleBtn}
              >
                <Text style={[s.fontStyleTxt, { fontFamily: FONT_OPTIONS.find(f => f.id === selectedFont)?.family }]}>
                  {FONT_OPTIONS.find(f => f.id === selectedFont)?.label}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleConfirmText}>
                <Text style={s.doneTxt}>Done</Text>
              </TouchableOpacity>
            </View>

            {/* Row 2: bg toggle + align + colors */}
            <View style={s.textControls}>
              <TouchableOpacity
                onPress={() => { setTextBg(v => !v); Haptics.selectionAsync(); }}
                style={[s.controlChip, textBg && s.controlChipActive]}
              >
                <MaterialCommunityIcons name="format-color-fill" size={17} color={textBg ? '#000' : '#fff'} />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  const i = ALIGN_CYCLE.indexOf(selectedAlign ?? 'center');
                  setSelectedAlign(ALIGN_CYCLE[(i + 1) % ALIGN_CYCLE.length]);
                  Haptics.selectionAsync();
                }}
                style={s.controlChip}
              >
                <MaterialCommunityIcons name={alignIcon as any} size={17} color="#fff" />
              </TouchableOpacity>

              {/* Font size */}
              <TouchableOpacity
                onPress={() => { setFontSize(s => s >= 56 ? 20 : s + 8); Haptics.selectionAsync(); }}
                style={s.controlChip}
              >
                <Text style={{ color: '#fff', fontSize: 11, fontWeight: '900' }}>{fontSize}</Text>
              </TouchableOpacity>

              <ScrollView
                horizontal showsHorizontalScrollIndicator={false}
                keyboardShouldPersistTaps="always"
                style={{ flex: 1 }}
                contentContainerStyle={s.colorScroll}
              >
                {TEXT_COLORS.map(c => (
                  <TouchableOpacity
                    key={c}
                    onPress={() => { setTextColor(c); Haptics.selectionAsync(); }}
                    style={[s.colorDot, { backgroundColor: c }, textColor === c && s.colorDotActive]}
                  />
                ))}
              </ScrollView>
            </View>

            {/* Text effect pills */}
            <ScrollView
              horizontal showsHorizontalScrollIndicator={false}
              keyboardShouldPersistTaps="always"
              contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingBottom: 8 }}
            >
              {TEXT_EFFECTS.map(e => (
                <TouchableOpacity
                  key={e.id}
                  onPress={() => { setTextEffect(e.id); Haptics.selectionAsync(); }}
                  style={[s.effectChip, textEffect === e.id && s.effectChipActive]}
                >
                  <Text style={[s.effectChipTxt, textEffect === e.id && { color: '#000' }]}>{e.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Text input */}
            <View style={s.textCenter}>
              <TextInput
                autoFocus
                multiline
                value={currentText}
                onChangeText={setCurrentText}
                placeholder="Type something..."
                placeholderTextColor="rgba(255,255,255,0.3)"
                style={[
                  s.textInput,
                  {
                    color: textColor,
                    fontFamily: FONT_OPTIONS.find(f => f.id === selectedFont)?.family ?? 'System',
                    textAlign: selectedAlign,
                    fontSize,
                  },
                  textEffect === 'neon' && {
                    textShadowColor: 'rgba(255,255,255,0.95)',
                    textShadowOffset: { width: 0, height: 0 },
                    textShadowRadius: 14,
                  },
                ]}
              />
            </View>

            {/* Font picker */}
            <View style={s.fontBarWrapper}>
              <ScrollView
                horizontal showsHorizontalScrollIndicator={false}
                keyboardShouldPersistTaps="always"
                decelerationRate="fast"
                contentContainerStyle={s.fontBarContent}
              >
                {FONT_OPTIONS.map(f => (
                  <TouchableOpacity
                    key={f.id}
                    onPress={() => { setSelectedFont(f.id); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                    style={[s.fontChip, selectedFont === f.id && s.fontChipActive]}
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

        {/* ─── STICKER PICKER OVERLAY ──────────────────────────────────────── */}
        {toolMode === 'sticker' && (
          <View style={[StyleSheet.absoluteFill, s.overlay]}>
            <TouchableOpacity
              style={s.overlayCloseArea}
              onPress={() => setToolMode('select')}
              activeOpacity={1}
            />
            <View style={[s.stickerSheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>

              {/* Handle + close */}
              <View style={s.sheetHandle}>
                <View style={s.sheetHandlePill} />
                <TouchableOpacity onPress={() => setToolMode('select')} style={s.sheetCloseBtn}>
                  <Ionicons name="close" size={18} color="rgba(255,255,255,0.6)" />
                </TouchableOpacity>
              </View>

              {/* Tabs */}
              <View style={s.stickerTabRow}>
                {STICKER_TABS.map(tab => (
                  <TouchableOpacity
                    key={tab}
                    onPress={() => { setStickerTab(tab); Haptics.selectionAsync(); }}
                    style={[s.stickerTab, stickerTab === tab && s.stickerTabActive]}
                  >
                    <Text style={[s.stickerTabTxt, stickerTab === tab && { color: '#000' }]}>{tab}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Emoji tab */}
              {stickerTab === 'Emojis' && (
                <FlatList
                  data={Object.keys(EMOJI_STICKERS)}
                  numColumns={6}
                  keyExtractor={item => item}
                  contentContainerStyle={{ paddingHorizontal: 8 }}
                  renderItem={({ item: stickerKey }) => (
                    <TouchableOpacity
                      style={s.emojiBox}
                      onPress={() => handleAddSticker(stickerKey)}
                    >
                      <Text style={s.emojiTxt}>{EMOJI_STICKERS[stickerKey]}</Text>
                    </TouchableOpacity>
                  )}
                />
              )}

              {/* Icons tab */}
              {stickerTab === 'Icons' && (
                <View style={s.iconGrid}>
                  {[
                    { id: 'heart',    el: <Ionicons name="heart" size={32} color="#FF3040" /> },
                    { id: 'star',     el: <Ionicons name="star"  size={32} color="#FFD700" /> },
                    { id: 'fire',     el: <MaterialCommunityIcons name="fire" size={32} color="#FF4500" /> },
                    { id: 'verified', el: <MaterialCommunityIcons name="check-decagram" size={32} color="#3897f0" /> },
                    { id: 'happy',    el: <Ionicons name="happy" size={32} color="#FFD700" /> },
                    { id: 'sad',      el: <Ionicons name="sad"   size={32} color="#aaa" /> },
                  ].map(({ id, el }) => (
                    <TouchableOpacity key={id} style={s.iconBox} onPress={() => handleAddSticker(id)}>
                      {el}
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Widgets tab */}
              {stickerTab === 'Widgets' && (
                <View style={s.widgetGrid}>
                  {WIDGET_STICKERS.map(w => (
                    <TouchableOpacity
                      key={w.id}
                      style={s.widgetCard}
                      onPress={() => handleAddSticker(w.id, {
                        pollQuestion: 'Which do you prefer?',
                        pollOptions: ['Option A', 'Option B'],
                        musicTitle: 'Unknown Track',
                        musicArtist: 'Unknown Artist',
                        countdownTargetMs: Date.now() + 24 * 3_600_000,
                        labelText: w.label,
                      })}
                    >
                      <View style={[s.widgetIcon, { backgroundColor: w.color + '33', borderColor: w.color + '66' }]}>
                        <MaterialCommunityIcons name={w.icon as any} size={22} color={w.color} />
                      </View>
                      <Text style={s.widgetLabel}>{w.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

            </View>
          </View>
        )}

        {/* ─── BACKGROUND PICKER OVERLAY ──────────────────────────────────── */}
        {toolMode === 'bg' && (
          <View style={[StyleSheet.absoluteFill, s.overlay]}>
            <TouchableOpacity
              style={s.overlayCloseArea}
              onPress={() => setToolMode('select')}
              activeOpacity={1}
            />
            <View style={[s.bgSheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>

              <View style={s.sheetHandle}>
                <View style={s.sheetHandlePill} />
                <TouchableOpacity onPress={() => setToolMode('select')} style={s.sheetCloseBtn}>
                  <Ionicons name="close" size={18} color="rgba(255,255,255,0.6)" />
                </TouchableOpacity>
              </View>

              <Text style={s.sheetTitle}>Solid Colors</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.bgSolidRow}>
                {BG_SOLID_PRESETS.map(c => (
                  <TouchableOpacity
                    key={c}
                    onPress={() => {
                      setCanvasBg({ type: 'solid', color: c });
                      Haptics.selectionAsync();
                    }}
                    style={[
                      s.bgSolidDot,
                      { backgroundColor: c },
                      canvasBg.type === 'solid' && canvasBg.color === c && s.bgDotActive,
                    ]}
                  />
                ))}
              </ScrollView>

              <Text style={s.sheetTitle}>Gradients</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.bgGradRow}>
                {BG_GRADIENT_PRESETS.map(g => (
                  <TouchableOpacity
                    key={g.id}
                    onPress={() => {
                      setCanvasBg({ type: 'gradient', color: g.colors[0], gradientColors: g.colors });
                      Haptics.selectionAsync();
                    }}
                    style={[
                      s.bgGradChip,
                      canvasBg.type === 'gradient' &&
                        canvasBg.gradientColors?.[0] === g.colors[0] &&
                        s.bgGradChipActive,
                    ]}
                  >
                    <LinearGradient colors={g.colors} style={s.bgGradPreview} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
                    <Text style={s.bgGradLabel}>{g.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        )}

      </KeyboardAvoidingView>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container:    { flex: 1 },
  flex:         { flex: 1 },
  row:          { flexDirection: 'row', gap: 8 },

  // Header
  header: {
    paddingHorizontal: 16,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    zIndex: 100, height: 56,
  },
  glassBtn: {
    width: 42, height: 42, borderRadius: 21,
    justifyContent: 'center', alignItems: 'center', borderWidth: 1,
  },

  // Sidebar
  sidebar: { position: 'absolute', left: 16, zIndex: 100, alignItems: 'center' },

  // Canvas
  canvasWrapper: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  canvas: {
    borderRadius: 20, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.5, shadowRadius: 24, elevation: 18,
  },

  // Snap guides
  snapGuide: { position: 'absolute', backgroundColor: 'rgba(56,151,240,0.6)', zIndex: 10 },
  snapGuideV: { top: 0, bottom: 0, width: 1 },
  snapGuideH: { left: 0, right: 0, height: 1 },

  // Empty state
  emptyState: {
    ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center',
  },
  emptyIcon: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center', alignItems: 'center', marginBottom: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  emptyTitle: { color: 'rgba(255,255,255,0.85)', fontSize: 15, fontWeight: '700', marginBottom: 4 },
  emptyHint:  { color: 'rgba(255,255,255,0.4)', fontSize: 12 },

  // Selected object toolbar
  objToolbar: {
    height: 52, borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  objToolbarContent: { paddingHorizontal: 16, alignItems: 'center', gap: 8 },
  objToolGroup:   { flexDirection: 'row', gap: 6 },
  objToolBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center', alignItems: 'center',
  },
  objToolIcon:    { color: '#fff', fontSize: 16 },
  objToolDivider: { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.15)' },
  filterChip: {
    paddingHorizontal: 12, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  filterChipActive: { backgroundColor: '#fff', borderColor: '#fff' },
  filterChipTxt:    { color: '#fff', fontSize: 12, fontWeight: '700' },

  // Drawing toolbar
  drawToolbar: {
    flexDirection: 'row', alignItems: 'center',
    height: 58, paddingHorizontal: 12, gap: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)',
  },
  drawToolSection: { flexDirection: 'row', gap: 6 },
  drawModeBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
  },
  drawModeBtnActive: { backgroundColor: '#fff' },
  sizeBtn: { width: 28, height: 36, justifyContent: 'center', alignItems: 'center' },
  sizeDot: {
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.5)',
  },
  clearBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,48,64,0.15)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,48,64,0.35)',
  },

  // Color scrolls (shared)
  colorScroll: { paddingHorizontal: 4, alignItems: 'center', gap: 8 },
  colorDot: {
    width: 26, height: 26, borderRadius: 13,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.2)',
  },
  colorDotActive: { borderWidth: 3, borderColor: '#fff' },

  // Footer
  footer:       { paddingHorizontal: 24, alignItems: 'center', paddingTop: 8 },
  durationRow:  { flexDirection: 'row', gap: 8, marginBottom: 10 },
  durationChip: {
    paddingHorizontal: 14, paddingVertical: 5, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  durationChipActive: { backgroundColor: '#fff' },
  durationTxt:  { color: '#fff', fontWeight: '700', fontSize: 12 },
  shareBtn: {
    flexDirection: 'row', alignItems: 'center',
    paddingLeft: 22, paddingRight: 5, paddingVertical: 5,
    borderRadius: 30, backgroundColor: '#FF3040',
    elevation: 8, shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10,
  },
  shareTxt:     { fontSize: 15, fontWeight: '900', color: '#fff', marginRight: 10 },
  shareCircle:  {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center',
  },

  // ── Overlays ──────────────────────────────────────────────────────────────
  overlay:           { backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1000 },
  overlayCloseArea:  { flex: 1 },

  // Text overlay
  textHeader: {
    height: 56, paddingHorizontal: 20,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.88)',
  },
  fontStyleBtn: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
  },
  fontStyleTxt: { color: '#fff', fontSize: 13 },
  doneTxt:      { color: '#fff', fontWeight: '900', fontSize: 17 },
  textControls: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, height: 50, gap: 8,
    backgroundColor: 'rgba(0,0,0,0.88)',
  },
  controlChip: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  controlChipActive: { backgroundColor: '#fff' },
  effectChip: {
    paddingHorizontal: 12, height: 30, borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  effectChipActive: { backgroundColor: '#fff' },
  effectChipTxt:    { color: '#fff', fontSize: 12, fontWeight: '700' },
  textCenter: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 24, backgroundColor: 'rgba(0,0,0,0.88)',
  },
  textInput: {
    width: '100%', fontSize: 32,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  fontBarWrapper:  { height: 60, backgroundColor: 'rgba(0,0,0,0.88)' },
  fontBarContent:  { paddingHorizontal: 16, paddingBottom: 10, alignItems: 'center', gap: 10 },
  fontChip: {
    height: 42, minWidth: 42, paddingHorizontal: 16, borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  fontChipActive: { backgroundColor: '#fff' },
  fontChipTxt:    { color: '#fff', fontSize: 13 },

  // Sticker sheet
  stickerSheet: {
    backgroundColor: '#1A1A1A',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: '70%', minHeight: 340,
    borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  sheetHandle:   { alignItems: 'center', paddingTop: 10, paddingBottom: 4, flexDirection: 'row', justifyContent: 'center' },
  sheetHandlePill: { width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.25)' },
  sheetCloseBtn: { position: 'absolute', right: 16 },
  stickerTabRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 12 },
  stickerTab: {
    flex: 1, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  stickerTabActive: { backgroundColor: '#fff' },
  stickerTabTxt:    { color: '#fff', fontWeight: '700', fontSize: 13 },
  emojiBox:    { flex: 1 / 6, aspectRatio: 1, justifyContent: 'center', alignItems: 'center' },
  emojiTxt:    { fontSize: 34 },
  iconGrid:    { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 12 },
  iconBox: {
    width: 64, height: 64, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center', alignItems: 'center',
  },
  widgetGrid:  { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 12 },
  widgetCard: {
    width: '47%', height: 72, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, gap: 12,
  },
  widgetIcon: {
    width: 40, height: 40, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center', borderWidth: 1,
  },
  widgetLabel: { color: '#fff', fontWeight: '700', fontSize: 13 },

  // Background sheet
  bgSheet: {
    backgroundColor: '#1A1A1A',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    paddingTop: 8,
  },
  sheetTitle:    { color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '800', letterSpacing: 1.5, paddingHorizontal: 18, marginTop: 8, marginBottom: 8 },
  bgSolidRow:    { paddingHorizontal: 16, gap: 10, paddingBottom: 4 },
  bgSolidDot:    { width: 42, height: 42, borderRadius: 21, borderWidth: 2, borderColor: 'transparent' },
  bgDotActive:   { borderColor: '#fff' },
  bgGradRow:     { paddingHorizontal: 16, gap: 10, paddingBottom: 12 },
  bgGradChip: {
    alignItems: 'center', gap: 6,
    padding: 4,
    borderRadius: 12,
    borderWidth: 2, borderColor: 'transparent',
  },
  bgGradChipActive: { borderColor: '#fff' },
  bgGradPreview: { width: 52, height: 52, borderRadius: 12 },
  bgGradLabel:   { color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: '600' },
});