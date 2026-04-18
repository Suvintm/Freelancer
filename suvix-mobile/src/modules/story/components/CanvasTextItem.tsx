import React from 'react';
import { Text, StyleSheet, View } from 'react-native';
import { StoryObject } from '../types';

interface CanvasTextItemProps {
  item: StoryObject;
}

export const CanvasTextItem: React.FC<CanvasTextItemProps> = ({ item }) => {
  const getFontStyle = (): object => {
    switch (item.fontStyle) {
      case 'Classic':
        return { fontFamily: 'PlayfairDisplay_700Bold' };
      case 'Italic':
        return { fontFamily: 'PlayfairDisplay_700Bold_Italic' };
      case 'Neon':
        return {
          fontFamily: 'Inter_900Black',
          textShadowColor: 'rgba(255, 48, 64, 0.85)',
          textShadowOffset: { width: 0, height: 0 },
          textShadowRadius: 16,
        };
      case 'Typewriter':
        return { fontFamily: 'SpecialElite_400Regular' };
      case 'Cursive':
        return { fontFamily: 'Pacifico_400Regular' };
      case 'Comic':
        return { fontFamily: 'Bangers_400Regular' };
      default:
        return { fontFamily: 'Inter_900Black' };
    }
  };

  const align = item.textAlign ?? 'center';
  const color = item.color ?? '#FFFFFF';

  const textElement = (
    <Text style={[s.text, getFontStyle(), { color, textAlign: align }]}>
      {item.content}
    </Text>
  );

  return (
    <View style={s.wrapper}>
      {item.textBackground ? (
        <View style={s.bgPill}>{textElement}</View>
      ) : (
        textElement
      )}
    </View>
  );
};

const s = StyleSheet.create({
  wrapper: {
    // width: '100%' is critical — inherits the Animated.View width from DraggableItem
    // so text reflows correctly when the resize handle is dragged.
    width: '100%',
  },
  bgPill: {
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  text: {
    fontSize: 32,
    lineHeight: 42,
    letterSpacing: -0.3,
    // React Native wraps at word boundaries by default — no extra flags needed.
  },
});