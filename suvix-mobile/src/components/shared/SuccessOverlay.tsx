import React, { useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Dimensions, 
  Animated,
  useColorScheme,
  Easing
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';

const { width, height } = Dimensions.get('window');

interface SuccessOverlayProps {
  isVisible: boolean;
  type: 'youtube' | 'success';
  title?: string;
  message: string;
}

export const SuccessOverlay: React.FC<SuccessOverlayProps> = ({ 
  isVisible, 
  type,
  title,
  message
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark : Colors.light;

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isVisible) {
      // Entrance Animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 4,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true,
        })
      ]).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isVisible, fadeAnim, rotateAnim, scaleAnim]);

  if (!isVisible) return null;

  const iconName = type === 'youtube' ? 'logo-youtube' : 'checkmark-circle';
  const iconColor = type === 'youtube' ? '#FF0000' : '#00C853';

  return (
    <Animated.View 
      style={[
        styles.container, 
        { 
          opacity: fadeAnim,
          backgroundColor: isDark ? 'rgba(0,0,0,0.92)' : 'rgba(255,255,255,0.96)' 
        }
      ]}
    >
      <Animated.View 
        style={[
          styles.content,
          {
            transform: [
              { scale: scaleAnim },
              { rotate: rotateAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['-15deg', '0deg']
                }) 
              }
            ]
          }
        ]}
      >
        <View style={styles.iconContainer}>
          <View style={[styles.glow, { backgroundColor: iconColor }]} />
          <Ionicons name={iconName} size={80} color={iconColor} />
        </View>
        
        <Text style={[styles.title, { color: theme.text }]}>
          {title || (type === 'youtube' ? 'YouTube Linked!' : 'Success!')}
        </Text>
        <Text style={[styles.message, { color: theme.textSecondary }]}>{message}</Text>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100000,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  iconContainer: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  glow: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    opacity: 0.2,
    transform: [{ scale: 1.4 }],
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: -0.5,
  },
  message: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 22,
  }
});
