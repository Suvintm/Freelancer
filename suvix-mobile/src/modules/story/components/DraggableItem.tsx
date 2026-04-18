import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring,
  runOnJS,
  useAnimatedReaction,
} from 'react-native-reanimated';
import { 
  GestureDetector, 
  Gesture,
} from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';

interface DraggableItemProps {
  children: React.ReactNode;
  initialX?: number;
  initialY?: number;
  isSelected?: boolean;
  onSelect?: () => void;
  onDelete?: () => void;
  // --- 🛰️ GLOBAL CONTROL BRIDGE ---
  activeX?: Animated.SharedValue<number>;
  activeY?: Animated.SharedValue<number>;
  activeScale?: Animated.SharedValue<number>;
  activeRotation?: Animated.SharedValue<number>;
  onUpdate?: (data: { x: number; y: number; scale: number; rotation: number }) => void;
}

/**
 * 🚀 PROFESSIONAL DRAGGABLE ENGINE (Enhanced with Selection & Global Bridge)
 * Handles Pan, Pinch, Rotate, and Tap gestures on the UI thread.
 */
export const DraggableItem: React.FC<DraggableItemProps> = ({ 
  children, 
  initialX = 0, 
  initialY = 0,
  isSelected = false,
  onSelect,
  onDelete,
  activeX,
  activeY,
  activeScale,
  activeRotation,
  onUpdate,
}) => {
  const localX = useSharedValue(initialX);
  const localY = useSharedValue(initialY);
  const localScale = useSharedValue(1);
  const localRotation = useSharedValue(0);

  // --- 🛰️ UI-THREAD SYNC ENGINE (Instagram-Grade Stabilization) ---
  // This mirrors global values into local values while selected,
  // ensuring that when deselected, they stay exactly where they were left.
  useAnimatedReaction(
    () => ({
      x: activeX?.value,
      y: activeY?.value,
      s: activeScale?.value,
      r: activeRotation?.value,
    }),
    (current) => {
      if (isSelected) {
        if (current.x !== undefined) localX.value = current.x;
        if (current.y !== undefined) localY.value = current.y;
        if (current.s !== undefined) localScale.value = current.s;
        if (current.r !== undefined) localRotation.value = current.r;
      }
    },
    [isSelected]
  );

  const startX = useSharedValue(0);
  const startY = useSharedValue(0);

  // 1. Pan Gesture (Selection & Local-only movement)
  const panGesture = Gesture.Pan()
    .enabled(!isSelected) // Global controller takes over when selected
    .onBegin(() => {
      if (onSelect) runOnJS(onSelect)();
    })
    .onStart(() => {
      startX.value = localX.value;
      startY.value = localY.value;
      if (onSelect) runOnJS(onSelect)();
    })
    .onUpdate((event) => {
      localX.value = startX.value + event.translationX;
      localY.value = startY.value + event.translationY;
    });

  // 2. Pinch Gesture (Local-only)
  const pinchGesture = Gesture.Pinch()
    .enabled(!isSelected)
    .onUpdate((event) => {
      localScale.value = event.scale;
    });

  // 3. Rotation Gesture (Local-only)
  const rotationGesture = Gesture.Rotation()
    .enabled(!isSelected)
    .onUpdate((event) => {
      localRotation.value = event.rotation;
    });

  // 4. Tap Gesture (Selection Focus)
  const tapGesture = Gesture.Tap()
    .onStart(() => {
        if (onSelect) runOnJS(onSelect)();
    });

  const animatedStyle = useAnimatedStyle(() => {
    const finalX = activeX ? activeX.value : localX.value;
    const finalY = activeY ? activeY.value : localY.value;
    const finalScale = activeScale ? activeScale.value : localScale.value;
    const finalRotation = activeRotation ? activeRotation.value : localRotation.value;

    return {
        transform: [
          { translateX: finalX },
          { translateY: finalY },
          { scale: finalScale },
          { rotate: `${(finalRotation * 180) / Math.PI}deg` },
        ],
        position: 'absolute',
        alignSelf: 'center',
        top: '40%',
    };
  });

  const composed = Gesture.Simultaneous(
    tapGesture,
    Gesture.Simultaneous(panGesture, Gesture.Simultaneous(pinchGesture, rotationGesture))
  );

  return (
    <GestureDetector gesture={composed}>
      <Animated.View style={[animatedStyle, s.itemContainer]}>
        {/* Selection Border (Canva Style) */}
        {isSelected && <View style={s.selectionBorder} />}
        
        {children}

        {/* Delete Handle */}
        {isSelected && (
            <TouchableOpacity 
              onPress={onDelete} 
              style={s.deleteHandle}
              activeOpacity={0.7}
            >
                <Ionicons name="close-circle" size={24} color="#FF3040" />
            </TouchableOpacity>
        )}
      </Animated.View>
    </GestureDetector>
  );
};

const s = StyleSheet.create({
  itemContainer: {
    padding: 2, // Buffer for selection border
  },
  selectionBorder: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 2,
    borderColor: '#3897f0',
    borderRadius: 8,
    borderStyle: 'dashed',
  },
  deleteHandle: {
    position: 'absolute',
    top: -12,
    right: -12,
    backgroundColor: '#fff',
    borderRadius: 12,
    zIndex: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});
