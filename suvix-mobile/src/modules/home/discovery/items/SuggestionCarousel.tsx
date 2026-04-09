import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../../../context/ThemeContext';

const { width } = Dimensions.get('window');

interface SuggestionItem {
  id: string;
  name: string;
  avatar?: string;
  image?: string;
  rating?: number;
  specialty?: string;
  price?: string;
}

interface SuggestionCarouselProps {
  type: 'EDITORS' | 'RENTALS';
  data: SuggestionItem[];
}

export const SuggestionCarousel: React.FC<SuggestionCarouselProps> = ({ type, data }) => {
  const { theme } = useTheme();

  const isRental = type === 'RENTALS';

  const renderItem = ({ item }: { item: SuggestionItem }) => {
    return (
      <TouchableOpacity 
        activeOpacity={0.9}
        style={[styles.card, { backgroundColor: theme.secondary, borderColor: theme.border }]}
      >
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: isRental ? item.image : item.avatar }} 
            style={isRental ? styles.productImage : styles.avatarImage} 
            contentFit={isRental ? "contain" : "cover"}
          />
        </View>
        
        <View style={styles.info}>
          <Text numberOfLines={1} style={[styles.name, { color: theme.text }]}>{item.name}</Text>
          <Text numberOfLines={1} style={[styles.subText, { color: theme.textSecondary }]}>
            {isRental ? item.price : item.specialty}
          </Text>
          
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.accent }]}>
            <Text style={styles.actionBtnText}>{isRental ? 'Rent Now' : 'Hire'}</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>
          {isRental ? 'Suggested Rentals' : 'Suggested Editors for You'}
        </Text>
        <TouchableOpacity>
          <Text style={[styles.seeAll, { color: theme.accent }]}>See All</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={data}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 20,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  seeAll: {
    fontSize: 12,
    fontWeight: '800',
  },
  listContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  card: {
    width: width * 0.45,
    borderRadius: 20,
    borderWidth: 1,
    padding: 12,
    alignItems: 'center',
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.03)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 50, // Higher radius for profile feel
  },
  productImage: {
    width: '90%',
    height: '90%',
  },
  info: {
    width: '100%',
    alignItems: 'center',
    gap: 2,
  },
  name: {
    fontSize: 14,
    fontWeight: '800',
  },
  subText: {
    fontSize: 11,
    fontWeight: '600',
  },
  actionBtn: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  actionBtnText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '800',
  }
});
