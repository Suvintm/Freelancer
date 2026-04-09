import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../../../context/ThemeContext';

const { width } = Dimensions.get('window');

interface PostItemProps {
  data: {
    author: { name: string; avatar: string; location?: string };
    image: string;
    caption: string;
    likes: number;
    comments: number;
  };
}

export const PostItem: React.FC<PostItemProps> = ({ data }) => {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { borderBottomColor: theme.border }]}>
      {/* Header */}
      <View style={styles.header}>
        <Image source={{ uri: data.author.avatar }} style={styles.avatar} />
        <View style={styles.authorInfo}>
          <Text style={[styles.authorName, { color: theme.text }]}>{data.author.name}</Text>
          {data.author.location && (
            <Text style={[styles.location, { color: theme.textSecondary }]}>{data.author.location}</Text>
          )}
        </View>
        <TouchableOpacity style={styles.moreBtn}>
          <MaterialCommunityIcons name="dots-horizontal" size={20} color={theme.text} />
        </TouchableOpacity>
      </View>

      {/* Main Image */}
      <Image 
        source={{ uri: data.image }} 
        style={styles.mainImage} 
        contentFit="cover"
        transition={300}
      />

      {/* Actions */}
      <View style={styles.actionsRow}>
        <View style={styles.leftActions}>
          <TouchableOpacity style={styles.actionIcon}>
            <MaterialCommunityIcons name="heart-outline" size={24} color={theme.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionIcon}>
            <MaterialCommunityIcons name="chat-outline" size={24} color={theme.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionIcon}>
            <MaterialCommunityIcons name="share-variant-outline" size={24} color={theme.text} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity>
          <MaterialCommunityIcons name="bookmark-outline" size={24} color={theme.text} />
        </TouchableOpacity>
      </View>

      {/* Metadata */}
      <View style={styles.metaData}>
        <Text style={[styles.likesText, { color: theme.text }]}>{data.likes.toLocaleString()} likes</Text>
        <View style={styles.captionRow}>
          <Text style={[styles.captionAuthor, { color: theme.text }]}>{data.author.name}</Text>
          <Text style={[styles.captionText, { color: theme.textSecondary }]}>{data.caption}</Text>
        </View>
        <TouchableOpacity>
          <Text style={[styles.commentsLink, { color: theme.textSecondary }]}>
            View all {data.comments} comments
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingBottom: 20,
    borderBottomWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#333',
  },
  authorInfo: {
    marginLeft: 10,
    flex: 1,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '800',
  },
  location: {
    fontSize: 11,
    marginTop: 1,
  },
  moreBtn: {
    padding: 4,
  },
  mainImage: {
    width: width,
    aspectRatio: 4 / 5, // Instagram Portrait Ratio
    backgroundColor: '#1a1a1a',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  leftActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  actionIcon: {
    // padding: 2,
  },
  metaData: {
    paddingHorizontal: 16,
  },
  likesText: {
    fontSize: 14,
    fontWeight: '900',
    marginBottom: 6,
  },
  captionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  captionAuthor: {
    fontSize: 13,
    fontWeight: '800',
    marginRight: 6,
  },
  captionText: {
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
  commentsLink: {
    fontSize: 12,
    marginTop: 4,
    opacity: 0.7,
  },
});
