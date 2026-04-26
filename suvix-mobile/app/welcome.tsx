import React, { useState, useRef, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  Image, 
  TouchableOpacity, 
  Dimensions, 
  StatusBar, 
  SafeAreaView, 
  useColorScheme, 
  Animated,
  Platform
} from 'react-native';
import PagerView from 'react-native-pager-view';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { LucideChevronRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Colors } from '../src/constants/Colors';
import SuvixButton from '../src/components/SuvixButton';

const { height, width } = Dimensions.get('window');

const ONBOARDING_DATA = [
  {
    title: "Scale Your\nContent",
    subtitle: "HIGH-FIDELITY VISUALS",
    description: "Join our elite network of professional video editors and blow up your brand with cinematic content.",
    image: require('../assets/images/onboarding/onboarding_1.jpg'),
  },
  {
    title: "Promote with\nPower",
    subtitle: "CREATIVE ADVERTISING",
    description: "Run high-impact social media ads and grow your reach with top-tier creators and promoters.",
    image: require('../assets/images/onboarding/onboarding_2.jpg'),
  },
  {
    title: "Premium Gear\n& Services",
    subtitle: "PROFESSIONAL RENTALS",
    description: "Rent top-tier professional equipment or provide specialized services to scale your creative business.",
    image: require('../assets/images/onboarding/onboarding_3.jpg'),
  },
  {
    title: "Join the\nEcosystem",
    subtitle: "ELITE CREATOR NETWORK",
    description: "Unlock the full potential of your talent. Choose your path and start your journey with SuviX today.",
    image: require('../assets/images/onboarding/onboarding_4.jpg'),
  }
];

const AnimatedPagerView = Animated.createAnimatedComponent(PagerView);

