// ─────────────────────────────────────────────────────────────────────────────
// SUVIX PHONE MASTER ASSEMBLY — Procedural 3D Smartphone
// Combines Chassis, Display, Glass, Cameras, Buttons, and Ports
// Coordinate System: +Z = Front, -Z = Back, +Y = Top, -Y = Bottom, +X = Right, -X = Left
// ─────────────────────────────────────────────────────────────────────────────

import { useMemo, forwardRef } from 'react';
import * as THREE from 'three';
import { createPhoneMaterials } from '../materials/phoneMaterials';
import { PhoneBody } from './PhoneBody';
import { Display } from './Display';
import { FrontGlass } from './FrontGlass';
import { BackGlass } from './BackGlass';
import { CameraModule } from '../camera/CameraModule';
import { PowerButton } from '../sides/PowerButton';
import { VolumeButtons } from '../sides/VolumeButtons';
import { SimTray } from '../sides/SimTray';
import { AntennaLines } from '../sides/AntennaLines';
import { UsbPort } from '../bottom/UsbPort';
import { Speaker } from '../bottom/Speaker';
import { Microphone } from '../bottom/Microphone';

export interface SuviXPhoneProps {
  scale?: number;
}

export const SuviXPhone = forwardRef<THREE.Group, SuviXPhoneProps>(
  ({ scale = 1 }, ref) => {
    // Memoized materials library to avoid duplicate material instances
    const materials = useMemo(() => createPhoneMaterials(), []);

    return (
      <group ref={ref} scale={scale} name="SuviXSmartphoneProceduralModel">
        {/* 1. Main Beveled Titanium Chassis */}
        <PhoneBody materials={materials} />

        {/* 2. Front OLED Display Screen with Ask SuviX Beta UI */}
        <Display materials={materials} />

        {/* 3. Front Protective 2.5D Physical Glass */}
        <FrontGlass material={materials.frontGlass} />

        {/* 4. Rear Matte AG Frosted Glass with SuviX Logo */}
        <BackGlass material={materials.backGlass} />

        {/* 5. Rear Camera Island & Triple Sapphire Lens Assembly */}
        <CameraModule materials={materials} />

        {/* 6. Side Mechanical Controls */}
        <PowerButton material={materials.button} />
        <VolumeButtons material={materials.button} />
        <SimTray materials={materials} />
        <AntennaLines material={materials.antenna} />

        {/* 7. Bottom Acoustic & Charging Ports */}
        <UsbPort materials={materials} />
        <Speaker material={materials.speakerGrille} />
        <Microphone material={materials.speakerGrille} />
      </group>
    );
  }
);

SuviXPhone.displayName = 'SuviXPhone';
