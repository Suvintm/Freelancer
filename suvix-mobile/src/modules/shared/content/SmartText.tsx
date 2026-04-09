import React from 'react';
import { Text, StyleSheet, TouchableOpacity, Linking, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../../context/ThemeContext';
import { parseRichText, TextPart } from '../../../utils/richText';

interface SmartTextProps {
  text: string;
  style?: any;
  numberOfLines?: number;
  showIcons?: boolean;
}

/**
 * SmartText: Production-grade component for rendering rich content.
 * Handles mentions (@) and URLs automatically.
 */
export const SmartText: React.FC<SmartTextProps> = ({ text, style, numberOfLines, showIcons = true }) => {
  const { theme } = useTheme();
  const parts = parseRichText(text);

  const handleUrlPress = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      }
    } catch (error) {
      console.warn('Could not open URL:', url);
    }
  };

  const handleMentionPress = (mention: string) => {
    // Phase 2: Implement search/profile redirection
    console.log('Mention pressed:', mention);
  };

  return (
    <Text style={style} numberOfLines={numberOfLines}>
      {parts.map((part, index) => {
        if (part.type === 'mention') {
          return (
            <Text
              key={index}
              style={[styles.mention, { color: theme.accent }]}
              onPress={() => handleMentionPress(part.content)}
            >
              {part.content}
            </Text>
          );
        }

        if (part.type === 'url') {
          return (
            <Text
              key={index}
              style={[styles.url, { color: theme.accent }]}
              onPress={() => handleUrlPress(part.content)}
            >
              {showIcons && <MaterialCommunityIcons name="link-variant" size={12} color={theme.accent} />}
              {part.content.replace(/^https?:\/\//, '')}
            </Text>
          );
        }

        return <Text key={index}>{part.content}</Text>;
      })}
    </Text>
  );
};

const styles = StyleSheet.create({
  mention: {
    fontWeight: '800',
    color: '#A855F7', // Vibrant Purple for mentions
  },
  url: {
    textDecorationLine: 'underline',
    fontWeight: '700',
    color: '#3B82F6', // Pro Link Blue
  },
});
