import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  Dimensions,
  Platform,
  StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

const { width: SW, height: SH } = Dimensions.get('window');

/**
 * PRODUCTION-GRADE STORY VIEWER
 * High-fidelity fullscreen viewing with "Add More" (+) direct navigation.
 */
export default function StoryViewScreen() {
  const router = useRouter();

  // Mock content for the viewer
  const post = {
    image: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=1080',
    caption: 'Loving the SuviX creative vibes! 🚀 #FreelancerLife',
    timestamp: '2h ago'
  };

  const handleAddMore = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/story/create');
  };

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" />
      
      {/* ─── FULLSCREEN CONTENT ─── */}
      <Image 
        source={{ uri: post.image }} 
        style={StyleSheet.absoluteFill} 
        resizeMode="cover" 
      />

      {/* ─── OVERLAYS ─── */}
      <LinearGradient
        colors={['rgba(0,0,0,0.6)', 'transparent', 'rgba(0,0,0,0.8)']}
        style={StyleSheet.absoluteFill}
      />

      {/* ─── HEADER ─── */}
      <View style={s.header}>
        <View style={s.userInfo}>
            <View style={s.miniAvatarWrapper}>
                <Image source={{ uri: post.image }} style={s.miniAvatar} />
            </View>
            <View>
                <Text style={s.username}>Your Story</Text>
                <Text style={s.timestamp}>{post.timestamp}</Text>
            </View>
        </View>

        <TouchableOpacity onPress={() => router.back()} style={s.closeBtn}>
           <Ionicons name="close" size={28} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* ─── CAPTION ─── */}
      <View style={s.captionWrapper}>
        <Text style={s.captionText}>{post.caption}</Text>
      </View>

      {/* ─── BOTTOM ACTIONS ─── */}
      <View style={s.footer}>
        <TouchableOpacity 
          style={s.addBadge} 
          onPress={handleAddMore}
          activeOpacity={0.8}
        >
          <View style={s.plusCircle}>
             <Ionicons name="add" size={24} color="#fff" />
          </View>
          <Text style={s.addLabel}>Add Post</Text>
        </TouchableOpacity>

        <View style={s.spacer} />
        
        <TouchableOpacity style={s.footerIcon}>
            <Ionicons name="ellipsis-horizontal" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* ─── PROGRESS BAR INDICATOR (MOCK) ─── */}
      <View style={s.progressRow}>
         <View style={s.progressBarActive} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    zIndex: 10,
  },
  userInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  miniAvatarWrapper: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    borderColor: '#fff',
    padding: 1,
  },
  miniAvatar: { width: '100%', height: '100%', borderRadius: 18 },
  username: { color: '#fff', fontSize: 14, fontWeight: '800' },
  timestamp: { color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '600' },
  closeBtn: { padding: 4 },

  captionWrapper: {
    position: 'absolute',
    bottom: 120,
    width: '100%',
    paddingHorizontal: 24,
  },
  captionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 22,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  footer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 44 : 24,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  addBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 6,
    paddingVertical: 6,
    borderRadius: 30,
    gap: 8,
    paddingRight: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  plusCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addLabel: { color: '#fff', fontSize: 14, fontWeight: '700' },
  spacer: { flex: 1 },
  footerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  progressRow: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 52 : 32,
    flexDirection: 'row',
    width: '100%',
    paddingHorizontal: 8,
    gap: 4,
  },
  progressBarActive: {
    height: 2,
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 1,
  },
});
