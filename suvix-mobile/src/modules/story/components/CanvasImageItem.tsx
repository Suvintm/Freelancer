import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { StoryObject } from '../types';

interface CanvasImageItemProps {
  item: StoryObject;
}

/**
 * 🖼️ SUVI X IMAGE ENGINE
 * Renders draggable, resizable gallery photos on the Infinity Canvas.
 */
export const CanvasImageItem: React.FC<CanvasImageItemProps> = ({ item }) => {
  return (
    <View style={s.container}>
      <Image 
        source={{ uri: item.content }} 
        style={s.image} 
        resizeMode="cover" 
      />
    </View>
  );
};

const s = StyleSheet.create({
  container: {
    width: 200, // Initial reasonable size
    height: 350,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#333',
    // Dynamic border to separate multiple images
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
