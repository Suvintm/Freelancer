/**
 * app/story/create.tsx — PRODUCTION STORY CANVAS ENGINE v4
 *
 * NEW IN v4 vs v3:
 * ───────────────────────────────────────────────────────────────────────────
 * 1. Z-INDEX FIX: selectObject() no longer reorders the objects array.
 *    Each object's z-position is PURELY its index in the array. Selected
 *    objects no longer jump above unselected peers.
 *
 * 2. DRAGGABLE LAYERS PANEL: PicsArt-style right-side panel with thumbnails,
 *    drag handle, drag-to-reorder with insertion indicator, eye/lock per layer,
 *    selected layer highlighted with teal border.
 *
 * 3. TEXT SELECTION BAR: When a text object is selected, a bottom panel
 *    appears inline (without opening full editor) showing: font chips,
 *    color dots, and effect chips (Shadow, Stroke, Glow, Neon). Matches
 *    the PicsArt text-selected-state UX.
 *
 * 4. SHAPES TOOL: Rectangle, Rounded Rect, Circle, Triangle, Star, Heart,
 *    Diamond, Arrow, Speech Bubble, Line — each with fill color, stroke
 *    color, stroke width, and corner radius controls.
 *
 * 5. CENTRAL VIDEO CONTROLS: When the canvas has ≥1 VIDEO object, a
 *    floating play/pause pill is overlaid at the bottom-center of the
 *    canvas. Works regardless of which object is selected.
 */

import React, {
  useState, useCallback, useRef, useEffect, useMemo, memo,
} from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  KeyboardAvoidingView, Platform, StatusBar, Alert,
  ActivityIndicator, useWindowDimensions, ScrollView,
  FlatList, PanResponder, Animated as RNAnimated,
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
import { GestureDetector, Gesture, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, runOnJS } from 'react-native-reanimated';
import ViewShot, { captureRef }           from 'react-native-view-shot';
import * as MediaLibrary                  from 'expo-media-library';
import { useUploadStore }                 from '../../src/store/useUploadStore';
import { api }                            from '../../src/api/client';

import {
  StoryObject, CanvasBg, DrawPath,
  FontStyle, TextEffect, TextAlign, ImageFilter,
} from '../../src/modules/story/types';
import { CanvasTextItem }      from '../../src/modules/story/components/CanvasTextItem';
import { CanvasStickerItem, EMOJI_STICKERS } from '../../src/modules/story/components/CanvasStickerItem';
import { CanvasImageItem }     from '../../src/modules/story/components/CanvasImageItem';
import { CanvasVideoItem }     from '../../src/modules/story/components/CanvasVideoItem';
import { CanvasShapeItem }     from '../../src/modules/story/components/CanvasShapeItem';
import { DrawingCanvas }       from '../../src/modules/story/components/DrawingCanvas';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

type ToolMode = 'select' | 'draw' | 'text' | 'sticker' | 'bg' | 'shape';
type LayerAction = 'visibility' | 'lock' | 'delete' | 'select';

type ShapeId =
  | 'rect' | 'rounded' | 'circle' | 'triangle'
  | 'star' | 'heart' | 'diamond' | 'arrow'
  | 'speech' | 'line';

