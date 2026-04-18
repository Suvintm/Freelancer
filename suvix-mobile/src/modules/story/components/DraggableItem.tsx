import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, {
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  children: React.ReactNode;
  initialX?: number;
  initialY?: number;
  isSelected?: boolean;
  gesturesDisabled?: boolean;   // true when draw mode is active
  onSelect?: () => void;
  onDelete?: () => void;
  onEdit?: () => void;
  onDuplicate?: () => void;
  activeX?: Animated.SharedValue<number>;
  activeY?: Animated.SharedValue<number>;
  activeScale?: Animated.SharedValue<number>;
  activeRotation?: Animated.SharedValue<number>;
  activeWidth?: Animated.SharedValue<number>;
  isResizing?: Animated.SharedValue<boolean>;
  initialWidth?: number;
  opacity?: number;
  onUpdate?: (data: { x: number; y: number; scale: number; rotation: number; width?: number }) => void;
  // Snap guide callbacks (optional)
  onSnapChange?: (snapX: boolean, snapY: boolean) => void;
  // Interaction hooks for playback control
  onInteractionStart?: () => void;
  onInteractionEnd?: () => void;
}

const SNAP_THRESHOLD = 12;

export const DraggableItem: React.FC<Props> = ({
  children,
  initialX = 0,
  initialY = 0,
  isSelected = false,
  gesturesDisabled = false,
  onSelect,
  onDelete,
  onEdit,
  onDuplicate,
  activeX,
  activeY,
  activeScale,
  activeRotation,
  activeWidth,
  isResizing,
  initialWidth,
  opacity = 1,
  onUpdate,
  onSnapChange,
  onInteractionStart,
  onInteractionEnd,
}) => {
  const localX        = useSharedValue(initialX);
  const localY        = useSharedValue(initialY);
  const localScale    = useSharedValue(1);
  const localRotation = useSharedValue(0);
  const localWidth    = useSharedValue(initialWidth ?? 280);

  const startX            = useSharedValue(0);
  const startY            = useSharedValue(0);
  const startScale        = useSharedValue(1);
  const startRotation     = useSharedValue(0);
  const startResizeWidth  = useSharedValue(0);

  // Mirror active shared values -> local when this item is selected
  useAnimatedReaction(
    () => ({
      x: activeX?.value,
      y: activeY?.value,
      s: activeScale?.value,
      r: activeRotation?.value,
      w: activeWidth?.value,
    }),
    (cur) => {
      if (!isSelected) return;
      if (cur.x !== undefined) localX.value        = cur.x;
      if (cur.y !== undefined) localY.value        = cur.y;
      if (cur.s !== undefined) localScale.value    = cur.s;
      if (cur.r !== undefined) localRotation.value = cur.r;
      if (cur.w !== undefined) localWidth.value    = cur.w;
    },
    [isSelected],
  );

  const notifyUpdate = (
    x: number, y: number, s: number, r: number, w: number,
  ) => {
    onUpdate?.({ x, y, scale: s, rotation: r, width: w });
  };

  const notifySnap = (x: number, y: number) => {
    onSnapChange?.(Math.abs(x) < SNAP_THRESHOLD, Math.abs(y) < SNAP_THRESHOLD);
  };

  // ── Tap ──────────────────────────────────────────────────────────────────────
  const tapGesture = Gesture.Tap()
    .enabled(!gesturesDisabled)
    .onStart(() => { if (onSelect) runOnJS(onSelect)(); });

  // ── Pan ──────────────────────────────────────────────────────────────────────
  const panGesture = Gesture.Pan()
    .enabled(!gesturesDisabled && !isSelected)
    .onBegin(() => { if (onSelect) runOnJS(onSelect)(); })
    .onStart(() => {
      startX.value = localX.value;
      startY.value = localY.value;
      if (onSelect) runOnJS(onSelect)();
      if (onInteractionStart) runOnJS(onInteractionStart)();
    })
    .onUpdate((e) => {
      if (isResizing?.value) return;
      let nx = startX.value + e.translationX;
      let ny = startY.value + e.translationY;
      // Soft snap to centre
      if (Math.abs(nx) < SNAP_THRESHOLD) nx = 0;
      if (Math.abs(ny) < SNAP_THRESHOLD) ny = 0;
      localX.value = nx;
      localY.value = ny;
      runOnJS(notifySnap)(nx, ny);
    })
    .onEnd(() => {
      runOnJS(notifyUpdate)(
        localX.value, localY.value,
        localScale.value, localRotation.value, localWidth.value,
      );
      runOnJS(notifySnap)(99, 99); // clear snap guides
      if (onInteractionEnd) runOnJS(onInteractionEnd)();
    });

  // ── Pinch ────────────────────────────────────────────────────────────────────
  const pinchGesture = Gesture.Pinch()
    .enabled(!gesturesDisabled && !isSelected)
    .onStart(() => { 
      startScale.value = localScale.value;
      if (onInteractionStart) runOnJS(onInteractionStart)();
    })
    .onUpdate((e) => {
      if (!isResizing?.value) localScale.value = startScale.value * e.scale;
    })
    .onEnd(() => {
      runOnJS(notifyUpdate)(
        localX.value, localY.value,
        localScale.value, localRotation.value, localWidth.value,
      );
      if (onInteractionEnd) runOnJS(onInteractionEnd)();
    });

  // ── Rotation ─────────────────────────────────────────────────────────────────
  const rotGesture = Gesture.Rotation()
    .enabled(!gesturesDisabled && !isSelected)
    .onStart(() => { 
      startRotation.value = localRotation.value;
      if (onInteractionStart) runOnJS(onInteractionStart)();
    })
    .onUpdate((e) => {
      if (!isResizing?.value) localRotation.value = startRotation.value + e.rotation;
    })
    .onEnd(() => {
      runOnJS(notifyUpdate)(
        localX.value, localY.value,
        localScale.value, localRotation.value, localWidth.value,
      );
      if (onInteractionEnd) runOnJS(onInteractionEnd)();
    });

  // ── Width resize handle ───────────────────────────────────────────────────────
  const widthPanGesture = Gesture.Pan()
    .onStart(() => {
      if (isResizing) isResizing.value = true;
      startResizeWidth.value = activeWidth?.value ?? localWidth.value;
      if (onInteractionStart) runOnJS(onInteractionStart)();
    })
    .onUpdate((e) => {
      // Use translationX but factor in scale to make it feel natural
      const nw = Math.max(80, startResizeWidth.value + (e.translationX / (activeScale?.value ?? 1)));
      localWidth.value = nw;
      if (activeWidth) activeWidth.value = nw;
    })
    .onEnd(() => {
      if (isResizing) isResizing.value = false;
      const fw = activeWidth?.value ?? localWidth.value;
      runOnJS(notifyUpdate)(
        localX.value, localY.value,
        localScale.value, localRotation.value, fw,
      );
      if (onInteractionEnd) runOnJS(onInteractionEnd)();
    });

  const composed = Gesture.Simultaneous(
    tapGesture,
    Gesture.Simultaneous(panGesture, Gesture.Simultaneous(pinchGesture, rotGesture)),
  );

  const animatedStyle = useAnimatedStyle(() => {
    const fx = activeX        ? activeX.value        : localX.value;
    const fy = activeY        ? activeY.value        : localY.value;
    const fs = activeScale    ? activeScale.value    : localScale.value;
    const fr = activeRotation ? activeRotation.value : localRotation.value;
    const fw = activeWidth    ? activeWidth.value    : localWidth.value;

    return {
      width: fw,
      opacity,
      transform: [
        { translateX: fx },
        { translateY: fy },
        { scale: fs },
        { rotate: `${(fr * 180) / Math.PI}deg` },
      ],
      position:  'absolute' as const,
      alignSelf: 'center'   as const,
      top:       '40%'      as any,
    };
  });

  return (
    <GestureDetector gesture={composed}>
      <Animated.View style={[animatedStyle, s.item]}>
        {isSelected && <View style={s.border} />}

        {children}

        {isSelected && (
          <>
            {/* Delete — top-right */}
            <TouchableOpacity onPress={onDelete} style={s.deleteBtn} activeOpacity={0.8}>
              <Ionicons name="close-circle" size={28} color="#FF3040" />
            </TouchableOpacity>

            {/* Edit — top-left */}
            {onEdit && (
              <TouchableOpacity onPress={onEdit} style={s.editBtn} activeOpacity={0.8}>
                <Ionicons name="pencil" size={14} color="#3897f0" />
              </TouchableOpacity>
            )}

            {/* Duplicate — bottom-left */}
            {onDuplicate && (
              <TouchableOpacity onPress={onDuplicate} style={s.dupBtn} activeOpacity={0.8}>
                <Ionicons name="copy-outline" size={14} color="#00C875" />
              </TouchableOpacity>
            )}

            {/* Resize — bottom-right */}
            {initialWidth !== undefined && (
              <GestureDetector gesture={widthPanGesture}>
                <View style={s.resizeHit}>
                  <View style={s.resizePill}>
                    <Ionicons name="swap-horizontal-outline" size={16} color="#3897f0" />
                  </View>
                </View>
              </GestureDetector>
            )}
          </>
        )}
      </Animated.View>
    </GestureDetector>
  );
};

