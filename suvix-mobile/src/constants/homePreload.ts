import { Image } from 'react-native';

// Home-first media warmup list to reduce first-render flicker/loading placeholders.
const HOME_PRELOAD_IMAGE_URLS = [
  // Home banners
  'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&q=80&w=1200',
  'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=1200',
  'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=1200',
  // Feature gallery
  'https://images.unsplash.com/photo-1524666041070-9d87656c25bb?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1492724441997-5dc865305da7?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=800',
  // Story avatars / first slides
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150',
  'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&q=80&w=150',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150',
  'https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&q=80&w=150',
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=1080',
  'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=1080',
  'https://images.unsplash.com/photo-1536240478700-b869070f9279?auto=format&fit=crop&q=80&w=1080',
];

const withTimeout = (ms: number) =>
  new Promise<'timeout'>((resolve) => {
    setTimeout(() => resolve('timeout'), ms);
  });

export const preloadHomeAssets = async (maxWaitMs = 1400) => {
  const tasks = HOME_PRELOAD_IMAGE_URLS.map((uri) =>
    Image.prefetch(uri).catch(() => false)
  );

  // Bounded preload window so app never feels "stuck" on weak networks.
  await Promise.race([Promise.allSettled(tasks), withTimeout(maxWaitMs)]);
};
