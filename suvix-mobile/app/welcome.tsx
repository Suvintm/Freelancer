import React, { useState, useRef } from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity, Dimensions, StatusBar, SafeAreaView, useColorScheme } from 'react-native';
import PagerView from 'react-native-pager-view';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { LucideChevronRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Colors } from '../src/constants/Colors';
import SuvixButton from '../src/components/SuvixButton';

const { height } = Dimensions.get('window');

const ONBOARDING_DATA = [
  {
    title: "Scale Your\nContent",
    description: "Join our elite network of professional video editors and blow up your brand with high-fidelity visuals.",
    image: require('../assets/images/onboarding/onboarding_1.png'),
  },
  {
    title: "Promote with\nPower",
    description: "Run high-impact social media ads and grow your reach with top-tier creators and promoters.",
    image: require('../assets/images/onboarding/onboarding_2.png'),
  },
  {
    title: "Premium Gear\n& Services",
    description: "Rent top-tier professional equipment or provide specialized services to scale your creative business.",
    image: require('../assets/images/onboarding/onboarding_3.png'),
  },
  {
    title: "Join the\nEcosystem",
    description: "Unlock the full potential of your talent. Choose your path and start your journey with SuviX today.",
    image: require('../assets/images/onboarding/onboarding_4.png'),
  }
];

export default function WelcomeScreen() {
  const [activeSlide, setActiveSlide] = useState(0);
  const router = useRouter();
  const pagerRef = useRef<PagerView>(null);

  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const isDark = colorScheme === 'dark';

  const handleNext = () => {
    if (activeSlide < ONBOARDING_DATA.length - 1) {
      pagerRef.current?.setPage(activeSlide + 1);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleAction = (path: '/role-selection' | '/login') => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace(path);
  };

  const isLastSlide = activeSlide === ONBOARDING_DATA.length - 1;

  return (
    <View style={[styles.container, { backgroundColor: theme.primary }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} translucent backgroundColor="transparent" />
      
      {/* Background Images Layer */}
      <View style={StyleSheet.absoluteFill}>
        {ONBOARDING_DATA.map((item, index) => (
          <Image
            key={index}
            source={item.image}
            style={[
              styles.bgImage,
              { opacity: activeSlide === index ? 1 : 0 }
            ]}
          />
        ))}
      </View>

      {/* Brand Logo - Fixed at Top */}
      <SafeAreaView style={styles.headerContainer}>
        <Image 
          source={require('../assets/whitebglogo.png')} 
          style={[styles.logo, { tintColor: isDark ? undefined : '#000' }]}
          resizeMode="contain"
        />
      </SafeAreaView>

      {/* Dark Overlay for content readability */}
      <View style={styles.overlay} />

      <PagerView
        ref={pagerRef}
        style={styles.pager}
        initialPage={0}
        onPageSelected={(e) => setActiveSlide(e.nativeEvent.position)}
        scrollEnabled={!isLastSlide}
      >
        {ONBOARDING_DATA.map((item, index) => (
          <View key={index} style={styles.page} />
        ))}
      </PagerView>

      {/* Bottom Content Section - Modern Glassmorphism Styled */}
      <View style={[styles.bottomSection, isLastSlide && styles.finalSectionHeight]}>
        <LinearGradient
          colors={isDark ? ['transparent', 'rgba(0,0,0,0.8)', 'rgba(0,0,0,1)'] : ['transparent', 'rgba(248,250,252,0.8)', 'rgba(248,250,252,1)']}
          style={StyleSheet.absoluteFill}
        />
        
        <SafeAreaView style={styles.contentWrapper}>
          <View style={styles.cardHeader}>
            <Text style={[styles.title, { color: theme.text }]}>{ONBOARDING_DATA[activeSlide].title}</Text>
            
            {/* Extended Multi-segment Indicator */}
            {!isLastSlide && (
              <View style={styles.indicatorContainer}>
                {ONBOARDING_DATA.map((_, i) => (
                  <View 
                    key={i} 
                    style={[
                      styles.indicator, 
                      activeSlide === i ? [styles.indicatorActive, { backgroundColor: theme.accent }] : { backgroundColor: theme.border }
                    ]} 
                  />
                ))}
              </View>
            )}
          </View>

          <Text style={[styles.description, { color: theme.textSecondary }]}>
            {ONBOARDING_DATA[activeSlide].description}
          </Text>

          <View style={styles.footer}>
            {!isLastSlide ? (
              <>
                <TouchableOpacity 
                  onPress={() => handleAction('/login')}
                  activeOpacity={0.7}
                  style={styles.skipBtn}
                >
                  <Text style={[styles.skipBtnText, { color: theme.textSecondary }]}>I have an account</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  onPress={handleNext}
                  activeOpacity={0.9}
                  style={[styles.nextBtn, { backgroundColor: theme.accent }]}
                >
                  <Text style={[styles.nextBtnText, { color: isDark ? '#000' : '#FFF' }]}>Next</Text>
                  <View style={[styles.iconCircle, { backgroundColor: isDark ? '#F5F5F5' : '#1A1A1A' }]}>
                    <LucideChevronRight size={18} color={isDark ? "#000" : "#FFF"} strokeWidth={3} />
                  </View>
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.finalActions}>
                 <SuvixButton 
                  title="New User? Get Started" 
                  onPress={() => handleAction('/role-selection')}
                  variant="primary"
                  style={{ marginBottom: 12 }}
                />

                <SuvixButton 
                  title="Already have an account? Login" 
                  onPress={() => handleAction('/login')}
                  variant="outline"
                />
              </View>
            )}
          </View>
        </SafeAreaView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    alignItems: 'flex-start',
    paddingTop: 30, 
    paddingLeft: 24,
  },
  logo: {
    width: 120,
    height: 50,
  },
  bgImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    resizeMode: 'cover',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)', 
  },
  pager: {
    flex: 1,
  },
  page: {
    flex: 1,
  },
  bottomSection: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: height * 0.42,
    justifyContent: 'flex-end',
  },
  finalSectionHeight: {
    height: height * 0.52, // Slightly more space for dual buttons
  },
  contentWrapper: {
    paddingHorizontal: 32,
    paddingBottom: 40,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  title: {
    color: '#FFF',
    fontSize: 38,
    fontWeight: '900',
    lineHeight: 44,
    letterSpacing: -1,
  },
  indicatorContainer: {
    flexDirection: 'row',
    marginTop: 14,
  },
  indicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.25)',
    marginLeft: 6,
  },
  indicatorActive: {
    backgroundColor: '#FFF',
    width: 28,
  },
  description: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
    marginBottom: 32,
    maxWidth: '90%',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  skipBtn: {
    paddingVertical: 14,
  },
  skipBtnText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 15,
    fontWeight: '500',
  },
  nextBtn: {
    backgroundColor: '#FFF',
    paddingLeft: 24,
    paddingRight: 6,
    paddingVertical: 6,
    borderRadius: 100,
    flexDirection: 'row',
    alignItems: 'center',
  },
  nextBtnText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '800',
    marginRight: 10,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  finalActions: {
    width: '100%',
  },
  whiteBtn: {
    backgroundColor: '#FFF',
    width: '100%',
    paddingVertical: 18,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FFF',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  btnIconLayout: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  whiteBtnText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '800',
    marginLeft: 12,
  }
});
