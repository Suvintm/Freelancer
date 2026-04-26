import React from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

export const ExploreSearch = () => {
  const { isDarkMode, theme } = useTheme();

  return (
    <View style={styles.container}>
      <BlurView 
        intensity={isDarkMode ? 30 : 50} 
        tint={isDarkMode ? 'dark' : 'light'} 
        style={styles.searchBar}
      >
        <Ionicons 
          name="search" 
          size={20} 
          color={isDarkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)'} 
          style={styles.searchIcon}
        />
        <TextInput
          placeholder="Search creators, editors, gear..."
          placeholderTextColor={isDarkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.3)'}
          style={[styles.input, { color: theme.text }]}
        />
        <TouchableOpacity style={styles.filterBtn}>
          <Feather 
            name="sliders" 
            size={18} 
            color={isDarkMode ? 'white' : 'black'} 
          />
        </TouchableOpacity>
      </BlurView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 10 : 20,
    paddingBottom: 15,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 54,
    borderRadius: 20,
    paddingHorizontal: 15,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  searchIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    height: '100%',
  },
  filterBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  }
});