const s = StyleSheet.create({
  item:  { padding: 2 },
  border: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1.5,
    borderColor: '#3897f0',
    borderRadius: 8,
    borderStyle: 'dashed',
  },
  deleteBtn: {
    position: 'absolute', top: -14, right: -14,
    backgroundColor: '#fff', borderRadius: 14, zIndex: 30,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3, shadowRadius: 4,
  },
  editBtn: {
    position: 'absolute', top: -14, left: -14,
    width: 28, height: 28, backgroundColor: '#fff', borderRadius: 14,
    zIndex: 30, justifyContent: 'center', alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3, shadowRadius: 4,
  },
  dupBtn: {
    position: 'absolute', bottom: -14, left: -14,
    width: 28, height: 28, backgroundColor: '#fff', borderRadius: 14,
    zIndex: 30, justifyContent: 'center', alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3, shadowRadius: 4,
  },
  resizeHit: {
    position: 'absolute', right: -32, bottom: -12,
    width: 60, height: 60, justifyContent: 'center', alignItems: 'center',
    zIndex: 50,
  },
  resizePill: {
    width: 36, height: 36, backgroundColor: '#fff', borderRadius: 18,
    borderWidth: 2, borderColor: '#3897f0',
    justifyContent: 'center', alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3, shadowRadius: 5,
  },
});