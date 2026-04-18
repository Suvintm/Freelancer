import React from 'react';
import { Text, StyleSheet, View } from 'react-native';
import { StoryObject } from '../types';

interface Props { item: StoryObject; }

const FONT_MAP: Record<string, string> = {
  Modern:     'Inter_900Black',
  Classic:    'PlayfairDisplay_700Bold',
  Italic:     'PlayfairDisplay_700Bold_Italic',
  Neon:       'Inter_900Black',
  Typewriter: 'SpecialElite_400Regular',
  Cursive:    'Pacifico_400Regular',
  Comic:      'Bangers_400Regular',
};

function getEffectStyle(effect: string | undefined, color: string) {
  switch (effect) {
    case 'shadow':
      return {
        textShadowColor: 'rgba(0,0,0,0.85)',
        textShadowOffset: { width: 3, height: 5 },
        textShadowRadius: 6,
      };
    case 'glow':
      return {
        textShadowColor: color,
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 22,
      };
    case 'neon':
      return {
        textShadowColor: 'rgba(255,255,255,0.95)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 14,
      };
    default:
      return {};
  }
}

export const CanvasTextItem: React.FC<Props> = ({ item }) => {
  const fontFamily = FONT_MAP[item.fontStyle ?? 'Modern'] ?? 'Inter_900Black';
  const color      = item.color ?? '#FFFFFF';
  const align      = item.textAlign ?? 'center';
  const fontSize   = item.fontSize ?? 32;
  const effect     = item.textEffect ?? 'none';

  const baseStyle: any = {
    fontFamily,
    color,
    fontSize,
    textAlign: align,
    lineHeight: fontSize * 1.28,
    letterSpacing: fontSize > 28 ? -0.4 : 0,
    ...getEffectStyle(effect, color),
  };

  // ── Outline: four shadow copies behind the main text ──────────────────────
  if (effect === 'outline') {
    const outlineColor = color === '#FFFFFF' ? '#000000' : '#FFFFFF';
    const OFFSETS = [
      [-2, -2], [2, -2], [-2, 2], [2, 2],
      [0,  -3], [0,   3], [-3, 0], [3,  0],
    ] as const;

    const core = (
      <View style={s.relative}>
        {OFFSETS.map(([dx, dy], i) => (
          <Text
            key={i}
            style={[
              baseStyle,
              s.absText,
              {
                color: outlineColor,
                textShadowColor: outlineColor,
                textShadowOffset: { width: dx, height: dy },
                textShadowRadius: 0,
              },
            ]}
          >
            {item.content}
          </Text>
        ))}
        <Text style={baseStyle}>{item.content}</Text>
      </View>
    );

    return (
      <View style={s.wrapper}>
        {item.textBackground ? (
          <View style={[s.pill, { backgroundColor: item.textBackgroundColor ?? 'rgba(0,0,0,0.65)' }]}>
            {core}
          </View>
        ) : core}
      </View>
    );
  }

  const textEl = <Text style={baseStyle}>{item.content}</Text>;

  return (
    <View style={s.wrapper}>
      {item.textBackground ? (
        <View style={[s.pill, { backgroundColor: item.textBackgroundColor ?? 'rgba(0,0,0,0.65)' }]}>
          {textEl}
        </View>
      ) : textEl}
    </View>
  );
};

const s = StyleSheet.create({
  wrapper:   { width: '100%' },
  relative:  { position: 'relative' },
  absText:   { position: 'absolute', top: 0, left: 0, right: 0 },
  pill: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
});