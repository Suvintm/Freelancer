import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../src/context/ThemeContext';
import { ScreenContainer } from '../../src/components/shared/ScreenContainer';

export default function ReelsScreen() {
  const { theme } = useTheme();

  return (
    <ScreenContainer isScrollable={false}>
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Reels Workspace</Text>
          <Text style={styles.subtitle}>Free Space - Coming Soon</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>CLEAN SLATE</Text>
          </View>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    padding: 20,
  },
  title: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 1,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 16,
    marginTop: 8,
    textAlign: 'center',
  },
  badge: {
    marginTop: 24,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  badgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
});
