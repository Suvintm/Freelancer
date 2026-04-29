import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  FlatList,
  ScrollView,
  Image,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  ImageBackground
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '../../src/context/ThemeContext';
import { ScreenContainer } from '../../src/components/shared/ScreenContainer';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Ionicons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown, SlideInRight } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

// ── ENHANCED DEMO DATA ──────────────────────────────────────────────────
const MOCK_MESSAGES = [
  { id: 'd1', type: 'date', text: 'TODAY' },
  { id: '1', text: 'Hey Marcus! How is the SuviX UI progress going?', sender: 'other', time: '10:00 AM', status: 'read' },
  { id: '2', text: 'It\'s coming along great. I just finished the new Chat Workspace Hub.', sender: 'me', time: '10:02 AM', status: 'read' },
  { id: '3', text: 'That sounds awesome. Can we review it in 5 minutes?', sender: 'other', time: '10:03 AM', status: 'read' },
  { id: '4', type: 'media', uri: 'https://images.unsplash.com/photo-1551650975-87deedd944c3?auto=format&fit=crop&q=80&w=400', sender: 'me', time: '10:04 AM', status: 'delivered' },
  { id: '5', text: 'Absolutely! I\'ll send you the link to the dev build.', sender: 'me', time: '10:05 AM', status: 'delivered' },
  { id: '6', text: 'Sarah is typing...', type: 'typing' },
];

const QUICK_REPLIES = ['On it! 🚀', 'Looks good!', 'Meeting now', 'Can\'t talk'];

