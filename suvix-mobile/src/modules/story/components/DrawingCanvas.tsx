import React, { useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Path as SvgPath } from 'react-native-svg';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  runOnJS,
} from 'react-native-reanimated';
import { DrawPath } from '../types';

const AnimatedPath = Animated.createAnimatedComponent(SvgPath);

// ── Smooth quadratic-bezier path builder ──────────────────────────────────────

function buildPath(pts: { x: number; y: number }[]): string {
  'worklet';
  if (pts.length === 0) return '';
  if (pts.length === 1) return `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)} l 0.01 0`;
  if (pts.length === 2) {
    return `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)} L ${pts[1].x.toFixed(1)} ${pts[1].y.toFixed(1)}`;
  }
  let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const midX = ((pts[i].x + pts[i + 1].x) / 2).toFixed(1);
    const midY = ((pts[i].y + pts[i + 1].y) / 2).toFixed(1);
    d += ` Q ${pts[i].x.toFixed(1)} ${pts[i].y.toFixed(1)} ${midX} ${midY}`;
  }
  const last = pts[pts.length - 1];
  d += ` L ${last.x.toFixed(1)} ${last.y.toFixed(1)}`;
  return d;
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  width: number;
  height: number;
  paths: DrawPath[];
  brushColor: string;
  brushSize: number;
  isEraser: boolean;
  eraserBgColor: string;
  interactive: boolean;
  onPathComplete?: (path: DrawPath) => void;
}

export const DrawingCanvas: React.FC<Props> = ({
  width,
  height,
  paths,
  brushColor,
  brushSize,
  isEraser,
  eraserBgColor,
  interactive,
  onPathComplete,
}) => {
  const livePathD        = useSharedValue('');
  const points           = useSharedValue<{ x: number; y: number }[]>([]);

  // Refs for callbacks
  const configRef = useRef({ brushColor, brushSize, isEraser, eraserBgColor });
  configRef.current = { brushColor, brushSize, isEraser, eraserBgColor };

  const onPathEnded = (finalD: string) => {
    if (!onPathComplete || !finalD) return;
    const { brushColor, brushSize, isEraser, eraserBgColor } = configRef.current;
    onPathComplete({
      id: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
      d: finalD,
      color:       isEraser ? eraserBgColor : brushColor,
      strokeWidth: isEraser ? brushSize * 5 : brushSize,
      opacity:     1,
      isEraser:    isEraser,
    });
    livePathD.value = '';
    points.value    = [];
  };

  const gesture = Gesture.Pan()
    .minDistance(0)
    .onStart((e) => {
      points.value = [{ x: e.x, y: e.y }];
      livePathD.value = buildPath(points.value);
    })
    .onUpdate((e) => {
      points.value = [...points.value, { x: e.x, y: e.y }];
      livePathD.value = buildPath(points.value);
    })
    .onEnd(() => {
      if (points.value.length > 0) {
        runOnJS(onPathEnded)(livePathD.value);
      }
    });

  const animatedProps = useAnimatedProps(() => ({
    d: livePathD.value,
  }));

  const livePaintColor = isEraser ? eraserBgColor : brushColor;
  const livePaintWidth = isEraser ? brushSize * 5 : brushSize;

  const svgContent = (
    <Svg width={width} height={height}>
      {paths.map((p) => (
        <SvgPath
          key={p.id}
          d={p.d}
          stroke={p.color}
          strokeWidth={p.strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      ))}
      <AnimatedPath
        animatedProps={animatedProps}
        stroke={livePaintColor}
        strokeWidth={livePaintWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );

  if (!interactive) {
    return (
      <View style={[s.layer, { width, height }]} pointerEvents="none">
        {svgContent}
      </View>
    );
  }

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[s.layer, { width, height }]} pointerEvents="box-only">
        {svgContent}
      </Animated.View>
    </GestureDetector>
  );
};

const s = StyleSheet.create({
  layer: { position: 'absolute', top: 0, left: 0, zIndex: 50 },
});