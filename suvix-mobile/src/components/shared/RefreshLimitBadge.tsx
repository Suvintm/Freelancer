import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { 
  FadeInUp, 
  FadeOutUp, 
} from 'react-native-reanimated';
import { useTheme } from '../../context/ThemeContext';
import { useRefreshLimitStore } from '../../store/useRefreshLimitStore';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const RefreshLimitBadge = () => {
  const { isVisible, setVisible } = useRefreshLimitStore();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        setVisible(false);
      }, 3000); // Hide after 3 seconds
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <View 
      style={[styles.overlay, { top: insets.top + 80 }]} 
      pointerEvents="none"
    >
      <Animated.View 
        entering={FadeInUp.springify().damping(15).stiffness(120)}
        exiting={FadeOutUp.duration(400)}
        style={[
          styles.badge, 
          { 
            backgroundColor: theme.secondary, 
            borderColor: theme.border,
            shadowColor: '#000'
          }
        ]}
      >
        <MaterialCommunityIcons name="clock-alert-outline" size={16} color={theme.accent} />
        <Text style={[styles.badgeText, { color: theme.text }]}>
          Please wait a moment...
        </Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 9999,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 30,
    borderWidth: 1,
    gap: 10,
    elevation: 5,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
