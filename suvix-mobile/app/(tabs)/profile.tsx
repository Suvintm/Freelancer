import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../src/context/ThemeContext';

export default function ProfilePlaceholder() {
  const { theme } = useTheme();
  
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.text, { color: theme.text }]}>PROFILE</Text>
      <Text style={[styles.subtext, { color: theme.textSecondary }]}>
        Manage your identity and portfolio insights.
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
