import React, { useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Animated, 
  Dimensions, 
  SafeAreaView 
} from 'react-native';
import { useToastStore } from '../store/useToastStore';
import { useTheme } from '../context/ThemeContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

/**
 * 🍬 PREMIUM GLOBAL TOAST
 * A sliding, pill-shaped notification for critical user feedback.
 * Positioned at the top to match Instagram's 'Post Uploaded' vibe.
 */
export const GlobalToast = () => {
  const { isVisible, message, type, hideToast } = useToastStore();
  const { theme } = useTheme();
  
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isVisible) {
      // 🚀 SLIDE IN
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 20,
          useNativeDriver: true,
          tension: 40,
          friction: 7,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // 💨 SLIDE OUT
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -100,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isVisible]);

  if (!isVisible && slideAnim._value === -100) return null;

  const getIcon = () => {
    switch (type) {
      case 'success': return 'check-circle';
      case 'error': return 'alert-circle';
      default: return 'information';
    }
  };

  const getAccentColor = () => {
    switch (type) {
      case 'success': return '#22C55E';
      case 'error': return '#EF4444';
      default: return theme.accent;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Animated.View 
        style={[
          styles.toast, 
          { 
            backgroundColor: theme.primary,
            transform: [{ translateY: slideAnim }],
            opacity: opacityAnim,
            shadowColor: '#000',
          }
        ]}
      >
        <View style={[styles.iconContainer, { backgroundColor: getAccentColor() + '20' }]}>
          <MaterialCommunityIcons name={getIcon()} size={20} color={getAccentColor()} />
        </View>
        <Text style={[styles.message, { color: theme.text }]}>{message}</Text>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    zIndex: 10000,
    alignItems: 'center',
    pointerEvents: 'none',
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    width: width * 0.85,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    elevation: 10,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  message: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
});
