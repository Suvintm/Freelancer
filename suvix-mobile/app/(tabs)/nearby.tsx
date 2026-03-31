import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../src/context/ThemeContext';

export default function NearbyPlaceholder() {
  const { theme } = useTheme();
  
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.text, { color: theme.text }]}>NEARBY</Text>
      <Text style={[styles.subtext, { color: theme.textSecondary }]}>
        Finding editors and creators near you in real-time.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
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
