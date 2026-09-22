// ─────────────────────────────────────────────────────────────────────────────
// SUVIX PHONE CONTROLLER — 360° Inertial Rotation & Responsive Damping Engine
// Zero React re-renders in animation loop. Full 360° horizontal + clamped vertical tilt.
// ─────────────────────────────────────────────────────────────────────────────

import { useRef, useEffect, type ReactNode } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface PhoneControllerProps {
  children: ReactNode;
}

export function PhoneController({ children }: PhoneControllerProps) {
  const groupRef = useRef<THREE.Group>(null);
  const { gl } = useThree();

  // Rotation states stored in refs for 120 FPS performance (no React state updates)
  const currentRotation = useRef({ x: 0.1, y: -0.25 });
  const targetRotation = useRef({ x: 0.1, y: -0.25 });
  const isDragging = useRef(false);
  const lastPointer = useRef({ x: 0, y: 0 });
  const lastInteractionTime = useRef(Date.now());

  // Tuning constants
  const MAX_TILT_X = 0.55; // ~31.5 degrees max vertical tilt
  const DAMPING = 0.085;   // Smooth inertial lerp factor
  const ROTATION_SENSITIVITY = 0.0055;
  const IDLE_AUTO_ROTATE_SPEED = 0.18; // Radians per second

  useEffect(() => {
    const dom = gl.domElement;

    const onPointerDown = (e: PointerEvent) => {
      isDragging.current = true;
      lastPointer.current = { x: e.clientX, y: e.clientY };
      lastInteractionTime.current = Date.now();
      dom.style.cursor = 'grabbing';
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging.current) return;

      const deltaX = e.clientX - lastPointer.current.x;
      const deltaY = e.clientY - lastPointer.current.y;
      lastPointer.current = { x: e.clientX, y: e.clientY };
      lastInteractionTime.current = Date.now();

      // Full 360 horizontal rotation
      targetRotation.current.y += deltaX * ROTATION_SENSITIVITY;

      // Clamped vertical tilt
      const newTilt = targetRotation.current.x + deltaY * ROTATION_SENSITIVITY;
      targetRotation.current.x = Math.max(-MAX_TILT_X, Math.min(MAX_TILT_X, newTilt));
    };

    const onPointerUp = () => {
      isDragging.current = false;
      dom.style.cursor = 'grab';
    };

    const onSetAngle = (e: Event) => {
      const ce = e as CustomEvent<{ x: number; y: number }>;
      if (ce.detail) {
        targetRotation.current.x = ce.detail.x ?? 0;
        targetRotation.current.y = ce.detail.y ?? 0;
        lastInteractionTime.current = Date.now() + 5000; // Pause auto-rotate for 5s after manual angle pick
      }
    };

    dom.style.cursor = 'grab';
    dom.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
    window.addEventListener('suvix:set-phone-angle', onSetAngle);

    return () => {
      dom.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      window.removeEventListener('suvix:set-phone-angle', onSetAngle);
    };
  }, [gl]);

  // High-frequency render loop (GPU/Three.js thread)
  useFrame((state, delta) => {
    if (!groupRef.current) return;

    const now = Date.now();
    const timeSinceInteraction = (now - lastInteractionTime.current) / 1000;

    // Idle auto-rotation resumes smoothly 2.5 seconds after user releases
    if (!isDragging.current && timeSinceInteraction > 2.5) {
      targetRotation.current.y += delta * IDLE_AUTO_ROTATE_SPEED;
      // Gently return vertical tilt toward neutral baseline
      targetRotation.current.x += (0.05 - targetRotation.current.x) * delta * 0.8;
    }

    // Smooth inertial damping interpolation
    currentRotation.current.x += (targetRotation.current.x - currentRotation.current.x) * DAMPING;
    currentRotation.current.y += (targetRotation.current.y - currentRotation.current.y) * DAMPING;

    // Apply rotation to phone model
    groupRef.current.rotation.x = currentRotation.current.x;
    groupRef.current.rotation.y = currentRotation.current.y;

    // Subtle premium idle floating levitation
    const time = state.clock.getElapsedTime();
    groupRef.current.position.y = Math.sin(time * 1.6) * 0.045;
  });

  return (
    <group ref={groupRef} name="PhoneInteractionPivot">
      {children}
    </group>
  );
}
