import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface VerifiedBadgeProps {
  category?: string;
  roleGroup?: 'CLIENT' | 'PROVIDER';
  size?: number;
}

/**
 * 🎖️ DYNAMIC VERIFIED BADGE
 * 
 * Switches colors based on category/role:
 * - YT Creator -> Red
 * - Fitness -> Green
 * - Provider -> Purple/Gold
 * - Client -> SuviX Blue
 */
export const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({ 
  category, 
  roleGroup = 'CLIENT', 
  size = 14 
}) => {
  // Resolve color based on SuviX Brand Guidelines
  let color = '#3B82F6'; // Default SuviX Blue

  if (category === 'youtube_creator') {
    color = '#FF0000'; // Youtube Red
  } else if (category === 'fitness_expert') {
    color = '#22C55E'; // Fitness Green
  } else if (roleGroup === 'PROVIDER') {
    color = '#A855F7'; // SuviX Provider Purple
  }

  return (
    <View style={[styles.badgeContainer, { width: size + 4, height: size + 4 }]}>
      <MaterialCommunityIcons 
        name="check-decagram" 
        size={size} 
        color={color} 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  badgeContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
});
