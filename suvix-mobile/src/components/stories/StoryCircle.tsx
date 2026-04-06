import React from 'react';
import { 
  View, 
  Text, 
  Image, 
  StyleSheet, 
  Pressable, 
  Dimensions 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { StoryItem } from '../../hooks/useStories';
import { useTheme } from '../../context/ThemeContext';
import { useRouter } from 'expo-router';

const { width: SW } = Dimensions.get('window');

interface StoryCircleProps {
  story: StoryItem;
  onPress?: (story: StoryItem) => void;
}

export const StoryCircle = React.memo(({ story, onPress }: StoryCircleProps) => {
  const { isDarkMode, theme } = useTheme();
  const router = useRouter();
  
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (story.isUserStory && !story.hasActiveStory) {
      router.push('/story/create');
    } else {
      router.push(`/story/${story._id}`);
    }
  };

  const isSeen = story.isSeen && !story.isUserStory;
  const hasUserActive = story.isUserStory && story.hasActiveStory;
  const showGradient = (!isSeen && !story.isUserStory) || hasUserActive;

  // Premium Monochrome Mixture (White & Zinc)
  const gradientColors = isDarkMode 
    ? (['#FFFFFF', '#71717a'] as const) // Dark Mode: White to Zinc-500
    : (['#09090b', '#a1a1aa'] as const); // Light Mode: Zinc-950 to Zinc-400

  return (
    <Pressable onPress={handlePress} style={s.container}>
      <View style={s.avatarWrapper}>
        {showGradient ? (
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={s.gradientBorder}
          >
            <View style={[s.innerCircle, { backgroundColor: theme.primary }]}>
              <Image source={{ uri: story.avatar }} style={s.avatar} />
            </View>
          </LinearGradient>
        ) : (
          <View style={[s.plainBorder, isSeen && s.seenBorder]}>
            <Image source={{ uri: story.avatar }} style={s.avatar} />
          </View>
        )}

        {story.isUserStory && (
          <View style={s.plusBadge}>
            <Ionicons name="add" size={14} color="#FFF" />
          </View>
        )}
      </View>
      <Text 
        style={[s.username, { color: theme.text }, isSeen && s.seenUsername]} 
        numberOfLines={1}
      >
        {story.username}
      </Text>
    </Pressable>
  );
});

const s = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginHorizontal: 8,
    width: 76,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 6,
  },
  gradientBorder: {
    width: 72,
    height: 72,
    borderRadius: 36,
    padding: 2.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerCircle: {
    width: '100%',
    height: '100%',
    borderRadius: 34,
    backgroundColor: '#050505', // Dashboard background color
    padding: 2,
  },
  plainBorder: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    padding: 4,
  },
  seenBorder: {
    borderColor: 'rgba(255,255,255,0.08)',
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 32,
    backgroundColor: '#1a1a1a',
  },
  plusBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#3b82f6',
    borderWidth: 2,
    borderColor: '#050505',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  username: {
    fontSize: 11,
    textAlign: 'center',
    fontWeight: '500',
    letterSpacing: -0.2,
  },
  seenUsername: {
    opacity: 0.5,
  },
});
