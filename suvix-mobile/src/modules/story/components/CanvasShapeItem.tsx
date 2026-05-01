import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { StoryObject } from '../types';

interface ExtendedStoryObject extends StoryObject {
  shapeFill?:          string;
  shapeStroke?:        string;
  shapeStrokeWidth?:   number;
  shapeCornerRadius?:  number;
  shapeHeight?:        number;
}

export const CanvasShapeItem = memo(({ item }: { item: ExtendedStoryObject }) => {
  const shapeId    = item.content as any;
  const fill       = item.shapeFill       ?? '#FFFFFF';
  const stroke     = item.shapeStroke     ?? 'transparent';
  const strokeW    = item.shapeStrokeWidth ?? 0;
  const radius     = item.shapeCornerRadius ?? 0;
  const w          = item.width  ?? 120;
  const h          = item.shapeHeight ?? w;

  const base: any = {
    backgroundColor: fill === 'transparent' ? 'transparent' : fill,
    borderColor:     stroke,
    borderWidth:     strokeW,
  };

  switch (shapeId) {
    case 'rect':
      return <View style={[base, { width: w, height: h }]} />;
    case 'rounded':
      return <View style={[base, { width: w, height: h, borderRadius: Math.max(radius, 12) }]} />;
    case 'circle':
      return <View style={[base, { width: w, height: w, borderRadius: w / 2 }]} />;
    case 'diamond':
      return (
        <View style={{ width: w, height: w, justifyContent: 'center', alignItems: 'center' }}>
          <View style={[base, { width: w * 0.7, height: w * 0.7, transform: [{ rotate: '45deg' }], borderRadius: 4 }]} />
        </View>
      );
    case 'triangle':
      return (
        <View style={{ width: 0, height: 0,
          borderLeftWidth: w / 2, borderRightWidth: w / 2,
          borderBottomWidth: h,
          borderLeftColor: 'transparent', borderRightColor: 'transparent',
          borderBottomColor: fill === 'transparent' ? '#fff' : fill,
          borderStyle: 'solid'
        }} />
      );
    case 'arrow':
      return (
        <View style={{ width: w, height: h, justifyContent: 'center' }}>
          <View style={{ width: w, height: Math.max(strokeW, 4), backgroundColor: fill === 'transparent' ? '#fff' : fill }} />
          <View style={{
            position: 'absolute', right: 0,
            width: 0, height: 0,
            borderTopWidth: h / 3, borderBottomWidth: h / 3,
            borderLeftWidth: h / 2,
            borderTopColor: 'transparent', borderBottomColor: 'transparent',
            borderLeftColor: fill === 'transparent' ? '#fff' : fill,
          }} />
        </View>
      );
    case 'line':
      return <View style={{ width: w, height: Math.max(strokeW, 4), backgroundColor: fill === 'transparent' ? '#fff' : fill, borderRadius: 2 }} />;
    default:
      // Fallback for complex shapes (Star, Heart, Speech) — in a full production app, these would be SVGs.
      // For this MVP, we render a placeholder square if shape not recognized.
      return <View style={[base, { width: w, height: h, justifyContent: 'center', alignItems: 'center' }]}>
        <View style={{ width: w * 0.5, height: h * 0.5, backgroundColor: fill }} />
      </View>;
  }
});
