import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../src/context/ThemeContext';
import { ScreenContainer } from '../../src/components/shared/ScreenContainer';

import Animated, { SharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ChatsPlaceholder({ scrollY }: { scrollY?: SharedValue<number> }) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  
  return (
    <ScreenContainer isScrollable={false}>
      <Animated.ScrollView 
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 80 }]}
        onScroll={(e) => {
          if (scrollY) {
            scrollY.value = e.nativeEvent.contentOffset.y;
          }
        }}
        scrollEventThrottle={16}
      >
        <View style={styles.container}>
          <Text style={[styles.text, { color: theme.text }]}>CHATS</Text>
          <Text style={[styles.subtext, { color: theme.textSecondary }]}>
            Your unified workspace messaging and collaboration.
          </Text>
        </View>
      </Animated.ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 400,
  },
  scrollContent: {
    flexGrow: 1,
  },
  text: {
    fontSize: 20,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 3,
    marginBottom: 12,
  },
  subtext: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.7,
  },
});
