export interface WallpaperPreset {
  id: string;
  name: string;
  category: 'nature' | 'tech' | 'minimal' | 'cosmic' | 'lifestyle';
  url: string;
  thumbnailUrl: string;
  dominantColor: string;
}

export const WALLPAPER_PRESETS: WallpaperPreset[] = [
  // ── NATURE & FOREST ──
  {
    id: 'nature-deep-forest',
    name: 'Moody Forest Mist',
    category: 'nature',
    url: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=1600&auto=format&fit=crop&q=85',
    thumbnailUrl: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=400&auto=format&fit=crop&q=75',
    dominantColor: '#1d2a1c',
  },
  {
    id: 'nature-foggy-mountains',
    name: 'Emerald Ridge',
    category: 'nature',
    url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1600&auto=format&fit=crop&q=85',
    thumbnailUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400&auto=format&fit=crop&q=75',
    dominantColor: '#142820',
  },
  {
    id: 'nature-dark-palms',
    name: 'Midnight Palm Shadows',
    category: 'nature',
    url: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=1600&auto=format&fit=crop&q=85',
    thumbnailUrl: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=400&auto=format&fit=crop&q=75',
    dominantColor: '#0a140d',
  },

  // ── TECH & CYBERPUNK ──
  {
    id: 'tech-neon-grid',
    name: 'Cyber Horizon',
    category: 'tech',
    url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1600&auto=format&fit=crop&q=85',
    thumbnailUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400&auto=format&fit=crop&q=75',
    dominantColor: '#080d1a',
  },
  {
    id: 'tech-dark-abstract',
    name: 'Obsidian Mesh',
    category: 'tech',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1600&auto=format&fit=crop&q=85',
    thumbnailUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&auto=format&fit=crop&q=75',
    dominantColor: '#111317',
  },
  {
    id: 'tech-laser-violet',
    name: 'Neon Tokyo Dusk',
    category: 'tech',
    url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1600&auto=format&fit=crop&q=85',
    thumbnailUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=400&auto=format&fit=crop&q=75',
    dominantColor: '#1a0d24',
  },

  // ── MINIMAL & ARCHITECTURE ──
  {
    id: 'minimal-concrete-arch',
    name: 'Brutalist Shadow',
    category: 'minimal',
    url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1600&auto=format&fit=crop&q=85',
    thumbnailUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&auto=format&fit=crop&q=75',
    dominantColor: '#1f2429',
  },
  {
    id: 'minimal-marble-white',
    name: 'Carrara Marble Studio',
    category: 'minimal',
    url: 'https://images.unsplash.com/photo-1584824486509-112e4181ff6b?w=1600&auto=format&fit=crop&q=85',
    thumbnailUrl: 'https://images.unsplash.com/photo-1584824486509-112e4181ff6b?w=400&auto=format&fit=crop&q=75',
    dominantColor: '#e5e7eb',
  },
  {
    id: 'minimal-warm-loft',
    name: 'Soho Studio Light',
    category: 'minimal',
    url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1600&auto=format&fit=crop&q=85',
    thumbnailUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=400&auto=format&fit=crop&q=75',
    dominantColor: '#2b231f',
  },

  // ── COSMIC & AURA ──
  {
    id: 'cosmic-galaxy-deep',
    name: 'Milky Way Nebula',
    category: 'cosmic',
    url: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=1600&auto=format&fit=crop&q=85',
    thumbnailUrl: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=400&auto=format&fit=crop&q=75',
    dominantColor: '#090a1a',
  },
  {
    id: 'cosmic-aurora-glow',
    name: 'Nordic Aurora',
    category: 'cosmic',
    url: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=1600&auto=format&fit=crop&q=85',
    thumbnailUrl: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=400&auto=format&fit=crop&q=75',
    dominantColor: '#0a1e1d',
  },

  // ── LIFESTYLE & WARMTH ──
  {
    id: 'lifestyle-coffee-warm',
    name: 'Artisan Espresso',
    category: 'lifestyle',
    url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1600&auto=format&fit=crop&q=85',
    thumbnailUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&auto=format&fit=crop&q=75',
    dominantColor: '#2e1c14',
  },
];
