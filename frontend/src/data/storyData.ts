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
    _id: '1_yt_creator',
    username: 'ChaiAurCode',
    avatar: 'https://i.ytimg.com/vi/TZDbe_8raSA/maxresdefault.jpg',
    isSeen: false,
    verifiedColor: '#EF4444', // Red for YT Creator
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
      },
      {
        id: 'yt_3',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?auto=format&fit=crop&q=80&w=1080',
        caption: 'Late night coding sessions... ☕'
      }
    ]
  },
  {
    _id: '2_fitness_influencer',
    username: 'Sam Sameer',
    avatar: 'https://tse1.explicit.bing.net/th/id/OIP.PMTNrFgQOWBq5Yxr63Bv6QAAAA?rs=1&pid=ImgDetMain&o=7&rm=3',
    isSeen: false,
    verifiedColor: '#22C55E', // Green for Fitness
    hasActive: true,
    slides: [
      {
        id: 'fit_1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&q=80&w=1080',
        caption: 'Morning sweat session! Push your boundaries today. 💪',
        durationMs: 5000
      },
      {
        id: 'fit_2',
        type: 'video',
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
        caption: 'Outdoor sprints. Stay moving!'
      }
    ]
  },
  {
    _id: '4_editor',
    username: 'SuviX',
    avatar: 'https://media.istockphoto.com/id/1277971635/photo/portrait-of-a-smiling-man-of-indian-ethnicity.jpg?s=1024x1024&w=is&k=20&c=Ve_FZ5p_gO5Kd3gkW6nVicgiwAi5I0lXcW_L4MGKLEY=',
    isSeen: true,
    verifiedColor: '#3B82F6', // Blue for Editor
    hasActive: true,
    slides: [
      {
        id: 'ed_1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&q=80&w=1080',
        caption: 'Color grading the next master class video. 🎨',
        durationMs: 5000
      },
      {
        id: 'ed_2',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&q=80&w=1080',
        caption: 'Mechanical keyboard aesthetic check. ⌨️',
        durationMs: 4000
      }
    ]
  },
  {
    _id: '5_client',
    username: 'SuviX',
    avatar: 'https://media.istockphoto.com/id/1541953395/photo/young-happy-indian-parents-holding-cute-baby-boy-while-standing-at-home-asian-mom-and-dad.jpg?s=1024x1024&w=is&k=20&c=vBycraqLaqkFZreZRVCoKUrwmZHMLsdiVuasZ7I7Fsc=',
    isSeen: true,
    verifiedColor: '#A855F7', // Purple for Client
    hasActive: true,
    slides: [
      {
        id: 'cl_1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=1080',
        caption: 'Seeking full-time video editors for YouTube growth projects. DM portfolio! 🤝',
        durationMs: 6000
      }
    ]
  }
];
