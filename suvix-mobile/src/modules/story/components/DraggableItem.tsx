import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  runOnJS,
  useAnimatedReaction,
} from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';

interface DraggableItemProps {
  children: React.ReactNode;
  initialX?: number;
  initialY?: number;
  isSelected?: boolean;
  onSelect?: () => void;
  onDelete?: () => void;
  onEdit?: () => void;
  activeX?: Animated.SharedValue<number>;
  activeY?: Animated.SharedValue<number>;
  activeScale?: Animated.SharedValue<number>;
  activeRotation?: Animated.SharedValue<number>;
  activeWidth?: Animated.SharedValue<number>;
  isResizing?: Animated.SharedValue<boolean>;
  initialWidth?: number;
  onUpdate?: (data: { x: number; y: number; scale: number; rotation: number; width?: number }) => void;
}

export const DraggableItem: React.FC<DraggableItemProps> = ({
  children,
  initialX = 0,
  initialY = 0,
  isSelected = false,
  onSelect,
  onDelete,
  onEdit,
  activeX,
  activeY,
  activeScale,
  activeRotation,
  activeWidth,
  isResizing,
  initialWidth,
  onUpdate,
}) => {
  const localX = useSharedValue(initialX);
  const localY = useSharedValue(initialY);
  const localScale = useSharedValue(1);
  const localRotation = useSharedValue(0);
  const localWidth = useSharedValue(initialWidth ?? 280);

  // Mirror global shared values into locals while this item is selected.
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
      if (cur.x !== undefined) localX.value = cur.x;
      if (cur.y !== undefined) localY.value = cur.y;
      if (cur.s !== undefined) localScale.value = cur.s;
      if (cur.r !== undefined) localRotation.value = cur.r;
      if (cur.w !== undefined) localWidth.value = cur.w;
    },
    [isSelected],
  );

  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const startResizeWidth = useSharedValue(0);

  const panGesture = Gesture.Pan()
    .enabled(!isSelected)
    .onBegin(() => { if (onSelect) runOnJS(onSelect)(); })
    .onStart(() => {
      startX.value = localX.value;
      startY.value = localY.value;
      if (onSelect) runOnJS(onSelect)();
    })
    .onUpdate((e) => {
      localX.value = startX.value + e.translationX;
      localY.value = startY.value + e.translationY;
    });

  const pinchGesture = Gesture.Pinch()
    .enabled(!isSelected)
    .onUpdate((e) => { localScale.value = e.scale; });

  const rotationGesture = Gesture.Rotation()
    .enabled(!isSelected)
    .onUpdate((e) => { localRotation.value = e.rotation; });

  const tapGesture = Gesture.Tap()
    .onStart(() => { if (onSelect) runOnJS(onSelect)(); });

  // ─────────────────────────────────────────────────────────────────────
  // ✅ THE FIX: widthPanGesture must update activeWidth.value directly.
  //
  //    Previously it only updated localWidth.value, but animatedStyle reads
  //    activeWidth.value when the item is selected. The text had no way to
  //    know the container was being resized, so it never reflowed.
  // ─────────────────────────────────────────────────────────────────────
  const widthPanGesture = Gesture.Pan()
    .onStart(() => {
      if (isResizing) isResizing.value = true;
      // Seed from activeWidth when selected, localWidth otherwise.
      startResizeWidth.value = activeWidth ? activeWidth.value : localWidth.value;
    })
    .onUpdate((e) => {
      const newW = Math.max(80, startResizeWidth.value + e.translationX);
      localWidth.value = newW;
      if (activeWidth) activeWidth.value = newW; // ← KEY FIX
    })
    .onEnd(() => {
      if (isResizing) isResizing.value = false;
      const finalW = activeWidth ? activeWidth.value : localWidth.value;
      if (onUpdate) {
        runOnJS(onUpdate)({
          x: localX.value,
          y: localY.value,
          scale: localScale.value,
          rotation: localRotation.value,
          width: finalW,
        });
      }
    });

  const animatedStyle = useAnimatedStyle(() => {
    const fx = activeX ? activeX.value : localX.value;
    const fy = activeY ? activeY.value : localY.value;
    const fs = activeScale ? activeScale.value : localScale.value;
    const fr = activeRotation ? activeRotation.value : localRotation.value;
    const fw = activeWidth ? activeWidth.value : localWidth.value;

    return {
      width: fw,
      transform: [
        { translateX: fx },
        { translateY: fy },
        { scale: fs },
        { rotate: `${(fr * 180) / Math.PI}deg` },
      ],
      position: 'absolute' as const,
      alignSelf: 'center' as const,
      top: '40%' as any,
    };
  });

  const composed = Gesture.Simultaneous(
    tapGesture,
    Gesture.Simultaneous(panGesture, Gesture.Simultaneous(pinchGesture, rotationGesture)),
  );

  return (
    <GestureDetector gesture={composed}>
      <Animated.View style={[animatedStyle, s.itemContainer]}>
        {isSelected && <View style={s.selectionBorder} />}

        {children}

        {isSelected && (
          <>
            <TouchableOpacity onPress={onDelete} style={s.deleteHandle} activeOpacity={0.8}>
              <Ionicons name="close-circle" size={26} color="#FF3040" />
            </TouchableOpacity>

            {onEdit && (
              <TouchableOpacity onPress={onEdit} style={s.editHandle} activeOpacity={0.8}>
                <Ionicons name="pencil" size={16} color="#3897f0" />
              </TouchableOpacity>
            )}

            {initialWidth !== undefined && (
              <GestureDetector gesture={widthPanGesture}>
                <View style={s.resizeHandle}>
                  <View style={s.resizePill}>
                    <Ionicons name="swap-horizontal-outline" size={13} color="#3897f0" />
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
  itemContainer: { padding: 2 },
  selectionBorder: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 2,
    borderColor: '#3897f0',
    borderRadius: 8,
    borderStyle: 'dashed',
  },
  deleteHandle: {
    position: 'absolute',
    top: -13, right: -13,
    backgroundColor: '#fff',
    borderRadius: 13,
    zIndex: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  editHandle: {
    position: 'absolute',
    top: -13, left: -13,
    width: 26, height: 26,
    backgroundColor: '#fff',
    borderRadius: 13,
    zIndex: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resizeHandle: {
    position: 'absolute',
    right: -28,
    top: '50%',
    marginTop: -22,
    width: 44, height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 25,
  },
  resizePill: {
    width: 28, height: 28,
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#3897f0',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
});