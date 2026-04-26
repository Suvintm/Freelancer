export interface YouTubeVideo {
  id: string;
  title: string;
  channel: string;
  views: string;
  duration: string;
  description: string;
  category: string;
  thumbnail: string;
}

export const YOUTUBE_ARCHIVE: YouTubeVideo[] = [
  // 🏠 Home & Buildings
  { id: '1', title: 'Modern Home Construction Secrets', channel: 'BuildMaster', views: '2.5M', duration: '18:20', category: 'Construction', description: 'See how modern sky-scrapers are built using reinforced carbon fibers.', thumbnail: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=400' },
  { id: '2', title: 'Home Office Setup 2024', channel: 'TechDesk', views: '1.1M', duration: '12:45', category: 'Tech', description: 'The ultimate minimalist home office for video editors and developers.', thumbnail: 'https://images.unsplash.com/photo-1547082299-de196ea013d6?q=80&w=400' },
  { id: '3', title: 'Building a Cabin in the Woods', channel: 'WildLiving', views: '15M', duration: '45:00', category: 'Vlogs', description: 'A 365-day time-lapse of building a wooden sanctuary from scratch.', thumbnail: 'https://images.unsplash.com/photo-1449156003106-47000e396860?q=80&w=400' },
  { id: '4', title: 'Sustainable Tiny Homes', channel: 'GreenEarth', views: '800K', duration: '10:15', category: 'Construction', description: 'Affordable and sustainable home solutions for the future.', thumbnail: 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?q=80&w=400' },
  
  // 🎥 Vlogs & Travel
  { id: '5', title: 'Solo Travel in Tokyo', channel: 'SuviX Vlogs', views: '3.2M', duration: '22:10', category: 'Vlogs', description: 'Exploring the neon streets of Shinjuku and the quiet shrines of Kyoto.', thumbnail: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=400' },
  { id: '6', title: 'Hidden Gems of Iceland', channel: 'ArcticLens', views: '1.5M', duration: '15:40', category: 'Travel', description: 'Chasing the northern lights in a 4x4 camper van.', thumbnail: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=400' },
  { id: '7', title: 'Street Food in Mumbai', channel: 'TasteBuds', views: '5.6M', duration: '28:15', category: 'Food', description: 'Testing every famous Vada Pav spot in Mumbai.', thumbnail: 'https://images.unsplash.com/photo-1601050690597-df056fb04791?q=80&w=400' },

  // 🎬 VFX & Cinema
  { id: '8', title: 'The Art of Color Grading', channel: 'CinematicWay', views: '900K', duration: '14:50', category: 'VFX', description: 'How to achieve the "Hollywood Look" in DaVinci Resolve.', thumbnail: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=400' },
  { id: '9', title: 'Top 10 VFX Breakdowns 2024', channel: 'VFX Pro', views: '12M', duration: '20:30', category: 'VFX', description: 'Behind the scenes of the most complex CGI shots this year.', thumbnail: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=400' },
  { id: '10', title: 'Filming with the Sony A7S III', channel: 'GearHead', views: '2.1M', duration: '18:00', category: 'Tech', description: 'A deep dive into the best low-light camera on the market.', thumbnail: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=400' },

  // 🎵 Music & Sound
  { id: '11', title: 'Lofi Beats for Coding', channel: 'SuviX Music', views: '25M', duration: '180:00', category: 'Music', description: 'Chilled beats to stay focused and productive.', thumbnail: 'https://images.unsplash.com/photo-1516280440614-37939bb9120b?q=80&w=400' },
  { id: '12', title: 'How to Master Audio', channel: 'StudioLabs', views: '400K', duration: '11:20', category: 'Music', description: 'Pro tips for mixing and mastering your tracks at home.', thumbnail: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=400' },
];
