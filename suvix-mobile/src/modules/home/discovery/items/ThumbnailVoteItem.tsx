import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../../../context/ThemeContext';

const { width } = Dimensions.get('window');

interface ThumbnailVoteItemProps {
  data: {
    id: string;
    user: string;
    location: string;
    img: string;
    images?: string[];
    likes: number;
    comment: string;
    commentsCount: number;
    tags?: string[];
    votes?: number[];
  };
}

export const ThumbnailVoteItem: React.FC<ThumbnailVoteItemProps> = ({ data }) => {
  const { theme } = useTheme();
  const [votedIndex, setVotedIndex] = useState<number | null>(null);

  const images = data.images && data.images.length >= 2 ? data.images.slice(0, 4) : [data.img, data.img];
  const numImages = images.length;

  const [votesCount, setVotesCount] = useState<number[]>(() => {
    if (data.votes && data.votes.length === images.length) {
      return [...data.votes];
    }
    return images.map(() => 0);
  });

  const handleVote = (index: number) => {
    if (votedIndex !== null) return;
    setVotedIndex(index);
    setVotesCount(prev => {
      const copy = [...prev];
      copy[index] += 1;
      return copy;
    });
  };

  const totalVotes = votesCount.reduce((a, b) => a + b, 0);

  return (
    <View style={[styles.container, { borderBottomColor: theme.border }]}>
      {/* Header */}
      <View style={styles.header}>
        <Image source={{ uri: data.img }} style={styles.avatar} />
        <View style={styles.authorInfo}>
          <Text style={[styles.authorName, { color: theme.text }]}>{data.user}</Text>
          <Text style={[styles.location, { color: theme.textSecondary }]}>{data.location}</Text>
        </View>
        <TouchableOpacity style={styles.moreBtn}>
          <MaterialCommunityIcons name="dots-horizontal" size={20} color={theme.text} />
        </TouchableOpacity>
      </View>

      {/* Caption / Comment */}
      <View style={styles.metaData}>
        <Text style={[styles.captionText, { color: theme.text, marginBottom: 12 }]}>{data.comment}</Text>
      </View>

      {/* Grid of Thumbnails to Vote */}
      <View style={styles.gridContainer}>
        {images.map((imgUrl, idx) => {
          const voteCount = votesCount[idx] || 0;
          const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
          const isVoted = votedIndex === idx;
          const hasVotedAny = votedIndex !== null;

          return (
            <TouchableOpacity
              key={idx}
              activeOpacity={0.95}
              onPress={() => handleVote(idx)}
              style={[
                styles.gridCard,
                { 
                  width: numImages === 2 ? (width - 40) / 2 : (width - 44) / 2,
                  height: 120,
                  borderColor: isVoted ? '#3b82f6' : theme.border,
                  borderWidth: isVoted ? 2 : 1
                }
              ]}
            >
              <Image source={{ uri: imgUrl }} style={styles.gridImage} contentFit="cover" />
              
              {/* Voted Mode Overlay */}
              {hasVotedAny ? (
                <View style={[styles.overlay, { backgroundColor: isVoted ? 'rgba(59, 130, 246, 0.4)' : 'rgba(0, 0, 0, 0.6)' }]}>
                  <Text style={styles.percentText}>{percentage}%</Text>
                  <Text style={styles.voteCountText}>{voteCount} votes</Text>
                  {isVoted && (
                    <MaterialCommunityIcons name="check-circle" size={24} color="#FFF" style={styles.checkIcon} />
                  )}
                </View>
              ) : (
                /* Unvoted Mode Button Overlay */
                <View style={styles.votePromptOverlay}>
                  <View style={[styles.voteButton, { backgroundColor: '#3b82f6' }]}>
                    <Text style={styles.voteButtonText}>Option {String.fromCharCode(65 + idx)}</Text>
                  </View>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Actions */}
      <View style={styles.actionsRow}>
        <View style={styles.leftActions}>
          <TouchableOpacity style={styles.actionIcon}>
            <MaterialCommunityIcons name="heart-outline" size={24} color={theme.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionIcon}>
            <MaterialCommunityIcons name="chat-outline" size={24} color={theme.text} />
          </TouchableOpacity>
        </View>
        <Text style={[styles.totalVotesText, { color: theme.textSecondary }]}>
          {totalVotes.toLocaleString()} votes
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingBottom: 16,
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
    fontWeight: '700',
  },
  location: {
    fontSize: 11,
    marginTop: 1,
  },
  moreBtn: {
    padding: 4,
  },
  metaData: {
    paddingHorizontal: 12,
  },
  captionText: {
    fontSize: 13.5,
    lineHeight: 18,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  gridCard: {
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#1E1E1E',
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  votePromptOverlay: {
    position: 'absolute',
    inset: 0,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 8,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  voteButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  voteButtonText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
  },
  overlay: {
    position: 'absolute',
    inset: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  percentText: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '900',
  },
  voteCountText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  checkIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    marginTop: 4,
  },
  leftActions: {
    flexDirection: 'row',
    gap: 16,
  },
  actionIcon: {
    padding: 2,
  },
  totalVotesText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
