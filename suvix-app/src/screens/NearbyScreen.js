import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/Colors';

const NearbyScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Nearby Editors</Text>
      <Text style={styles.subtitle}>Find localized talent for your projects</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: Colors.white,
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    color: Colors.textSecondary,
    marginTop: 8,
  },
});

export default NearbyScreen;
