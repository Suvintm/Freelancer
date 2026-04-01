import React from 'react';
import { View, StyleSheet, ScrollView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { Colors } from '../../constants/Colors';

interface ScreenContainerProps {
  children: React.ReactNode;
  headerHeight?: number;
  tabBarHeight?: number;
  isScrollable?: boolean;
  paddingHorizontal?: number;
}

/**
 * PRODUCTION-GRADE SCREEN CONTAINER
 * Force-calculates the exact hardware insets for any phone (Notch / Home Bar).
 * Unifies the TopNavbar and TabBar spacing globally.
 */
export const ScreenContainer = ({ 
  children, 
  headerHeight = 50, 
  tabBarHeight = 60,
  isScrollable = true,
  paddingHorizontal = 0
}: ScreenContainerProps) => {
  const insets = useSafeAreaInsets();
  const { isDarkMode } = useTheme();
  
  const palette = isDarkMode ? Colors.dark : Colors.light;
  
  // 1. Calculate the exact safe-buffers
  const topBuffer = Math.max(insets.top, 20) + headerHeight;
  const bottomBuffer = Math.max(insets.bottom, 10) + tabBarHeight;

  const RootView = isScrollable ? ScrollView : View;

  return (
    <View style={[styles.root, { backgroundColor: palette.primary }]}>
      <RootView 
        style={styles.flex}
        contentContainerStyle={[
          isScrollable && {
            paddingTop: topBuffer,
            paddingBottom: bottomBuffer,
            paddingHorizontal: paddingHorizontal,
          }
        ]}
        showsVerticalScrollIndicator={false}
      >
        {!isScrollable && (
          <View style={{ 
            flex: 1, 
            paddingTop: topBuffer, 
            paddingBottom: bottomBuffer,
            paddingHorizontal: paddingHorizontal
          }}>
            {children}
          </View>
        )}
        {isScrollable && children}
      </RootView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
});
