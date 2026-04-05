/**
 * MOCK REELS DATA
 * Used for Phase 2 to verify perfect snap scroll before
 * adding real video playback or API logic.
 */
export const MOCK_REELS = Array.from({ length: 10 }, (_, i) => ({
  id: `mock-${i}`,
  color: [
    '#1a1a2e', '#16213e', '#0f3460',
    '#533483', '#2d6a4f', '#1b4332',
    '#2c1654', '#003049', '#370617', '#212529'
  ][i % 10],
}));
