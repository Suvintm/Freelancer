// ─────────────────────────────────────────────────────────────────────────────
// SUVIX PHONE ENVIRONMENT — High Dynamic Range Studio Reflections
// ─────────────────────────────────────────────────────────────────────────────

import { Environment } from '@react-three/drei';

export function PhoneEnvironment() {
  return (
    <Environment
      preset="city"
      environmentIntensity={0.85}
    />
  );
}