export default function WelcomeScreen() {
  const [activeSlide, setActiveSlide] = useState(0);
  const router = useRouter();
  const pagerRef = useRef<PagerView>(null);
  
  const scrollOffset = useRef(new Animated.Value(0)).current;
  const position = useRef(new Animated.Value(0)).current;
  
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const isDark = colorScheme === 'dark';

  // Staggered Animations for Text
  const titleFade = useRef(new Animated.Value(0)).current;
  const descFade = useRef(new Animated.Value(0)).current;
  const titleSlide = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    animateText();
  }, [activeSlide]);

  const animateText = () => {
    titleFade.setValue(0);
    descFade.setValue(0);
    titleSlide.setValue(20);
    
    Animated.stagger(150, [
      Animated.parallel([
        Animated.timing(titleFade, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.spring(titleSlide, { toValue: 0, tension: 20, friction: 7, useNativeDriver: true })
      ]),
      Animated.timing(descFade, { toValue: 1, duration: 600, useNativeDriver: true })
    ]).start();
  };

  const handleNext = () => {
    if (activeSlide < ONBOARDING_DATA.length - 1) {
      pagerRef.current?.setPage(activeSlide + 1);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const handleAction = (path: '/role-selection' | '/login') => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace(path);
  };

  const isLastSlide = activeSlide === ONBOARDING_DATA.length - 1;

  // ── Corrected Parallax Calculation ────────────────────────────────────────
  // We move the background container 1:1 with the pages, but each image is 
  // slightly offset within its slide to create the parallax feel.
  const containerTranslateX = Animated.add(scrollOffset, position).interpolate({
    inputRange: [0, ONBOARDING_DATA.length - 1],
    outputRange: [0, -width * (ONBOARDING_DATA.length - 1)],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      {/* 🌌 PARALLAX BACKGROUND ENGINE (FIXED) */}
      <Animated.View 
        style={[
          styles.backgroundContainer, 
          { transform: [{ translateX: containerTranslateX }] }
        ]}
      >
        {ONBOARDING_DATA.map((item, index) => {
          // Individual image parallax within its container
          const imageTranslateX = Animated.add(scrollOffset, position).interpolate({
            inputRange: [index - 1, index, index + 1],
            outputRange: [width * 0.2, 0, -width * 0.2],
            extrapolate: 'clamp',
          });

          return (
            <View key={index} style={styles.bgSlide}>
              <Animated.Image 
                source={item.image} 
                style={[
                  styles.bgImage,
                  { transform: [{ translateX: imageTranslateX }, { scale: 1.1 }] }
                ]} 
              />
              <LinearGradient
                colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.85)']}
                style={StyleSheet.absoluteFill}
              />
            </View>
          );
        })}
      </Animated.View>

      {/* 💎 BRAND IDENTITY */}
      <SafeAreaView style={styles.headerContainer}>
        <Animated.View style={{ opacity: titleFade }}>
          <Image 
            source={require('../assets/whitebglogo.png')} 
            style={[styles.logo, { tintColor: '#FFF' }]}
            resizeMode="contain"
          />
        </Animated.View>
      </SafeAreaView>

      <AnimatedPagerView
        ref={pagerRef}
        style={styles.pager}
        initialPage={0}
        onPageScroll={Animated.event(
          [{ nativeEvent: { offset: scrollOffset, position: position } }],
          { useNativeDriver: true }
        )}
        onPageSelected={(e) => {
          setActiveSlide(e.nativeEvent.position);
          Haptics.selectionAsync();
        }}
        scrollEnabled={true}
      >
        {ONBOARDING_DATA.map((_, index) => (
          <View key={index} style={styles.page} />
        ))}
      </AnimatedPagerView>

      {/* 🔮 ELITE COMMAND CENTER */}
      <View style={[styles.bottomSection, isLastSlide && styles.finalSectionHeight]}>
        <BlurView 
          intensity={Platform.OS === 'ios' ? 40 : 80} 
          tint="dark" 
          style={styles.glassContainer}
        >
          <LinearGradient
            colors={['rgba(255,255,255,0.05)', 'transparent']}
            style={StyleSheet.absoluteFill}
          />
          
          <View style={styles.contentWrapper}>
            <Animated.View style={{ opacity: titleFade, transform: [{ translateY: titleSlide }] }}>
              <Text style={styles.subtitle}>{ONBOARDING_DATA[activeSlide].subtitle}</Text>
              <Text style={styles.title}>{ONBOARDING_DATA[activeSlide].title}</Text>
            </Animated.View>

            <Animated.View style={{ opacity: descFade }}>
              <Text style={styles.description}>
                {ONBOARDING_DATA[activeSlide].description}
              </Text>
            </Animated.View>

            {/* FLUID INDICATOR */}
            {!isLastSlide && (
              <View style={styles.indicatorContainer}>
                {ONBOARDING_DATA.map((_, i) => (
                  <View 
                    key={i} 
                    style={[
                      styles.indicator, 
                      activeSlide === i ? styles.indicatorActive : { backgroundColor: 'rgba(255,255,255,0.2)' }
                    ]} 
                  />
                ))}
              </View>
            )}

            <View style={styles.footer}>
              {!isLastSlide ? (
                <>
                  <TouchableOpacity 
                    onPress={() => handleAction('/login')}
                    style={styles.skipBtn}
                  >
                    <Text style={styles.skipBtnText}>Sign In Instead</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    onPress={handleNext}
                    activeOpacity={0.8}
                    style={styles.nextBtn}
                  >
                    <LinearGradient
                      colors={['#FFF', '#F2F2F2']}
                      style={StyleSheet.absoluteFill}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    />
                    <Text style={styles.nextBtnText}>Continue</Text>
                    <LucideChevronRight size={18} color="#000" strokeWidth={3} />
                  </TouchableOpacity>
                </>
              ) : (
                <View style={styles.finalActions}>
                   <SuvixButton 
                    title="Get Started as New User" 
                    onPress={() => handleAction('/role-selection')}
                    variant="primary"
                    style={styles.primaryBtn}
                  />

                  <TouchableOpacity 
                    onPress={() => handleAction('/login')}
                    style={styles.loginOutline}
                  >
                    <Text style={styles.loginOutlineText}>Already a Member? Login</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </BlurView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  backgroundContainer: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    width: width * ONBOARDING_DATA.length,
  },
  bgSlide: {
    width: width,
    height: '100%',
    overflow: 'hidden',
  },
  bgImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingTop: Platform.OS === 'ios' ? 20 : 40, 
    paddingLeft: 24,
  },
  logo: {
    width: 140,
    height: 56,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  pager: {
    flex: 1,
    zIndex: 5,
  },
  page: {
    flex: 1,
  },
  bottomSection: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    zIndex: 20,
  },
  finalSectionHeight: {
    bottom: 40,
  },
  glassContainer: {
    borderRadius: 32,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    paddingTop: 28,
    paddingBottom: 28,
    paddingHorizontal: 24,
  },
  contentWrapper: {
    width: '100%',
  },
  subtitle: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 6,
    opacity: 0.7,
  },
  title: {
    color: '#FFF',
    fontSize: 32,
    fontWeight: '900',
    lineHeight: 36,
    letterSpacing: -1,
    marginBottom: 12,
  },
  description: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '500',
    marginBottom: 20,
  },
  indicatorContainer: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 28,
  },
  indicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  indicatorActive: {
    backgroundColor: '#FFF',
    width: 24,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skipBtn: {
    paddingVertical: 10,
  },
  skipBtnText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    fontWeight: '700',
  },
  nextBtn: {
    height: 52,
    paddingHorizontal: 24,
    borderRadius: 100,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    overflow: 'hidden',
    shadowColor: '#FFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  nextBtnText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '900',
  },
  finalActions: {
    width: '100%',
    gap: 12,
  },
  primaryBtn: {
    height: 58,
    borderRadius: 18,
  },
  loginOutline: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginOutlineText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
    opacity: 0.6,
  }
});
