import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../../../context/ThemeContext';

interface PollOption {
  id: string;
  text: string;
  order_index: number;
  _count?: {
    responses: number;
  };
}

interface PollItemProps {
  data: {
    id: string;
    user?: {
      username?: string;
      profile?: {
        name?: string;
        profile_picture?: string;
      };
    };
    like_count?: number;
    isLiked?: boolean;
    poll?: {
      id: string;
      question: string;
      type?: 'MULTIPLE_CHOICE' | 'OPEN_ENDED';
      totalVotes?: number;
      options?: PollOption[];
    };
  };
}

export const PollItem: React.FC<PollItemProps> = ({ data }) => {
  const { theme } = useTheme();

  const poll = data.poll || { id: 'p', question: 'No question' };
  const isMultipleChoice = poll.type === 'MULTIPLE_CHOICE' || !poll.type;

  const [votedOptionId, setVotedOptionId] = useState<string | null>(null);
  const [textResponse, setTextResponse] = useState('');
  const [hasVotedText, setHasVotedText] = useState(false);

  const [votesCount, setVotesCount] = useState<Record<string, number>>(() => {
    const counts: Record<string, number> = {};
    poll.options?.forEach((opt) => {
      counts[opt.id] = opt._count?.responses || 0;
    });
    return counts;
  });

  const handleVote = (optionId: string) => {
    if (votedOptionId !== null) return;
    setVotedOptionId(optionId);
    setVotesCount(prev => ({
      ...prev,
      [optionId]: prev[optionId] + 1
    }));
  };

  const handleTextSubmit = () => {
    if (!textResponse.trim()) return;
    setHasVotedText(true);
  };

  const totalVotes = Object.values(votesCount).reduce((a, b) => a + b, 0);

  return (
    <View style={[styles.container, { borderBottomColor: theme.border }]}>
      {/* Header */}
      <View style={styles.header}>
        {data.user?.profile?.profile_picture ? (
          <Image source={{ uri: data.user.profile.profile_picture }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatarPlaceholder, { backgroundColor: theme.border }]} />
        )}
        <View style={styles.authorInfo}>
          <Text style={[styles.authorName, { color: theme.text }]}>
            {data.user?.profile?.name || data.user?.username || 'User'}
          </Text>
          <Text style={[styles.location, { color: theme.textSecondary }]}>Poll Question</Text>
        </View>
        <TouchableOpacity style={styles.moreBtn}>
          <MaterialCommunityIcons name="dots-horizontal" size={20} color={theme.text} />
        </TouchableOpacity>
      </View>

      {/* Question */}
      <View style={styles.metaData}>
        <Text style={[styles.questionText, { color: theme.text }]}>{poll.question}</Text>
      </View>

      {/* Options or Text Input */}
      {isMultipleChoice ? (
        <View style={styles.optionsContainer}>
          {poll.options?.map((option) => {
            const voteCount = votesCount[option.id] || 0;
            const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
            const isSelected = votedOptionId === option.id;
            const hasVotedAny = votedOptionId !== null;

            return (
              <TouchableOpacity
                key={option.id}
                activeOpacity={0.8}
                disabled={hasVotedAny}
                onPress={() => handleVote(option.id)}
                style={[
                  styles.optionCard,
                  { 
                    backgroundColor: theme.isDarkMode ? '#1C1C1E' : '#F2F2F7',
                    borderColor: isSelected ? '#3b82f6' : 'transparent',
                    borderWidth: isSelected ? 1 : 0
                  }
                ]}
              >
                {/* Visual Progress Bar Overlay */}
                {hasVotedAny && (
                  <View 
                    style={[
                      styles.progressBar, 
                      { 
                        width: `${percentage}%`,
                        backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.2)' : (theme.isDarkMode ? '#2C2C2E' : '#E5E5EA')
                      }
                    ]} 
                  />
                )}

                <View style={styles.optionContent}>
                  <Text style={[styles.optionText, { color: theme.text, fontWeight: isSelected ? '700' : '500' }]}>
                    {option.text}
                  </Text>
                  {hasVotedAny && (
                    <Text style={[styles.percentageText, { color: theme.textSecondary }]}>
                      {percentage}%
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      ) : (
        /* Open Ended Input */
        <View style={styles.openEndedContainer}>
          {hasVotedText ? (
            <View style={[styles.responseSubmitted, { backgroundColor: theme.isDarkMode ? '#1C1C1E' : '#F2F2F7' }]}>
              <MaterialCommunityIcons name="check-circle" size={20} color="#10B981" />
              <Text style={[styles.responseSubmittedText, { color: theme.text }]}>Response submitted!</Text>
            </View>
          ) : (
            <View style={[styles.inputWrapper, { borderColor: theme.border }]}>
              <TextInput
                style={[styles.textInput, { color: theme.text }]}
                placeholder="Type your response here..."
                placeholderTextColor={theme.textSecondary}
                value={textResponse}
                onChangeText={setTextResponse}
              />
              <TouchableOpacity onPress={handleTextSubmit} style={styles.sendButton}>
                <MaterialCommunityIcons name="send" size={18} color="#3b82f6" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

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
        {isMultipleChoice && (
          <Text style={[styles.totalVotesText, { color: theme.textSecondary }]}>
            {totalVotes.toLocaleString()} votes
          </Text>
        )}
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
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
    marginBottom: 12,
  },
  questionText: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
  },
  optionsContainer: {
    paddingHorizontal: 12,
    gap: 8,
    marginBottom: 12,
  },
  optionCard: {
    height: 48,
    borderRadius: 10,
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  progressBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
  },
  optionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    zIndex: 10,
  },
  optionText: {
    fontSize: 13,
  },
  percentageText: {
    fontSize: 13,
    fontWeight: '700',
  },
  openEndedContainer: {
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  responseSubmitted: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    gap: 8,
  },
  responseSubmittedText: {
    fontSize: 13,
    fontWeight: '600',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
  },
  textInput: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 8,
  },
  sendButton: {
    padding: 4,
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
