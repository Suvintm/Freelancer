import React from 'react';
import { StyleSheet, View, Image } from 'react-native';
import { StoryObject, ImageFilter } from '../types';

interface Props { item: StoryObject; }

type FilterCfg = { color: string; opacity: number; blendMode?: string };

const FILTERS: Record<ImageFilter, FilterCfg | null> = {
  none:      null,
  warm:      { color: '#FF8C00', opacity: 0.18 },
  cool:      { color: '#4B90FF', opacity: 0.16 },
  fade:      { color: '#FFFFFF', opacity: 0.30 },
  retro:     { color: '#C8860A', opacity: 0.24 },
  vivid:     { color: '#FF00CC', opacity: 0.10 },
  noir:      { color: '#000000', opacity: 0.45 },
  dramatic:  { color: '#001133', opacity: 0.35 },
};

export const CanvasImageItem: React.FC<Props> = ({ item }) => {
  const filterKey = (item.imageFilter ?? 'none') as ImageFilter;
  const cfg       = FILTERS[filterKey];

  // Dynamically use original aspect ratio or default to 4:3
  const aspectRatio = item.aspectRatio || 4 / 3;

  return (
    <View style={[s.wrapper, { aspectRatio }]}>
      <Image
        source={{ uri: item.content }}
        style={s.image}
        resizeMode="contain"
      />
      {cfg && (
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: cfg.color, opacity: cfg.opacity, borderRadius: 8 },
          ]}
        />
      )}
    </View>
  );
};

const s = StyleSheet.create({
  wrapper: {
    width: '100%',
    borderRadius: 8,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});