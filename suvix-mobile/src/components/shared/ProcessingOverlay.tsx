import React, { useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ActivityIndicator, 
  Dimensions, 
  Animated,
  useColorScheme 
} from 'react-native';
import { Colors } from '../../constants/Colors';

const { width, height } = Dimensions.get('window');

interface ProcessingOverlayProps {
  isVisible: boolean;
  message?: string;
}

/**
 * PRODUCTION-GRADE PROCESSING OVERLAY
 * Provides a premium, immersive transition for high-stakes actions like registration.
 */
export const ProcessingOverlay: React.FC<ProcessingOverlayProps> = ({ 
  isVisible, 
  message = "Setting up your SuviX workspace..." 
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark : Colors.light;

  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isVisible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <Animated.View 
      style={[
        styles.container, 
        { opacity: fadeAnim, backgroundColor: isDark ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.92)' }
      ]}
    >
      <View style={styles.content}>
        <ActivityIndicator size="large" color={theme.accent} />
        <Text style={[styles.message, { color: theme.text }]}>{message}</Text>
        <Text style={[styles.subText, { color: theme.textSecondary }]}>This only takes a moment.</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999, // Ensure it's above everything
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
    width: width * 0.8,
  },
  message: {
    marginTop: 20,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  subText: {
    marginTop: 8,
    fontSize: 13,
    textAlign: 'center',
    opacity: 0.8,
  }
});
