/**
 * Shared Mock Data for Stories
 * Centralized for home carousel and dedicated Story Page.
 */
export const ENRICHED_STORY_DATA = [
  { 
    id: 'me', 
    name: "My Story", 
    image: "https://i.pravatar.cc/150?u=me", 
    isUser: true,
    stories: [{ id: 's0', url: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800", time: "Just now", comments: [] }]
  },
  { 
    id: '1', 
    name: "Alex Rivera", 
    image: "https://i.pravatar.cc/150?u=1", 
    active: true,
    stories: [
      { 
        id: 's1', 
        url: "https://images.unsplash.com/photo-1536240478700-b869070f9279?w=800", 
        time: "2h",
        comments: [
          { id: 'c1', userName: "DesignBot", userAvatar: "https://i.pravatar.cc/150?u=11", text: "That lighting is insane! 🔥", time: "1h" },
          { id: 'c2', userName: "PixelPerfect", userAvatar: "https://i.pravatar.cc/150?u=12", text: "Tutorial soon?", time: "45m" }
        ]
      },
      { 
        id: 's2', 
        url: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800", 
        time: "1h",
        comments: []
      }
    ]
  },
  { 
    id: '2', 
    name: "Sarah Chen", 
    image: "https://i.pravatar.cc/150?u=2", 
    active: true,
    stories: [
      { 
        id: 's3', 
        url: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800", 
        time: "5h",
        comments: [
          { id: 'c3', userName: "CodeRunner", userAvatar: "https://i.pravatar.cc/150?u=15", text: "Clean setup Sarah!", time: "2h" }
        ]
      }
    ]
  },
  { 
    id: '3', 
    name: "Marc J.", 
    image: "https://i.pravatar.cc/150?u=3", 
    active: true,
    stories: [
      { id: 's4', url: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800", time: "12h", comments: [] },
      { id: 's5', url: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800", time: "10h", comments: [] }
    ]
  },
  { 
    id: '4', 
    name: "Elena S.", 
    image: "https://i.pravatar.cc/150?u=4", 
    active: true,
    stories: [
      { id: 's6', url: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800", time: "8h", comments: [] }
    ]
  },
  { 
    id: '5', 
    name: "VFX Master", 
    image: "https://i.pravatar.cc/150?u=5", 
    active: false,
    stories: [{ id: 's7', url: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800", time: "1d", comments: [] }]
  },
];
