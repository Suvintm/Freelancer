import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/Colors';

const JobsScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Jobs Board</Text>
      <Text style={styles.subtitle}>Opportunities for professional editors</Text>
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

export default JobsScreen;
