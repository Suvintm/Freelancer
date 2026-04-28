import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  ScrollView, 
  FlatList,
  Image,
  Dimensions,
  Platform
} from 'react-native';
import { useTheme } from '../../src/context/ThemeContext';
import { ScreenContainer } from '../../src/components/shared/ScreenContainer';
import { useAuthStore } from '../../src/store/useAuthStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Ionicons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  SharedValue, 
  FadeInDown,
  FadeInRight
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

// ── UNIQUE DEMO DATA ──────────────────────────────────────────────────────
const PRIORITY_COLLABS = [
  { id: 'c1', name: 'Google Cloud', status: 'Active Sync', icon: 'cloud', color: '#4285F4', avatar: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_Logo.svg/1200px-Google_%22G%22_Logo.svg.png' },
  { id: 'c2', name: 'Vibe Studio', status: 'In Review', icon: 'camera', color: '#FF3040', avatar: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80&w=100' },
  { id: 'c3', name: 'Azure DevOps', status: 'Deploys', icon: 'cpu', color: '#0078D4', avatar: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Microsoft_logo.svg/1024px-Microsoft_logo.svg.png' },
];

const RECENT_CHATS = [
  { 
    id: '1', 
    name: 'Sarah Wilson', 
    message: 'The new motion graphics are ready for the SuviX launch! 🎬', 
    time: '2m ago', 
    unread: true, 
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100',
    type: 'DIRECT',
    verified: true
  },
  { 
    id: '2', 
    name: 'Tech Innovators Community', 
    message: 'Marcus: We should aim for the Q3 release.', 
    time: '15m ago', 
    unread: false, 
    avatar: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=100',
    type: 'COMMUNITY',
    isGroup: true
  },
  { 
    id: '3', 
    name: 'Alex Rivera', 
    message: 'Sent a project document (PDF)', 
    time: '1h ago', 
    unread: true, 
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=100',
    type: 'DIRECT',
    verified: false
  },
  { 
    id: '4', 
    name: 'Design Synerge', 
    message: 'Emma: Just updated the Figma files.', 
    time: '3h ago', 
    unread: false, 
    avatar: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=100',
    type: 'COMMUNITY',
    isGroup: true
  },
  { 
    id: '5', 
    name: 'James Chen', 
    message: 'Can you check the latest API specs?', 
    time: '5h ago', 
    unread: false, 
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100',
    type: 'DIRECT',
    verified: true
  }
];

export default function UniqueChatsScreen({ scrollY: globalScrollY }: { scrollY?: SharedValue<number> }) {
  const { theme } = useTheme();
  const { user } = useAuthStore();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('All');
  const TABS = ['All', 'Direct', 'Communities'];

  const filteredChats = React.useMemo(() => {
    if (activeTab === 'All') return RECENT_CHATS;
    if (activeTab === 'Direct') return RECENT_CHATS.filter(c => c.type === 'DIRECT');
    if (activeTab === 'Communities') return RECENT_CHATS.filter(c => c.type === 'COMMUNITY');
    return RECENT_CHATS;
  }, [activeTab]);

  const renderCollabCard = ({ item }: { item: typeof PRIORITY_COLLABS[0] }) => (
    <Animated.View entering={FadeInRight.delay(200)} style={styles.collabCard}>
      <BlurView intensity={isDarkMode ? 20 : 40} tint={isDarkMode ? 'dark' : 'light'} style={styles.collabBlur}>
        <View style={[styles.collabIconFrame, { backgroundColor: item.color + '20' }]}>
           <Image source={{ uri: item.avatar }} style={styles.collabImg} />
        </View>
        <Text style={[styles.collabName, { color: theme.text }]} numberOfLines={1}>{item.name}</Text>
        <View style={styles.statusPill}>
           <View style={[styles.statusDot, { backgroundColor: item.color }]} />
           <Text style={[styles.statusText, { color: theme.textSecondary }]}>{item.status}</Text>
        </View>
      </BlurView>
    </Animated.View>
  );

  const renderMessageItem = (item: typeof RECENT_CHATS[0]) => (
    <TouchableOpacity 
      style={styles.messageRow} 
      activeOpacity={0.7}
      onPress={() => router.push(`/chat/${item.id}`)}
    >
      {/* 🟦 SQUIRCLE AVATAR (Unique to SuviX) */}
      <View style={styles.squircleContainer}>
        <Image source={{ uri: item.avatar }} style={styles.squircleAvatar} />
        {item.unread && <View style={styles.activeIndicator} />}
      </View>

      <View style={styles.messageContent}>
        <View style={styles.messageHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={[styles.messageName, { color: theme.text }, item.unread && styles.boldText]}>
              {item.name}
            </Text>
            {item.verified && (
              <MaterialCommunityIcons name="shield-check" size={14} color="#FF3040" style={{ marginLeft: 4 }} />
            )}
          </View>
          <Text style={[styles.messageTime, { color: theme.textSecondary }]}>{item.time}</Text>
        </View>
        
        <Text 
          style={[
            styles.messageSnippet, 
            { color: theme.textSecondary },
            item.unread && { color: theme.text, fontWeight: '500' }
          ]} 
          numberOfLines={1}
        >
          {item.message}
        </Text>

        <View style={styles.tagRow}>
           <View style={[styles.typeTag, { backgroundColor: item.isGroup ? 'rgba(34, 197, 94, 0.1)' : theme.secondary }]}>
              <Text style={[styles.typeTagText, { color: item.isGroup ? '#22C55E' : theme.textSecondary }]}>
                {item.isGroup ? 'GROUP' : item.type}
              </Text>
           </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const isDarkMode = theme.isDarkMode;

  return (
    <ScreenContainer isScrollable={false}>
      {/* 🚀 UNIQUE FLOATING HEADER */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View>
          <Text style={[styles.brandText, { color: theme.text }]}>Messages</Text>
          <Text style={[styles.welcomeText, { color: theme.textSecondary }]}>Workspace Hub</Text>
        </View>
      </View>

      <Animated.ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        onScroll={(e) => {
          if (globalScrollY) globalScrollY.value = e.nativeEvent.contentOffset.y;
        }}
        scrollEventThrottle={16}
      >
        {/* 🛠️ FILTER CHIPS */}
        <View style={styles.filterContainer}>
          {TABS.map(tab => (
            <TouchableOpacity 
              key={tab} 
              onPress={() => setActiveTab(tab)}
              style={[
                styles.filterChip, 
                activeTab === tab && { backgroundColor: theme.text, borderColor: theme.text }
              ]}
            >
              <Text style={[
                styles.filterText, 
                { color: theme.textSecondary },
                activeTab === tab && { color: theme.background }
              ]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ✉️ MODERN MESSAGE LIST */}
        <View style={styles.recentContainer}>
           <View style={styles.recentHeader}>
             <Text style={[styles.sectionTitle, { color: theme.text }]}>
               {activeTab === 'All' ? 'Recent Threads' : `${activeTab} Messages`}
             </Text>
             <View style={[styles.countPill, { backgroundColor: theme.secondary }]}>
               <Text style={[styles.countPillText, { color: theme.textSecondary }]}>{filteredChats.length}</Text>
             </View>
           </View>
           {filteredChats.map(chat => (
             <Animated.View key={chat.id} entering={FadeInDown.delay(200)}>
                {renderMessageItem(chat)}
             </Animated.View>
           ))}
           {filteredChats.length === 0 && (
             <View style={styles.emptyState}>
               <MaterialCommunityIcons name="message-off-outline" size={48} color={theme.textSecondary} />
               <Text style={[styles.emptyStateText, { color: theme.textSecondary }]}>No messages in this category</Text>
             </View>
           )}
        </View>
      </Animated.ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 25,
    paddingBottom: 4,
    zIndex: 100,
  },
  brandText: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -1,
  },
  welcomeText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: -2,
    opacity: 0.6,
  },
  composeBtn: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF3040',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 25,
    gap: 10,
    marginBottom: 10,
  },
  filterChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  recentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 25,
    marginBottom: 15,
  },
  countPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  countPillText: {
    fontSize: 11,
    fontWeight: '900',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyStateText: {
    fontSize: 14,
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 25,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  collabList: {
    paddingHorizontal: 25,
    gap: 15,
    paddingBottom: 10,
  },
  collabCard: {
    width: 140,
    height: 160,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  collabBlur: {
    flex: 1,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  collabIconFrame: {
    width: 60,
    height: 60,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  collabImg: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
  },
  collabName: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 6,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  recentContainer: {
    marginTop: 20,
  },
  messageRow: {
    flexDirection: 'row',
    paddingHorizontal: 25,
    paddingVertical: 18,
    alignItems: 'center',
  },
  squircleContainer: {
    position: 'relative',
  },
  squircleAvatar: {
    width: 54,
    height: 54,
    borderRadius: 18, // Unique squircle look
  },
  activeIndicator: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#FF3040',
    borderWidth: 3,
    borderColor: 'black',
  },
  messageContent: {
    flex: 1,
    marginLeft: 16,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  messageName: {
    fontSize: 15,
    fontWeight: '700',
  },
  boldText: {
    fontWeight: '900',
  },
  messageTime: {
    fontSize: 11,
    opacity: 0.5,
  },
  messageSnippet: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 6,
  },
  tagRow: {
    flexDirection: 'row',
  },
  typeTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  typeTagText: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  bottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
    zIndex: 90,
    pointerEvents: 'none',
  },
});
