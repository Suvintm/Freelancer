import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Platform, 
  Dimensions,
  Animated,
  StatusBar
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useTheme } from '../src/context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Colors } from '../src/constants/Colors';

const { width, height } = Dimensions.get('window');

export default function NotificationsPage() {
  const { isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  
  const [selectedNotif, setSelectedNotif] = useState<any>(null);
  const [showDetail, setShowDetail] = useState(false);
  
  // ── Animation Values ──────────────────────────────────────────────────────
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const detailSheetY = useRef(new Animated.Value(height)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 20, friction: 8, useNativeDriver: true })
    ]).start();
  }, []);

  const openDetail = (notif: any) => {
    setSelectedNotif(notif);
    setShowDetail(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.spring(detailSheetY, {
      toValue: 0,
      tension: 40,
      friction: 10,
      useNativeDriver: true
    }).start();
  };

  const closeDetail = () => {
    Animated.timing(detailSheetY, {
      toValue: height,
      duration: 300,
      useNativeDriver: true
    }).start(() => setShowDetail(false));
  };

  const palette = isDarkMode ? Colors.dark : Colors.light;
  const bg = isDarkMode ? '#050505' : '#F8FAFC';
  const cardBg = isDarkMode ? '#111111' : '#FFFFFF';
  const border = isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';

  const NOTIFICATIONS = [
    { 
        id: '1', 
        title: 'Elite Project Invitation', 
        desc: 'You have been invited to a high-priority editing project by "SuviX Production". 🎬', 
        time: '2m ago', 
        icon: 'briefcase-outline', 
        color: '#8B5CF6', 
        isNew: true,
        category: 'WORK'
    },
    { 
        id: '2', 
        title: 'Capital Withdrawal Success', 
        desc: 'Successfully transferred $1,240.00 to your linked primary bank account. 💸', 
        time: '1h ago', 
        icon: 'wallet-outline', 
        color: '#10B981', 
        isNew: false,
        category: 'PAYMENT'
    },
    { 
        id: '3', 
        title: 'Market Performance', 
        desc: 'Your profile saw a 20% surge in visibility this week. You are trending in your niche! 📈', 
        time: '5h ago', 
        icon: 'stats-chart-outline', 
        color: '#3B82F6', 
        isNew: false,
        category: 'GROWTH'
    },
    { 
        id: '4', 
        title: 'Workspace Update v2.4', 
        desc: 'New HLS optimization is live. Your story uploads will now process 40% faster. 🚀', 
        time: 'Yesterday', 
        icon: 'rocket-outline', 
        color: '#F59E0B', 
        isNew: false,
        category: 'SYSTEM'
    },
  ];

  return (
    <View style={[s.container, { backgroundColor: bg }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* 🔮 STICKY GLASS HEADER */}
      <BlurView intensity={isDarkMode ? 80 : 100} tint={isDarkMode ? 'dark' : 'light'} style={[s.header, { paddingTop: insets.top }]}>
        <View style={s.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={[s.headerBtn, { backgroundColor: palette.secondary }]}>
            <Ionicons name="chevron-back" size={20} color={palette.text} />
          </TouchableOpacity>
          <Text style={[s.headerTitle, { color: palette.text }]}>Activity Stream</Text>
          <TouchableOpacity style={[s.headerBtn, { backgroundColor: palette.secondary }]}>
            <Feather name="check-circle" size={18} color={palette.text} />
          </TouchableOpacity>
        </View>
      </BlurView>

      <ScrollView 
        style={s.scroll} 
        contentContainerStyle={[s.scrollContainer, { paddingTop: insets.top + 80 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <Text style={s.sectionLabel}>LATEST UPDATES</Text>
          
          {NOTIFICATIONS.map((item, index) => (
            <NotificationCard 
                key={item.id} 
                item={item} 
                index={index}
                onPress={() => openDetail(item)}
                palette={palette}
                cardBg={cardBg}
                border={border}
            />
          ))}
          
          <View style={s.footer}>
             <View style={[s.footerDot, { backgroundColor: palette.textSecondary }]} />
             <Text style={[s.footerTxt, { color: palette.textSecondary }]}>Stream sync complete</Text>
          </View>
        </Animated.View>
      </ScrollView>

      {/* 💎 ELITE DETAIL SHEET */}
      {showDetail && (
        <View style={StyleSheet.absoluteFill}>
          <TouchableOpacity 
            style={s.detailBackdrop} 
            activeOpacity={1} 
            onPress={closeDetail} 
          >
            <Animated.View style={[s.backdropTint, { 
                opacity: detailSheetY.interpolate({ inputRange: [0, height], outputRange: [1, 0] }) 
            }]} />
          </TouchableOpacity>

          <Animated.View style={[s.detailSheet, { transform: [{ translateY: detailSheetY }] }]}>
            <BlurView intensity={isDarkMode ? 60 : 90} tint={isDarkMode ? 'dark' : 'light'} style={s.sheetContent}>
              <View style={[s.sheetHandle, { backgroundColor: palette.textSecondary }]} />
              
              <View style={s.sheetHeader}>
                <View style={[s.detailIconBox, { backgroundColor: `${selectedNotif.color}20` }]}>
                    <Ionicons name={selectedNotif.icon} size={32} color={selectedNotif.color} />
                </View>
                <Text style={[s.detailCategory, { color: selectedNotif.color }]}>{selectedNotif.category}</Text>
                <Text style={[s.detailTitle, { color: palette.text }]}>{selectedNotif.title}</Text>
                <Text style={[s.detailTime, { color: palette.textSecondary }]}>{selectedNotif.time}</Text>
              </View>

              <View style={s.detailBody}>
                <Text style={[s.detailDesc, { color: palette.text }]}>{selectedNotif.desc}</Text>
              </View>

              <View style={s.sheetActions}>
                <TouchableOpacity 
                    style={[s.primaryAction, { backgroundColor: selectedNotif.color }]}
                    onPress={closeDetail}
                >
                    <Text style={s.primaryActionText}>Take Action</Text>
                    <Ionicons name="arrow-forward" size={18} color="#FFF" />
                </TouchableOpacity>
                <TouchableOpacity style={[s.secondaryAction, { borderColor: border }]} onPress={closeDetail}>
                    <Text style={[s.secondaryActionText, { color: palette.text }]}>Dismiss Notification</Text>
                </TouchableOpacity>
              </View>
            </BlurView>
          </Animated.View>
        </View>
      )}
    </View>
  );
}

const NotificationCard = ({ item, index, onPress, palette, cardBg, border }: any) => {
    const fade = useRef(new Animated.Value(0)).current;
    const slide = useRef(new Animated.Value(20)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fade, { toValue: 1, duration: 400, delay: index * 50, useNativeDriver: true }),
            Animated.spring(slide, { toValue: 0, tension: 20, friction: 8, delay: index * 50, useNativeDriver: true })
        ]).start();
    }, []);

    return (
        <Animated.View style={{ opacity: fade, transform: [{ translateY: slide }] }}>
            <TouchableOpacity 
                style={[s.item, { backgroundColor: cardBg, borderColor: border }]}
                activeOpacity={0.8}
                onPress={onPress}
            >
                {item.isNew && <View style={[s.unreadGlow, { backgroundColor: item.color }]} />}
                <View style={[s.iconBox, { backgroundColor: `${item.color}15` }]}>
                    <Ionicons name={item.icon} size={22} color={item.color} />
                </View>
                
                <View style={s.content}>
                    <View style={s.row}>
                        <Text style={[s.title, { color: palette.text }]} numberOfLines={1}>{item.title}</Text>
                        <Text style={[s.time, { color: palette.textSecondary }]}>{item.time}</Text>
                    </View>
                    <Text style={[s.desc, { color: palette.textSecondary }]} numberOfLines={2}>{item.desc}</Text>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
};

const s = StyleSheet.create({
  container: { flex: 1 },
  header: {
    position: 'absolute',
    top: 0,
    width: '100%',
    zIndex: 100,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150,150,150,0.1)',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    height: 60,
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { 
    fontSize: 16, 
    fontWeight: '900', 
    letterSpacing: -0.5 
  },
  
  scroll: { flex: 1 },
  scrollContainer: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginLeft: 12,
    marginBottom: 16,
    opacity: 0.5,
    color: '#808080'
  },
  item: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  unreadGlow: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    opacity: 0.6,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  content: { flex: 1 },
  row: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    marginBottom: 4 
  },
  title: { fontSize: 14, fontWeight: '800' },
  desc: { fontSize: 12, lineHeight: 18, opacity: 0.8 },
  time: { fontSize: 10, fontWeight: '700', opacity: 0.5 },
  
  footer: { 
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
    opacity: 0.4,
  },
  footerDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  footerTxt: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },

  // Detail Sheet
  detailBackdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  backdropTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  detailSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1001,
  },
  sheetContent: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 12,
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 50 : 30,
    overflow: 'hidden',
  },
  sheetHandle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 30,
    opacity: 0.2,
  },
  sheetHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  detailIconBox: {
    width: 72,
    height: 72,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailCategory: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  detailTitle: {
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  detailTime: {
    fontSize: 12,
    fontWeight: '700',
    opacity: 0.4,
    marginTop: 4,
  },
  detailBody: {
    marginBottom: 32,
  },
  detailDesc: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    opacity: 0.9,
    fontWeight: '500',
  },
  sheetActions: {
    gap: 12,
  },
  primaryAction: {
    height: 56,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  primaryActionText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
  secondaryAction: {
    height: 56,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryActionText: {
    fontSize: 15,
    fontWeight: '700',
  }
});