export default function ProfessionalChatScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { theme, isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState(MOCK_MESSAGES);
  const flatListRef = useRef<FlatList>(null);

  const handleSend = () => {
    if (inputText.trim().length === 0) return;
    
    const newMessage = {
      id: Date.now().toString(),
      text: inputText.trim(),
      sender: 'me',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sending'
    };
    
    setMessages([...messages, newMessage]);
    setInputText('');
    
    // Simulate delivery
    setTimeout(() => {
      setMessages(prev => prev.map(m => m.id === newMessage.id ? { ...m, status: 'delivered' } : m));
    }, 2000);
  };

  const renderMessage = ({ item, index }: { item: any, index: number }) => {
    if (item.type === 'date') {
      return (
        <View style={styles.dateHeader}>
          <View style={[styles.dateLine, { backgroundColor: theme.border }]} />
          <Text style={[styles.dateText, { color: theme.textSecondary }]}>{item.text}</Text>
          <View style={[styles.dateLine, { backgroundColor: theme.border }]} />
        </View>
      );
    }

    if (item.type === 'typing') {
      return (
        <View style={styles.typingContainer}>
           <Text style={[styles.typingText, { color: theme.accent }]}>{item.text}</Text>
        </View>
      );
    }

    const isMe = item.sender === 'me';

    if (item.type === 'media') {
       return (
         <Animated.View entering={FadeInDown} style={[styles.messageWrapper, isMe ? styles.myMessageWrapper : styles.otherMessageWrapper]}>
            <TouchableOpacity activeOpacity={0.9} style={styles.mediaBubble}>
               <Image source={{ uri: item.uri }} style={styles.mediaContent} />
               <View style={styles.mediaTimeOverlay}>
                  <Text style={styles.mediaTimeText}>{item.time}</Text>
               </View>
            </TouchableOpacity>
         </Animated.View>
       );
    }

    return (
      <Animated.View 
        entering={FadeInDown.delay(index * 50)}
        style={[
          styles.messageWrapper, 
          isMe ? styles.myMessageWrapper : styles.otherMessageWrapper
        ]}
      >
        <View style={[
          styles.messageBubble, 
          isMe 
            ? [styles.myBubble, { backgroundColor: theme.accent }] 
            : [styles.otherBubble, { backgroundColor: theme.secondary }]
        ]}>
          <Text style={[
            styles.messageText, 
            { color: isMe ? (theme.accent === '#fff' || theme.accent === '#ffffff' ? '#000' : '#fff') : theme.text }
          ]}>
            {item.text}
          </Text>
          <View style={styles.messageFooter}>
            <Text style={[
              styles.messageTime, 
              { color: isMe ? 'rgba(255,255,255,0.7)' : theme.textSecondary }
            ]}>
              {item.time}
            </Text>
            {isMe && (
              <MaterialCommunityIcons 
                name={item.status === 'read' ? 'check-all' : 'check'} 
                size={12} 
                color={item.status === 'read' ? '#4CAF50' : 'rgba(255,255,255,0.7)'} 
                style={{ marginLeft: 4 }}
              />
            )}
          </View>
        </View>
      </Animated.View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* 🏙️ PROFESSIONAL HEADER */}
      <View style={[styles.header, { paddingTop: insets.top, borderBottomColor: theme.border }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={28} color={theme.text} />
          </TouchableOpacity>
          
          <View style={styles.userInfo}>
            <Image 
              source={{ uri: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100' }} 
              style={styles.headerAvatar} 
            />
            <View style={{ marginLeft: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={[styles.userName, { color: theme.text }]}>Sarah Wilson</Text>
                <MaterialCommunityIcons name="check-decagram" size={14} color="#FF3040" style={{ marginLeft: 4 }} />
              </View>
              <Text style={[styles.userStatus, { color: '#4CAF50' }]}>● Online</Text>
            </View>
          </View>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerAction}>
            <Feather name="video" size={20} color={theme.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerAction}>
            <Feather name="more-vertical" size={20} color={theme.text} />
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
        />

        {/* ⚡ QUICK REPLIES */}
        <View style={styles.quickReplyContainer}>
           <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 15 }}>
              {QUICK_REPLIES.map((reply, i) => (
                <TouchableOpacity 
                  key={i} 
                  onPress={() => { setInputText(reply); handleSend(); }}
                  style={[styles.quickReplyBtn, { backgroundColor: theme.secondary, borderColor: theme.border }]}
                >
                   <Text style={[styles.quickReplyText, { color: theme.text }]}>{reply}</Text>
                </TouchableOpacity>
              ))}
           </ScrollView>
        </View>

        {/* ⌨️ ENHANCED INPUT AREA */}
        <View style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          <View style={[styles.inputWrapper, { backgroundColor: theme.secondary, borderColor: theme.border }]}>
            <TouchableOpacity style={styles.attachBtn}>
               <Feather name="image" size={20} color={theme.textSecondary} />
            </TouchableOpacity>
            
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="Workspace message..."
              placeholderTextColor={theme.textSecondary}
              value={inputText}
              onChangeText={setInputText}
              multiline
            />
            
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingRight: 5 }}>
               <TouchableOpacity>
                  <Feather name="mic" size={18} color={theme.textSecondary} />
               </TouchableOpacity>
               <TouchableOpacity 
                onPress={handleSend}
                style={[
                  styles.sendBtn, 
                  { backgroundColor: inputText.trim() ? theme.accent : 'transparent' }
                ]}
                disabled={!inputText.trim()}
              >
                <MaterialCommunityIcons 
                  name="send" 
                  size={20} 
                  color={inputText.trim() ? 'white' : theme.textSecondary} 
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  backBtn: { padding: 5, marginRight: 5 },
  userInfo: { flexDirection: 'row', alignItems: 'center' },
  headerAvatar: { width: 38, height: 38, borderRadius: 12 },
  userName: { fontSize: 15, fontWeight: '800' },
  userStatus: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', marginTop: 1 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  headerAction: { padding: 5 },
  messageList: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 20 },
  dateHeader: { flexDirection: 'row', alignItems: 'center', marginVertical: 25, justifyContent: 'center' },
  dateLine: { height: 1, flex: 1, opacity: 0.1 },
  dateText: { fontSize: 10, fontWeight: '800', marginHorizontal: 15, letterSpacing: 1 },
  typingContainer: { paddingLeft: 5, marginBottom: 15 },
  typingText: { fontSize: 11, fontWeight: '600', fontStyle: 'italic' },
  messageWrapper: { marginBottom: 15, maxWidth: '85%' },
  myMessageWrapper: { alignSelf: 'flex-end' },
  otherMessageWrapper: { alignSelf: 'flex-start' },
  messageBubble: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 18 },
  myBubble: { borderBottomRightRadius: 4 },
  otherBubble: { borderBottomLeftRadius: 4 },
  messageText: { fontSize: 14, lineHeight: 20 },
  messageFooter: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-end', marginTop: 4 },
  messageTime: { fontSize: 9, fontWeight: '600' },
  mediaBubble: { width: width * 0.65, height: 200, borderRadius: 18, overflow: 'hidden' },
  mediaContent: { width: '100%', height: '100%' },
  mediaTimeOverlay: { position: 'absolute', bottom: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  mediaTimeText: { color: 'white', fontSize: 8, fontWeight: '700' },
  quickReplyContainer: { marginBottom: 10 },
  quickReplyBtn: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 15, borderWidth: 1, marginRight: 8 },
  quickReplyText: { fontSize: 12, fontWeight: '600' },
  inputContainer: { paddingHorizontal: 15, paddingTop: 5 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderRadius: 24, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6 },
  attachBtn: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center' },
  input: { flex: 1, fontSize: 14, paddingHorizontal: 10, maxHeight: 100, paddingVertical: 8 },
  sendBtn: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center' },
});
