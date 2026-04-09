/**
 * Production-Grade Rich Text Parser
 * Identifies mentions (@username) and URLs (https://...) for high-fidelity rendering.
 */

export type TextPartType = 'text' | 'mention' | 'url';

export interface TextPart {
  type: TextPartType;
  content: string;
}

export const parseRichText = (text: string): TextPart[] => {
  if (!text) return [];

  // Combined Regex: Captures mentions (@...) and URLs (http...)
  // We use capturing groups to keep the delimiters in the split array
  const regex = /(@[\w.]+)|(https?:\/\/[^\s]+)/g;
  
  const parts: TextPart[] = [];
  let lastIndex = 0;
  let match;

  // Reseting regex state just in case
  regex.lastIndex = 0;

  while ((match = regex.exec(text)) !== null) {
    // Add preceding normal text if any
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        content: text.substring(lastIndex, match.index)
      });
    }

    // Determine if it was a mention or URL
    if (match[1]) {
      parts.push({
        type: 'mention',
        content: match[1]
      });
    } else if (match[2]) {
      parts.push({
        type: 'url',
        content: match[2]
      });
    }

    lastIndex = regex.lastIndex;
  }

  // Add remaining text if any
  if (lastIndex < text.length) {
    parts.push({
      type: 'text',
      content: text.substring(lastIndex)
    });
  }

  return parts;
};
