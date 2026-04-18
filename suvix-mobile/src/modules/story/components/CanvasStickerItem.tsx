import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { StoryObject } from '../types';

interface CanvasStickerItemProps {
  item: StoryObject;
}

/**
 * 📦 SUVI X STICKER ENGINE
 * Renders basic high-fidelity stickers on the Infinity Canvas.
 */
export const CanvasStickerItem: React.FC<CanvasStickerItemProps> = ({ item }) => {
  // Map content (ID) to icon
  const renderIcon = () => {
    switch (item.content) {
      case 'heart': return <Ionicons name="heart" size={80} color="#FF3040" />;
      case 'star': return <Ionicons name="star" size={80} color="#FFD700" />;
      case 'fire': return <MaterialCommunityIcons name="fire" size={80} color="#FF4500" />;
      case 'verified': return <MaterialCommunityIcons name="check-decagram" size={80} color="#3897f0" />;
      default: return <Ionicons name="happy" size={80} color="#fff" />;
    }
  };

  return (
    <View style={s.container}>
      {renderIcon()}
    </View>
  );
};

const s = StyleSheet.create({
  container: {
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
