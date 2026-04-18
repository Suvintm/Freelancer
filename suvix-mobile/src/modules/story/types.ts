export type StoryObjectType = 'TEXT' | 'STICKER' | 'IMAGE';

export interface StoryObject {
    id: string;
    type: StoryObjectType;
    content: string;
    x: number;
    y: number;
    scale: number;
    rotation: number;
    // ── Text Styling ──
    fontStyle?: 'Modern' | 'Classic' | 'Italic' | 'Neon' | 'Typewriter' | 'Cursive' | 'Comic';
    color?: string;
    textBackground?: boolean;
    textAlign?: 'left' | 'center' | 'right';
    width?: number;
}