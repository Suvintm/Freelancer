import React from 'react';
import { ViewProps } from 'react-native';
import Animated, { 
  FadeInUp, 
  FadeInDown,
  FadeIn,
  ComplexAnimationBuilder
} from 'react-native-reanimated';

interface FadeInEntranceProps extends ViewProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  direction?: 'up' | 'down' | 'none';
  distance?: number;
}

/**
 * PRODUCTION-GRADE ENTRANCE ANIMATION WRAPPER
 * Uses hardware-accelerated Reanimated 3 Layout Animations.
 * This runs on the UI thread for zero-latency performance.
 */
export const FadeInEntrance: React.FC<FadeInEntranceProps> = ({ 
  children, 
  delay = 0, 
  duration = 600, 
  direction = 'up',
  distance = 20,
  style,
  ...props 
}) => {
  
  // Decide which animation type to use based on direction
  const getEnteringAnimation = (): ComplexAnimationBuilder => {
    let anim;
    
    if (direction === 'up') {
      anim = FadeInUp.springify().damping(15).stiffness(100);
    } else if (direction === 'down') {
      anim = FadeInDown.springify().damping(15).stiffness(100);
    } else {
      anim = FadeIn.duration(duration);
    }

    if (delay > 0) {
      anim = anim.delay(delay);
    }
    
    return anim;
  };

  return (
    <Animated.View 
      entering={getEnteringAnimation()} 
      style={style}
      {...props}
    >
      {children}
    </Animated.View>
  );
};
