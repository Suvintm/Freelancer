import React from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import * as Haptics from 'expo-haptics';

interface ExploreSearchV2Props {
  placeholder?: string;
  activeColor: string;
}

export const ExploreSearchV2 = ({ placeholder = "Search...", activeColor }: ExploreSearchV2Props) => {
  const { isDarkMode, theme } = useTheme();

  const handleSearch = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchWrapper}>
        {/* 💊 THE PRODUCTION PILL */}
        <BlurView 
          intensity={isDarkMode ? 25 : 45} 
          tint={isDarkMode ? 'dark' : 'light'} 
          style={[styles.inputChamber, { borderColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.03)' }]}
        >
          <Ionicons 
            name="search" 
            size={18} 
            color={isDarkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.3)'} 
            style={styles.searchIcon}
          />
          <TextInput
            placeholder={placeholder}
            placeholderTextColor={isDarkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'}
            style={[styles.input, { color: theme.text }]}
          />
          
          {/* 🎯 FLOATING ACTION PILL */}
          <TouchableOpacity 
            activeOpacity={0.8} 
            onPress={handleSearch}
            style={[styles.actionPod, { backgroundColor: activeColor }]}
          >
            <MaterialCommunityIcons name="magnify" size={20} color="white" />
          </TouchableOpacity>
        </BlurView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 12,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputChamber: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 48, // Balanced Production Height
    borderRadius: 24, // Perfect Pill Shape
    paddingLeft: 16,
    paddingRight: 6,
    overflow: 'hidden',
    backgroundColor: 'rgba(20,20,20,0.85)', // Denser, more solid dark background
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
  },
  searchIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    height: '100%',
    letterSpacing: -0.3,
  },
  actionPod: {
    width: 36,
    height: 36,
    borderRadius: 18, // Perfect Circle/Pill
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  }
});
