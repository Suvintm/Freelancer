import React, { useCallback, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Path as SvgPath } from 'react-native-svg';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { DrawPath } from '../types';

// ── Smooth quadratic-bezier path builder ──────────────────────────────────────

function buildPath(pts: { x: number; y: number }[]): string {
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
  eraserBgColor: string;   // canvas bg colour so eraser paints correctly
  interactive: boolean;    // false → static render only (pointerEvents="none")
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
  const [livePathD, setLivePathD] = useState('');
  const pointsRef        = useRef<{ x: number; y: number }[]>([]);
  // Keep refs to latest values so gesture callbacks always have current state
  const brushColorRef    = useRef(brushColor);
  const brushSizeRef     = useRef(brushSize);
  const isEraserRef      = useRef(isEraser);
  const eraserBgColorRef = useRef(eraserBgColor);

  brushColorRef.current    = brushColor;
  brushSizeRef.current     = brushSize;
  isEraserRef.current      = isEraser;
  eraserBgColorRef.current = eraserBgColor;

  const addPoint = useCallback((x: number, y: number) => {
    pointsRef.current.push({ x, y });
    setLivePathD(buildPath(pointsRef.current));
  }, []);

  const finishPath = useCallback(() => {
    if (!pointsRef.current.length || !onPathComplete) return;
    const erase    = isEraserRef.current;
    const pathData = buildPath(pointsRef.current);
    onPathComplete({
      id: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
      d: pathData,
      color:       erase ? eraserBgColorRef.current : brushColorRef.current,
      strokeWidth: erase ? brushSizeRef.current * 5 : brushSizeRef.current,
      opacity:     1,
      isEraser:    erase,
    });
    pointsRef.current = [];
    setLivePathD('');
  }, [onPathComplete]);

  const gesture = Gesture.Pan()
    .minDistance(0)
    .onStart((e) => {
      pointsRef.current = [{ x: e.x, y: e.y }];
      runOnJS(setLivePathD)(buildPath(pointsRef.current));
    })
    .onUpdate((e) => { runOnJS(addPoint)(e.x, e.y); })
    .onEnd(() => { runOnJS(finishPath)(); });

  const livePaintColor = isEraser ? eraserBgColor : brushColor;
  const livePaintWidth = isEraser ? brushSize * 5  : brushSize;

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
      {livePathD ? (
        <SvgPath
          d={livePathD}
          stroke={livePaintColor}
          strokeWidth={livePaintWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      ) : null}
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
      <View style={[s.layer, { width, height }]} pointerEvents="box-only">
        {svgContent}
      </View>
    </GestureDetector>
  );
};

const s = StyleSheet.create({
  layer: { position: 'absolute', top: 0, left: 0, zIndex: 50 },
});