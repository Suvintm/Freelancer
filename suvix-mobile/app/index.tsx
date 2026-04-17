import React from 'react';
import { View, StyleSheet } from 'react-native';
import AnimatedSplashScreen from '../src/components/AnimatedSplashScreen';
import { useAuthStore } from '../src/store/useAuthStore';

/**
 * PRODUCTION-LEVEL ANIMATED INTRO (SuviX)
 * This screen hosts the high-end Reanimated 3 splash experience.
 */
export default function Index() {
  const isBootstrapComplete = useAuthStore(state => state.isBootstrapComplete);
  const setIsIntroFinished = useAuthStore(state => state.setIsIntroFinished);

  return (
    <View style={styles.container}>
      <AnimatedSplashScreen 
        isReady={isBootstrapComplete}
        onAnimationFinish={() => {
          console.log('🎬 [BOOT] Splash complete. Handing off to Layout Guard.');
          setIsIntroFinished(true);
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
