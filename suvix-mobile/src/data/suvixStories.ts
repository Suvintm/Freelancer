import { StoryItem } from '../hooks/useStories';

/**
 * MOCK: SuviX Industry Stories
 * Represents stories created by users embodying each of the platform's primary roles.
 */
export const SUVIX_INDUSTRY_STORIES: StoryItem[] = [
  {
    _id: '1_yt_creator',
    username: 'SuviX',
    avatar: 'https://images.unsplash.com/photo-1516280440502-a2ce893ce71d?auto=format&fit=crop&q=80&w=200',
    isSeen: false,
    verifiedColor: '#EF4444', // Red for YT Creator
    slides: [
      { id: 'y1', image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=1080', caption: 'New vlog drop in 10 mins! 🎥' },
      { id: 'y2', image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=1080', caption: 'Editing mode activated 💻' },
    ]
  },
  {
    _id: '2_fitness_influencer',
    username: 'SuviX',
    avatar: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=200',
    isSeen: false,
    verifiedColor: '#22C55E', // Green for Fitness
    slides: [
      { id: 'f1', image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&q=80&w=1080', caption: 'Morning grind! Push your limits. 💪' },
      { id: 'f2', image: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&q=80&w=1080', caption: 'Nutrition is key today. 🥗' },
    ]
  },
  {
    _id: '4_editor',
    username: 'SuviX',
    avatar: 'https://images.unsplash.com/photo-1536240478700-b869070f9279?auto=format&fit=crop&q=80&w=200',
    isSeen: true,
    verifiedColor: '#3B82F6', // Blue for Editor
    slides: [
      { id: 'e1', image: 'https://images.unsplash.com/photo-1574717025058-2f8737d2e2b7?auto=format&fit=crop&q=80&w=1080', caption: 'Color grading the next masterpiece... 🎨' },
    ]
  },
  {
    _id: '5_client',
    username: 'SuviX',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200',
    isSeen: true,
    verifiedColor: '#A855F7', // Purple for Client / Normal User
    slides: [
      { id: 'c1', image: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=1080', caption: 'Looking for a talented editor for my next project! 🤝' },
    ]
  }
];
