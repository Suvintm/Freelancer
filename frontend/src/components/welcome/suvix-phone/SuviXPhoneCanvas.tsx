// ─────────────────────────────────────────────────────────────────────────────
// SUVIX PHONE CANVAS — Dedicated WebGL2 Three.js / R3F Canvas Container
// ─────────────────────────────────────────────────────────────────────────────

import { Suspense, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { PhoneLighting } from './scene/PhoneLighting';
import { PhoneEnvironment } from './scene/PhoneEnvironment';
import { PhoneController } from './interaction/PhoneController';
import { SuviXPhone } from './phone/SuviXPhone';

const ANGLE_PRESETS = [
  { id: 'front', label: 'Front', x: 0, y: 0 },
  { id: 'threeQuarter', label: '3/4 View', x: 0.12, y: -0.45 },
  { id: 'back', label: 'Back', x: 0, y: Math.PI },
  { id: 'left', label: 'Left', x: 0, y: Math.PI / 2 },
  { id: 'right', label: 'Right', x: 0, y: -Math.PI / 2 },
];

export function PhoneAngleSwitcher({
  className = '',
  orientation = 'horizontal',
}: {
  className?: string;
  orientation?: 'horizontal' | 'vertical';
}) {
  const [activeAngle, setActiveAngle] = useState<string | null>('threeQuarter');

  const setAngle = (id: string, x: number, y: number) => {
    setActiveAngle(id);
    window.dispatchEvent(
      new CustomEvent('suvix:set-phone-angle', { detail: { x, y } })
    );
  };

  return (
    <div
      className={`z-20 flex items-center p-1 sm:p-1.5 rounded-full sm:rounded-2xl bg-zinc-900/90 backdrop-blur-xl border border-zinc-800/90 shadow-2xl ${
        orientation === 'vertical'
          ? 'flex-col gap-1.5'
          : 'flex-row gap-1 max-w-[95%] overflow-x-auto [scrollbar-width:none]'
      } ${className}`}
    >
      {orientation === 'vertical' && (
        <div className="text-[8.5px] font-extrabold uppercase tracking-widest text-zinc-500 text-center px-1 pt-1 pb-1 border-b border-zinc-800/70 w-full">
          Angle
        </div>
      )}
      {ANGLE_PRESETS.map((preset) => {
        const isActive = activeAngle === preset.id;
        return (
          <button
            key={preset.id}
            type="button"
            onClick={() => setAngle(preset.id, preset.x, preset.y)}
            className={`px-2.5 py-1 rounded-full sm:rounded-xl text-[9.5px] sm:text-[11px] font-bold transition-all text-center cursor-pointer whitespace-nowrap shrink-0 ${
              isActive
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/40'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/80'
            }`}
          >
            {preset.label}
          </button>
        );
      })}
    </div>
  );
}

export function SuviXPhoneCanvas() {
  return (
    <div className="relative w-full max-w-[400px] sm:max-w-[440px] mx-auto flex flex-col items-center">
      {/* Interactive 3D WebGL Canvas */}
      <div className="relative w-full h-[440px] sm:h-[480px] lg:h-[510px] flex items-center justify-center select-none touch-none">
        <Canvas
          camera={{
            position: [0, 0, 6.8],
            fov: 35,
            near: 0.1,
            far: 50,
          }}
          dpr={[1, 2]} // Cap DPR to 2 for high frame rates on Retina displays
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance',
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.08,
          }}
          className="w-full h-full"
        >
          <Suspense fallback={null}>
            <PhoneEnvironment />
            <PhoneLighting />
            <PhoneController>
              <SuviXPhone scale={0.82} />
            </PhoneController>
          </Suspense>
        </Canvas>

        {/* Floating 360 Drag Interaction Hint Badge */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 pointer-events-none flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900/75 backdrop-blur-md border border-white/10 text-white/80 text-[10.5px] font-medium tracking-wide shadow-md">
          <svg
            viewBox="0 0 24 24"
            className="w-3 h-3 fill-none stroke-current stroke-2 animate-spin"
            style={{ animationDuration: '6s' }}
          >
            <path d="M21 12a9 9 0 1 1-9-9c2.5 0 4.8 1 6.5 2.7L21 8" />
            <path d="M21 3v5h-5" />
          </svg>
          <span>Drag 360° to explore</span>
        </div>
      </div>
    </div>
  );
}
