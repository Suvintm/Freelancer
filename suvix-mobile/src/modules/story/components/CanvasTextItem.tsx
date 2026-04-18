import React from 'react';
import { Text, StyleSheet, View } from 'react-native';
import { StoryObject } from '../types';

interface CanvasTextItemProps {
  item: StoryObject;
}

/**
 * 🎨 SUVI X TYPOGRAPHY ENGINE
 * Renders styleable text on the Infinity Canvas.
 */
export const CanvasTextItem: React.FC<CanvasTextItemProps> = ({ item }) => {
  const getFontStyle = () => {
    switch (item.fontStyle) {
      case 'Classic': return { fontFamily: 'PlayfairDisplay_700Bold' };
      case 'Italic': return { fontFamily: 'PlayfairDisplay_700Bold_Italic' };
      case 'Neon': return { 
          fontFamily: 'Inter_900Black', 
          textShadowColor: 'rgba(255, 48, 64, 0.8)',
          textShadowOffset: { width: 0, height: 0 },
          textShadowRadius: 15,
      };
      case 'Typewriter': return { fontFamily: 'SpecialElite_400Regular' };
      case 'Cursive': return { fontFamily: 'Pacifico_400Regular' };
      case 'Comic': return { fontFamily: 'Bangers_400Regular' };
      default: return { fontFamily: 'Inter_900Black' }; // Modern
    }
  };

  return (
    <View style={s.container}>
      <Text style={[s.text, getFontStyle(), { color: item.color || '#fff' }]}>
        {item.content}
      </Text>
    </View>
  );
};

const s = StyleSheet.create({
  container: {
    padding: 10,
  },
  text: {
    fontSize: 36,
    textAlign: 'center',
    letterSpacing: -1,
  },
});
