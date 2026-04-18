import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring,
  useAnimatedGestureHandler
} from 'react-native-reanimated';
import { 
  GestureDetector, 
  Gesture,
} from 'react-native-gesture-handler';

interface DraggableItemProps {
  children: React.ReactNode;
  initialX?: number;
  initialY?: number;
  onUpdate?: (data: { x: number; y: number; scale: number; rotation: number }) => void;
  onDelete?: () => void;
}

/**
 * 🚀 PROFESSIONAL DRAGGABLE ENGINE
 * Handles Pan, Pinch, and Rotate gestures on the UI thread.
 */
export const DraggableItem: React.FC<DraggableItemProps> = ({ 
  children, 
  initialX = 0, 
  initialY = 0,
  onUpdate,
  onDelete
}) => {
  const x = useSharedValue(initialX);
  const y = useSharedValue(initialY);
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);

  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const startScale = useSharedValue(1);
  const startRotation = useSharedValue(0);

  // 1. Pan Gesture (Move)
  const panGesture = Gesture.Pan()
    .onStart(() => {
      startX.value = x.value;
      startY.value = y.value;
    })
    .onUpdate((event) => {
      x.value = startX.value + event.translationX;
      y.value = startY.value + event.translationY;
    })
    .onEnd(() => {
        // Logic for Trash zone check could go here
    });

  // 2. Pinch Gesture (Scale)
  const pinchGesture = Gesture.Pinch()
    .onStart(() => {
      startScale.value = scale.value;
    })
    .onUpdate((event) => {
      scale.value = startScale.value * event.scale;
    });

  // 3. Rotation Gesture
  const rotationGesture = Gesture.Rotation()
    .onStart(() => {
      startRotation.value = rotation.value;
    })
    .onUpdate((event) => {
      rotation.value = startRotation.value + event.rotation;
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: x.value },
      { translateY: y.value },
      { scale: scale.value },
      { rotate: `${(rotation.value * 180) / Math.PI}deg` },
    ],
    position: 'absolute',
    alignSelf: 'center',
    top: '40%', // Start somewhat centered
  }));

  const composed = Gesture.Simultaneous(panGesture, Gesture.Simultaneous(pinchGesture, rotationGesture));

  return (
    <GestureDetector gesture={composed}>
      <Animated.View style={animatedStyle}>
        {children}
      </Animated.View>
    </GestureDetector>
  );
};
