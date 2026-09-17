export interface StorySlide {
  id: string;
  type: 'image' | 'video';
  url: string;
  caption?: string;
  durationMs?: number;
}

export interface Story {
  _id: string;
  username: string;
  avatar: string;
  hasActive: boolean;
  isUser?: boolean;
  verifiedColor?: string;
  isSeen?: boolean;
  slides: StorySlide[];
}

export const MOCK_STORIES: Story[] = [
  {
    _id: 'tech_with_sam',
    username: 'TechWithSam',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300',
    isSeen: false,
    verifiedColor: '#EF4444',
    hasActive: true,
    slides: [
      {
        id: 'tws_1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80&w=1080',
        caption: 'Reviewing the latest M4 setup! Full benchmark dropping tonight ⚡',
        durationMs: 5000
      }
    ]
  },
  {
    _id: 'chai_aur_code',
    username: 'ChaiAurCode',
    avatar: 'https://i.ytimg.com/vi/TZDbe_8raSA/maxresdefault.jpg',
    isSeen: false,
    verifiedColor: '#EF4444',
    hasActive: true,
    slides: [
      {
        id: 'yt_1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1080',
        caption: 'Working on a new JS series! 🚀 Let me know what you think.',
        durationMs: 5000
      },
      {
        id: 'yt_2',
        type: 'video',
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        caption: 'Vlogging setting up the new studio space! 🎥'
      }
    ]
  },
  {
    _id: 'travel_vibes',
    username: 'TravelVibes',
    avatar: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&q=80&w=300',
    isSeen: false,
    verifiedColor: '#EF4444',
    hasActive: true,
    slides: [
      {
        id: 'tv_1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&q=80&w=1080',
        caption: 'Golden hour in the alpine meadows 🏔️✨',
        durationMs: 5000
      }
    ]
  },
  {
    _id: 'food_diaries',
    username: 'FoodDiaries',
    avatar: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=300',
    isSeen: false,
    verifiedColor: '#EF4444',
    hasActive: true,
    slides: [
      {
        id: 'fd_1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&q=80&w=1080',
        caption: 'Fresh organic greens & sourdough bowl 🥗🌿',
        durationMs: 5000
      }
    ]
  },
  {
    _id: 'creative_mind',
    username: 'CreativeMind',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
    isSeen: false,
    verifiedColor: '#EF4444',
    hasActive: true,
    slides: [
      {
        id: 'cm_1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&q=80&w=1080',
        caption: 'Abstract acrylic palette explorations today 🎨🖌️',
        durationMs: 5000
      }
    ]
  },
  {
    _id: 'wander_lust',
    username: 'WanderLust',
    avatar: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&q=80&w=300',
    isSeen: false,
    verifiedColor: '#EF4444',
    hasActive: true,
    slides: [
      {
        id: 'wl_1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=1080',
        caption: 'Untouched coastlines of Southern Iceland 🌊🇮🇸',
        durationMs: 5000
      }
    ]
  },
  {
    _id: 'pixel_studio',
    username: 'PixelStudio',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=300',
    isSeen: false,
    verifiedColor: '#EF4444',
    hasActive: true,
    slides: [
      {
        id: 'ps_1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=1080',
        caption: 'Studio lighting setup for 8K commercial shoot 📸✨',
        durationMs: 5000
      }
    ]
  }
];
