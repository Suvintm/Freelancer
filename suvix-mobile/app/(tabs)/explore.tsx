import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../src/context/ThemeContext';
import { ScreenContainer } from '../../src/components/shared/ScreenContainer';

export default function GenericPlaceholder({ title = 'Screen' }) {
  const { theme } = useTheme();
  
  return (
    <ScreenContainer isScrollable={false}>
      <View style={styles.container}>
        <Text style={[styles.text, { color: theme.text }]}>{title}</Text>
        <Text style={[styles.subtext, { color: theme.textSecondary }]}>
          This feature is synchronized with your Web Dashboard.
        </Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
