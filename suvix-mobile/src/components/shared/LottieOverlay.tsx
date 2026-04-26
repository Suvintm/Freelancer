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
import { Colors } from '../../constants/Colors';

const { width } = Dimensions.get('window');

const GOOGLE_COLORS = ['#4285F4', '#EA4335', '#FBBC05', '#34A853'];
const YOUTUBE_COLORS = ['#FF0000', '#FF0000', '#FF0000', '#FF0000'];

interface LottieOverlayProps {
  isVisible: boolean;
  message?: string;
  theme?: 'google' | 'youtube';
}

export const LottieOverlay: React.FC<LottieOverlayProps> = ({ 
  isVisible, 
  message = "Authenticating...",
  theme: colorTheme = 'google'
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark : Colors.light;

  const currentColors = colorTheme === 'youtube' ? YOUTUBE_COLORS : GOOGLE_COLORS;

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const dotAnims = useRef(currentColors.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    if (isVisible) {
      // Fade in the whole overlay
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();

      // Start the dot sequence
      const animations = dotAnims.map((anim, i) => {
        return Animated.loop(
          Animated.sequence([
            Animated.delay(i * 150),
            Animated.timing(anim, {
              toValue: 1,
              duration: 600,
              easing: Easing.bezier(0.4, 0, 0.2, 1),
              useNativeDriver: true,
            }),
            Animated.timing(anim, {
              toValue: 0,
              duration: 600,
              easing: Easing.bezier(0.4, 0, 0.2, 1),
              useNativeDriver: true,
            }),
          ])
        );
      });

      Animated.parallel(animations).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isVisible, dotAnims, fadeAnim]);

  if (!isVisible) return null;

  return (
    <Animated.View 
      style={[
        styles.container, 
        { 
          opacity: fadeAnim,
          backgroundColor: isDark ? 'rgba(0,0,0,0.95)' : 'rgba(255,255,255,0.98)' 
        }
      ]}
    >
      <View style={styles.content}>
        <View style={styles.dotContainer}>
          {dotAnims.map((anim, i) => (
            <Animated.View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor: currentColors[i],
                  transform: [
                    {
                      scale: anim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.8, 1.5],
                      }),
                    },
                    {
                      translateY: anim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, -10],
                      }),
                    }
                  ],
                  opacity: anim.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0.4, 1, 0.4],
                  }),
                },
              ]}
            />
          ))}
        </View>
        <Text style={[styles.message, { color: theme.text }]}>{message}</Text>
        <Text style={[styles.subText, { color: theme.textSecondary }]}>
          Please wait while we secure your session.
        </Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 99999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 30,
    alignItems: 'center',
    width: width * 0.9,
  },
  dotContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 60,
    marginBottom: 20,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginHorizontal: 8,
  },
  message: {
    marginTop: 10,
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    opacity: 0.7,
  }
});