interface ExtendedStoryObject extends StoryObject {
  isVisible?:          boolean;
  isLocked?:           boolean;
  shapeFill?:          string;
  shapeStroke?:        string;
  shapeStrokeWidth?:   number;
  shapeCornerRadius?:  number;
  shapeHeight?:        number;
}

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const TEXT_COLORS = [
  '#FFFFFF','#000000','#FF3040','#FFD700','#3897f0','#00C875',
  '#FF6B35','#FF00FF','#C0C0C0','#00FFFF','#FFA500','#8B00FF',
  '#FF69B4','#7FFFD4','#DC143C','#FFE4B5',
];
const SHAPE_COLORS = [
  '#FFFFFF','#000000','#EF4444','#F59E0B','#3B82F6','#22C55E',
  '#8B5CF6','#EC4899','#06B6D4','#F97316','#84CC16','#6366F1',
  'transparent',
];
const BG_SOLID_PRESETS = [
  '#000000','#FFFFFF','#1A1A1A','#FF3040','#3897f0','#5851DB',
  '#833AB4','#F56040','#121212','#FF6B35','#00C875','#FFD700',
];
const BG_GRADIENT_PRESETS = [
  { id: 'fire',   colors: ['#FF4500','#FFD700'] as [string,string], label: '🔥' },
  { id: 'ocean',  colors: ['#00B4D8','#023E8A'] as [string,string], label: '🌊' },
  { id: 'sunset', colors: ['#FF6B6B','#FFE66D'] as [string,string], label: '🌅' },
  { id: 'night',  colors: ['#2D1B69','#11998e'] as [string,string], label: '🌃' },
  { id: 'candy',  colors: ['#FF69B4','#7B68EE'] as [string,string], label: '🍬' },
  { id: 'forest', colors: ['#11998e','#38ef7d'] as [string,string], label: '🌿' },
  { id: 'gold',   colors: ['#B8860B','#FFD700'] as [string,string], label: '✨' },
  { id: 'deep',   colors: ['#833ab4','#fd1d1d'] as [string,string], label: '💜' },
  { id: 'mono',   colors: ['#434343','#000000'] as [string,string], label: '⚫' },
  { id: 'aurora', colors: ['#00C9FF','#92FE9D'] as [string,string], label: '🌌' },
];
const DRAW_COLORS = [
  '#FFFFFF','#FF3040','#FFD700','#3897f0','#00C875',
  '#FF6B35','#FF69B4','#8B00FF','#000000','#00FFFF',
];
const FONT_OPTIONS: { id: FontStyle; label: string; family: string }[] = [
  { id: 'Modern',     label: 'Modern',  family: 'Inter_900Black'                 },
  { id: 'Classic',    label: 'Elegant', family: 'PlayfairDisplay_700Bold'        },
  { id: 'Italic',     label: 'Italic',  family: 'PlayfairDisplay_700Bold_Italic' },
  { id: 'Typewriter', label: 'Mono',    family: 'SpecialElite_400Regular'        },
  { id: 'Cursive',    label: 'Hand',    family: 'Pacifico_400Regular'            },
  { id: 'Comic',      label: 'Punch',   family: 'Bangers_400Regular'             },
];
const TEXT_EFFECTS: { id: TextEffect; label: string }[] = [
  { id: 'none',    label: 'None'    },
  { id: 'shadow',  label: 'Shadow'  },
  { id: 'outline', label: 'Outline' },
  { id: 'glow',    label: 'Glow'    },
  { id: 'neon',    label: 'Neon'    },
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
const ALIGN_CYCLE: TextAlign[] = ['center', 'left', 'right'];

const ALL_SHAPES: { id: ShapeId; label: string; symbol: string }[] = [
  { id: 'rect',     label: 'Rect',    symbol: '▬' },
  { id: 'rounded',  label: 'Round',   symbol: '▢' },
  { id: 'circle',   label: 'Circle',  symbol: '●' },
  { id: 'triangle', label: 'Triangle',symbol: '▲' },
  { id: 'star',     label: 'Star',    symbol: '★' },
  { id: 'heart',    label: 'Heart',   symbol: '♥' },
  { id: 'diamond',  label: 'Diamond', symbol: '◆' },
  { id: 'arrow',    label: 'Arrow',   symbol: '→' },
  { id: 'speech',   label: 'Bubble',  symbol: '💬' },
  { id: 'line',     label: 'Line',    symbol: '—' },
];

// 🚀 CanvasShapeItem moved to its own file in src/modules/story/components/CanvasShapeItem.tsx


// ─────────────────────────────────────────────────────────────────────────────
// CANVAS OBJECT  — z-index from render order ONLY (no bring-to-front on select)
// ─────────────────────────────────────────────────────────────────────────────

interface CanvasObjectProps {
  obj:          ExtendedStoryObject;
  isSelected:   boolean;
  isLocked:     boolean;
  isHidden:     boolean;
  canvasWidth:  number;
  canvasHeight: number;
  drawMode:     boolean;
  onSelect:     () => void;
  onUpdate:     (patch: Partial<ExtendedStoryObject>) => void;
  onDelete:     () => void;
  onDuplicate:  () => void;
  onEdit?:      () => void;
  children:     React.ReactNode;
}

const CanvasObject = memo(({
  obj, isSelected, isLocked, isHidden,
  canvasWidth, canvasHeight, drawMode,
  onSelect, onUpdate, onDelete, onDuplicate, onEdit, children,
}: CanvasObjectProps) => {
  const ITEM_W = obj.width ?? (obj.type === 'TEXT' ? canvasWidth * 0.8 : canvasWidth * 0.65);

  const tx = useSharedValue(obj.x);
  const ty = useSharedValue(obj.y);
  const sc = useSharedValue(obj.scale    ?? 1);
  const ro = useSharedValue(obj.rotation ?? 0);

  const lastCommit = useRef({ x: obj.x, y: obj.y, sc: obj.scale ?? 1, ro: obj.rotation ?? 0 });

  useEffect(() => {
    const c = lastCommit.current;
    if (
      Math.abs(c.x  - obj.x) > 0.5 ||
      Math.abs(c.y  - obj.y) > 0.5 ||
      Math.abs(c.sc - (obj.scale ?? 1)) > 0.01 ||
      Math.abs(c.ro - (obj.rotation ?? 0)) > 0.01
    ) {
      tx.value = obj.x;  ty.value = obj.y;
      sc.value = obj.scale ?? 1;  ro.value = obj.rotation ?? 0;
      lastCommit.current = { x: obj.x, y: obj.y, sc: obj.scale ?? 1, ro: obj.rotation ?? 0 };
    }
  }, [obj.x, obj.y, obj.scale, obj.rotation]);

  const startTx = useSharedValue(0), startTy = useSharedValue(0);
  const startSc = useSharedValue(1), startRo = useSharedValue(0);
  const isDragging = useSharedValue(false);

  const commit = useCallback((x: number, y: number, scale: number, rotation: number) => {
    lastCommit.current = { x, y, sc: scale, ro: rotation };
    onUpdate({ x, y, scale, rotation });
  }, [onUpdate]);

  const selectObj = useCallback(() => {
    onSelect();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [onSelect]);

  const tap      = Gesture.Tap().maxDuration(250).onEnd(() => { runOnJS(selectObj)(); });
  const dblTap   = Gesture.Tap().numberOfTaps(2).onEnd(() => { if (onEdit) runOnJS(onEdit)(); });

  const pan = Gesture.Pan()
    .enabled(!drawMode && !isLocked).minDistance(3)
    .onStart(() => { startTx.value = tx.value; startTy.value = ty.value; isDragging.value = true; })
    .onUpdate(e => { tx.value = startTx.value + e.translationX; ty.value = startTy.value + e.translationY; })
    .onEnd(() => { isDragging.value = false; runOnJS(commit)(tx.value, ty.value, sc.value, ro.value); })
    .onFinalize(() => { isDragging.value = false; });

  const pinch = Gesture.Pinch()
    .enabled(!drawMode && !isLocked)
    .onStart(() => { startSc.value = sc.value; })
    .onUpdate(e => { sc.value = Math.max(0.15, Math.min(5, startSc.value * e.scale)); })
    .onEnd(() => runOnJS(commit)(tx.value, ty.value, sc.value, ro.value));

  const rotate = Gesture.Rotation()
    .enabled(!drawMode && !isLocked)
    .onStart(() => { startRo.value = ro.value; })
    .onUpdate(e => { ro.value = startRo.value + e.rotation; })
    .onEnd(() => runOnJS(commit)(tx.value, ty.value, sc.value, ro.value));

  const transforms = Gesture.Simultaneous(pan, Gesture.Simultaneous(pinch, rotate));
  const taps       = Gesture.Exclusive(dblTap, tap);
  const composed   = Gesture.Race(transforms, taps);

  const animStyle = useAnimatedStyle(() => ({
    left:    canvasWidth  / 2 - ITEM_W / 2 + tx.value,
    top:     canvasHeight * 0.35 + ty.value,
    opacity: isHidden ? 0 : (obj.opacity ?? 1),
    transform: [{ scale: sc.value }, { rotate: `${ro.value}rad` }],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    borderColor: isDragging.value ? 'rgba(0,200,255,0.9)' : 'rgba(255,255,255,0.75)',
    borderWidth: isDragging.value ? 2 : 1.5,
  }));

  return (
    <GestureDetector gesture={composed}>
      <Animated.View
        style={[{ width: ITEM_W, position: 'absolute' }, animStyle]}
        pointerEvents={drawMode ? 'none' : 'auto'}
      >
        {children}
        {isSelected && !drawMode && (
          <>
            <Animated.View style={[s.selectionRing, ringStyle]} pointerEvents="none" />
            <TouchableOpacity style={[s.ctrlBtn, s.ctrlTL, { backgroundColor: '#EF4444' }]} onPress={onDelete} hitSlop={HIT_SLOP}>
              <Ionicons name="close" size={11} color="#fff" />
            </TouchableOpacity>
            {onEdit && (
              <TouchableOpacity style={[s.ctrlBtn, s.ctrlTR, { backgroundColor: '#3B82F6' }]} onPress={onEdit} hitSlop={HIT_SLOP}>
                <Ionicons name="pencil" size={10} color="#fff" />
              </TouchableOpacity>
            )}
            <TouchableOpacity style={[s.ctrlBtn, s.ctrlBL, { backgroundColor: '#8B5CF6' }]} onPress={onDuplicate} hitSlop={HIT_SLOP}>
              <MaterialCommunityIcons name="content-copy" size={10} color="#fff" />
            </TouchableOpacity>
            {isLocked && (
              <View style={[s.ctrlBtn, s.ctrlBR, { backgroundColor: 'rgba(0,0,0,0.7)' }]}>
                <Ionicons name="lock-closed" size={10} color="#FFD700" />
              </View>
            )}
          </>
        )}
      </Animated.View>
    </GestureDetector>
  );
});

const HIT_SLOP = { top: 12, left: 12, bottom: 12, right: 12 };

// ─────────────────────────────────────────────────────────────────────────────
// DRAGGABLE LAYERS PANEL  (PicsArt-style)
// ─────────────────────────────────────────────────────────────────────────────

const LAYER_ROW_H = 68;

interface LayerItem {
  id: string; type: ExtendedStoryObject['type']; label: string;
  isVisible: boolean; isLocked: boolean; isSelected: boolean;
  index: number; // position in objects array (0 = bottom)
}

interface DragState {
  id: string; fromIndex: number;
  startPageY: number; currentPageY: number;
}

interface LayersPanelProps {
  layers:      LayerItem[];   // sorted: index 0 = top (front)
  onAction:    (id: string, action: LayerAction) => void;
  onReorder:   (fromArrayIndex: number, toArrayIndex: number) => void;
  onClose:     () => void;
}

const LayersPanel = memo(({ layers, onAction, onReorder, onClose }: LayersPanelProps) => {
  const [drag, setDrag] = useState<DragState | null>(null);
  const dragY = useRef(new RNAnimated.Value(0)).current;
  const listRef = useRef<FlatList>(null);

  const getInsertIndex = (fromIndex: number, currentY: number, startY: number): number => {
    const delta = currentY - startY;
    const steps = Math.round(delta / LAYER_ROW_H);
    return Math.max(0, Math.min(layers.length - 1, fromIndex + steps));
  };

  const insertIndex = drag
    ? getInsertIndex(drag.fromIndex, drag.currentPageY, drag.startPageY)
    : -1;

  const typeIcon = (t: ExtendedStoryObject['type']) =>
    t === 'TEXT' ? 'text' : t === 'IMAGE' ? 'image' : t === 'VIDEO' ? 'videocam' :
    t === 'STICKER' ? 'happy' : 'shapes';  // 'shapes' for SHAPE type

  const typeColor = (t: ExtendedStoryObject['type']) =>
    t === 'TEXT' ? '#3B82F6' : t === 'IMAGE' ? '#22C55E' : t === 'VIDEO' ? '#EF4444' :
    t === 'STICKER' ? '#F59E0B' : '#8B5CF6';

  return (
    <View style={s.layersOverlay} pointerEvents="box-none">
      {/* Tap-outside to close */}
      <TouchableOpacity style={s.layersBg} onPress={onClose} activeOpacity={1} />

      <View style={s.layersPanel}>
        {/* Header */}
        <View style={s.layersHeader}>
          <MaterialCommunityIcons name="layers" size={18} color="rgba(255,255,255,0.7)" />
          <Text style={s.layersTitle}>Layers</Text>
          <View style={[s.layersCountBadge]}>
            <Text style={s.layersCountText}>{layers.length}</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={{ marginLeft: 6 }}>
            <Ionicons name="close" size={18} color="rgba(255,255,255,0.5)" />
          </TouchableOpacity>
        </View>

        {layers.length === 0 && (
          <View style={s.layersEmpty}>
            <MaterialCommunityIcons name="layers-outline" size={32} color="rgba(255,255,255,0.15)" />
            <Text style={s.layersEmptyText}>No layers yet</Text>
          </View>
        )}

        <ScrollView
          style={{ maxHeight: 400 }}
          showsVerticalScrollIndicator={false}
          scrollEnabled={!drag}
        >
          {layers.map((item, visualIndex) => {
            const isDragging = drag?.id === item.id;
            const showInsertAbove = drag && !isDragging && visualIndex === insertIndex && insertIndex < drag.fromIndex;
            const showInsertBelow = drag && !isDragging && visualIndex === insertIndex && insertIndex >= drag.fromIndex;

            return (
              <View key={item.id}>
                {showInsertAbove && <View style={s.insertIndicator} />}

                <RNAnimated.View
                  style={[
                    s.layerRow,
                    item.isSelected && s.layerRowSelected,
                    isDragging && s.layerRowDragging,
                  ]}
                >
                  {/* Drag Handle */}
                  <View
                    style={s.dragHandle}
                    {...PanResponder.create({
                      onStartShouldSetPanResponder: () => true,
                      onPanResponderGrant: (evt) => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        setDrag({
                          id: item.id,
                          fromIndex: visualIndex,
                          startPageY: evt.nativeEvent.pageY,
                          currentPageY: evt.nativeEvent.pageY,
                        });
                      },
                      onPanResponderMove: (_, gestureState) => {
                        setDrag(prev => prev ? {
                          ...prev,
                          currentPageY: prev.startPageY + gestureState.dy,
                        } : null);
                      },
                      onPanResponderRelease: () => {
                        if (drag) {
                          const to = getInsertIndex(drag.fromIndex, drag.currentPageY, drag.startPageY);
                          if (to !== drag.fromIndex) {
                            // Convert visual indices to array indices
                            // layers[0] = top = highest array index
                            const fromArr = layers.length - 1 - drag.fromIndex;
                            const toArr   = layers.length - 1 - to;
                            onReorder(fromArr, toArr);
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                          }
                        }
                        setDrag(null);
                      },
                    }).panHandlers}
                  >
                    <MaterialCommunityIcons name="drag-vertical" size={18} color="rgba(255,255,255,0.35)" />
                  </View>

                  {/* Thumbnail / type icon */}
                  <TouchableOpacity
                    style={[s.layerThumb, { borderColor: item.isSelected ? '#00BCD4' : 'rgba(255,255,255,0.08)' }]}
                    onPress={() => onAction(item.id, 'select')}
                  >
                    <Ionicons name={typeIcon(item.type) as any} size={18} color={typeColor(item.type)} />
                  </TouchableOpacity>

                  {/* Label */}
                  <TouchableOpacity style={{ flex: 1 }} onPress={() => onAction(item.id, 'select')}>
                    <Text style={[s.layerLabel, item.isSelected && { color: '#fff', fontWeight: '800' }]} numberOfLines={1}>
                      {item.label}
                    </Text>
                    <Text style={s.layerSubLabel}>{item.type}</Text>
                  </TouchableOpacity>

                  {/* Visibility */}
                  <TouchableOpacity style={s.layerActionBtn} onPress={() => onAction(item.id, 'visibility')}>
                    <Ionicons
                      name={item.isVisible ? 'eye-outline' : 'eye-off-outline'} size={17}
                      color={item.isVisible ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.2)'}
                    />
                  </TouchableOpacity>

                  {/* Lock */}
                  <TouchableOpacity style={s.layerActionBtn} onPress={() => onAction(item.id, 'lock')}>
                    <Ionicons
                      name={item.isLocked ? 'lock-closed-outline' : 'lock-open-outline'} size={16}
                      color={item.isLocked ? '#FFD700' : 'rgba(255,255,255,0.3)'}
                    />
                  </TouchableOpacity>

                  {/* Delete */}
                  <TouchableOpacity style={s.layerActionBtn} onPress={() => onAction(item.id, 'delete')}>
                    <Ionicons name="trash-outline" size={16} color="rgba(239,68,68,0.6)" />
                  </TouchableOpacity>
                </RNAnimated.View>

                {showInsertBelow && <View style={s.insertIndicator} />}
              </View>
            );
          })}

          {/* Background (non-draggable) */}
          <View style={[s.layerRow, { opacity: 0.5 }]}>
            <View style={s.dragHandle}>
              <MaterialCommunityIcons name="drag-vertical" size={18} color="rgba(255,255,255,0.1)" />
            </View>
            <View style={[s.layerThumb, { borderColor: 'rgba(255,255,255,0.06)' }]}>
              <MaterialCommunityIcons name="checkerboard" size={18} color="rgba(255,255,255,0.3)" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.layerLabel, { color: 'rgba(255,255,255,0.4)' }]}>Background</Text>
              <Text style={s.layerSubLabel}>CANVAS</Text>
            </View>
            <Ionicons name="lock-closed-outline" size={16} color="rgba(255,255,255,0.2)" />
          </View>
        </ScrollView>
      </View>
    </View>
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// TEXT SELECTION BAR (shown inline when text is selected — PicsArt UX)
// ─────────────────────────────────────────────────────────────────────────────

interface TextSelectionBarProps {
  obj:       ExtendedStoryObject;
  onUpdate:  (patch: Partial<ExtendedStoryObject>) => void;
  onEditFull: () => void;
}

const TextSelectionBar = memo(({ obj, onUpdate, onEditFull }: TextSelectionBarProps) => (
  <View style={s.textSelBar}>
    {/* Full edit */}
    <TouchableOpacity style={s.textSelEditBtn} onPress={onEditFull}>
      <Ionicons name="create-outline" size={15} color="#fff" />
      <Text style={s.textSelEditText}>Edit</Text>
    </TouchableOpacity>

    <View style={s.textSelDivider} />

    {/* Font chips */}
    <ScrollView horizontal showsHorizontalScrollIndicator={false}
      style={{ flex: 1 }} contentContainerStyle={s.textSelScroll}>
      {FONT_OPTIONS.map(f => (
        <TouchableOpacity
          key={f.id}
          style={[s.textSelFontChip, obj.fontStyle === f.id && s.textSelFontChipActive]}
          onPress={() => { onUpdate({ fontStyle: f.id }); Haptics.selectionAsync(); }}
        >
          <Text style={[
            s.textSelFontText,
            { fontFamily: f.family },
            obj.fontStyle === f.id && { color: '#000' },
          ]}>
            {f.label}
          </Text>
        </TouchableOpacity>
      ))}

      <View style={s.textSelDivider} />

      {/* Effect chips */}
      {TEXT_EFFECTS.map(e => (
        <TouchableOpacity
          key={e.id}
          style={[s.textSelFontChip, obj.textEffect === e.id && s.textSelFontChipActive]}
          onPress={() => { onUpdate({ textEffect: e.id }); Haptics.selectionAsync(); }}
        >
          <Text style={[s.textSelFontText, obj.textEffect === e.id && { color: '#000' }]}>
            {e.label}
          </Text>
        </TouchableOpacity>
      ))}

      <View style={s.textSelDivider} />

      {/* Color dots */}
      {TEXT_COLORS.slice(0, 10).map(c => (
        <TouchableOpacity
          key={c}
          style={[s.colorDot, { backgroundColor: c }, obj.color === c && s.colorDotActive]}
          onPress={() => { onUpdate({ color: c }); Haptics.selectionAsync(); }}
        />
      ))}

      {/* Font size */}
      <TouchableOpacity
        style={s.textSelFontChip}
        onPress={() => { onUpdate({ fontSize: ((obj.fontSize ?? 32) >= 56 ? 16 : (obj.fontSize ?? 32) + 8) }); }}
      >
        <Text style={s.textSelFontText}>{obj.fontSize ?? 32}px</Text>
      </TouchableOpacity>
    </ScrollView>
  </View>
));

// ─────────────────────────────────────────────────────────────────────────────
// SHAPE SELECTION BAR
// ─────────────────────────────────────────────────────────────────────────────

interface ShapeSelectionBarProps {
  obj:      ExtendedStoryObject;
  onUpdate: (patch: Partial<ExtendedStoryObject>) => void;
}

const ShapeSelectionBar = memo(({ obj, onUpdate }: ShapeSelectionBarProps) => {
  const [editingProp, setEditingProp] = useState<'fill' | 'stroke' | null>(null);

  return (
    <View style={s.shapeSelBar}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.textSelScroll}>

        {/* Fill label */}
        <TouchableOpacity
          style={[s.textSelFontChip, editingProp === 'fill' && s.textSelFontChipActive]}
          onPress={() => setEditingProp(p => p === 'fill' ? null : 'fill')}
        >
          <View style={[s.shapeColorPreview, { backgroundColor: obj.shapeFill ?? '#fff' }]} />
          <Text style={[s.textSelFontText, editingProp === 'fill' && { color: '#000' }]}>Fill</Text>
        </TouchableOpacity>

        {/* Stroke label */}
        <TouchableOpacity
          style={[s.textSelFontChip, editingProp === 'stroke' && s.textSelFontChipActive]}
          onPress={() => setEditingProp(p => p === 'stroke' ? null : 'stroke')}
        >
          <View style={[s.shapeColorPreview, { backgroundColor: obj.shapeStroke ?? 'transparent',
            borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)' }]} />
          <Text style={[s.textSelFontText, editingProp === 'stroke' && { color: '#000' }]}>Stroke</Text>
        </TouchableOpacity>

        <View style={s.textSelDivider} />

        {editingProp && SHAPE_COLORS.map(c => (
          <TouchableOpacity
            key={c}
            style={[
              s.colorDot,
              c === 'transparent' ? s.colorDotTransparent : { backgroundColor: c },
              (editingProp === 'fill' ? obj.shapeFill : obj.shapeStroke) === c && s.colorDotActive,
            ]}
            onPress={() => {
              if (editingProp === 'fill')   onUpdate({ shapeFill:   c });
              else                          onUpdate({ shapeStroke: c });
              Haptics.selectionAsync();
            }}
          />
        ))}

        {!editingProp && (
          <>
            {/* Stroke width */}
            <View style={s.textSelDivider} />
            {[0, 2, 4, 8].map(w => (
              <TouchableOpacity
                key={w}
                style={[s.textSelFontChip, obj.shapeStrokeWidth === w && s.textSelFontChipActive]}
                onPress={() => { onUpdate({ shapeStrokeWidth: w }); }}
              >
                <Text style={[s.textSelFontText, obj.shapeStrokeWidth === w && { color: '#000' }]}>
                  {w === 0 ? 'No Stroke' : `${w}pt`}
                </Text>
              </TouchableOpacity>
            ))}

            {/* Corner radius (for rect / rounded) */}
            {(obj.content === 'rect' || obj.content === 'rounded') && (
              <>
                <View style={s.textSelDivider} />
                {[0, 8, 16, 32].map(r => (
                  <TouchableOpacity
                    key={r}
                    style={[s.textSelFontChip, obj.shapeCornerRadius === r && s.textSelFontChipActive]}
                    onPress={() => { onUpdate({ shapeCornerRadius: r }); }}
                  >
                    <Text style={[s.textSelFontText, obj.shapeCornerRadius === r && { color: '#000' }]}>
                      r{r}
                    </Text>
                  </TouchableOpacity>
                ))}
              </>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// HISTORY MANAGER
// ─────────────────────────────────────────────────────────────────────────────

interface HistoryEntry { objects: ExtendedStoryObject[]; drawPaths: DrawPath[]; }

function useHistory(max = 30) {
  const past   = useRef<HistoryEntry[]>([]);
  const future = useRef<HistoryEntry[]>([]);

  const push = useCallback((e: HistoryEntry) => {
    past.current = [...past.current.slice(-(max - 1)), e];
    future.current = [];
  }, [max]);

  const undo = useCallback((current: HistoryEntry): HistoryEntry | null => {
    if (!past.current.length) return null;
    future.current = [current, ...future.current];
    const prev = past.current[past.current.length - 1];
    past.current = past.current.slice(0, -1);
    return prev;
  }, []);

  const redo = useCallback((current: HistoryEntry): HistoryEntry | null => {
    if (!future.current.length) return null;
    past.current = [...past.current, current];
    const next = future.current[0];
    future.current = future.current.slice(1);
    return next;
  }, []);

  return { push, undo, redo, canUndo: () => past.current.length > 0, canRedo: () => future.current.length > 0 };
}

// ─────────────────────────────────────────────────────────────────────────────
// LAYER LABEL
// ─────────────────────────────────────────────────────────────────────────────

function layerLabel(obj: ExtendedStoryObject): string {
  switch (obj.type) {
    case 'TEXT':    return obj.content?.slice(0, 18) || 'Text';
    case 'IMAGE':   return 'Image';
    case 'VIDEO':   return 'Video';
    case 'STICKER': return `Sticker`;
    default:        return `Shape`;
  }
}

const makeId = () => `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

// ─────────────────────────────────────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────────────────────────────────────

export default function AddStoryScreen() {
  const { theme }                           = useTheme();
  const router                              = useRouter();
  const insets                              = useSafeAreaInsets();
  const { width: screenW, height: screenH } = useWindowDimensions();

  const aspectRatio = 9 / 16;
  const availH      = screenH - insets.top - insets.bottom;
  let canvasW = screenW, canvasH = screenW / aspectRatio;
  if (canvasH > availH) { canvasH = availH; canvasW = canvasH * aspectRatio; }

  // ── State ──────────────────────────────────────────────────────────────────
  const [objects,        setObjects]       = useState<ExtendedStoryObject[]>([]);
  const [selectedId,     setSelectedId]    = useState<string | null>(null);
  const [editingId,      setEditingId]     = useState<string | null>(null);
  const [toolMode,       setToolMode]      = useState<ToolMode>('select');
  const [isUploading,    setIsUploading]   = useState(false);
  const [isSaving,       setIsSaving]      = useState(false);
  const [showLayers,     setShowLayers]    = useState(false);
  const [isVideosPaused, setIsVideosPaused]= useState(false);
  const [canvasBg,       setCanvasBg]      = useState<CanvasBg>({ type: 'solid', color: '#000' });
  const [drawPaths,      setDrawPaths]     = useState<DrawPath[]>([]);
  const [brushColor,     setBrushColor]    = useState('#FFF');
  const [brushSize,      setBrushSize]     = useState(6);
  const [isEraser,       setIsEraser]      = useState(false);
  const [storyDuration,  setStoryDuration] = useState(15);

  // Shape state
  const [shapeFill,         setShapeFill]         = useState('#FFFFFF');
  const [shapeStroke,       setShapeStroke]       = useState('transparent');
  const [shapeStrokeWidth,  setShapeStrokeWidth]  = useState(0);
  const [shapeCornerRadius, setShapeCornerRadius] = useState(0);

  // Text state
  const [currentText,  setCurrentText]  = useState('');
  const [selFont,      setSelFont]      = useState<FontStyle>('Modern');
  const [textColor,    setTextColor]    = useState('#FFF');
  const [textBg,       setTextBg]       = useState(false);
  const [textAlign,    setTextAlign]    = useState<TextAlign>('center');
  const [textEffect,   setTextEffect]   = useState<TextEffect>('none');
  const [fontSize,     setFontSize]     = useState(32);

  const [stickerTab, setStickerTab] = useState<'Emojis' | 'Icons'>('Emojis');

  const canvasRef = useRef<View>(null);
  const history   = useHistory();

  const [, requestMediaPerm] = ImagePicker.useMediaLibraryPermissions();

  const [fontsLoaded] = useFonts({
    Inter_900Black, Pacifico_400Regular,
    PlayfairDisplay_700Bold, PlayfairDisplay_700Bold_Italic,
    Bangers_400Regular, SpecialElite_400Regular,
  });

  // ── Derived ────────────────────────────────────────────────────────────────
  const selectedObj = useMemo(() => objects.find(o => o.id === selectedId) ?? null, [objects, selectedId]);
  const hasVideo    = useMemo(() => objects.some(o => o.type === 'VIDEO'), [objects]);
  const bgColors    = canvasBg.type === 'gradient' ? canvasBg.gradientColors! : [canvasBg.color, canvasBg.color] as [string, string];
  const alignIcon   = textAlign === 'left' ? 'format-align-left' : textAlign === 'right' ? 'format-align-right' : 'format-align-center';

  // Layers meta: sorted top→bottom (highest array index first)
  const layersMeta = useMemo<LayerItem[]>(() =>
    [...objects].reverse().map((obj, vi) => ({
      id: obj.id, type: obj.type,
      label: layerLabel(obj),
      isVisible: obj.isVisible !== false,
      isLocked:  obj.isLocked  === true,
      isSelected: obj.id === selectedId,
      index: objects.findIndex(o => o.id === obj.id),
    })),
    [objects, selectedId],
  );

  // ── Object ops ─────────────────────────────────────────────────────────────
  const checkpoint = useCallback(() => {
    history.push({ objects: objects.map(o => ({ ...o })), drawPaths: drawPaths.map(p => ({ ...p })) });
  }, [history, objects, drawPaths]);

  const addObject = useCallback((obj: ExtendedStoryObject) => {
    checkpoint();
    setObjects(prev => [...prev, { isVisible: true, isLocked: false, ...obj }]);
    setSelectedId(obj.id);
  }, [checkpoint]);

  const updateObject = useCallback((id: string, patch: Partial<ExtendedStoryObject>) => {
    setObjects(prev => prev.map(o => o.id === id ? { ...o, ...patch } : o));
  }, []);

  const deleteObject = useCallback((id: string) => {
    checkpoint();
    setObjects(prev => prev.filter(o => o.id !== id));
    setSelectedId(s => s === id ? null : s);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [checkpoint]);

  const duplicateObject = useCallback((id: string) => {
    checkpoint();
    setObjects(prev => {
      const obj = prev.find(o => o.id === id);
      if (!obj) return prev;
      const clone = { ...obj, id: makeId(), x: obj.x + 20, y: obj.y + 20 };
      setSelectedId(clone.id);
      return [...prev, clone];
    });
  }, [checkpoint]);

  // ── CRITICAL: selectObject does NOT reorder ────────────────────────────────
  const selectObject = useCallback((id: string | null) => {
    setSelectedId(id);
    // NO array reorder — z-index = render order only
  }, []);

  const reorderObjects = useCallback((fromIdx: number, toIdx: number) => {
    if (fromIdx === toIdx) return;
    checkpoint();
    setObjects(prev => {
      const arr = [...prev];
      const [item] = arr.splice(fromIdx, 1);
      arr.splice(toIdx, 0, item);
      return arr;
    });
  }, [checkpoint]);

  // ── Undo / Redo ────────────────────────────────────────────────────────────
  const handleUndo = useCallback(() => {
    const prev = history.undo({ objects: objects.map(o => ({ ...o })), drawPaths });
    if (!prev) { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); return; }
    setObjects(prev.objects); setDrawPaths(prev.drawPaths); setSelectedId(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [history, objects, drawPaths]);

  const handleRedo = useCallback(() => {
    const next = history.redo({ objects: objects.map(o => ({ ...o })), drawPaths });
    if (!next) { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); return; }
    setObjects(next.objects); setDrawPaths(next.drawPaths); setSelectedId(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [history, objects, drawPaths]);

  // ── Layers action handler ──────────────────────────────────────────────────
  const handleLayerAction = useCallback((id: string, action: LayerAction) => {
    switch (action) {
      case 'select':     selectObject(id); break;
      case 'visibility': setObjects(prev => prev.map(o => o.id === id ? { ...o, isVisible: !(o.isVisible !== false) } : o)); break;
      case 'lock':       setObjects(prev => prev.map(o => o.id === id ? { ...o, isLocked: !o.isLocked } : o)); break;
      case 'delete':     deleteObject(id); break;
    }
  }, [selectObject, deleteObject]);

  // ── Media ──────────────────────────────────────────────────────────────────
  const addMedia = useCallback(async (source: 'library' | 'camera') => {
    const perm = source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await requestMediaPerm();
    if (!perm.granted) { Alert.alert('Permission Required', 'SuviX needs media access.'); return; }
    const result = source === 'camera'
      ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images','videos'], quality: 1 })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images','videos'], quality: 1 });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    const objW  = canvasW * 0.7;
    addObject({
      id: makeId(), type: asset.type === 'video' ? 'VIDEO' : 'IMAGE',
      content: asset.uri, x: 0, y: 0, scale: 1, rotation: 0, imageFilter: 'none',
      width: objW,
      height: objW / ((asset.width ?? 1) / (asset.height ?? 1)),
      aspectRatio: (asset.width ?? 1) / (asset.height ?? 1),
    } as ExtendedStoryObject);
  }, [canvasW, addObject, requestMediaPerm]);

  const fitToCanvas = useCallback(() => {
    const obj = objects.find(o => o.id === selectedId);
    if (!obj || (obj.type !== 'IMAGE' && obj.type !== 'VIDEO')) return;
    checkpoint();
    const r = obj.aspectRatio ?? 1, cr = canvasW / canvasH;
    let nW: number, nH: number;
    if (r > cr) { nW = canvasW; nH = canvasW / r; } else { nH = canvasH; nW = canvasH * r; }
    const cy = (canvasH * 0.5) - (nH / 2) - canvasH * 0.35;
    updateObject(obj.id, { width: nW, height: nH, x: 0, y: cy, scale: 1, rotation: 0 });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [objects, selectedId, canvasW, canvasH, checkpoint, updateObject]);

  // ── Text ───────────────────────────────────────────────────────────────────
  const openTextEditor = useCallback((id?: string) => {
    if (id) {
      const obj = objects.find(o => o.id === id);
      if (obj?.type === 'TEXT') {
        setCurrentText(obj.content ?? ''); setSelFont(obj.fontStyle ?? 'Modern');
        setTextColor(obj.color ?? '#fff'); setTextBg(obj.textBackground ?? false);
        setTextAlign(obj.textAlign ?? 'center'); setTextEffect(obj.textEffect ?? 'none');
        setFontSize(obj.fontSize ?? 32); setEditingId(id);
      }
    } else {
      setCurrentText(''); setSelFont('Modern'); setTextColor('#fff');
      setTextBg(false); setTextAlign('center'); setTextEffect('none'); setFontSize(32); setEditingId(null);
    }
    setToolMode('text');
  }, [objects]);

  const confirmText = useCallback(() => {
    const t = currentText.trim();
    if (!t) { setToolMode('select'); return; }
    if (editingId) {
      checkpoint();
      updateObject(editingId, {
        content: t, fontStyle: selFont, color: textColor,
        textBackground: textBg, textAlign, textEffect, fontSize,
      });
    } else {
      addObject({
        id: makeId(), type: 'TEXT', content: t, x: 0, y: 0, scale: 1, rotation: 0,
        fontStyle: selFont, color: textColor, textBackground: textBg, textAlign, textEffect, fontSize,
        width: canvasW * 0.8,
      } as ExtendedStoryObject);
    }
    setCurrentText(''); setEditingId(null); setToolMode('select');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [currentText, editingId, checkpoint, updateObject, addObject, selFont, textColor, textBg, textAlign, textEffect, fontSize, canvasW]);

  // ── Shapes ─────────────────────────────────────────────────────────────────
  const addShape = useCallback((shapeId: ShapeId) => {
    const sz = Math.min(canvasW, canvasH) * 0.28;
    addObject({
      id: makeId(), type: 'SHAPE', content: shapeId,
      x: 0, y: 0, scale: 1, rotation: 0,
      width: sz, shapeHeight: shapeId === 'line' ? 0 : sz,
      shapeFill: shapeFill, shapeStroke: shapeStroke,
      shapeStrokeWidth: shapeStrokeWidth, shapeCornerRadius: shapeCornerRadius,
    } as ExtendedStoryObject);
    setToolMode('select');
  }, [canvasW, canvasH, addObject, shapeFill, shapeStroke, shapeStrokeWidth, shapeCornerRadius]);

  // ── Stickers ───────────────────────────────────────────────────────────────
  const addSticker = useCallback((content: string) => {
    addObject({ id: makeId(), type: 'STICKER', content, x: 0, y: 0, scale: 1, rotation: 0, width: 100 } as ExtendedStoryObject);
    setToolMode('select');
  }, [addObject]);

  // ── Drawing ────────────────────────────────────────────────────────────────
  const onPathComplete = useCallback((path: DrawPath) => {
    checkpoint(); setDrawPaths(prev => [...prev, path]);
  }, [checkpoint]);

  // ── Save / Share ───────────────────────────────────────────────────────────
  const saveToGallery = useCallback(async () => {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission needed'); return; }
    setIsSaving(true); setSelectedId(null);
    setTimeout(async () => {
      try {
        const uri   = await captureRef(canvasRef, { format: 'jpg', quality: 1 });
        const asset = await MediaLibrary.createAssetAsync(uri);
        const album = await MediaLibrary.getAlbumAsync('SuviX Stories');
        if (!album) await MediaLibrary.createAlbumAsync('SuviX Stories', asset, false);
        else         await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
        Alert.alert('Saved! 📸');
      } catch { Alert.alert('Error', 'Could not save.'); }
      finally { setIsSaving(false); }
    }, 160);
  }, []);

  const retryFn = async (fn: () => Promise<any>, n = 3) => {
    let d = 1000;
    for (let i = 0; i < n; i++) {
      try { return await fn(); } catch (e) { if (i === n - 1) throw e; await new Promise(r => setTimeout(r, d)); d *= 2; }
    }
  };

  const handleShare = useCallback(async () => {
    if (isUploading) return;
    setIsUploading(true); setSelectedId(null);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const videoObj = objects.find(o => o.type === 'VIDEO');
    const isVideo  = !!videoObj;
    const mime     = isVideo ? 'video/mp4' : 'image/jpeg';
    let uri: string;
    try {
      uri = isVideo ? videoObj!.content : await captureRef(canvasRef, { format: 'jpg', quality: 0.92 });
    } catch { Alert.alert('Error', 'Could not process canvas.'); setIsUploading(false); return; }
    router.back();
    const { startUpload, updateProgress, setFailed, setProcessing, setMediaId } = useUploadStore.getState();
    startUpload(isVideo ? 'VIDEO' : 'IMAGE', 'STORY');
    try {
      updateProgress(5);
      const ticket = await retryFn(() => api.get('/social/stories/upload-url', { params: { mimeType: mime } }));
      const { uploadUrl, storageKey } = ticket.data.data;
      updateProgress(12);
      await retryFn(() => new Promise<void>((res, rej) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', uploadUrl); xhr.setRequestHeader('Content-Type', mime);
        xhr.upload.onprogress = e => { if (e.lengthComputable) updateProgress(12 + Math.round(e.loaded / e.total * 78)); };
        xhr.onload   = () => xhr.status < 300 ? res() : rej(new Error(`HTTP ${xhr.status}`));
        xhr.onerror  = () => rej(new Error('Network error'));
        xhr.timeout  = 120_000; xhr.ontimeout = () => rej(new Error('Timeout'));
        xhr.send({ uri, type: mime, name: isVideo ? 'story.mp4' : 'story.jpg' } as any);
      }));
      updateProgress(92);
      const meta = {
        canvasWidth: canvasW, canvasHeight: canvasH, canvasBg,
        objects: objects, // 🚀 PRODUCTION: Send ALL objects so viewer can reconstruct the exact canvas
        primaryObjectId: isVideo ? videoObj!.id : null, // 🚀 Mark which object is the 'master' video
        drawPaths: drawPaths,
      };
      const resp = await retryFn(() => api.post('/social/stories', {
        storageKey, mimeType: mime,
        width: Math.round(canvasW), height: Math.round(canvasH),
        duration: isVideo ? storyDuration : 5,
        displayDuration: storyDuration,
        caption: null, metadata: meta,
      }));
      updateProgress(100);
      if (resp?.data?.data?.mediaId) setMediaId(resp.data.data.mediaId);
      setProcessing();
    } catch (err: any) { setFailed(err.message ?? 'Upload failed'); }
    finally { setIsUploading(false); }
  }, [isUploading, objects, canvasW, canvasH, canvasBg, drawPaths, storyDuration, router]);

  // ── Background tap (deselect) ──────────────────────────────────────────────
  const bgTap = Gesture.Tap().onEnd(() => { runOnJS(setSelectedId)(null); });

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  if (!fontsLoaded) {
    return (
      <View style={[s.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={{ color: '#fff', marginTop: 12, fontWeight: '600' }}>Initializing Studio...</Text>
      </View>
    );
  }

  const isTextSelected  = selectedObj?.type === 'TEXT';
  const isShapeSelected = selectedObj?.type === 'SHAPE';
  const isImageSelected = selectedObj?.type === 'IMAGE';
  const isVideoSelected = selectedObj?.type === 'VIDEO';

  return (
    <GestureHandlerRootView style={s.container}>
      <StatusBar hidden={toolMode === 'text'} barStyle="light-content" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.flex}>

        {/* ══════════════════════════════════════════════════════════════════
            HEADER
        ═══════════════════════════════════════════════════════════════════ */}
        <View style={[s.header, { marginTop: insets.top }]}>
          <View style={s.row}>
            <TouchableOpacity style={s.glassBtn} onPress={() => router.back()}>
              <Ionicons name="close" size={20} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={[s.glassBtn, !history.canUndo() && s.dim]} onPress={handleUndo}>
              <Ionicons name="arrow-undo-outline" size={19} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={[s.glassBtn, !history.canRedo() && s.dim]} onPress={handleRedo}>
              <Ionicons name="arrow-redo-outline" size={19} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={s.row}>
            {/* Draw */}
            <TouchableOpacity
              style={[s.glassBtn, toolMode === 'draw' && s.btnRed]}
              onPress={() => { setToolMode(m => m === 'draw' ? 'select' : 'draw'); setSelectedId(null); Haptics.selectionAsync(); }}
            >
              <MaterialCommunityIcons name="draw" size={19} color="#fff" />
            </TouchableOpacity>

            {/* Text */}
            <TouchableOpacity style={s.glassBtn} onPress={() => openTextEditor()}>
              <Ionicons name="text" size={19} color="#fff" />
            </TouchableOpacity>

            {/* Sticker */}
            <TouchableOpacity
              style={[s.glassBtn, toolMode === 'sticker' && s.btnYellow]}
              onPress={() => { setToolMode(m => m === 'sticker' ? 'select' : 'sticker'); setSelectedId(null); Haptics.selectionAsync(); }}
            >
              <Ionicons name="happy-outline" size={19} color={toolMode === 'sticker' ? '#000' : '#fff'} />
            </TouchableOpacity>

            {/* Shapes */}
            <TouchableOpacity
              style={[s.glassBtn, toolMode === 'shape' && s.btnPurple]}
              onPress={() => { setToolMode(m => m === 'shape' ? 'select' : 'shape'); setSelectedId(null); Haptics.selectionAsync(); }}
            >
              <MaterialCommunityIcons name="shape-outline" size={19} color={toolMode === 'shape' ? '#fff' : '#fff'} />
            </TouchableOpacity>

            {/* BG */}
            <TouchableOpacity
              style={[s.glassBtn, toolMode === 'bg' && s.btnGreen]}
              onPress={() => { setToolMode(m => m === 'bg' ? 'select' : 'bg'); setSelectedId(null); Haptics.selectionAsync(); }}
            >
              <MaterialCommunityIcons name="palette-outline" size={19} color={toolMode === 'bg' ? '#000' : '#fff'} />
            </TouchableOpacity>

            {/* Layers */}
            <TouchableOpacity
              style={[s.glassBtn, showLayers && s.btnCyan]}
              onPress={() => { setShowLayers(v => !v); Haptics.selectionAsync(); }}
            >
              <View>
                <MaterialCommunityIcons name="layers-outline" size={19} color="#fff" />
                {objects.length > 0 && (
                  <View style={s.badge}><Text style={s.badgeText}>{objects.length}</Text></View>
                )}
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* ══════════════════════════════════════════════════════════════════
            LEFT SIDEBAR
        ═══════════════════════════════════════════════════════════════════ */}
        <View style={[s.sidebar, { top: insets.top + 62 }]}>
          <TouchableOpacity style={[s.glassBtn, { marginBottom: 10 }]} onPress={saveToGallery} disabled={isSaving}>
            <Ionicons name={isSaving ? 'sync-outline' : 'download-outline'} size={18} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={[s.glassBtn, { marginBottom: 10 }]} onPress={() => addMedia('library')}>
            <Ionicons name="images-outline" size={18} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={[s.glassBtn, { marginBottom: 10 }]} onPress={() => addMedia('camera')}>
            <Ionicons name="camera-outline" size={18} color="#fff" />
          </TouchableOpacity>
          {(isImageSelected || isVideoSelected) && (
            <TouchableOpacity style={s.glassBtn} onPress={fitToCanvas}>
              <Ionicons name="expand-outline" size={18} color="#fff" />
            </TouchableOpacity>
          )}
        </View>

        {/* ══════════════════════════════════════════════════════════════════
            CANVAS
        ═══════════════════════════════════════════════════════════════════ */}
        <View style={s.canvasWrapper}>
          <ViewShot ref={canvasRef} options={{ format: 'jpg', quality: 0.95 }}>
            <GestureDetector gesture={bgTap}>
              <View style={[s.canvas, { width: canvasW, height: canvasH }]}>

                {/* Background */}
                <LinearGradient colors={bgColors} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />

                {/* Empty state */}
                {objects.length === 0 && drawPaths.length === 0 && toolMode === 'select' && (
                  <TouchableOpacity style={s.emptyCanvas} onPress={() => addMedia('library')} activeOpacity={0.8}>
                    <View style={s.emptyIconWrap}>
                      <Ionicons name="images" size={28} color="rgba(255,255,255,0.6)" />
                    </View>
                    <Text style={s.emptyTitle}>Tap to add a photo or video</Text>
                    <Text style={s.emptyHint}>or use the toolbar</Text>
                  </TouchableOpacity>
                )}

                {/* Objects — rendered in array order (z-index = index) */}
                {objects.map(obj => (
                  <CanvasObject
                    key={obj.id}
                    obj={obj}
                    isSelected={selectedId === obj.id}
                    isLocked={obj.isLocked === true}
                    isHidden={obj.isVisible === false}
                    canvasWidth={canvasW}
                    canvasHeight={canvasH}
                    drawMode={toolMode === 'draw'}
                    onSelect={() => selectObject(obj.id)}
                    onUpdate={patch => updateObject(obj.id, patch)}
                    onDelete={() => deleteObject(obj.id)}
                    onDuplicate={() => duplicateObject(obj.id)}
                    onEdit={obj.type === 'TEXT' ? () => openTextEditor(obj.id) : undefined}
                  >
                    {obj.type === 'TEXT'    && <CanvasTextItem item={obj} />}
                    {obj.type === 'STICKER' && <CanvasStickerItem item={obj} />}
                    {obj.type === 'IMAGE'   && <CanvasImageItem item={obj} />}
                    {obj.type === 'VIDEO'   && <CanvasVideoItem item={obj} isPaused={isVideosPaused} />}
                    {obj.type === 'SHAPE'   && <CanvasShapeItem item={obj} />}
                  </CanvasObject>
                ))}

                {/* Drawing layer */}
                <DrawingCanvas
                  width={canvasW} height={canvasH} paths={drawPaths}
                  brushColor={brushColor} brushSize={brushSize}
                  isEraser={isEraser}
                  eraserBgColor={canvasBg.type === 'solid' ? canvasBg.color : '#000'}
                  interactive={toolMode === 'draw'}
                  onPathComplete={onPathComplete}
                />

                {/* ── CENTRAL PLAY / PAUSE (shown whenever video exists) ── */}
                {hasVideo && toolMode === 'select' && (
                  <TouchableOpacity
                    style={s.centralPlay}
                    onPress={() => { setIsVideosPaused(v => !v); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0.8)']}
                      style={s.centralPlayGrad}
                    >
                      <Ionicons name={isVideosPaused ? 'play' : 'pause'} size={22} color="#fff" />
                      <Text style={s.centralPlayText}>{isVideosPaused ? 'Play' : 'Pause'}</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}
              </View>
            </GestureDetector>
          </ViewShot>
        </View>

        {/* ══════════════════════════════════════════════════════════════════
            CONTEXT TOOLBARS (below canvas)
        ═══════════════════════════════════════════════════════════════════ */}

        {/* TEXT SELECTION BAR */}
        {selectedId && toolMode === 'select' && isTextSelected && selectedObj && (
          <TextSelectionBar
            obj={selectedObj}
            onUpdate={patch => updateObject(selectedId, patch)}
            onEditFull={() => openTextEditor(selectedId)}
          />
        )}

        {/* SHAPE SELECTION BAR */}
        {selectedId && toolMode === 'select' && isShapeSelected && selectedObj && (
          <ShapeSelectionBar
            obj={selectedObj}
            onUpdate={patch => updateObject(selectedId, patch)}
          />
        )}

        {/* IMAGE / VIDEO TOOLBAR */}
        {selectedId && toolMode === 'select' && (isImageSelected || isVideoSelected) && selectedObj && (
          <View style={s.objBar}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.objBarContent}>
              <TouchableOpacity style={s.objBarBtn}
                onPress={() => updateObject(selectedId, { opacity: Math.max(0.1, (selectedObj.opacity ?? 1) - 0.2) })}>
                <Text style={s.objBarIcon}>◐</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.objBarBtn}
                onPress={() => updateObject(selectedId, { opacity: Math.min(1, (selectedObj.opacity ?? 1) + 0.2) })}>
                <Text style={s.objBarIcon}>●</Text>
              </TouchableOpacity>
              <View style={s.divider} />
              {isImageSelected && IMAGE_FILTERS.map(f => (
                <TouchableOpacity key={f.id}
                  style={[s.chip, selectedObj.imageFilter === f.id && s.chipActive]}
                  onPress={() => updateObject(selectedId, { imageFilter: f.id })}>
                  <Text style={[s.chipText, selectedObj.imageFilter === f.id && { color: '#000' }]}>{f.label}</Text>
                </TouchableOpacity>
              ))}
              {isVideoSelected && (
                <TouchableOpacity
                  style={[s.chip, !isVideosPaused && s.chipActive]}
                  onPress={() => { setIsVideosPaused(v => !v); }}
                >
                  <Ionicons name={isVideosPaused ? 'play' : 'pause'} size={13} color={isVideosPaused ? '#fff' : '#000'} />
                  <Text style={[s.chipText, !isVideosPaused && { color: '#000', marginLeft: 4 }]}>
                    {isVideosPaused ? 'Play' : 'Pause'}
                  </Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        )}

        {/* DRAW TOOLBAR */}
        {toolMode === 'draw' && (
          <View style={s.drawBar}>
            <TouchableOpacity style={[s.drawModeBtn, !isEraser && s.drawModeBtnActive]} onPress={() => setIsEraser(false)}>
              <MaterialCommunityIcons name="draw" size={17} color={!isEraser ? '#000' : '#fff'} />
            </TouchableOpacity>
            <TouchableOpacity style={[s.drawModeBtn, isEraser && s.drawModeBtnActive]} onPress={() => setIsEraser(true)}>
              <MaterialCommunityIcons name="eraser" size={17} color={isEraser ? '#000' : '#fff'} />
            </TouchableOpacity>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }} contentContainerStyle={s.colorRow}>
              {DRAW_COLORS.map(c => (
                <TouchableOpacity key={c}
                  style={[s.colorDot, { backgroundColor: c }, !isEraser && brushColor === c && s.colorDotActive]}
                  onPress={() => { setBrushColor(c); setIsEraser(false); }} />
              ))}
            </ScrollView>
            {[3, 6, 10, 16].map(sz => (
              <TouchableOpacity key={sz} style={s.sizeBtn} onPress={() => setBrushSize(sz)}>
                <View style={[s.sizeDot, { width: sz + 4, height: sz + 4, borderRadius: (sz + 4) / 2 }, brushSize === sz && { backgroundColor: brushColor }]} />
              </TouchableOpacity>
            ))}
            <TouchableOpacity onPress={() => Alert.alert('Clear Drawing?', '', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Clear', style: 'destructive', onPress: () => { checkpoint(); setDrawPaths([]); } },
            ])}>
              <MaterialCommunityIcons name="delete-sweep-outline" size={20} color="#EF4444" />
            </TouchableOpacity>
          </View>
        )}

        {/* FOOTER */}
        {toolMode === 'select' && !isSaving && (
          <View style={[s.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
            <View style={s.durationRow}>
              {STORY_DURATIONS.map(d => (
                <TouchableOpacity key={d}
                  style={[s.durationChip, storyDuration === d && s.durationChipActive]}
                  onPress={() => { setStoryDuration(d); Haptics.selectionAsync(); }}>
                  <Text style={[s.durationText, storyDuration === d && { color: '#000' }]}>{d}s</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={s.shareBtn} onPress={handleShare} disabled={isUploading}>
              {isUploading
                ? <ActivityIndicator color="#fff" />
                : <>
                    <Text style={s.shareBtnText}>Share Story</Text>
                    <View style={s.shareBtnIcon}><Ionicons name="send" size={14} color="#EF4444" /></View>
                  </>
              }
            </TouchableOpacity>
          </View>
        )}

      </KeyboardAvoidingView>

      {/* ════════════════════════════════════════════════════════════════════
          LAYERS PANEL
      ═══════════════════════════════════════════════════════════════════ */}
      {showLayers && (
        <LayersPanel
          layers={layersMeta}
          onAction={handleLayerAction}
          onReorder={reorderObjects}
          onClose={() => setShowLayers(false)}
        />
      )}

      {/* ════════════════════════════════════════════════════════════════════
          TEXT INPUT OVERLAY
      ═══════════════════════════════════════════════════════════════════ */}
      {toolMode === 'text' && (
        <View style={[StyleSheet.absoluteFill, s.textOverlay]}>
          <View style={[s.textHeader, { marginTop: insets.top }]}>
            <TouchableOpacity
              style={s.fontCycleBtn}
              onPress={() => {
                const i = FONT_OPTIONS.findIndex(f => f.id === selFont);
                setSelFont(FONT_OPTIONS[(i + 1) % FONT_OPTIONS.length].id);
              }}
            >
              <Text style={[s.fontCycleBtnText, { fontFamily: FONT_OPTIONS.find(f => f.id === selFont)?.family }]}>
                {FONT_OPTIONS.find(f => f.id === selFont)?.label}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={confirmText}>
              <Text style={s.textDoneBtn}>Done</Text>
            </TouchableOpacity>
          </View>

          <View style={s.textControls}>
            <TouchableOpacity style={[s.textCtrlBtn, textBg && s.textCtrlBtnActive]} onPress={() => setTextBg(v => !v)}>
              <MaterialCommunityIcons name="format-color-fill" size={17} color={textBg ? '#000' : '#fff'} />
            </TouchableOpacity>
            <TouchableOpacity style={s.textCtrlBtn}
              onPress={() => { const i = ALIGN_CYCLE.indexOf(textAlign); setTextAlign(ALIGN_CYCLE[(i + 1) % 3]); }}>
              <MaterialCommunityIcons name={alignIcon as any} size={17} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={s.textCtrlBtn} onPress={() => setFontSize(s => s >= 56 ? 16 : s + 8)}>
              <Text style={{ color: '#fff', fontSize: 11, fontWeight: '900' }}>{fontSize}</Text>
            </TouchableOpacity>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="always"
              style={{ flex: 1 }} contentContainerStyle={s.colorRow}>
              {TEXT_COLORS.map(c => (
                <TouchableOpacity key={c}
                  style={[s.colorDot, { backgroundColor: c }, textColor === c && s.colorDotActive]}
                  onPress={() => setTextColor(c)} />
              ))}
            </ScrollView>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="always"
            contentContainerStyle={{ paddingHorizontal: 14, gap: 8, paddingBottom: 8 }}>
            {TEXT_EFFECTS.map(e => (
              <TouchableOpacity key={e.id}
                style={[s.chip, textEffect === e.id && s.chipActive]}
                onPress={() => setTextEffect(e.id)}>
                <Text style={[s.chipText, textEffect === e.id && { color: '#000' }]}>{e.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={s.textCenter}>
            <TextInput autoFocus multiline value={currentText} onChangeText={setCurrentText}
              placeholder="Type something..." placeholderTextColor="rgba(255,255,255,0.3)"
              style={[
                s.textInput,
                { color: textColor, fontFamily: FONT_OPTIONS.find(f => f.id === selFont)?.family, textAlign, fontSize },
                textEffect === 'neon'   && { textShadowColor: 'rgba(255,255,255,0.95)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 14 },
                textEffect === 'shadow' && { textShadowColor: 'rgba(0,0,0,0.9)', textShadowOffset: { width: 2, height: 2 }, textShadowRadius: 4 },
              ]}
            />
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="always"
            contentContainerStyle={s.fontPickerRow}>
            {FONT_OPTIONS.map(f => (
              <TouchableOpacity key={f.id}
                style={[s.fontChip, selFont === f.id && s.fontChipActive]}
                onPress={() => setSelFont(f.id)}>
                <Text style={[s.fontChipText, { fontFamily: f.family }, selFont === f.id && { color: '#000' }]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          STICKER OVERLAY
      ═══════════════════════════════════════════════════════════════════ */}
      {toolMode === 'sticker' && (
        <View style={[StyleSheet.absoluteFill, s.sheetOverlay]}>
          <TouchableOpacity style={s.sheetBg} onPress={() => setToolMode('select')} activeOpacity={1} />
          <View style={[s.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <View style={s.sheetHandle}><View style={s.sheetHandlePill} /></View>
            <View style={s.sheetTabs}>
              {(['Emojis', 'Icons'] as const).map(t => (
                <TouchableOpacity key={t} style={[s.sheetTab, stickerTab === t && s.sheetTabActive]} onPress={() => setStickerTab(t)}>
                  <Text style={[s.sheetTabText, stickerTab === t && { color: '#000' }]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {stickerTab === 'Emojis' && (
              <FlatList data={Object.keys(EMOJI_STICKERS)} numColumns={7} keyExtractor={k => k}
                contentContainerStyle={{ paddingHorizontal: 12 }}
                renderItem={({ item }) => (
                  <TouchableOpacity style={s.emojiBox} onPress={() => addSticker(item)}>
                    <Text style={s.emojiText}>{(EMOJI_STICKERS as any)[item]}</Text>
                  </TouchableOpacity>
                )} />
            )}
            {stickerTab === 'Icons' && (
              <View style={s.iconGrid}>
                {[
                  { id: 'heart',    el: <Ionicons name="heart" size={30} color="#FF3040" /> },
                  { id: 'star',     el: <Ionicons name="star"  size={30} color="#FFD700" /> },
                  { id: 'fire',     el: <MaterialCommunityIcons name="fire" size={30} color="#FF4500" /> },
                  { id: 'verified', el: <MaterialCommunityIcons name="check-decagram" size={30} color="#3897f0" /> },
                  { id: 'happy',    el: <Ionicons name="happy" size={30} color="#FFD700" /> },
                  { id: 'lightning',el: <Ionicons name="flash" size={30} color="#8B5CF6" /> },
                ].map(({ id, el }) => (
                  <TouchableOpacity key={id} style={s.iconBox} onPress={() => addSticker(id)}>{el}</TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          SHAPE PICKER OVERLAY
      ═══════════════════════════════════════════════════════════════════ */}
      {toolMode === 'shape' && (
        <View style={[StyleSheet.absoluteFill, s.sheetOverlay]}>
          <TouchableOpacity style={s.sheetBg} onPress={() => setToolMode('select')} activeOpacity={1} />
          <View style={[s.sheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
            <View style={s.sheetHandle}><View style={s.sheetHandlePill} /></View>
            <Text style={s.shapeTitle}>Shapes</Text>

            {/* Shape grid */}
            <View style={s.shapeGrid}>
              {ALL_SHAPES.map(sh => (
                <TouchableOpacity key={sh.id} style={s.shapeCard} onPress={() => addShape(sh.id as ShapeId)}>
                  <Text style={[s.shapeSymbol, { color: shapeFill === 'transparent' ? '#fff' : shapeFill }]}>{sh.symbol}</Text>
                  <Text style={s.shapeLabel}>{sh.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Quick color customization before placing */}
            <Text style={s.shapeSubtitle}>Fill Color</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.colorRow}>
              {SHAPE_COLORS.map(c => (
                <TouchableOpacity key={c}
                  style={[s.colorDot,
                    c === 'transparent' ? s.colorDotTransparent : { backgroundColor: c },
                    shapeFill === c && s.colorDotActive]}
                  onPress={() => setShapeFill(c)} />
              ))}
            </ScrollView>

            <Text style={s.shapeSubtitle}>Stroke Color</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.colorRow}>
              {SHAPE_COLORS.map(c => (
                <TouchableOpacity key={c}
                  style={[s.colorDot,
                    c === 'transparent' ? s.colorDotTransparent : { backgroundColor: c },
                    shapeStroke === c && s.colorDotActive]}
                  onPress={() => setShapeStroke(c)} />
              ))}
            </ScrollView>
          </View>
        </View>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          BACKGROUND OVERLAY
      ═══════════════════════════════════════════════════════════════════ */}
      {toolMode === 'bg' && (
        <View style={[StyleSheet.absoluteFill, s.sheetOverlay]}>
          <TouchableOpacity style={s.sheetBg} onPress={() => setToolMode('select')} activeOpacity={1} />
          <View style={[s.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <View style={s.sheetHandle}><View style={s.sheetHandlePill} /></View>
            <Text style={s.sheetSectionTitle}>SOLID</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.bgColorRow}>
              {BG_SOLID_PRESETS.map(c => (
                <TouchableOpacity key={c}
                  style={[s.bgSolidDot, { backgroundColor: c }, canvasBg.type === 'solid' && canvasBg.color === c && s.bgDotActive]}
                  onPress={() => setCanvasBg({ type: 'solid', color: c })} />
              ))}
            </ScrollView>
            <Text style={s.sheetSectionTitle}>GRADIENTS</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.bgGradRow}>
              {BG_GRADIENT_PRESETS.map(g => (
                <TouchableOpacity key={g.id}
                  style={[s.bgGradChip, canvasBg.type === 'gradient' && canvasBg.gradientColors?.[0] === g.colors[0] && s.bgGradChipActive]}
                  onPress={() => setCanvasBg({ type: 'gradient', color: g.colors[0], gradientColors: g.colors })}>
                  <LinearGradient colors={g.colors} style={s.bgGradPreview} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
                  <Text style={s.bgGradLabel}>{g.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      )}

    </GestureHandlerRootView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0B' },
  flex:      { flex: 1 },
  row:       { flexDirection: 'row', alignItems: 'center', gap: 8 },

  glassBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.11)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)',
    justifyContent: 'center', alignItems: 'center',
  },
  dim:       { opacity: 0.28 },
  btnRed:    { backgroundColor: '#EF4444', borderColor: '#EF4444' },
  btnYellow: { backgroundColor: '#FFD700', borderColor: '#FFD700' },
  btnGreen:  { backgroundColor: '#22C55E', borderColor: '#22C55E' },
  btnPurple: { backgroundColor: '#8B5CF6', borderColor: '#8B5CF6' },
  btnCyan:   { backgroundColor: '#06B6D4', borderColor: '#06B6D4' },

  badge: {
    position: 'absolute', top: -4, right: -5,
    minWidth: 14, height: 14, borderRadius: 7,
    backgroundColor: '#EF4444',
    justifyContent: 'center', alignItems: 'center', paddingHorizontal: 2,
  },
  badgeText: { color: '#fff', fontSize: 8, fontWeight: '900' },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 14, height: 54, zIndex: 100,
  },
  sidebar: { position: 'absolute', left: 14, zIndex: 100, alignItems: 'center' },

  canvasWrapper: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  canvas: {
    borderRadius: 20, overflow: 'hidden', backgroundColor: '#111',
    shadowColor: '#000', shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.5, shadowRadius: 24, elevation: 18,
  },

  selectionRing: {
    ...StyleSheet.absoluteFillObject, borderRadius: 8, borderStyle: 'dashed',
  },
  ctrlBtn: {
    position: 'absolute', width: 22, height: 22, borderRadius: 11,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.5, shadowRadius: 4, elevation: 6,
  },
  ctrlTL: { top: -11, left: -11 },
  ctrlTR: { top: -11, right: -11 },
  ctrlBL: { bottom: -11, left: -11 },
  ctrlBR: { bottom: -11, right: -11 },

  emptyCanvas: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  emptyIconWrap: {
    width: 58, height: 58, borderRadius: 29,
    backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center', marginBottom: 10,
  },
  emptyTitle: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '700', marginBottom: 4 },
  emptyHint:  { color: 'rgba(255,255,255,0.3)', fontSize: 11 },

  // ── Central play/pause ────────────────────────────────────────────────────
  centralPlay: {
    position: 'absolute', bottom: 14, alignSelf: 'center',
    borderRadius: 24, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5, shadowRadius: 10, elevation: 8,
  },
  centralPlayGrad: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 9, gap: 8,
    borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
  },
  centralPlayText: { color: '#fff', fontSize: 13, fontWeight: '800' },

  // ── Text selection bar ────────────────────────────────────────────────────
  textSelBar: {
    flexDirection: 'row', alignItems: 'center',
    height: 50, borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.07)',
    backgroundColor: 'rgba(10,10,11,0.95)',
  },
  textSelEditBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, height: '100%',
    borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.1)',
  },
  textSelEditText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  textSelDivider: { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.1)', marginHorizontal: 6 },
  textSelScroll: { paddingHorizontal: 10, alignItems: 'center', gap: 7 },
  textSelFontChip: {
    paddingHorizontal: 11, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.09)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.13)',
  },
  textSelFontChipActive: { backgroundColor: '#FFFFFF' },
  textSelFontText: { color: '#fff', fontSize: 11, fontWeight: '700' },

  // ── Shape selection bar ───────────────────────────────────────────────────
  shapeSelBar: {
    height: 50, borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.07)',
    backgroundColor: 'rgba(10,10,11,0.95)',
  },
  shapeColorPreview: { width: 14, height: 14, borderRadius: 7, marginRight: 4 },

  // ── Object toolbar ────────────────────────────────────────────────────────
  objBar: {
    height: 50, borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.07)',
    backgroundColor: 'rgba(10,10,11,0.95)',
  },
  objBarContent: { paddingHorizontal: 14, alignItems: 'center', gap: 8 },
  objBarBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.09)', justifyContent: 'center', alignItems: 'center',
  },
  objBarIcon: { color: '#fff', fontSize: 14 },
  divider:    { width: 1, height: 22, backgroundColor: 'rgba(255,255,255,0.12)' },

  chip: {
    paddingHorizontal: 11, height: 30, borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.09)',
    justifyContent: 'center', alignItems: 'center', flexDirection: 'row',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.13)',
  },
  chipActive: { backgroundColor: '#FFFFFF', borderColor: '#FFFFFF' },
  chipText:   { color: '#fff', fontSize: 11, fontWeight: '700' },

  // ── Draw toolbar ──────────────────────────────────────────────────────────
  drawBar: {
    flexDirection: 'row', alignItems: 'center',
    height: 54, paddingHorizontal: 12, gap: 8,
    backgroundColor: 'rgba(10,10,11,0.95)',
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.07)',
  },
  drawModeBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.11)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
  },
  drawModeBtnActive: { backgroundColor: '#FFFFFF' },
  colorRow: { paddingHorizontal: 4, alignItems: 'center', gap: 8 },
  colorDot: {
    width: 24, height: 24, borderRadius: 12,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.2)',
  },
  colorDotActive: { borderWidth: 3, borderColor: '#FFFFFF' },
  colorDotTransparent: {
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.4)',
    backgroundColor: 'transparent',
  },
  sizeBtn: { width: 26, height: 34, justifyContent: 'center', alignItems: 'center' },
  sizeDot: { backgroundColor: 'rgba(255,255,255,0.35)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.5)' },

  // ── Footer ────────────────────────────────────────────────────────────────
  footer: { alignItems: 'center', paddingHorizontal: 24, paddingTop: 10 },
  durationRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  durationChip: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)',
  },
  durationChipActive: { backgroundColor: '#FFFFFF' },
  durationText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  shareBtn: {
    flexDirection: 'row', alignItems: 'center',
    paddingLeft: 22, paddingRight: 5, paddingVertical: 5,
    borderRadius: 30, backgroundColor: '#EF4444',
    shadowColor: '#EF4444', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 10,
  },
  shareBtnText: { color: '#fff', fontSize: 15, fontWeight: '900', marginRight: 10 },
  shareBtnIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },

  // ── Layers panel ──────────────────────────────────────────────────────────
  layersOverlay: { ...StyleSheet.absoluteFillObject, zIndex: 200 },
  layersBg:      { flex: 1 },
  layersPanel: {
    backgroundColor: '#161618',
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
    paddingHorizontal: 14, paddingBottom: 24,
  },
  layersHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14, gap: 8,
  },
  layersTitle: { flex: 1, color: '#F0F0F0', fontSize: 15, fontWeight: '900', letterSpacing: -0.3 },
  layersCountBadge: {
    backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 10,
    paddingHorizontal: 7, paddingVertical: 2,
  },
  layersCountText: { color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '800' },
  layersEmpty: { alignItems: 'center', paddingVertical: 32, gap: 8 },
  layersEmptyText: { color: 'rgba(255,255,255,0.2)', fontSize: 12, fontWeight: '600' },

  layerRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 8, paddingHorizontal: 10,
    borderRadius: 12, marginBottom: 5,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    gap: 8,
  },
  layerRowSelected: {
    backgroundColor: 'rgba(0,188,212,0.1)',
    borderColor: 'rgba(0,188,212,0.4)',
  },
  layerRowDragging: {
    backgroundColor: 'rgba(139,92,246,0.2)',
    borderColor: 'rgba(139,92,246,0.5)',
    shadowColor: '#8B5CF6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 8,
  },
  dragHandle: { width: 24, justifyContent: 'center', alignItems: 'center', paddingVertical: 4 },
  layerThumb: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.07)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1.5,
  },
  layerLabel:    { color: 'rgba(255,255,255,0.65)', fontSize: 12, fontWeight: '600' },
  layerSubLabel: { color: 'rgba(255,255,255,0.28)', fontSize: 9, fontWeight: '700', letterSpacing: 0.8, marginTop: 1 },
  layerActionBtn:{ width: 28, height: 28, borderRadius: 7, justifyContent: 'center', alignItems: 'center' },
  insertIndicator: { height: 2, backgroundColor: '#00BCD4', borderRadius: 1, marginVertical: 2, marginHorizontal: 8 },

  // ── Text overlay ──────────────────────────────────────────────────────────
  textOverlay:    { backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 300 },
  textHeader: {
    height: 54, paddingHorizontal: 16,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.9)',
  },
  fontCycleBtn: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.11)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
  },
  fontCycleBtnText: { color: '#fff', fontSize: 13 },
  textDoneBtn: { color: '#fff', fontWeight: '900', fontSize: 17 },
  textControls: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, height: 46, gap: 8,
    backgroundColor: 'rgba(0,0,0,0.9)',
  },
  textCtrlBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.11)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)',
  },
  textCtrlBtnActive: { backgroundColor: '#FFFFFF' },
  textCenter: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 22, backgroundColor: 'rgba(0,0,0,0.9)',
  },
  textInput: {
    width: '100%',
    textShadowColor: 'rgba(0,0,0,0.4)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 6,
  },
  fontPickerRow: {
    paddingHorizontal: 14, paddingVertical: 10, gap: 8, alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.9)',
  },
  fontChip: {
    paddingHorizontal: 14, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.09)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)',
  },
  fontChipActive: { backgroundColor: '#FFFFFF' },
  fontChipText: { color: '#fff', fontSize: 12 },

  // ── Sheet overlays ────────────────────────────────────────────────────────
  sheetOverlay: { zIndex: 200 },
  sheetBg:      { flex: 1 },
  sheet: {
    backgroundColor: '#161618',
    borderTopLeftRadius: 22, borderTopRightRadius: 22,
    borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
    maxHeight: '70%',
  },
  sheetHandle: { alignItems: 'center', paddingTop: 10, paddingBottom: 4 },
  sheetHandlePill: { width: 38, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.18)' },
  sheetTabs: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 12 },
  sheetTab: {
    flex: 1, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.07)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  sheetTabActive: { backgroundColor: '#FFFFFF' },
  sheetTabText:   { color: '#fff', fontWeight: '700', fontSize: 12 },
  sheetSectionTitle: {
    color: 'rgba(255,255,255,0.3)', fontSize: 9, fontWeight: '900', letterSpacing: 1.5,
    paddingHorizontal: 18, marginTop: 10, marginBottom: 8,
  },
  emojiBox:  { flex: 1/7, aspectRatio: 1, justifyContent: 'center', alignItems: 'center' },
  emojiText: { fontSize: 30 },
  iconGrid:  { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 10 },
  iconBox:   { width: 62, height: 62, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.06)', justifyContent: 'center', alignItems: 'center' },

  // ── Shape picker ──────────────────────────────────────────────────────────
  shapeTitle:    { color: '#fff', fontSize: 15, fontWeight: '900', paddingHorizontal: 18, marginBottom: 12 },
  shapeSubtitle: { color: 'rgba(255,255,255,0.35)', fontSize: 9, fontWeight: '900', letterSpacing: 1.5, paddingHorizontal: 18, marginTop: 10, marginBottom: 8 },
  shapeGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 14, gap: 8, marginBottom: 4 },
  shapeCard: {
    width: '18%', paddingVertical: 10, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center', gap: 4,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  shapeSymbol: { fontSize: 26 },
  shapeLabel:  { color: 'rgba(255,255,255,0.5)', fontSize: 9, fontWeight: '700' },

  // ── BG picker ─────────────────────────────────────────────────────────────
  bgColorRow: { paddingHorizontal: 16, gap: 10, paddingBottom: 4 },
  bgSolidDot: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: 'transparent' },
  bgDotActive: { borderColor: '#FFFFFF' },
  bgGradRow:   { paddingHorizontal: 16, gap: 10, paddingBottom: 16 },
  bgGradChip:  { alignItems: 'center', gap: 5, padding: 4, borderRadius: 12, borderWidth: 2, borderColor: 'transparent' },
  bgGradChipActive: { borderColor: '#FFFFFF' },
  bgGradPreview: { width: 46, height: 46, borderRadius: 12 },
  bgGradLabel:   { color: 'rgba(255,255,255,0.6)', fontSize: 14 },
});