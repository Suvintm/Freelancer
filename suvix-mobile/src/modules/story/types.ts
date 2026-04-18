
export type StoryObjectType = 'TEXT' | 'STICKER' | 'IMAGE';

export interface StoryObject {
    id: string;
    type: StoryObjectType;
    content: string; // Text string or Sticker ID/URI
    x: number;
    y: number;
    scale: number;
    rotation: number;
    // Styling
    fontStyle?: 'Modern' | 'Classic' | 'Neon' | 'Typewriter';
    color?: string;
}
