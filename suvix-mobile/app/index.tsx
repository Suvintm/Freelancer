import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors } from '../src/constants/Colors';
import AnimatedSplashScreen from '../src/components/AnimatedSplashScreen';

/**
 * PRODUCTION-LEVEL ANIMATED INTRO (SuviX)
 * This screen hosts the high-end Reanimated 3 splash experience.
 */
export default function Index() {
  return (
    <View style={styles.container}>
      <AnimatedSplashScreen 
        onAnimationFinish={() => {
          // The checkAuth and redirect logic is handled in _layout.tsx
          // based on the isIntroFinished state.
        }} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000', // Match splash background
  },
});
